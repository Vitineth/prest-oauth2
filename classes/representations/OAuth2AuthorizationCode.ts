import {OAuth2Client} from "./OAuth2Client";
/**
 * Created by Ryan on 27/06/2017.
 */

/**
 * Representation of the details for an authorization code within the OAuth2 grant flow.
 */
export class OAuth2AuthorizationCode {
    /**
     * A unique identifier for the authorization code.
     */
    private _id: number|null;
    /**
     * The actual authorization code to use. This can be any specified by the implementation but this should be unique.
     */
    private _code: string;

    /**
     * The identifier for a [[OAuth2Client]]. Note that this is <strong>NOT</strong> the clients actual identifier that
     * is used within requests. This should reference [[OAuth2Client._id]], NOT [[OAuth2Client._client_id]]. This should
     * be used (depending on the implementation) to populate [[client]].
     *
     * @optional
     */
    private _client_id: number;
    /**
     * The client that this authorization code is valid for. This should reference the code for the application which
     * the user is trying to grant access to their account.
     */
    private _client: OAuth2Client;

    /**
     * This is the URI to redirect the user to when they authorize the request. This is optional if, and only if, the
     * redirect uri of the [[client]] is defined. If it is not defined then this must be defined or an error will be
     * thrown during execution.
     *
     * @conditionally_optional
     */
    private _redirect_uri: string|null;

    /**
     * This is the raw string of scopes that should be saved. This can be formatted in any way that you wish but you
     * must be able to split the scope in the future in order to populate [[scopes]]. This can be set to null if the
     * scopes are exactly the same as the [[client._raw_scopes]] but this is designed to allow users to pick specific
     * scopes out of those that the client requests.
     */
    private _raw_scopes: string;
    /**
     * This is a formatted version of [[raw_scopes]] which has been split into its individual scopes. This will be used
     * for comparisons against scopes so this must be populated by the implementation or all scope related interactions
     * will either be buggy or fail altogether.
     */
    private _scopes: string[];

    /**
     * This references the user that is trying to authorize against a client. This is an implementation specific id for
     * the user. This should allow a client to reference their own internal user structures instead of string to mould
     * theirs around this implementation. Implementation of this will vary depending on how you are addressing the users
     * and storing them. This is designed to be used with a database implementation but if your implementation varies
     * then you can handle this however you want.
     *
     * @optional
     */
    private _user_id: number;
    /**
     * This is the implementation specific version of the user.
     */
    private _user: any;

    /**
     *
     * @param id A unique identifier for the authorization code.
     * @param code The actual authorization code to use. This can be any specified by the implementation but this should
     * be unique.
     * @param client_id The identifier for a [[OAuth2Client]]. Note that this is <strong>NOT</strong> the clients actual
     * identifier that is used within requests. This should reference [[OAuth2Client._id]], NOT
     * [[OAuth2Client._client_id]]. This should be used (depending on the implementation) to populate [[client]].
     * @param client The client that this authorization code is valid for. This should reference the code for the
     * application which the user is trying to grant access to their account.
     * @param redirect_uri This is the URI to redirect the user to when they authorize the request. This is optional
     * if, and only if, the redirect uri of the [[client]] is defined. If it is not defined then this must be defined
     * or an error will be thrown during execution.
     * @param raw_scopes This is the raw string of scopes that should be saved. This can be formatted in any way that
     * you wish but you must be able to split the scope in the future in order to populate [[scopes]]. This can be set
     * to null if the scopes are exactly the same as the [[client._raw_scopes]] but this is designed to allow users to
     * pick specific scopes out of those that the client requests.
     * @param scopes This is a formatted version of [[raw_scopes]] which has been split into its individual scopes.
     * This will be used for comparisons against scopes so this must be populated by the implementation or all scope
     * related interactions will either be buggy or fail altogether.
     * @param user_id This references the user that is trying to authorize against a client. This is an implementation
     * specific id for the user. This should allow a client to reference their own internal user structures instead of
     * string to mould theirs around this implementation. Implementation of this will vary depending on how you are addressing the users and storing them. This is designed to be used with a database implementation but if your implementation varies then you can handle this however you want.
     * @param user This is the implementation specific version of the user.
     */
    constructor(id: number|null=null, code: string, client_id: number, client: OAuth2Client, redirect_uri: string|null, raw_scopes: string, scopes: string[], user_id: number, user: any) {
        this._id = id;
        this._code = code;
        this._client_id = client_id;
        this._client = client;
        this._redirect_uri = redirect_uri;
        this._raw_scopes = raw_scopes;
        this._scopes = scopes;
        this._user_id = user_id;
        this._user = user;
    }

    get id(): number|null {
        return this._id;
    }

    set id(value: number|null) {
        this._id = value;
    }

    get code(): string {
        return this._code;
    }

    set code(value: string) {
        this._code = value;
    }

    get client_id(): number {
        return this._client_id;
    }

    set client_id(value: number) {
        this._client_id = value;
    }

    get client(): OAuth2Client {
        return this._client;
    }

    set client(value: OAuth2Client) {
        this._client = value;
    }

    get redirect_uri(): string|null {
        return this._redirect_uri;
    }

    set redirect_uri(value: string|null) {
        this._redirect_uri = value;
    }

    get raw_scopes(): string {
        return this._raw_scopes;
    }

    set raw_scopes(value: string) {
        this._raw_scopes = value;
    }

    get scopes(): string[] {
        return this._scopes;
    }

    set scopes(value: string[]) {
        this._scopes = value;
    }

    get user_id(): number {
        return this._user_id;
    }

    set user_id(value: number) {
        this._user_id = value;
    }

    get user(): any {
        return this._user;
    }

    set user(value: any) {
        this._user = value;
    }
}