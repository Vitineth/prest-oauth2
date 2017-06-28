import {OAuth2Controller} from "./OAuth2Controller";
import {OAuth2AuthorizationCode} from "./representations/OAuth2AuthorizationCode";
import {OAuth2RefreshToken} from "./representations/OAuth2RefreshToken";
import {OAuth2AccessToken} from "./representations/OAuth2AccessToken";
import {OAuth2Client} from "./representations/OAuth2Client";
import {Pool, QueryResult} from "pg";
/**
 * Created by Ryan on 27/06/2017.
 */

/**
 * A basic partial implementation of the controller using PostgreSQL as the storage medium for the oauth2 details. This
 * does not handle the user details, the expiry times or the generation of the codes. It does implement the formatting
 * of the scopes but this can be overwritten if you believe that it should be done differently.
 */
export abstract class PostgreSQLController implements OAuth2Controller {

    /**
     * The active connection to the PostgreSQL database that will be used for saving, accessing and revoking tokens.
     */
    private _pool: Pool;

    /**
     * Construct the controller using an active database connection. This will not verify the tables or columns, this
     * must be run using [[verifyTables]] instead. This must be done before using the controller or there could be a
     * large amount of data.
     * @param pool  The active connection to the PostgreSQL database that will be used for saving, accessing and
     * revoking tokens.
     */
    constructor(pool: Pool) {
        this._pool = pool;
    }

    /**
     * Verify the tables of the database including which tables exist and whether those tables have the correct fields
     * and data types. This will either return true if the database is suitable to use or an error if it is not.
     */
    verifyTables() {
        return new Promise((resolve, reject) => {
            let sql = `
            SELECT
              column_name,
              data_type,
              table_name
            FROM
              INFORMATION_SCHEMA.COLUMNS
            WHERE
              table_name IN (
                SELECT table_name
                FROM
                  information_schema.tables
                WHERE
                  table_schema = 'public' AND
                  table_name LIKE 'oauth_%');`;
            this._pool.query(sql, []).then((result: QueryResult) => {
                if (result.rowCount === 0) reject(new Error("No OAuth2 Tables were found"));

                let tables: { [index: string]: { [index: string]: string } } = {};
                for (let i = 0; i < result.rowCount; i++) {
                    let data = result.rows[i];
                    if (tables.hasOwnProperty(data["table_name"])) {
                        tables[data["table_name"]][data["column_name"]] = data["data_type"];
                    } else {
                        tables[data["table_name"]] = {};
                        tables[data["table_name"]][data["column_name"]] = data["data_type"];
                    }
                }

                let requiredTables: { [index: string]: { [index: string]: string } } = {
                    "oauth_access_token": {
                        "id_access_token": "integer",
                        "code": "text|character varying",
                        "expires": "bigint|integer",
                        "scopes": "text|character varying",
                        "client_id": "integer",
                        "user_id": "integer"
                    },
                    "oauth_authorization_code": {
                        "id_authorization_code": "integer",
                        "code": "text|character varying",
                        "client_id": "integer",
                        "redirect_uri": "text|character varying",
                        "scopes": "text|character varying",
                        "user_id": "integer"
                    },
                    "oauth_client": {
                        "id_client": "integer",
                        "name": "text|character varying",
                        "identifier": "text|character varying",
                        "secret": "text|character varying",
                        "redirect_uri": "text|character varying",
                        "scopes": "text|character varying",
                        "user_id": "integer"
                    },
                    "oauth_refresh_token": {
                        "id_refresh_token": "integer",
                        "code": "text|character varying",
                        "expires": "integer|bigint",
                        "scopes": "text|character varying",
                        "client_id": "integer",
                        "user_id": "integer"
                    }
                };

                for (let key in requiredTables) {
                    if (!tables.hasOwnProperty(key)) reject(new Error(`Missing table '${key}'.`));

                    for (let column in requiredTables[key]) {
                        if (!tables[key].hasOwnProperty(column)) reject(new Error(`Table '${key}' is missing column '${column}'.`));
                        let availableTypes = requiredTables[key][column].split("|");
                        if (availableTypes.indexOf(tables[key][column]) === -1) reject(new Error(`Table '${key}' has the wrong type on column '${column}'. It has '${tables[key][column]}' however we were expecting '${requiredTables[key][column]}'.`));
                    }
                }

                resolve();
            }).catch(reject);
        })
    }

