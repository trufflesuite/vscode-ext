// Copyright (c) Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import crypto from "crypto";
import fs from "fs-extra";
import http from "http";
import open from "open";
import querystring from "querystring";
import requestPromise from "request-promise";
import url from "url";
import {Constants} from "../../Constants";
import {Telemetry} from "../../TelemetryClient";

interface IDeferred<T> {
  resolve: (result: T | Promise<T>) => void;
  reject: (reason: any) => void;
}

export interface IToken {
  accessToken: string;
  accessTokenExpirationDate: Date;
  refreshToken: string;
}

const defaultTimeout = 5 * 60 * 1000; // 5 min
const closeTimeout = 5 * 1000; // 5 sec

const commonRequestParams = {
  client_id: Constants.infuraCredentials.clientId,
  client_secret: Constants.infuraCredentials.clientSecret,
  redirect_uri: Constants.infuraAuthUrls.callbackURL,
  scope: Object.values(Constants.infuraCredentials.scopes).join("+"),
};

export async function signIn() {
  const {server, codePromise} = createServer();

  try {
    await startServer(server);

    const authParams = {response_type: "code", state: crypto.randomBytes(20).toString("hex")};
    const authorizationUrl = new url.URL(Constants.infuraAuthUrls.authURL, Constants.infuraAuthUrls.baseURL);

    authorizationUrl.search = queryString(authParams);

    await open(authorizationUrl.toString());

    const code = await codePromise;

    return await getToken(code);
  } catch (error) {
    Telemetry.sendException(error as Error);
    throw error;
  } finally {
    setTimeout(() => server.close(), closeTimeout);
  }
}

export async function signOut(token: string): Promise<void> {
  const queryParams = queryString({grant_type: Constants.infuraRequestGrantType.authorizationCode, token});
  const options = {body: queryParams, headers: {"Content-Type": "application/x-www-form-urlencoded"}};
  const requestUrl = new url.URL(Constants.infuraAuthUrls.revoke, Constants.infuraAuthUrls.baseURL);

  requestPromise.post(requestUrl.toString(), options);
}

export async function refreshToken(token: string): Promise<IToken> {
  return await tokenRequest({grant_type: Constants.infuraRequestGrantType.refreshToken, refresh_token: token});
}

async function getToken(code: string): Promise<IToken> {
  return await tokenRequest({code, grant_type: Constants.infuraRequestGrantType.authorizationCode});
}

async function tokenRequest(params: any): Promise<IToken> {
  const queryParams = queryString(params);
  const options = {body: queryParams, headers: {"Content-Type": "application/x-www-form-urlencoded"}};
  const requestUrl = new url.URL(Constants.infuraAuthUrls.tokenURL, Constants.infuraAuthUrls.baseURL);
  const response = await requestPromise.post(requestUrl.toString(), options);
  const result = JSON.parse(response);
  const expirationDate = new Date();

  if (Number.isInteger(result.expires_in)) {
    expirationDate.setSeconds(expirationDate.getSeconds() + result.expires_in);
  }

  return {
    accessToken: result.access_token,
    accessTokenExpirationDate: expirationDate,
    refreshToken: result.refresh_token,
  };
}

function queryString(options: any): string {
  return querystring.stringify(Object.assign(commonRequestParams, options)).replace(/%2B/g, "+");
}

function createServer() {
  let deferredCode: IDeferred<string>;
  const codePromise = new Promise<string>((resolve, reject) => (deferredCode = {resolve, reject}));
  const codeTimer = setTimeout(() => deferredCode.reject(new Error("Timeout waiting for code")), defaultTimeout);
  const cancelCodeTimer = () => clearTimeout(codeTimer);

  const server = http.createServer((req, res) => {
    const reqUrl = new url.URL(req.url!, `${Constants.networkProtocols.http}${Constants.localhost}`);
    switch (reqUrl.pathname) {
      case "/callback": {
        const error = reqUrl.searchParams.get("error_description") || reqUrl.searchParams.get("error");
        const code = reqUrl.searchParams.get("code");

        if (!error && code) {
          deferredCode.resolve(code);
          res.writeHead(302, {Location: "/"});
        } else {
          const err = new Error(error || "No code received.");
          deferredCode.reject(err);
          res.writeHead(302, {Location: `/?error=${querystring.escape(err.message)}`});
        }
        res.end();
        break;
      }
      case "/":
        sendFile(res, Constants.infuraFileResponse.path, "text/html; charset=utf-8");
        break;
      case "/main.css":
        sendFile(res, Constants.infuraFileResponse.css, "text/css; charset=utf-8");
        break;
      default:
        res.writeHead(404);
        res.end();
        break;
    }
  });

  codePromise.then(cancelCodeTimer, cancelCodeTimer);

  return {
    codePromise,
    server,
  };
}

function startServer(server: http.Server): Promise<number> {
  let deferredCode: IDeferred<number>;
  const portPromise = new Promise<number>((resolve, reject) => (deferredCode = {resolve, reject}));
  const portTimer = setTimeout(() => deferredCode.reject(new Error("Timeout waiting for port")), closeTimeout);
  const cancelPortTimer = () => clearTimeout(portTimer);

  server.on("listening", () => deferredCode.resolve(9010));

  server.on("error", (error) => deferredCode.reject(error));

  server.on("close", () => deferredCode.reject(new Error("Closed")));

  server.listen(9010, Constants.localhost);

  portPromise.then(cancelPortTimer, cancelPortTimer);

  return portPromise;
}

function sendFile(res: http.ServerResponse, filePath: string, contentType: string) {
  fs.readFile(filePath, (err: any, body: any) => {
    if (!err) {
      res.writeHead(200, {
        "Content-Length": body.length,
        "Content-Type": contentType,
      });
      res.end(body);
    }
  });
}
