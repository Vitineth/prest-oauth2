import {OAuth2Controller} from "./classes/OAuth2Controller";
import {OAuth2AuthorizationCode} from "./classes/representations/OAuth2AuthorizationCode";
import {OAuth2Client} from "./classes/representations/OAuth2Client";
import {OAuth2AccessToken} from "./classes/representations/OAuth2AccessToken";
import {OAuth2RefreshToken} from "./classes/representations/OAuth2RefreshToken";
import moment = require("moment");
/**
 * Created by Ryan on 27/06/2017.
 */

export class OAuth2Handler {
    private _controller: OAuth2Controller;

    constructor(controller: OAuth2Controller) {
        this._controller = controller;
    }

    get controller(): OAuth2Controller {
        return this._controller;
    }

    set controller(value: OAuth2Controller) {
        this._controller = value;
    }

    authorize(response_type: string, client_id: string, scope: string, user_id: number, redirect_uri: string | null = null): Promise<OAuth2AuthorizationCode> {
        return new Promise((resolve, reject) => {
            if (response_type.toLowerCase() !== "code") throw new Error("Unsupported response type");

            let client = this._controller.fetchClient(client_id);
            client.then((client) => {
                if (client === false) throw new Error("Client could not be found");
                let c = <OAuth2Client> client;

                let user = this._controller.fetchUser(user_id);
                user.then((user) => {
                    if (user === false) throw new Error("Client could not be found");

                    let code = new OAuth2AuthorizationCode(null, this._controller.generateRawAuthorizationCode(), c.id == null ? -1 : c.id, c, redirect_uri, scope, this._controller.formatScope(scope), user_id, user);
                    this._controller.saveAuthorizationCode(code);

                    resolve(code);
                }).catch(reject);
            }).catch(reject);
        });
    }

    token(grant_type: string, client_id: string, client_secret: string, code: string, scopes: string | null = null, redirect_uri: string | null = null): Promise<any> {
        return new Promise((resolve, reject) => {
            if (grant_type.toLowerCase() !== "authorization_code") throw new Error("Unsupported grant type");

            let client = this._controller.fetchClient(client_id);
            client.then((client) => {
                if (client === false) throw new Error("Client could not be found");
                let c = <OAuth2Client> client;
                let authcode = this._controller.fetchAuthorizationCode(code);
                authcode.then((authcode) => {
                    if (authcode === false) throw new Error("Authorization code could not be found");
                    let a = <OAuth2AuthorizationCode> authcode;

                    if (client_secret !== c.client_secret) throw new Error("Auth code client secret does not match the supplied client secret");
                    if (a.client.client_id !== c.client_id) throw new Error("Auth code does not match the client");
                    if (a.user_id !== c.user_id) throw new Error("Auth code user does not match the clients user.");

                    if (scopes === null) scopes = c.raw_scopes;

                    let token = new OAuth2AccessToken(null, this._controller.generateRawAccessToken(), this._controller.calculateAccessExpiry(), scopes, this._controller.formatScope(scopes), c.id === null ? -1 : c.id, c, a.user.id, a.user);
                    let refresh = new OAuth2RefreshToken(null, this._controller.generateRawRefreshToken(), this._controller.calculateRefreshExpiry(), scopes, this._controller.formatScope(scopes), c.id === null ? -1 : c.id, c, a.user.id, a.user);

                    this._controller.saveAccessToken(token);
                    this._controller.saveRefreshToken(refresh);

                    resolve({
                        "access": token,
                        "refresh": refresh
                    });
                }).catch(reject);
            }).catch(reject);
        });
    }

    authenticate(token: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let accessToken = this._controller.fetchAccessToken(token);
            accessToken.then((accessToken) => {
                if (accessToken === false) return false;
                let a = <OAuth2AccessToken> accessToken;

                resolve(moment.unix(a.expires) >= moment());
            }).catch(reject);
        });
    }

}