    /**
     * Utility function to create the tables required. This will resolve a promise when the query finishes executing but
     * it does not verify if the tables were actually created correctly. This should be verified if you are using this
     * function. This is more for the example SQL to generate the tables as stored in misc/tables.sql.
     */
    createTables() {
        return new Promise((resolve, reject) => {
            this._pool.query(`CREATE TABLE public.oauth_client
            (
                id_client SERIAL PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                identifier TEXT NOT NULL,
                secret TEXT NOT NULL,
                redirect_uri TEXT,
                scopes TEXT,
                user_id INT NOT NULL
            );
            CREATE UNIQUE INDEX oauth_client_id_client_uindex ON public.oauth_client (id_client);
            CREATE INDEX oauth_client_identifier_index ON public.oauth_client (identifier);
            
            CREATE TABLE public.oauth_authorization_code
            (
                id_authorization_code SERIAL PRIMARY KEY NOT NULL,
                code TEXT NOT NULL,
                client_id INT NOT NULL,
                redirect_uri TEXT,
                scopes TEXT,
                user_id INT NOT NULL,
                CONSTRAINT oauth_authorization_code_oauth_client_id_client_fk FOREIGN KEY (client_id) REFERENCES oauth_client (id_client)
            );
            CREATE UNIQUE INDEX oauth_authorization_code_id_authorization_code_uindex ON public.oauth_authorization_code (id_authorization_code);
            CREATE INDEX oauth_authorization_code_code_index ON public.oauth_authorization_code (code);
            
            CREATE TABLE public.oauth_access_token
            (
                id_access_token SERIAL PRIMARY KEY NOT NULL,
                code TEXT NOT NULL,
                expires INT NOT NULL,
                scopes TEXT,
                client_id INT NOT NULL,
                user_id INT NOT NULL,
                CONSTRAINT oauth_access_token_oauth_client_id_client_fk FOREIGN KEY (client_id) REFERENCES oauth_client (id_client)
            );
            CREATE UNIQUE INDEX oauth_access_token_id_access_token_uindex ON public.oauth_access_token (id_access_token);
            CREATE UNIQUE INDEX oauth_access_token_code_uindex ON public.oauth_access_token (code);
            
            CREATE TABLE public.oauth_refresh_token
            (
                id_refresh_token SERIAL PRIMARY KEY NOT NULL,
                code TEXT NOT NULL,
                expires INT NOT NULL,
                scopes TEXT,
                client_id INT NOT NULL,
                user_id INT NOT NULL,
                CONSTRAINT oauth_refresh_token_oauth_client_id_client_fk FOREIGN KEY (client_id) REFERENCES oauth_client (id_client)
            );
            CREATE UNIQUE INDEX oauth_refresh_token_id_refresh_token_uindex ON public.oauth_refresh_token (id_refresh_token);
            CREATE UNIQUE INDEX oauth_refresh_token_code_uindex ON public.oauth_refresh_token (code);`).then(resolve).catch(reject);
        });
    }

    /**
     * Calculate the unix timestamp of the point at which the access code will expire. This will then be converted into
     * the expires_in value when if it is transmitted to the client. This MUST be a valid unix timestamp in the future.
     */
    abstract calculateAccessExpiry(): number;

    /**
     * Calculate the unix timestamp of the point at which the refresh code will expire. This will then be converted into
     * the expires_in value when if it is transmitted to the client. This MUST be a valid unix timestamp in the future.
     */
    abstract calculateRefreshExpiry(): number;

