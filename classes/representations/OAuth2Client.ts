/**
 * Created by Ryan on 27/06/2017.
 */
/**
 * Representation of the details for an client within the OAuth2 grant flow.
 */
export class OAuth2Client {
    /**
     * This is a unique identifier for the client <strong>within storage</strong>. Please note that this is
     * <strong>NOT</strong> the same as the <code>client_id</code>. This will be used as the foreign key for all
     * requests to clients rather than the real identifier for the client.
     */
    private _id: number|null;
    /**
     * THe user specified name for the client. This will be supplied by the user when the construct the client to begin
     * with (when it is registered). This does not technically have to be unique within a setup but it is often
     * recommended in order to prevent apps from spoofing from each other. This is left to the digression of the
     * implementor.
     */
    private _name: string;

    /**
     * This is the unique ID for the client. This <strong>must</strong> be unique within all implementations.
     */
    private _client_id: string;
    /**
     * This is the secret key associated with this client when the client is registered. This does not need to be unique
     * technically as it is associated with a unique client ID but it is often recommended just to prevent overlap
     * or accidental authorization.
     */
    private _client_secret: string;

    /**
     * This is the address to which the server will redirect the client when they finish authorizing with this client.
     * This does not need to be specified but if it is not defined here then it MUST be sent with the requests for
     * authorization by the client or an error will be thrown during execution.
     *
     * @optional
     */
    private _redirect_uri: string;

    /**
     * This is the raw string of scopes that should be saved. This can be formatted in any way that you wish but you
     * must be able to split the scope in the future in order to populate [[scopes]].
     */
    private _raw_scopes: string;
    /**
     * This is a formatted version of [[raw_scopes]] which has been split into its individual scopes. This will be used
     * for comparisons against scopes so this must be populated by the implementation or all scope related interactions
     * will either be buggy or fail altogether.
     */
    private _scopes: string[];

    /**
     * This references the user that has registered the client. This is an implementation specific id for the user. This
     * should allow a client to reference their own internal user structures instead of string to mould theirs around
     * this implementation. Implementation of this will vary depending on how you are addressing the users and storing
     * them. This is designed to be used with a database implementation but if your implementation varies then you
     * can handle this however you want.
     *
     * @optional
     */
    private _user_id: number;
    /**
     * This is the implementation specific version of the user.
     */
    private _user: any;

    /**
     * Constructs a client instance.
     * @param id This is a unique identifier for the client <strong>within storage</strong>. Please note that this is
     * <strong>NOT</strong> the same as the <code>client_id</code>. This will be used as the foreign key for all
     * requests to clients rather than the real identifier for the client.
     * @param name The user specified name for the client. This will be supplied by the user when the construct the
     * client to begin with (when it is registered). This does not technically have to be unique within a setup but it
     * is often recommended in order to prevent apps from spoofing from each other. This is left to the digression of
     * the implementor.
     * @param client_id This is the unique ID for the client. This <strong>must</strong> be unique within all
     * implementations.
     * @param client_secret This is the secret key associated with this client when the client is registered. This does
     * not need to be unique technically as it is associated with a unique client ID but it is often recommended just
     * to prevent overlap or accidental authorization.
     * @param redirect_uri This is the address to which the server will redirect the client when they finish authorizing
     * with this client. This does not need to be specified but if it is not defined here then it MUST be sent with the
     * requests for authorization by the client or an error will be thrown during execution.
     * @param raw_scopes This is the raw string of scopes that should be saved. This can be formatted in any way that
     * you wish but you must be able to split the scope in the future in order to populate [[scopes]].
     * @param scopes This is a formatted version of [[raw_scopes]] which has been split into its individual scopes.
     * This will be used for comparisons against scopes so this must be populated by the implementation or all scope
     * related interactions will either be buggy or fail altogether.
     * @param user_id This references the user that has registered the client. This is an implementation specific id for
     * the user. This should allow a client to reference their own internal user structures instead of string to mould
     * theirs around this implementation. Implementation of this will vary depending on how you are addressing the users
     * and storing them. This is designed to be used with a database implementation but if your implementation varies
     * then you can handle this however you want.
     * @param user This is the implementation specific version of the user.
     */
    constructor(id: number|null=null, name: string, client_id: string, client_secret: string, redirect_uri: string,
                raw_scopes: string, scopes: string[], user_id: number, user: any) {
        this._id = id;
        this._name = name;
        this._client_id = client_id;
        this._client_secret = client_secret;
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

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get client_id(): string {
        return this._client_id;
    }

    set client_id(value: string) {
        this._client_id = value;
    }

    get client_secret(): string {
        return this._client_secret;
    }

    set client_secret(value: string) {
        this._client_secret = value;
    }

    get redirect_uri(): string {
        return this._redirect_uri;
    }

    set redirect_uri(value: string) {
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