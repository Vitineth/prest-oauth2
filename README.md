# Prest-OAuth2
A basic OAuth2 Server Library to be used with Node.JS. Written in TypeScript and compiled to JavaScript.

## Current Flow Support
- [x] Authorization Code Grant
- [ ] Implicit Grant
- [ ] Resource owner Credentials G rant
- [ ] Client Credentials

## Authorization Code Grant
The authorization code grant system is formed from a set of request. First a client (client) makes a request to the authorization server and gets the user (resource owner) to authenticate on its behalf. The client is then given an authorization code which it then uses to get an access token and a refresh token.
 
 ![Authorization Code Grant Flow Diagram - Source, DigitalOcean](https://assets.digitalocean.com/articles/oauth/auth_code_flow.png)
### Storage
The storage of the tokens is left up to the implementation. This means that you can store it in any way such as files, databases or even just in memory as long as you are able to retrieve records by ids.

### Controllers
Controllers are how the system interacts with your storage implementation storage. To make one, you need to define a class implementing ```OAuth2Controller``` which defines each of the following functions: 

Function|Return Type|Description  
-|-|-
```calculateAccessExpiry()```|```number```|Returns the unix timestamp at which the access token will expire.  
```calculateRefreshExpiry()```|```number```|Returns the unix timestamp at which the refresh token will expire.
```formatScope(string)```|```string[]```|Returns a list of scopes from the input string in whatever format you decide  
```generateRawAuthorizationCode```|```string```|Generate an authorization code, this can be any format you want for your users  
```generateRawRefreshToken```|```string```|Generate a refresh token, this can be any format you want for your users
```generateRawClientID```|```string```|Generates a client id, this can be any format you want for your users  
```generateRawClientSecret```|```string```|Generates a client secret, this ca be any format you want for your users  
```generateRawAccessToken```|```string```|Generates an access token, this can be any format you want for your users
```fetchAccessToken(string)```|```Promise```|A promise that either resolves with a `OAuth2AccessToken` if it is found or `false` if it cannot be found.
```fetchRefreshToken(string)```|```Promise```|A promise that either resolves with a `OAuth2RefreshToken` if it is found or `false` if it cannot be found.
```fetchAuthorizationCode(string)```|```Promise```|A promise that either resolves with a `OAuth2AuthorizationCode` if it is found or `false` if it cannot be found.
```fetchClient(string)```|```Promise```|A promise that either resolves with a `OAuth2Client` if it is found or `false` if it cannot be found.
```fetchUser(number)```|```Promise```|A promise that either resolves with a user object or `false` if it cannot be found.
```saveRefreshToken(OAuth2RefreshToken)```|```boolean```|Saves the token to whatever storage is being used and returns whether it was successful.
 ```saveAuthorizationCode(OAuth2AuthorizationCode)```|```boolean```|Save the code to whatever storage is being used and returns the whether it was successful.
 ```saveClient(OAuth2Client)```|```boolean```|Save the client to whatever storage is being used and returns whether it was successful.
 ```revokeAccessToken(OAuth2AcessToken)```|```boolean```|Removes the access token from storage or disables it and returns whether it was successful.
 ```revokeRefreshToken(OAuth2RefreshToken)```|```boolean```|Removes the refresh token from storage or disables it and returns whether it was successful.
 ```revokeAuthorizationCode(OAuth2AuthorizationCode)```|```boolean```|Removes the authorization code from storage or disables it and returns whether it was successful.
 
 There is an example implementation of this for a memory only storage system in `memory-only-web-server.ts` and `memory-only-web-server.js` (which is the compiled version of the ts file). All these must be implemented and then passed to the handler which has the `token`, `authorize` and `authenticate` functions which are used to return an access token, returns an authorization code and returns whether a user is authenticated respectively.  
 From here you can implemented the system however you want with the various parameters that are needed by the functions previously.
 
 There are two examples within this repository in order to demonstrate how this system can be implemented:
 - `memory-only-web-server.ts` an implementation that uses Node.JS's `http` library and stores all the tokens, clients, codes and users in memory.
 - `postgres-web-server.ts` an implementation that uses Node.JS's `http` library and stores all the tokens, clients, codes ad users in a PostgreSQL database (with the create schema required to produce the tables which is also stored in `misc/tables.sql`).
 
 #### PostgreSQL Server
 This project was originally designed to be used in a project that is back-ended by a PostgreSQL database which is why that this repo also contains the `PostgreSQLController.ts` which is a partial implementation for use in a PostgreSQL database. This can be used with only a tiny bit of expansion similarly to that shown in `postgres-web-server.ts`.
 
 ## Future Expansion
 As show above there are still three flows to be implemented which should be coming shortly. To cover everything there will be a TODO list [here](todo.md) which lists all the tasks required.