    //noinspection SpellCheckingInspection
    /**
     * Divides scopes based on spaces between each of the scope.<br/>
     * <strong>Input:</strong> <code>"somesite.com/page1 somesite.com/page2 somesite.com/page3"</code><br/>
     * <strong>Output:</strong> <code>["somesite.com/page1", "somesite.com/page2", "somesite.com/page3"]</code><br/>
     * @param scopes The input, space delimited string of scopes
     * @return {string[]} The array of scopes within the request.
     */
    formatScope(scopes: string): string[] {
        return scopes.split(" ");
    }

    /**
     * Generate the actual format for the authorization codes that will be used within the system
     */
    abstract generateRawAuthorizationCode(): string;

    /**
     * Generate the actual format for the refresh token that will be used within the system
     */
    abstract generateRawRefreshToken(): string;

    /**
     * Generate the actual format for the client id that will be used within the system
     */
    abstract generateRawClientID(): string;

    /**
     * Generate the actual format for the client secret that will be used within the system
     */
    abstract generateRawClientSecret(): string;

    /**
     * Generate the actual format for the access token that will be used within the system
     */
    abstract generateRawAccessToken(): string;

    /**
     * This should attempt to fetch the given access token from whatever storage implementation is being used and return
     * the access token object that represents the entire request.
     * @param token The raw access token which would be stored within [[OAuth2AccessToken._code]].
     * @return [[OAuth2AccessToken]] The matching access token representation object or False if the token cannot be
     * found.
     */
    fetchAccessToken(token: string): Promise<OAuth2AccessToken | boolean> {
        return new Promise<OAuth2AccessToken | boolean>((resolve, reject) => {
            this._pool.query("SELECT * FROM oauth_access_token WHERE code=$1", [token]).then((result: QueryResult) => {
                if (result.rowCount !== 1) reject(false);

                let id = result.rows[0]["id_access_token"];
                let code = result.rows[0]["code"];
                let expires = result.rows[0]["expires"];
                let scopes = result.rows[0]["scopes"];
                let client_id = result.rows[0]["client_id"];
                let user_id = result.rows[0]["user_id"];

                Promise.all([this.retrieveClient(client_id), this.fetchUser(user_id)]).then(value => {
                    let [client, user] = value;
                    if (client === null || user === null || client === false || user === false) reject();

                    resolve(new OAuth2AccessToken(
                        id,
                        code,
                        expires,
                        scopes,
                        this.formatScope(scopes),
                        client_id,
                        <OAuth2Client>client,
                        user_id,
                        user
                    ));
                }).catch(reject)
            })
        })
    }

    /**
     * This should attempt to fetch the given refresh token from whatever storage implementation is being used and
     * return the refresh token object that represents the entire request.
     * @param token The raw refresh token which would be stored within [[OAuth2RefreshToken._code]].
     * @returns [[OAuth2RefreshToken]] The matching refresh token representation object or False if the token cannot be
     * found.
     */
    fetchRefreshToken(token: string): Promise<OAuth2RefreshToken | boolean> {
        return new Promise<OAuth2RefreshToken | boolean>((resolve, reject) => {
            this._pool.query("SELECT * FROM oauth_refresh_token WHERE code=$1", [token]).then((result: QueryResult) => {
                if (result.rowCount === 0) reject(new Error("No results returned"));
                Promise.all([this.retrieveClient(result.rows[0]["client_id"]), this.fetchUser(result.rows[0]["user_id"])]).then(value => {
                    let [client, user] = value;
                    if (client === null || client === false || user === null || user === false) reject();
                    resolve(new OAuth2RefreshToken(
                        result.rows[0]["id_refresh_token"],
                        result.rows[0]["code"],
                        result.rows[0]["expires"],
                        result.rows[0]["scopes"],
                        this.formatScope(result.rows[0]["scopes"]),
                        result.rows[0]["client_id"],
                        <OAuth2Client>client,
                        result.rows[0]["user_id"],
                        user
                    ));
                }).catch(reject);
            }).catch(reject);
        })
    }

