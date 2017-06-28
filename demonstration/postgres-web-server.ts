import {PostgreSQLController} from "../classes/PostgreSQLController";
import {Pool, Client} from "pg";
import moment = require("moment");
import {OAuth2Handler} from "../OAuth2Handler";
import {createServer, IncomingMessage, ServerResponse} from "http";
import {OAuth2Client} from "../classes/representations/OAuth2Client";
import {OAuth2AuthorizationCode} from "../classes/representations/OAuth2AuthorizationCode";

let pool = new Pool({
    "user": "postgres",
    "password": "[[REDACTED]]",
    "database": "recipe_site",
    "host": "localhost",
    "port": 5432,
    "max": 10,
    "idleTimeoutMillis": 30000
});
pool.on('error', (err: Error, client: Client) => {
    console.log("There was an error with the database! [Idle Client Error]", err.message, err.stack);
});

/**
 * Created by Ryan on 27/06/2017.
 */

// [2] - Step Two - Define a user model. Something that you will use to identify the users associated with the requests

/**
 * This is just a basic representation of a user model that you may choose to implement in any way possible.
 * No extra detail will be filled in here as this should be pretty self explanatory.
 */
class User {
    private _id: number;
    private _username: string;
    private _password: string;

    constructor(id: number, username: string, password: string) {
        this._id = id;
        this._username = username;
        this._password = password;
    }

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    //noinspection JSUnusedGlobalSymbols
    get username(): string {
        return this._username;
    }

    //noinspection JSUnusedGlobalSymbols
    set username(value: string) {
        this._username = value;
    }

    //noinspection JSUnusedGlobalSymbols
    get password(): string {
        return this._password;
    }

    //noinspection JSUnusedGlobalSymbols
    set password(value: string) {
        this._password = value;
    }

}

// [3] - Step Three - Set up some storage medium that you will be able to interact with

/*
 This example is storing all data within memory as a quick example so we don't need to implement any databases or file
 handling here. Therefore we are just going to create maps for each of our users that are identified by the value we
 will be searching for later on.
 */
let users: { [index: number]: User } = {};

/*
 Additionally we are doing to define an existing user and client so we can actually use this system in our example.
 Within your example you would implement a method for these clients to be created by the given users and, probably, a
 method for the users to sign up.
 */

//Define an example user
users[1] = new User(1, "metrinclog", "hunter2");


// [4] - Step Four - Define the controller

/*
 This is the most important aspect of the example. This acts as the facade between your data storage and our system.
 We do not care about how you actually implement the storage, as long as we have a method by which we can access.
 You also must define a method by which the codes are generated. As these are being transmitted as web query strings
 you must abide by the rules for safe transmission as a URL, for example not including the & symbol. This is left to the
 digression of the user though.

 This example just tries to read from the dictionaries that we have defined above. Additionally, we have defined the
 expiry of the tokens to be 10 days for the access tokens and 25 days for the refresh token which are calculated by
 using the moment.js library.

 These are to be returned as UNIX timestamps.
 */
class RealController extends PostgreSQLController {

    static generateCode(): string {
        let options = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz12345678901234567890";
        let result = "";
        for (let i = 0; i < 40; i++) {
            result += options.charAt(Math.floor(Math.random() * options.length));
        }
        return result;
    }

    calculateAccessExpiry(): number {
        return moment().add(10, "days").unix();
    }

    calculateRefreshExpiry(): number {
        return moment().add(25, "days").unix();
    }

    formatScope(scopes: string): string[] {
        return scopes.split(":");
    }

    generateRawAuthorizationCode(): string {
        return RealController.generateCode();
    }

    generateRawRefreshToken(): string {
        return RealController.generateCode();
    }

    generateRawClientID(): string {
        return RealController.generateCode();
    }

    generateRawClientSecret(): string {
        return RealController.generateCode();
    }

    generateRawAccessToken(): string {
        return RealController.generateCode();
    }

    fetchUser(id: number): any | boolean {
        return Promise.resolve(users.hasOwnProperty(id) ? users[id] : false);
    }
}
/*
 Instantiate the controller and the handler that we will be using to authenticate requests.
 */
