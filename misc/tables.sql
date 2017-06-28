CREATE TABLE public.oauth_client
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
CREATE UNIQUE INDEX oauth_refresh_token_code_uindex ON public.oauth_refresh_token (code);