    /**
     * This should attempt to fetch the given authorization code from whatever storage implementation is being used and
     * return the authorization code object that represents the entire request.
     * @param code The raw authorization code which would be stored within [[OAuth2AuthorizationCode._code]].
     * @returns [[OAuth2RefreshToken]] The matching authorization code  representation object or False if the code
     * cannot be found.
     */
    fetchAuthorizationCode(code: string): Promise<OAuth2AuthorizationCode | boolean> {
        return new Promise<OAuth2AuthorizationCode | boolean>((resolve, reject) => {
            this._pool.query("SELECT * FROM oauth_authorization_code WHERE code=$1", [code]).then((result: QueryResult) => {
                if (result.rowCount === 0) reject(new Error("No results returned"));
                Promise.all([this.retrieveClient(result.rows[0]["client_id"]), this.fetchUser(result.rows[0]["user_id"])]).then(value => {
                    let [client, user] = value;
                    if (client === null || client === false || user === null || user === false) reject();
                    resolve(new OAuth2AuthorizationCode(
                        result.rows[0]["id_authorization_code"],
                        result.rows[0]["code"],
                        result.rows[0]["client_id"],
                        <OAuth2Client>client,
                        result.rows[0]["redirect_uri"],
                        result.rows[0]["scopes"],
                        this.formatScope(result.rows[0]["scopes"]),
                        result.rows[0]["user_id"],
                        user
                    ));
                }).catch(reject);
            }).catch(reject);
        })
    }

    /**
     * This should attempt to fetch the given client from whatever storage implementation is being used and
     * return the client object that represents the entire request.
     * @param id The id of the client which would be stored in [[OAuth2Client._client_id]].
     * @returns [[OAuth2Client]] The matching client representation object or False if the code cannot be found.
     */
    fetchClient(id: string): Promise<OAuth2Client | boolean> {
        return new Promise<OAuth2Client | boolean>((resolve, reject) => {
            this._pool.query("SELECT * FROM oauth_client WHERE identifier=$1", [id]).then((result: QueryResult) => {
                if (result.rowCount === 0) reject(new Error("No results returned"));
                this.fetchUser(result.rows[0]["user_id"]).then((user) => {
                    if (user === null || user === false) reject();
                    resolve(new OAuth2Client(
                        result.rows[0]["id_client"],
                        result.rows[0]["name"],
                        result.rows[0]["identifier"],
                        result.rows[0]["secret"],
                        result.rows[0]["redirect_uri"],
                        result.rows[0]["scopes"],
                        this.formatScope(result.rows[0]["scopes"]),
                        result.rows[0]["user_id"],
                        user
                    ));
                }).catch(reject);
            }).catch(reject);
        })
    }

    /**
     * Retrieve a client based on the given numerical id. This <strong>IS NOT</strong> the client ID as in the client
     * identifier.
     * @param id The numerical primary key id of the oauth_client table.
     * @return {Promise<OAuth2Client|boolean>} A promise which will return the either the value of the client or false
     * if the value cannot be found.
     */
    retrieveClient(id: number): Promise<OAuth2Client | boolean> {
        return new Promise<OAuth2Client | boolean>((resolve, reject) => {
            this._pool.query("SELECT * FROM oauth_client WHERE id_client=$1", [id]).then((result: QueryResult) => {
                if (result.rowCount === 0) reject(new Error("No results returned"));
                this.fetchUser(result.rows[0]["user_id"]).then((user) => {
                    if (user === null || user === false) reject();
                    resolve(new OAuth2Client(
                        result.rows[0]["id_client"],
                        result.rows[0]["name"],
                        result.rows[0]["identifier"],
                        result.rows[0]["secret"],
                        result.rows[0]["redirect_uri"],
                        result.rows[0]["scopes"],
                        this.formatScope(result.rows[0]["scopes"]),
                        result.rows[0]["user_id"],
                        user
                    ));
                }).catch(reject);
            }).catch(reject);
        })
    }

    /**
     * Fetch your representation of the user referenced by the ID. This can be any type including custom classes or
     * even just an object with an ID key. The only requirement is for the returned value to have an id.
     * @param id The id of the user
     * @returns The matching user representation object/class or False if the code cannot be found.
     */
    abstract fetchUser(id: number): Promise<any | boolean>;