let controller = new RealController(pool);
let verify = controller.verifyTables();
verify.then(() => {
    console.log("Tables verified successfully");
}).catch(() => {
    console.log("Tables were invalid");
    throw new Error("Invalid tables");
});
let handler = new OAuth2Handler(controller);

// [4] - Step Four - Create your server

/*
 How you do this is left up to your implementation. This could be done using an existing library or through some other
 custom framework for example. For this example I'm going to use node's HTTP library to spawn a server. These steps will
 be defined as 4a etc.
 */

// [5a] - Step Five A - Define the request handlers that will server the various requests.

/*
 At the most basic level we have three distinct views:
 [authorize] - This is where the user goes first to authorize the client to act on behalf of them. This is where they
 will then receive the authorization code.
 [token] - This is where the client, on behalf of the user, uses the authorization code it had previously obtained to
 fetch an access token which it will then use to act on behalf of the server
 [secure] - Some secure resource that the server requires OAuth2 authentication to access.
 */

let authorize = (request: IncomingMessage, response: ServerResponse) => {
    //This will always be a get request
    if (request.method && request.method.toUpperCase() !== "GET") {
        response.statusCode = 405;
        response.end(JSON.stringify({"error": "Requires a GET request"}));
        return;
    }

    //We will be receiving a URL like http://some.host/oauth/authorize?client_id=some_client_id...
    let segments = (<string>request.url).split("?");
    if (segments.length < 2) {
        response.statusCode = 400;
        response.end(JSON.stringify({"error": "URL Requires a set of parameters: response_type, client_id, scope"}));
        return;
    }
    let query = segments[1];

    //Split up the query string into its individual parameters ad store them within the object.
    let parameters: { [index: string]: string } = {};
    if (query) for (let p of query.split("&")) parameters[p.split("=")[0]] = p.split("=")[1];

    //Check that we have the correct parameters to begin with.
    if (!parameters.hasOwnProperty("response_type") || !parameters.hasOwnProperty("client_id") || !parameters.hasOwnProperty("scope")) {
        response.statusCode = 400;
        response.end(JSON.stringify({"error": "You must specify the response_type, client_id and the scopes that the client is requesting"}));
        return;
    }


    //Get the client so we can give the user some details.
    let client: Promise<OAuth2Client | boolean> = controller.fetchClient(parameters["client_id"]);
    client.then((client) => {
        //Reject the request if we don't have the client the user is trying to access.
        if (client === false) {
            response.statusCode = 400;
            response.end(JSON.stringify({"error": "The specified client cannot be found"}));
            return;
        }
        client = <OAuth2Client> client;

        //If the user has not authorized it yet we need to provide the form to the user to login. You should figure out a
        //better method to authorize user including when they are already logged in and so forth. This is just a basic
        //example through. The form below simply gives a login form and a few details about the client. The JavaScript in
        //the page just ensures that the parameters already sent to this page get copied across to this page as well.
        if (!parameters.hasOwnProperty("username") || !parameters.hasOwnProperty("password")) {
            response.write(`
            <html>
                <body>
                    <form action='#' method='get'>
                        <h1>Client '${client.name}' is requesting access to use your account.</h1>
                        <p>It is asking for the following scopes: ${client.scopes}.</p>
                        <input type='text' name='username'>
                        <input type="password" name="password">
                        <span id="identifier"></span>
                        <button type='submit'>Authorize</button> 
                    </form>
                    <script>
                        var queries = window.location.search.substr(1).split("&");
                        for(var i in queries){
                            var input = document.createElement("input");
                            var parts = queries[i].split("=");
                            input.setAttribute("name", parts[0]);
                            input.setAttribute("value", parts[1]);
                            input.setAttribute("hidden", true);
                            document.getElementById("identifier").parentNode.insertBefore(input, document.getElementById("identifier").nextSibling);
                        }
                    </script>
                </body>
            </html>`);
            response.end();
            return;
        }

        //Check that the user login is valid. You may want to redirect back to this page or to some other error page.
        let user: User | null = null;
        for (let uk in users) {
            if (users[uk].username === parameters["username"]) {
                if (users[uk].password === parameters["password"]) {
                    user = users[uk];
                    break;
                } else {
                    response.end(JSON.stringify({"error": "Invalid username or password"}));
                    return;
                }
            }
        }
        if (user === null) {
            response.end(JSON.stringify({"error": "Invalid username or password"}));
            return;
        }
        user = <User> user;

        //Determine which URI we are going to use. You may want to handle this a little differently but this is still just a
        //basic example.
        let redirectURI: string;
        if (parameters.hasOwnProperty("redirect_uri")) {
            redirectURI = decodeURIComponent(decodeURIComponent(parameters["redirect_uri"]))
        } else if (client.redirect_uri !== null) {
            redirectURI = client.redirect_uri;
        } else {
            redirectURI = "";
        }

        let responseType = parameters["response_type"];
        let clientID = parameters["client_id"];
        //There is no verification of scopes here, this must be implemented by you.
        let scope = parameters["scope"];
        //Some OAuth libraries will attach a state CSRF token to the request. If so we need to include this as a parameter
        //on the redirect URI.
        let state = parameters.hasOwnProperty("state") ? "&state=" + parameters["state"] : "";

        //When the user is authorized successfully redirect them to the redirect URI. The next line will trigger an
        //error if there's some sort of error.
        handler.authorize(responseType, clientID, scope, user.id, redirectURI).then((code: OAuth2AuthorizationCode) => {
            //Attach the code to the URI
            redirectURI += "?code=" + code.code + state;

            response.statusCode = 302;
            response.setHeader("Location", redirectURI);
            response.end();
        }).catch((reason) => {
            response.statusCode = 400;
            response.end(JSON.stringify({"error": "Failed to authorize the request", "reason": reason}));
        });
    }).catch((err) => {
        response.statusCode = 400;
        response.end(JSON.stringify({"error": "Invalid client id supplied", "reason": err}));
    })
};

