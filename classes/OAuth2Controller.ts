import {OAuth2AccessToken} from "./representations/OAuth2AccessToken";
import {OAuth2RefreshToken} from "./representations/OAuth2RefreshToken";
import {OAuth2AuthorizationCode} from "./representations/OAuth2AuthorizationCode";
import {OAuth2Client} from "./representations/OAuth2Client";

/**
 * The controller interface to act as a facade between whatever storage system is being used for the implementation
 */
export interface OAuth2Controller {

    /**
     * Calculate the unix timestamp of the point at which the access code will expire. This will then be converted into
     * the expires_in value when if it is transmitted to the client. This MUST be a valid unix timestamp in the future.
     */
    calculateAccessExpiry(): number;

    /**
     * Calculate the unix timestamp of the point at which the refresh code will expire. This will then be converted into
     * the expires_in value when if it is transmitted to the client. This MUST be a valid unix timestamp in the future.
     */
    calculateRefreshExpiry(): number;

    /**
     * Format the scope string that is stored and sent into a set of the scopes. The scopes can have any format that
     * you like but most OAuth2 libraries will send the scopes as a space delimited list.
     * @param scopes The list of scopes
     * @returns An array of scopes
     */
    formatScope(scopes: string): string[];

    /**
     * Generate the actual format for the authorization codes that will be used within the system
     */
    generateRawAuthorizationCode(): string;
    /**
     * Generate the actual format for the refresh token that will be used within the system
     */
    generateRawRefreshToken(): string;
    /**
     * Generate the actual format for the client id that will be used within the system
     */
    generateRawClientID(): string;
    /**
     * Generate the actual format for the client secret that will be used within the system
     */
    generateRawClientSecret(): string;
    /**
     * Generate the actual format for the access token that will be used within the system
     */
    generateRawAccessToken(): string;

    /**
     * This should attempt to fetch the given access token from whatever storage implementation is being used and return
     * the access token object that represents the entire request.
     * @param token The raw access token which would be stored within [[OAuth2AccessToken._code]].
     * @return [[OAuth2AccessToken]] The matching access token representation object or False if the token cannot be
     * found.
     */
    fetchAccessToken(token: string): Promise<OAuth2AccessToken | boolean>;

    /**
     * This should attempt to fetch the given refresh token from whatever storage implementation is being used and
     * return the refresh token object that represents the entire request.
     * @param token The raw refresh token which would be stored within [[OAuth2RefreshToken._code]].
     * @returns [[OAuth2RefreshToken]] The matching refresh token representation object or False if the token cannot be
     * found.
     */
    fetchRefreshToken(token: string): Promise<OAuth2RefreshToken | boolean>;

    /**
     * This should attempt to fetch the given authorization code from whatever storage implementation is being used and
     * return the authorization code object that represents the entire request.
     * @param code The raw authorization code which would be stored within [[OAuth2AuthorizationCode._code]].
     * @returns [[OAuth2RefreshToken]] The matching authorization code  representation object or False if the code
     * cannot be found.
     */
    fetchAuthorizationCode(code: string): Promise<OAuth2AuthorizationCode | boolean>;

    /**
     * This should attempt to fetch the given client from whatever storage implementation is being used and
     * return the client object that represents the entire request.
     * @param id The id of the client which would be stored in [[OAuth2Client._client_id]].
     * @returns [[OAuth2Client]] The matching client representation object or False if the code cannot be found.
     */
    fetchClient(id: string): Promise<OAuth2Client | boolean>;

    /**
     * Fetch your representation of the user referenced by the ID. This can be any type including custom classes or
     * even just an object with an ID key. The only requirement is for the returned value to have an id.
     * @param id The id of the user
     * @returns The matching user representation object/class or False if the code cannot be found.
     */
    fetchUser(id: number): Promise<any | boolean>;

    /**
     * Save the given token within whatever storage is being used for the implementation
     * @param token The token representation to be saved
     * @returns If the token was saved successfully.
     */
    saveAccessToken(token: OAuth2AccessToken): boolean;

    /**
     * Save the given token within whatever storage is being used for the implementation
     * @param token The token representation to be saved
     * @returns If the token was saved successfully.
     */
    saveRefreshToken(token: OAuth2RefreshToken): boolean;

    /**
     * Save the given code within whatever storage is being used for the implementation
     * @param code The code representation to be saved
     * @returns If the code was saved successfully.
     */
    saveAuthorizationCode(code: OAuth2AuthorizationCode): boolean;

    /**
     * Save the given client within whatever storage is being used for the implementation
     * @param client The client representation to be saved
     * @returns If the client was saved successfully.
     */
    saveClient(client: OAuth2Client): boolean;

    /**
     * Revoke the access token either by changing the expiry time, deactivating it so it will not be returned or
     * deleting it completely from whichever store is being used.
     * @param token If the token was deactivated successfully.
     */
    revokeAccessToken(token: OAuth2AccessToken): boolean;

    /**
     * Revoke the refresh token either by changing the expiry time, deactivating it so it will not be returned or
     * deleting it completely from whichever store is being used.
     * @param token If the token was deactivated successfully.
     */
    revokeRefreshToken(token: OAuth2RefreshToken): boolean;

    /**
     * Revoke the authorization code either by deactivating it so it will not be returned or deleting it completely
     * from whichever store is being used.
     * @param code If the code was deactivated successfully.
     */
    revokeAuthorizationCode(code: OAuth2AuthorizationCode): boolean;

}