    /**
     * Save the given token within whatever storage is being used for the implementation
     * @param token The token representation to be saved
     * @returns If the token was saved successfully.
     */
    saveAccessToken(token: OAuth2AccessToken): boolean {
        this._pool.query("INSERT INTO oauth_access_token (code, expires, scopes, client_id, user_id) VALUES ($1, $2, $3, $4, $5);", [token.code, token.expires, token.raw_scopes, token.client_id, token.user_id]).catch(reason => console.log("[ERROR][PostgreSQLController]Failed to save access token: ", reason));
        return true;
    }

    /**
     * Save the given token within whatever storage is being used for the implementation
     * @param token The token representation to be saved
     * @returns If the token was saved successfully.
     */
    saveRefreshToken(token: OAuth2RefreshToken): boolean {
        this._pool.query("INSERT INTO oauth_refresh_token (code, expires, scopes, client_id, user_id) VALUES ($1, $2, $3, $4, $5);", [token.code, token.expires, token.raw_scopes, token.client_id, token.user_id]).catch(reason => console.log("[ERROR][PostgreSQLController]Failed to save refresh token: ", reason));
        return true;
    }

    /**
     * Save the given code within whatever storage is being used for the implementation
     * @param code The code representation to be saved
     * @returns If the code was saved successfully.
     */
    saveAuthorizationCode(code: OAuth2AuthorizationCode): boolean {
        this._pool.query("INSERT INTO oauth_authorization_code (code, client_id, redirect_uri, scopes, user_id) VALUES ($1, $2, $3, $4, $5);", [code.code, code.client_id, code.redirect_uri, code.scopes, code.user_id]).catch(reason => console.log("[ERROR][PostgreSQLController]Failed to save authorization code: ", reason));
        return true;
    }

    /**
     * Save the given client within whatever storage is being used for the implementation
     * @param client The client representation to be saved
     * @returns If the client was saved successfully.
     */
    saveClient(client: OAuth2Client): boolean {
        this._pool.query("INSERT INTO oauth_client (name, identifier, secret, redirect_uri, scopes, user_id) VALUES ($1, $2, $3, $4, $5, $6);", [client.name, client.client_id, client.client_secret, client.redirect_uri, client.scopes, client.user_id]).catch(reason => console.log("[ERROR][PostgreSQLController]Failed to save authorization code: ", reason));
        return true;
    }

    /**
     * Revoke the access token either by changing the expiry time, deactivating it so it will not be returned or
     * deleting it completely from whichever store is being used.
     * @param token If the token was deactivated successfully.
     */
    revokeAccessToken(token: OAuth2AccessToken): boolean {
        this._pool.query("DELETE FROM oauth_access_token WHERE id_access_token=$1", [token.id]).catch(reason => console.log("[ERROR][PostgreSQLController]Failed to revoke access token: ", reason));
        return true;
    }

    /**
     * Revoke the refresh token either by changing the expiry time, deactivating it so it will not be returned or
     * deleting it completely from whichever store is being used.
     * @param token If the token was deactivated successfully.
     */
    revokeRefreshToken(token: OAuth2RefreshToken): boolean {
        this._pool.query("DELETE FROM oauth_refresh_token WHERE id_refresh_token=$1", [token.id]).catch(reason => console.log("[ERROR][PostgreSQLController]Failed to revoke refresh token: ", reason));
        return true;
    }

    /**
     * Revoke the authorization code either by deactivating it so it will not be returned or deleting it completely
     * from whichever store is being used.
     * @param code If the code was deactivated successfully.
     */
    revokeAuthorizationCode(code: OAuth2AuthorizationCode): boolean {
        this._pool.query("DELETE FROM oauth_authorization_code WHERE id_authorization_code=$1", [code.id]).catch(reason => console.log("[ERROR][PostgreSQLController]Failed to revoke authorization code: ", reason));
        return true;
    }
}