let token = (request: IncomingMessage, response: ServerResponse) => {
    //This will always be a POST request
    if (request.method && request.method.toUpperCase() !== "POST") {
        response.statusCode = 405;
        response.end(JSON.stringify({"error": "Requires a POST request"}));
        return;
    }


    loadFullPayload(request).then((data: string) => {
        //As the authenticate function we need to split out the parameters that we have received with the request.
        let parts: string[] = data.split("&");
        let parameters: { [index: string]: string } = {};
        for (let p of parts) parameters[p.split("=")[0]] = p.split("=")[1];

        //If we are missing any of the required daa then return an error reporting that we have a missing parameter.
        if (!parameters.hasOwnProperty("grant_type") || !parameters.hasOwnProperty("client_id") || !parameters.hasOwnProperty("client_secret") || !parameters.hasOwnProperty("code")) {
            response.statusCode = 400;
            response.end(JSON.stringify({"error": "Missing parameters: grant_type, client_id, client_secret, code."}));
            return;
        }

        //Get the client so we can complete the request.
        let client: Promise<OAuth2Client | boolean> = controller.fetchClient(parameters["client_id"]);
        client.then((client) => {
            //Reject the request if we don't have the client the user is trying to access.
            if (client === false) {
                response.statusCode = 400;
                response.end(JSON.stringify({"error": "The specified client cannot be found"}));
                return;
            }
            client = <OAuth2Client> client;

            //Determine which URI we are going to use. You may want to handle this a little differently but this is still just a
            //basic example.
            let redirectURI: string;
            if (parameters.hasOwnProperty("redirect_uri")) {
                redirectURI = decodeURIComponent(decodeURIComponent(parameters["redirect_uri"]))
            } else if (client.redirect_uri !== null) {
                redirectURI = client.redirect_uri;
            } else {
                redirectURI = "";
            }

            //Fetch the requested authorization code that the client is trying to get an access token for.
            let authorization: Promise<OAuth2AuthorizationCode | boolean> = controller.fetchAuthorizationCode(parameters["code"]);
            authorization.then((authorization) => {

                if (authorization === false) {
                    response.statusCode = 400;
                    response.end(JSON.stringify({"error": "Failed to find the requested authorization code."}));
                    return;
                }
                authorization = <OAuth2AuthorizationCode> authorization;

                //Determine the scopes that the client is requesting. If there are no scopes specified then just use the ones
                //agreed to when they authorized the request.
                let scopes: string;
                if (parameters.hasOwnProperty("scope")) {
                    scopes = parameters["scope"];
                } else {
                    scopes = authorization.raw_scopes;
                }

                //Retrieve the parameters from the request that we need to use next;
                let grantTypes = parameters["grant_type"];
                let clientID = parameters["client_id"];
                let clientSecret = parameters["client_secret"];
                let code = parameters["code"];

                //Fetch and save the access and refresh token and return them
                handler.token(grantTypes, clientID, clientSecret, code, scopes, redirectURI).then((token) => {
                    let {access, refresh} = token;

                    //Determine the amount of time until the token expires. We are using the moment library here to do this but
                    //this can be done in any way. You need to return the amount of time IN SECONDS.
                    let expiry = moment.unix(access.expires);
                    let expiresIn = Math.floor(moment.duration(expiry.diff(moment())).asSeconds());

                    //Return the required details.
                    response.end(JSON.stringify({
                        "token_type": "Bearer",
                        "expires_in": expiresIn,
                        "access_token": access.code,
                        "refresh_token": refresh.code
                    }));
                }).catch((reason) => {
                    console.log(reason);
                    response.statusCode = 400;
                    response.end(JSON.stringify({
                        "error": "Failed to authorize the Failed to activate the token",
                        "reason": reason
                    }));
                });
            }).catch((reason) => {
                console.log(reason);
                response.statusCode = 400;
                response.end(JSON.stringify({
                    "error": "Failed to fetch the authorization code. This is most likely due to an invalid code",
                    "reason": reason
                }));
            })
        }).catch((reason) => {
            response.statusCode = 400;
            response.end(JSON.stringify({
                "error": "Failed to fetch the client. The client ID is most likely invalid",
                "reason": reason
            }));
        })
    }).catch(() => {
        response.statusCode = 500;
        response.end(JSON.stringify({"error": "Failed to read the payload data"}))
    });
};

