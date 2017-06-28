import {OAuth2Client} from "./OAuth2Client";
/**
 * Created by Ryan on 27/06/2017.
 */
export class OAuth2AccessToken{
    /**
     * A unique identifier for the access token.
     */
    private _id:number|null;
    /**
     * The actual access token to use. This can be any specified by the implementation but this should be unique.
     */
    private _code:string;
    /**
     * The date and time at which the token is set to expire. This should be formatted as a unix timestamp.
     */
    private _expires:number;

    /**
     * This is the raw string of scopes that should be saved. This can be formatted in any way that you wish but you
     * must be able to split the scope in the future in order to populate [[scopes]]. This will be used to compare with
     * the requested resource.
     */
    private _raw_scopes:string;
    /**
     * This is a formatted version of [[raw_scopes]] which has been split into its individual scopes. This will be used
     * for comparisons against scopes so this must be populated by the implementation or all scope related interactions
     * will either be buggy or fail altogether.
     */
    private _scopes:string[];

    /**
     * This references the [[OAuth2Client._id]] that this access  token is bound to.
     */
    private _client_id:number;
    /**
     * This is the actual client represented by the [[_client_id]].
     */
    private _client:OAuth2Client;

    /**
     * This references the user that requested the access token originally. This is an implementation specific id for
     * the user. This should allow a client to reference their own internal user structures instead of string to mould
     * theirs around this implementation. Implementation of this will vary depending on how you are addressing the users
     * and storing them. This is designed to be used with a database implementation but if your implementation varies
     * then you can handle this however you want.
     *
     * @optional
     */
    private _user_id:number;
    /**
     * This is the implementation specific version of the user.
     */
    private _user:any;

    /**
     *
     * @param id A unique identifier for the access token.
     * @param code The actual access token to use. This can be any specified by the implementation but this should be unique.
     * @param expires The date and time at which the token is set to expire. This should be formatted as a unix timestamp.
     * @param raw_scopes This is the raw string of scopes that should be saved. This can be formatted in any way that you wish but you
     * must be able to split the scope in the future in order to populate [[scopes]]. This will be used to compare with
     * the requested resource.
     * @param scopes This is a formatted version of [[raw_scopes]] which has been split into its individual scopes. This will be used
     * for comparisons against scopes so this must be populated by the implementation or all scope related interactions
     * will either be buggy or fail altogether.
     * @param client_id This references the [[OAuth2Client._id]] that this access  token is bound to.
     * @param client This is the actual client represented by the [[_client_id]].
     * @param user_id This references the user that requested the access token originally. This is an implementation specific id for
     * the user. This should allow a client to reference their own internal user structures instead of string to mould
     * theirs around this implementation. Implementation of this will vary depending on how you are addressing the users
     * and storing them. This is designed to be used with a database implementation but if your implementation varies
     * then you can handle this however you want.
     * @param user This is the implementation specific version of the user.
     */
    constructor(id: number|null=null, code: string, expires: number, raw_scopes: string, scopes: string[], client_id: number, client: OAuth2Client, user_id: number, user: any) {
        this._id = id;
        this._code = code;
        this._expires = expires;
        this._raw_scopes = raw_scopes;
        this._scopes = scopes;
        this._client_id = client_id;
        this._client = client;
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

    get expires(): number {
        return this._expires;
    }

    set expires(value: number) {
        this._expires = value;
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