let secure = (request: IncomingMessage, response: ServerResponse) => {
    //The secure resource MUST have the auth code header.
    if (!request.headers.hasOwnProperty("authorization") || (<string>request.headers["authorization"]).indexOf("Bearer ")) {
        response.statusCode = 403;
        response.end(JSON.stringify({"error": "You must specify a Bearer authentication token as a header"}));
        return;
    }

    //Fetch the actual code being used for the request
    let code = (<string>request.headers["authorization"]).replace("Bearer", "").trim();

    //Attempt to authenticate the request and either respond with the super secret data or reject the request for an
    //invalid token.
    handler.authenticate(code).then(() => {
        response.end("Some super secret data that should not be shared to unauthenticated users. ");
    }).catch(() => {
        response.statusCode = 403;
        response.end(JSON.stringify({"error": "You do not have permission to access this resource with the given access token."}))
    });
};

let requestHandler = (request: IncomingMessage, response: ServerResponse) => {
    //Just get the URL. This is just to make sure that we are only testing the section of the URL trying to be accessed.
    let [url] = (<string>request.url).split("?");

    if (url.toLowerCase() === "/oauth2/authorize") authorize(request, response);
    else if (url.toLowerCase() === "/oauth2/token") token(request, response);
    else if (url.toLowerCase() === "/secure") secure(request, response);
    else {
        response.statusCode = 404;
        response.end();
    }
};

// [5b] - Step Five B - Set up and start the server

const server = createServer(requestHandler);
server.listen(2564, (err: Error) => {
    if (err) {
        console.log("Could not start the server due to error", err);
    } else {
        console.log(`Server started successfully on port 2564.`);
    }
});

// [---- Utility Functions ----]

/*
 This is a utility function to read all data from the body of a request payload.
 */
function loadFullPayload(request: IncomingMessage) {
    return new Promise<any>((resolve, reject) => {
        let payload = "";
        request.on("data", (data) => {
            payload += data;
            if (payload.length > 1e6) {
                request.connection.destroy();
                reject("overflow");
                return;
            }
        });

        request.on("end", () => {
            resolve(payload);
            return;
        });

        request.on("abort", () => {
            reject("abort");
            return;
        });
        request.on("close", () => {
            reject("close");
            return;
        });
        request.on("error", (err) => {
            reject(["error", err]);
            return;
        });
    });
}