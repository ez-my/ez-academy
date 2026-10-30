import 'google-auth-library';
import 'fast-deep-equal';
import '@fastify/busboy';
import 'debug';
import 'lru-memoizer';
import 'limiter';
import 'jsonwebtoken';
import '@google-cloud/firestore';
import { createRequire as moduleRequire } from 'node:module'; const require = moduleRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/firebase-admin/lib/utils/error.js
var require_error = __commonJS({
  "node_modules/firebase-admin/lib/utils/error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirebaseError = void 0;
    exports.toHttpResponse = toHttpResponse;
    function toHttpResponse(resp) {
      return {
        status: resp.status,
        headers: resp.headers,
        data: resp.isJson() ? resp.data : resp.text
      };
    }
    var FirebaseError = class extends Error {
      /**
       * @param errorInfo - The error information (code and message).
       */
      constructor(errorInfo) {
        super(errorInfo.message);
        this.code = errorInfo.code;
        if (errorInfo.cause !== void 0) {
          this.cause = errorInfo.cause;
        }
        if (errorInfo.httpResponse !== void 0) {
          this.httpResponse = errorInfo.httpResponse;
        }
      }
      /** {@inheritDoc FirebaseError.hasCode} */
      hasCode(code) {
        if (this.code === code) {
          return true;
        }
        return this.codePrefix != null && this.code === `${this.codePrefix}/${code}`;
      }
      /** @returns The object representation of the error. */
      toJSON() {
        const json = {
          code: this.code,
          message: this.message
        };
        if (this.httpResponse) {
          json.httpResponse = {
            status: this.httpResponse.status,
            headers: this.httpResponse.headers,
            data: this.httpResponse.data
          };
        }
        if (this.cause) {
          json.cause = {
            name: this.cause.name || "Error",
            message: this.cause.message || String(this.cause),
            stack: this.cause.stack
          };
          if ("errors" in this.cause && Array.isArray(this.cause.errors)) {
            json.cause.errors = this.cause.errors.map((e) => {
              if (e instanceof Error) {
                return { name: e.name, message: e.message, stack: e.stack };
              }
              return String(e);
            });
          }
        }
        return json;
      }
    };
    exports.FirebaseError = FirebaseError;
  }
});

// node_modules/firebase-admin/lib/app/error.js
var require_error2 = __commonJS({
  "node_modules/firebase-admin/lib/app/error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppErrorCode = exports.FirebaseAppError = void 0;
    var error_1 = require_error();
    var FirebaseAppError = class extends error_1.FirebaseError {
      /**
       * @param info - The error code info.
       * @param message - The error message. This will override the default message if provided.
       */
      constructor(info, message2) {
        super({
          code: `app/${info.code}`,
          message: message2 || info.message,
          httpResponse: info.httpResponse,
          cause: info.cause
        });
        this.codePrefix = "app";
      }
    };
    exports.FirebaseAppError = FirebaseAppError;
    exports.AppErrorCode = {
      APP_DELETED: "app-deleted",
      DUPLICATE_APP: "duplicate-app",
      INVALID_ARGUMENT: "invalid-argument",
      INTERNAL_ERROR: "internal-error",
      INVALID_APP_NAME: "invalid-app-name",
      INVALID_APP_OPTIONS: "invalid-app-options",
      INVALID_CREDENTIAL: "invalid-credential",
      NETWORK_ERROR: "network-error",
      NETWORK_TIMEOUT: "network-timeout",
      NO_APP: "no-app",
      UNABLE_TO_PARSE_RESPONSE: "unable-to-parse-response"
    };
  }
});

// node_modules/firebase-admin/lib/utils/validator.js
var require_validator = __commonJS({
  "node_modules/firebase-admin/lib/utils/validator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isBuffer = isBuffer;
    exports.isArray = isArray;
    exports.isNonEmptyArray = isNonEmptyArray;
    exports.isBoolean = isBoolean;
    exports.isNumber = isNumber;
    exports.isString = isString;
    exports.isBase64String = isBase64String;
    exports.isNonEmptyString = isNonEmptyString;
    exports.isObject = isObject2;
    exports.isNonNullObject = isNonNullObject;
    exports.isUid = isUid;
    exports.isPassword = isPassword;
    exports.isEmail = isEmail;
    exports.isPhoneNumber = isPhoneNumber;
    exports.isISODateString = isISODateString;
    exports.isUTCDateString = isUTCDateString;
    exports.isURL = isURL;
    exports.isTopic = isTopic;
    exports.isTaskId = isTaskId;
    function isBuffer(value) {
      return value instanceof Buffer;
    }
    function isArray(value) {
      return Array.isArray(value);
    }
    function isNonEmptyArray(value) {
      return isArray(value) && value.length !== 0;
    }
    function isBoolean(value) {
      return typeof value === "boolean";
    }
    function isNumber(value) {
      return typeof value === "number" && !isNaN(value);
    }
    function isString(value) {
      return typeof value === "string";
    }
    function isBase64String(value) {
      if (!isString(value)) {
        return false;
      }
      return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
    }
    function isNonEmptyString(value) {
      return isString(value) && value !== "";
    }
    function isObject2(value) {
      return typeof value === "object" && !isArray(value);
    }
    function isNonNullObject(value) {
      return isObject2(value) && value !== null;
    }
    function isUid(uid) {
      return typeof uid === "string" && uid.length > 0 && uid.length <= 128;
    }
    function isPassword(password) {
      return typeof password === "string" && password.length >= 6;
    }
    function isEmail(email) {
      if (typeof email !== "string") {
        return false;
      }
      const re = /^[^@]+@[^@]+$/;
      return re.test(email);
    }
    function isPhoneNumber(phoneNumber) {
      if (typeof phoneNumber !== "string") {
        return false;
      }
      const re1 = /^\+/;
      const re2 = /[\da-zA-Z]+/;
      return re1.test(phoneNumber) && re2.test(phoneNumber);
    }
    function isISODateString(dateString) {
      try {
        return isNonEmptyString(dateString) && new Date(dateString).toISOString() === dateString;
      } catch (e) {
        return false;
      }
    }
    function isUTCDateString(dateString) {
      try {
        return isNonEmptyString(dateString) && new Date(dateString).toUTCString() === dateString;
      } catch (e) {
        return false;
      }
    }
    function isURL(urlStr) {
      if (typeof urlStr !== "string") {
        return false;
      }
      const re = /[^a-z0-9:/?#[\]@!$&'()*+,;=.\-_~%]/i;
      if (re.test(urlStr)) {
        return false;
      }
      try {
        const uri = new URL(urlStr);
        const scheme = uri.protocol;
        if (scheme !== "http:" && scheme !== "https:") {
          return false;
        }
        const hostname = uri.hostname;
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(hostname)) {
          if (!/^\[[a-fA-F0-9:.]+\]$/.test(hostname)) {
            return false;
          }
        }
        const pathnameRe = /^(\/[\w\-.~!$'()*+,;=:@%]+)*\/?$/;
        const pathname = uri.pathname;
        if (pathname && pathname !== "/" && !pathnameRe.test(pathname)) {
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    }
    function isTopic(topic) {
      if (typeof topic !== "string") {
        return false;
      }
      const VALID_TOPIC_REGEX = /^(\/topics\/)?(private\/)?[a-zA-Z0-9-_.~%]+$/;
      return VALID_TOPIC_REGEX.test(topic);
    }
    function isTaskId(taskId) {
      if (typeof taskId !== "string") {
        return false;
      }
      const VALID_TASK_ID_REGEX = /^[A-Za-z0-9_-]+$/;
      return VALID_TASK_ID_REGEX.test(taskId);
    }
  }
});

// node_modules/firebase-admin/lib/app/credential-internal.js
var require_credential_internal = __commonJS({
  "node_modules/firebase-admin/lib/app/credential-internal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImpersonatedServiceAccountCredential = exports.RefreshTokenCredential = exports.ServiceAccountCredential = exports.ApplicationDefaultCredential = void 0;
    exports.isApplicationDefault = isApplicationDefault;
    exports.getApplicationDefault = getApplicationDefault;
    var fs = __require("fs");
    var node_crypto_1 = __require("node:crypto");
    var google_auth_library_1 = __require("google-auth-library");
    var error_1 = require_error2();
    var util = require_validator();
    var SCOPES = [
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/firebase.database",
      "https://www.googleapis.com/auth/firebase.messaging",
      "https://www.googleapis.com/auth/identitytoolkit",
      "https://www.googleapis.com/auth/userinfo.email"
    ];
    var ApplicationDefaultCredential = class {
      constructor(httpAgent) {
        this.googleAuth = new google_auth_library_1.GoogleAuth({
          scopes: SCOPES,
          clientOptions: {
            transporterOptions: {
              agent: httpAgent
            }
          }
        });
      }
      async getAccessToken() {
        if (!this.authClient) {
          this.authClient = await this.googleAuth.getClient();
        }
        await this.authClient.getAccessToken();
        const credentials = this.authClient.credentials;
        this.quotaProjectId = this.authClient.quotaProjectId;
        return populateCredential(credentials);
      }
      async getProjectId() {
        if (!this.projectId) {
          this.projectId = await this.googleAuth.getProjectId();
        }
        return Promise.resolve(this.projectId);
      }
      getQuotaProjectId() {
        if (!this.quotaProjectId) {
          this.quotaProjectId = this.authClient?.quotaProjectId;
        }
        return this.quotaProjectId;
      }
      async isComputeEngineCredential() {
        if (!this.authClient) {
          this.authClient = await this.googleAuth.getClient();
        }
        return Promise.resolve(this.authClient instanceof google_auth_library_1.Compute);
      }
      /**
       * getIDToken returns a OIDC token from the compute metadata service
       * that can be used to make authenticated calls to audience
       * @param audience the URL the returned ID token will be used to call.
      */
      async getIDToken(audience) {
        if (await this.isComputeEngineCredential()) {
          return this.authClient.fetchIdToken(audience);
        } else {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_CREDENTIAL,
            message: "Credentials type should be Compute Engine Credentials."
          });
        }
      }
      async getServiceAccountEmail() {
        if (this.accountId) {
          return Promise.resolve(this.accountId);
        }
        const { client_email: clientEmail } = await this.googleAuth.getCredentials();
        this.accountId = clientEmail ?? "";
        return Promise.resolve(this.accountId);
      }
    };
    exports.ApplicationDefaultCredential = ApplicationDefaultCredential;
    var ServiceAccountCredential = class {
      /**
       * Creates a new ServiceAccountCredential from the given parameters.
       *
       * @param serviceAccountPathOrObject - Service account json object or path to a service account json file.
       * @param httpAgent - Optional http.Agent to use when calling the remote token server.
       * @param implicit - An optional boolean indicating whether this credential was implicitly discovered from the
       *   environment, as opposed to being explicitly specified by the developer.
       *
       * @constructor
       */
      constructor(serviceAccountPathOrObject, httpAgent, implicit = false) {
        this.serviceAccountPathOrObject = serviceAccountPathOrObject;
        this.httpAgent = httpAgent;
        this.implicit = implicit;
        const serviceAccount = typeof serviceAccountPathOrObject === "string" ? ServiceAccount.fromPath(serviceAccountPathOrObject) : new ServiceAccount(serviceAccountPathOrObject);
        this.projectId = serviceAccount.projectId;
        this.privateKey = serviceAccount.privateKey;
        this.clientEmail = serviceAccount.clientEmail;
      }
      getGoogleAuth() {
        if (this.googleAuth) {
          return this.googleAuth;
        }
        const { auth, client } = populateGoogleAuth(this.serviceAccountPathOrObject, this.httpAgent);
        this.googleAuth = auth;
        this.authClient = client;
        return this.googleAuth;
      }
      async getAccessToken() {
        const googleAuth = this.getGoogleAuth();
        if (this.authClient === void 0) {
          this.authClient = await googleAuth.getClient();
        }
        await this.authClient.getAccessToken();
        const credentials = this.authClient.credentials;
        return populateCredential(credentials);
      }
    };
    exports.ServiceAccountCredential = ServiceAccountCredential;
    var ServiceAccount = class _ServiceAccount {
      static fromPath(filePath) {
        try {
          return new _ServiceAccount(JSON.parse(fs.readFileSync(filePath, "utf8")));
        } catch (error) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_CREDENTIAL,
            message: `Failed to parse service account json file: ${error.message}`,
            cause: error
          });
        }
      }
      constructor(json) {
        if (!util.isNonNullObject(json)) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_CREDENTIAL,
            message: "Service account must be an object."
          });
        }
        copyAttr(this, json, "projectId", "project_id");
        copyAttr(this, json, "privateKey", "private_key");
        copyAttr(this, json, "clientEmail", "client_email");
        let errorMessage;
        if (!util.isNonEmptyString(this.projectId)) {
          errorMessage = 'Service account object must contain a string "project_id" property.';
        } else if (!util.isNonEmptyString(this.privateKey)) {
          errorMessage = 'Service account object must contain a string "private_key" property.';
        } else if (!util.isNonEmptyString(this.clientEmail)) {
          errorMessage = 'Service account object must contain a string "client_email" property.';
        }
        if (typeof errorMessage !== "undefined") {
          throw new error_1.FirebaseAppError({ code: error_1.AppErrorCode.INVALID_CREDENTIAL, message: errorMessage });
        }
        try {
          (0, node_crypto_1.createPrivateKey)(this.privateKey);
        } catch (error) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_CREDENTIAL,
            message: "Failed to parse private key.",
            cause: error
          });
        }
      }
    };
    var RefreshTokenCredential = class {
      /**
       * Creates a new RefreshTokenCredential from the given parameters.
       *
       * @param refreshTokenPathOrObject - Refresh token json object or path to a refresh token
       *   (user credentials) json file.
       * @param httpAgent - Optional http.Agent to use when calling the remote token server.
       * @param implicit - An optinal boolean indicating whether this credential was implicitly
       *   discovered from the environment, as opposed to being explicitly specified by the developer.
       *
       * @constructor
       */
      constructor(refreshTokenPathOrObject, httpAgent, implicit = false) {
        this.refreshTokenPathOrObject = refreshTokenPathOrObject;
        this.httpAgent = httpAgent;
        this.implicit = implicit;
        typeof refreshTokenPathOrObject === "string" ? RefreshToken.validateFromPath(refreshTokenPathOrObject) : RefreshToken.validateFromJSON(refreshTokenPathOrObject);
      }
      getGoogleAuth() {
        if (this.googleAuth) {
          return this.googleAuth;
        }
        const { auth, client } = populateGoogleAuth(this.refreshTokenPathOrObject, this.httpAgent);
        this.googleAuth = auth;
        this.authClient = client;
        return this.googleAuth;
      }
      async getAccessToken() {
        const googleAuth = this.getGoogleAuth();
        if (this.authClient === void 0) {
          this.authClient = await googleAuth.getClient();
        }
        await this.authClient.getAccessToken();
        const credentials = this.authClient.credentials;
        return populateCredential(credentials);
      }
    };
    exports.RefreshTokenCredential = RefreshTokenCredential;
    var RefreshToken = class _RefreshToken {
      /*
       * Tries to load a RefreshToken from a path. Throws if the path doesn't exist or the
       * data at the path is invalid.
       */
      static validateFromPath(filePath) {
        try {
          _RefreshToken.validateFromJSON(JSON.parse(fs.readFileSync(filePath, "utf8")));
        } catch (error) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_CREDENTIAL,
            message: "Failed to parse refresh token file.",
            cause: error
          });
        }
      }
      static validateFromJSON(json) {
        const creds = { clientId: "", clientSecret: "", refreshToken: "", type: "" };
        copyAttr(creds, json, "clientId", "client_id");
        copyAttr(creds, json, "clientSecret", "client_secret");
        copyAttr(creds, json, "refreshToken", "refresh_token");
        copyAttr(creds, json, "type", "type");
        let errorMessage;
        if (!util.isNonEmptyString(creds.clientId)) {
          errorMessage = 'Refresh token must contain a "client_id" property.';
        } else if (!util.isNonEmptyString(creds.clientSecret)) {
          errorMessage = 'Refresh token must contain a "client_secret" property.';
        } else if (!util.isNonEmptyString(creds.refreshToken)) {
          errorMessage = 'Refresh token must contain a "refresh_token" property.';
        } else if (!util.isNonEmptyString(creds.type)) {
          errorMessage = 'Refresh token must contain a "type" property.';
        }
        if (typeof errorMessage !== "undefined") {
          throw new error_1.FirebaseAppError({ code: error_1.AppErrorCode.INVALID_CREDENTIAL, message: errorMessage });
        }
      }
    };
    var ImpersonatedServiceAccountCredential = class {
      /**
       * Creates a new ImpersonatedServiceAccountCredential from the given parameters.
       *
       * @param impersonatedServiceAccountPathOrObject - Impersonated Service account json object or
       * path to a service account json file.
       * @param httpAgent - Optional http.Agent to use when calling the remote token server.
       * @param implicit - An optional boolean indicating whether this credential was implicitly
       *   discovered from the environment, as opposed to being explicitly specified by the developer.
       *
       * @constructor
       */
      constructor(impersonatedServiceAccountPathOrObject, httpAgent, implicit = false) {
        this.impersonatedServiceAccountPathOrObject = impersonatedServiceAccountPathOrObject;
        this.httpAgent = httpAgent;
        this.implicit = implicit;
        typeof impersonatedServiceAccountPathOrObject === "string" ? ImpersonatedServiceAccount.validateFromPath(impersonatedServiceAccountPathOrObject) : ImpersonatedServiceAccount.validateFromJSON(impersonatedServiceAccountPathOrObject);
      }
      getGoogleAuth() {
        if (this.googleAuth) {
          return this.googleAuth;
        }
        const { auth, client } = populateGoogleAuth(this.impersonatedServiceAccountPathOrObject, this.httpAgent);
        this.googleAuth = auth;
        this.authClient = client;
        return this.googleAuth;
      }
      async getAccessToken() {
        const googleAuth = this.getGoogleAuth();
        if (this.authClient === void 0) {
          this.authClient = await googleAuth.getClient();
        }
        await this.authClient.getAccessToken();
        const credentials = this.authClient.credentials;
        return populateCredential(credentials);
      }
    };
    exports.ImpersonatedServiceAccountCredential = ImpersonatedServiceAccountCredential;
    var ImpersonatedServiceAccount = class _ImpersonatedServiceAccount {
      /*
       * Tries to load a ImpersonatedServiceAccount from a path. Throws if the path doesn't exist or the
       * data at the path is invalid.
       */
      static validateFromPath(filePath) {
        try {
          _ImpersonatedServiceAccount.validateFromJSON(JSON.parse(fs.readFileSync(filePath, "utf8")));
        } catch (error) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_CREDENTIAL,
            message: "Failed to parse impersonated service account file.",
            cause: error
          });
        }
      }
      static validateFromJSON(json) {
        const { client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, type } = json["source_credentials"];
        let errorMessage;
        if (!util.isNonEmptyString(clientId)) {
          errorMessage = 'Impersonated Service Account must contain a "source_credentials.client_id" property.';
        } else if (!util.isNonEmptyString(clientSecret)) {
          errorMessage = 'Impersonated Service Account must contain a "source_credentials.client_secret" property.';
        } else if (!util.isNonEmptyString(refreshToken)) {
          errorMessage = 'Impersonated Service Account must contain a "source_credentials.refresh_token" property.';
        } else if (!util.isNonEmptyString(type)) {
          errorMessage = 'Impersonated Service Account must contain a "source_credentials.type" property.';
        }
        if (typeof errorMessage !== "undefined") {
          throw new error_1.FirebaseAppError({ code: error_1.AppErrorCode.INVALID_CREDENTIAL, message: errorMessage });
        }
      }
    };
    function isApplicationDefault(credential) {
      return credential instanceof ApplicationDefaultCredential || credential instanceof RefreshTokenCredential && credential.implicit;
    }
    function getApplicationDefault(httpAgent) {
      return new ApplicationDefaultCredential(httpAgent);
    }
    function copyAttr(to, from, key, alt) {
      const tmp = from[key] || from[alt];
      if (typeof tmp !== "undefined") {
        to[key] = tmp;
      }
    }
    function populateGoogleAuth(keyFile, httpAgent) {
      let client;
      const auth = new google_auth_library_1.GoogleAuth({
        scopes: SCOPES,
        clientOptions: {
          transporterOptions: {
            agent: httpAgent
          }
        },
        keyFile: typeof keyFile === "string" ? keyFile : void 0
      });
      if (typeof keyFile === "object") {
        if (!util.isNonNullObject(keyFile)) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_CREDENTIAL,
            message: "Service account must be an object."
          });
        }
        copyAttr(keyFile, keyFile, "project_id", "projectId");
        copyAttr(keyFile, keyFile, "private_key", "privateKey");
        copyAttr(keyFile, keyFile, "client_email", "clientEmail");
        client = auth.fromJSON(keyFile);
      }
      return { auth, client };
    }
    function populateCredential(credentials) {
      const accessToken = credentials?.access_token;
      const expiryDate = credentials?.expiry_date;
      if (typeof accessToken !== "string")
        throw new error_1.FirebaseAppError({
          code: error_1.AppErrorCode.INVALID_CREDENTIAL,
          message: "Failed to parse Google auth credential: access_token must be a non empty string."
        });
      if (typeof expiryDate !== "number")
        throw new error_1.FirebaseAppError({
          code: error_1.AppErrorCode.INVALID_CREDENTIAL,
          message: "Failed to parse Google auth credential: Invalid expiry_date."
        });
      return {
        ...credentials,
        access_token: accessToken,
        // inverse operation of following
        // https://github.com/googleapis/google-auth-library-nodejs/blob/5ed910513451c82e2551777a3e2212964799ef8e/src/auth/baseexternalclient.ts#L446-L446
        expires_in: Math.floor((expiryDate - (/* @__PURE__ */ new Date()).getTime()) / 1e3)
      };
    }
  }
});

// node_modules/firebase-admin/package.json
var require_package = __commonJS({
  "node_modules/firebase-admin/package.json"(exports, module) {
    module.exports = {
      name: "firebase-admin",
      version: "14.5.0",
      description: "Firebase admin SDK for Node.js",
      author: "Firebase <firebase-support@google.com> (https://firebase.google.com/)",
      license: "Apache-2.0",
      homepage: "https://firebase.google.com/",
      engines: {
        node: ">=22"
      },
      scripts: {
        build: "gulp build",
        "build:tests": "gulp compile_test",
        prepare: "npm run build && npm run esm-wrap",
        lint: "run-p lint:src lint:test",
        test: "run-s lint test:unit",
        integration: "run-s build test:integration",
        "test:unit": "mocha test/unit/*.spec.ts --require ts-node/register",
        "test:integration": "mocha test/integration/*.ts --slow 5000 --timeout 20000 --require ts-node/register",
        "test:coverage": "nyc npm run test:unit",
        "lint:src": "eslint src/",
        "lint:src:fix": "eslint src/ --fix",
        "lint:test": "eslint test/",
        "lint:test:fix": "eslint test/ --fix",
        apidocs: "run-s api-extractor:local api-documenter",
        "api-extractor": "node generate-reports.js",
        "api-extractor:local": "npm run build && node generate-reports.js --local",
        "esm-wrap": "node generate-esm-wrapper.js",
        "api-documenter": "run-s api-documenter:markdown api-documenter:toc api-documenter:post",
        "api-documenter:markdown": "api-documenter-fire markdown --input temp --output docgen/markdown -s --project admin",
        "api-documenter:toc": "api-documenter-fire toc --input temp --output docgen/markdown -p /docs/reference/admin/node -s",
        "api-documenter:post": "node docgen/post-process.js"
      },
      nyc: {
        extension: [
          ".ts"
        ],
        include: [
          "src"
        ],
        exclude: [
          "**/*.d.ts"
        ],
        all: true
      },
      keywords: [
        "admin",
        "database",
        "Firebase",
        "realtime",
        "authentication"
      ],
      repository: {
        type: "git",
        url: "https://github.com/firebase/firebase-admin-node"
      },
      main: "lib/index.js",
      files: [
        "lib/",
        "LICENSE",
        "README.md",
        "package.json"
      ],
      types: "./lib/index.d.ts",
      typesVersions: {
        "*": {
          app: [
            "lib/app"
          ],
          "app-check": [
            "lib/app-check"
          ],
          auth: [
            "lib/auth"
          ],
          "phone-number-verification": [
            "lib/phone-number-verification"
          ],
          eventarc: [
            "lib/eventarc"
          ],
          extensions: [
            "lib/extensions"
          ],
          database: [
            "lib/database"
          ],
          "data-connect": [
            "lib/data-connect"
          ],
          firestore: [
            "lib/firestore"
          ],
          functions: [
            "lib/functions"
          ],
          installations: [
            "lib/installations"
          ],
          "machine-learning": [
            "lib/machine-learning"
          ],
          messaging: [
            "lib/messaging"
          ],
          "project-management": [
            "lib/project-management"
          ],
          "remote-config": [
            "lib/remote-config"
          ],
          "security-rules": [
            "lib/security-rules"
          ],
          storage: [
            "lib/storage"
          ]
        }
      },
      exports: {
        ".": "./lib/index.js",
        "./app": {
          types: "./lib/app/index.d.ts",
          require: "./lib/app/index.js",
          import: "./lib/esm/app/index.js"
        },
        "./app-check": {
          types: "./lib/app-check/index.d.ts",
          require: "./lib/app-check/index.js",
          import: "./lib/esm/app-check/index.js"
        },
        "./auth": {
          types: "./lib/auth/index.d.ts",
          require: "./lib/auth/index.js",
          import: "./lib/esm/auth/index.js"
        },
        "./phone-number-verification": {
          types: "./lib/phone-number-verification/index.d.ts",
          require: "./lib/phone-number-verification/index.js",
          import: "./lib/esm/phone-number-verification/index.js"
        },
        "./database": {
          types: "./lib/database/index.d.ts",
          require: "./lib/database/index.js",
          import: "./lib/esm/database/index.js"
        },
        "./data-connect": {
          types: "./lib/data-connect/index.d.ts",
          require: "./lib/data-connect/index.js",
          import: "./lib/esm/data-connect/index.js"
        },
        "./eventarc": {
          types: "./lib/eventarc/index.d.ts",
          require: "./lib/eventarc/index.js",
          import: "./lib/esm/eventarc/index.js"
        },
        "./extensions": {
          types: "./lib/extensions/index.d.ts",
          require: "./lib/extensions/index.js",
          import: "./lib/esm/extensions/index.js"
        },
        "./firestore": {
          types: "./lib/firestore/index.d.ts",
          require: "./lib/firestore/index.js",
          import: "./lib/esm/firestore/index.js"
        },
        "./functions": {
          types: "./lib/functions/index.d.ts",
          require: "./lib/functions/index.js",
          import: "./lib/esm/functions/index.js"
        },
        "./installations": {
          types: "./lib/installations/index.d.ts",
          require: "./lib/installations/index.js",
          import: "./lib/esm/installations/index.js"
        },
        "./machine-learning": {
          types: "./lib/machine-learning/index.d.ts",
          require: "./lib/machine-learning/index.js",
          import: "./lib/esm/machine-learning/index.js"
        },
        "./messaging": {
          types: "./lib/messaging/index.d.ts",
          require: "./lib/messaging/index.js",
          import: "./lib/esm/messaging/index.js"
        },
        "./project-management": {
          types: "./lib/project-management/index.d.ts",
          require: "./lib/project-management/index.js",
          import: "./lib/esm/project-management/index.js"
        },
        "./remote-config": {
          types: "./lib/remote-config/index.d.ts",
          require: "./lib/remote-config/index.js",
          import: "./lib/esm/remote-config/index.js"
        },
        "./security-rules": {
          types: "./lib/security-rules/index.d.ts",
          require: "./lib/security-rules/index.js",
          import: "./lib/esm/security-rules/index.js"
        },
        "./storage": {
          types: "./lib/storage/index.d.ts",
          require: "./lib/storage/index.js",
          import: "./lib/esm/storage/index.js"
        }
      },
      dependencies: {
        "@fastify/busboy": "^3.0.0",
        "@firebase/database-compat": "^2.1.4",
        "@firebase/database-types": "^1.0.20",
        "fast-deep-equal": "^3.1.1",
        "google-auth-library": "^11.1.0",
        jsonwebtoken: "^9.0.0",
        "jwks-rsa": "^4.0.1"
      },
      optionalDependencies: {
        "@google-cloud/firestore": "^9.1.0",
        "@google-cloud/storage": "^8.1.0"
      },
      devDependencies: {
        "@eslint/js": "^10.0.1",
        "@firebase/api-documenter": "^0.5.0",
        "@firebase/app-compat": "^0.5.12",
        "@firebase/auth-compat": "^0.6.6",
        "@firebase/auth-types": "^0.13.1",
        "@microsoft/api-extractor": "^7.11.2",
        "@types/bcrypt": "^6.0.0",
        "@types/chai": "^4.0.0",
        "@types/chai-as-promised": "^7.1.0",
        "@types/firebase-token-generator": "^2.0.28",
        "@types/jsonwebtoken": "8.5.9",
        "@types/lodash": "^4.14.104",
        "@types/minimist": "^1.2.2",
        "@types/mocha": "^10.0.0",
        "@types/nock": "^11.1.0",
        "@types/node": "^26.0.0",
        "@types/sinon": "^22.0.0",
        "@types/sinon-chai": "^3.0.0",
        "@typescript-eslint/eslint-plugin": "^8.67.0",
        "@typescript-eslint/parser": "^8.67.0",
        bcrypt: "^6.0.0",
        chai: "^4.2.0",
        "chai-as-promised": "^7.0.0",
        "chai-exclude": "^2.1.0",
        chalk: "^4.1.1",
        "child-process-promise": "^2.2.1",
        del: "^6.0.0",
        eslint: "^10.3.0",
        "firebase-token-generator": "^2.0.0",
        globals: "^17.6.0",
        gulp: "^5.0.0",
        "gulp-filter": "^7.0.0",
        "gulp-header": "^2.0.9",
        "gulp-typescript": "^5.0.1",
        "http-message-parser": "^0.0.34",
        lodash: "^4.17.15",
        minimist: "^1.2.6",
        mocha: "^11.0.0",
        mz: "^2.7.0",
        nock: "^14.0.15",
        "npm-run-all": "^4.1.5",
        nyc: "^18.0.0",
        "run-sequence": "^2.2.1",
        sinon: "^22.0.0",
        "sinon-chai": "^3.0.0",
        "ts-node": "^10.2.0",
        typescript: "^5.7.3",
        "typescript-eslint": "^8.67.0",
        yargs: "^17.0.1"
      }
    };
  }
});

// node_modules/firebase-admin/lib/utils/index.js
var require_utils = __commonJS({
  "node_modules/firebase-admin/lib/utils/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSdkVersion = getSdkVersion;
    exports.getMetricsHeader = getMetricsHeader;
    exports.renameProperties = renameProperties;
    exports.addReadonlyGetter = addReadonlyGetter;
    exports.getExplicitProjectId = getExplicitProjectId;
    exports.findProjectId = findProjectId;
    exports.getExplicitServiceAccountEmail = getExplicitServiceAccountEmail;
    exports.findServiceAccountEmail = findServiceAccountEmail;
    exports.toWebSafeBase64 = toWebSafeBase64;
    exports.formatString = formatString;
    exports.generateUpdateMask = generateUpdateMask;
    exports.transformMillisecondsToSecondsString = transformMillisecondsToSecondsString;
    exports.parseResourceName = parseResourceName;
    var credential_internal_1 = require_credential_internal();
    var validator = require_validator();
    var sdkVersion;
    function getSdkVersion() {
      if (!sdkVersion) {
        const { version } = require_package();
        sdkVersion = version;
      }
      return sdkVersion;
    }
    function getMetricsHeader() {
      return `gl-node/${process.versions.node} fire-admin/${getSdkVersion()}`;
    }
    function renameProperties(obj, keyMap) {
      Object.keys(keyMap).forEach((oldKey) => {
        if (oldKey in obj) {
          const newKey = keyMap[oldKey];
          obj[newKey] = obj[oldKey];
          delete obj[oldKey];
        }
      });
    }
    function addReadonlyGetter(obj, prop, value) {
      Object.defineProperty(obj, prop, {
        value,
        // Make this property read-only.
        writable: false,
        // Include this property during enumeration of obj's properties.
        enumerable: true
      });
    }
    function getExplicitProjectId(app) {
      const options = app.options;
      if (validator.isNonEmptyString(options.projectId)) {
        return options.projectId;
      }
      const credential = app.options.credential;
      if (credential instanceof credential_internal_1.ServiceAccountCredential) {
        return credential.projectId;
      }
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
      if (validator.isNonEmptyString(projectId)) {
        return projectId;
      }
      return null;
    }
    function findProjectId(app) {
      const projectId = getExplicitProjectId(app);
      if (projectId) {
        return Promise.resolve(projectId);
      }
      const credential = app.options.credential;
      if (credential instanceof credential_internal_1.ApplicationDefaultCredential) {
        return credential.getProjectId();
      }
      return Promise.resolve(null);
    }
    function getExplicitServiceAccountEmail(app) {
      const options = app.options;
      if (validator.isNonEmptyString(options.serviceAccountId)) {
        return options.serviceAccountId;
      }
      const credential = app.options.credential;
      if (credential instanceof credential_internal_1.ServiceAccountCredential) {
        return credential.clientEmail;
      }
      return null;
    }
    function findServiceAccountEmail(app) {
      const accountId = getExplicitServiceAccountEmail(app);
      if (accountId) {
        return Promise.resolve(accountId);
      }
      const credential = app.options.credential;
      if (credential instanceof credential_internal_1.ApplicationDefaultCredential) {
        return credential.getServiceAccountEmail();
      }
      return Promise.resolve(null);
    }
    function toWebSafeBase64(data) {
      return data.toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
    }
    function formatString(str, params) {
      let formatted = str;
      Object.keys(params || {}).forEach((key) => {
        formatted = formatted.replace(new RegExp("{" + key + "}", "g"), params[key]);
      });
      return formatted;
    }
    function generateUpdateMask(obj, terminalPaths = [], root = "") {
      const updateMask = [];
      if (!validator.isNonNullObject(obj)) {
        return updateMask;
      }
      for (const key in obj) {
        if (typeof obj[key] !== "undefined") {
          const nextPath = root ? `${root}.${key}` : key;
          if (terminalPaths.indexOf(nextPath) !== -1) {
            updateMask.push(key);
          } else {
            const maskList = generateUpdateMask(obj[key], terminalPaths, nextPath);
            if (maskList.length > 0) {
              maskList.forEach((mask) => {
                updateMask.push(`${key}.${mask}`);
              });
            } else {
              updateMask.push(key);
            }
          }
        }
      }
      return updateMask;
    }
    function transformMillisecondsToSecondsString(milliseconds) {
      let duration;
      const seconds = Math.floor(milliseconds / 1e3);
      const nanos = Math.floor((milliseconds - seconds * 1e3) * 1e6);
      if (nanos > 0) {
        let nanoString = nanos.toString();
        while (nanoString.length < 9) {
          nanoString = "0" + nanoString;
        }
        duration = `${seconds}.${nanoString}s`;
      } else {
        duration = `${seconds}s`;
      }
      return duration;
    }
    function parseResourceName(resourceName, resourceIdKey) {
      if (!resourceName.includes("/")) {
        return { resourceId: resourceName };
      }
      const CHANNEL_NAME_REGEX = new RegExp(`^(projects/([^/]+)/)?locations/([^/]+)/${resourceIdKey}/([^/]+)$`);
      const match = CHANNEL_NAME_REGEX.exec(resourceName);
      if (match === null) {
        throw new Error("Invalid resource name format.");
      }
      const projectId = match[2];
      const locationId = match[3];
      const resourceId = match[4];
      return { projectId, locationId, resourceId };
    }
  }
});

// node_modules/firebase-admin/lib/utils/deep-copy.js
var require_deep_copy = __commonJS({
  "node_modules/firebase-admin/lib/utils/deep-copy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deepCopy = deepCopy;
    exports.deepExtend = deepExtend;
    function deepCopy(value) {
      return deepExtend(void 0, value);
    }
    function deepExtend(target, source) {
      if (!(source instanceof Object)) {
        return source;
      }
      switch (source.constructor) {
        case Date: {
          const dateValue = source;
          return new Date(dateValue.getTime());
        }
        case Object:
          if (target === void 0) {
            target = {};
          }
          break;
        case Array:
          target = [];
          break;
        default:
          return source;
      }
      for (const prop in source) {
        if (!Object.prototype.hasOwnProperty.call(source, prop)) {
          continue;
        }
        target[prop] = deepExtend(target[prop], source[prop]);
      }
      return target;
    }
  }
});

// node_modules/firebase-admin/lib/app/firebase-app.js
var require_firebase_app = __commonJS({
  "node_modules/firebase-admin/lib/app/firebase-app.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirebaseApp = exports.FirebaseAppInternals = void 0;
    var credential_internal_1 = require_credential_internal();
    var validator = require_validator();
    var deep_copy_1 = require_deep_copy();
    var error_1 = require_error2();
    var TOKEN_EXPIRY_THRESHOLD_MILLIS = 5 * 60 * 1e3;
    var FirebaseAppInternals = class {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      constructor(credential_) {
        this.credential_ = credential_;
        this.tokenListeners_ = [];
        this.isRefreshing = false;
      }
      getToken(forceRefresh = false) {
        if (forceRefresh || this.shouldRefresh()) {
          this.promiseToCachedToken_ = this.refreshToken();
        }
        return this.promiseToCachedToken_;
      }
      getCachedToken() {
        return this.cachedToken_ || null;
      }
      refreshToken() {
        this.isRefreshing = true;
        return Promise.resolve(this.credential_.getAccessToken()).then((result) => {
          if (!validator.isNonNullObject(result) || typeof result.expires_in !== "number" || typeof result.access_token !== "string") {
            throw new error_1.FirebaseAppError({
              code: error_1.AppErrorCode.INVALID_CREDENTIAL,
              message: `Invalid access token generated: "${JSON.stringify(result)}". Valid access tokens must be an object with the "expires_in" (number) and "access_token" (string) properties.`
            });
          }
          const token = {
            accessToken: result.access_token,
            expirationTime: Date.now() + result.expires_in * 1e3
          };
          if (!this.cachedToken_ || this.cachedToken_.accessToken !== token.accessToken || this.cachedToken_.expirationTime !== token.expirationTime) {
            this.cachedToken_ = token;
            this.tokenListeners_.forEach((listener) => {
              listener(token.accessToken);
            });
          }
          return token;
        }).catch((error) => {
          let errorMessage = typeof error === "string" ? error : error.message;
          errorMessage = `Credential implementation provided to initializeApp() via the "credential" property failed to fetch a valid Google OAuth2 access token with the following error: "${errorMessage}".`;
          if (errorMessage.indexOf("invalid_grant") !== -1) {
            errorMessage += " There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk.";
          }
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_CREDENTIAL,
            message: errorMessage,
            cause: error
          });
        }).finally(() => {
          this.isRefreshing = false;
        });
      }
      shouldRefresh() {
        return (!this.cachedToken_ || this.cachedToken_.expirationTime - Date.now() <= TOKEN_EXPIRY_THRESHOLD_MILLIS) && !this.isRefreshing;
      }
      /**
       * Adds a listener that is called each time a token changes.
       *
       * @param listener - The listener that will be called with each new token.
       */
      addAuthTokenListener(listener) {
        this.tokenListeners_.push(listener);
        if (this.cachedToken_) {
          listener(this.cachedToken_.accessToken);
        }
      }
      /**
       * Removes a token listener.
       *
       * @param listener - The listener to remove.
       */
      removeAuthTokenListener(listener) {
        this.tokenListeners_ = this.tokenListeners_.filter((other) => other !== listener);
      }
    };
    exports.FirebaseAppInternals = FirebaseAppInternals;
    var FirebaseApp = class {
      constructor(options, name, autoInit = false, appStore) {
        this.appStore = appStore;
        this.services_ = {};
        this.isDeleted_ = false;
        this.autoInit_ = false;
        this.customCredential_ = true;
        this.name_ = name;
        this.options_ = (0, deep_copy_1.deepCopy)(options);
        this.autoInit_ = autoInit;
        if (!validator.isNonNullObject(this.options_)) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_APP_OPTIONS,
            message: `Invalid Firebase app options passed as the first argument to initializeApp() for the app named "${this.name_}". Options must be a non-null object.`
          });
        }
        const hasCredential = "credential" in this.options_;
        if (!hasCredential) {
          this.customCredential_ = false;
          this.options_.credential = (0, credential_internal_1.getApplicationDefault)(this.options_.httpAgent);
        }
        const credential = this.options_.credential;
        if (typeof credential !== "object" || credential === null || typeof credential.getAccessToken !== "function") {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_APP_OPTIONS,
            message: `Invalid Firebase app options passed as the first argument to initializeApp() for the app named "${this.name_}". The "credential" property must be an object which implements the Credential interface.`
          });
        }
        this.INTERNAL = new FirebaseAppInternals(credential);
      }
      /**
       * Returns the name of the FirebaseApp instance.
       *
       * @returns The name of the FirebaseApp instance.
       */
      get name() {
        this.checkDestroyed_();
        return this.name_;
      }
      /**
       * Returns the options for the FirebaseApp instance.
       *
       * @returns The options for the FirebaseApp instance.
       */
      get options() {
        this.checkDestroyed_();
        return (0, deep_copy_1.deepCopy)(this.options_);
      }
      /**
       * @internal
       */
      getOrInitService(name, init) {
        return this.ensureService_(name, () => init(this));
      }
      /**
       * Returns `true` if this app was initialized with auto-initialization.
       *
       * @internal
       */
      autoInit() {
        return this.autoInit_;
      }
      /**
       * Returns `true` if the `FirebaseApp` instance was initialized with a custom
       * `Credential`.
       *
       * @internal
       */
      customCredential() {
        return this.customCredential_;
      }
      /**
       * Deletes the FirebaseApp instance.
       *
       * @returns An empty Promise fulfilled once the FirebaseApp instance is deleted.
       */
      delete() {
        this.checkDestroyed_();
        this.appStore?.removeApp(this.name);
        return Promise.all(Object.keys(this.services_).map((serviceName) => {
          const service = this.services_[serviceName];
          if (isStateful(service)) {
            return service.delete();
          }
          return Promise.resolve();
        })).then(() => {
          this.services_ = {};
          this.isDeleted_ = true;
        });
      }
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ensureService_(serviceName, initializer) {
        this.checkDestroyed_();
        if (!(serviceName in this.services_)) {
          this.services_[serviceName] = initializer();
        }
        return this.services_[serviceName];
      }
      /**
       * Throws an Error if the FirebaseApp instance has already been deleted.
       */
      // eslint-disable-next-line @typescript-eslint/naming-convention
      checkDestroyed_() {
        if (this.isDeleted_) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.APP_DELETED,
            message: `Firebase app named "${this.name_}" has already been deleted.`
          });
        }
      }
    };
    exports.FirebaseApp = FirebaseApp;
    function isStateful(service) {
      return typeof service.delete === "function";
    }
  }
});

// node_modules/firebase-admin/lib/app/lifecycle.js
var require_lifecycle = __commonJS({
  "node_modules/firebase-admin/lib/app/lifecycle.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FIREBASE_CONFIG_VAR = exports.defaultAppStore = exports.AppStore = void 0;
    exports.initializeApp = initializeApp2;
    exports.getApp = getApp2;
    exports.getApps = getApps2;
    exports.deleteApp = deleteApp;
    var fs = __require("fs");
    var validator = require_validator();
    var error_1 = require_error2();
    var credential_internal_1 = require_credential_internal();
    var firebase_app_1 = require_firebase_app();
    var fastDeepEqual = __require("fast-deep-equal");
    var DEFAULT_APP_NAME = "[DEFAULT]";
    var AppStore = class {
      constructor() {
        this.appStore = /* @__PURE__ */ new Map();
      }
      initializeApp(options, appName = DEFAULT_APP_NAME) {
        validateAppNameFormat(appName);
        let autoInit = false;
        if (typeof options === "undefined") {
          autoInit = true;
          options = loadOptionsFromEnvVar();
          options.credential = (0, credential_internal_1.getApplicationDefault)();
        }
        if (!this.appStore.has(appName)) {
          const app = new firebase_app_1.FirebaseApp(options, appName, autoInit, this);
          this.appStore.set(app.name, app);
          return app;
        }
        const currentApp = this.appStore.get(appName);
        if (currentApp.autoInit() !== autoInit) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.INVALID_APP_OPTIONS,
            message: `A Firebase app named "${appName}" already exists with a different configuration.`
          });
        }
        if (autoInit) {
          return currentApp;
        }
        validateAppOptionsSupportDeepEquals(options, currentApp);
        const currentAppOptions = { ...currentApp.options };
        delete currentAppOptions.credential;
        if (!fastDeepEqual(options, currentAppOptions)) {
          throw new error_1.FirebaseAppError({
            code: error_1.AppErrorCode.DUPLICATE_APP,
            message: `A Firebase app named "${appName}" already exists with a different configuration.`
          });
        }
        return currentApp;
      }
      getApp(appName = DEFAULT_APP_NAME) {
        validateAppNameFormat(appName);
        if (!this.appStore.has(appName)) {
          let errorMessage = appName === DEFAULT_APP_NAME ? "The default Firebase app does not exist. " : `Firebase app named "${appName}" does not exist. `;
          errorMessage += "Make sure you call initializeApp() before using any of the Firebase services.";
          throw new error_1.FirebaseAppError({ code: error_1.AppErrorCode.NO_APP, message: errorMessage });
        }
        return this.appStore.get(appName);
      }
      getApps() {
        return Array.from(this.appStore.values());
      }
      deleteApp(app) {
        if (typeof app !== "object" || app === null || !("options" in app)) {
          throw new error_1.FirebaseAppError({ code: error_1.AppErrorCode.INVALID_ARGUMENT, message: "Invalid app argument." });
        }
        const existingApp = getApp2(app.name);
        return existingApp.delete();
      }
      clearAllApps() {
        const promises = [];
        this.getApps().forEach((app) => {
          promises.push(this.deleteApp(app));
        });
        return Promise.all(promises).then();
      }
      /**
       * Removes the specified App instance from the store. This is currently called by the
       * {@link FirebaseApp.delete} method. Can be removed once the app deletion is handled
       * entirely by the {@link deleteApp} top-level function.
       */
      removeApp(appName) {
        this.appStore.delete(appName);
      }
    };
    exports.AppStore = AppStore;
    function validateAppOptionsSupportDeepEquals(requestedOptions, existingApp) {
      if (typeof requestedOptions.httpAgent !== "undefined") {
        throw new error_1.FirebaseAppError({
          code: error_1.AppErrorCode.INVALID_APP_OPTIONS,
          message: `Firebase app named "${existingApp.name}" already exists and initializeApp was invoked with an optional http.Agent. The SDK cannot confirm the equality of http.Agent objects with the existing app. Please use getApp or getApps to reuse the existing app instead.`
        });
      } else if (typeof existingApp.options.httpAgent !== "undefined") {
        throw new error_1.FirebaseAppError({
          code: error_1.AppErrorCode.INVALID_APP_OPTIONS,
          message: `An existing app named "${existingApp.name}" already exists with a different options configuration: httpAgent.`
        });
      }
      if (typeof requestedOptions.credential !== "undefined") {
        throw new error_1.FirebaseAppError({
          code: error_1.AppErrorCode.INVALID_APP_OPTIONS,
          message: `Firebase app named "${existingApp.name}" already exists and initializeApp was invoked with an optional Credential. The SDK cannot confirm the equality of Credential objects with the existing app. Please use getApp or getApps to reuse the existing app instead.`
        });
      }
      if (existingApp.customCredential()) {
        throw new error_1.FirebaseAppError({
          code: error_1.AppErrorCode.INVALID_APP_OPTIONS,
          message: `An existing app named "${existingApp.name}" already exists with a different options configuration: Credential.`
        });
      }
    }
    function validateAppNameFormat(appName) {
      if (!validator.isNonEmptyString(appName)) {
        throw new error_1.FirebaseAppError({
          code: error_1.AppErrorCode.INVALID_APP_NAME,
          message: `Invalid Firebase app name "${appName}" provided. App name must be a non-empty string.`
        });
      }
    }
    exports.defaultAppStore = new AppStore();
    function initializeApp2(options, appName = DEFAULT_APP_NAME) {
      return exports.defaultAppStore.initializeApp(options, appName);
    }
    function getApp2(appName = DEFAULT_APP_NAME) {
      return exports.defaultAppStore.getApp(appName);
    }
    function getApps2() {
      return exports.defaultAppStore.getApps();
    }
    function deleteApp(app) {
      return exports.defaultAppStore.deleteApp(app);
    }
    exports.FIREBASE_CONFIG_VAR = "FIREBASE_CONFIG";
    function loadOptionsFromEnvVar() {
      const config2 = process.env[exports.FIREBASE_CONFIG_VAR];
      if (!validator.isNonEmptyString(config2)) {
        return {};
      }
      try {
        const contents = config2.startsWith("{") ? config2 : fs.readFileSync(config2, "utf8");
        return JSON.parse(contents);
      } catch (error) {
        throw new error_1.FirebaseAppError({
          code: error_1.AppErrorCode.INVALID_APP_OPTIONS,
          message: `Failed to parse app options file: ${error.message}`,
          cause: error
        });
      }
    }
  }
});

// node_modules/firebase-admin/lib/app/credential-factory.js
var require_credential_factory = __commonJS({
  "node_modules/firebase-admin/lib/app/credential-factory.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applicationDefault = applicationDefault2;
    exports.cert = cert2;
    exports.refreshToken = refreshToken;
    exports.clearGlobalAppDefaultCred = clearGlobalAppDefaultCred;
    var credential_internal_1 = require_credential_internal();
    var globalAppDefaultCred;
    var globalCertCreds = {};
    var globalRefreshTokenCreds = {};
    function applicationDefault2(httpAgent) {
      if (typeof globalAppDefaultCred === "undefined") {
        globalAppDefaultCred = (0, credential_internal_1.getApplicationDefault)(httpAgent);
      }
      return globalAppDefaultCred;
    }
    function cert2(serviceAccountPathOrObject, httpAgent) {
      const stringifiedServiceAccount = JSON.stringify(serviceAccountPathOrObject);
      if (!(stringifiedServiceAccount in globalCertCreds)) {
        globalCertCreds[stringifiedServiceAccount] = new credential_internal_1.ServiceAccountCredential(serviceAccountPathOrObject, httpAgent);
      }
      return globalCertCreds[stringifiedServiceAccount];
    }
    function refreshToken(refreshTokenPathOrObject, httpAgent) {
      const stringifiedRefreshToken = JSON.stringify(refreshTokenPathOrObject);
      if (!(stringifiedRefreshToken in globalRefreshTokenCreds)) {
        globalRefreshTokenCreds[stringifiedRefreshToken] = new credential_internal_1.RefreshTokenCredential(refreshTokenPathOrObject, httpAgent);
      }
      return globalRefreshTokenCreds[stringifiedRefreshToken];
    }
    function clearGlobalAppDefaultCred() {
      globalAppDefaultCred = void 0;
    }
  }
});

// node_modules/firebase-admin/lib/app/index.js
var require_app = __commonJS({
  "node_modules/firebase-admin/lib/app/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SDK_VERSION = exports.AppErrorCode = exports.FirebaseAppError = exports.FirebaseError = exports.refreshToken = exports.cert = exports.applicationDefault = exports.deleteApp = exports.getApps = exports.getApp = exports.initializeApp = void 0;
    var utils_1 = require_utils();
    var lifecycle_1 = require_lifecycle();
    Object.defineProperty(exports, "initializeApp", { enumerable: true, get: function() {
      return lifecycle_1.initializeApp;
    } });
    Object.defineProperty(exports, "getApp", { enumerable: true, get: function() {
      return lifecycle_1.getApp;
    } });
    Object.defineProperty(exports, "getApps", { enumerable: true, get: function() {
      return lifecycle_1.getApps;
    } });
    Object.defineProperty(exports, "deleteApp", { enumerable: true, get: function() {
      return lifecycle_1.deleteApp;
    } });
    var credential_factory_1 = require_credential_factory();
    Object.defineProperty(exports, "applicationDefault", { enumerable: true, get: function() {
      return credential_factory_1.applicationDefault;
    } });
    Object.defineProperty(exports, "cert", { enumerable: true, get: function() {
      return credential_factory_1.cert;
    } });
    Object.defineProperty(exports, "refreshToken", { enumerable: true, get: function() {
      return credential_factory_1.refreshToken;
    } });
    var error_1 = require_error();
    Object.defineProperty(exports, "FirebaseError", { enumerable: true, get: function() {
      return error_1.FirebaseError;
    } });
    var error_2 = require_error2();
    Object.defineProperty(exports, "FirebaseAppError", { enumerable: true, get: function() {
      return error_2.FirebaseAppError;
    } });
    Object.defineProperty(exports, "AppErrorCode", { enumerable: true, get: function() {
      return error_2.AppErrorCode;
    } });
    exports.SDK_VERSION = (0, utils_1.getSdkVersion)();
  }
});

// node_modules/firebase-admin/lib/auth/error.js
var require_error3 = __commonJS({
  "node_modules/firebase-admin/lib/auth/error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirebaseAuthError = exports.authClientErrorCode = exports.AuthErrorCode = void 0;
    var error_1 = require_error();
    var deep_copy_1 = require_deep_copy();
    exports.AuthErrorCode = {
      AUTH_BLOCKING_TOKEN_EXPIRED: "auth-blocking-token-expired",
      BILLING_NOT_ENABLED: "billing-not-enabled",
      CLAIMS_TOO_LARGE: "claims-too-large",
      CONFIGURATION_EXISTS: "configuration-exists",
      CONFIGURATION_NOT_FOUND: "configuration-not-found",
      ID_TOKEN_EXPIRED: "id-token-expired",
      INVALID_ARGUMENT: "argument-error",
      INVALID_CONFIG: "invalid-config",
      EMAIL_ALREADY_EXISTS: "email-already-exists",
      EMAIL_NOT_FOUND: "email-not-found",
      FORBIDDEN_CLAIM: "reserved-claim",
      INVALID_ID_TOKEN: "invalid-id-token",
      ID_TOKEN_REVOKED: "id-token-revoked",
      INTERNAL_ERROR: "internal-error",
      INVALID_CLAIMS: "invalid-claims",
      INVALID_CONTINUE_URI: "invalid-continue-uri",
      INVALID_CREATION_TIME: "invalid-creation-time",
      INVALID_CREDENTIAL: "invalid-credential",
      INVALID_DISABLED_FIELD: "invalid-disabled-field",
      INVALID_DISPLAY_NAME: "invalid-display-name",
      INVALID_DYNAMIC_LINK_DOMAIN: "invalid-dynamic-link-domain",
      INVALID_HOSTING_LINK_DOMAIN: "invalid-hosting-link-domain",
      INVALID_EMAIL_VERIFIED: "invalid-email-verified",
      INVALID_EMAIL: "invalid-email",
      INVALID_NEW_EMAIL: "invalid-new-email",
      INVALID_ENROLLED_FACTORS: "invalid-enrolled-factors",
      INVALID_ENROLLMENT_TIME: "invalid-enrollment-time",
      INVALID_HASH_ALGORITHM: "invalid-hash-algorithm",
      INVALID_HASH_BLOCK_SIZE: "invalid-hash-block-size",
      INVALID_HASH_DERIVED_KEY_LENGTH: "invalid-hash-derived-key-length",
      INVALID_HASH_KEY: "invalid-hash-key",
      INVALID_HASH_MEMORY_COST: "invalid-hash-memory-cost",
      INVALID_HASH_PARALLELIZATION: "invalid-hash-parallelization",
      INVALID_HASH_ROUNDS: "invalid-hash-rounds",
      INVALID_HASH_SALT_SEPARATOR: "invalid-hash-salt-separator",
      INVALID_LAST_SIGN_IN_TIME: "invalid-last-sign-in-time",
      INVALID_NAME: "invalid-name",
      INVALID_OAUTH_CLIENT_ID: "invalid-oauth-client-id",
      INVALID_PAGE_TOKEN: "invalid-page-token",
      INVALID_PASSWORD: "invalid-password",
      INVALID_PASSWORD_HASH: "invalid-password-hash",
      INVALID_PASSWORD_SALT: "invalid-password-salt",
      INVALID_PHONE_NUMBER: "invalid-phone-number",
      INVALID_PHOTO_URL: "invalid-photo-url",
      INVALID_PROJECT_ID: "invalid-project-id",
      INVALID_PROVIDER_DATA: "invalid-provider-data",
      INVALID_PROVIDER_ID: "invalid-provider-id",
      INVALID_PROVIDER_UID: "invalid-provider-uid",
      INVALID_OAUTH_RESPONSETYPE: "invalid-oauth-responsetype",
      INVALID_SESSION_COOKIE_DURATION: "invalid-session-cookie-duration",
      INVALID_TENANT_ID: "invalid-tenant-id",
      INVALID_TENANT_TYPE: "invalid-tenant-type",
      INVALID_TESTING_PHONE_NUMBER: "invalid-testing-phone-number",
      INVALID_UID: "invalid-uid",
      INVALID_USER_IMPORT: "invalid-user-import",
      INVALID_TOKENS_VALID_AFTER_TIME: "invalid-tokens-valid-after-time",
      MISMATCHING_TENANT_ID: "mismatching-tenant-id",
      MISSING_ANDROID_PACKAGE_NAME: "missing-android-package-name",
      MISSING_CONFIG: "missing-config",
      MISSING_CONTINUE_URI: "missing-continue-uri",
      MISSING_DISPLAY_NAME: "missing-display-name",
      MISSING_EMAIL: "missing-email",
      MISSING_IOS_BUNDLE_ID: "missing-ios-bundle-id",
      MISSING_ISSUER: "missing-issuer",
      MISSING_HASH_ALGORITHM: "missing-hash-algorithm",
      MISSING_OAUTH_CLIENT_ID: "missing-oauth-client-id",
      MISSING_OAUTH_CLIENT_SECRET: "missing-oauth-client-secret",
      MISSING_PROVIDER_ID: "missing-provider-id",
      MISSING_SAML_RELYING_PARTY_CONFIG: "missing-saml-relying-party-config",
      MAXIMUM_TEST_PHONE_NUMBER_EXCEEDED: "test-phone-number-limit-exceeded",
      MAXIMUM_USER_COUNT_EXCEEDED: "maximum-user-count-exceeded",
      MISSING_UID: "missing-uid",
      OPERATION_NOT_ALLOWED: "operation-not-allowed",
      PHONE_NUMBER_ALREADY_EXISTS: "phone-number-already-exists",
      PROJECT_NOT_FOUND: "project-not-found",
      INSUFFICIENT_PERMISSION: "insufficient-permission",
      QUOTA_EXCEEDED: "quota-exceeded",
      SECOND_FACTOR_LIMIT_EXCEEDED: "second-factor-limit-exceeded",
      SECOND_FACTOR_UID_ALREADY_EXISTS: "second-factor-uid-already-exists",
      SESSION_COOKIE_EXPIRED: "session-cookie-expired",
      SESSION_COOKIE_REVOKED: "session-cookie-revoked",
      TENANT_NOT_FOUND: "tenant-not-found",
      UID_ALREADY_EXISTS: "uid-already-exists",
      UNAUTHORIZED_DOMAIN: "unauthorized-continue-uri",
      UNSUPPORTED_FIRST_FACTOR: "unsupported-first-factor",
      UNSUPPORTED_SECOND_FACTOR: "unsupported-second-factor",
      UNSUPPORTED_TENANT_OPERATION: "unsupported-tenant-operation",
      UNVERIFIED_EMAIL: "unverified-email",
      USER_NOT_FOUND: "user-not-found",
      NOT_FOUND: "not-found",
      USER_DISABLED: "user-disabled",
      USER_NOT_DISABLED: "user-not-disabled",
      INVALID_RECAPTCHA_ACTION: "invalid-recaptcha-action",
      INVALID_RECAPTCHA_ENFORCEMENT_STATE: "invalid-recaptcha-enforcement-state",
      RECAPTCHA_NOT_ENABLED: "recaptcha-not-enabled"
    };
    exports.authClientErrorCode = {
      AUTH_BLOCKING_TOKEN_EXPIRED: {
        code: exports.AuthErrorCode.AUTH_BLOCKING_TOKEN_EXPIRED,
        message: "The provided Firebase Auth Blocking token is expired."
      },
      BILLING_NOT_ENABLED: {
        code: exports.AuthErrorCode.BILLING_NOT_ENABLED,
        message: "Feature requires billing to be enabled."
      },
      CLAIMS_TOO_LARGE: {
        code: exports.AuthErrorCode.CLAIMS_TOO_LARGE,
        message: "Developer claims maximum payload size exceeded."
      },
      CONFIGURATION_EXISTS: {
        code: exports.AuthErrorCode.CONFIGURATION_EXISTS,
        message: "A configuration already exists with the provided identifier."
      },
      CONFIGURATION_NOT_FOUND: {
        code: exports.AuthErrorCode.CONFIGURATION_NOT_FOUND,
        message: "There is no configuration corresponding to the provided identifier."
      },
      ID_TOKEN_EXPIRED: {
        code: exports.AuthErrorCode.ID_TOKEN_EXPIRED,
        message: "The provided Firebase ID token is expired."
      },
      INVALID_ARGUMENT: {
        code: exports.AuthErrorCode.INVALID_ARGUMENT,
        message: "Invalid argument provided."
      },
      INVALID_CONFIG: {
        code: exports.AuthErrorCode.INVALID_CONFIG,
        message: "The provided configuration is invalid."
      },
      EMAIL_ALREADY_EXISTS: {
        code: exports.AuthErrorCode.EMAIL_ALREADY_EXISTS,
        message: "The email address is already in use by another account."
      },
      EMAIL_NOT_FOUND: {
        code: exports.AuthErrorCode.EMAIL_NOT_FOUND,
        message: "There is no user record corresponding to the provided email."
      },
      FORBIDDEN_CLAIM: {
        code: exports.AuthErrorCode.FORBIDDEN_CLAIM,
        message: "The specified developer claim is reserved and cannot be specified."
      },
      INVALID_ID_TOKEN: {
        code: exports.AuthErrorCode.INVALID_ID_TOKEN,
        message: "The provided ID token is not a valid Firebase ID token."
      },
      ID_TOKEN_REVOKED: {
        code: exports.AuthErrorCode.ID_TOKEN_REVOKED,
        message: "The Firebase ID token has been revoked."
      },
      INTERNAL_ERROR: {
        code: exports.AuthErrorCode.INTERNAL_ERROR,
        message: "An internal error has occurred."
      },
      INVALID_CLAIMS: {
        code: exports.AuthErrorCode.INVALID_CLAIMS,
        message: "The provided custom claim attributes are invalid."
      },
      INVALID_CONTINUE_URI: {
        code: exports.AuthErrorCode.INVALID_CONTINUE_URI,
        message: "The continue URL must be a valid URL string."
      },
      INVALID_CREATION_TIME: {
        code: exports.AuthErrorCode.INVALID_CREATION_TIME,
        message: "The creation time must be a valid UTC date string."
      },
      INVALID_CREDENTIAL: {
        code: exports.AuthErrorCode.INVALID_CREDENTIAL,
        message: "Invalid credential object provided."
      },
      INVALID_DISABLED_FIELD: {
        code: exports.AuthErrorCode.INVALID_DISABLED_FIELD,
        message: "The disabled field must be a boolean."
      },
      INVALID_DISPLAY_NAME: {
        code: exports.AuthErrorCode.INVALID_DISPLAY_NAME,
        message: "The displayName field must be a valid string."
      },
      INVALID_DYNAMIC_LINK_DOMAIN: {
        code: exports.AuthErrorCode.INVALID_DYNAMIC_LINK_DOMAIN,
        message: "The provided dynamic link domain is not configured or authorized for the current project."
      },
      INVALID_HOSTING_LINK_DOMAIN: {
        code: exports.AuthErrorCode.INVALID_HOSTING_LINK_DOMAIN,
        message: "The provided hosting link domain is not configured in Firebase Hosting or is not owned by the current project."
      },
      INVALID_EMAIL_VERIFIED: {
        code: exports.AuthErrorCode.INVALID_EMAIL_VERIFIED,
        message: "The emailVerified field must be a boolean."
      },
      INVALID_EMAIL: {
        code: exports.AuthErrorCode.INVALID_EMAIL,
        message: "The email address is improperly formatted."
      },
      INVALID_NEW_EMAIL: {
        code: exports.AuthErrorCode.INVALID_NEW_EMAIL,
        message: "The new email address is improperly formatted."
      },
      INVALID_ENROLLED_FACTORS: {
        code: exports.AuthErrorCode.INVALID_ENROLLED_FACTORS,
        message: "The enrolled factors must be a valid array of MultiFactorInfo objects."
      },
      INVALID_ENROLLMENT_TIME: {
        code: exports.AuthErrorCode.INVALID_ENROLLMENT_TIME,
        message: "The second factor enrollment time must be a valid UTC date string."
      },
      INVALID_HASH_ALGORITHM: {
        code: exports.AuthErrorCode.INVALID_HASH_ALGORITHM,
        message: "The hash algorithm must match one of the strings in the list of supported algorithms."
      },
      INVALID_HASH_BLOCK_SIZE: {
        code: exports.AuthErrorCode.INVALID_HASH_BLOCK_SIZE,
        message: "The hash block size must be a valid number."
      },
      INVALID_HASH_DERIVED_KEY_LENGTH: {
        code: exports.AuthErrorCode.INVALID_HASH_DERIVED_KEY_LENGTH,
        message: "The hash derived key length must be a valid number."
      },
      INVALID_HASH_KEY: {
        code: exports.AuthErrorCode.INVALID_HASH_KEY,
        message: "The hash key must a valid byte buffer."
      },
      INVALID_HASH_MEMORY_COST: {
        code: exports.AuthErrorCode.INVALID_HASH_MEMORY_COST,
        message: "The hash memory cost must be a valid number."
      },
      INVALID_HASH_PARALLELIZATION: {
        code: exports.AuthErrorCode.INVALID_HASH_PARALLELIZATION,
        message: "The hash parallelization must be a valid number."
      },
      INVALID_HASH_ROUNDS: {
        code: exports.AuthErrorCode.INVALID_HASH_ROUNDS,
        message: "The hash rounds must be a valid number."
      },
      INVALID_HASH_SALT_SEPARATOR: {
        code: exports.AuthErrorCode.INVALID_HASH_SALT_SEPARATOR,
        message: "The hashing algorithm salt separator field must be a valid byte buffer."
      },
      INVALID_LAST_SIGN_IN_TIME: {
        code: exports.AuthErrorCode.INVALID_LAST_SIGN_IN_TIME,
        message: "The last sign-in time must be a valid UTC date string."
      },
      INVALID_NAME: {
        code: exports.AuthErrorCode.INVALID_NAME,
        message: "The resource name provided is invalid."
      },
      INVALID_OAUTH_CLIENT_ID: {
        code: exports.AuthErrorCode.INVALID_OAUTH_CLIENT_ID,
        message: "The provided OAuth client ID is invalid."
      },
      INVALID_PAGE_TOKEN: {
        code: exports.AuthErrorCode.INVALID_PAGE_TOKEN,
        message: "The page token must be a valid non-empty string."
      },
      INVALID_PASSWORD: {
        code: exports.AuthErrorCode.INVALID_PASSWORD,
        message: "The password must be a string with at least 6 characters."
      },
      INVALID_PASSWORD_HASH: {
        code: exports.AuthErrorCode.INVALID_PASSWORD_HASH,
        message: "The password hash must be a valid byte buffer."
      },
      INVALID_PASSWORD_SALT: {
        code: exports.AuthErrorCode.INVALID_PASSWORD_SALT,
        message: "The password salt must be a valid byte buffer."
      },
      INVALID_PHONE_NUMBER: {
        code: exports.AuthErrorCode.INVALID_PHONE_NUMBER,
        message: "The phone number must be a non-empty E.164 standard compliant identifier string."
      },
      INVALID_PHOTO_URL: {
        code: exports.AuthErrorCode.INVALID_PHOTO_URL,
        message: "The photoURL field must be a valid URL."
      },
      INVALID_PROJECT_ID: {
        code: exports.AuthErrorCode.INVALID_PROJECT_ID,
        message: "Invalid parent project. Either parent project doesn't exist or didn't enable multi-tenancy."
      },
      INVALID_PROVIDER_DATA: {
        code: exports.AuthErrorCode.INVALID_PROVIDER_DATA,
        message: "The providerData must be a valid array of UserInfo objects."
      },
      INVALID_PROVIDER_ID: {
        code: exports.AuthErrorCode.INVALID_PROVIDER_ID,
        message: "The providerId must be a valid supported provider identifier string."
      },
      INVALID_PROVIDER_UID: {
        code: exports.AuthErrorCode.INVALID_PROVIDER_UID,
        message: "The providerUid must be a valid provider uid string."
      },
      INVALID_OAUTH_RESPONSETYPE: {
        code: exports.AuthErrorCode.INVALID_OAUTH_RESPONSETYPE,
        message: "Only exactly one OAuth responseType should be set to true."
      },
      INVALID_SESSION_COOKIE_DURATION: {
        code: exports.AuthErrorCode.INVALID_SESSION_COOKIE_DURATION,
        message: "The session cookie duration must be a valid number in milliseconds between 5 minutes and 2 weeks."
      },
      INVALID_TENANT_ID: {
        code: exports.AuthErrorCode.INVALID_TENANT_ID,
        message: "The tenant ID must be a valid non-empty string."
      },
      INVALID_TENANT_TYPE: {
        code: exports.AuthErrorCode.INVALID_TENANT_TYPE,
        message: 'Tenant type must be either "full_service" or "lightweight".'
      },
      INVALID_TESTING_PHONE_NUMBER: {
        code: exports.AuthErrorCode.INVALID_TESTING_PHONE_NUMBER,
        message: "Invalid testing phone number or invalid test code provided."
      },
      INVALID_UID: {
        code: exports.AuthErrorCode.INVALID_UID,
        message: "The uid must be a non-empty string with at most 128 characters."
      },
      INVALID_USER_IMPORT: {
        code: exports.AuthErrorCode.INVALID_USER_IMPORT,
        message: "The user record to import is invalid."
      },
      INVALID_TOKENS_VALID_AFTER_TIME: {
        code: exports.AuthErrorCode.INVALID_TOKENS_VALID_AFTER_TIME,
        message: "The tokensValidAfterTime must be a valid UTC number in seconds."
      },
      MISMATCHING_TENANT_ID: {
        code: exports.AuthErrorCode.MISMATCHING_TENANT_ID,
        message: "User tenant ID does not match with the current TenantAwareAuth tenant ID."
      },
      MISSING_ANDROID_PACKAGE_NAME: {
        code: exports.AuthErrorCode.MISSING_ANDROID_PACKAGE_NAME,
        message: "An Android Package Name must be provided if the Android App is required to be installed."
      },
      MISSING_CONFIG: {
        code: exports.AuthErrorCode.MISSING_CONFIG,
        message: "The provided configuration is missing required attributes."
      },
      MISSING_CONTINUE_URI: {
        code: exports.AuthErrorCode.MISSING_CONTINUE_URI,
        message: "A valid continue URL must be provided in the request."
      },
      MISSING_DISPLAY_NAME: {
        code: exports.AuthErrorCode.MISSING_DISPLAY_NAME,
        message: "The resource being created or edited is missing a valid display name."
      },
      MISSING_EMAIL: {
        code: exports.AuthErrorCode.MISSING_EMAIL,
        message: "The email is required for the specified action. For example, a multi-factor user requires a verified email."
      },
      MISSING_IOS_BUNDLE_ID: {
        code: exports.AuthErrorCode.MISSING_IOS_BUNDLE_ID,
        message: "The request is missing an iOS Bundle ID."
      },
      MISSING_ISSUER: {
        code: exports.AuthErrorCode.MISSING_ISSUER,
        message: "The OAuth/OIDC configuration issuer must not be empty."
      },
      MISSING_HASH_ALGORITHM: {
        code: exports.AuthErrorCode.MISSING_HASH_ALGORITHM,
        message: "Importing users with password hashes requires that the hashing algorithm and its parameters be provided."
      },
      MISSING_OAUTH_CLIENT_ID: {
        code: exports.AuthErrorCode.MISSING_OAUTH_CLIENT_ID,
        message: "The OAuth/OIDC configuration client ID must not be empty."
      },
      MISSING_OAUTH_CLIENT_SECRET: {
        code: exports.AuthErrorCode.MISSING_OAUTH_CLIENT_SECRET,
        message: "The OAuth configuration client secret is required to enable OIDC code flow."
      },
      MISSING_PROVIDER_ID: {
        code: exports.AuthErrorCode.MISSING_PROVIDER_ID,
        message: "A valid provider ID must be provided in the request."
      },
      MISSING_SAML_RELYING_PARTY_CONFIG: {
        code: exports.AuthErrorCode.MISSING_SAML_RELYING_PARTY_CONFIG,
        message: "The SAML configuration provided is missing a relying party configuration."
      },
      MAXIMUM_TEST_PHONE_NUMBER_EXCEEDED: {
        code: exports.AuthErrorCode.MAXIMUM_TEST_PHONE_NUMBER_EXCEEDED,
        message: "The maximum allowed number of test phone number / code pairs has been exceeded."
      },
      MAXIMUM_USER_COUNT_EXCEEDED: {
        code: exports.AuthErrorCode.MAXIMUM_USER_COUNT_EXCEEDED,
        message: "The maximum allowed number of users to import has been exceeded."
      },
      MISSING_UID: {
        code: exports.AuthErrorCode.MISSING_UID,
        message: "A uid identifier is required for the current operation."
      },
      OPERATION_NOT_ALLOWED: {
        code: exports.AuthErrorCode.OPERATION_NOT_ALLOWED,
        message: "The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section."
      },
      PHONE_NUMBER_ALREADY_EXISTS: {
        code: exports.AuthErrorCode.PHONE_NUMBER_ALREADY_EXISTS,
        message: "The user with the provided phone number already exists."
      },
      PROJECT_NOT_FOUND: {
        code: exports.AuthErrorCode.PROJECT_NOT_FOUND,
        message: "No Firebase project was found for the provided credential."
      },
      INSUFFICIENT_PERMISSION: {
        code: exports.AuthErrorCode.INSUFFICIENT_PERMISSION,
        message: 'Credential implementation provided to initializeApp() via the "credential" property has insufficient permission to access the requested resource. See https://firebase.google.com/docs/admin/setup for details on how to authenticate this SDK with appropriate permissions.'
      },
      QUOTA_EXCEEDED: {
        code: exports.AuthErrorCode.QUOTA_EXCEEDED,
        message: "The project quota for the specified operation has been exceeded."
      },
      SECOND_FACTOR_LIMIT_EXCEEDED: {
        code: exports.AuthErrorCode.SECOND_FACTOR_LIMIT_EXCEEDED,
        message: "The maximum number of allowed second factors on a user has been exceeded."
      },
      SECOND_FACTOR_UID_ALREADY_EXISTS: {
        code: exports.AuthErrorCode.SECOND_FACTOR_UID_ALREADY_EXISTS,
        message: 'The specified second factor "uid" already exists.'
      },
      SESSION_COOKIE_EXPIRED: {
        code: exports.AuthErrorCode.SESSION_COOKIE_EXPIRED,
        message: "The Firebase session cookie is expired."
      },
      SESSION_COOKIE_REVOKED: {
        code: exports.AuthErrorCode.SESSION_COOKIE_REVOKED,
        message: "The Firebase session cookie has been revoked."
      },
      TENANT_NOT_FOUND: {
        code: exports.AuthErrorCode.TENANT_NOT_FOUND,
        message: "There is no tenant corresponding to the provided identifier."
      },
      UID_ALREADY_EXISTS: {
        code: exports.AuthErrorCode.UID_ALREADY_EXISTS,
        message: "The user with the provided uid already exists."
      },
      UNAUTHORIZED_DOMAIN: {
        code: exports.AuthErrorCode.UNAUTHORIZED_DOMAIN,
        message: "The domain of the continue URL is not whitelisted. Whitelist the domain in the Firebase console."
      },
      UNSUPPORTED_FIRST_FACTOR: {
        code: exports.AuthErrorCode.UNSUPPORTED_FIRST_FACTOR,
        message: "A multi-factor user requires a supported first factor."
      },
      UNSUPPORTED_SECOND_FACTOR: {
        code: exports.AuthErrorCode.UNSUPPORTED_SECOND_FACTOR,
        message: "The request specified an unsupported type of second factor."
      },
      UNSUPPORTED_TENANT_OPERATION: {
        code: exports.AuthErrorCode.UNSUPPORTED_TENANT_OPERATION,
        message: "This operation is not supported in a multi-tenant context."
      },
      UNVERIFIED_EMAIL: {
        code: exports.AuthErrorCode.UNVERIFIED_EMAIL,
        message: "A verified email is required for the specified action. For example, a multi-factor user requires a verified email."
      },
      USER_NOT_FOUND: {
        code: exports.AuthErrorCode.USER_NOT_FOUND,
        message: "There is no user record corresponding to the provided identifier."
      },
      NOT_FOUND: {
        code: exports.AuthErrorCode.NOT_FOUND,
        message: "The requested resource was not found."
      },
      USER_DISABLED: {
        code: exports.AuthErrorCode.USER_DISABLED,
        message: "The user record is disabled."
      },
      USER_NOT_DISABLED: {
        code: exports.AuthErrorCode.USER_NOT_DISABLED,
        message: "The user must be disabled in order to bulk delete it (or you must pass force=true)."
      },
      INVALID_RECAPTCHA_ACTION: {
        code: exports.AuthErrorCode.INVALID_RECAPTCHA_ACTION,
        message: 'reCAPTCHA action must be "BLOCK".'
      },
      INVALID_RECAPTCHA_ENFORCEMENT_STATE: {
        code: exports.AuthErrorCode.INVALID_RECAPTCHA_ENFORCEMENT_STATE,
        message: 'reCAPTCHA enforcement state must be either "OFF", "AUDIT" or "ENFORCE".'
      },
      RECAPTCHA_NOT_ENABLED: {
        code: exports.AuthErrorCode.RECAPTCHA_NOT_ENABLED,
        message: "reCAPTCHA enterprise is not enabled."
      }
    };
    var AUTH_SERVER_TO_CLIENT_CODE = {
      // Feature being configured or used requires a billing account.
      BILLING_NOT_ENABLED: "BILLING_NOT_ENABLED",
      // Claims payload is too large.
      CLAIMS_TOO_LARGE: "CLAIMS_TOO_LARGE",
      // Configuration being added already exists.
      CONFIGURATION_EXISTS: "CONFIGURATION_EXISTS",
      // Configuration not found.
      CONFIGURATION_NOT_FOUND: "CONFIGURATION_NOT_FOUND",
      // Provided credential has insufficient permissions.
      INSUFFICIENT_PERMISSION: "INSUFFICIENT_PERMISSION",
      // Provided configuration has invalid fields.
      INVALID_CONFIG: "INVALID_CONFIG",
      // Provided configuration identifier is invalid.
      INVALID_CONFIG_ID: "INVALID_PROVIDER_ID",
      // ActionCodeSettings missing continue URL.
      INVALID_CONTINUE_URI: "INVALID_CONTINUE_URI",
      // Dynamic link domain in provided ActionCodeSettings is not authorized.
      INVALID_DYNAMIC_LINK_DOMAIN: "INVALID_DYNAMIC_LINK_DOMAIN",
      // Hosting link domain in provided ActionCodeSettings is not owned by the current project.
      INVALID_HOSTING_LINK_DOMAIN: "INVALID_HOSTING_LINK_DOMAIN",
      // uploadAccount provides an email that already exists.
      DUPLICATE_EMAIL: "EMAIL_ALREADY_EXISTS",
      // uploadAccount provides a localId that already exists.
      DUPLICATE_LOCAL_ID: "UID_ALREADY_EXISTS",
      // Request specified a multi-factor enrollment ID that already exists.
      DUPLICATE_MFA_ENROLLMENT_ID: "SECOND_FACTOR_UID_ALREADY_EXISTS",
      // setAccountInfo email already exists.
      EMAIL_EXISTS: "EMAIL_ALREADY_EXISTS",
      // /accounts:sendOobCode for password reset when user is not found.
      EMAIL_NOT_FOUND: "EMAIL_NOT_FOUND",
      // Reserved claim name.
      FORBIDDEN_CLAIM: "FORBIDDEN_CLAIM",
      // Invalid claims provided.
      INVALID_CLAIMS: "INVALID_CLAIMS",
      // Invalid session cookie duration.
      INVALID_DURATION: "INVALID_SESSION_COOKIE_DURATION",
      // Invalid email provided.
      INVALID_EMAIL: "INVALID_EMAIL",
      // Invalid new email provided.
      INVALID_NEW_EMAIL: "INVALID_NEW_EMAIL",
      // Invalid tenant display name. This can be thrown on CreateTenant and UpdateTenant.
      INVALID_DISPLAY_NAME: "INVALID_DISPLAY_NAME",
      // Invalid ID token provided.
      INVALID_ID_TOKEN: "INVALID_ID_TOKEN",
      // Invalid tenant/parent resource name.
      INVALID_NAME: "INVALID_NAME",
      // OIDC configuration has an invalid OAuth client ID.
      INVALID_OAUTH_CLIENT_ID: "INVALID_OAUTH_CLIENT_ID",
      // Invalid page token.
      INVALID_PAGE_SELECTION: "INVALID_PAGE_TOKEN",
      // Invalid phone number.
      INVALID_PHONE_NUMBER: "INVALID_PHONE_NUMBER",
      // Invalid agent project. Either agent project doesn't exist or didn't enable multi-tenancy.
      INVALID_PROJECT_ID: "INVALID_PROJECT_ID",
      // Invalid provider ID.
      INVALID_PROVIDER_ID: "INVALID_PROVIDER_ID",
      // Invalid service account.
      INVALID_SERVICE_ACCOUNT: "INVALID_CREDENTIAL",
      // Invalid testing phone number.
      INVALID_TESTING_PHONE_NUMBER: "INVALID_TESTING_PHONE_NUMBER",
      // Invalid tenant type.
      INVALID_TENANT_TYPE: "INVALID_TENANT_TYPE",
      // Missing Android package name.
      MISSING_ANDROID_PACKAGE_NAME: "MISSING_ANDROID_PACKAGE_NAME",
      // Missing configuration.
      MISSING_CONFIG: "MISSING_CONFIG",
      // Missing configuration identifier.
      MISSING_CONFIG_ID: "MISSING_PROVIDER_ID",
      // Missing tenant display name: This can be thrown on CreateTenant and UpdateTenant.
      MISSING_DISPLAY_NAME: "MISSING_DISPLAY_NAME",
      // Email is required for the specified action. For example a multi-factor user requires
      // a verified email.
      MISSING_EMAIL: "MISSING_EMAIL",
      // Missing iOS bundle ID.
      MISSING_IOS_BUNDLE_ID: "MISSING_IOS_BUNDLE_ID",
      // Missing OIDC issuer.
      MISSING_ISSUER: "MISSING_ISSUER",
      // No localId provided (deleteAccount missing localId).
      MISSING_LOCAL_ID: "MISSING_UID",
      // OIDC configuration is missing an OAuth client ID.
      MISSING_OAUTH_CLIENT_ID: "MISSING_OAUTH_CLIENT_ID",
      // Missing provider ID.
      MISSING_PROVIDER_ID: "MISSING_PROVIDER_ID",
      // Missing SAML RP config.
      MISSING_SAML_RELYING_PARTY_CONFIG: "MISSING_SAML_RELYING_PARTY_CONFIG",
      // Empty user list in uploadAccount.
      MISSING_USER_ACCOUNT: "MISSING_UID",
      // Password auth disabled in console.
      OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
      // Provided credential has insufficient permissions.
      PERMISSION_DENIED: "INSUFFICIENT_PERMISSION",
      // Phone number already exists.
      PHONE_NUMBER_EXISTS: "PHONE_NUMBER_ALREADY_EXISTS",
      // Project not found.
      PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
      // In multi-tenancy context: project creation quota exceeded.
      QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
      // Currently only 5 second factors can be set on the same user.
      SECOND_FACTOR_LIMIT_EXCEEDED: "SECOND_FACTOR_LIMIT_EXCEEDED",
      // Tenant not found.
      TENANT_NOT_FOUND: "TENANT_NOT_FOUND",
      // Tenant ID mismatch.
      TENANT_ID_MISMATCH: "MISMATCHING_TENANT_ID",
      // Token expired error.
      TOKEN_EXPIRED: "ID_TOKEN_EXPIRED",
      // Continue URL provided in ActionCodeSettings has a domain that is not whitelisted.
      UNAUTHORIZED_DOMAIN: "UNAUTHORIZED_DOMAIN",
      // A multi-factor user requires a supported first factor.
      UNSUPPORTED_FIRST_FACTOR: "UNSUPPORTED_FIRST_FACTOR",
      // The request specified an unsupported type of second factor.
      UNSUPPORTED_SECOND_FACTOR: "UNSUPPORTED_SECOND_FACTOR",
      // Operation is not supported in a multi-tenant context.
      UNSUPPORTED_TENANT_OPERATION: "UNSUPPORTED_TENANT_OPERATION",
      // A verified email is required for the specified action. For example a multi-factor user
      // requires a verified email.
      UNVERIFIED_EMAIL: "UNVERIFIED_EMAIL",
      // User on which action is to be performed is not found.
      USER_NOT_FOUND: "USER_NOT_FOUND",
      // User record is disabled.
      USER_DISABLED: "USER_DISABLED",
      // Password provided is too weak.
      WEAK_PASSWORD: "INVALID_PASSWORD",
      // Unrecognized reCAPTCHA action.
      INVALID_RECAPTCHA_ACTION: "INVALID_RECAPTCHA_ACTION",
      // Unrecognized reCAPTCHA enforcement state.
      INVALID_RECAPTCHA_ENFORCEMENT_STATE: "INVALID_RECAPTCHA_ENFORCEMENT_STATE",
      // reCAPTCHA is not enabled for account defender.
      RECAPTCHA_NOT_ENABLED: "RECAPTCHA_NOT_ENABLED"
    };
    var FirebaseAuthError = class _FirebaseAuthError extends error_1.FirebaseError {
      /**
       * Creates the developer-facing error corresponding to the backend error code.
       *
       * @param serverErrorCode - The server error code.
       * @param [message] The error message. The default message is used
       *     if not provided.
       * @param [serverError] The error's raw server response.
       * @returns The corresponding developer-facing error.
       * @internal
       */
      static fromServerError(serverErrorCode, message2, serverError) {
        const colonSeparator = (serverErrorCode || "").indexOf(":");
        let customMessage = null;
        if (colonSeparator !== -1) {
          customMessage = serverErrorCode.substring(colonSeparator + 1).trim();
          serverErrorCode = serverErrorCode.substring(0, colonSeparator).trim();
        }
        const clientCodeKey = AUTH_SERVER_TO_CLIENT_CODE[serverErrorCode] || "INTERNAL_ERROR";
        const error = (0, deep_copy_1.deepCopy)(exports.authClientErrorCode[clientCodeKey]);
        error.message = customMessage || message2 || error.message;
        error.cause = serverError;
        error.httpResponse = serverError?.response ? (0, error_1.toHttpResponse)(serverError.response) : void 0;
        return new _FirebaseAuthError(error);
      }
      /**
       * @param info - The error code info.
       * @param message - The error message. This will override the default message if provided.
       */
      constructor(info, message2) {
        super({
          code: `auth/${info.code}`,
          message: message2 || info.message,
          httpResponse: info.httpResponse,
          cause: info.cause
        });
        this.codePrefix = "auth";
      }
    };
    exports.FirebaseAuthError = FirebaseAuthError;
  }
});

// node_modules/firebase-admin/lib/utils/api-request.js
var require_api_request = __commonJS({
  "node_modules/firebase-admin/lib/utils/api-request.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Http2SessionHandler = exports.ExponentialBackoffPoller = exports.ApiSettings = exports.AuthorizedHttp2Client = exports.AuthorizedHttpClient = exports.Http2Client = exports.HttpClient = exports.RequestClient = exports.RequestResponseError = void 0;
    exports.defaultRetryConfig = defaultRetryConfig;
    exports.parseHttpResponse = parseHttpResponse;
    var error_1 = require_error();
    var error_2 = require_error2();
    var validator = require_validator();
    var http = __require("http");
    var https = __require("https");
    var http2 = __require("http2");
    var events_1 = __require("events");
    var credential_internal_1 = require_credential_internal();
    var index_1 = require_utils();
    var DefaultRequestResponse = class {
      /**
       * Constructs a new `RequestResponse` from the given `LowLevelResponse`.
       */
      constructor(resp) {
        this.status = resp.status;
        this.headers = resp.headers;
        this.text = resp.data;
        this.config = resp.config;
        try {
          if (!resp.data) {
            throw new error_2.FirebaseAppError({ code: error_2.AppErrorCode.INTERNAL_ERROR, message: "HTTP response missing data." });
          }
          this.parsedData = JSON.parse(resp.data);
        } catch (err) {
          this.parsedData = void 0;
          this.parseError = err;
        }
      }
      get data() {
        if (this.isJson()) {
          return this.parsedData;
        }
        throw new error_2.FirebaseAppError({
          code: error_2.AppErrorCode.UNABLE_TO_PARSE_RESPONSE,
          message: "Error while parsing response data",
          cause: this.parseError,
          httpResponse: (0, error_1.toHttpResponse)(this)
        });
      }
      isJson() {
        return typeof this.parsedData !== "undefined";
      }
    };
    var MultipartRequestResponse = class {
      constructor(resp) {
        this.status = resp.status;
        this.headers = resp.headers;
        this.multipart = resp.multipart;
        this.config = resp.config;
      }
      get text() {
        throw new error_2.FirebaseAppError({
          code: error_2.AppErrorCode.UNABLE_TO_PARSE_RESPONSE,
          message: "Unable to parse multipart payload as text"
        });
      }
      get data() {
        throw new error_2.FirebaseAppError({
          code: error_2.AppErrorCode.UNABLE_TO_PARSE_RESPONSE,
          message: "Unable to parse multipart payload as JSON"
        });
      }
      isJson() {
        return false;
      }
    };
    var RequestResponseError = class _RequestResponseError extends Error {
      constructor(response) {
        super(`Server responded with status ${response.status}.`);
        this.response = response;
        Object.setPrototypeOf(this, _RequestResponseError.prototype);
      }
    };
    exports.RequestResponseError = RequestResponseError;
    function defaultRetryConfig() {
      return {
        maxRetries: 4,
        statusCodes: [503],
        ioErrorCodes: ["ECONNRESET", "ETIMEDOUT"],
        backOffFactor: 0.5,
        maxDelayInMillis: 60 * 1e3
      };
    }
    function validateRetryConfig(retry) {
      if (!validator.isNumber(retry.maxRetries) || retry.maxRetries < 0) {
        throw new error_2.FirebaseAppError({
          code: error_2.AppErrorCode.INVALID_ARGUMENT,
          message: "maxRetries must be a non-negative integer"
        });
      }
      if (typeof retry.backOffFactor !== "undefined") {
        if (!validator.isNumber(retry.backOffFactor) || retry.backOffFactor < 0) {
          throw new error_2.FirebaseAppError({
            code: error_2.AppErrorCode.INVALID_ARGUMENT,
            message: "backOffFactor must be a non-negative number"
          });
        }
      }
      if (!validator.isNumber(retry.maxDelayInMillis) || retry.maxDelayInMillis < 0) {
        throw new error_2.FirebaseAppError({
          code: error_2.AppErrorCode.INVALID_ARGUMENT,
          message: "maxDelayInMillis must be a non-negative integer"
        });
      }
      if (typeof retry.statusCodes !== "undefined" && !validator.isArray(retry.statusCodes)) {
        throw new error_2.FirebaseAppError({ code: error_2.AppErrorCode.INVALID_ARGUMENT, message: "statusCodes must be an array" });
      }
      if (typeof retry.ioErrorCodes !== "undefined" && !validator.isArray(retry.ioErrorCodes)) {
        throw new error_2.FirebaseAppError({ code: error_2.AppErrorCode.INVALID_ARGUMENT, message: "ioErrorCodes must be an array" });
      }
    }
    var RequestClient = class {
      constructor(retry = defaultRetryConfig()) {
        if (retry) {
          this.retry = retry;
          validateRetryConfig(this.retry);
        }
      }
      createRequestResponse(resp) {
        if (resp.multipart) {
          return new MultipartRequestResponse(resp);
        }
        return new DefaultRequestResponse(resp);
      }
      waitForRetry(delayMillis) {
        if (delayMillis > 0) {
          return new Promise((resolve) => {
            setTimeout(resolve, delayMillis);
          });
        }
        return Promise.resolve();
      }
      /**
       * Checks if a failed request is eligible for a retry, and if so returns the duration to wait before initiating
       * the retry.
       *
       * @param retryAttempts - Number of retries completed up to now.
       * @param err - The last encountered error.
       * @returns A 2-tuple where the 1st element is the duration to wait before another retry, and the
       *     2nd element is a boolean indicating whether the request is eligible for a retry or not.
       */
      getRetryDelayMillis(retryAttempts, err) {
        if (!this.isRetryEligible(retryAttempts, err)) {
          return [0, false];
        }
        const response = err.response;
        if (response && response.headers["retry-after"]) {
          const delayMillis = this.parseRetryAfterIntoMillis(response.headers["retry-after"]);
          if (delayMillis > 0) {
            return [delayMillis, true];
          }
        }
        return [this.backOffDelayMillis(retryAttempts), true];
      }
      isRetryEligible(retryAttempts, err) {
        if (!this.retry) {
          return false;
        }
        if (retryAttempts >= this.retry.maxRetries) {
          return false;
        }
        if (err.response) {
          const statusCodes = this.retry.statusCodes || [];
          return statusCodes.indexOf(err.response.status) !== -1;
        }
        if (err.code) {
          const retryCodes = this.retry.ioErrorCodes || [];
          return retryCodes.indexOf(err.code) !== -1;
        }
        return false;
      }
      /**???
       * Parses the Retry-After header as a milliseconds value. Return value is negative if the Retry-After header
       * contains an expired timestamp or otherwise malformed.
       */
      parseRetryAfterIntoMillis(retryAfter) {
        const delaySeconds = parseInt(retryAfter, 10);
        if (!isNaN(delaySeconds)) {
          return delaySeconds * 1e3;
        }
        const date = new Date(retryAfter);
        if (!isNaN(date.getTime())) {
          return date.getTime() - Date.now();
        }
        return -1;
      }
      backOffDelayMillis(retryAttempts) {
        if (retryAttempts === 0) {
          return 0;
        }
        if (!this.retry) {
          throw new error_2.FirebaseAppError({ code: error_2.AppErrorCode.INTERNAL_ERROR, message: "Expected this.retry to exist." });
        }
        const backOffFactor = this.retry.backOffFactor || 0;
        const delayInSeconds = 2 ** retryAttempts * backOffFactor;
        return Math.min(delayInSeconds * 1e3, this.retry.maxDelayInMillis);
      }
    };
    exports.RequestClient = RequestClient;
    var HttpClient = class extends RequestClient {
      constructor(retry) {
        super(retry);
      }
      /**
       * Sends an HTTP request to a remote server. If the server responds with a successful response (2xx), the returned
       * promise resolves with an `RequestResponse`. If the server responds with an error (3xx, 4xx, 5xx), the promise
       * rejects with an `RequestResponseError`. In case of all other errors, the promise rejects with a `FirebaseAppError`.
       * If a request fails due to a low-level network error, the client transparently retries the request once before
       * rejecting the promise.
       *
       * If the request data is specified as an object, it will be serialized into a JSON string. The application/json
       * content-type header will also be automatically set in this case. For all other payload types, the content-type
       * header should be explicitly set by the caller. To send a JSON leaf value (e.g. "foo", 5), parse it into JSON,
       * and pass as a string or a Buffer along with the appropriate content-type header.
       *
       * @param config - HTTP request to be sent.
       * @returns A promise that resolves with the response details.
       */
      send(config2) {
        return this.sendWithRetry(config2);
      }
      /**
       * Sends an HTTP request. In the event of an error, retries the HTTP request according to the
       * `RetryConfig` set on the `HttpClient`.
       *
       * @param config - HTTP request to be sent.
       * @param retryAttempts - Number of retries performed up to now.
       * @returns A promise that resolves with the response details.
       */
      sendWithRetry(config2, retryAttempts = 0) {
        return AsyncHttpCall.invoke(config2).then((resp) => {
          return this.createRequestResponse(resp);
        }).catch((err) => {
          const [delayMillis, canRetry] = this.getRetryDelayMillis(retryAttempts, err);
          if (canRetry && this.retry && delayMillis <= this.retry.maxDelayInMillis) {
            return this.waitForRetry(delayMillis).then(() => {
              return this.sendWithRetry(config2, retryAttempts + 1);
            });
          }
          if (err.response) {
            throw new RequestResponseError(this.createRequestResponse(err.response));
          }
          if (err.code === "ETIMEDOUT") {
            throw new error_2.FirebaseAppError({
              code: error_2.AppErrorCode.NETWORK_TIMEOUT,
              message: `Error while making request: ${err.message}.`,
              cause: err
            });
          }
          throw new error_2.FirebaseAppError({
            code: error_2.AppErrorCode.NETWORK_ERROR,
            message: `Error while making request: ${err.message}. Error code: ${err.code}`,
            cause: err
          });
        });
      }
    };
    exports.HttpClient = HttpClient;
    var Http2Client = class extends RequestClient {
      constructor(retry = defaultRetryConfig()) {
        super(retry);
      }
      /**
       * Sends an HTTP/2 request to a remote server. If the server responds with a successful response (2xx), the returned
       * promise resolves with an `RequestResponse`. If the server responds with an error (3xx, 4xx, 5xx), the promise
       * rejects with an `RequestResponseError`. In case of all other errors, the promise rejects with a `FirebaseAppError`.
       * If a request fails due to a low-level network error, the client transparently retries the request once before
       * rejecting the promise.
       *
       * If the request data is specified as an object, it will be serialized into a JSON string. The application/json
       * content-type header will also be automatically set in this case. For all other payload types, the content-type
       * header should be explicitly set by the caller. To send a JSON leaf value (e.g. "foo", 5), parse it into JSON,
       * and pass as a string or a Buffer along with the appropriate content-type header.
       *
       * @param config - HTTP/2 request to be sent.
       * @returns A promise that resolves with the response details.
       */
      send(config2) {
        return this.sendWithRetry(config2);
      }
      /**
       * Sends an HTTP/2 request. In the event of an error, retries the HTTP/2 request according to the
       * `RetryConfig` set on the `Http2Client`.
       *
       * @param config - HTTP/2 request to be sent.
       * @param retryAttempts - Number of retries performed up to now.
       * @returns A promise that resolves with the response details.
       */
      sendWithRetry(config2, retryAttempts = 0) {
        return AsyncHttp2Call.invoke(config2).then((resp) => {
          return this.createRequestResponse(resp);
        }).catch((err) => {
          const [delayMillis, canRetry] = this.getRetryDelayMillis(retryAttempts, err);
          if (canRetry && this.retry && delayMillis <= this.retry.maxDelayInMillis) {
            return this.waitForRetry(delayMillis).then(() => {
              return this.sendWithRetry(config2, retryAttempts + 1);
            });
          }
          if (err.response) {
            throw new RequestResponseError(this.createRequestResponse(err.response));
          }
          if (err.code === "ETIMEDOUT") {
            throw new error_2.FirebaseAppError({
              code: error_2.AppErrorCode.NETWORK_TIMEOUT,
              message: `Error while making request: ${err.message}.`,
              cause: err
            });
          }
          throw new error_2.FirebaseAppError({
            code: error_2.AppErrorCode.NETWORK_ERROR,
            message: `Error while making request: ${err.message}. Error code: ${err.code}`,
            cause: err
          });
        });
      }
    };
    exports.Http2Client = Http2Client;
    function parseHttpResponse(response, config2) {
      const responseText = validator.isBuffer(response) ? response.toString("utf-8") : response;
      const endOfHeaderPos = responseText.indexOf("\r\n\r\n");
      const headerLines = responseText.substring(0, endOfHeaderPos).split("\r\n");
      const statusLine = headerLines[0];
      const status = statusLine.trim().split(/\s/)[1];
      const headers = {};
      headerLines.slice(1).forEach((line) => {
        const colonPos = line.indexOf(":");
        const name = line.substring(0, colonPos).trim().toLowerCase();
        const value = line.substring(colonPos + 1).trim();
        headers[name] = value;
      });
      let data = responseText.substring(endOfHeaderPos + 4);
      if (data.endsWith("\n")) {
        data = data.slice(0, -1);
      }
      if (data.endsWith("\r")) {
        data = data.slice(0, -1);
      }
      const lowLevelResponse = {
        status: parseInt(status, 10),
        headers,
        data,
        config: config2,
        request: null
      };
      if (!validator.isNumber(lowLevelResponse.status)) {
        throw new error_2.FirebaseAppError({ code: error_2.AppErrorCode.INTERNAL_ERROR, message: "Malformed HTTP status line." });
      }
      return new DefaultRequestResponse(lowLevelResponse);
    }
    var AsyncRequestCall = class {
      constructor(configImpl) {
        this.configImpl = configImpl;
      }
      /**
       * Extracts multipart boundary from the HTTP header. The content-type header of a multipart
       * response has the form 'multipart/subtype; boundary=string'.
       *
       * If the content-type header does not exist, or does not start with
       * 'multipart/', then null will be returned.
       */
      getMultipartBoundary(headers) {
        const contentType = headers["content-type"];
        if (!contentType || !contentType.startsWith("multipart/")) {
          return null;
        }
        const segments = contentType.split(";");
        const emptyObject = {};
        const headerParams = segments.slice(1).map((segment) => segment.trim().split("=")).reduce((curr, params) => {
          if (params.length === 2) {
            const keyValuePair = {};
            keyValuePair[params[0]] = params[1];
            return Object.assign(curr, keyValuePair);
          }
          return curr;
        }, emptyObject);
        return headerParams.boundary;
      }
      handleMultipartResponse(response, respStream, boundary) {
        const busboy = __require("@fastify/busboy");
        const multipartParser = new busboy.Dicer({ boundary });
        const responseBuffer = [];
        multipartParser.on("part", (part) => {
          const tempBuffers = [];
          part.on("data", (partData) => {
            tempBuffers.push(partData);
          });
          part.on("end", () => {
            responseBuffer.push(Buffer.concat(tempBuffers));
          });
        });
        multipartParser.on("finish", () => {
          response.data = void 0;
          response.multipart = responseBuffer;
          this.finalizeResponse(response);
        });
        respStream.pipe(multipartParser);
      }
      handleRegularResponse(response, respStream) {
        const responseBuffer = [];
        respStream.on("data", (chunk) => {
          responseBuffer.push(chunk);
        });
        respStream.on("error", (err) => {
          const req = response.request;
          if (req && req.destroyed) {
            return;
          }
          this.enhanceAndReject(err, null, req);
        });
        respStream.on("end", () => {
          response.data = Buffer.concat(responseBuffer).toString();
          this.finalizeResponse(response);
        });
      }
      /**
       * Finalizes the current request call in-flight by either resolving or rejecting the associated
       * promise. In the event of an error, adds additional useful information to the returned error.
       */
      finalizeResponse(response) {
        if (response.status >= 200 && response.status < 300) {
          this.resolve(response);
        } else {
          this.rejectWithError("Request failed with status code " + response.status, null, response.request, response);
        }
      }
      /**
       * Creates a new error from the given message, and enhances it with other information available.
       * Then the promise associated with this request call is rejected with the resulting error.
       */
      rejectWithError(message2, code, request, response) {
        const error = new Error(message2);
        this.enhanceAndReject(error, code, request, response);
      }
      enhanceAndReject(error, code, request, response) {
        this.reject(this.enhanceError(error, code, request, response));
      }
      /**
       * Enhances the given error by adding more information to it. Specifically, the request config,
       * the underlying request and response will be attached to the error.
       */
      enhanceError(error, code, request, response) {
        error.config = this.configImpl;
        if (code) {
          error.code = code;
        }
        error.request = request;
        error.response = response;
        return error;
      }
    };
    var AsyncHttpCall = class _AsyncHttpCall extends AsyncRequestCall {
      /**
       * Sends an HTTP request based on the provided configuration.
       */
      static invoke(config2) {
        return new _AsyncHttpCall(config2).promise;
      }
      constructor(config2) {
        const httpConfigImpl = new HttpRequestConfigImpl(config2);
        super(httpConfigImpl);
        try {
          this.httpConfigImpl = httpConfigImpl;
          this.options = this.httpConfigImpl.buildRequestOptions();
          if (!validator.isNonNullObject(this.options.headers)) {
            this.options.headers = {};
          }
          this.entity = this.httpConfigImpl.buildEntity(this.options.headers);
          this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.execute();
          });
        } catch (err) {
          this.promise = Promise.reject(this.enhanceError(err, null));
        }
      }
      execute() {
        const transport = this.options.protocol === "https:" ? https : http;
        const req = transport.request(this.options, (res) => {
          this.handleResponse(res, req);
        });
        req.on("error", (err) => {
          if (req.aborted) {
            return;
          }
          this.enhanceAndReject(err, null, req);
        });
        const timeout = this.httpConfigImpl.timeout;
        const timeoutCallback = () => {
          req.destroy();
          this.rejectWithError(`timeout of ${timeout}ms exceeded`, "ETIMEDOUT", req);
        };
        if (timeout) {
          req.setTimeout(timeout, timeoutCallback);
        }
        req.end(this.entity);
      }
      handleResponse(res, req) {
        if (req.aborted) {
          return;
        }
        if (!res.statusCode) {
          throw new error_2.FirebaseAppError({
            code: error_2.AppErrorCode.INTERNAL_ERROR,
            message: "Expected a statusCode on the response from a ClientRequest"
          });
        }
        const response = {
          status: res.statusCode,
          headers: res.headers,
          request: req,
          data: void 0,
          config: this.httpConfigImpl
        };
        const boundary = this.getMultipartBoundary(res.headers);
        const respStream = this.uncompressResponse(res);
        if (boundary) {
          this.handleMultipartResponse(response, respStream, boundary);
        } else {
          this.handleRegularResponse(response, respStream);
        }
      }
      uncompressResponse(res) {
        let respStream = res;
        const encodings = ["gzip", "compress", "deflate"];
        if (res.headers["content-encoding"] && encodings.indexOf(res.headers["content-encoding"]) !== -1) {
          const zlib = __require("zlib");
          respStream = respStream.pipe(zlib.createUnzip());
          delete res.headers["content-encoding"];
        }
        return respStream;
      }
    };
    var AsyncHttp2Call = class _AsyncHttp2Call extends AsyncRequestCall {
      /**
       * Sends an HTTP2 request based on the provided configuration.
       */
      static invoke(config2) {
        return new _AsyncHttp2Call(config2).promise;
      }
      constructor(config2) {
        const http2ConfigImpl = new Http2RequestConfigImpl(config2);
        super(http2ConfigImpl);
        try {
          this.http2ConfigImpl = http2ConfigImpl;
          this.options = this.http2ConfigImpl.buildRequestOptions();
          if (!validator.isNonNullObject(this.options.headers)) {
            this.options.headers = {};
          }
          this.entity = this.http2ConfigImpl.buildEntity(this.options.headers);
          this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.execute();
          });
        } catch (err) {
          this.promise = Promise.reject(this.enhanceError(err, null));
        }
      }
      execute() {
        const req = this.http2ConfigImpl.http2SessionHandler.session.request({
          ":method": this.options.method,
          ":scheme": this.options.protocol,
          ":path": this.options.path,
          ...this.options.headers
        });
        req.on("response", (headers) => {
          this.handleHttp2Response(headers, req);
        });
        req.on("error", (err) => {
          if (req.aborted) {
            return;
          }
          this.enhanceAndReject(err, null, req);
        });
        const timeout = this.http2ConfigImpl.timeout;
        const timeoutCallback = () => {
          req.destroy();
          this.rejectWithError(`timeout of ${timeout}ms exceeded`, "ETIMEDOUT", req);
        };
        if (timeout) {
          req.setTimeout(timeout, timeoutCallback);
        }
        req.end(this.entity);
      }
      handleHttp2Response(headers, stream) {
        if (stream.aborted) {
          return;
        }
        if (!headers[":status"]) {
          throw new error_2.FirebaseAppError({
            code: error_2.AppErrorCode.INTERNAL_ERROR,
            message: "Expected a statusCode on the response from a ClientRequest"
          });
        }
        const response = {
          status: headers[":status"],
          headers,
          request: stream,
          data: void 0,
          config: this.http2ConfigImpl
        };
        const boundary = this.getMultipartBoundary(headers);
        const respStream = this.uncompressResponse(headers, stream);
        if (boundary) {
          this.handleMultipartResponse(response, respStream, boundary);
        } else {
          this.handleRegularResponse(response, respStream);
        }
      }
      uncompressResponse(headers, stream) {
        let respStream = stream;
        const encodings = ["gzip", "compress", "deflate"];
        if (headers["content-encoding"] && encodings.indexOf(headers["content-encoding"]) !== -1) {
          const zlib = __require("zlib");
          respStream = respStream.pipe(zlib.createUnzip());
          delete headers["content-encoding"];
        }
        return respStream;
      }
    };
    var BaseRequestConfigImpl = class {
      constructor(config2) {
        this.config = config2;
        this.config = config2;
      }
      get method() {
        return this.config.method;
      }
      get url() {
        return this.config.url;
      }
      get headers() {
        return this.config.headers;
      }
      get data() {
        return this.config.data;
      }
      get timeout() {
        return this.config.timeout;
      }
      buildEntity(headers) {
        let data;
        if (!this.hasEntity() || !this.isEntityEnclosingRequest()) {
          return data;
        }
        if (validator.isBuffer(this.data)) {
          data = this.data;
        } else if (validator.isObject(this.data)) {
          data = Buffer.from(JSON.stringify(this.data), "utf-8");
          if (typeof headers["content-type"] === "undefined") {
            headers["content-type"] = "application/json;charset=utf-8";
          }
        } else if (validator.isString(this.data)) {
          data = Buffer.from(this.data, "utf-8");
        } else {
          throw new Error("Request data must be a string, a Buffer or a json serializable object");
        }
        headers["Content-Length"] = data.length.toString();
        return data;
      }
      buildUrl() {
        const fullUrl = this.urlWithProtocol();
        const parsedUrl = new URL(fullUrl);
        if (!this.hasEntity() || this.isEntityEnclosingRequest()) {
          return parsedUrl;
        }
        if (!validator.isObject(this.data)) {
          throw new Error(`${this.method} requests cannot have a body`);
        }
        const dataObj = this.data;
        for (const key in dataObj) {
          if (Object.prototype.hasOwnProperty.call(dataObj, key)) {
            parsedUrl.searchParams.append(key, dataObj[key]);
          }
        }
        return parsedUrl;
      }
      urlWithProtocol() {
        const fullUrl = this.url;
        if (fullUrl.startsWith("http://") || fullUrl.startsWith("https://")) {
          return fullUrl;
        }
        return `https://${fullUrl}`;
      }
      hasEntity() {
        return !!this.data;
      }
      isEntityEnclosingRequest() {
        return this.method !== "GET" && this.method !== "HEAD";
      }
    };
    var HttpRequestConfigImpl = class extends BaseRequestConfigImpl {
      constructor(httpConfig) {
        super(httpConfig);
        this.httpConfig = httpConfig;
      }
      get httpAgent() {
        return this.httpConfig.httpAgent;
      }
      buildRequestOptions() {
        const parsed = this.buildUrl();
        const protocol = parsed.protocol;
        let port = parsed.port;
        if (!port) {
          const isHttps = protocol === "https:";
          port = isHttps ? "443" : "80";
        }
        return {
          protocol,
          hostname: parsed.hostname,
          port,
          path: `${parsed.pathname}${parsed.search}`,
          method: this.method,
          agent: this.httpAgent,
          headers: Object.assign({}, this.headers)
        };
      }
    };
    var Http2RequestConfigImpl = class extends BaseRequestConfigImpl {
      constructor(http2Config) {
        super(http2Config);
        this.http2Config = http2Config;
      }
      get http2SessionHandler() {
        return this.http2Config.http2SessionHandler;
      }
      buildRequestOptions() {
        const parsed = this.buildUrl();
        const protocol = parsed.protocol;
        return {
          protocol,
          path: `${parsed.pathname}${parsed.search}`,
          method: this.method,
          headers: Object.assign({}, this.headers)
        };
      }
    };
    var AuthorizedHttpClient = class extends HttpClient {
      constructor(app) {
        super();
        this.app = app;
      }
      send(request) {
        return this.getToken().then((token) => {
          const requestCopy = Object.assign({}, request);
          requestCopy.headers = Object.assign({}, request.headers);
          const authHeader = "Authorization";
          requestCopy.headers[authHeader] = `Bearer ${token}`;
          let quotaProjectId;
          if (this.app.options.credential instanceof credential_internal_1.ApplicationDefaultCredential) {
            quotaProjectId = this.app.options.credential.getQuotaProjectId();
          }
          quotaProjectId = process.env.GOOGLE_CLOUD_QUOTA_PROJECT || quotaProjectId;
          if (!requestCopy.headers["x-goog-user-project"] && validator.isNonEmptyString(quotaProjectId)) {
            requestCopy.headers["x-goog-user-project"] = quotaProjectId;
          }
          if (!requestCopy.httpAgent && this.app.options.httpAgent) {
            requestCopy.httpAgent = this.app.options.httpAgent;
          }
          if (!requestCopy.headers["X-Goog-Api-Client"]) {
            requestCopy.headers["X-Goog-Api-Client"] = (0, index_1.getMetricsHeader)();
          }
          return super.send(requestCopy);
        });
      }
      getToken() {
        return this.app.INTERNAL.getToken().then((accessTokenObj) => accessTokenObj.accessToken);
      }
    };
    exports.AuthorizedHttpClient = AuthorizedHttpClient;
    var AuthorizedHttp2Client = class extends Http2Client {
      constructor(app) {
        super();
        this.app = app;
      }
      send(request) {
        return this.getToken().then((token) => {
          const requestCopy = Object.assign({}, request);
          requestCopy.headers = Object.assign({}, request.headers);
          const authHeader = "Authorization";
          requestCopy.headers[authHeader] = `Bearer ${token}`;
          let quotaProjectId;
          if (this.app.options.credential instanceof credential_internal_1.ApplicationDefaultCredential) {
            quotaProjectId = this.app.options.credential.getQuotaProjectId();
          }
          quotaProjectId = process.env.GOOGLE_CLOUD_QUOTA_PROJECT || quotaProjectId;
          if (!requestCopy.headers["x-goog-user-project"] && validator.isNonEmptyString(quotaProjectId)) {
            requestCopy.headers["x-goog-user-project"] = quotaProjectId;
          }
          if (!requestCopy.headers["X-Goog-Api-Client"]) {
            requestCopy.headers["X-Goog-Api-Client"] = (0, index_1.getMetricsHeader)();
          }
          return super.send(requestCopy);
        });
      }
      getToken() {
        return this.app.INTERNAL.getToken().then((accessTokenObj) => accessTokenObj.accessToken);
      }
    };
    exports.AuthorizedHttp2Client = AuthorizedHttp2Client;
    var ApiSettings = class {
      constructor(endpoint, httpMethod = "POST") {
        this.endpoint = endpoint;
        this.httpMethod = httpMethod;
        this.setRequestValidator(null).setResponseValidator(null);
      }
      /** @returns The backend API endpoint. */
      getEndpoint() {
        return this.endpoint;
      }
      /** @returns The request HTTP method. */
      getHttpMethod() {
        return this.httpMethod;
      }
      /**
       * @param requestValidator - The request validator.
       * @returns The current API settings instance.
       */
      setRequestValidator(requestValidator) {
        const nullFunction = () => void 0;
        this.requestValidator = requestValidator || nullFunction;
        return this;
      }
      /** @returns The request validator. */
      getRequestValidator() {
        return this.requestValidator;
      }
      /**
       * @param responseValidator - The response validator.
       * @returns The current API settings instance.
       */
      setResponseValidator(responseValidator) {
        const nullFunction = () => void 0;
        this.responseValidator = responseValidator || nullFunction;
        return this;
      }
      /** @returns The response validator. */
      getResponseValidator() {
        return this.responseValidator;
      }
    };
    exports.ApiSettings = ApiSettings;
    var ExponentialBackoffPoller = class extends events_1.EventEmitter {
      constructor(initialPollingDelayMillis = 1e3, maxPollingDelayMillis = 1e4, masterTimeoutMillis = 6e4) {
        super();
        this.initialPollingDelayMillis = initialPollingDelayMillis;
        this.maxPollingDelayMillis = maxPollingDelayMillis;
        this.masterTimeoutMillis = masterTimeoutMillis;
        this.numTries = 0;
        this.completed = false;
      }
      /**
       * Poll the provided callback with exponential backoff.
       *
       * @param callback - The callback to be called for each poll. If the
       *     callback resolves to a falsey value, polling will continue. Otherwise, the truthy
       *     resolution will be used to resolve the promise returned by this method.
       * @returns A Promise which resolves to the truthy value returned by the provided
       *     callback when polling is complete.
       */
      poll(callback) {
        if (this.pollCallback) {
          throw new Error("poll() can only be called once per instance of ExponentialBackoffPoller");
        }
        this.pollCallback = callback;
        this.on("poll", this.repoll);
        this.masterTimer = setTimeout(() => {
          if (this.completed) {
            return;
          }
          this.markCompleted();
          this.reject(new Error("ExponentialBackoffPoller deadline exceeded - Master timeout reached"));
        }, this.masterTimeoutMillis);
        return new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
          this.repoll();
        });
      }
      repoll() {
        this.pollCallback().then((result) => {
          if (this.completed) {
            return;
          }
          if (!result) {
            this.repollTimer = setTimeout(() => this.emit("poll"), this.getPollingDelayMillis());
            this.numTries++;
            return;
          }
          this.markCompleted();
          this.resolve(result);
        }).catch((err) => {
          if (this.completed) {
            return;
          }
          this.markCompleted();
          this.reject(err);
        });
      }
      getPollingDelayMillis() {
        const increasedPollingDelay = Math.pow(2, this.numTries) * this.initialPollingDelayMillis;
        return Math.min(increasedPollingDelay, this.maxPollingDelayMillis);
      }
      markCompleted() {
        this.completed = true;
        if (this.masterTimer) {
          clearTimeout(this.masterTimer);
        }
        if (this.repollTimer) {
          clearTimeout(this.repollTimer);
        }
      }
    };
    exports.ExponentialBackoffPoller = ExponentialBackoffPoller;
    var Http2SessionHandler = class {
      constructor(url) {
        this.sessionErrors = [];
        this.createSession(url);
      }
      createSession(url) {
        if (!this.http2Session || this.isCurrentSessionClosed) {
          this.sessionErrors = [];
          const opts = {
            // Set local max concurrent stream limit to respect backend limit
            peerMaxConcurrentStreams: 100,
            ALPNProtocols: ["h2"]
          };
          this.http2Session = http2.connect(url, opts);
          this.http2Session.on("goaway", (errorCode, _, opaqueData) => {
            const error = new error_2.FirebaseAppError({
              code: error_2.AppErrorCode.NETWORK_ERROR,
              message: `Error while making requests: GOAWAY - ${opaqueData?.toString()}, Error code: ${errorCode}`
            });
            this.sessionErrors.push(error);
          });
          this.http2Session.on("error", (error) => {
            const codePart = error?.code ? `${error.code} - ` : "";
            let errorMessage;
            if ((error instanceof AggregateError || error?.name === "AggregateError") && Array.isArray(error.errors)) {
              errorMessage = `Session error while making requests: ${codePart}${error.name}: [${error.errors.map((e) => e.message).join(", ")}]`;
            } else {
              errorMessage = `Session error while making requests: ${codePart}${error?.message || "Unknown error"}`;
            }
            const appError = new error_2.FirebaseAppError({
              code: error_2.AppErrorCode.NETWORK_ERROR,
              message: errorMessage,
              cause: error
            });
            this.sessionErrors.push(appError);
          });
        }
        return this.http2Session;
      }
      getErrors() {
        return this.sessionErrors;
      }
      get session() {
        return this.http2Session;
      }
      get isCurrentSessionClosed() {
        return !!this.http2Session?.closed;
      }
      close() {
        this.http2Session?.close();
      }
    };
    exports.Http2SessionHandler = Http2SessionHandler;
  }
});

// node_modules/firebase-admin/lib/auth/user-import-builder.js
var require_user_import_builder = __commonJS({
  "node_modules/firebase-admin/lib/auth/user-import-builder.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserImportBuilder = void 0;
    exports.convertMultiFactorInfoToServerFormat = convertMultiFactorInfoToServerFormat;
    var deep_copy_1 = require_deep_copy();
    var utils = require_utils();
    var validator = require_validator();
    var error_1 = require_error3();
    function convertMultiFactorInfoToServerFormat(multiFactorInfo) {
      let enrolledAt;
      if (typeof multiFactorInfo.enrollmentTime !== "undefined") {
        if (validator.isUTCDateString(multiFactorInfo.enrollmentTime)) {
          enrolledAt = new Date(multiFactorInfo.enrollmentTime).toISOString();
        } else {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ENROLLMENT_TIME, `The second factor "enrollmentTime" for "${multiFactorInfo.uid}" must be a valid UTC date string.`);
        }
      }
      if (isPhoneFactor(multiFactorInfo)) {
        const authFactorInfo = {
          mfaEnrollmentId: multiFactorInfo.uid,
          displayName: multiFactorInfo.displayName,
          // Required for all phone second factors.
          phoneInfo: multiFactorInfo.phoneNumber,
          enrolledAt
        };
        for (const objKey in authFactorInfo) {
          if (typeof authFactorInfo[objKey] === "undefined") {
            delete authFactorInfo[objKey];
          }
        }
        return authFactorInfo;
      } else {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.UNSUPPORTED_SECOND_FACTOR, `Unsupported second factor "${JSON.stringify(multiFactorInfo)}" provided.`);
      }
    }
    function isPhoneFactor(multiFactorInfo) {
      return multiFactorInfo.factorId === "phone";
    }
    function getNumberField(obj, key) {
      if (typeof obj[key] !== "undefined" && obj[key] !== null) {
        return parseInt(obj[key].toString(), 10);
      }
      return NaN;
    }
    function populateUploadAccountUser(user, userValidator) {
      const result = {
        localId: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        disabled: user.disabled,
        photoUrl: user.photoURL,
        phoneNumber: user.phoneNumber,
        providerUserInfo: [],
        mfaInfo: [],
        tenantId: user.tenantId,
        customAttributes: user.customClaims && JSON.stringify(user.customClaims)
      };
      if (typeof user.passwordHash !== "undefined") {
        if (!validator.isBuffer(user.passwordHash)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PASSWORD_HASH);
        }
        result.passwordHash = utils.toWebSafeBase64(user.passwordHash);
      }
      if (typeof user.passwordSalt !== "undefined") {
        if (!validator.isBuffer(user.passwordSalt)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PASSWORD_SALT);
        }
        result.salt = utils.toWebSafeBase64(user.passwordSalt);
      }
      if (validator.isNonNullObject(user.metadata)) {
        if (validator.isNonEmptyString(user.metadata.creationTime)) {
          result.createdAt = new Date(user.metadata.creationTime).getTime();
        }
        if (validator.isNonEmptyString(user.metadata.lastSignInTime)) {
          result.lastLoginAt = new Date(user.metadata.lastSignInTime).getTime();
        }
      }
      if (validator.isArray(user.providerData)) {
        user.providerData.forEach((providerData) => {
          result.providerUserInfo.push({
            providerId: providerData.providerId,
            rawId: providerData.uid,
            email: providerData.email,
            displayName: providerData.displayName,
            photoUrl: providerData.photoURL
          });
        });
      }
      if (validator.isNonNullObject(user.multiFactor) && validator.isNonEmptyArray(user.multiFactor.enrolledFactors)) {
        user.multiFactor.enrolledFactors.forEach((multiFactorInfo) => {
          result.mfaInfo.push(convertMultiFactorInfoToServerFormat(multiFactorInfo));
        });
      }
      let key;
      for (key in result) {
        if (typeof result[key] === "undefined") {
          delete result[key];
        }
      }
      if (result.providerUserInfo.length === 0) {
        delete result.providerUserInfo;
      }
      if (result.mfaInfo.length === 0) {
        delete result.mfaInfo;
      }
      if (typeof userValidator === "function") {
        userValidator(result);
      }
      return result;
    }
    var UserImportBuilder = class {
      /**
       * @param {UserImportRecord[]} users The list of user records to import.
       * @param {UserImportOptions=} options The import options which includes hashing
       *     algorithm details.
       * @param {ValidatorFunction=} userRequestValidator The user request validator function.
       * @constructor
       */
      constructor(users, options, userRequestValidator) {
        this.requiresHashOptions = false;
        this.validatedUsers = [];
        this.userImportResultErrors = [];
        this.indexMap = {};
        this.validatedUsers = this.populateUsers(users, userRequestValidator);
        this.validatedOptions = this.populateOptions(options, this.requiresHashOptions);
      }
      /**
       * Returns the corresponding constructed uploadAccount request.
       * @returns {UploadAccountRequest} The constructed uploadAccount request.
       */
      buildRequest() {
        const users = this.validatedUsers.map((user) => {
          return (0, deep_copy_1.deepCopy)(user);
        });
        return (0, deep_copy_1.deepExtend)({ users }, (0, deep_copy_1.deepCopy)(this.validatedOptions));
      }
      /**
       * Populates the UserImportResult using the client side detected errors and the server
       * side returned errors.
       * @returns {UserImportResult} The user import result based on the returned failed
       *     uploadAccount response.
       */
      buildResponse(failedUploads) {
        const importResult = {
          successCount: this.validatedUsers.length,
          failureCount: this.userImportResultErrors.length,
          errors: (0, deep_copy_1.deepCopy)(this.userImportResultErrors)
        };
        importResult.failureCount += failedUploads.length;
        importResult.successCount -= failedUploads.length;
        failedUploads.forEach((failedUpload) => {
          importResult.errors.push({
            // Map backend request index to original developer provided array index.
            index: this.indexMap[failedUpload.index],
            error: new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_USER_IMPORT, failedUpload.message)
          });
        });
        importResult.errors.sort((a, b) => {
          return a.index - b.index;
        });
        return importResult;
      }
      /**
       * Validates and returns the hashing options of the uploadAccount request.
       * Throws an error whenever an invalid or missing options is detected.
       * @param {UserImportOptions} options The UserImportOptions.
       * @param {boolean} requiresHashOptions Whether to require hash options.
       * @returns {UploadAccountOptions} The populated UploadAccount options.
       */
      populateOptions(options, requiresHashOptions) {
        let populatedOptions;
        if (!requiresHashOptions) {
          return {};
        }
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"UserImportOptions" are required when importing users with passwords.');
        }
        if (!validator.isNonNullObject(options.hash)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MISSING_HASH_ALGORITHM, '"hash.algorithm" is missing from the provided "UserImportOptions".');
        }
        if (typeof options.hash.algorithm === "undefined" || !validator.isNonEmptyString(options.hash.algorithm)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_ALGORITHM, '"hash.algorithm" must be a string matching the list of supported algorithms.');
        }
        let rounds;
        switch (options.hash.algorithm) {
          case "HMAC_SHA512":
          case "HMAC_SHA256":
          case "HMAC_SHA1":
          case "HMAC_MD5":
            if (!validator.isBuffer(options.hash.key)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_KEY, `A non-empty "hash.key" byte buffer must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            populatedOptions = {
              hashAlgorithm: options.hash.algorithm,
              signerKey: utils.toWebSafeBase64(options.hash.key)
            };
            break;
          case "MD5":
          case "SHA1":
          case "SHA256":
          case "SHA512": {
            rounds = getNumberField(options.hash, "rounds");
            const minRounds = options.hash.algorithm === "MD5" ? 0 : 1;
            if (isNaN(rounds) || rounds < minRounds || rounds > 8192) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_ROUNDS, `A valid "hash.rounds" number between ${minRounds} and 8192 must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            populatedOptions = {
              hashAlgorithm: options.hash.algorithm,
              rounds
            };
            break;
          }
          case "PBKDF_SHA1":
          case "PBKDF2_SHA256":
            rounds = getNumberField(options.hash, "rounds");
            if (isNaN(rounds) || rounds < 0 || rounds > 12e4) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_ROUNDS, `A valid "hash.rounds" number between 0 and 120000 must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            populatedOptions = {
              hashAlgorithm: options.hash.algorithm,
              rounds
            };
            break;
          case "SCRYPT": {
            if (!validator.isBuffer(options.hash.key)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_KEY, `A "hash.key" byte buffer must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            rounds = getNumberField(options.hash, "rounds");
            if (isNaN(rounds) || rounds <= 0 || rounds > 8) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_ROUNDS, `A valid "hash.rounds" number between 1 and 8 must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            const memoryCost = getNumberField(options.hash, "memoryCost");
            if (isNaN(memoryCost) || memoryCost <= 0 || memoryCost > 14) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_MEMORY_COST, `A valid "hash.memoryCost" number between 1 and 14 must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            if (typeof options.hash.saltSeparator !== "undefined" && !validator.isBuffer(options.hash.saltSeparator)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_SALT_SEPARATOR, '"hash.saltSeparator" must be a byte buffer.');
            }
            populatedOptions = {
              hashAlgorithm: options.hash.algorithm,
              signerKey: utils.toWebSafeBase64(options.hash.key),
              rounds,
              memoryCost,
              saltSeparator: utils.toWebSafeBase64(options.hash.saltSeparator || Buffer.from(""))
            };
            break;
          }
          case "BCRYPT":
            populatedOptions = {
              hashAlgorithm: options.hash.algorithm
            };
            break;
          case "STANDARD_SCRYPT": {
            const cpuMemCost = getNumberField(options.hash, "memoryCost");
            if (isNaN(cpuMemCost)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_MEMORY_COST, `A valid "hash.memoryCost" number must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            const parallelization = getNumberField(options.hash, "parallelization");
            if (isNaN(parallelization)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_PARALLELIZATION, `A valid "hash.parallelization" number must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            const blockSize = getNumberField(options.hash, "blockSize");
            if (isNaN(blockSize)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_BLOCK_SIZE, `A valid "hash.blockSize" number must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            const dkLen = getNumberField(options.hash, "derivedKeyLength");
            if (isNaN(dkLen)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_DERIVED_KEY_LENGTH, `A valid "hash.derivedKeyLength" number must be provided for hash algorithm ${options.hash.algorithm}.`);
            }
            populatedOptions = {
              hashAlgorithm: options.hash.algorithm,
              cpuMemCost,
              parallelization,
              blockSize,
              dkLen
            };
            break;
          }
          default:
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HASH_ALGORITHM, `Unsupported hash algorithm provider "${options.hash.algorithm}".`);
        }
        return populatedOptions;
      }
      /**
       * Validates and returns the users list of the uploadAccount request.
       * Whenever a user with an error is detected, the error is cached and will later be
       * merged into the user import result. This allows the processing of valid users without
       * failing early on the first error detected.
       * @param {UserImportRecord[]} users The UserImportRecords to convert to UnploadAccountUser
       *     objects.
       * @param {ValidatorFunction=} userValidator The user validator function.
       * @returns {UploadAccountUser[]} The populated uploadAccount users.
       */
      populateUsers(users, userValidator) {
        const populatedUsers = [];
        users.forEach((user, index) => {
          try {
            const result = populateUploadAccountUser(user, userValidator);
            if (typeof result.passwordHash !== "undefined") {
              this.requiresHashOptions = true;
            }
            populatedUsers.push(result);
            this.indexMap[populatedUsers.length - 1] = index;
          } catch (error) {
            this.userImportResultErrors.push({
              index,
              error
            });
          }
        });
        return populatedUsers;
      }
    };
    exports.UserImportBuilder = UserImportBuilder;
  }
});

// node_modules/firebase-admin/lib/auth/action-code-settings-builder.js
var require_action_code_settings_builder = __commonJS({
  "node_modules/firebase-admin/lib/auth/action-code-settings-builder.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActionCodeSettingsBuilder = void 0;
    var validator = require_validator();
    var error_1 = require_error3();
    var ActionCodeSettingsBuilder = class {
      /**
       * ActionCodeSettingsBuilder constructor.
       *
       * @param {ActionCodeSettings} actionCodeSettings The ActionCodeSettings
       *     object used to initiliaze this server request builder.
       * @constructor
       */
      constructor(actionCodeSettings) {
        if (!validator.isNonNullObject(actionCodeSettings)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"ActionCodeSettings" must be a non-null object.');
        }
        if (typeof actionCodeSettings.url === "undefined") {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MISSING_CONTINUE_URI);
        } else if (!validator.isURL(actionCodeSettings.url)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONTINUE_URI);
        }
        this.continueUrl = actionCodeSettings.url;
        if (typeof actionCodeSettings.handleCodeInApp !== "undefined" && !validator.isBoolean(actionCodeSettings.handleCodeInApp)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"ActionCodeSettings.handleCodeInApp" must be a boolean.');
        }
        this.canHandleCodeInApp = actionCodeSettings.handleCodeInApp || false;
        if (typeof actionCodeSettings.dynamicLinkDomain !== "undefined" && !validator.isNonEmptyString(actionCodeSettings.dynamicLinkDomain)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_DYNAMIC_LINK_DOMAIN);
        }
        this.dynamicLinkDomain = actionCodeSettings.dynamicLinkDomain;
        if (typeof actionCodeSettings.linkDomain !== "undefined" && !validator.isNonEmptyString(actionCodeSettings.linkDomain)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_HOSTING_LINK_DOMAIN);
        }
        this.linkDomain = actionCodeSettings.linkDomain;
        if (typeof actionCodeSettings.iOS !== "undefined") {
          if (!validator.isNonNullObject(actionCodeSettings.iOS)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"ActionCodeSettings.iOS" must be a valid non-null object.');
          } else if (typeof actionCodeSettings.iOS.bundleId === "undefined") {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MISSING_IOS_BUNDLE_ID);
          } else if (!validator.isNonEmptyString(actionCodeSettings.iOS.bundleId)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"ActionCodeSettings.iOS.bundleId" must be a valid non-empty string.');
          }
          this.ibi = actionCodeSettings.iOS.bundleId;
        }
        if (typeof actionCodeSettings.android !== "undefined") {
          if (!validator.isNonNullObject(actionCodeSettings.android)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"ActionCodeSettings.android" must be a valid non-null object.');
          } else if (typeof actionCodeSettings.android.packageName === "undefined") {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MISSING_ANDROID_PACKAGE_NAME);
          } else if (!validator.isNonEmptyString(actionCodeSettings.android.packageName)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"ActionCodeSettings.android.packageName" must be a valid non-empty string.');
          } else if (typeof actionCodeSettings.android.minimumVersion !== "undefined" && !validator.isNonEmptyString(actionCodeSettings.android.minimumVersion)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"ActionCodeSettings.android.minimumVersion" must be a valid non-empty string.');
          } else if (typeof actionCodeSettings.android.installApp !== "undefined" && !validator.isBoolean(actionCodeSettings.android.installApp)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"ActionCodeSettings.android.installApp" must be a valid boolean.');
          }
          this.apn = actionCodeSettings.android.packageName;
          this.amv = actionCodeSettings.android.minimumVersion;
          this.installApp = actionCodeSettings.android.installApp || false;
        }
      }
      /**
       * Returns the corresponding constructed server request corresponding to the
       * current ActionCodeSettings.
       *
       * @returns The constructed EmailActionCodeRequest request.
       */
      buildRequest() {
        const request = {
          continueUrl: this.continueUrl,
          canHandleCodeInApp: this.canHandleCodeInApp,
          dynamicLinkDomain: this.dynamicLinkDomain,
          linkDomain: this.linkDomain,
          androidPackageName: this.apn,
          androidMinimumVersion: this.amv,
          androidInstallApp: this.installApp,
          iOSBundleId: this.ibi
        };
        for (const key in request) {
          if (Object.prototype.hasOwnProperty.call(request, key)) {
            if (typeof request[key] === "undefined" || request[key] === null) {
              delete request[key];
            }
          }
        }
        return request;
      }
    };
    exports.ActionCodeSettingsBuilder = ActionCodeSettingsBuilder;
  }
});

// node_modules/firebase-admin/lib/auth/auth-config.js
var require_auth_config = __commonJS({
  "node_modules/firebase-admin/lib/auth/auth-config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmailPrivacyAuthConfig = exports.PasswordPolicyAuthConfig = exports.MobileLinksAuthConfig = exports.RecaptchaAuthConfig = exports.SmsRegionsAuthConfig = exports.OIDCConfig = exports.SAMLConfig = exports.EmailSignInConfig = exports.MultiFactorAuthConfig = exports.MAXIMUM_TEST_PHONE_NUMBERS = void 0;
    exports.validateTestPhoneNumbers = validateTestPhoneNumbers;
    var validator = require_validator();
    var deep_copy_1 = require_deep_copy();
    var error_1 = require_error3();
    exports.MAXIMUM_TEST_PHONE_NUMBERS = 10;
    var AUTH_FACTOR_CLIENT_TO_SERVER_TYPE = {
      phone: "PHONE_SMS"
    };
    var AUTH_FACTOR_SERVER_TO_CLIENT_TYPE = Object.keys(AUTH_FACTOR_CLIENT_TO_SERVER_TYPE).reduce((res, key) => {
      res[AUTH_FACTOR_CLIENT_TO_SERVER_TYPE[key]] = key;
      return res;
    }, {});
    var MultiFactorAuthConfig = class _MultiFactorAuthConfig {
      /**
       * Static method to convert a client side request to a MultiFactorAuthServerConfig.
       * Throws an error if validation fails.
       *
       * @param options - The options object to convert to a server request.
       * @returns The resulting server request.
       * @internal
       */
      static buildServerRequest(options) {
        const request = {};
        _MultiFactorAuthConfig.validate(options);
        if (Object.prototype.hasOwnProperty.call(options, "state")) {
          request.state = options.state;
        }
        if (Object.prototype.hasOwnProperty.call(options, "factorIds")) {
          (options.factorIds || []).forEach((factorId) => {
            if (typeof request.enabledProviders === "undefined") {
              request.enabledProviders = [];
            }
            request.enabledProviders.push(AUTH_FACTOR_CLIENT_TO_SERVER_TYPE[factorId]);
          });
          if (options.factorIds && options.factorIds.length === 0) {
            request.enabledProviders = [];
          }
        }
        if (Object.prototype.hasOwnProperty.call(options, "providerConfigs")) {
          request.providerConfigs = options.providerConfigs;
        }
        return request;
      }
      /**
       * Validates the MultiFactorConfig options object. Throws an error on failure.
       *
       * @param options - The options object to validate.
       */
      static validate(options) {
        const validKeys = {
          state: true,
          factorIds: true,
          providerConfigs: true
        };
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"MultiFactorConfig" must be a non-null object.');
        }
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid MultiFactorConfig parameter.`);
          }
        }
        if (typeof options.state !== "undefined" && options.state !== "ENABLED" && options.state !== "DISABLED") {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"MultiFactorConfig.state" must be either "ENABLED" or "DISABLED".');
        }
        if (typeof options.factorIds !== "undefined") {
          if (!validator.isArray(options.factorIds)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"MultiFactorConfig.factorIds" must be an array of valid "AuthFactorTypes".');
          }
          options.factorIds.forEach((factorId) => {
            if (typeof AUTH_FACTOR_CLIENT_TO_SERVER_TYPE[factorId] === "undefined") {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${factorId}" is not a valid "AuthFactorType".`);
            }
          });
        }
        if (typeof options.providerConfigs !== "undefined") {
          if (!validator.isArray(options.providerConfigs)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"MultiFactorConfig.providerConfigs" must be an array of valid "MultiFactorProviderConfig."');
          }
          options.providerConfigs.forEach((multiFactorProviderConfig) => {
            if (typeof multiFactorProviderConfig === "undefined" || !validator.isObject(multiFactorProviderConfig)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${multiFactorProviderConfig}" is not a valid "MultiFactorProviderConfig" type.`);
            }
            const validProviderConfigKeys = {
              state: true,
              totpProviderConfig: true
            };
            for (const key in multiFactorProviderConfig) {
              if (!(key in validProviderConfigKeys)) {
                throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid ProviderConfig parameter.`);
              }
            }
            if (typeof multiFactorProviderConfig.state === "undefined" || multiFactorProviderConfig.state !== "ENABLED" && multiFactorProviderConfig.state !== "DISABLED") {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"MultiFactorConfig.providerConfigs.state" must be either "ENABLED" or "DISABLED".');
            }
            if (typeof multiFactorProviderConfig.totpProviderConfig === "undefined") {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"MultiFactorConfig.providerConfigs.totpProviderConfig" must be defined.');
            }
            const validTotpProviderConfigKeys = {
              adjacentIntervals: true
            };
            for (const key in multiFactorProviderConfig.totpProviderConfig) {
              if (!(key in validTotpProviderConfigKeys)) {
                throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid TotpProviderConfig parameter.`);
              }
            }
            const adjIntervals = multiFactorProviderConfig.totpProviderConfig.adjacentIntervals;
            if (typeof adjIntervals !== "undefined" && (!Number.isInteger(adjIntervals) || adjIntervals < 0 || adjIntervals > 10)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"MultiFactorConfig.providerConfigs.totpProviderConfig.adjacentIntervals" must be a valid number between 0 and 10 (both inclusive).');
            }
          });
        }
      }
      /**
       * The MultiFactorAuthConfig constructor.
       *
       * @param response - The server side response used to initialize the
       *     MultiFactorAuthConfig object.
       * @constructor
       * @internal
       */
      constructor(response) {
        if (typeof response.state === "undefined") {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid multi-factor configuration response");
        }
        this.state = response.state;
        this.factorIds = [];
        (response.enabledProviders || []).forEach((enabledProvider) => {
          if (typeof AUTH_FACTOR_SERVER_TO_CLIENT_TYPE[enabledProvider] !== "undefined") {
            this.factorIds.push(AUTH_FACTOR_SERVER_TO_CLIENT_TYPE[enabledProvider]);
          }
        });
        this.providerConfigs = [];
        (response.providerConfigs || []).forEach((providerConfig) => {
          if (typeof providerConfig !== "undefined") {
            if (typeof providerConfig.state === "undefined" || typeof providerConfig.totpProviderConfig === "undefined" || typeof providerConfig.totpProviderConfig.adjacentIntervals !== "undefined" && typeof providerConfig.totpProviderConfig.adjacentIntervals !== "number") {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid multi-factor configuration response");
            }
            this.providerConfigs.push(providerConfig);
          }
        });
      }
      /** Converts MultiFactorConfig to JSON object
       * @returns The plain object representation of the multi-factor config instance. */
      toJSON() {
        return {
          state: this.state,
          factorIds: this.factorIds,
          providerConfigs: this.providerConfigs
        };
      }
    };
    exports.MultiFactorAuthConfig = MultiFactorAuthConfig;
    function validateTestPhoneNumbers(testPhoneNumbers) {
      if (!validator.isObject(testPhoneNumbers)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"testPhoneNumbers" must be a map of phone number / code pairs.');
      }
      if (Object.keys(testPhoneNumbers).length > exports.MAXIMUM_TEST_PHONE_NUMBERS) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MAXIMUM_TEST_PHONE_NUMBER_EXCEEDED);
      }
      for (const phoneNumber in testPhoneNumbers) {
        if (!validator.isPhoneNumber(phoneNumber)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_TESTING_PHONE_NUMBER, `"${phoneNumber}" is not a valid E.164 standard compliant phone number.`);
        }
        if (!validator.isString(testPhoneNumbers[phoneNumber]) || !/^[\d]{6}$/.test(testPhoneNumbers[phoneNumber])) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_TESTING_PHONE_NUMBER, `"${testPhoneNumbers[phoneNumber]}" is not a valid 6 digit code string.`);
        }
      }
    }
    var EmailSignInConfig = class _EmailSignInConfig {
      /**
       * Static method to convert a client side request to a EmailSignInConfigServerRequest.
       * Throws an error if validation fails.
       *
       * @param options - The options object to convert to a server request.
       * @returns The resulting server request.
       * @internal
       */
      static buildServerRequest(options) {
        const request = {};
        _EmailSignInConfig.validate(options);
        if (Object.prototype.hasOwnProperty.call(options, "enabled")) {
          request.allowPasswordSignup = options.enabled;
        }
        if (Object.prototype.hasOwnProperty.call(options, "passwordRequired")) {
          request.enableEmailLinkSignin = !options.passwordRequired;
        }
        return request;
      }
      /**
       * Validates the EmailSignInConfig options object. Throws an error on failure.
       *
       * @param options - The options object to validate.
       */
      static validate(options) {
        const validKeys = {
          enabled: true,
          passwordRequired: true
        };
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"EmailSignInConfig" must be a non-null object.');
        }
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `"${key}" is not a valid EmailSignInConfig parameter.`);
          }
        }
        if (typeof options.enabled !== "undefined" && !validator.isBoolean(options.enabled)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"EmailSignInConfig.enabled" must be a boolean.');
        }
        if (typeof options.passwordRequired !== "undefined" && !validator.isBoolean(options.passwordRequired)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"EmailSignInConfig.passwordRequired" must be a boolean.');
        }
      }
      /**
       * The EmailSignInConfig constructor.
       *
       * @param response - The server side response used to initialize the
       *     EmailSignInConfig object.
       * @constructor
       */
      constructor(response) {
        if (typeof response.allowPasswordSignup === "undefined") {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid email sign-in configuration response");
        }
        this.enabled = response.allowPasswordSignup;
        this.passwordRequired = !response.enableEmailLinkSignin;
      }
      /** @returns The plain object representation of the email sign-in config. */
      toJSON() {
        return {
          enabled: this.enabled,
          passwordRequired: this.passwordRequired
        };
      }
    };
    exports.EmailSignInConfig = EmailSignInConfig;
    var SAMLConfig = class _SAMLConfig {
      /**
       * Converts a client side request to a SAMLConfigServerRequest which is the format
       * accepted by the backend server.
       * Throws an error if validation fails. If the request is not a SAMLConfig request,
       * returns null.
       *
       * @param options - The options object to convert to a server request.
       * @param ignoreMissingFields - Whether to ignore missing fields.
       * @returns The resulting server request or null if not valid.
       */
      static buildServerRequest(options, ignoreMissingFields = false) {
        const makeRequest = validator.isNonNullObject(options) && (options.providerId || ignoreMissingFields);
        if (!makeRequest) {
          return null;
        }
        const request = {};
        _SAMLConfig.validate(options, ignoreMissingFields);
        request.enabled = options.enabled;
        request.displayName = options.displayName;
        if (options.idpEntityId || options.ssoURL || options.x509Certificates) {
          request.idpConfig = {
            idpEntityId: options.idpEntityId,
            ssoUrl: options.ssoURL,
            signRequest: options.enableRequestSigning,
            idpCertificates: typeof options.x509Certificates === "undefined" ? void 0 : []
          };
          if (options.x509Certificates) {
            for (const cert2 of options.x509Certificates || []) {
              request.idpConfig.idpCertificates.push({ x509Certificate: cert2 });
            }
          }
        }
        if (options.callbackURL || options.rpEntityId) {
          request.spConfig = {
            spEntityId: options.rpEntityId,
            callbackUri: options.callbackURL
          };
        }
        return request;
      }
      /**
       * Returns the provider ID corresponding to the resource name if available.
       *
       * @param resourceName - The server side resource name.
       * @returns The provider ID corresponding to the resource, null otherwise.
       */
      static getProviderIdFromResourceName(resourceName) {
        const matchProviderRes = resourceName.match(/\/inboundSamlConfigs\/(saml\..*)$/);
        if (!matchProviderRes || matchProviderRes.length < 2) {
          return null;
        }
        return matchProviderRes[1];
      }
      /**
       * @param providerId - The provider ID to check.
       * @returns Whether the provider ID corresponds to a SAML provider.
       */
      static isProviderId(providerId) {
        return validator.isNonEmptyString(providerId) && providerId.indexOf("saml.") === 0;
      }
      /**
       * Validates the SAMLConfig options object. Throws an error on failure.
       *
       * @param options - The options object to validate.
       * @param ignoreMissingFields - Whether to ignore missing fields.
       */
      static validate(options, ignoreMissingFields = false) {
        const validKeys = {
          enabled: true,
          displayName: true,
          providerId: true,
          idpEntityId: true,
          ssoURL: true,
          x509Certificates: true,
          rpEntityId: true,
          callbackURL: true,
          enableRequestSigning: true
        };
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig" must be a valid non-null object.');
        }
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid SAML config parameter.`);
          }
        }
        if (validator.isNonEmptyString(options.providerId)) {
          if (options.providerId.indexOf("saml.") !== 0) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID, '"SAMLAuthProviderConfig.providerId" must be a valid non-empty string prefixed with "saml.".');
          }
        } else if (!ignoreMissingFields) {
          throw new error_1.FirebaseAuthError(!options.providerId ? error_1.authClientErrorCode.MISSING_PROVIDER_ID : error_1.authClientErrorCode.INVALID_PROVIDER_ID, '"SAMLAuthProviderConfig.providerId" must be a valid non-empty string prefixed with "saml.".');
        }
        if (!(ignoreMissingFields && typeof options.idpEntityId === "undefined") && !validator.isNonEmptyString(options.idpEntityId)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig.idpEntityId" must be a valid non-empty string.');
        }
        if (!(ignoreMissingFields && typeof options.ssoURL === "undefined") && !validator.isURL(options.ssoURL)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig.ssoURL" must be a valid URL string.');
        }
        if (!(ignoreMissingFields && typeof options.rpEntityId === "undefined") && !validator.isNonEmptyString(options.rpEntityId)) {
          throw new error_1.FirebaseAuthError(!options.rpEntityId ? error_1.authClientErrorCode.MISSING_SAML_RELYING_PARTY_CONFIG : error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig.rpEntityId" must be a valid non-empty string.');
        }
        if (!(ignoreMissingFields && typeof options.callbackURL === "undefined") && !validator.isURL(options.callbackURL)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig.callbackURL" must be a valid URL string.');
        }
        if (!(ignoreMissingFields && typeof options.x509Certificates === "undefined") && !validator.isArray(options.x509Certificates)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig.x509Certificates" must be a valid array of X509 certificate strings.');
        }
        (options.x509Certificates || []).forEach((cert2) => {
          if (!validator.isNonEmptyString(cert2)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig.x509Certificates" must be a valid array of X509 certificate strings.');
          }
        });
        if (typeof options.enableRequestSigning !== "undefined" && !validator.isBoolean(options.enableRequestSigning)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig.enableRequestSigning" must be a boolean.');
        }
        if (typeof options.enabled !== "undefined" && !validator.isBoolean(options.enabled)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig.enabled" must be a boolean.');
        }
        if (typeof options.displayName !== "undefined" && !validator.isString(options.displayName)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SAMLAuthProviderConfig.displayName" must be a valid string.');
        }
      }
      /**
       * The SAMLConfig constructor.
       *
       * @param response - The server side response used to initialize the SAMLConfig object.
       * @constructor
       */
      constructor(response) {
        if (!response || !response.idpConfig || !response.idpConfig.idpEntityId || !response.idpConfig.ssoUrl || !response.spConfig || !response.spConfig.spEntityId || !response.name || !(validator.isString(response.name) && _SAMLConfig.getProviderIdFromResourceName(response.name))) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid SAML configuration response");
        }
        const providerId = _SAMLConfig.getProviderIdFromResourceName(response.name);
        if (!providerId) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid SAML configuration response");
        }
        this.providerId = providerId;
        this.rpEntityId = response.spConfig.spEntityId;
        this.callbackURL = response.spConfig.callbackUri;
        this.idpEntityId = response.idpConfig.idpEntityId;
        this.ssoURL = response.idpConfig.ssoUrl;
        this.enableRequestSigning = !!response.idpConfig.signRequest;
        const x509Certificates = [];
        for (const cert2 of response.idpConfig.idpCertificates || []) {
          if (cert2.x509Certificate) {
            x509Certificates.push(cert2.x509Certificate);
          }
        }
        this.x509Certificates = x509Certificates;
        this.enabled = !!response.enabled;
        this.displayName = response.displayName;
      }
      /** @returns The plain object representation of the SAMLConfig. */
      toJSON() {
        return {
          enabled: this.enabled,
          displayName: this.displayName,
          providerId: this.providerId,
          idpEntityId: this.idpEntityId,
          ssoURL: this.ssoURL,
          x509Certificates: (0, deep_copy_1.deepCopy)(this.x509Certificates),
          rpEntityId: this.rpEntityId,
          callbackURL: this.callbackURL,
          enableRequestSigning: this.enableRequestSigning
        };
      }
    };
    exports.SAMLConfig = SAMLConfig;
    var OIDCConfig = class _OIDCConfig {
      /**
       * Converts a client side request to a OIDCConfigServerRequest which is the format
       * accepted by the backend server.
       * Throws an error if validation fails. If the request is not a OIDCConfig request,
       * returns null.
       *
       * @param options - The options object to convert to a server request.
       * @param ignoreMissingFields - Whether to ignore missing fields.
       * @returns The resulting server request or null if not valid.
       */
      static buildServerRequest(options, ignoreMissingFields = false) {
        const makeRequest = validator.isNonNullObject(options) && (options.providerId || ignoreMissingFields);
        if (!makeRequest) {
          return null;
        }
        const request = {};
        _OIDCConfig.validate(options, ignoreMissingFields);
        request.enabled = options.enabled;
        request.displayName = options.displayName;
        request.issuer = options.issuer;
        request.clientId = options.clientId;
        if (typeof options.clientSecret !== "undefined") {
          request.clientSecret = options.clientSecret;
        }
        if (typeof options.responseType !== "undefined") {
          request.responseType = options.responseType;
        }
        return request;
      }
      /**
       * Returns the provider ID corresponding to the resource name if available.
       *
       * @param resourceName - The server side resource name
       * @returns The provider ID corresponding to the resource, null otherwise.
       */
      static getProviderIdFromResourceName(resourceName) {
        const matchProviderRes = resourceName.match(/\/oauthIdpConfigs\/(oidc\..*)$/);
        if (!matchProviderRes || matchProviderRes.length < 2) {
          return null;
        }
        return matchProviderRes[1];
      }
      /**
       * @param providerId - The provider ID to check.
       * @returns Whether the provider ID corresponds to an OIDC provider.
       */
      static isProviderId(providerId) {
        return validator.isNonEmptyString(providerId) && providerId.indexOf("oidc.") === 0;
      }
      /**
       * Validates the OIDCConfig options object. Throws an error on failure.
       *
       * @param options - The options object to validate.
       * @param ignoreMissingFields - Whether to ignore missing fields.
       */
      static validate(options, ignoreMissingFields = false) {
        const validKeys = {
          enabled: true,
          displayName: true,
          providerId: true,
          clientId: true,
          issuer: true,
          clientSecret: true,
          responseType: true
        };
        const validResponseTypes = {
          idToken: true,
          code: true
        };
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"OIDCAuthProviderConfig" must be a valid non-null object.');
        }
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid OIDC config parameter.`);
          }
        }
        if (validator.isNonEmptyString(options.providerId)) {
          if (options.providerId.indexOf("oidc.") !== 0) {
            throw new error_1.FirebaseAuthError(!options.providerId ? error_1.authClientErrorCode.MISSING_PROVIDER_ID : error_1.authClientErrorCode.INVALID_PROVIDER_ID, '"OIDCAuthProviderConfig.providerId" must be a valid non-empty string prefixed with "oidc.".');
          }
        } else if (!ignoreMissingFields) {
          throw new error_1.FirebaseAuthError(!options.providerId ? error_1.authClientErrorCode.MISSING_PROVIDER_ID : error_1.authClientErrorCode.INVALID_PROVIDER_ID, '"OIDCAuthProviderConfig.providerId" must be a valid non-empty string prefixed with "oidc.".');
        }
        if (!(ignoreMissingFields && typeof options.clientId === "undefined") && !validator.isNonEmptyString(options.clientId)) {
          throw new error_1.FirebaseAuthError(!options.clientId ? error_1.authClientErrorCode.MISSING_OAUTH_CLIENT_ID : error_1.authClientErrorCode.INVALID_OAUTH_CLIENT_ID, '"OIDCAuthProviderConfig.clientId" must be a valid non-empty string.');
        }
        if (!(ignoreMissingFields && typeof options.issuer === "undefined") && !validator.isURL(options.issuer)) {
          throw new error_1.FirebaseAuthError(!options.issuer ? error_1.authClientErrorCode.MISSING_ISSUER : error_1.authClientErrorCode.INVALID_CONFIG, '"OIDCAuthProviderConfig.issuer" must be a valid URL string.');
        }
        if (typeof options.enabled !== "undefined" && !validator.isBoolean(options.enabled)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"OIDCAuthProviderConfig.enabled" must be a boolean.');
        }
        if (typeof options.displayName !== "undefined" && !validator.isString(options.displayName)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"OIDCAuthProviderConfig.displayName" must be a valid string.');
        }
        if (typeof options.clientSecret !== "undefined" && !validator.isNonEmptyString(options.clientSecret)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"OIDCAuthProviderConfig.clientSecret" must be a valid string.');
        }
        if (validator.isNonNullObject(options.responseType) && typeof options.responseType !== "undefined") {
          Object.keys(options.responseType).forEach((key) => {
            if (!(key in validResponseTypes)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid OAuthResponseType parameter.`);
            }
          });
          const idToken = options.responseType.idToken;
          if (typeof idToken !== "undefined" && !validator.isBoolean(idToken)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"OIDCAuthProviderConfig.responseType.idToken" must be a boolean.');
          }
          const code = options.responseType.code;
          if (typeof code !== "undefined") {
            if (!validator.isBoolean(code)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"OIDCAuthProviderConfig.responseType.code" must be a boolean.');
            }
            if (code && typeof options.clientSecret === "undefined") {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MISSING_OAUTH_CLIENT_SECRET, "The OAuth configuration client secret is required to enable OIDC code flow.");
            }
          }
          const allKeys = Object.keys(options.responseType).length;
          const enabledCount = Object.values(options.responseType).filter(Boolean).length;
          if (allKeys > 1 && enabledCount !== 1) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_OAUTH_RESPONSETYPE, "Only exactly one OAuth responseType should be set to true.");
          }
        }
      }
      /**
       * The OIDCConfig constructor.
       *
       * @param response - The server side response used to initialize the OIDCConfig object.
       * @constructor
       */
      constructor(response) {
        if (!response || !response.issuer || !response.clientId || !response.name || !(validator.isString(response.name) && _OIDCConfig.getProviderIdFromResourceName(response.name))) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid OIDC configuration response");
        }
        const providerId = _OIDCConfig.getProviderIdFromResourceName(response.name);
        if (!providerId) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid SAML configuration response");
        }
        this.providerId = providerId;
        this.clientId = response.clientId;
        this.issuer = response.issuer;
        this.enabled = !!response.enabled;
        this.displayName = response.displayName;
        if (typeof response.clientSecret !== "undefined") {
          this.clientSecret = response.clientSecret;
        }
        if (typeof response.responseType !== "undefined") {
          this.responseType = response.responseType;
        }
      }
      /** @returns The plain object representation of the OIDCConfig. */
      toJSON() {
        return {
          enabled: this.enabled,
          displayName: this.displayName,
          providerId: this.providerId,
          issuer: this.issuer,
          clientId: this.clientId,
          clientSecret: (0, deep_copy_1.deepCopy)(this.clientSecret),
          responseType: (0, deep_copy_1.deepCopy)(this.responseType)
        };
      }
    };
    exports.OIDCConfig = OIDCConfig;
    var SmsRegionsAuthConfig = class {
      static validate(options) {
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SmsRegionConfig" must be a non-null object.');
        }
        const validKeys = {
          allowlistOnly: true,
          allowByDefault: true
        };
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid SmsRegionConfig parameter.`);
          }
        }
        if (typeof options.allowByDefault !== "undefined" && typeof options.allowlistOnly !== "undefined") {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, 'SmsRegionConfig cannot have both "allowByDefault" and "allowlistOnly" parameters.');
        }
        if (typeof options.allowByDefault !== "undefined") {
          const allowByDefaultValidKeys = {
            disallowedRegions: true
          };
          for (const key in options.allowByDefault) {
            if (!(key in allowByDefaultValidKeys)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid SmsRegionConfig.allowByDefault parameter.`);
            }
          }
          if (typeof options.allowByDefault.disallowedRegions !== "undefined" && !validator.isArray(options.allowByDefault.disallowedRegions)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SmsRegionConfig.allowByDefault.disallowedRegions" must be a valid string array.');
          }
        }
        if (typeof options.allowlistOnly !== "undefined") {
          const allowListOnlyValidKeys = {
            allowedRegions: true
          };
          for (const key in options.allowlistOnly) {
            if (!(key in allowListOnlyValidKeys)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid SmsRegionConfig.allowlistOnly parameter.`);
            }
          }
          if (typeof options.allowlistOnly.allowedRegions !== "undefined" && !validator.isArray(options.allowlistOnly.allowedRegions)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"SmsRegionConfig.allowlistOnly.allowedRegions" must be a valid string array.');
          }
        }
      }
    };
    exports.SmsRegionsAuthConfig = SmsRegionsAuthConfig;
    var RecaptchaAuthConfig = class _RecaptchaAuthConfig {
      /**
       * The RecaptchaAuthConfig constructor.
       *
       * @param response - The server side response used to initialize the
       *     RecaptchaAuthConfig object.
       * @constructor
       * @internal
       */
      constructor(response) {
        const filteredResponse = Object.fromEntries(Object.entries(response).filter(([, value]) => value !== void 0));
        if (filteredResponse.tollFraudManagedRules !== void 0) {
          this.smsTollFraudManagedRules = filteredResponse.tollFraudManagedRules;
          delete filteredResponse.tollFraudManagedRules;
        }
        Object.assign(this, filteredResponse);
      }
      /**
       * Builds a server request object from the client-side RecaptchaConfig.
       * Converts client-side fields to their server-side equivalents.
       *
       * @param options - The client-side RecaptchaConfig object.
       * @returns The server-side RecaptchaAuthServerConfig object.
       */
      static buildServerRequest(options) {
        _RecaptchaAuthConfig.validate(options);
        const request = {};
        if (typeof options.emailPasswordEnforcementState !== "undefined") {
          request.emailPasswordEnforcementState = options.emailPasswordEnforcementState;
        }
        if (typeof options.phoneEnforcementState !== "undefined") {
          request.phoneEnforcementState = options.phoneEnforcementState;
        }
        if (typeof options.managedRules !== "undefined") {
          request.managedRules = options.managedRules;
        }
        if (typeof options.recaptchaKeys !== "undefined") {
          request.recaptchaKeys = options.recaptchaKeys;
        }
        if (typeof options.useAccountDefender !== "undefined") {
          request.useAccountDefender = options.useAccountDefender;
        }
        if (typeof options.useSmsBotScore !== "undefined") {
          request.useSmsBotScore = options.useSmsBotScore;
        }
        if (typeof options.useSmsTollFraudProtection !== "undefined") {
          request.useSmsTollFraudProtection = options.useSmsTollFraudProtection;
        }
        if (typeof options.smsTollFraudManagedRules !== "undefined") {
          request.tollFraudManagedRules = options.smsTollFraudManagedRules;
        }
        return request;
      }
      /**
       * Validates the RecaptchaConfig options object. Throws an error on failure.
       * @param options - The options object to validate.
       */
      static validate(options) {
        const validKeys = {
          emailPasswordEnforcementState: true,
          phoneEnforcementState: true,
          managedRules: true,
          recaptchaKeys: true,
          useAccountDefender: true,
          useSmsBotScore: true,
          useSmsTollFraudProtection: true,
          smsTollFraudManagedRules: true
        };
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaConfig" must be a non-null object.');
        }
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid RecaptchaConfig parameter.`);
          }
        }
        if (typeof options.emailPasswordEnforcementState !== "undefined") {
          if (!validator.isNonEmptyString(options.emailPasswordEnforcementState)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"RecaptchaConfig.emailPasswordEnforcementState" must be a valid non-empty string.');
          }
          if (options.emailPasswordEnforcementState !== "OFF" && options.emailPasswordEnforcementState !== "AUDIT" && options.emailPasswordEnforcementState !== "ENFORCE") {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaConfig.emailPasswordEnforcementState" must be either "OFF", "AUDIT" or "ENFORCE".');
          }
        }
        if (typeof options.phoneEnforcementState !== "undefined") {
          if (!validator.isNonEmptyString(options.phoneEnforcementState)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"RecaptchaConfig.phoneEnforcementState" must be a valid non-empty string.');
          }
          if (options.phoneEnforcementState !== "OFF" && options.phoneEnforcementState !== "AUDIT" && options.phoneEnforcementState !== "ENFORCE") {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaConfig.phoneEnforcementState" must be either "OFF", "AUDIT" or "ENFORCE".');
          }
        }
        if (typeof options.managedRules !== "undefined") {
          if (!validator.isArray(options.managedRules)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaConfig.managedRules" must be an array of valid "RecaptchaManagedRule".');
          }
          options.managedRules.forEach((managedRule) => {
            _RecaptchaAuthConfig.validateManagedRule(managedRule);
          });
        }
        if (typeof options.useAccountDefender !== "undefined") {
          if (!validator.isBoolean(options.useAccountDefender)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaConfig.useAccountDefender" must be a boolean value".');
          }
        }
        if (typeof options.useSmsBotScore !== "undefined") {
          if (!validator.isBoolean(options.useSmsBotScore)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaConfig.useSmsBotScore" must be a boolean value".');
          }
        }
        if (typeof options.useSmsTollFraudProtection !== "undefined") {
          if (!validator.isBoolean(options.useSmsTollFraudProtection)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaConfig.useSmsTollFraudProtection" must be a boolean value".');
          }
        }
        if (typeof options.smsTollFraudManagedRules !== "undefined") {
          if (!validator.isArray(options.smsTollFraudManagedRules)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaConfig.smsTollFraudManagedRules" must be an array of valid "RecaptchaTollFraudManagedRule".');
          }
          options.smsTollFraudManagedRules.forEach((tollFraudManagedRule) => {
            _RecaptchaAuthConfig.validateTollFraudManagedRule(tollFraudManagedRule);
          });
        }
      }
      /**
       * Validate each element in ManagedRule array
       * @param options - The options object to validate.
       */
      static validateManagedRule(options) {
        const validKeys = {
          endScore: true,
          action: true
        };
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaManagedRule" must be a non-null object.');
        }
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid RecaptchaManagedRule parameter.`);
          }
        }
        if (typeof options.action !== "undefined" && options.action !== "BLOCK") {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaManagedRule.action" must be "BLOCK".');
        }
      }
      /**
       * Validate each element in TollFraudManagedRule array
       * @param options - The options object to validate.
       */
      static validateTollFraudManagedRule(options) {
        const validKeys = {
          startScore: true,
          action: true
        };
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaTollFraudManagedRule" must be a non-null object.');
        }
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid RecaptchaTollFraudManagedRule parameter.`);
          }
        }
        if (typeof options.action !== "undefined" && options.action !== "BLOCK") {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"RecaptchaTollFraudManagedRule.action" must be "BLOCK".');
        }
      }
    };
    exports.RecaptchaAuthConfig = RecaptchaAuthConfig;
    var MobileLinksAuthConfig = class {
      static validate(options) {
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"MobileLinksConfig" must be a non-null object.');
        }
        const validKeys = {
          domain: true
        };
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid "MobileLinksConfig" parameter.`);
          }
        }
        if (typeof options.domain !== "undefined" && options.domain !== "HOSTING_DOMAIN" && options.domain !== "FIREBASE_DYNAMIC_LINK_DOMAIN") {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"MobileLinksConfig.domain" must be either "HOSTING_DOMAIN" or "FIREBASE_DYNAMIC_LINK_DOMAIN".');
        }
      }
    };
    exports.MobileLinksAuthConfig = MobileLinksAuthConfig;
    var PasswordPolicyAuthConfig = class _PasswordPolicyAuthConfig {
      /**
       * Static method to convert a client side request to a PasswordPolicyAuthServerConfig.
       * Throws an error if validation fails.
       *
       * @param options - The options object to convert to a server request.
       * @returns The resulting server request.
       * @internal
       */
      static buildServerRequest(options) {
        const request = {};
        _PasswordPolicyAuthConfig.validate(options);
        if (Object.prototype.hasOwnProperty.call(options, "enforcementState")) {
          request.passwordPolicyEnforcementState = options.enforcementState;
        }
        request.forceUpgradeOnSignin = false;
        if (Object.prototype.hasOwnProperty.call(options, "forceUpgradeOnSignin")) {
          request.forceUpgradeOnSignin = options.forceUpgradeOnSignin;
        }
        const constraintsRequest = {
          containsUppercaseCharacter: false,
          containsLowercaseCharacter: false,
          containsNonAlphanumericCharacter: false,
          containsNumericCharacter: false,
          minPasswordLength: 6,
          maxPasswordLength: 4096
        };
        request.passwordPolicyVersions = [];
        if (Object.prototype.hasOwnProperty.call(options, "constraints")) {
          if (options) {
            if (options.constraints?.requireUppercase !== void 0) {
              constraintsRequest.containsUppercaseCharacter = options.constraints.requireUppercase;
            }
            if (options.constraints?.requireLowercase !== void 0) {
              constraintsRequest.containsLowercaseCharacter = options.constraints.requireLowercase;
            }
            if (options.constraints?.requireNonAlphanumeric !== void 0) {
              constraintsRequest.containsNonAlphanumericCharacter = options.constraints.requireNonAlphanumeric;
            }
            if (options.constraints?.requireNumeric !== void 0) {
              constraintsRequest.containsNumericCharacter = options.constraints.requireNumeric;
            }
            if (options.constraints?.minLength !== void 0) {
              constraintsRequest.minPasswordLength = options.constraints.minLength;
            }
            if (options.constraints?.maxLength !== void 0) {
              constraintsRequest.maxPasswordLength = options.constraints.maxLength;
            }
          }
        }
        request.passwordPolicyVersions.push({ customStrengthOptions: constraintsRequest });
        return request;
      }
      /**
       * Validates the PasswordPolicyConfig options object. Throws an error on failure.
       *
       * @param options - The options object to validate.
       * @internal
       */
      static validate(options) {
        const validKeys = {
          enforcementState: true,
          forceUpgradeOnSignin: true,
          constraints: true
        };
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig" must be a non-null object.');
        }
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid PasswordPolicyConfig parameter.`);
          }
        }
        if (typeof options.enforcementState === "undefined" || !(options.enforcementState === "ENFORCE" || options.enforcementState === "OFF")) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.enforcementState" must be either "ENFORCE" or "OFF".');
        }
        if (typeof options.forceUpgradeOnSignin !== "undefined") {
          if (!validator.isBoolean(options.forceUpgradeOnSignin)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.forceUpgradeOnSignin" must be a boolean.');
          }
        }
        if (typeof options.constraints !== "undefined") {
          if (options.enforcementState === "ENFORCE" && !validator.isNonNullObject(options.constraints)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints" must be a non-empty object.');
          }
          const validCharKeys = {
            requireUppercase: true,
            requireLowercase: true,
            requireNumeric: true,
            requireNonAlphanumeric: true,
            minLength: true,
            maxLength: true
          };
          for (const key in options.constraints) {
            if (!(key in validCharKeys)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid PasswordPolicyConfig.constraints parameter.`);
            }
          }
          if (typeof options.constraints.requireUppercase !== "undefined" && !validator.isBoolean(options.constraints.requireUppercase)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints.requireUppercase" must be a boolean.');
          }
          if (typeof options.constraints.requireLowercase !== "undefined" && !validator.isBoolean(options.constraints.requireLowercase)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints.requireLowercase" must be a boolean.');
          }
          if (typeof options.constraints.requireNonAlphanumeric !== "undefined" && !validator.isBoolean(options.constraints.requireNonAlphanumeric)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints.requireNonAlphanumeric" must be a boolean.');
          }
          if (typeof options.constraints.requireNumeric !== "undefined" && !validator.isBoolean(options.constraints.requireNumeric)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints.requireNumeric" must be a boolean.');
          }
          if (typeof options.constraints.minLength === "undefined") {
            options.constraints.minLength = 6;
          } else if (!validator.isNumber(options.constraints.minLength)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints.minLength" must be a number.');
          } else {
            if (!(options.constraints.minLength >= 6 && options.constraints.minLength <= 30)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints.minLength" must be an integer between 6 and 30, inclusive.');
            }
          }
          if (typeof options.constraints.maxLength === "undefined") {
            options.constraints.maxLength = 4096;
          } else if (!validator.isNumber(options.constraints.maxLength)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints.maxLength" must be a number.');
          } else {
            if (!(options.constraints.maxLength >= options.constraints.minLength && options.constraints.maxLength <= 4096)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints.maxLength" must be greater than or equal to minLength and at max 4096.');
            }
          }
        } else {
          if (options.enforcementState === "ENFORCE") {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"PasswordPolicyConfig.constraints" must be defined.');
          }
        }
      }
      /**
       * The PasswordPolicyAuthConfig constructor.
       *
       * @param response - The server side response used to initialize the
       *     PasswordPolicyAuthConfig object.
       * @constructor
       * @internal
       */
      constructor(response) {
        if (typeof response.passwordPolicyEnforcementState === "undefined") {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid password policy configuration response");
        }
        this.enforcementState = response.passwordPolicyEnforcementState;
        let constraintsResponse = {};
        if (typeof response.passwordPolicyVersions !== "undefined") {
          (response.passwordPolicyVersions || []).forEach((policyVersion) => {
            constraintsResponse = {
              requireLowercase: policyVersion.customStrengthOptions?.containsLowercaseCharacter,
              requireUppercase: policyVersion.customStrengthOptions?.containsUppercaseCharacter,
              requireNonAlphanumeric: policyVersion.customStrengthOptions?.containsNonAlphanumericCharacter,
              requireNumeric: policyVersion.customStrengthOptions?.containsNumericCharacter,
              minLength: policyVersion.customStrengthOptions?.minPasswordLength,
              maxLength: policyVersion.customStrengthOptions?.maxPasswordLength
            };
          });
        }
        this.constraints = constraintsResponse;
        this.forceUpgradeOnSignin = response.forceUpgradeOnSignin ? true : false;
      }
    };
    exports.PasswordPolicyAuthConfig = PasswordPolicyAuthConfig;
    var EmailPrivacyAuthConfig = class {
      static validate(options) {
        if (!validator.isNonNullObject(options)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"EmailPrivacyConfig" must be a non-null object.');
        }
        const validKeys = {
          enableImprovedEmailPrivacy: true
        };
        for (const key in options) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, `"${key}" is not a valid "EmailPrivacyConfig" parameter.`);
          }
        }
        if (typeof options.enableImprovedEmailPrivacy !== "undefined" && !validator.isBoolean(options.enableImprovedEmailPrivacy)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, '"EmailPrivacyConfig.enableImprovedEmailPrivacy" must be a valid boolean value.');
        }
      }
    };
    exports.EmailPrivacyAuthConfig = EmailPrivacyAuthConfig;
  }
});

// node_modules/firebase-admin/lib/auth/tenant.js
var require_tenant = __commonJS({
  "node_modules/firebase-admin/lib/auth/tenant.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Tenant = void 0;
    var validator = require_validator();
    var deep_copy_1 = require_deep_copy();
    var error_1 = require_error3();
    var auth_config_1 = require_auth_config();
    var Tenant = class _Tenant {
      /**
       * Builds the corresponding server request for a TenantOptions object.
       *
       * @param tenantOptions - The properties to convert to a server request.
       * @param createRequest - Whether this is a create request.
       * @returns The equivalent server request.
       *
       * @internal
       */
      static buildServerRequest(tenantOptions, createRequest) {
        _Tenant.validate(tenantOptions, createRequest);
        let request = {};
        if (typeof tenantOptions.emailSignInConfig !== "undefined") {
          request = auth_config_1.EmailSignInConfig.buildServerRequest(tenantOptions.emailSignInConfig);
        }
        if (typeof tenantOptions.displayName !== "undefined") {
          request.displayName = tenantOptions.displayName;
        }
        if (typeof tenantOptions.anonymousSignInEnabled !== "undefined") {
          request.enableAnonymousUser = tenantOptions.anonymousSignInEnabled;
        }
        if (typeof tenantOptions.multiFactorConfig !== "undefined") {
          request.mfaConfig = auth_config_1.MultiFactorAuthConfig.buildServerRequest(tenantOptions.multiFactorConfig);
        }
        if (typeof tenantOptions.testPhoneNumbers !== "undefined") {
          request.testPhoneNumbers = tenantOptions.testPhoneNumbers ?? {};
        }
        if (typeof tenantOptions.smsRegionConfig !== "undefined") {
          request.smsRegionConfig = tenantOptions.smsRegionConfig;
        }
        if (typeof tenantOptions.recaptchaConfig !== "undefined") {
          request.recaptchaConfig = auth_config_1.RecaptchaAuthConfig.buildServerRequest(tenantOptions.recaptchaConfig);
        }
        if (typeof tenantOptions.passwordPolicyConfig !== "undefined") {
          request.passwordPolicyConfig = auth_config_1.PasswordPolicyAuthConfig.buildServerRequest(tenantOptions.passwordPolicyConfig);
        }
        if (typeof tenantOptions.emailPrivacyConfig !== "undefined") {
          request.emailPrivacyConfig = tenantOptions.emailPrivacyConfig;
        }
        return request;
      }
      /**
       * Returns the tenant ID corresponding to the resource name if available.
       *
       * @param resourceName - The server side resource name
       * @returns The tenant ID corresponding to the resource, null otherwise.
       *
       * @internal
       */
      static getTenantIdFromResourceName(resourceName) {
        const matchTenantRes = resourceName.match(/\/tenants\/(.*)$/);
        if (!matchTenantRes || matchTenantRes.length < 2) {
          return null;
        }
        return matchTenantRes[1];
      }
      /**
       * Validates a tenant options object. Throws an error on failure.
       *
       * @param request - The tenant options object to validate.
       * @param createRequest - Whether this is a create request.
       */
      static validate(request, createRequest) {
        const validKeys = {
          displayName: true,
          emailSignInConfig: true,
          anonymousSignInEnabled: true,
          multiFactorConfig: true,
          testPhoneNumbers: true,
          smsRegionConfig: true,
          recaptchaConfig: true,
          passwordPolicyConfig: true,
          emailPrivacyConfig: true
        };
        const label = createRequest ? "CreateTenantRequest" : "UpdateTenantRequest";
        if (!validator.isNonNullObject(request)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `"${label}" must be a valid non-null object.`);
        }
        for (const key in request) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `"${key}" is not a valid ${label} parameter.`);
          }
        }
        if (typeof request.displayName !== "undefined" && !validator.isNonEmptyString(request.displayName)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `"${label}.displayName" must be a valid non-empty string.`);
        }
        if (typeof request.emailSignInConfig !== "undefined") {
          auth_config_1.EmailSignInConfig.buildServerRequest(request.emailSignInConfig);
        }
        if (typeof request.testPhoneNumbers !== "undefined" && request.testPhoneNumbers !== null) {
          (0, auth_config_1.validateTestPhoneNumbers)(request.testPhoneNumbers);
        } else if (request.testPhoneNumbers === null && createRequest) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `"${label}.testPhoneNumbers" must be a non-null object.`);
        }
        if (typeof request.multiFactorConfig !== "undefined") {
          auth_config_1.MultiFactorAuthConfig.buildServerRequest(request.multiFactorConfig);
        }
        if (typeof request.smsRegionConfig !== "undefined") {
          auth_config_1.SmsRegionsAuthConfig.validate(request.smsRegionConfig);
        }
        if (typeof request.recaptchaConfig !== "undefined") {
          auth_config_1.RecaptchaAuthConfig.buildServerRequest(request.recaptchaConfig);
        }
        if (typeof request.passwordPolicyConfig !== "undefined") {
          auth_config_1.PasswordPolicyAuthConfig.buildServerRequest(request.passwordPolicyConfig);
        }
        if (typeof request.emailPrivacyConfig !== "undefined") {
          auth_config_1.EmailPrivacyAuthConfig.validate(request.emailPrivacyConfig);
        }
      }
      /**
       * The Tenant object constructor.
       *
       * @param response - The server side response used to initialize the Tenant object.
       * @constructor
       * @internal
       */
      constructor(response) {
        const tenantId = _Tenant.getTenantIdFromResourceName(response.name);
        if (!tenantId) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid tenant response");
        }
        this.tenantId = tenantId;
        this.displayName = response.displayName;
        try {
          this.emailSignInConfig_ = new auth_config_1.EmailSignInConfig(response);
        } catch (e) {
          this.emailSignInConfig_ = new auth_config_1.EmailSignInConfig({
            allowPasswordSignup: false
          });
        }
        this.anonymousSignInEnabled = !!response.enableAnonymousUser;
        if (typeof response.mfaConfig !== "undefined") {
          this.multiFactorConfig_ = new auth_config_1.MultiFactorAuthConfig(response.mfaConfig);
        }
        if (typeof response.testPhoneNumbers !== "undefined") {
          this.testPhoneNumbers = (0, deep_copy_1.deepCopy)(response.testPhoneNumbers || {});
        }
        if (typeof response.smsRegionConfig !== "undefined") {
          this.smsRegionConfig = (0, deep_copy_1.deepCopy)(response.smsRegionConfig);
        }
        if (typeof response.recaptchaConfig !== "undefined") {
          this.recaptchaConfig_ = new auth_config_1.RecaptchaAuthConfig(response.recaptchaConfig);
        }
        if (typeof response.passwordPolicyConfig !== "undefined") {
          this.passwordPolicyConfig = new auth_config_1.PasswordPolicyAuthConfig(response.passwordPolicyConfig);
        }
        if (typeof response.emailPrivacyConfig !== "undefined") {
          this.emailPrivacyConfig = (0, deep_copy_1.deepCopy)(response.emailPrivacyConfig);
        }
      }
      /**
       * The email sign in provider configuration.
       */
      get emailSignInConfig() {
        return this.emailSignInConfig_;
      }
      /**
       * The multi-factor auth configuration on the current tenant.
       */
      get multiFactorConfig() {
        return this.multiFactorConfig_;
      }
      /**
       * The recaptcha config auth configuration of the current tenant.
       */
      get recaptchaConfig() {
        return this.recaptchaConfig_;
      }
      /**
       * Returns a JSON-serializable representation of this object.
       *
       * @returns A JSON-serializable representation of this object.
       */
      toJSON() {
        const json = {
          tenantId: this.tenantId,
          displayName: this.displayName,
          emailSignInConfig: this.emailSignInConfig_?.toJSON(),
          multiFactorConfig: this.multiFactorConfig_?.toJSON(),
          anonymousSignInEnabled: this.anonymousSignInEnabled,
          testPhoneNumbers: this.testPhoneNumbers,
          smsRegionConfig: (0, deep_copy_1.deepCopy)(this.smsRegionConfig),
          recaptchaConfig: (0, deep_copy_1.deepCopy)(this.recaptchaConfig),
          passwordPolicyConfig: (0, deep_copy_1.deepCopy)(this.passwordPolicyConfig),
          emailPrivacyConfig: (0, deep_copy_1.deepCopy)(this.emailPrivacyConfig)
        };
        if (typeof json.multiFactorConfig === "undefined") {
          delete json.multiFactorConfig;
        }
        if (typeof json.testPhoneNumbers === "undefined") {
          delete json.testPhoneNumbers;
        }
        if (typeof json.smsRegionConfig === "undefined") {
          delete json.smsRegionConfig;
        }
        if (typeof json.recaptchaConfig === "undefined") {
          delete json.recaptchaConfig;
        }
        if (typeof json.passwordPolicyConfig === "undefined") {
          delete json.passwordPolicyConfig;
        }
        if (typeof json.emailPrivacyConfig === "undefined") {
          delete json.emailPrivacyConfig;
        }
        return json;
      }
    };
    exports.Tenant = Tenant;
  }
});

// node_modules/firebase-admin/lib/auth/identifier.js
var require_identifier = __commonJS({
  "node_modules/firebase-admin/lib/auth/identifier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isUidIdentifier = isUidIdentifier;
    exports.isEmailIdentifier = isEmailIdentifier;
    exports.isPhoneIdentifier = isPhoneIdentifier;
    exports.isProviderIdentifier = isProviderIdentifier;
    function isUidIdentifier(id) {
      return id.uid !== void 0;
    }
    function isEmailIdentifier(id) {
      return id.email !== void 0;
    }
    function isPhoneIdentifier(id) {
      return id.phoneNumber !== void 0;
    }
    function isProviderIdentifier(id) {
      const pid = id;
      return pid.providerId !== void 0 && pid.providerUid !== void 0;
    }
  }
});

// node_modules/firebase-admin/lib/auth/project-config.js
var require_project_config = __commonJS({
  "node_modules/firebase-admin/lib/auth/project-config.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProjectConfig = void 0;
    var validator = require_validator();
    var error_1 = require_error3();
    var auth_config_1 = require_auth_config();
    var deep_copy_1 = require_deep_copy();
    var ProjectConfig = class _ProjectConfig {
      /**
       * The multi-factor auth configuration.
       */
      get multiFactorConfig() {
        return this.multiFactorConfig_;
      }
      /**
       * The reCAPTCHA configuration.
       */
      get recaptchaConfig() {
        return this.recaptchaConfig_;
      }
      /**
       * Validates a project config options object. Throws an error on failure.
       *
       * @param request - The project config options object to validate.
       */
      static validate(request) {
        if (!validator.isNonNullObject(request)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"UpdateProjectConfigRequest" must be a valid non-null object.');
        }
        const validKeys = {
          smsRegionConfig: true,
          multiFactorConfig: true,
          recaptchaConfig: true,
          passwordPolicyConfig: true,
          emailPrivacyConfig: true,
          mobileLinksConfig: true
        };
        for (const key in request) {
          if (!(key in validKeys)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `"${key}" is not a valid UpdateProjectConfigRequest parameter.`);
          }
        }
        if (typeof request.smsRegionConfig !== "undefined") {
          auth_config_1.SmsRegionsAuthConfig.validate(request.smsRegionConfig);
        }
        if (typeof request.multiFactorConfig !== "undefined") {
          auth_config_1.MultiFactorAuthConfig.validate(request.multiFactorConfig);
        }
        if (typeof request.recaptchaConfig !== "undefined") {
          auth_config_1.RecaptchaAuthConfig.validate(request.recaptchaConfig);
        }
        if (typeof request.passwordPolicyConfig !== "undefined") {
          auth_config_1.PasswordPolicyAuthConfig.validate(request.passwordPolicyConfig);
        }
        if (typeof request.emailPrivacyConfig !== "undefined") {
          auth_config_1.EmailPrivacyAuthConfig.validate(request.emailPrivacyConfig);
        }
        if (typeof request.mobileLinksConfig !== "undefined") {
          auth_config_1.MobileLinksAuthConfig.validate(request.mobileLinksConfig);
        }
      }
      /**
       * Build the corresponding server request for a UpdateProjectConfigRequest object.
       * @param configOptions - The properties to convert to a server request.
       * @returns  The equivalent server request.
       *
       * @internal
       */
      static buildServerRequest(configOptions) {
        _ProjectConfig.validate(configOptions);
        const request = {};
        if (typeof configOptions.smsRegionConfig !== "undefined") {
          request.smsRegionConfig = configOptions.smsRegionConfig;
        }
        if (typeof configOptions.multiFactorConfig !== "undefined") {
          request.mfa = auth_config_1.MultiFactorAuthConfig.buildServerRequest(configOptions.multiFactorConfig);
        }
        if (typeof configOptions.recaptchaConfig !== "undefined") {
          request.recaptchaConfig = auth_config_1.RecaptchaAuthConfig.buildServerRequest(configOptions.recaptchaConfig);
        }
        if (typeof configOptions.passwordPolicyConfig !== "undefined") {
          request.passwordPolicyConfig = auth_config_1.PasswordPolicyAuthConfig.buildServerRequest(configOptions.passwordPolicyConfig);
        }
        if (typeof configOptions.emailPrivacyConfig !== "undefined") {
          request.emailPrivacyConfig = configOptions.emailPrivacyConfig;
        }
        if (typeof configOptions.mobileLinksConfig !== "undefined") {
          request.mobileLinksConfig = configOptions.mobileLinksConfig;
        }
        return request;
      }
      /**
       * The Project Config object constructor.
       *
       * @param response - The server side response used to initialize the Project Config object.
       * @constructor
       * @internal
       */
      constructor(response) {
        if (typeof response.smsRegionConfig !== "undefined") {
          this.smsRegionConfig = response.smsRegionConfig;
        }
        if (typeof response.mfa !== "undefined") {
          this.multiFactorConfig_ = new auth_config_1.MultiFactorAuthConfig(response.mfa);
        }
        if (typeof response.recaptchaConfig !== "undefined") {
          this.recaptchaConfig_ = new auth_config_1.RecaptchaAuthConfig(response.recaptchaConfig);
        }
        if (typeof response.passwordPolicyConfig !== "undefined") {
          this.passwordPolicyConfig = new auth_config_1.PasswordPolicyAuthConfig(response.passwordPolicyConfig);
        }
        if (typeof response.emailPrivacyConfig !== "undefined") {
          this.emailPrivacyConfig = response.emailPrivacyConfig;
        }
        if (typeof response.mobileLinksConfig !== "undefined") {
          this.mobileLinksConfig = response.mobileLinksConfig;
        }
      }
      /**
       * Returns a JSON-serializable representation of this object.
       *
       * @returns A JSON-serializable representation of this object.
       */
      toJSON() {
        const json = {
          smsRegionConfig: (0, deep_copy_1.deepCopy)(this.smsRegionConfig),
          multiFactorConfig: (0, deep_copy_1.deepCopy)(this.multiFactorConfig),
          recaptchaConfig: (0, deep_copy_1.deepCopy)(this.recaptchaConfig),
          passwordPolicyConfig: (0, deep_copy_1.deepCopy)(this.passwordPolicyConfig),
          emailPrivacyConfig: (0, deep_copy_1.deepCopy)(this.emailPrivacyConfig),
          mobileLinksConfig: (0, deep_copy_1.deepCopy)(this.mobileLinksConfig)
        };
        if (typeof json.smsRegionConfig === "undefined") {
          delete json.smsRegionConfig;
        }
        if (typeof json.multiFactorConfig === "undefined") {
          delete json.multiFactorConfig;
        }
        if (typeof json.recaptchaConfig === "undefined") {
          delete json.recaptchaConfig;
        }
        if (typeof json.passwordPolicyConfig === "undefined") {
          delete json.passwordPolicyConfig;
        }
        if (typeof json.emailPrivacyConfig === "undefined") {
          delete json.emailPrivacyConfig;
        }
        if (typeof json.mobileLinksConfig === "undefined") {
          delete json.mobileLinksConfig;
        }
        return json;
      }
    };
    exports.ProjectConfig = ProjectConfig;
  }
});

// node_modules/firebase-admin/lib/auth/auth-api-request.js
var require_auth_api_request = __commonJS({
  "node_modules/firebase-admin/lib/auth/auth-api-request.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TenantAwareAuthRequestHandler = exports.AuthRequestHandler = exports.AbstractAuthRequestHandler = exports.FIREBASE_AUTH_SIGN_UP_NEW_USER = exports.FIREBASE_AUTH_SET_ACCOUNT_INFO = exports.FIREBASE_AUTH_BATCH_DELETE_ACCOUNTS = exports.FIREBASE_AUTH_DELETE_ACCOUNT = exports.FIREBASE_AUTH_GET_ACCOUNTS_INFO = exports.FIREBASE_AUTH_GET_ACCOUNT_INFO = exports.FIREBASE_AUTH_DOWNLOAD_ACCOUNT = exports.FIREBASE_AUTH_UPLOAD_ACCOUNT = exports.FIREBASE_AUTH_CREATE_SESSION_COOKIE = exports.EMAIL_ACTION_REQUEST_TYPES = exports.RESERVED_CLAIMS = void 0;
    exports.useEmulator = useEmulator;
    var validator = require_validator();
    var deep_copy_1 = require_deep_copy();
    var error_1 = require_error3();
    var error_2 = require_error();
    var api_request_1 = require_api_request();
    var utils = require_utils();
    var user_import_builder_1 = require_user_import_builder();
    var action_code_settings_builder_1 = require_action_code_settings_builder();
    var tenant_1 = require_tenant();
    var identifier_1 = require_identifier();
    var auth_config_1 = require_auth_config();
    var project_config_1 = require_project_config();
    var FIREBASE_AUTH_HEADERS = {
      "X-Client-Version": `Node/Admin/${utils.getSdkVersion()}`
    };
    var FIREBASE_AUTH_TIMEOUT = 25e3;
    exports.RESERVED_CLAIMS = [
      "acr",
      "amr",
      "at_hash",
      "aud",
      "auth_time",
      "azp",
      "cnf",
      "c_hash",
      "exp",
      "iat",
      "iss",
      "jti",
      "nbf",
      "nonce",
      "sub",
      "firebase"
    ];
    exports.EMAIL_ACTION_REQUEST_TYPES = [
      "PASSWORD_RESET",
      "VERIFY_EMAIL",
      "EMAIL_SIGNIN",
      "VERIFY_AND_CHANGE_EMAIL"
    ];
    var MAX_CLAIMS_PAYLOAD_SIZE = 1e3;
    var MAX_DOWNLOAD_ACCOUNT_PAGE_SIZE = 1e3;
    var MAX_UPLOAD_ACCOUNT_BATCH_SIZE = 1e3;
    var MAX_GET_ACCOUNTS_BATCH_SIZE = 100;
    var MAX_DELETE_ACCOUNTS_BATCH_SIZE = 1e3;
    var MIN_SESSION_COOKIE_DURATION_SECS = 5 * 60;
    var MAX_SESSION_COOKIE_DURATION_SECS = 14 * 24 * 60 * 60;
    var MAX_LIST_PROVIDER_CONFIGURATION_PAGE_SIZE = 100;
    var FIREBASE_AUTH_BASE_URL_FORMAT = "https://identitytoolkit.googleapis.com/{version}/projects/{projectId}{api}";
    var FIREBASE_AUTH_EMULATOR_BASE_URL_FORMAT = "http://{host}/identitytoolkit.googleapis.com/{version}/projects/{projectId}{api}";
    var FIREBASE_AUTH_TENANT_URL_FORMAT = FIREBASE_AUTH_BASE_URL_FORMAT.replace("projects/{projectId}", "projects/{projectId}/tenants/{tenantId}");
    var FIREBASE_AUTH_EMULATOR_TENANT_URL_FORMAT = FIREBASE_AUTH_EMULATOR_BASE_URL_FORMAT.replace("projects/{projectId}", "projects/{projectId}/tenants/{tenantId}");
    var MAX_LIST_TENANT_PAGE_SIZE = 1e3;
    var WriteOperationType;
    (function(WriteOperationType2) {
      WriteOperationType2["Create"] = "create";
      WriteOperationType2["Update"] = "update";
      WriteOperationType2["Upload"] = "upload";
    })(WriteOperationType || (WriteOperationType = {}));
    var AuthResourceUrlBuilder = class {
      /**
       * The resource URL builder constructor.
       *
       * @param app - The app for this URL builder.
       * @param version - The endpoint API version.
       * @param emulatorHost - Optional emulator host captured at init time.
       * @constructor
       */
      constructor(app, version = "v1", emHost) {
        this.app = app;
        this.version = version;
        if (emHost) {
          this.urlFormat = utils.formatString(FIREBASE_AUTH_EMULATOR_BASE_URL_FORMAT, {
            host: emHost
          });
        } else {
          this.urlFormat = FIREBASE_AUTH_BASE_URL_FORMAT;
        }
      }
      /**
       * Returns the resource URL corresponding to the provided parameters.
       *
       * @param api - The backend API name.
       * @param params - The optional additional parameters to substitute in the
       *     URL path.
       * @returns The corresponding resource URL.
       */
      getUrl(api, params) {
        return this.getProjectId().then((projectId) => {
          const baseParams = {
            version: this.version,
            projectId,
            api: api || ""
          };
          const baseUrl = utils.formatString(this.urlFormat, baseParams);
          return utils.formatString(baseUrl, params || {});
        });
      }
      getProjectId() {
        if (this.projectId) {
          return Promise.resolve(this.projectId);
        }
        return utils.findProjectId(this.app).then((projectId) => {
          if (!validator.isNonEmptyString(projectId)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CREDENTIAL, "Failed to determine project ID for Auth. Initialize the SDK with service account credentials or set project ID as an app option. Alternatively set the GOOGLE_CLOUD_PROJECT environment variable.");
          }
          this.projectId = projectId;
          return projectId;
        });
      }
    };
    var TenantAwareAuthResourceUrlBuilder = class extends AuthResourceUrlBuilder {
      /**
       * The tenant aware resource URL builder constructor.
       *
       * @param app - The app for this URL builder.
       * @param version - The endpoint API version.
       * @param tenantId - The tenant ID.
       * @param emHost - Optional emulator host captured at init time.
       * @constructor
       */
      constructor(app, version, tenantId, emHost) {
        super(app, version, emHost);
        this.app = app;
        this.version = version;
        this.tenantId = tenantId;
        if (emHost) {
          this.urlFormat = utils.formatString(FIREBASE_AUTH_EMULATOR_TENANT_URL_FORMAT, {
            host: emHost
          });
        } else {
          this.urlFormat = FIREBASE_AUTH_TENANT_URL_FORMAT;
        }
      }
      /**
       * Returns the resource URL corresponding to the provided parameters.
       *
       * @param api - The backend API name.
       * @param params - The optional additional parameters to substitute in the
       *     URL path.
       * @returns The corresponding resource URL.
       */
      getUrl(api, params) {
        return super.getUrl(api, params).then((url) => {
          return utils.formatString(url, { tenantId: this.tenantId });
        });
      }
    };
    var AuthHttpClient = class extends api_request_1.AuthorizedHttpClient {
      constructor(app, isEmulator) {
        super(app);
        this.isEmulator = isEmulator;
      }
      getToken() {
        if (this.isEmulator) {
          return Promise.resolve("owner");
        }
        return super.getToken();
      }
    };
    function validateAuthFactorInfo(request) {
      const validKeys = {
        mfaEnrollmentId: true,
        displayName: true,
        phoneInfo: true,
        enrolledAt: true
      };
      for (const key in request) {
        if (!(key in validKeys)) {
          delete request[key];
        }
      }
      const authFactorInfoIdentifier = request.mfaEnrollmentId || request.phoneInfo || JSON.stringify(request);
      if (typeof request.mfaEnrollmentId !== "undefined" && !validator.isNonEmptyString(request.mfaEnrollmentId)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID, 'The second factor "uid" must be a valid non-empty string.');
      }
      if (typeof request.displayName !== "undefined" && !validator.isString(request.displayName)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_DISPLAY_NAME, `The second factor "displayName" for "${authFactorInfoIdentifier}" must be a valid string.`);
      }
      if (typeof request.enrolledAt !== "undefined" && !validator.isISODateString(request.enrolledAt)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ENROLLMENT_TIME, `The second factor "enrollmentTime" for "${authFactorInfoIdentifier}" must be a valid UTC date string.`);
      }
      if (typeof request.phoneInfo !== "undefined") {
        if (!validator.isPhoneNumber(request.phoneInfo)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PHONE_NUMBER, `The second factor "phoneNumber" for "${authFactorInfoIdentifier}" must be a non-empty E.164 standard compliant identifier string.`);
        }
      } else {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ENROLLED_FACTORS, "MFAInfo object provided is invalid.");
      }
    }
    function validateProviderUserInfo(request) {
      const validKeys = {
        rawId: true,
        providerId: true,
        email: true,
        displayName: true,
        photoUrl: true
      };
      for (const key in request) {
        if (!(key in validKeys)) {
          delete request[key];
        }
      }
      if (!validator.isNonEmptyString(request.providerId)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID);
      }
      if (typeof request.displayName !== "undefined" && typeof request.displayName !== "string") {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_DISPLAY_NAME, `The provider "displayName" for "${request.providerId}" must be a valid string.`);
      }
      if (!validator.isNonEmptyString(request.rawId)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID, `The provider "uid" for "${request.providerId}" must be a valid non-empty string.`);
      }
      if (typeof request.email !== "undefined" && !validator.isEmail(request.email)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_EMAIL, `The provider "email" for "${request.providerId}" must be a valid email string.`);
      }
      if (typeof request.photoUrl !== "undefined" && !validator.isURL(request.photoUrl)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PHOTO_URL, `The provider "photoURL" for "${request.providerId}" must be a valid URL string.`);
      }
    }
    function validateCreateEditRequest(request, writeOperationType) {
      const uploadAccountRequest = writeOperationType === WriteOperationType.Upload;
      const validKeys = {
        displayName: true,
        localId: true,
        email: true,
        password: true,
        rawPassword: true,
        emailVerified: true,
        photoUrl: true,
        disabled: true,
        disableUser: true,
        deleteAttribute: true,
        deleteProvider: true,
        sanityCheck: true,
        phoneNumber: true,
        customAttributes: true,
        validSince: true,
        // Pass linkProviderUserInfo only for updates (i.e. not for uploads.)
        linkProviderUserInfo: !uploadAccountRequest,
        // Pass tenantId only for uploadAccount requests.
        tenantId: uploadAccountRequest,
        passwordHash: uploadAccountRequest,
        salt: uploadAccountRequest,
        createdAt: uploadAccountRequest,
        lastLoginAt: uploadAccountRequest,
        providerUserInfo: uploadAccountRequest,
        mfaInfo: uploadAccountRequest,
        // Only for non-uploadAccount requests.
        mfa: !uploadAccountRequest
      };
      for (const key in request) {
        if (!(key in validKeys)) {
          delete request[key];
        }
      }
      if (typeof request.tenantId !== "undefined" && !validator.isNonEmptyString(request.tenantId)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_TENANT_ID);
      }
      if (typeof request.displayName !== "undefined" && !validator.isString(request.displayName)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_DISPLAY_NAME);
      }
      if ((typeof request.localId !== "undefined" || uploadAccountRequest) && !validator.isUid(request.localId)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID);
      }
      if (typeof request.email !== "undefined" && !validator.isEmail(request.email)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_EMAIL);
      }
      if (typeof request.phoneNumber !== "undefined" && !validator.isPhoneNumber(request.phoneNumber)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PHONE_NUMBER);
      }
      if (typeof request.password !== "undefined" && !validator.isPassword(request.password)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PASSWORD);
      }
      if (typeof request.rawPassword !== "undefined" && !validator.isPassword(request.rawPassword)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PASSWORD);
      }
      if (typeof request.emailVerified !== "undefined" && typeof request.emailVerified !== "boolean") {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_EMAIL_VERIFIED);
      }
      if (typeof request.photoUrl !== "undefined" && !validator.isURL(request.photoUrl)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PHOTO_URL);
      }
      if (typeof request.disabled !== "undefined" && typeof request.disabled !== "boolean") {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_DISABLED_FIELD);
      }
      if (typeof request.validSince !== "undefined" && !validator.isNumber(request.validSince)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_TOKENS_VALID_AFTER_TIME);
      }
      if (typeof request.createdAt !== "undefined" && !validator.isNumber(request.createdAt)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CREATION_TIME);
      }
      if (typeof request.lastLoginAt !== "undefined" && !validator.isNumber(request.lastLoginAt)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_LAST_SIGN_IN_TIME);
      }
      if (typeof request.disableUser !== "undefined" && typeof request.disableUser !== "boolean") {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_DISABLED_FIELD);
      }
      if (typeof request.customAttributes !== "undefined") {
        let developerClaims;
        try {
          developerClaims = JSON.parse(request.customAttributes);
        } catch (error) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CLAIMS, error.message);
        }
        const invalidClaims = [];
        exports.RESERVED_CLAIMS.forEach((blacklistedClaim) => {
          if (Object.prototype.hasOwnProperty.call(developerClaims, blacklistedClaim)) {
            invalidClaims.push(blacklistedClaim);
          }
        });
        if (invalidClaims.length > 0) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.FORBIDDEN_CLAIM, invalidClaims.length > 1 ? `Developer claims "${invalidClaims.join('", "')}" are reserved and cannot be specified.` : `Developer claim "${invalidClaims[0]}" is reserved and cannot be specified.`);
        }
        if (request.customAttributes.length > MAX_CLAIMS_PAYLOAD_SIZE) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.CLAIMS_TOO_LARGE, `Developer claims payload should not exceed ${MAX_CLAIMS_PAYLOAD_SIZE} characters.`);
        }
      }
      if (typeof request.passwordHash !== "undefined" && !validator.isString(request.passwordHash)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PASSWORD_HASH);
      }
      if (typeof request.salt !== "undefined" && !validator.isString(request.salt)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PASSWORD_SALT);
      }
      if (typeof request.providerUserInfo !== "undefined" && !validator.isArray(request.providerUserInfo)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_DATA);
      } else if (validator.isArray(request.providerUserInfo)) {
        request.providerUserInfo.forEach((providerUserInfoEntry) => {
          validateProviderUserInfo(providerUserInfoEntry);
        });
      }
      if (typeof request.linkProviderUserInfo !== "undefined") {
        validateProviderUserInfo(request.linkProviderUserInfo);
      }
      let enrollments = null;
      if (request.mfaInfo) {
        enrollments = request.mfaInfo;
      } else if (request.mfa && request.mfa.enrollments) {
        enrollments = request.mfa.enrollments;
      }
      if (enrollments) {
        if (!validator.isArray(enrollments)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ENROLLED_FACTORS);
        }
        enrollments.forEach((authFactorInfoEntry) => {
          validateAuthFactorInfo(authFactorInfoEntry);
        });
      }
    }
    exports.FIREBASE_AUTH_CREATE_SESSION_COOKIE = new api_request_1.ApiSettings(":createSessionCookie", "POST").setRequestValidator((request) => {
      if (!validator.isNonEmptyString(request.idToken)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ID_TOKEN);
      }
      if (!validator.isNumber(request.validDuration) || request.validDuration < MIN_SESSION_COOKIE_DURATION_SECS || request.validDuration > MAX_SESSION_COOKIE_DURATION_SECS) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_SESSION_COOKIE_DURATION);
      }
    }).setResponseValidator((response) => {
      if (!validator.isNonEmptyString(response.data?.sessionCookie)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    exports.FIREBASE_AUTH_UPLOAD_ACCOUNT = new api_request_1.ApiSettings("/accounts:batchCreate", "POST");
    exports.FIREBASE_AUTH_DOWNLOAD_ACCOUNT = new api_request_1.ApiSettings("/accounts:batchGet", "GET").setRequestValidator((request) => {
      if (typeof request.nextPageToken !== "undefined" && !validator.isNonEmptyString(request.nextPageToken)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PAGE_TOKEN);
      }
      if (!validator.isNumber(request.maxResults) || request.maxResults <= 0 || request.maxResults > MAX_DOWNLOAD_ACCOUNT_PAGE_SIZE) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `Required "maxResults" must be a positive integer that does not exceed ${MAX_DOWNLOAD_ACCOUNT_PAGE_SIZE}.`);
      }
    });
    exports.FIREBASE_AUTH_GET_ACCOUNT_INFO = new api_request_1.ApiSettings("/accounts:lookup", "POST").setRequestValidator((request) => {
      if (!request.localId && !request.email && !request.phoneNumber && !request.federatedUserId) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Server request is missing user identifier");
      }
    }).setResponseValidator((response) => {
      const data = response.data;
      if (!data.users || !data.users.length) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.USER_NOT_FOUND,
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    exports.FIREBASE_AUTH_GET_ACCOUNTS_INFO = new api_request_1.ApiSettings("/accounts:lookup", "POST").setRequestValidator((request) => {
      if (!request.localId && !request.email && !request.phoneNumber && !request.federatedUserId) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Server request is missing user identifier");
      }
    });
    exports.FIREBASE_AUTH_DELETE_ACCOUNT = new api_request_1.ApiSettings("/accounts:delete", "POST").setRequestValidator((request) => {
      if (!request.localId) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Server request is missing user identifier");
      }
    });
    exports.FIREBASE_AUTH_BATCH_DELETE_ACCOUNTS = new api_request_1.ApiSettings("/accounts:batchDelete", "POST").setRequestValidator((request) => {
      if (!request.localIds) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Server request is missing user identifiers");
      }
      if (typeof request.force === "undefined" || request.force !== true) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Server request is missing force=true field");
      }
    }).setResponseValidator((response) => {
      const data = response.data;
      const errors = data.errors || [];
      errors.forEach((batchDeleteErrorInfo) => {
        if (typeof batchDeleteErrorInfo.index === "undefined") {
          throw new error_1.FirebaseAuthError({
            ...error_1.authClientErrorCode.INTERNAL_ERROR,
            message: "INTERNAL ASSERT FAILED: Server BatchDeleteAccountResponse is missing an errors.index field",
            httpResponse: (0, error_2.toHttpResponse)(response)
          });
        }
        if (!batchDeleteErrorInfo.localId) {
          throw new error_1.FirebaseAuthError({
            ...error_1.authClientErrorCode.INTERNAL_ERROR,
            message: "INTERNAL ASSERT FAILED: Server BatchDeleteAccountResponse is missing an errors.localId field",
            httpResponse: (0, error_2.toHttpResponse)(response)
          });
        }
      });
    });
    exports.FIREBASE_AUTH_SET_ACCOUNT_INFO = new api_request_1.ApiSettings("/accounts:update", "POST").setRequestValidator((request) => {
      if (typeof request.localId === "undefined") {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Server request is missing user identifier");
      }
      if (typeof request.tenantId !== "undefined") {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"tenantId" is an invalid "UpdateRequest" property.');
      }
      validateCreateEditRequest(request, WriteOperationType.Update);
    }).setResponseValidator((response) => {
      const data = response.data;
      if (!data?.localId) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.USER_NOT_FOUND,
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    exports.FIREBASE_AUTH_SIGN_UP_NEW_USER = new api_request_1.ApiSettings("/accounts", "POST").setRequestValidator((request) => {
      if (typeof request.customAttributes !== "undefined") {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"customAttributes" cannot be set when creating a new user.');
      }
      if (typeof request.validSince !== "undefined") {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"validSince" cannot be set when creating a new user.');
      }
      if (typeof request.tenantId !== "undefined") {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"tenantId" is an invalid "CreateRequest" property.');
      }
      validateCreateEditRequest(request, WriteOperationType.Create);
    }).setResponseValidator((response) => {
      const data = response.data;
      if (!data?.localId) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to create new user",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var FIREBASE_AUTH_GET_OOB_CODE = new api_request_1.ApiSettings("/accounts:sendOobCode", "POST").setRequestValidator((request) => {
      if (!validator.isEmail(request.email)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_EMAIL);
      }
      if (typeof request.newEmail !== "undefined" && !validator.isEmail(request.newEmail)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_NEW_EMAIL);
      }
      if (exports.EMAIL_ACTION_REQUEST_TYPES.indexOf(request.requestType) === -1) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `"${request.requestType}" is not a supported email action request type.`);
      }
    }).setResponseValidator((response) => {
      const data = response.data;
      if (!data?.oobLink) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to create the email action link",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var GET_OAUTH_IDP_CONFIG = new api_request_1.ApiSettings("/oauthIdpConfigs/{providerId}", "GET").setResponseValidator((response) => {
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to get OIDC configuration",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var DELETE_OAUTH_IDP_CONFIG = new api_request_1.ApiSettings("/oauthIdpConfigs/{providerId}", "DELETE");
    var CREATE_OAUTH_IDP_CONFIG = new api_request_1.ApiSettings("/oauthIdpConfigs?oauthIdpConfigId={providerId}", "POST").setResponseValidator((response) => {
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to create new OIDC configuration",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var UPDATE_OAUTH_IDP_CONFIG = new api_request_1.ApiSettings("/oauthIdpConfigs/{providerId}?updateMask={updateMask}", "PATCH").setResponseValidator((response) => {
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to update OIDC configuration",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var LIST_OAUTH_IDP_CONFIGS = new api_request_1.ApiSettings("/oauthIdpConfigs", "GET").setRequestValidator((request) => {
      if (typeof request.pageToken !== "undefined" && !validator.isNonEmptyString(request.pageToken)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PAGE_TOKEN);
      }
      if (!validator.isNumber(request.pageSize) || request.pageSize <= 0 || request.pageSize > MAX_LIST_PROVIDER_CONFIGURATION_PAGE_SIZE) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `Required "maxResults" must be a positive integer that does not exceed ${MAX_LIST_PROVIDER_CONFIGURATION_PAGE_SIZE}.`);
      }
    });
    var GET_INBOUND_SAML_CONFIG = new api_request_1.ApiSettings("/inboundSamlConfigs/{providerId}", "GET").setResponseValidator((response) => {
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to get SAML configuration",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var DELETE_INBOUND_SAML_CONFIG = new api_request_1.ApiSettings("/inboundSamlConfigs/{providerId}", "DELETE");
    var CREATE_INBOUND_SAML_CONFIG = new api_request_1.ApiSettings("/inboundSamlConfigs?inboundSamlConfigId={providerId}", "POST").setResponseValidator((response) => {
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to create new SAML configuration",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var UPDATE_INBOUND_SAML_CONFIG = new api_request_1.ApiSettings("/inboundSamlConfigs/{providerId}?updateMask={updateMask}", "PATCH").setResponseValidator((response) => {
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to update SAML configuration",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var LIST_INBOUND_SAML_CONFIGS = new api_request_1.ApiSettings("/inboundSamlConfigs", "GET").setRequestValidator((request) => {
      if (typeof request.pageToken !== "undefined" && !validator.isNonEmptyString(request.pageToken)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PAGE_TOKEN);
      }
      if (!validator.isNumber(request.pageSize) || request.pageSize <= 0 || request.pageSize > MAX_LIST_PROVIDER_CONFIGURATION_PAGE_SIZE) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `Required "maxResults" must be a positive integer that does not exceed ${MAX_LIST_PROVIDER_CONFIGURATION_PAGE_SIZE}.`);
      }
    });
    var AbstractAuthRequestHandler = class _AbstractAuthRequestHandler {
      /**
       * @param response - The response to check for errors.
       * @returns The error code if present; null otherwise.
       */
      static getErrorCode(response) {
        return validator.isNonNullObject(response) && response.error && response.error.message || null;
      }
      static addUidToRequest(id, request) {
        if (!validator.isUid(id.uid)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID);
        }
        request.localId ? request.localId.push(id.uid) : request.localId = [id.uid];
        return request;
      }
      static addEmailToRequest(id, request) {
        if (!validator.isEmail(id.email)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_EMAIL);
        }
        request.email ? request.email.push(id.email) : request.email = [id.email];
        return request;
      }
      static addPhoneToRequest(id, request) {
        if (!validator.isPhoneNumber(id.phoneNumber)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PHONE_NUMBER);
        }
        request.phoneNumber ? request.phoneNumber.push(id.phoneNumber) : request.phoneNumber = [id.phoneNumber];
        return request;
      }
      static addProviderToRequest(id, request) {
        if (!validator.isNonEmptyString(id.providerId)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID);
        }
        if (!validator.isNonEmptyString(id.providerUid)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_UID);
        }
        const federatedUserId = {
          providerId: id.providerId,
          rawId: id.providerUid
        };
        request.federatedUserId ? request.federatedUserId.push(federatedUserId) : request.federatedUserId = [federatedUserId];
        return request;
      }
      /**
       * @param app - The app used to fetch access tokens to sign API requests.
       * @param emHost - Optional emulator host override. When provided (including
       *     null for explicitly no emulator), this value is used instead of reading
       *     from the FIREBASE_AUTH_EMULATOR_HOST environment variable.
       * @constructor
       */
      constructor(app, emHost) {
        this.app = app;
        if (typeof app !== "object" || app === null || !("options" in app)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "First argument passed to admin.auth() must be a valid Firebase app instance.");
        }
        this.emulatorHostValue = emHost !== void 0 ? emHost || void 0 : emulatorHost();
        this.httpClient = new AuthHttpClient(app, !!this.emulatorHostValue);
      }
      /**
       * Creates a new Firebase session cookie with the specified duration that can be used for
       * session management (set as a server side session cookie with custom cookie policy).
       * The session cookie JWT will have the same payload claims as the provided ID token.
       *
       * @param idToken - The Firebase ID token to exchange for a session cookie.
       * @param expiresIn - The session cookie duration in milliseconds.
       *
       * @returns A promise that resolves on success with the created session cookie.
       */
      createSessionCookie(idToken, expiresIn) {
        const request = {
          idToken,
          // Convert to seconds.
          validDuration: Math.floor(expiresIn / 1e3)
        };
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_CREATE_SESSION_COOKIE, request).then((response) => response.sessionCookie);
      }
      /**
       * Looks up a user by uid.
       *
       * @param uid - The uid of the user to lookup.
       * @returns A promise that resolves with the user information.
       */
      getAccountInfoByUid(uid) {
        if (!validator.isUid(uid)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID));
        }
        const request = {
          localId: [uid]
        };
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_GET_ACCOUNT_INFO, request);
      }
      /**
       * Looks up a user by email.
       *
       * @param email - The email of the user to lookup.
       * @returns A promise that resolves with the user information.
       */
      getAccountInfoByEmail(email) {
        if (!validator.isEmail(email)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_EMAIL));
        }
        const request = {
          email: [email]
        };
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_GET_ACCOUNT_INFO, request);
      }
      /**
       * Looks up a user by phone number.
       *
       * @param phoneNumber - The phone number of the user to lookup.
       * @returns A promise that resolves with the user information.
       */
      getAccountInfoByPhoneNumber(phoneNumber) {
        if (!validator.isPhoneNumber(phoneNumber)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PHONE_NUMBER));
        }
        const request = {
          phoneNumber: [phoneNumber]
        };
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_GET_ACCOUNT_INFO, request);
      }
      getAccountInfoByFederatedUid(providerId, rawId) {
        if (!validator.isNonEmptyString(providerId) || !validator.isNonEmptyString(rawId)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID);
        }
        const request = {
          federatedUserId: [{
            providerId,
            rawId
          }]
        };
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_GET_ACCOUNT_INFO, request);
      }
      /**
       * Looks up multiple users by their identifiers (uid, email, etc).
       *
       * @param identifiers - The identifiers indicating the users
       *     to be looked up. Must have <= 100 entries.
       * @param A - promise that resolves with the set of successfully
       *     looked up users. Possibly empty if no users were looked up.
       */
      getAccountInfoByIdentifiers(identifiers) {
        if (identifiers.length === 0) {
          return Promise.resolve({ users: [] });
        } else if (identifiers.length > MAX_GET_ACCOUNTS_BATCH_SIZE) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MAXIMUM_USER_COUNT_EXCEEDED, "`identifiers` parameter must have <= " + MAX_GET_ACCOUNTS_BATCH_SIZE + " entries.");
        }
        let request = {};
        for (const id of identifiers) {
          if ((0, identifier_1.isUidIdentifier)(id)) {
            request = _AbstractAuthRequestHandler.addUidToRequest(id, request);
          } else if ((0, identifier_1.isEmailIdentifier)(id)) {
            request = _AbstractAuthRequestHandler.addEmailToRequest(id, request);
          } else if ((0, identifier_1.isPhoneIdentifier)(id)) {
            request = _AbstractAuthRequestHandler.addPhoneToRequest(id, request);
          } else if ((0, identifier_1.isProviderIdentifier)(id)) {
            request = _AbstractAuthRequestHandler.addProviderToRequest(id, request);
          } else {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "Unrecognized identifier: " + id);
          }
        }
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_GET_ACCOUNTS_INFO, request);
      }
      /**
       * Exports the users (single batch only) with a size of maxResults and starting from
       * the offset as specified by pageToken.
       *
       * @param maxResults - The page size, 1000 if undefined. This is also the maximum
       *     allowed limit.
       * @param pageToken - The next page token. If not specified, returns users starting
       *     without any offset. Users are returned in the order they were created from oldest to
       *     newest, relative to the page token offset.
       * @returns A promise that resolves with the current batch of downloaded
       *     users and the next page token if available. For the last page, an empty list of users
       *     and no page token are returned.
       */
      downloadAccount(maxResults = MAX_DOWNLOAD_ACCOUNT_PAGE_SIZE, pageToken) {
        const request = {
          maxResults,
          nextPageToken: pageToken
        };
        if (typeof request.nextPageToken === "undefined") {
          delete request.nextPageToken;
        }
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_DOWNLOAD_ACCOUNT, request).then((response) => {
          if (!response.users) {
            response.users = [];
          }
          return response;
        });
      }
      /**
       * Imports the list of users provided to Firebase Auth. This is useful when
       * migrating from an external authentication system without having to use the Firebase CLI SDK.
       * At most, 1000 users are allowed to be imported one at a time.
       * When importing a list of password users, UserImportOptions are required to be specified.
       *
       * @param users - The list of user records to import to Firebase Auth.
       * @param options - The user import options, required when the users provided
       *     include password credentials.
       * @returns A promise that resolves when the operation completes
       *     with the result of the import. This includes the number of successful imports, the number
       *     of failed uploads and their corresponding errors.
       */
      uploadAccount(users, options) {
        const userImportBuilder = new user_import_builder_1.UserImportBuilder(users, options, (userRequest) => {
          validateCreateEditRequest(userRequest, WriteOperationType.Upload);
        });
        const request = userImportBuilder.buildRequest();
        if (validator.isArray(users) && users.length > MAX_UPLOAD_ACCOUNT_BATCH_SIZE) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MAXIMUM_USER_COUNT_EXCEEDED, `A maximum of ${MAX_UPLOAD_ACCOUNT_BATCH_SIZE} users can be imported at once.`);
        }
        if (!request.users || request.users.length === 0) {
          return Promise.resolve(userImportBuilder.buildResponse([]));
        }
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_UPLOAD_ACCOUNT, request).then((response) => {
          const failedUploads = response.error || [];
          return userImportBuilder.buildResponse(failedUploads);
        });
      }
      /**
       * Deletes an account identified by a uid.
       *
       * @param uid - The uid of the user to delete.
       * @returns A promise that resolves when the user is deleted.
       */
      deleteAccount(uid) {
        if (!validator.isUid(uid)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID));
        }
        const request = {
          localId: uid
        };
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_DELETE_ACCOUNT, request);
      }
      deleteAccounts(uids, force) {
        if (uids.length === 0) {
          return Promise.resolve({});
        } else if (uids.length > MAX_DELETE_ACCOUNTS_BATCH_SIZE) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MAXIMUM_USER_COUNT_EXCEEDED, "`uids` parameter must have <= " + MAX_DELETE_ACCOUNTS_BATCH_SIZE + " entries.");
        }
        const request = {
          localIds: [],
          force
        };
        uids.forEach((uid) => {
          if (!validator.isUid(uid)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID);
          }
          request.localIds.push(uid);
        });
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_BATCH_DELETE_ACCOUNTS, request);
      }
      /**
       * Sets additional developer claims on an existing user identified by provided UID.
       *
       * @param uid - The user to edit.
       * @param customUserClaims - The developer claims to set.
       * @returns A promise that resolves when the operation completes
       *     with the user id that was edited.
       */
      setCustomUserClaims(uid, customUserClaims) {
        if (!validator.isUid(uid)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID));
        } else if (!validator.isObject(customUserClaims)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "CustomUserClaims argument must be an object or null."));
        }
        if (customUserClaims === null) {
          customUserClaims = {};
        }
        const request = {
          localId: uid,
          customAttributes: JSON.stringify(customUserClaims)
        };
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_SET_ACCOUNT_INFO, request).then((response) => {
          return response.localId;
        });
      }
      /**
       * Edits an existing user.
       *
       * @param uid - The user to edit.
       * @param properties - The properties to set on the user.
       * @returns A promise that resolves when the operation completes
       *     with the user id that was edited.
       */
      updateExistingAccount(uid, properties) {
        if (!validator.isUid(uid)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID));
        } else if (!validator.isNonNullObject(properties)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "Properties argument must be a non-null object."));
        } else if (validator.isNonNullObject(properties.providerToLink)) {
          if (!validator.isNonEmptyString(properties.providerToLink.providerId)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "providerToLink.providerId of properties argument must be a non-empty string.");
          }
          if (!validator.isNonEmptyString(properties.providerToLink.uid)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "providerToLink.uid of properties argument must be a non-empty string.");
          }
        } else if (typeof properties.providersToUnlink !== "undefined") {
          if (!validator.isArray(properties.providersToUnlink)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "providersToUnlink of properties argument must be an array of strings.");
          }
          properties.providersToUnlink.forEach((providerId) => {
            if (!validator.isNonEmptyString(providerId)) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "providersToUnlink of properties argument must be an array of strings.");
            }
          });
        }
        const request = (0, deep_copy_1.deepCopy)(properties);
        request.localId = uid;
        const deletableParams = {
          displayName: "DISPLAY_NAME",
          photoURL: "PHOTO_URL"
        };
        request.deleteAttribute = [];
        for (const key in deletableParams) {
          if (request[key] === null) {
            request.deleteAttribute.push(deletableParams[key]);
            delete request[key];
          }
        }
        if (request.deleteAttribute.length === 0) {
          delete request.deleteAttribute;
        }
        if (request.phoneNumber === null) {
          request.deleteProvider ? request.deleteProvider.push("phone") : request.deleteProvider = ["phone"];
          delete request.phoneNumber;
        }
        if (typeof request.providerToLink !== "undefined") {
          request.linkProviderUserInfo = (0, deep_copy_1.deepCopy)(request.providerToLink);
          delete request.providerToLink;
          request.linkProviderUserInfo.rawId = request.linkProviderUserInfo.uid;
          delete request.linkProviderUserInfo.uid;
        }
        if (typeof request.providersToUnlink !== "undefined") {
          if (!validator.isArray(request.deleteProvider)) {
            request.deleteProvider = [];
          }
          request.deleteProvider = request.deleteProvider.concat(request.providersToUnlink);
          delete request.providersToUnlink;
        }
        if (typeof request.photoURL !== "undefined") {
          request.photoUrl = request.photoURL;
          delete request.photoURL;
        }
        if (typeof request.disabled !== "undefined") {
          request.disableUser = request.disabled;
          delete request.disabled;
        }
        if (validator.isNonNullObject(request.multiFactor)) {
          if (request.multiFactor.enrolledFactors === null) {
            request.mfa = {};
          } else if (validator.isArray(request.multiFactor.enrolledFactors)) {
            request.mfa = {
              enrollments: []
            };
            try {
              request.multiFactor.enrolledFactors.forEach((multiFactorInfo) => {
                request.mfa.enrollments.push((0, user_import_builder_1.convertMultiFactorInfoToServerFormat)(multiFactorInfo));
              });
            } catch (e) {
              return Promise.reject(e);
            }
            if (request.mfa.enrollments.length === 0) {
              delete request.mfa.enrollments;
            }
          }
          delete request.multiFactor;
        }
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_SET_ACCOUNT_INFO, request).then((response) => {
          return response.localId;
        });
      }
      /**
       * Revokes all refresh tokens for the specified user identified by the uid provided.
       * In addition to revoking all refresh tokens for a user, all ID tokens issued
       * before revocation will also be revoked on the Auth backend. Any request with an
       * ID token generated before revocation will be rejected with a token expired error.
       * Note that due to the fact that the timestamp is stored in seconds, any tokens minted in
       * the same second as the revocation will still be valid. If there is a chance that a token
       * was minted in the last second, delay for 1 second before revoking.
       *
       * @param uid - The user whose tokens are to be revoked.
       * @returns A promise that resolves when the operation completes
       *     successfully with the user id of the corresponding user.
       */
      revokeRefreshTokens(uid) {
        if (!validator.isUid(uid)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_UID));
        }
        const request = {
          localId: uid,
          // validSince is in UTC seconds.
          validSince: Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3)
        };
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_SET_ACCOUNT_INFO, request).then((response) => {
          return response.localId;
        });
      }
      /**
       * Create a new user with the properties supplied.
       *
       * @param properties - The properties to set on the user.
       * @returns A promise that resolves when the operation completes
       *     with the user id that was created.
       */
      createNewAccount(properties) {
        if (!validator.isNonNullObject(properties)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "Properties argument must be a non-null object."));
        }
        const request = (0, deep_copy_1.deepCopy)(properties);
        if (typeof request.photoURL !== "undefined") {
          request.photoUrl = request.photoURL;
          delete request.photoURL;
        }
        if (typeof request.uid !== "undefined") {
          request.localId = request.uid;
          delete request.uid;
        }
        if (validator.isNonNullObject(request.multiFactor)) {
          if (validator.isNonEmptyArray(request.multiFactor.enrolledFactors)) {
            const mfaInfo = [];
            try {
              request.multiFactor.enrolledFactors.forEach((multiFactorInfo) => {
                if ("enrollmentTime" in multiFactorInfo) {
                  throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"enrollmentTime" is not supported when adding second factors via "createUser()"');
                } else if ("uid" in multiFactorInfo) {
                  throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"uid" is not supported when adding second factors via "createUser()"');
                }
                mfaInfo.push((0, user_import_builder_1.convertMultiFactorInfoToServerFormat)(multiFactorInfo));
              });
            } catch (e) {
              return Promise.reject(e);
            }
            request.mfaInfo = mfaInfo;
          }
          delete request.multiFactor;
        }
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), exports.FIREBASE_AUTH_SIGN_UP_NEW_USER, request).then((response) => {
          return response.localId;
        });
      }
      /**
       * Generates the out of band email action link for the email specified using the action code settings provided.
       * Returns a promise that resolves with the generated link.
       *
       * @param requestType - The request type. This could be either used for password reset,
       *     email verification, email link sign-in.
       * @param email - The email of the user the link is being sent to.
       * @param actionCodeSettings - The optional action code setings which defines whether
       *     the link is to be handled by a mobile app and the additional state information to be passed in the
       *     deep link, etc. Required when requestType === 'EMAIL_SIGNIN'
       * @param newEmail - The email address the account is being updated to.
       *     Required only for VERIFY_AND_CHANGE_EMAIL requests.
       * @returns A promise that resolves with the email action link.
       */
      getEmailActionLink(requestType, email, actionCodeSettings, newEmail) {
        let request = {
          requestType,
          email,
          returnOobLink: true,
          ...typeof newEmail !== "undefined" && { newEmail }
        };
        if (typeof actionCodeSettings === "undefined" && requestType === "EMAIL_SIGNIN") {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "`actionCodeSettings` is required when `requestType` === 'EMAIL_SIGNIN'"));
        }
        if (typeof actionCodeSettings !== "undefined" || requestType === "EMAIL_SIGNIN") {
          try {
            const builder = new action_code_settings_builder_1.ActionCodeSettingsBuilder(actionCodeSettings);
            request = (0, deep_copy_1.deepExtend)(request, builder.buildRequest());
          } catch (e) {
            return Promise.reject(e);
          }
        }
        if (requestType === "VERIFY_AND_CHANGE_EMAIL" && typeof newEmail === "undefined") {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "`newEmail` is required when `requestType` === 'VERIFY_AND_CHANGE_EMAIL'"));
        }
        return this.invokeRequestHandler(this.getAuthUrlBuilder(), FIREBASE_AUTH_GET_OOB_CODE, request).then((response) => {
          return response.oobLink;
        });
      }
      /**
       * Looks up an OIDC provider configuration by provider ID.
       *
       * @param providerId - The provider identifier of the configuration to lookup.
       * @returns A promise that resolves with the provider configuration information.
       */
      getOAuthIdpConfig(providerId) {
        if (!auth_config_1.OIDCConfig.isProviderId(providerId)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
        }
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), GET_OAUTH_IDP_CONFIG, {}, { providerId });
      }
      /**
       * Lists the OIDC configurations (single batch only) with a size of maxResults and starting from
       * the offset as specified by pageToken.
       *
       * @param maxResults - The page size, 100 if undefined. This is also the maximum
       *     allowed limit.
       * @param pageToken - The next page token. If not specified, returns OIDC configurations
       *     without any offset. Configurations are returned in the order they were created from oldest to
       *     newest, relative to the page token offset.
       * @returns A promise that resolves with the current batch of downloaded
       *     OIDC configurations and the next page token if available. For the last page, an empty list of provider
       *     configuration and no page token are returned.
       */
      listOAuthIdpConfigs(maxResults = MAX_LIST_PROVIDER_CONFIGURATION_PAGE_SIZE, pageToken) {
        const request = {
          pageSize: maxResults
        };
        if (typeof pageToken !== "undefined") {
          request.pageToken = pageToken;
        }
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), LIST_OAUTH_IDP_CONFIGS, request).then((response) => {
          if (!response.oauthIdpConfigs) {
            response.oauthIdpConfigs = [];
            delete response.nextPageToken;
          }
          return response;
        });
      }
      /**
       * Deletes an OIDC configuration identified by a providerId.
       *
       * @param providerId - The identifier of the OIDC configuration to delete.
       * @returns A promise that resolves when the OIDC provider is deleted.
       */
      deleteOAuthIdpConfig(providerId) {
        if (!auth_config_1.OIDCConfig.isProviderId(providerId)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
        }
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), DELETE_OAUTH_IDP_CONFIG, {}, { providerId }).then(() => {
        });
      }
      /**
       * Creates a new OIDC provider configuration with the properties provided.
       *
       * @param options - The properties to set on the new OIDC provider configuration to be created.
       * @returns A promise that resolves with the newly created OIDC
       *     configuration.
       */
      createOAuthIdpConfig(options) {
        let request;
        try {
          request = auth_config_1.OIDCConfig.buildServerRequest(options) || {};
        } catch (e) {
          return Promise.reject(e);
        }
        const providerId = options.providerId;
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), CREATE_OAUTH_IDP_CONFIG, request, { providerId }).then((response) => {
          if (!auth_config_1.OIDCConfig.getProviderIdFromResourceName(response.name)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Unable to create new OIDC provider configuration");
          }
          return response;
        });
      }
      /**
       * Updates an existing OIDC provider configuration with the properties provided.
       *
       * @param providerId - The provider identifier of the OIDC configuration to update.
       * @param options - The properties to update on the existing configuration.
       * @returns A promise that resolves with the modified provider
       *     configuration.
       */
      updateOAuthIdpConfig(providerId, options) {
        if (!auth_config_1.OIDCConfig.isProviderId(providerId)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
        }
        let request;
        try {
          request = auth_config_1.OIDCConfig.buildServerRequest(options, true) || {};
        } catch (e) {
          return Promise.reject(e);
        }
        const updateMask = utils.generateUpdateMask(request);
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), UPDATE_OAUTH_IDP_CONFIG, request, { providerId, updateMask: updateMask.join(",") }).then((response) => {
          if (!auth_config_1.OIDCConfig.getProviderIdFromResourceName(response.name)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Unable to update OIDC provider configuration");
          }
          return response;
        });
      }
      /**
       * Looks up an SAML provider configuration by provider ID.
       *
       * @param providerId - The provider identifier of the configuration to lookup.
       * @returns A promise that resolves with the provider configuration information.
       */
      getInboundSamlConfig(providerId) {
        if (!auth_config_1.SAMLConfig.isProviderId(providerId)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
        }
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), GET_INBOUND_SAML_CONFIG, {}, { providerId });
      }
      /**
       * Lists the SAML configurations (single batch only) with a size of maxResults and starting from
       * the offset as specified by pageToken.
       *
       * @param maxResults - The page size, 100 if undefined. This is also the maximum
       *     allowed limit.
       * @param pageToken - The next page token. If not specified, returns SAML configurations starting
       *     without any offset. Configurations are returned in the order they were created from oldest to
       *     newest, relative to the page token offset.
       * @returns A promise that resolves with the current batch of downloaded
       *     SAML configurations and the next page token if available. For the last page, an empty list of provider
       *     configuration and no page token are returned.
       */
      listInboundSamlConfigs(maxResults = MAX_LIST_PROVIDER_CONFIGURATION_PAGE_SIZE, pageToken) {
        const request = {
          pageSize: maxResults
        };
        if (typeof pageToken !== "undefined") {
          request.pageToken = pageToken;
        }
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), LIST_INBOUND_SAML_CONFIGS, request).then((response) => {
          if (!response.inboundSamlConfigs) {
            response.inboundSamlConfigs = [];
            delete response.nextPageToken;
          }
          return response;
        });
      }
      /**
       * Deletes a SAML configuration identified by a providerId.
       *
       * @param providerId - The identifier of the SAML configuration to delete.
       * @returns A promise that resolves when the SAML provider is deleted.
       */
      deleteInboundSamlConfig(providerId) {
        if (!auth_config_1.SAMLConfig.isProviderId(providerId)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
        }
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), DELETE_INBOUND_SAML_CONFIG, {}, { providerId }).then(() => {
        });
      }
      /**
       * Creates a new SAML provider configuration with the properties provided.
       *
       * @param options - The properties to set on the new SAML provider configuration to be created.
       * @returns A promise that resolves with the newly created SAML
       *     configuration.
       */
      createInboundSamlConfig(options) {
        let request;
        try {
          request = auth_config_1.SAMLConfig.buildServerRequest(options) || {};
        } catch (e) {
          return Promise.reject(e);
        }
        const providerId = options.providerId;
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), CREATE_INBOUND_SAML_CONFIG, request, { providerId }).then((response) => {
          if (!auth_config_1.SAMLConfig.getProviderIdFromResourceName(response.name)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Unable to create new SAML provider configuration");
          }
          return response;
        });
      }
      /**
       * Updates an existing SAML provider configuration with the properties provided.
       *
       * @param providerId - The provider identifier of the SAML configuration to update.
       * @param options - The properties to update on the existing configuration.
       * @returns A promise that resolves with the modified provider
       *     configuration.
       */
      updateInboundSamlConfig(providerId, options) {
        if (!auth_config_1.SAMLConfig.isProviderId(providerId)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
        }
        let request;
        try {
          request = auth_config_1.SAMLConfig.buildServerRequest(options, true) || {};
        } catch (e) {
          return Promise.reject(e);
        }
        const updateMask = utils.generateUpdateMask(request);
        return this.invokeRequestHandler(this.getProjectConfigUrlBuilder(), UPDATE_INBOUND_SAML_CONFIG, request, { providerId, updateMask: updateMask.join(",") }).then((response) => {
          if (!auth_config_1.SAMLConfig.getProviderIdFromResourceName(response.name)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Unable to update SAML provider configuration");
          }
          return response;
        });
      }
      /**
       * Invokes the request handler based on the API settings object passed.
       *
       * @param urlBuilder - The URL builder for Auth endpoints.
       * @param apiSettings - The API endpoint settings to apply to request and response.
       * @param requestData - The request data.
       * @param additionalResourceParams - Additional resource related params if needed.
       * @returns A promise that resolves with the response.
       */
      invokeRequestHandler(urlBuilder, apiSettings, requestData, additionalResourceParams) {
        return urlBuilder.getUrl(apiSettings.getEndpoint(), additionalResourceParams).then((url) => {
          if (requestData) {
            const requestValidator = apiSettings.getRequestValidator();
            requestValidator(requestData);
          }
          const req = {
            method: apiSettings.getHttpMethod(),
            url,
            headers: FIREBASE_AUTH_HEADERS,
            data: requestData,
            timeout: FIREBASE_AUTH_TIMEOUT
          };
          return this.httpClient.send(req);
        }).then((response) => {
          const responseValidator = apiSettings.getResponseValidator();
          if (responseValidator) {
            responseValidator(response);
          }
          return response.data;
        }).catch((err) => {
          if (err instanceof api_request_1.RequestResponseError) {
            const errorCode = _AbstractAuthRequestHandler.getErrorCode(err.response.data);
            if (!errorCode) {
              throw new error_1.FirebaseAuthError({
                ...error_1.authClientErrorCode.INTERNAL_ERROR,
                message: "An internal error occurred while attempting to extract the errorcode from the error.",
                cause: err,
                httpResponse: (0, error_2.toHttpResponse)(err.response)
              });
            }
            throw error_1.FirebaseAuthError.fromServerError(
              errorCode,
              /* message */
              void 0,
              err
            );
          }
          throw err;
        });
      }
      /**
       * @returns The current Auth user management resource URL builder.
       */
      getAuthUrlBuilder() {
        if (!this.authUrlBuilder) {
          this.authUrlBuilder = this.newAuthUrlBuilder();
        }
        return this.authUrlBuilder;
      }
      /**
       * @returns The current project config resource URL builder.
       */
      getProjectConfigUrlBuilder() {
        if (!this.projectConfigUrlBuilder) {
          this.projectConfigUrlBuilder = this.newProjectConfigUrlBuilder();
        }
        return this.projectConfigUrlBuilder;
      }
    };
    exports.AbstractAuthRequestHandler = AbstractAuthRequestHandler;
    var GET_PROJECT_CONFIG = new api_request_1.ApiSettings("/config", "GET").setResponseValidator((response) => {
      if (useEmulator()) {
        return;
      }
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to get project config",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var UPDATE_PROJECT_CONFIG = new api_request_1.ApiSettings("/config?updateMask={updateMask}", "PATCH").setResponseValidator((response) => {
      if (useEmulator()) {
        return;
      }
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to update project config",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var GET_TENANT = new api_request_1.ApiSettings("/tenants/{tenantId}", "GET").setResponseValidator((response) => {
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to get tenant",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var DELETE_TENANT = new api_request_1.ApiSettings("/tenants/{tenantId}", "DELETE");
    var UPDATE_TENANT = new api_request_1.ApiSettings("/tenants/{tenantId}?updateMask={updateMask}", "PATCH").setResponseValidator((response) => {
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name) || !tenant_1.Tenant.getTenantIdFromResourceName(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to update tenant",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var LIST_TENANTS = new api_request_1.ApiSettings("/tenants", "GET").setRequestValidator((request) => {
      if (typeof request.pageToken !== "undefined" && !validator.isNonEmptyString(request.pageToken)) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PAGE_TOKEN);
      }
      if (!validator.isNumber(request.pageSize) || request.pageSize <= 0 || request.pageSize > MAX_LIST_TENANT_PAGE_SIZE) {
        throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `Required "maxResults" must be a positive non-zero number that does not exceed the allowed ${MAX_LIST_TENANT_PAGE_SIZE}.`);
      }
    });
    var CREATE_TENANT = new api_request_1.ApiSettings("/tenants", "POST").setResponseValidator((response) => {
      const data = response.data;
      if (!validator.isNonEmptyString(data?.name) || !tenant_1.Tenant.getTenantIdFromResourceName(data?.name)) {
        throw new error_1.FirebaseAuthError({
          ...error_1.authClientErrorCode.INTERNAL_ERROR,
          message: "INTERNAL ASSERT FAILED: Unable to create tenant",
          httpResponse: (0, error_2.toHttpResponse)(response)
        });
      }
    });
    var AuthRequestHandler = class extends AbstractAuthRequestHandler {
      /**
       * The FirebaseAuthRequestHandler constructor used to initialize an instance using a FirebaseApp.
       *
       * @param app - The app used to fetch access tokens to sign API requests.
       * @constructor
       */
      constructor(app) {
        super(app);
        this.authResourceUrlBuilder = new AuthResourceUrlBuilder(app, "v2", this.emulatorHostValue);
      }
      /**
       * @returns A new Auth user management resource URL builder instance.
       */
      newAuthUrlBuilder() {
        return new AuthResourceUrlBuilder(this.app, "v1", this.emulatorHostValue);
      }
      /**
       * @returns A new project config resource URL builder instance.
       */
      newProjectConfigUrlBuilder() {
        return new AuthResourceUrlBuilder(this.app, "v2", this.emulatorHostValue);
      }
      /**
       * Get the current project's config
       * @returns A promise that resolves with the project config information.
       */
      getProjectConfig() {
        return this.invokeRequestHandler(this.authResourceUrlBuilder, GET_PROJECT_CONFIG, {}, {}).then((response) => {
          return response;
        });
      }
      /**
       * Update the current project's config.
       * @returns A promise that resolves with the project config information.
       */
      updateProjectConfig(options) {
        try {
          const request = project_config_1.ProjectConfig.buildServerRequest(options);
          const updateMask = utils.generateUpdateMask(request);
          return this.invokeRequestHandler(this.authResourceUrlBuilder, UPDATE_PROJECT_CONFIG, request, { updateMask: updateMask.join(",") }).then((response) => {
            return response;
          });
        } catch (e) {
          return Promise.reject(e);
        }
      }
      /**
       * Looks up a tenant by tenant ID.
       *
       * @param tenantId - The tenant identifier of the tenant to lookup.
       * @returns A promise that resolves with the tenant information.
       */
      getTenant(tenantId) {
        if (!validator.isNonEmptyString(tenantId)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_TENANT_ID));
        }
        return this.invokeRequestHandler(this.authResourceUrlBuilder, GET_TENANT, {}, { tenantId }).then((response) => {
          return response;
        });
      }
      /**
       * Exports the tenants (single batch only) with a size of maxResults and starting from
       * the offset as specified by pageToken.
       *
       * @param maxResults - The page size, 1000 if undefined. This is also the maximum
       *     allowed limit.
       * @param pageToken - The next page token. If not specified, returns tenants starting
       *     without any offset. Tenants are returned in the order they were created from oldest to
       *     newest, relative to the page token offset.
       * @returns A promise that resolves with the current batch of downloaded
       *     tenants and the next page token if available. For the last page, an empty list of tenants
       *     and no page token are returned.
       */
      listTenants(maxResults = MAX_LIST_TENANT_PAGE_SIZE, pageToken) {
        const request = {
          pageSize: maxResults,
          pageToken
        };
        if (typeof request.pageToken === "undefined") {
          delete request.pageToken;
        }
        return this.invokeRequestHandler(this.authResourceUrlBuilder, LIST_TENANTS, request).then((response) => {
          if (!response.tenants) {
            response.tenants = [];
            delete response.nextPageToken;
          }
          return response;
        });
      }
      /**
       * Deletes a tenant identified by a tenantId.
       *
       * @param tenantId - The identifier of the tenant to delete.
       * @returns A promise that resolves when the tenant is deleted.
       */
      deleteTenant(tenantId) {
        if (!validator.isNonEmptyString(tenantId)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_TENANT_ID));
        }
        return this.invokeRequestHandler(this.authResourceUrlBuilder, DELETE_TENANT, void 0, { tenantId }).then(() => {
        });
      }
      /**
       * Creates a new tenant with the properties provided.
       *
       * @param tenantOptions - The properties to set on the new tenant to be created.
       * @returns A promise that resolves with the newly created tenant object.
       */
      createTenant(tenantOptions) {
        try {
          const request = tenant_1.Tenant.buildServerRequest(tenantOptions, true);
          return this.invokeRequestHandler(this.authResourceUrlBuilder, CREATE_TENANT, request).then((response) => {
            return response;
          });
        } catch (e) {
          return Promise.reject(e);
        }
      }
      /**
       * Updates an existing tenant with the properties provided.
       *
       * @param tenantId - The tenant identifier of the tenant to update.
       * @param tenantOptions - The properties to update on the existing tenant.
       * @returns A promise that resolves with the modified tenant object.
       */
      updateTenant(tenantId, tenantOptions) {
        if (!validator.isNonEmptyString(tenantId)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_TENANT_ID));
        }
        try {
          const request = tenant_1.Tenant.buildServerRequest(tenantOptions, false);
          const updateMask = utils.generateUpdateMask(request, ["testPhoneNumbers"]);
          return this.invokeRequestHandler(this.authResourceUrlBuilder, UPDATE_TENANT, request, { tenantId, updateMask: updateMask.join(",") }).then((response) => {
            return response;
          });
        } catch (e) {
          return Promise.reject(e);
        }
      }
    };
    exports.AuthRequestHandler = AuthRequestHandler;
    var TenantAwareAuthRequestHandler = class extends AbstractAuthRequestHandler {
      /**
       * The FirebaseTenantRequestHandler constructor used to initialize an instance using a
       * FirebaseApp and a tenant ID.
       *
       * @param app - The app used to fetch access tokens to sign API requests.
       * @param tenantId - The request handler's tenant ID.
       * @param emHost - Optional emulator host override captured at init time.
       * @constructor
       */
      constructor(app, tenantId, emHost) {
        super(app, emHost);
        this.tenantId = tenantId;
      }
      /**
       * @returns A new Auth user management resource URL builder instance.
       */
      newAuthUrlBuilder() {
        return new TenantAwareAuthResourceUrlBuilder(this.app, "v1", this.tenantId, this.emulatorHostValue);
      }
      /**
       * @returns A new project config resource URL builder instance.
       */
      newProjectConfigUrlBuilder() {
        return new TenantAwareAuthResourceUrlBuilder(this.app, "v2", this.tenantId, this.emulatorHostValue);
      }
      /**
       * Imports the list of users provided to Firebase Auth. This is useful when
       * migrating from an external authentication system without having to use the Firebase CLI SDK.
       * At most, 1000 users are allowed to be imported one at a time.
       * When importing a list of password users, UserImportOptions are required to be specified.
       *
       * Overrides the superclass methods by adding an additional check to match tenant IDs of
       * imported user records if present.
       *
       * @param users - The list of user records to import to Firebase Auth.
       * @param options - The user import options, required when the users provided
       *     include password credentials.
       * @returns A promise that resolves when the operation completes
       *     with the result of the import. This includes the number of successful imports, the number
       *     of failed uploads and their corresponding errors.
       */
      uploadAccount(users, options) {
        users.forEach((user, index) => {
          if (validator.isNonEmptyString(user.tenantId) && user.tenantId !== this.tenantId) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MISMATCHING_TENANT_ID, `UserRecord of index "${index}" has mismatching tenant ID "${user.tenantId}"`);
          }
        });
        return super.uploadAccount(users, options);
      }
    };
    exports.TenantAwareAuthRequestHandler = TenantAwareAuthRequestHandler;
    function emulatorHost() {
      return process.env.FIREBASE_AUTH_EMULATOR_HOST;
    }
    function useEmulator() {
      return !!emulatorHost();
    }
  }
});

// node_modules/firebase-admin/lib/utils/crypto-signer.js
var require_crypto_signer = __commonJS({
  "node_modules/firebase-admin/lib/utils/crypto-signer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CryptoSignerErrorCode = exports.CryptoSignerError = exports.IAMSigner = exports.ServiceAccountSigner = void 0;
    exports.cryptoSignerFromApp = cryptoSignerFromApp;
    var credential_internal_1 = require_credential_internal();
    var api_request_1 = require_api_request();
    var utils = require_utils();
    var validator = require_validator();
    var ALGORITHM_RS256 = "RS256";
    var ServiceAccountSigner = class {
      /**
       * Creates a new CryptoSigner instance from the given service account credential.
       *
       * @param credential - A service account credential.
       */
      constructor(credential) {
        this.credential = credential;
        this.algorithm = ALGORITHM_RS256;
        if (!credential) {
          throw new CryptoSignerError({
            code: CryptoSignerErrorCode.INVALID_CREDENTIAL,
            message: "INTERNAL ASSERT: Must provide a service account credential to initialize ServiceAccountSigner."
          });
        }
      }
      /**
       * @inheritDoc
       */
      sign(buffer) {
        const crypto2 = __require("node:crypto");
        const sign = crypto2.createSign("RSA-SHA256");
        sign.update(buffer);
        return Promise.resolve(sign.sign(this.credential.privateKey));
      }
      /**
       * @inheritDoc
       */
      getAccountId() {
        return Promise.resolve(this.credential.clientEmail);
      }
    };
    exports.ServiceAccountSigner = ServiceAccountSigner;
    var IAMSigner = class {
      constructor(httpClient, app) {
        this.algorithm = ALGORITHM_RS256;
        if (!httpClient) {
          throw new CryptoSignerError({
            code: CryptoSignerErrorCode.INVALID_ARGUMENT,
            message: "INTERNAL ASSERT: Must provide a HTTP client to initialize IAMSigner."
          });
        }
        if (app && (typeof app !== "object" || app === null || !("options" in app))) {
          throw new CryptoSignerError({
            code: CryptoSignerErrorCode.INVALID_ARGUMENT,
            message: "INTERNAL ASSERT: Must provide a valid Firebase app instance."
          });
        }
        this.httpClient = httpClient;
        this.app = app;
      }
      /**
       * @inheritDoc
       */
      sign(buffer) {
        return this.getAccountId().then((serviceAccount) => {
          const request = {
            method: "POST",
            url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:signBlob`,
            data: { payload: buffer.toString("base64") }
          };
          return this.httpClient.send(request);
        }).then((response) => {
          return Buffer.from(response.data.signedBlob, "base64");
        }).catch((err) => {
          if (err instanceof api_request_1.RequestResponseError) {
            throw new CryptoSignerError({
              code: CryptoSignerErrorCode.SERVER_ERROR,
              message: err.message,
              cause: err
            });
          }
          throw err;
        });
      }
      /**
       * @inheritDoc
       */
      async getAccountId() {
        if (validator.isNonEmptyString(this.serviceAccountId)) {
          return this.serviceAccountId;
        }
        if (this.app) {
          const accountId = await utils.findServiceAccountEmail(this.app);
          if (accountId) {
            this.serviceAccountId = accountId;
            return accountId;
          }
        }
        const request = {
          method: "GET",
          url: "http://metadata/computeMetadata/v1/instance/service-accounts/default/email",
          headers: {
            "Metadata-Flavor": "Google"
          }
        };
        const client = new api_request_1.HttpClient();
        return client.send(request).then((response) => {
          if (!response.text) {
            throw new CryptoSignerError({
              code: CryptoSignerErrorCode.INTERNAL_ERROR,
              message: "HTTP Response missing payload"
            });
          }
          this.serviceAccountId = response.text;
          return response.text;
        }).catch((err) => {
          throw new CryptoSignerError({
            code: CryptoSignerErrorCode.INVALID_CREDENTIAL,
            message: `Failed to determine service account. Make sure to initialize the SDK with a service account credential. Alternatively specify a service account with iam.serviceAccounts.signBlob permission. Original error: ${err}`
          });
        });
      }
    };
    exports.IAMSigner = IAMSigner;
    function cryptoSignerFromApp(app) {
      const credential = app.options.credential;
      if (credential instanceof credential_internal_1.ServiceAccountCredential) {
        return new ServiceAccountSigner(credential);
      }
      return new IAMSigner(new api_request_1.AuthorizedHttpClient(app), app);
    }
    var CryptoSignerError = class extends Error {
      constructor(errorInfo) {
        super(errorInfo.message);
        this.errorInfo = errorInfo;
      }
      /** @returns The error code. */
      get code() {
        return this.errorInfo.code;
      }
      /** @returns The error message. */
      get message() {
        return this.errorInfo.message;
      }
      /** @returns The error data. */
      get cause() {
        return this.errorInfo.cause;
      }
    };
    exports.CryptoSignerError = CryptoSignerError;
    var CryptoSignerErrorCode = class {
    };
    exports.CryptoSignerErrorCode = CryptoSignerErrorCode;
    CryptoSignerErrorCode.INVALID_ARGUMENT = "invalid-argument";
    CryptoSignerErrorCode.INTERNAL_ERROR = "internal-error";
    CryptoSignerErrorCode.INVALID_CREDENTIAL = "invalid-credential";
    CryptoSignerErrorCode.SERVER_ERROR = "server-error";
  }
});

// node_modules/firebase-admin/lib/auth/token-generator.js
var require_token_generator = __commonJS({
  "node_modules/firebase-admin/lib/auth/token-generator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirebaseTokenGenerator = exports.EmulatedSigner = exports.BLACKLISTED_CLAIMS = void 0;
    exports.handleCryptoSignerError = handleCryptoSignerError;
    var error_1 = require_error3();
    var crypto_signer_1 = require_crypto_signer();
    var validator = require_validator();
    var utils_1 = require_utils();
    var ALGORITHM_NONE = "none";
    var ONE_HOUR_IN_SECONDS = 60 * 60;
    exports.BLACKLISTED_CLAIMS = [
      "acr",
      "amr",
      "at_hash",
      "aud",
      "auth_time",
      "azp",
      "cnf",
      "c_hash",
      "exp",
      "iat",
      "iss",
      "jti",
      "nbf",
      "nonce"
    ];
    var FIREBASE_AUDIENCE = "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
    var EmulatedSigner = class {
      constructor() {
        this.algorithm = ALGORITHM_NONE;
      }
      /**
       * @inheritDoc
       */
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sign(buffer) {
        return Promise.resolve(Buffer.from(""));
      }
      /**
       * @inheritDoc
       */
      getAccountId() {
        return Promise.resolve("firebase-auth-emulator@example.com");
      }
    };
    exports.EmulatedSigner = EmulatedSigner;
    var FirebaseTokenGenerator = class {
      /**
       * @param tenantId - The tenant ID to use for the generated Firebase Auth
       *     Custom token. If absent, then no tenant ID claim will be set in the
       *     resulting JWT.
       */
      constructor(signer, tenantId) {
        this.tenantId = tenantId;
        if (!validator.isNonNullObject(signer)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CREDENTIAL, "INTERNAL ASSERT: Must provide a CryptoSigner to use FirebaseTokenGenerator.");
        }
        if (typeof this.tenantId !== "undefined" && !validator.isNonEmptyString(this.tenantId)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "`tenantId` argument must be a non-empty string.");
        }
        this.signer = signer;
      }
      /**
       * Creates a new Firebase Auth Custom token.
       *
       * @param uid - The user ID to use for the generated Firebase Auth Custom token.
       * @param developerClaims - Optional developer claims to include in the generated Firebase
       *     Auth Custom token.
       * @returns A Promise fulfilled with a Firebase Auth Custom token signed with a
       *     service account key and containing the provided payload.
       */
      createCustomToken(uid, developerClaims) {
        let errorMessage;
        if (!validator.isNonEmptyString(uid)) {
          errorMessage = "`uid` argument must be a non-empty string uid.";
        } else if (uid.length > 128) {
          errorMessage = "`uid` argument must a uid with less than or equal to 128 characters.";
        } else if (!this.isDeveloperClaimsValid_(developerClaims)) {
          errorMessage = "`developerClaims` argument must be a valid, non-null object containing the developer claims.";
        }
        if (errorMessage) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, errorMessage);
        }
        const claims = {};
        if (typeof developerClaims !== "undefined") {
          for (const key in developerClaims) {
            if (Object.prototype.hasOwnProperty.call(developerClaims, key)) {
              if (exports.BLACKLISTED_CLAIMS.indexOf(key) !== -1) {
                throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `Developer claim "${key}" is reserved and cannot be specified.`);
              }
              claims[key] = developerClaims[key];
            }
          }
        }
        return this.signer.getAccountId().then((account) => {
          const header = {
            alg: this.signer.algorithm,
            typ: "JWT"
          };
          const iat = Math.floor(Date.now() / 1e3);
          const body = {
            aud: FIREBASE_AUDIENCE,
            iat,
            exp: iat + ONE_HOUR_IN_SECONDS,
            iss: account,
            sub: account,
            uid
          };
          if (this.tenantId) {
            body.tenant_id = this.tenantId;
          }
          if (Object.keys(claims).length > 0) {
            body.claims = claims;
          }
          const token = `${this.encodeSegment(header)}.${this.encodeSegment(body)}`;
          const signPromise = this.signer.sign(Buffer.from(token));
          return Promise.all([token, signPromise]);
        }).then(([token, signature]) => {
          return `${token}.${this.encodeSegment(signature)}`;
        }).catch((err) => {
          throw handleCryptoSignerError(err);
        });
      }
      encodeSegment(segment) {
        const buffer = segment instanceof Buffer ? segment : Buffer.from(JSON.stringify(segment));
        return (0, utils_1.toWebSafeBase64)(buffer).replace(/=+$/, "");
      }
      /**
       * Returns whether or not the provided developer claims are valid.
       *
       * @param developerClaims - Optional developer claims to validate.
       * @returns True if the provided claims are valid; otherwise, false.
       */
      // eslint-disable-next-line @typescript-eslint/naming-convention
      isDeveloperClaimsValid_(developerClaims) {
        if (typeof developerClaims === "undefined") {
          return true;
        }
        return validator.isNonNullObject(developerClaims);
      }
    };
    exports.FirebaseTokenGenerator = FirebaseTokenGenerator;
    function handleCryptoSignerError(err) {
      if (!(err instanceof crypto_signer_1.CryptoSignerError)) {
        return err;
      }
      if (err.code === crypto_signer_1.CryptoSignerErrorCode.SERVER_ERROR && validator.isNonNullObject(err.cause)) {
        const httpError = err.cause;
        const errorResponse = httpError.response.data;
        if (validator.isNonNullObject(errorResponse) && errorResponse.error) {
          const errorCode = errorResponse.error.status;
          const description = "Please refer to https://firebase.google.com/docs/auth/admin/create-custom-tokens for more details on how to use and troubleshoot this feature.";
          const errorMsg = `${errorResponse.error.message}; ${description}`;
          return error_1.FirebaseAuthError.fromServerError(errorCode, errorMsg, httpError);
        }
        return new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "Error returned from server: " + errorResponse + ". Additionally, an internal error occurred while attempting to extract the errorcode from the error.");
      }
      return new error_1.FirebaseAuthError(mapToAuthErrorInfo(err.code), err.message);
    }
    function mapToAuthErrorInfo(code) {
      switch (code) {
        case crypto_signer_1.CryptoSignerErrorCode.INVALID_CREDENTIAL:
          return error_1.authClientErrorCode.INVALID_CREDENTIAL;
        case crypto_signer_1.CryptoSignerErrorCode.INVALID_ARGUMENT:
          return error_1.authClientErrorCode.INVALID_ARGUMENT;
        default:
          return error_1.authClientErrorCode.INTERNAL_ERROR;
      }
    }
  }
});

// node_modules/jose/dist/webapi/lib/buffer_utils.js
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0), buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers)
    buf.set(buffer, i), i += buffer.length;
  return buf;
}
function writeUInt32BE(buf, value, offset) {
  if (value < 0 || value >= MAX_INT32)
    throw new RangeError(`value must be >= 0 and <= ${MAX_INT32 - 1}. Received ${value}`);
  buf.set([value >>> 24, value >>> 16, value >>> 8, value & 255], offset);
}
function uint64be(value) {
  const high = Math.floor(value / MAX_INT32), low = value % MAX_INT32, buf = new Uint8Array(8);
  return writeUInt32BE(buf, high, 0), writeUInt32BE(buf, low, 4), buf;
}
function uint32be(value) {
  const buf = new Uint8Array(4);
  return writeUInt32BE(buf, value), buf;
}
function encode(string) {
  if (typeof string == "string" && string.length >= 128) {
    if (NON_ASCII.test(string))
      throw new TypeError("non-ASCII string encountered in encode()");
    return encoder.encode(string);
  }
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127)
      throw new TypeError("non-ASCII string encountered in encode()");
    bytes[i] = code;
  }
  return bytes;
}
function encodeBase64(input, url = false) {
  if (Uint8Array.prototype.toBase64)
    return input.toBase64({ alphabet: url ? "base64url" : "base64", omitPadding: url });
  const CHUNK_SIZE = 32768, arr = [];
  for (let i = 0; i < input.length; i += CHUNK_SIZE)
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  const encoded = btoa(arr.join(""));
  return url ? encoded.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_") : encoded;
}
function decodeBase64(encoded, url = false) {
  if (Uint8Array.fromBase64)
    return Uint8Array.fromBase64(encoded, { alphabet: url ? "base64url" : "base64" });
  if (url) {
    if (encoded.includes("+") || encoded.includes("/"))
      throw new TypeError("Invalid base64url");
    encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  }
  const binary = atob(encoded), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function digest(algorithm, data) {
  const subtleDigest = `SHA-${algorithm.slice(-3)}`;
  return new Uint8Array(await crypto.subtle.digest(subtleDigest, data));
}
var encoder, decoder, strictDecoder, MAX_INT32, NON_ASCII;
var init_buffer_utils = __esm({
  "node_modules/jose/dist/webapi/lib/buffer_utils.js"() {
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    strictDecoder = new TextDecoder("utf-8", { fatal: true });
    MAX_INT32 = 2 ** 32;
    NON_ASCII = /[^\x00-\x7f]/;
  }
});

// node_modules/jose/dist/webapi/util/errors.js
var errors_exports = {};
__export(errors_exports, {
  JOSEAlgNotAllowed: () => JOSEAlgNotAllowed,
  JOSEError: () => JOSEError,
  JOSENotSupported: () => JOSENotSupported,
  JWEDecryptionFailed: () => JWEDecryptionFailed,
  JWEInvalid: () => JWEInvalid,
  JWKInvalid: () => JWKInvalid,
  JWKSInvalid: () => JWKSInvalid,
  JWKSMultipleMatchingKeys: () => JWKSMultipleMatchingKeys,
  JWKSNoMatchingKey: () => JWKSNoMatchingKey,
  JWKSTimeout: () => JWKSTimeout,
  JWSInvalid: () => JWSInvalid,
  JWSSignatureVerificationFailed: () => JWSSignatureVerificationFailed,
  JWTClaimValidationFailed: () => JWTClaimValidationFailed,
  JWTExpired: () => JWTExpired,
  JWTInvalid: () => JWTInvalid
});
var JOSEError, JWTClaimValidationFailed, JWTExpired, JOSEAlgNotAllowed, JOSENotSupported, JWEDecryptionFailed, JWEInvalid, JWSInvalid, JWTInvalid, JWKInvalid, JWKSInvalid, JWKSNoMatchingKey, JWKSMultipleMatchingKeys, JWKSTimeout, JWSSignatureVerificationFailed;
var init_errors = __esm({
  "node_modules/jose/dist/webapi/util/errors.js"() {
    JOSEError = class extends Error {
      static code = "ERR_JOSE_GENERIC";
      code = "ERR_JOSE_GENERIC";
      constructor(message2, options) {
        super(message2, options), this.name = this.constructor.name, Error.captureStackTrace?.(this, this.constructor);
      }
    };
    JWTClaimValidationFailed = class extends JOSEError {
      static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      claim;
      reason;
      payload;
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } }), this.claim = claim, this.reason = reason, this.payload = payload;
      }
    };
    JWTExpired = class extends JOSEError {
      static code = "ERR_JWT_EXPIRED";
      code = "ERR_JWT_EXPIRED";
      claim;
      reason;
      payload;
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } }), this.claim = claim, this.reason = reason, this.payload = payload;
      }
    };
    JOSEAlgNotAllowed = class extends JOSEError {
      static code = "ERR_JOSE_ALG_NOT_ALLOWED";
      code = "ERR_JOSE_ALG_NOT_ALLOWED";
    };
    JOSENotSupported = class extends JOSEError {
      static code = "ERR_JOSE_NOT_SUPPORTED";
      code = "ERR_JOSE_NOT_SUPPORTED";
    };
    JWEDecryptionFailed = class extends JOSEError {
      static code = "ERR_JWE_DECRYPTION_FAILED";
      code = "ERR_JWE_DECRYPTION_FAILED";
      constructor(message2 = "decryption operation failed", options) {
        super(message2, options);
      }
    };
    JWEInvalid = class extends JOSEError {
      static code = "ERR_JWE_INVALID";
      code = "ERR_JWE_INVALID";
    };
    JWSInvalid = class extends JOSEError {
      static code = "ERR_JWS_INVALID";
      code = "ERR_JWS_INVALID";
    };
    JWTInvalid = class extends JOSEError {
      static code = "ERR_JWT_INVALID";
      code = "ERR_JWT_INVALID";
    };
    JWKInvalid = class extends JOSEError {
      static code = "ERR_JWK_INVALID";
      code = "ERR_JWK_INVALID";
    };
    JWKSInvalid = class extends JOSEError {
      static code = "ERR_JWKS_INVALID";
      code = "ERR_JWKS_INVALID";
    };
    JWKSNoMatchingKey = class extends JOSEError {
      static code = "ERR_JWKS_NO_MATCHING_KEY";
      code = "ERR_JWKS_NO_MATCHING_KEY";
      constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
        super(message2, options);
      }
    };
    JWKSMultipleMatchingKeys = class extends JOSEError {
      [Symbol.asyncIterator] = async function* () {
      };
      static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
        super(message2, options);
      }
    };
    JWKSTimeout = class extends JOSEError {
      static code = "ERR_JWKS_TIMEOUT";
      code = "ERR_JWKS_TIMEOUT";
      constructor(message2 = "request timed out", options) {
        super(message2, options);
      }
    };
    JWSSignatureVerificationFailed = class extends JOSEError {
      static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      constructor(message2 = "signature verification failed", options) {
        super(message2, options);
      }
    };
  }
});

// node_modules/jose/dist/webapi/util/base64url.js
var base64url_exports = {};
__export(base64url_exports, {
  decode: () => decode,
  encode: () => encode2
});
function decode(input) {
  try {
    return decodeBase64(typeof input == "string" ? input : decoder.decode(input), true);
  } catch (cause) {
    throw new TypeError(invalid, { cause });
  }
}
function encode2(input) {
  return encodeBase64(typeof input == "string" ? encoder.encode(input) : input, true);
}
var invalid;
var init_base64url = __esm({
  "node_modules/jose/dist/webapi/util/base64url.js"() {
    init_buffer_utils();
    invalid = "The input to be decoded is not correctly encoded.";
  }
});

// node_modules/jose/dist/webapi/lib/validate.js
function assertUint8Array(input, label) {
  if (!(input instanceof Uint8Array))
    throw new TypeError(`${label} must be an instance of Uint8Array`);
}
function isObject(input) {
  if (typeof input != "object" || input === null || Object.prototype.toString.call(input) !== "[object Object]")
    return false;
  const prototype = Object.getPrototypeOf(input);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}
function isJwkSet(input) {
  return isObject(input) && Array.isArray(input.keys) && Array.from(input.keys).every(isObject);
}
function isDisjoint(...headers) {
  const parameters = /* @__PURE__ */ new Set();
  for (const header of headers)
    if (header)
      for (const parameter of Object.keys(header)) {
        if (parameters.has(parameter))
          return false;
        parameters.add(parameter);
      }
  return true;
}
function assertNotSet(value, name) {
  if (value !== void 0)
    throw new TypeError(`${name} can only be called once`);
}
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
function encodeBase64url(value, label, ErrorClass) {
  try {
    return encode(value);
  } catch {
    throw new ErrorClass(`The ${label} is not a valid base64url string`);
  }
}
function parseJoseHeader(b64, ErrorClass, message2) {
  let parsed;
  try {
    parsed = JSON.parse(strictDecoder.decode(decode(b64)));
  } catch {
    throw new ErrorClass(message2);
  }
  if (!isObject(parsed))
    throw new ErrorClass(message2);
  return parsed;
}
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s != "string")))
    throw new TypeError(`"${option}" option must be an array of strings`);
  return algorithms === void 0 ? void 0 : new Set(algorithms);
}
function validateCritDuplicates(Err, protectedHeader) {
  const { crit } = protectedHeader ?? {};
  if (Array.isArray(crit) && new Set(crit).size !== crit.length)
    throw new Err('"crit" (Critical) Header Parameter MUST NOT contain duplicate values');
}
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0)
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  if (!protectedHeader || protectedHeader.crit === void 0)
    return [];
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input != "string" || input.length === 0))
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  const recognized = recognizedOption === void 0 ? recognizedDefault : { __proto__: null, ...recognizedOption, ...recognizedDefault };
  for (const parameter of protectedHeader.crit) {
    if (!(parameter in recognized))
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    if (!Object.hasOwn(joseHeader, parameter) || joseHeader[parameter] === void 0)
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    if (recognized[parameter] && (!Object.hasOwn(protectedHeader, parameter) || protectedHeader[parameter] === void 0))
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
  }
  return protectedHeader.crit;
}
function validateB64(protectedHeader, extensions) {
  if (extensions.includes("b64")) {
    const b64 = protectedHeader.b64;
    if (typeof b64 != "boolean")
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    return b64;
  }
  return true;
}
function serializeJoseHeader(Err, header) {
  let serialized, parsed;
  try {
    serialized = JSON.stringify(header), parsed = JSON.parse(serialized);
  } catch (cause) {
    throw new Err("JOSE Header is not valid JSON", { cause });
  }
  if (!isObject(parsed))
    throw new Err("JOSE Header is not a JSON object");
  return [parsed, serialized];
}
var JWS_RECOGNIZED, JWE_RECOGNIZED;
var init_validate = __esm({
  "node_modules/jose/dist/webapi/lib/validate.js"() {
    init_errors();
    init_base64url();
    init_buffer_utils();
    JWS_RECOGNIZED = { __proto__: null, b64: true };
    JWE_RECOGNIZED = { __proto__: null };
  }
});

// node_modules/jose/dist/webapi/lib/key.js
async function prepareKey(entry, key, usage) {
  const { alg, secret } = entry, privateKey = usage === "decrypt" || usage === "sign";
  if (secret && key instanceof Uint8Array)
    return key;
  let normalized, keyObject;
  if (isObject(key)) {
    if (normalized = normalizeJwk(key), typeof normalized.kty != "string")
      throw invalidKeyType(alg, key, secret);
    if (!(secret ? normalized.kty === "oct" && typeof normalized.k == "string" : normalized.kty !== "oct" && (privateKey ? normalized.kty === "AKP" && typeof normalized.priv == "string" || typeof normalized.d == "string" : normalized.d === void 0 && normalized.priv === void 0)))
      throw new TypeError(secret ? 'JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present' : `JSON Web Key for this operation must be a ${privateKey ? "private" : "public"} JWK`);
    if (jwkMatchesOp(entry, normalized, usage), normalized.kty === "oct")
      return decode(normalized.k);
    if (!Object.isFrozen(key)) {
      const { key_ops } = key;
      Array.isArray(key_ops) && Object.freeze(key_ops), Object.freeze(key);
    }
  } else {
    if (!isKeyLike(key))
      throw invalidKeyType(alg, key, secret);
    const expectedType = secret ? "secret" : privateKey ? "private" : "public";
    if (key.type !== expectedType && (secret || ["secret", "public", "private"].includes(key.type)))
      throw new TypeError(`${tag(key)} instances must be of type "${expectedType}" for the ${alg} algorithm`);
    if (isCryptoKey(key))
      return key;
    if (keyObject = key, keyObject.type === "secret")
      return keyObject.export();
  }
  cache ||= /* @__PURE__ */ new WeakMap();
  const cacheKey = key;
  let cached = cache.get(cacheKey);
  if (cached?.[alg])
    return cached[alg];
  if (cached || cache.set(cacheKey, cached = {}), keyObject && typeof keyObject.toCryptoKey == "function") {
    const isPublic = keyObject.type === "public", crv = nist[keyObject.asymmetricKeyDetails?.namedCurve], params = entry.resolve?.({ crv, asymmetricKeyType: keyObject.asymmetricKeyType }) ?? entry.subtle;
    return cached[alg] = keyObject.toCryptoKey(params, isPublic, entry.usages[isPublic ? 0 : 1]);
  }
  return normalized ??= keyObject.export({ format: "jwk" }), normalized.alg = alg, cached[alg] = await jwkToKey(entry, normalized);
}
function assertCryptoKey(key) {
  if (!isCryptoKey(key))
    throw new Error("CryptoKey instance expected");
}
function message(msg, actual, ...types) {
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else types.length === 2 ? msg += `one of type ${types[0]} or ${types[1]}.` : msg += `of type ${types[0]}.`;
  return actual == null ? msg += ` Received ${actual}` : typeof actual == "function" && actual.name ? msg += ` Received function ${actual.name}` : typeof actual == "object" && actual != null && actual.constructor?.name && (msg += ` Received an instance of ${actual.constructor.name}`), msg;
}
function invalidKeyType(alg, actual, secret) {
  const types = ["CryptoKey", "KeyObject", "JSON Web Key"];
  return secret && types.push("Uint8Array"), new TypeError(message(`Key for the ${alg} algorithm must be `, actual, ...types));
}
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage))
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
}
function checkModulusLength(alg, key) {
  const { modulusLength } = key.algorithm;
  if (typeof modulusLength != "number" || modulusLength < 2048)
    throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
}
function checkCryptoKey(key, expected, usage) {
  const algorithm = key.algorithm;
  if (algorithm.name !== expected.name)
    throw unusable(expected.name);
  if (expected.hash && algorithm.hash?.name !== expected.hash)
    throw unusable(expected.hash, "algorithm.hash");
  if (expected.namedCurve && algorithm.namedCurve !== expected.namedCurve)
    throw unusable(expected.namedCurve, "algorithm.namedCurve");
  if (expected.length !== void 0 && algorithm.length !== expected.length)
    throw unusable(expected.length, "algorithm.length");
  checkUsage(key, usage);
}
function snapshotJwk(jwk) {
  return { __proto__: null, ...jwk };
}
function normalizeJwk(jwk) {
  const normalized = snapshotJwk(jwk);
  if (normalized.ext !== void 0 && typeof normalized.ext != "boolean")
    throw new TypeError('"ext" (Extractable) Parameter must be a boolean');
  if (normalized.key_ops !== void 0) {
    const value = normalized.key_ops, keyOps = Array.isArray(value) ? [...value] : void 0;
    if (!keyOps || keyOps.some((operation) => typeof operation != "string") || new Set(keyOps).size !== keyOps.length)
      throw new TypeError('"key_ops" (Key Operations) Parameter must be an array of unique strings');
    normalized.key_ops = keyOps;
  }
  return normalized;
}
function validateExtractableOption(extractable) {
  if (extractable !== void 0 && typeof extractable != "boolean")
    throw new TypeError('"extractable" option must be a boolean');
  return extractable;
}
async function jwkToKey(entry, jwk, extractable) {
  if (!entry.kty.includes(jwk.kty))
    throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
  const algorithm = entry.resolve?.({ kty: jwk.kty, crv: jwk.crv }) ?? entry.subtle, isPrivate = !!(jwk.d || jwk.priv), keyData = { ...jwk, ext: extractable ?? jwk.ext };
  return keyData.kty !== "AKP" && delete keyData.alg, delete keyData.use, crypto.subtle.importKey("jwk", keyData, algorithm, keyData.ext ?? !isPrivate, jwk.key_ops ?? entry.usages[isPrivate ? 1 : 0]);
}
async function rawKey(key, expected, usage, extractable = false) {
  return key instanceof Uint8Array && (key = await crypto.subtle.importKey("raw", key, expected, extractable, [usage])), checkCryptoKey(key, expected, usage), key;
}
var tag, jwkMatchesOp, cache, nist, isCryptoKey, isKeyObject, isKeyLike, invalidKeyInput, unusable;
var init_key = __esm({
  "node_modules/jose/dist/webapi/lib/key.js"() {
    init_validate();
    init_base64url();
    init_errors();
    tag = (key) => key[Symbol.toStringTag];
    jwkMatchesOp = (entry, key, usage) => {
      const { alg } = entry;
      if (key.use !== void 0) {
        const expected = usage === "sign" || usage === "verify" ? "sig" : "enc";
        if (key.use !== expected)
          throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
      }
      if (key.alg !== void 0 && key.alg !== alg)
        throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
      if (Array.isArray(key.key_ops)) {
        const expectedKeyOp = usage === "encrypt" || usage === "decrypt" ? entry.ops?.[usage === "encrypt" ? 0 : 1] : usage;
        if (expectedKeyOp && !key.key_ops.includes(expectedKeyOp))
          throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
      }
    };
    nist = {
      __proto__: null,
      prime256v1: "P-256",
      secp384r1: "P-384",
      secp521r1: "P-521"
    };
    isCryptoKey = (key) => {
      if (key?.[Symbol.toStringTag] === "CryptoKey")
        return true;
      try {
        return key instanceof CryptoKey;
      } catch {
        return false;
      }
    };
    isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
    isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);
    invalidKeyInput = (actual, ...types) => message("Key must be ", actual, ...types);
    unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
  }
});

// node_modules/jose/dist/webapi/lib/content_encryption.js
function checkCekLength(cek, expected) {
  const actual = cek.byteLength << 3;
  if (actual !== expected)
    throw new JWEInvalid(`Invalid Content Encryption Key length. Expected ${expected} bits, got ${actual} bits`);
}
function checkIvLength(enc, iv) {
  if (iv.length << 3 !== enc.ivBits)
    throw new JWEInvalid("Invalid Initialization Vector length");
}
async function cbcKeySetup(enc, cek, usage) {
  if (!(cek instanceof Uint8Array))
    throw new TypeError(invalidKeyInput(cek, "Uint8Array"));
  const keySize = enc.cekBits >> 1, encKey = await crypto.subtle.importKey("raw", cek.subarray(keySize >> 3), "AES-CBC", false, [usage]), macKey = await crypto.subtle.importKey("raw", cek.subarray(0, keySize >> 3), {
    hash: `SHA-${keySize << 1}`,
    name: "HMAC"
  }, false, ["sign"]);
  return [encKey, macKey, keySize];
}
async function cbcHmacTag(macKey, macData, keySize) {
  return new Uint8Array((await crypto.subtle.sign("HMAC", macKey, macData)).slice(0, keySize >> 3));
}
async function cbcEncrypt(enc, plaintext, cek, iv, aad) {
  const [encKey, macKey, keySize] = await cbcKeySetup(enc, cek, "encrypt"), ciphertext = new Uint8Array(await crypto.subtle.encrypt({
    iv,
    name: "AES-CBC"
  }, encKey, plaintext)), macData = concat(aad, iv, ciphertext, uint64be(aad.length * 8)), tag2 = await cbcHmacTag(macKey, macData, keySize);
  return { ciphertext, tag: tag2, iv };
}
async function timingSafeEqual(a, b) {
  const algorithm = { name: "HMAC", hash: "SHA-256" }, key = await crypto.subtle.generateKey(algorithm, false, ["sign", "verify"]), aHmac = await crypto.subtle.sign(algorithm, key, a);
  return crypto.subtle.verify(algorithm, key, aHmac, b);
}
async function cbcDecrypt(enc, cek, ciphertext, iv, tag2, aad) {
  const [encKey, macKey, keySize] = await cbcKeySetup(enc, cek, "decrypt"), macData = concat(aad, iv, ciphertext, uint64be(aad.length * 8)), expectedTag = await cbcHmacTag(macKey, macData, keySize);
  try {
    if (await timingSafeEqual(tag2, expectedTag))
      return new Uint8Array(await crypto.subtle.decrypt({ iv, name: "AES-CBC" }, encKey, ciphertext));
  } catch {
  }
  throw new JWEDecryptionFailed();
}
async function encrypt(enc, plaintext, cek, iv, aad) {
  if (!isCryptoKey(cek) && !(cek instanceof Uint8Array))
    throw new TypeError(invalidKeyInput(cek, "CryptoKey", "KeyObject", "Uint8Array", "JSON Web Key"));
  if (iv ? checkIvLength(enc, iv) : iv = generateIv(enc), cek instanceof Uint8Array && checkCekLength(cek, enc.cekBits), enc.cbc)
    return cbcEncrypt(enc, plaintext, cek, iv, aad);
  const encKey = await rawKey(cek, enc.subtle, "encrypt"), encrypted = new Uint8Array(await crypto.subtle.encrypt({
    additionalData: aad,
    iv,
    name: "AES-GCM",
    tagLength: 128
  }, encKey, plaintext));
  return { ciphertext: encrypted.subarray(0, -16), tag: encrypted.subarray(-16), iv };
}
async function decrypt(enc, cek, ciphertext, iv, tag2, aad) {
  if (!isCryptoKey(cek) && !(cek instanceof Uint8Array))
    throw new TypeError(invalidKeyInput(cek, "CryptoKey", "KeyObject", "Uint8Array", "JSON Web Key"));
  if (!iv)
    throw new JWEInvalid("JWE Initialization Vector missing");
  if (!tag2)
    throw new JWEInvalid("JWE Authentication Tag missing");
  if (!enc.cbc && tag2.length !== 16)
    throw new JWEInvalid("Invalid Authentication Tag length");
  if (checkIvLength(enc, iv), cek instanceof Uint8Array && checkCekLength(cek, enc.cekBits), enc.cbc)
    return cbcDecrypt(enc, cek, ciphertext, iv, tag2, aad);
  const encKey = await rawKey(cek, enc.subtle, "decrypt");
  try {
    return new Uint8Array(await crypto.subtle.decrypt({
      additionalData: aad,
      iv,
      name: "AES-GCM",
      tagLength: 128
    }, encKey, concat(ciphertext, tag2)));
  } catch {
    throw new JWEDecryptionFailed();
  }
}
var generateCek, generateIv;
var init_content_encryption = __esm({
  "node_modules/jose/dist/webapi/lib/content_encryption.js"() {
    init_buffer_utils();
    init_key();
    init_errors();
    generateCek = (enc) => crypto.getRandomValues(new Uint8Array(enc.cekBits >> 3));
    generateIv = (enc) => crypto.getRandomValues(new Uint8Array(enc.ivBits >> 3));
  }
});

// node_modules/jose/dist/webapi/lib/key_descriptor.js
function table(entries) {
  const out = { __proto__: null };
  for (const alg in entries)
    out[alg] = { ...entries[alg], alg };
  return out;
}
var init_key_descriptor = __esm({
  "node_modules/jose/dist/webapi/lib/key_descriptor.js"() {
  }
});

// node_modules/jose/dist/webapi/lib/jwe_algorithms.js
function rsaes(bits) {
  return {
    kty: ["RSA"],
    mode: "key-encryption",
    subtle: { name: "RSA-OAEP", hash: `SHA-${bits}` },
    usages: wrap,
    ops: ["wrapKey", "unwrapKey"]
  };
}
function ecdh(mode) {
  return {
    kty: ["EC", "OKP"],
    mode,
    subtle: { name: "ECDH" },
    resolve: ({ kty, crv, asymmetricKeyType }) => {
      if (crv === "X25519" || asymmetricKeyType === "x25519")
        return { name: "X25519" };
      if (kty === "OKP")
        throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      return { name: "ECDH", namedCurve: crv };
    },
    usages: derive,
    ops: [void 0, "deriveBits"]
  };
}
function aeskw(bits, gcm = false) {
  return {
    kty: ["oct"],
    mode: "key-wrapping",
    secret: true,
    subtle: { name: gcm ? "AES-GCM" : "AES-KW", length: bits },
    usages: none,
    ops: gcm ? ["encrypt", "decrypt"] : ["wrapKey", "unwrapKey"]
  };
}
function pbes2() {
  return {
    kty: ["oct"],
    mode: "key-wrapping",
    secret: true,
    subtle: { name: "PBKDF2" },
    usages: none,
    ops: ["deriveBits", "deriveBits"]
  };
}
function contentEncryption(bits, cbc = false) {
  return {
    kty: ["oct"],
    secret: true,
    subtle: { name: cbc ? "AES-CBC" : "AES-GCM", length: bits },
    usages: none,
    ops: contentOps,
    cekBits: bits,
    ivBits: cbc ? 128 : 96,
    cbc
  };
}
function unsupported(parameter, name) {
  throw new JOSENotSupported(`Invalid or unsupported "${parameter}" (JWE ${name}) header value`);
}
function jweAlgorithm(alg) {
  return (typeof alg == "string" ? JWE[alg] : void 0) ?? unsupported("alg", "Algorithm");
}
function isJWECEKTransport(algorithm) {
  return algorithm.mode === "key-wrapping" || algorithm.mode === "key-encryption" || algorithm.mode === "key-agreement-with-key-wrapping";
}
function jweEncryption(enc) {
  return (typeof enc == "string" ? ENC[enc] : void 0) ?? unsupported("enc", "Encryption Algorithm");
}
var wrap, derive, none, JWE, contentOps, ENC;
var init_jwe_algorithms = __esm({
  "node_modules/jose/dist/webapi/lib/jwe_algorithms.js"() {
    init_errors();
    init_key_descriptor();
    wrap = [
      ["encrypt", "wrapKey"],
      ["decrypt", "unwrapKey"]
    ];
    derive = [[], ["deriveBits"]];
    none = [[], []];
    JWE = table({
      dir: {
        kty: ["oct"],
        mode: "direct-encryption",
        secret: true,
        subtle: { name: "AES-GCM" },
        usages: none,
        ops: ["encrypt", "decrypt"]
      },
      "RSA-OAEP": rsaes(1),
      "RSA-OAEP-256": rsaes(256),
      "RSA-OAEP-384": rsaes(384),
      "RSA-OAEP-512": rsaes(512),
      "ECDH-ES": ecdh("direct-key-agreement"),
      "ECDH-ES+A128KW": ecdh("key-agreement-with-key-wrapping"),
      "ECDH-ES+A192KW": ecdh("key-agreement-with-key-wrapping"),
      "ECDH-ES+A256KW": ecdh("key-agreement-with-key-wrapping"),
      A128KW: aeskw(128),
      A192KW: aeskw(192),
      A256KW: aeskw(256),
      A128GCMKW: aeskw(128, true),
      A192GCMKW: aeskw(192, true),
      A256GCMKW: aeskw(256, true),
      "PBES2-HS256+A128KW": pbes2(),
      "PBES2-HS384+A192KW": pbes2(),
      "PBES2-HS512+A256KW": pbes2()
    });
    contentOps = ["encrypt", "decrypt"];
    ENC = table({
      A128GCM: contentEncryption(128),
      A192GCM: contentEncryption(192),
      A256GCM: contentEncryption(256),
      "A128CBC-HS256": contentEncryption(256, true),
      "A192CBC-HS384": contentEncryption(384, true),
      "A256CBC-HS512": contentEncryption(512, true)
    });
  }
});

// node_modules/jose/dist/webapi/lib/key_management.js
function checkEcdhCryptoKey(key, usage) {
  if (key.algorithm.name !== "ECDH" && key.algorithm.name !== "X25519")
    throw new TypeError("CryptoKey does not support this operation, its algorithm.name must be ECDH or X25519");
  checkUsage(key, usage);
}
async function aeskwWrap(alg, key, cek) {
  const cryptoKey = await rawKey(key, jweAlgorithm(alg).subtle, "wrapKey", true), cryptoKeyCek = await crypto.subtle.importKey("raw", cek, { hash: "SHA-256", name: "HMAC" }, true, ["sign"]);
  return new Uint8Array(await crypto.subtle.wrapKey("raw", cryptoKeyCek, cryptoKey, "AES-KW"));
}
async function aeskwUnwrap(alg, key, encryptedKey) {
  const cryptoKey = await rawKey(key, jweAlgorithm(alg).subtle, "unwrapKey", true), cryptoKeyCek = await crypto.subtle.unwrapKey("raw", encryptedKey, cryptoKey, "AES-KW", { hash: "SHA-256", name: "HMAC" }, true, ["sign"]);
  return new Uint8Array(await crypto.subtle.exportKey("raw", cryptoKeyCek));
}
function checkRsaKey(alg, key, usage) {
  checkCryptoKey(key, jweAlgorithm(alg).subtle, usage), checkModulusLength(alg, key);
}
async function deriveKey(p2s, alg, p2c, key) {
  if (!(p2s instanceof Uint8Array) || p2s.length < 8)
    throw new JWEInvalid("PBES2 Salt Input must be 8 or more octets");
  if (!Number.isSafeInteger(p2c) || Math.sign(p2c) !== 1)
    throw new JWEInvalid("PBES2 Count Input must be a positive integer");
  const salt = concat(encode(alg), Uint8Array.of(0), p2s), keylen = parseInt(alg.slice(13, 16), 10), subtleAlg = {
    hash: `SHA-${alg.slice(8, 11)}`,
    iterations: p2c,
    name: "PBKDF2",
    salt
  }, cryptoKey = await rawKey(key, jweAlgorithm(alg).subtle, "deriveBits");
  return new Uint8Array(await crypto.subtle.deriveBits(subtleAlg, cryptoKey, keylen));
}
function lengthAndInput(input) {
  return concat(uint32be(input.length), input);
}
async function concatKdf(Z, L, OtherInfo) {
  const dkLen = L >> 3, hashLen = 32, reps = Math.ceil(dkLen / hashLen), dk = new Uint8Array(reps * hashLen);
  for (let i = 1; i <= reps; i++) {
    const hashResult = await digest("sha256", concat(uint32be(i), Z, OtherInfo));
    dk.set(hashResult, (i - 1) * hashLen);
  }
  return dk.slice(0, dkLen);
}
async function ecdhesDeriveKey(publicKey, privateKey, algorithm, keyLength, apu = new Uint8Array(), apv = new Uint8Array()) {
  checkEcdhCryptoKey(publicKey), checkEcdhCryptoKey(privateKey, "deriveBits");
  const otherInfo = concat(lengthAndInput(encode(algorithm)), lengthAndInput(apu), lengthAndInput(apv), uint32be(keyLength)), Z = new Uint8Array(await crypto.subtle.deriveBits({
    name: publicKey.algorithm.name,
    public: publicKey
  }, privateKey, publicKey.algorithm.name === "X25519" ? 256 : Math.ceil(parseInt(publicKey.algorithm.namedCurve.slice(-3), 10) / 8) << 3));
  return concatKdf(Z, keyLength, otherInfo);
}
function assertEcdhKey(key) {
  assertCryptoKey(key);
  const curve = key.algorithm.namedCurve;
  if (curve !== "P-256" && curve !== "P-384" && curve !== "P-521" && key.algorithm.name !== "X25519")
    throw new JOSENotSupported("ECDH with the provided key is not allowed or not supported by your javascript runtime");
}
function partyInfo(joseHeader, name) {
  const value = joseHeader[name];
  if (value !== void 0) {
    if (typeof value != "string")
      throw new JWEInvalid(`JOSE Header "${name}" (Agreement Party${name === "apu" ? "U" : "V"}Info) invalid`);
    return decodeBase64url(value, name, JWEInvalid);
  }
}
function checkPartyInfo(apu, apv) {
  if (!(apu === void 0 || apv === void 0 || apu.byteLength !== apv.byteLength)) {
    for (let i = 0; i < apu.byteLength; i++)
      if (apu[i] !== apv[i])
        return;
    throw new JWEInvalid('JOSE Header "apu" and "apv" values must be distinct');
  }
}
function assertEncryptedKey(encryptedKey) {
  if (encryptedKey === void 0)
    throw new JWEInvalid("JWE Encrypted Key missing");
}
function assertNoEncryptedKey(encryptedKey) {
  if (encryptedKey !== void 0)
    throw new JWEInvalid("Encountered unexpected JWE Encrypted Key");
}
function validateMaxPBES2Count(value) {
  if (value !== void 0 && value !== 1 / 0 && (!Number.isSafeInteger(value) || value < 1))
    throw new TypeError("maxPBES2Count must be a positive safe integer or Infinity");
}
async function decryptKeyManagement(entry, enc, key, encryptedKey, joseHeader, maxPBES2Count) {
  const { alg } = entry, mode = entry.mode;
  if (mode === "direct-encryption")
    return assertNoEncryptedKey(encryptedKey), key;
  const direct = mode === "direct-key-agreement";
  switch (direct ? assertNoEncryptedKey(encryptedKey) : assertEncryptedKey(encryptedKey), entry.subtle.name) {
    case "ECDH": {
      const { epk } = joseHeader;
      if (!isObject(epk) || ["d", "k", "p", "q", "dp", "dq", "qi", "oth", "priv"].some((parameter) => Object.hasOwn(epk, parameter)))
        throw new JWEInvalid('JOSE Header "epk" (Ephemeral Public Key) missing or invalid');
      assertEcdhKey(key);
      const ephemeralPublicKey = await jwkToKey(entry, epk), partyUInfo = partyInfo(joseHeader, "apu"), partyVInfo = partyInfo(joseHeader, "apv");
      checkPartyInfo(partyUInfo, partyVInfo);
      const sharedSecret = await ecdhesDeriveKey(ephemeralPublicKey, key, direct ? enc.alg : alg, direct ? enc.cekBits : parseInt(alg.slice(-5, -2), 10), partyUInfo, partyVInfo);
      if (direct)
        return sharedSecret;
      key = sharedSecret;
      break;
    }
    case "RSA-OAEP":
      return assertCryptoKey(key), checkRsaKey(alg, key, "decrypt"), new Uint8Array(await crypto.subtle.decrypt("RSA-OAEP", key, encryptedKey));
    case "PBKDF2": {
      if (typeof joseHeader.p2c != "number")
        throw new JWEInvalid('JOSE Header "p2c" (PBES2 Count) missing or invalid');
      validateMaxPBES2Count(maxPBES2Count);
      const p2cLimit = maxPBES2Count ?? 1e4;
      if (joseHeader.p2c > p2cLimit)
        throw new JWEInvalid('JOSE Header "p2c" (PBES2 Count) out is of acceptable bounds');
      if (typeof joseHeader.p2s != "string")
        throw new JWEInvalid('JOSE Header "p2s" (PBES2 Salt) missing or invalid');
      const p2s = decodeBase64url(joseHeader.p2s, "p2s", JWEInvalid);
      key = await deriveKey(p2s, alg, joseHeader.p2c, key);
      break;
    }
    case "AES-GCM": {
      if (typeof joseHeader.iv != "string")
        throw new JWEInvalid('JOSE Header "iv" (Initialization Vector) missing or invalid');
      if (typeof joseHeader.tag != "string")
        throw new JWEInvalid('JOSE Header "tag" (Authentication Tag) missing or invalid');
      const iv = decodeBase64url(joseHeader.iv, "iv", JWEInvalid), tag2 = decodeBase64url(joseHeader.tag, "tag", JWEInvalid);
      if (iv.byteLength !== 12)
        throw new JWEInvalid("Invalid Initialization Vector length");
      if (tag2.byteLength !== 16)
        throw new JWEInvalid("Invalid Authentication Tag length");
      return decrypt(jweEncryption(alg.slice(0, -2)), key, encryptedKey, iv, tag2, new Uint8Array());
    }
  }
  return aeskwUnwrap(alg.slice(-6), key, encryptedKey);
}
async function encryptKeyManagement(entry, enc, inputKey, joseHeader, providedCek, providedParameters = {}) {
  const { alg, mode } = entry, transport = isJWECEKTransport(entry);
  if (providedCek !== void 0 && !transport)
    throw new TypeError(`setContentEncryptionKey cannot be called with JWE "alg" (Algorithm) Header ${alg}`);
  let key = await prepareKey(mode === "direct-encryption" ? enc : entry, inputKey, "encrypt");
  if (mode === "direct-encryption")
    return [key, void 0, void 0];
  const cek = transport ? providedCek ?? generateCek(enc) : void 0;
  cek && checkCekLength(cek, enc.cekBits);
  let encryptedKey, parameters;
  switch (entry.subtle.name) {
    case "ECDH": {
      assertEcdhKey(key);
      const { apu: providedApu, apv: providedApv } = providedParameters;
      providedApu !== void 0 && assertUint8Array(providedApu, '"apu"'), providedApv !== void 0 && assertUint8Array(providedApv, '"apv"');
      const apu = providedApu ?? partyInfo(joseHeader, "apu"), apv = providedApv ?? partyInfo(joseHeader, "apv");
      checkPartyInfo(apu, apv);
      let ephemeralKey;
      providedParameters.epk !== void 0 ? ephemeralKey = await prepareKey(entry, providedParameters.epk, "decrypt") : ephemeralKey = (await crypto.subtle.generateKey(key.algorithm, true, ["deriveBits"])).privateKey;
      const subtle = crypto.subtle;
      let exportableEpk = ephemeralKey;
      if (!exportableEpk.extractable) {
        if (typeof subtle.getPublicKey != "function")
          throw new TypeError('CryptoKey for "epk" must be extractable');
        exportableEpk = await subtle.getPublicKey(ephemeralKey, []);
      }
      const { x, y, crv, kty } = await subtle.exportKey("jwk", exportableEpk), direct = mode === "direct-key-agreement", sharedSecret = await ecdhesDeriveKey(key, ephemeralKey, direct ? enc.alg : alg, direct ? enc.cekBits : parseInt(alg.slice(-5, -2), 10), apu, apv), epk = { x, crv, kty };
      if (kty === "EC" && (epk.y = y), parameters = { epk }, providedApu !== void 0 && (parameters.apu = encode2(providedApu)), providedApv !== void 0 && (parameters.apv = encode2(providedApv)), direct)
        return [sharedSecret, void 0, parameters];
      key = sharedSecret;
      break;
    }
    case "RSA-OAEP": {
      assertCryptoKey(key), checkRsaKey(alg, key, "encrypt"), encryptedKey = new Uint8Array(await crypto.subtle.encrypt("RSA-OAEP", key, cek));
      break;
    }
    case "PBKDF2": {
      const { p2c = 2048, p2s = crypto.getRandomValues(new Uint8Array(16)) } = providedParameters;
      key = await deriveKey(p2s, alg, p2c, key), parameters = { p2c, p2s: encode2(p2s) };
      break;
    }
    case "AES-GCM": {
      const iv = providedParameters.iv === void 0 ? crypto.getRandomValues(new Uint8Array(12)) : providedParameters.iv;
      if (!(iv instanceof Uint8Array))
        throw new TypeError('"iv" must be an instance of Uint8Array');
      const wrapped = await encrypt(jweEncryption(alg.slice(0, -2)), cek, key, iv, new Uint8Array());
      encryptedKey = wrapped.ciphertext, parameters = { iv: encode2(wrapped.iv), tag: encode2(wrapped.tag) };
    }
  }
  if (encryptedKey ??= await aeskwWrap(alg.slice(-6), key, cek), !(encryptedKey instanceof Uint8Array) || !encryptedKey.byteLength)
    throw new TypeError("JWE key management algorithm did not produce an Encrypted Key");
  return [cek, encryptedKey, parameters];
}
var init_key_management = __esm({
  "node_modules/jose/dist/webapi/lib/key_management.js"() {
    init_base64url();
    init_key();
    init_jwe_algorithms();
    init_errors();
    init_validate();
    init_buffer_utils();
    init_content_encryption();
  }
});

// node_modules/jose/dist/webapi/lib/deflate.js
function validateZip(joseHeader, protectedHeader) {
  if (joseHeader.zip !== void 0 && joseHeader.zip !== "DEF")
    throw new JOSENotSupported('Unsupported JWE "zip" (Compression Algorithm) Header Parameter value.');
  if (joseHeader.zip !== void 0 && !protectedHeader?.zip)
    throw new JWEInvalid('JWE "zip" (Compression Algorithm) Header Parameter MUST be in a protected header.');
}
function supported(name) {
  if (typeof globalThis[name] > "u")
    throw new JOSENotSupported(`JWE "zip" (Compression Algorithm) Header Parameter requires the ${name} API.`);
}
async function transform(stream, input, maxLength = 1 / 0) {
  const writer = stream.writable.getWriter();
  writer.write(input).catch(() => {
  }), writer.close().catch(() => {
  });
  const chunks = [];
  let length = 0;
  const reader = stream.readable.getReader();
  for (; ; ) {
    const { value, done } = await reader.read();
    if (done)
      break;
    if (chunks.push(value), length += value.byteLength, maxLength !== 1 / 0 && length > maxLength)
      throw new JWEInvalid("Decompressed plaintext exceeded the configured limit");
  }
  return concat(...chunks);
}
async function compress(input) {
  return supported("CompressionStream"), transform(new CompressionStream("deflate-raw"), input);
}
async function decompress(input, maxLength) {
  return supported("DecompressionStream"), transform(new DecompressionStream("deflate-raw"), input, maxLength);
}
var init_deflate = __esm({
  "node_modules/jose/dist/webapi/lib/deflate.js"() {
    init_errors();
    init_buffer_utils();
  }
});

// node_modules/jose/dist/webapi/lib/jwe_decrypt.js
function snapshotSharedJWE(jwe) {
  const { aad, ciphertext, iv, protected: encodedProtected, tag: tag2, unprotected } = jwe;
  if (iv !== void 0 && (typeof iv != "string" || !iv))
    throw new JWEInvalid("JWE Initialization Vector incorrect type");
  if (typeof ciphertext != "string")
    throw new JWEInvalid("JWE Ciphertext missing or incorrect type");
  if (tag2 !== void 0 && (typeof tag2 != "string" || !tag2))
    throw new JWEInvalid("JWE Authentication Tag incorrect type");
  if (encodedProtected !== void 0 && typeof encodedProtected != "string")
    throw new JWEInvalid("JWE Protected Header incorrect type");
  if (aad !== void 0 && (typeof aad != "string" || !aad))
    throw new JWEInvalid("JWE AAD incorrect type");
  if (unprotected !== void 0 && !isObject(unprotected))
    throw new JWEInvalid("JWE Shared Unprotected Header incorrect type");
  return {
    aad,
    ciphertext,
    iv,
    protected: encodedProtected,
    tag: tag2,
    unprotected: unprotected === void 0 ? void 0 : { ...unprotected }
  };
}
function snapshotRecipientJWE(recipient) {
  let header, headerAlg;
  try {
    const { header: inputHeader } = recipient;
    if (isObject(inputHeader)) {
      headerAlg = inputHeader.alg;
      const parameters = Object.keys(inputHeader);
      parameters.includes("alg") || (headerAlg = void 0), header = Object.fromEntries(parameters.map((parameter) => [
        parameter,
        parameter === "alg" ? headerAlg : inputHeader[parameter]
      ]));
    } else
      header = inputHeader;
    const { encrypted_key: encryptedKey } = recipient;
    return [{ encrypted_key: encryptedKey, header }, headerAlg];
  } catch (error) {
    return [void 0, headerAlg, error];
  }
}
function checkRecipient(jwe) {
  const { encrypted_key: encryptedKey, header } = jwe;
  if (encryptedKey !== void 0 && typeof encryptedKey != "string")
    throw new JWEInvalid("JWE Encrypted Key incorrect type");
  if (header !== void 0 && !isObject(header))
    throw new JWEInvalid("JWE Per-Recipient Unprotected Header incorrect type");
  if (jwe.protected === void 0 && header === void 0 && jwe.unprotected === void 0)
    throw new JWEInvalid("JOSE Header missing");
}
function shareJWE(jwe) {
  const { protected: encodedProtected, ciphertext, iv, tag: tag2, aad } = jwe;
  let parsedProt;
  return encodedProtected !== void 0 && (parsedProt = parseJoseHeader(encodedProtected, JWEInvalid, "JWE Protected Header is invalid")), [
    parsedProt,
    decodeBase64url(ciphertext, "ciphertext", JWEInvalid),
    iv !== void 0 ? decodeBase64url(iv, "iv", JWEInvalid) : void 0,
    tag2 !== void 0 ? decodeBase64url(tag2, "tag", JWEInvalid) : void 0,
    encodeBase64url((encodedProtected ?? "") + (aad !== void 0 ? `.${aad}` : ""), "aad", JWEInvalid)
  ];
}
function prepareDecrypt(options) {
  return [
    options && validateAlgorithms("keyManagementAlgorithms", options.keyManagementAlgorithms),
    options && validateAlgorithms("contentEncryptionAlgorithms", options.contentEncryptionAlgorithms),
    options?.crit,
    options?.maxPBES2Count,
    options?.maxDecompressedLength
  ];
}
async function decryptJWE(jwe, shared, key, token = shareJWE(jwe)) {
  const [parsedProt, ciphertext, iv, tag2, additionalData] = token, { header, unprotected, aad } = jwe;
  let joseHeader;
  if (header !== void 0 || unprotected !== void 0) {
    if (!isDisjoint(parsedProt, header, unprotected))
      throw new JWEInvalid("JWE Protected, JWE Unprotected Header, and JWE Per-Recipient Unprotected Header Parameter names must be disjoint");
    joseHeader = { ...parsedProt, ...header, ...unprotected };
  } else
    joseHeader = parsedProt ?? {};
  const [keyManagementAlgorithms, contentEncryptionAlgorithms, crit, maxPBES2Count, maxDecompressedLength] = shared, { encrypted_key: encodedKey } = jwe;
  validateCrit(JWEInvalid, JWE_RECOGNIZED, crit, parsedProt, joseHeader), validateZip(joseHeader, parsedProt);
  const { alg, enc } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWEInvalid("missing JWE Algorithm (alg) in JWE Header");
  const selected = JWE[alg];
  if (encodedKey === "" && (!selected || !isJWECEKTransport(selected)))
    throw new JWEInvalid("JWE Encrypted Key incorrect type");
  const integrated = selected?.mode === "integrated-encryption";
  if (!integrated && (typeof enc != "string" || !enc))
    throw new JWEInvalid("missing JWE Encryption Algorithm (enc) in JWE Header");
  if (keyManagementAlgorithms && !keyManagementAlgorithms.has(alg) || !keyManagementAlgorithms && alg.startsWith("PBES2"))
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  let encEntry;
  if (integrated) {
    if (enc !== void 0)
      throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter must not be present for integrated encryption');
    if (iv?.byteLength)
      throw new JWEInvalid("JWE Initialization Vector must be empty for integrated encryption");
    if (tag2?.byteLength)
      throw new JWEInvalid("JWE Authentication Tag must be empty for integrated encryption");
  } else {
    if (contentEncryptionAlgorithms && !contentEncryptionAlgorithms.has(enc))
      throw new JOSEAlgNotAllowed('"enc" (Encryption Algorithm) Header Parameter value not allowed');
    encEntry = jweEncryption(enc);
  }
  let encryptedKey;
  if (encodedKey !== void 0)
    try {
      encryptedKey = decodeBase64url(encodedKey, "encrypted_key", JWEInvalid);
    } catch (error) {
      if (!selected || !isJWECEKTransport(selected))
        throw error;
      encryptedKey = new Uint8Array();
    }
  let resolvedKey = false;
  typeof key == "function" && (key = await key(parsedProt, jwe), resolvedKey = true);
  const algEntry = selected ?? jweAlgorithm(alg);
  isJWECEKTransport(algEntry) && encryptedKey === void 0 && (encryptedKey = new Uint8Array());
  const k = await prepareKey(algEntry.mode === "direct-encryption" ? encEntry : algEntry, key, "decrypt");
  let plaintext;
  if (algEntry.mode === "integrated-encryption")
    plaintext = await algEntry.decrypt(k, encryptedKey, ciphertext, additionalData, parsedProt, joseHeader);
  else {
    const encryption = encEntry;
    let cek;
    try {
      cek = await decryptKeyManagement(algEntry, encryption, k, encryptedKey, joseHeader, maxPBES2Count), isJWECEKTransport(algEntry) && cek instanceof Uint8Array && cek.byteLength << 3 !== encryption.cekBits && (cek = generateCek(encryption));
    } catch (err) {
      if (err instanceof TypeError || err instanceof JWEInvalid || err instanceof JOSENotSupported)
        throw err;
      cek = generateCek(encryption);
    }
    plaintext = await decrypt(encryption, cek, ciphertext, iv, tag2, additionalData);
  }
  if (joseHeader.zip === "DEF") {
    const decompressionLimit = maxDecompressedLength ?? 25e4;
    if (decompressionLimit === 0)
      throw new JOSENotSupported('JWE "zip" (Compression Algorithm) Header Parameter is not supported.');
    if (decompressionLimit !== 1 / 0 && (!Number.isSafeInteger(decompressionLimit) || decompressionLimit < 1))
      throw new TypeError("maxDecompressedLength must be 0, a positive safe integer, or Infinity");
    plaintext = await decompress(plaintext, decompressionLimit).catch((cause) => {
      throw cause instanceof JWEInvalid ? cause : new JWEInvalid("Failed to decompress plaintext", { cause });
    });
  }
  return {
    plaintext,
    ...parsedProt && { protectedHeader: parsedProt },
    ...aad !== void 0 && {
      additionalAuthenticatedData: decodeBase64url(aad, "aad", JWEInvalid)
    },
    ...unprotected && { sharedUnprotectedHeader: unprotected },
    ...header && { unprotectedHeader: header },
    ...resolvedKey && { key: k }
  };
}
async function decryptCompact(jwe, shared, key) {
  if (jwe instanceof Uint8Array && (jwe = decoder.decode(jwe)), typeof jwe != "string")
    throw new JWEInvalid("Compact JWE must be a string or Uint8Array");
  const { 0: protectedHeader, 1: encryptedKey, 2: iv, 3: ciphertext, 4: tag2, length } = jwe.split(".");
  if (length !== 5)
    throw new JWEInvalid("Invalid Compact JWE");
  return decryptJWE({
    ciphertext,
    iv: iv || void 0,
    protected: protectedHeader,
    tag: tag2 || void 0,
    encrypted_key: encryptedKey || void 0
  }, shared, key);
}
var init_jwe_decrypt = __esm({
  "node_modules/jose/dist/webapi/lib/jwe_decrypt.js"() {
    init_content_encryption();
    init_validate();
    init_errors();
    init_key_management();
    init_buffer_utils();
    init_key();
    init_jwe_algorithms();
    init_deflate();
  }
});

// node_modules/jose/dist/webapi/jwe/compact/decrypt.js
async function compactDecrypt(jwe, key, options) {
  return decryptCompact(jwe, prepareDecrypt(options), key);
}
var init_decrypt = __esm({
  "node_modules/jose/dist/webapi/jwe/compact/decrypt.js"() {
    init_jwe_decrypt();
  }
});

// node_modules/jose/dist/webapi/jwe/flattened/decrypt.js
async function flattenedDecrypt(jwe, key, options) {
  if (!isObject(jwe))
    throw new JWEInvalid("Flattened JWE must be an object");
  const shared = snapshotSharedJWE(jwe), [recipient, , error] = snapshotRecipientJWE(jwe);
  if (!recipient)
    throw error;
  const snapshot = { ...shared, ...recipient };
  return checkRecipient(snapshot), decryptJWE(snapshot, prepareDecrypt(options), key);
}
var init_decrypt2 = __esm({
  "node_modules/jose/dist/webapi/jwe/flattened/decrypt.js"() {
    init_errors();
    init_validate();
    init_jwe_decrypt();
  }
});

// node_modules/jose/dist/webapi/jwe/general/decrypt.js
async function generalDecrypt(jwe, key, options) {
  if (!isObject(jwe))
    throw new JWEInvalid("General JWE must be an object");
  const inputRecipients = jwe.recipients;
  if (!Array.isArray(inputRecipients))
    throw new JWEInvalid("JWE Recipients missing or incorrect type");
  const recipients = Array.from(inputRecipients);
  if (!recipients.every(isObject))
    throw new JWEInvalid("JWE Recipients missing or incorrect type");
  if (!recipients.length)
    throw new JWEInvalid("JWE Recipients has no members");
  let shared, sharedJwe, token;
  try {
    shared = prepareDecrypt(options), sharedJwe = snapshotSharedJWE(jwe), token = shareJWE(sharedJwe);
  } catch {
    throw new JWEDecryptionFailed();
  }
  const recipientSnapshots = recipients.map((recipient) => snapshotRecipientJWE(recipient));
  if (recipients.length > 1)
    for (const [, headerAlg] of recipientSnapshots) {
      const alg = token[0]?.alg ?? headerAlg ?? sharedJwe.unprotected?.alg, algEntry = typeof alg == "string" ? JWE[alg] : void 0;
      if (algEntry && !isJWECEKTransport(algEntry))
        throw new JWEInvalid(`"${alg}" alg may only have a single recipient`);
    }
  for (const [recipient] of recipientSnapshots)
    if (recipient)
      try {
        const flattened = { ...sharedJwe, ...recipient };
        return checkRecipient(flattened), await decryptJWE(flattened, shared, key, token);
      } catch {
      }
  throw new JWEDecryptionFailed();
}
var init_decrypt3 = __esm({
  "node_modules/jose/dist/webapi/jwe/general/decrypt.js"() {
    init_jwe_decrypt();
    init_errors();
    init_validate();
    init_jwe_algorithms();
  }
});

// node_modules/jose/dist/webapi/lib/jwe_encrypt.js
function checkDisjoint(protectedHeader, unprotectedHeader, sharedUnprotectedHeader) {
  if (!isDisjoint(protectedHeader, unprotectedHeader, sharedUnprotectedHeader))
    throw new JWEInvalid("JWE Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint");
}
function checkEncryptHeaders(input, options, sharedHeadersNormalized = false) {
  if (!input[1] && !input[2] && !input[3])
    throw new JWEInvalid("either setProtectedHeader, setUnprotectedHeader, or sharedUnprotectedHeader must be called before #encrypt()");
  options !== void 0 && (input[8] = options?.crit);
  let [, protectedHeader, unprotectedHeader, sharedUnprotectedHeader, aad, cek, iv, keyManagementParameters, crit] = input;
  if (aad !== void 0 && assertUint8Array(aad, "JWE Additional Authenticated Data"), cek !== void 0 && assertUint8Array(cek, "JWE Content Encryption Key"), iv !== void 0 && assertUint8Array(iv, "JWE Initialization Vector"), !sharedHeadersNormalized && protectedHeader !== void 0 && (protectedHeader = serializeJoseHeader(JWEInvalid, protectedHeader)[0], input[1] = protectedHeader), unprotectedHeader !== void 0 && (unprotectedHeader = serializeJoseHeader(JWEInvalid, unprotectedHeader)[0], input[2] = unprotectedHeader), !sharedHeadersNormalized && sharedUnprotectedHeader !== void 0 && (sharedUnprotectedHeader = serializeJoseHeader(JWEInvalid, sharedUnprotectedHeader)[0], input[3] = sharedUnprotectedHeader), keyManagementParameters !== void 0 && !isObject(keyManagementParameters))
    throw new TypeError("JWE Key Management Parameters must be an object");
  checkDisjoint(protectedHeader, unprotectedHeader, sharedUnprotectedHeader);
  const joseHeader = {
    ...protectedHeader,
    ...unprotectedHeader,
    ...sharedUnprotectedHeader
  };
  validateCritDuplicates(JWEInvalid, protectedHeader), validateCrit(JWEInvalid, JWE_RECOGNIZED, crit, protectedHeader, joseHeader), validateZip(joseHeader, protectedHeader);
  const { alg, enc } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWEInvalid('JWE "alg" (Algorithm) Header Parameter missing or invalid');
  const algEntry = JWE[alg];
  if (algEntry?.mode === "integrated-encryption") {
    if (enc !== void 0)
      throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter must not be present for integrated encryption');
    if (cek !== void 0)
      throw new TypeError(`setContentEncryptionKey cannot be called with JWE "alg" (Algorithm) Header ${alg}`);
    if (iv !== void 0)
      throw new TypeError(`setInitializationVector cannot be called with JWE "alg" (Algorithm) Header ${alg}`);
    return [joseHeader, void 0, algEntry];
  }
  if (typeof enc != "string" || !enc)
    throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter missing or invalid');
  return [joseHeader, jweEncryption(enc), algEntry];
}
async function encryptJWE(input, checked, key) {
  const [joseHeader, encEntry, selected] = checked, [inputPlaintext, inputProtectedHeader, inputUnprotectedHeader, sharedUnprotectedHeader, aad, providedCek, inputIv, keyManagementParameters, , unprotectedParameters] = input;
  let protectedHeader = inputProtectedHeader, unprotectedHeader = inputUnprotectedHeader;
  const algEntry = selected ?? jweAlgorithm(joseHeader.alg);
  let encryptedKey, parameters, cek;
  algEntry.mode === "integrated-encryption" ? cek = await prepareKey(algEntry, key, "encrypt") : [cek, encryptedKey, parameters] = await encryptKeyManagement(algEntry, encEntry, key, joseHeader, providedCek, keyManagementParameters), parameters && (unprotectedParameters ? unprotectedHeader = unprotectedHeader ? { ...unprotectedHeader, ...parameters } : parameters : protectedHeader = protectedHeader ? { ...protectedHeader, ...parameters } : parameters, checkDisjoint(protectedHeader, unprotectedHeader, sharedUnprotectedHeader));
  const protectedHeaderS = protectedHeader ? encode2(JSON.stringify(protectedHeader)) : "", aadMember = aad?.byteLength ? encode2(aad) : void 0, additionalData = encode(aadMember ? `${protectedHeaderS}.${aadMember}` : protectedHeaderS);
  let plaintext = inputPlaintext;
  joseHeader.zip === "DEF" && (plaintext = await compress(plaintext).catch((cause) => {
    throw new JWEInvalid("Failed to compress plaintext", { cause });
  }));
  let ciphertext, tag2, iv;
  algEntry.mode === "integrated-encryption" ? [encryptedKey, ciphertext] = await algEntry.encrypt(cek, plaintext, additionalData, protectedHeader, joseHeader, keyManagementParameters) : { ciphertext, tag: tag2, iv } = await encrypt(encEntry, plaintext, cek, inputIv, additionalData);
  const jwe = {
    ciphertext: encode2(ciphertext)
  };
  return iv && (jwe.iv = encode2(iv)), tag2 && (jwe.tag = encode2(tag2)), encryptedKey?.byteLength && (jwe.encrypted_key = encode2(encryptedKey)), aadMember && (jwe.aad = aadMember), protectedHeader && (jwe.protected = protectedHeaderS), sharedUnprotectedHeader && (jwe.unprotected = sharedUnprotectedHeader), unprotectedHeader && (jwe.header = unprotectedHeader), jwe;
}
async function createJWE(input, key, options) {
  return encryptJWE(input, checkEncryptHeaders(input, options), key);
}
function compactJWE(jwe) {
  return [jwe.protected, jwe.encrypted_key, jwe.iv, jwe.ciphertext, jwe.tag].join(".");
}
var init_jwe_encrypt = __esm({
  "node_modules/jose/dist/webapi/lib/jwe_encrypt.js"() {
    init_base64url();
    init_content_encryption();
    init_key_management();
    init_errors();
    init_validate();
    init_buffer_utils();
    init_key();
    init_jwe_algorithms();
    init_deflate();
  }
});

// node_modules/jose/dist/webapi/jwe/general/encrypt.js
var IndividualRecipient, GeneralEncrypt;
var init_encrypt = __esm({
  "node_modules/jose/dist/webapi/jwe/general/encrypt.js"() {
    init_validate();
    init_errors();
    init_content_encryption();
    init_base64url();
    init_jwe_encrypt();
    init_key_management();
    init_jwe_algorithms();
    IndividualRecipient = class {
      #parent;
      state;
      constructor(enc, key, crit) {
        this.#parent = enc, this.state = [void 0, void 0, key, crit];
      }
      setUnprotectedHeader(unprotectedHeader) {
        return assertNotSet(this.state[0], "setUnprotectedHeader"), this.state[0] = unprotectedHeader, this;
      }
      setKeyManagementParameters(parameters) {
        return assertNotSet(this.state[1], "setKeyManagementParameters"), this.state[1] = parameters, this;
      }
      addRecipient(...args) {
        return this.#parent.addRecipient(...args);
      }
      encrypt(...args) {
        return this.#parent.encrypt(...args);
      }
      done() {
        return this.#parent;
      }
    };
    GeneralEncrypt = class {
      #plaintext;
      #recipients = [];
      #protectedHeader;
      #unprotectedHeader;
      #aad;
      constructor(plaintext) {
        this.#plaintext = plaintext;
      }
      addRecipient(key, options) {
        const recipient = new IndividualRecipient(this, key, options?.crit);
        return this.#recipients.push(recipient), recipient;
      }
      setProtectedHeader(protectedHeader) {
        return assertNotSet(this.#protectedHeader, "setProtectedHeader"), this.#protectedHeader = protectedHeader, this;
      }
      setSharedUnprotectedHeader(sharedUnprotectedHeader) {
        return assertNotSet(this.#unprotectedHeader, "setSharedUnprotectedHeader"), this.#unprotectedHeader = sharedUnprotectedHeader, this;
      }
      setAdditionalAuthenticatedData(aad) {
        return this.#aad = aad, this;
      }
      async encrypt() {
        if (!this.#recipients.length)
          throw new JWEInvalid("at least one recipient must be added");
        assertUint8Array(this.#plaintext, "plaintext");
        const multiple = this.#recipients.length > 1;
        let enc, protectedHeader = this.#protectedHeader, sharedUnprotectedHeader = this.#unprotectedHeader;
        const recipients = [];
        for (const recipient of this.#recipients) {
          const [unprotectedHeader, keyManagementParameters, key, crit] = recipient.state, input = [
            this.#plaintext,
            protectedHeader,
            unprotectedHeader,
            sharedUnprotectedHeader,
            this.#aad,
            void 0,
            void 0,
            keyManagementParameters,
            crit,
            multiple
          ], headers = checkEncryptHeaders(input, void 0, recipients.length > 0);
          recipients.length || (protectedHeader = input[1], sharedUnprotectedHeader = input[3]), recipients.push([input, headers, key]);
          const [{ alg, enc: recipientEnc }, , algEntry] = headers;
          if (multiple && algEntry && !isJWECEKTransport(algEntry))
            throw new JWEInvalid(`"${alg}" alg may only have a single recipient`);
          if (!enc)
            enc = recipientEnc;
          else if (enc !== recipientEnc)
            throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter must be the same for all recipients');
        }
        for (const [, headers] of recipients)
          headers[2] ??= jweAlgorithm(headers[0].alg);
        const [firstInput, firstHeaders, firstKey] = recipients[0], cek = multiple ? generateCek(firstHeaders[1]) : void 0;
        firstInput[5] = cek;
        const { encrypted_key, header, ...shared } = await encryptJWE(firstInput, firstHeaders, firstKey), jwe = {
          ...shared,
          recipients: [{}]
        };
        encrypted_key && (jwe.recipients[0].encrypted_key = encrypted_key), header && (jwe.recipients[0].header = header);
        for (let i = 1; i < recipients.length; i++) {
          const [input, [joseHeader, encEntry, algEntry], key] = recipients[i], unprotectedHeader = input[2], [, encryptedKey, parameters] = await encryptKeyManagement(algEntry, encEntry, key, joseHeader, cek, input[7]), target = {
            encrypted_key: encode2(encryptedKey)
          };
          if (unprotectedHeader || parameters) {
            const header2 = { ...unprotectedHeader, ...parameters };
            parameters && checkDisjoint(input[1], header2, input[3]), target.header = header2;
          }
          jwe.recipients.push(target);
        }
        return jwe;
      }
    };
  }
});

// node_modules/jose/dist/webapi/lib/jws_algorithms.js
function hmac(bits) {
  const subtle = { name: "HMAC", hash: `SHA-${bits}` };
  return { kty: ["oct"], secret: true, subtle, signing: subtle, usages: sig };
}
function rsa(bits, saltLength) {
  const subtle = { name: saltLength ? "RSA-PSS" : "RSASSA-PKCS1-v1_5", hash: `SHA-${bits}` };
  return {
    kty: ["RSA"],
    subtle,
    signing: saltLength ? { ...subtle, saltLength } : subtle,
    usages: sig,
    minRsaBits: 2048
  };
}
function ecdsa(crv, bits) {
  return {
    kty: ["EC"],
    crv,
    subtle: { name: "ECDSA", namedCurve: crv },
    signing: { name: "ECDSA", hash: `SHA-${bits}` },
    usages: sig
  };
}
function eddsa() {
  const subtle = { name: "Ed25519" };
  return {
    kty: ["OKP"],
    crv: "Ed25519",
    subtle,
    signing: subtle,
    usages: sig
  };
}
function mldsa(bits) {
  const subtle = { name: `ML-DSA-${bits}` };
  return {
    kty: ["AKP"],
    subtle,
    signing: subtle,
    usages: sig
  };
}
function jwsAlgorithm(alg) {
  const entry = typeof alg == "string" ? JWS[alg] : void 0;
  if (!entry)
    throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  return entry;
}
var sig, JWS;
var init_jws_algorithms = __esm({
  "node_modules/jose/dist/webapi/lib/jws_algorithms.js"() {
    init_errors();
    init_key_descriptor();
    sig = [["verify"], ["sign"]];
    JWS = table({
      HS256: hmac(256),
      HS384: hmac(384),
      HS512: hmac(512),
      RS256: rsa(256),
      RS384: rsa(384),
      RS512: rsa(512),
      PS256: rsa(256, 32),
      PS384: rsa(384, 48),
      PS512: rsa(512, 64),
      ES256: ecdsa("P-256", 256),
      ES384: ecdsa("P-384", 384),
      ES512: ecdsa("P-521", 512),
      EdDSA: eddsa(),
      Ed25519: eddsa(),
      "ML-DSA-44": mldsa(44),
      "ML-DSA-65": mldsa(65),
      "ML-DSA-87": mldsa(87)
    });
  }
});

// node_modules/jose/dist/webapi/lib/jws_verify.js
function snapshotJws(jws, sharedPayload) {
  const encodedProtected = jws.protected, inputHeader = jws.header, header = isObject(inputHeader) ? { ...inputHeader } : inputHeader;
  let payload = sharedPayload ? sharedPayload[0] : jws.payload;
  !sharedPayload && payload instanceof Uint8Array && (payload = new Uint8Array(payload));
  const signature = jws.signature, snapshot = { payload, signature };
  if (encodedProtected !== void 0 && (snapshot.protected = encodedProtected), inputHeader !== void 0 && (snapshot.header = header), encodedProtected === void 0 && header === void 0)
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  if (encodedProtected !== void 0 && typeof encodedProtected != "string")
    throw new JWSInvalid("JWS Protected Header incorrect type");
  if (payload === void 0)
    throw new JWSInvalid("JWS Payload missing");
  if (typeof signature != "string")
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  if (header !== void 0 && !isObject(header))
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  return snapshot;
}
function prepareVerify(options) {
  return [options && validateAlgorithms("algorithms", options.algorithms), options?.crit];
}
function parseProtectedHeader(encodedProtected) {
  return encodedProtected === void 0 ? {} : parseJoseHeader(encodedProtected, JWSInvalid, "JWS Protected Header is invalid");
}
function encodeJsonUnencodedPayload(payload) {
  const invalid2 = /[\p{Cs}\p{Cn}]/u.exec(payload)?.[0];
  if (invalid2 !== void 0)
    throw new JWSInvalid(new RegExp("\\p{Cs}", "u").test(invalid2) ? "JWS Payload must be a well-formed Unicode string" : "JWS Payload must not contain unassigned Unicode code points");
  return encoder.encode(payload);
}
function encodeCompactUnencodedPayload(payload) {
  try {
    return encode(payload);
  } catch {
    throw new JWSInvalid("JWS Compact Serialization payload must use only ASCII characters");
  }
}
async function verifySignature(jws, shared, key, encodeUnencodedPayload, parsedProtected) {
  const { protected: encodedProtected, header, payload: inputPayload } = jws, parsedProt = parsedProtected ?? parseProtectedHeader(encodedProtected);
  if (!isDisjoint(parsedProt, header))
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  const joseHeader = { ...parsedProt, ...header }, b64 = validateB64(parsedProt, validateCrit(JWSInvalid, JWS_RECOGNIZED, shared[1], parsedProt, joseHeader)), { alg } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  if (shared[0] && !shared[0].has(alg))
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  if (b64) {
    if (typeof inputPayload != "string")
      throw new JWSInvalid("JWS Payload must be a string");
  } else if (typeof inputPayload != "string" && !(inputPayload instanceof Uint8Array))
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  const signingPayload = b64 || typeof inputPayload != "string" ? inputPayload : encodeUnencodedPayload(inputPayload);
  let resolvedKey = false;
  typeof key == "function" && (key = await key(parsedProt, jws), resolvedKey = true);
  const entry = jwsAlgorithm(alg), data = concat(encodedProtected !== void 0 ? encode(encodedProtected) : new Uint8Array(), encode("."), typeof signingPayload == "string" ? shared[2] ??= encodeBase64url(signingPayload, "payload", JWSInvalid) : signingPayload), signature = decodeBase64url(jws.signature, "signature", JWSInvalid), k = await prepareKey(entry, key, "verify"), cryptoKey = await rawKey(k, entry.subtle, "verify");
  entry.minRsaBits && checkModulusLength(entry.alg, cryptoKey);
  let verified = false;
  try {
    verified = await crypto.subtle.verify(entry.signing, cryptoKey, signature, data);
  } catch {
  }
  if (!verified)
    throw new JWSSignatureVerificationFailed();
  const result = { payload: typeof signingPayload == "string" ? decodeBase64url(signingPayload, "payload", JWSInvalid) : signingPayload };
  return encodedProtected !== void 0 && (result.protectedHeader = parsedProt), header !== void 0 && (result.unprotectedHeader = header), resolvedKey ? [{ ...result, key: k }, b64] : [result, b64];
}
async function verifyCompact(jws, shared, key) {
  if (jws instanceof Uint8Array && (jws = decoder.decode(jws)), typeof jws != "string")
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3)
    throw new JWSInvalid("Invalid Compact JWS");
  return verifySignature({ payload, protected: protectedHeader, signature }, shared, key, encodeCompactUnencodedPayload);
}
var init_jws_verify = __esm({
  "node_modules/jose/dist/webapi/lib/jws_verify.js"() {
    init_jws_algorithms();
    init_errors();
    init_buffer_utils();
    init_validate();
    init_key();
  }
});

// node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  const [result] = await verifyCompact(jws, prepareVerify(options), key);
  return result;
}
var init_verify = __esm({
  "node_modules/jose/dist/webapi/jws/compact/verify.js"() {
    init_jws_verify();
  }
});

// node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws))
    throw new JWSInvalid("Flattened JWS must be an object");
  const snapshot = snapshotJws(jws), [result] = await verifySignature(snapshot, prepareVerify(options), key, encodeJsonUnencodedPayload);
  return result;
}
var init_verify2 = __esm({
  "node_modules/jose/dist/webapi/jws/flattened/verify.js"() {
    init_errors();
    init_validate();
    init_jws_verify();
  }
});

// node_modules/jose/dist/webapi/jws/general/verify.js
function snapshotSignature(signature, payload) {
  try {
    const jws = snapshotJws(signature, [payload]), protectedHeader = parseProtectedHeader(jws.protected), { b64, crit } = protectedHeader;
    return [
      jws,
      protectedHeader,
      Array.isArray(crit) && crit.includes("b64") ? typeof b64 == "boolean" ? b64 ? 1 : 2 : 0 : 1
    ];
  } catch {
    return;
  }
}
async function generalVerify(jws, key, options) {
  if (!isObject(jws))
    throw new JWSInvalid("General JWS must be an object");
  const { signatures, payload: inputPayload } = jws;
  if (!Array.isArray(signatures))
    throw new JWSInvalid("JWS Signatures missing or incorrect type");
  const signatureEntries = Array.from(signatures);
  if (!signatureEntries.every(isObject))
    throw new JWSInvalid("JWS Signatures missing or incorrect type");
  let shared;
  try {
    if (inputPayload === void 0)
      throw new Error();
    shared = prepareVerify(options);
  } catch {
    throw new JWSSignatureVerificationFailed();
  }
  const payload = inputPayload instanceof Uint8Array ? new Uint8Array(inputPayload) : inputPayload, candidates = signatureEntries.map((signature) => snapshotSignature(signature, payload)).filter((candidate) => candidate !== void 0);
  let modes = 0;
  for (const [, , mode] of candidates)
    if (modes |= mode, modes === 3)
      throw new JWSInvalid("inconsistent use of JWS Unencoded Payload (RFC7797)");
  for (const candidate of candidates)
    try {
      const [result] = await verifySignature(candidate[0], shared, key, encodeJsonUnencodedPayload, candidate[1]);
      return result;
    } catch {
    }
  throw new JWSSignatureVerificationFailed();
}
var init_verify3 = __esm({
  "node_modules/jose/dist/webapi/jws/general/verify.js"() {
    init_jws_verify();
    init_errors();
    init_validate();
  }
});

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
function invalidDuration() {
  throw new TypeError("Invalid time period format");
}
function secs(str) {
  typeof str != "string" && invalidDuration();
  const matched = REGEX.exec(str);
  (!matched || matched[4] && matched[1]) && invalidDuration();
  const value = parseFloat(matched[2]), numericDate2 = Math.round(value * multipliers[matched[3][0].toLowerCase()]);
  return Number.isFinite(numericDate2) || invalidDuration(), matched[1] === "-" || matched[4] === "ago" ? -numericDate2 : numericDate2;
}
function validateInput(label, input) {
  if (!Number.isFinite(input))
    throw new TypeError(`Invalid ${label} input`);
  return input;
}
function validateStringClaim(claim, value) {
  if (typeof value != "string")
    throw new TypeError(`"${claim}" claim must be a string`);
}
function validateAudienceClaim(value) {
  if (typeof value != "string" && (!Array.isArray(value) || Array.from(value).some((member) => typeof member != "string")))
    throw new TypeError('"aud" claim must be a string or an array of strings');
}
function numericDate(value, label) {
  return typeof value == "number" ? validateInput(label, value) : value instanceof Date ? validateInput(label, epoch(value)) : epoch(/* @__PURE__ */ new Date()) + secs(value);
}
function validateNumericDate(payload, claim, required = false) {
  const value = payload[claim];
  if (!(value === void 0 && !required)) {
    if (typeof value != "number")
      throw new JWTClaimValidationFailed(`"${claim}" claim must be a number`, payload, claim, "invalid");
    return value;
  }
}
function unexpectedClaim(payload, claim) {
  throw new JWTClaimValidationFailed(`unexpected "${claim}" claim value`, payload, claim, checkFailed);
}
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(strictDecoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload))
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  const { typ } = options;
  if (typ !== void 0 && (typeof protectedHeader.typ != "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ)))
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", checkFailed);
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options, presenceCheck = [...requiredClaims];
  maxTokenAge !== void 0 && presenceCheck.push("iat"), audience !== void 0 && presenceCheck.push("aud"), subject !== void 0 && presenceCheck.push("sub"), issuer !== void 0 && presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse()))
    if (!Object.hasOwn(payload, claim))
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
  issuer !== void 0 && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss) && unexpectedClaim(payload, "iss"), subject !== void 0 && payload.sub !== subject && unexpectedClaim(payload, "sub"), audience !== void 0 && !checkAudiencePresence(payload.aud, typeof audience == "string" ? [audience] : audience) && unexpectedClaim(payload, "aud");
  const { clockTolerance } = options;
  let tolerance = 0;
  if (typeof clockTolerance == "string")
    tolerance = secs(clockTolerance);
  else if (clockTolerance !== void 0) {
    if (typeof clockTolerance != "number")
      throw new TypeError("Invalid clockTolerance option type");
    tolerance = clockTolerance;
  }
  validateInput("clockTolerance option", tolerance);
  const { currentDate } = options, now = validateInput("currentDate option", epoch(currentDate === void 0 ? /* @__PURE__ */ new Date() : currentDate)), iat = validateNumericDate(payload, "iat", maxTokenAge !== void 0), nbf = validateNumericDate(payload, "nbf");
  if (nbf !== void 0 && nbf > now + tolerance)
    throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", checkFailed);
  const exp = validateNumericDate(payload, "exp");
  if (exp !== void 0 && exp <= now - tolerance)
    throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", checkFailed);
  if (maxTokenAge !== void 0) {
    const age = now - iat, max = validateInput("maxTokenAge option", typeof maxTokenAge == "number" ? maxTokenAge : secs(maxTokenAge));
    if (age - tolerance > max)
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", checkFailed);
    if (age < -tolerance)
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", checkFailed);
  }
  return payload;
}
function producerPayload(producer) {
  return producerPayloads.get(producer);
}
function jwtData(producer) {
  const payload = producerPayload(producer);
  for (const claim of ["iat", "nbf", "exp"]) {
    const value = payload[claim];
    if (typeof value == "number" && !Number.isFinite(value))
      throw new TypeError(`"${claim}" claim must be a finite number`);
  }
  return encoder.encode(JSON.stringify(payload));
}
function jwtClaim(producer, claim) {
  return producerPayload(producer)[claim];
}
var epoch, multipliers, REGEX, checkFailed, normalizeTyp, checkAudiencePresence, producerPayloads, JWTClaimsBuilder;
var init_jwt_claims_set = __esm({
  "node_modules/jose/dist/webapi/lib/jwt_claims_set.js"() {
    init_errors();
    init_buffer_utils();
    init_validate();
    epoch = (date) => Math.floor(date.getTime() / 1e3);
    multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800,
      y: 31557600
    };
    REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
    checkFailed = "check_failed";
    normalizeTyp = (value) => {
      const normalized = value.toLowerCase();
      return value.includes("/") ? normalized : `application/${normalized}`;
    };
    checkAudiencePresence = (audPayload, audOption) => typeof audPayload == "string" ? audOption.includes(audPayload) : Array.isArray(audPayload) ? audOption.some((aud) => audPayload.includes(aud)) : false;
    JWTClaimsBuilder = class {
      constructor(payload = {}) {
        if (!isObject(payload))
          throw new TypeError("JWT Claims Set MUST be an object");
        (producerPayloads ||= /* @__PURE__ */ new WeakMap()).set(this, structuredClone(payload));
      }
      setIssuer(value) {
        return validateStringClaim("iss", value), producerPayload(this).iss = value, this;
      }
      setSubject(value) {
        return validateStringClaim("sub", value), producerPayload(this).sub = value, this;
      }
      setAudience(value) {
        return validateAudienceClaim(value), producerPayload(this).aud = value, this;
      }
      setJti(value) {
        return validateStringClaim("jti", value), producerPayload(this).jti = value, this;
      }
      setNotBefore(value) {
        return producerPayload(this).nbf = numericDate(value, "setNotBefore"), this;
      }
      setExpirationTime(value) {
        return producerPayload(this).exp = numericDate(value, "setExpirationTime"), this;
      }
      setIssuedAt(value) {
        const payload = producerPayload(this);
        return value === void 0 ? payload.iat = epoch(/* @__PURE__ */ new Date()) : typeof value == "string" ? payload.iat = validateInput("setIssuedAt", epoch(/* @__PURE__ */ new Date()) + secs(value)) : payload.iat = numericDate(value, "setIssuedAt"), this;
      }
    };
  }
});

// node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const [verified, b64] = await verifyCompact(jwt, prepareVerify(options), key);
  if (!b64)
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  return { ...verified, payload };
}
var init_verify4 = __esm({
  "node_modules/jose/dist/webapi/jwt/verify.js"() {
    init_jws_verify();
    init_jwt_claims_set();
    init_errors();
  }
});

// node_modules/jose/dist/webapi/jwt/decrypt.js
async function jwtDecrypt(jwt, key, options) {
  const { plaintext, ...result } = await decryptCompact(jwt, prepareDecrypt(options), key), { protectedHeader } = result, payload = validateClaimsSet(protectedHeader, plaintext, options);
  for (const claim of ["iss", "sub", "aud"])
    if (protectedHeader[claim] !== void 0 && (claim === "aud" ? JSON.stringify(protectedHeader.aud) !== JSON.stringify(payload.aud) : protectedHeader[claim] !== payload[claim]))
      throw new JWTClaimValidationFailed(`replicated "${claim}" claim header parameter mismatch`, payload, claim, "mismatch");
  return { payload, ...result };
}
var init_decrypt4 = __esm({
  "node_modules/jose/dist/webapi/jwt/decrypt.js"() {
    init_jwe_decrypt();
    init_jwt_claims_set();
    init_errors();
  }
});

// node_modules/jose/dist/webapi/jwe/compact/encrypt.js
var CompactEncrypt;
var init_encrypt2 = __esm({
  "node_modules/jose/dist/webapi/jwe/compact/encrypt.js"() {
    init_validate();
    init_jwe_encrypt();
    CompactEncrypt = class {
      #input;
      constructor(plaintext) {
        assertUint8Array(plaintext, "plaintext"), this.#input = [plaintext];
      }
      setContentEncryptionKey(cek) {
        return assertNotSet(this.#input[5], "setContentEncryptionKey"), this.#input[5] = cek, this;
      }
      setInitializationVector(iv) {
        return assertNotSet(this.#input[6], "setInitializationVector"), this.#input[6] = iv, this;
      }
      setProtectedHeader(protectedHeader) {
        return assertNotSet(this.#input[1], "setProtectedHeader"), this.#input[1] = protectedHeader, this;
      }
      setKeyManagementParameters(parameters) {
        return assertNotSet(this.#input[7], "setKeyManagementParameters"), this.#input[7] = parameters, this;
      }
      async encrypt(key, options) {
        return compactJWE(await createJWE([...this.#input], key, options));
      }
    };
  }
});

// node_modules/jose/dist/webapi/jwe/flattened/encrypt.js
var FlattenedEncrypt;
var init_encrypt3 = __esm({
  "node_modules/jose/dist/webapi/jwe/flattened/encrypt.js"() {
    init_validate();
    init_jwe_encrypt();
    FlattenedEncrypt = class {
      #input;
      constructor(plaintext) {
        assertUint8Array(plaintext, "plaintext"), this.#input = [plaintext];
      }
      setKeyManagementParameters(parameters) {
        return assertNotSet(this.#input[7], "setKeyManagementParameters"), this.#input[7] = parameters, this;
      }
      setProtectedHeader(protectedHeader) {
        return assertNotSet(this.#input[1], "setProtectedHeader"), this.#input[1] = protectedHeader, this;
      }
      setSharedUnprotectedHeader(sharedUnprotectedHeader) {
        return assertNotSet(this.#input[3], "setSharedUnprotectedHeader"), this.#input[3] = sharedUnprotectedHeader, this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        return assertNotSet(this.#input[2], "setUnprotectedHeader"), this.#input[2] = unprotectedHeader, this;
      }
      setAdditionalAuthenticatedData(aad) {
        return this.#input[4] = aad, this;
      }
      setContentEncryptionKey(cek) {
        return assertNotSet(this.#input[5], "setContentEncryptionKey"), this.#input[5] = cek, this;
      }
      setInitializationVector(iv) {
        return assertNotSet(this.#input[6], "setInitializationVector"), this.#input[6] = iv, this;
      }
      async encrypt(key, options) {
        return createJWE([...this.#input], key, options);
      }
    };
  }
});

// node_modules/jose/dist/webapi/lib/jws_sign.js
async function createSignature(input, key, rejectUnencoded) {
  let [payload, protectedHeader, unprotectedHeader, crit] = input, protectedHeaderString = "";
  if (protectedHeader !== void 0) {
    const normalized = serializeJoseHeader(JWSInvalid, protectedHeader);
    protectedHeader = normalized[0], protectedHeaderString = encode2(normalized[1]);
  }
  if (unprotectedHeader !== void 0 && (unprotectedHeader = serializeJoseHeader(JWSInvalid, unprotectedHeader)[0]), !protectedHeader && !unprotectedHeader)
    throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
  if (!isDisjoint(protectedHeader, unprotectedHeader))
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  const joseHeader = { ...protectedHeader, ...unprotectedHeader };
  validateCritDuplicates(JWSInvalid, protectedHeader);
  const b64 = validateB64(protectedHeader, validateCrit(JWSInvalid, JWS_RECOGNIZED, crit, protectedHeader, joseHeader));
  b64 || rejectUnencoded?.();
  const { alg } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  const entry = jwsAlgorithm(alg);
  let payloadS = "", payloadB = payload, data;
  if (b64) {
    const encoded = input[4];
    encoded ? (payloadS = encoded[0] ??= encode2(payload), payloadB = encoded[1] ??= encode(payloadS)) : (payloadS = encode2(payload), data = encoder.encode(`${protectedHeaderString}.${payloadS}`));
  }
  data ??= concat(encode(protectedHeaderString), encode("."), payloadB);
  const k = await rawKey(await prepareKey(entry, key, "sign"), entry.subtle, "sign");
  entry.minRsaBits && checkModulusLength(entry.alg, k);
  const jws = {
    signature: encode2(new Uint8Array(await crypto.subtle.sign(entry.signing, k, data))),
    payload: payloadS
  };
  return protectedHeader && (jws.protected = protectedHeaderString), unprotectedHeader && (jws.header = unprotectedHeader), [jws, b64];
}
async function createCompactSignature(payload, protectedHeader, crit, key, rejectUnencoded) {
  const [jws] = await createSignature([payload, protectedHeader, void 0, crit], key, rejectUnencoded);
  return `${jws.protected}.${jws.payload}.${jws.signature}`;
}
var init_jws_sign = __esm({
  "node_modules/jose/dist/webapi/lib/jws_sign.js"() {
    init_base64url();
    init_jws_algorithms();
    init_validate();
    init_errors();
    init_buffer_utils();
    init_key();
  }
});

// node_modules/jose/dist/webapi/jws/compact/sign.js
var CompactSign;
var init_sign = __esm({
  "node_modules/jose/dist/webapi/jws/compact/sign.js"() {
    init_jws_sign();
    init_validate();
    CompactSign = class {
      #payload;
      #protectedHeader;
      constructor(payload) {
        assertUint8Array(payload, "payload"), this.#payload = payload;
      }
      setProtectedHeader(protectedHeader) {
        return assertNotSet(this.#protectedHeader, "setProtectedHeader"), this.#protectedHeader = protectedHeader, this;
      }
      async sign(key, options) {
        return createCompactSignature(this.#payload, this.#protectedHeader, options?.crit, key, () => {
          throw new TypeError("use the flattened module for creating JWS with b64: false");
        });
      }
    };
  }
});

// node_modules/jose/dist/webapi/jws/flattened/sign.js
var FlattenedSign;
var init_sign2 = __esm({
  "node_modules/jose/dist/webapi/jws/flattened/sign.js"() {
    init_jws_sign();
    init_validate();
    FlattenedSign = class {
      #input;
      constructor(payload) {
        assertUint8Array(payload, "payload"), this.#input = [payload];
      }
      setProtectedHeader(protectedHeader) {
        return assertNotSet(this.#input[1], "setProtectedHeader"), this.#input[1] = protectedHeader, this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        return assertNotSet(this.#input[2], "setUnprotectedHeader"), this.#input[2] = unprotectedHeader, this;
      }
      async sign(key, options) {
        const input = [...this.#input];
        input[3] = options?.crit;
        const [jws] = await createSignature(input, key);
        return jws;
      }
    };
  }
});

// node_modules/jose/dist/webapi/jws/general/sign.js
var IndividualSignature, GeneralSign;
var init_sign3 = __esm({
  "node_modules/jose/dist/webapi/jws/general/sign.js"() {
    init_jws_sign();
    init_errors();
    init_validate();
    IndividualSignature = class {
      #parent;
      state;
      constructor(sig2, key, options) {
        this.#parent = sig2, this.state = [void 0, void 0, key, options?.crit];
      }
      setProtectedHeader(protectedHeader) {
        return assertNotSet(this.state[0], "setProtectedHeader"), this.state[0] = protectedHeader, this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        return assertNotSet(this.state[1], "setUnprotectedHeader"), this.state[1] = unprotectedHeader, this;
      }
      addSignature(...args) {
        return this.#parent.addSignature(...args);
      }
      sign(...args) {
        return this.#parent.sign(...args);
      }
      done() {
        return this.#parent;
      }
    };
    GeneralSign = class {
      #payload;
      #signatures = [];
      constructor(payload) {
        this.#payload = payload;
      }
      addSignature(key, options) {
        const signature = new IndividualSignature(this, key, options);
        return this.#signatures.push(signature), signature;
      }
      async sign() {
        if (!this.#signatures.length)
          throw new JWSInvalid("at least one signature must be added");
        assertUint8Array(this.#payload, "payload");
        const jws = {
          signatures: [],
          payload: ""
        }, encoded = [];
        let b64;
        for (const signature of this.#signatures) {
          const [protectedHeader, unprotectedHeader, key, crit] = signature.state, [{ payload, ...rest }, signatureB64] = await createSignature([this.#payload, protectedHeader, unprotectedHeader, crit, encoded], key);
          if (b64 === void 0)
            b64 = signatureB64, jws.payload = payload;
          else if (b64 !== signatureB64)
            throw new JWSInvalid("inconsistent use of JWS Unencoded Payload (RFC7797)");
          jws.signatures.push(rest);
        }
        return jws;
      }
    };
  }
});

// node_modules/jose/dist/webapi/jwt/sign.js
var SignJWT_base, SignJWT;
var init_sign4 = __esm({
  "node_modules/jose/dist/webapi/jwt/sign.js"() {
    init_jws_sign();
    init_errors();
    init_jwt_claims_set();
    init_validate();
    SignJWT_base = JWTClaimsBuilder;
    SignJWT = class extends SignJWT_base {
      #protectedHeader;
      setProtectedHeader(protectedHeader) {
        return assertNotSet(this.#protectedHeader, "setProtectedHeader"), this.#protectedHeader = protectedHeader, this;
      }
      async sign(key, options) {
        return createCompactSignature(jwtData(this), this.#protectedHeader, options?.crit, key, () => {
          throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
        });
      }
    };
  }
});

// node_modules/jose/dist/webapi/jwt/encrypt.js
var EncryptJWT_base, EncryptJWT;
var init_encrypt4 = __esm({
  "node_modules/jose/dist/webapi/jwt/encrypt.js"() {
    init_jwe_encrypt();
    init_jwt_claims_set();
    init_validate();
    EncryptJWT_base = JWTClaimsBuilder;
    EncryptJWT = class extends EncryptJWT_base {
      #input = [void 0];
      #replicateIssuerAsHeader;
      #replicateSubjectAsHeader;
      #replicateAudienceAsHeader;
      setProtectedHeader(protectedHeader) {
        return assertNotSet(this.#input[1], "setProtectedHeader"), this.#input[1] = protectedHeader, this;
      }
      setKeyManagementParameters(parameters) {
        return assertNotSet(this.#input[7], "setKeyManagementParameters"), this.#input[7] = parameters, this;
      }
      setContentEncryptionKey(cek) {
        return assertNotSet(this.#input[5], "setContentEncryptionKey"), this.#input[5] = cek, this;
      }
      setInitializationVector(iv) {
        return assertNotSet(this.#input[6], "setInitializationVector"), this.#input[6] = iv, this;
      }
      replicateIssuerAsHeader() {
        return this.#replicateIssuerAsHeader = true, this;
      }
      replicateSubjectAsHeader() {
        return this.#replicateSubjectAsHeader = true, this;
      }
      replicateAudienceAsHeader() {
        return this.#replicateAudienceAsHeader = true, this;
      }
      async encrypt(key, options) {
        const plaintext = jwtData(this);
        this.#input[1] && (this.#replicateIssuerAsHeader || this.#replicateSubjectAsHeader || this.#replicateAudienceAsHeader) && (this.#input[1] = {
          ...this.#input[1],
          iss: this.#replicateIssuerAsHeader ? jwtClaim(this, "iss") : void 0,
          sub: this.#replicateSubjectAsHeader ? jwtClaim(this, "sub") : void 0,
          aud: this.#replicateAudienceAsHeader ? jwtClaim(this, "aud") : void 0
        });
        const input = [...this.#input];
        return input[0] = plaintext, compactJWE(await createJWE(input, key, options));
      }
    };
  }
});

// node_modules/jose/dist/webapi/lib/key_algorithm.js
function unsupportedAlg(source = 'JWK "alg" (Algorithm) Parameter') {
  throw new JOSENotSupported(`Invalid or unsupported ${source} value`);
}
function keyAlgorithm(alg, source) {
  return (typeof alg == "string" ? JWS[alg] ?? JWE[alg] : void 0) ?? unsupportedAlg(source);
}
var algArgument;
var init_key_algorithm = __esm({
  "node_modules/jose/dist/webapi/lib/key_algorithm.js"() {
    init_errors();
    init_jws_algorithms();
    init_jwe_algorithms();
    algArgument = '"alg" (Algorithm)';
  }
});

// node_modules/jose/dist/webapi/lib/asn1.js
function parseKeyHeader(state, keyFormat) {
  if (expectTag(state, 48, `Invalid ${keyFormat === "spki" ? "SPKI" : "PKCS#8"} structure`), parseLength(state), keyFormat === "pkcs8") {
    expectTag(state, 2, "Expected version field");
    const length = parseLength(state);
    state.pos += length;
  }
  expectTag(state, 48, "Expected algorithm identifier"), parseLength(state);
}
function spkiFromX509(buf) {
  const state = createASN1State(buf);
  expectTag(state, 48, "Invalid certificate structure");
  const certificateLength = parseLength(state);
  if (certificateLength < 0 || state.pos + certificateLength > state.data.length)
    throw new Error("Unexpected end of ASN.1 input");
  expectTag(state, 48, "Invalid tbsCertificate structure"), parseLength(state), buf[state.pos] === 160 ? skipElement(state, 6) : skipElement(state, 5);
  const spkiStart = state.pos;
  expectTag(state, 48, "Invalid SPKI structure");
  const spkiContentLen = parseLength(state);
  return buf.subarray(spkiStart, spkiStart + spkiContentLen + (state.pos - spkiStart));
}
var formatPEM, genericExport, toSPKI, toPKCS8, bytesEqual, createASN1State, readByte, parseLength, skipElement, expectTag, getSubarray, parseAlgorithmOID, parseECAlgorithmIdentifier, genericImport, processPEMData, fromPKCS8, fromSPKI, fromX509;
var init_asn1 = __esm({
  "node_modules/jose/dist/webapi/lib/asn1.js"() {
    init_key();
    init_buffer_utils();
    init_errors();
    init_key_algorithm();
    formatPEM = (b64, descriptor) => {
      const newlined = (b64.match(/.{1,64}/g) || []).join(`
`);
      return `-----BEGIN ${descriptor}-----
${newlined}
-----END ${descriptor}-----`;
    };
    genericExport = async (keyType, keyFormat, key) => {
      if (isKeyObject(key)) {
        if (key.type !== keyType)
          throw new TypeError(`key is not a ${keyType} key`);
        return key.export({ format: "pem", type: keyFormat });
      }
      if (!isCryptoKey(key))
        throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject"));
      if (!key.extractable)
        throw new TypeError("CryptoKey is not extractable");
      if (key.type !== keyType)
        throw new TypeError(`key is not a ${keyType} key`);
      return formatPEM(encodeBase64(new Uint8Array(await crypto.subtle.exportKey(keyFormat, key))), `${keyType.toUpperCase()} KEY`);
    };
    toSPKI = (key) => genericExport("public", "spki", key);
    toPKCS8 = (key) => genericExport("private", "pkcs8", key);
    bytesEqual = (a, b) => {
      if (a.byteLength !== b.length)
        return false;
      for (let i = 0; i < a.byteLength; i++)
        if (a[i] !== b[i])
          return false;
      return true;
    };
    createASN1State = (data) => ({ data, pos: 0 });
    readByte = (state) => {
      const byte = state.data[state.pos++];
      if (byte === void 0)
        throw new Error("Unexpected end of ASN.1 input");
      return byte;
    };
    parseLength = (state) => {
      const first = readByte(state);
      if (first & 128) {
        const lengthOfLen = first & 127;
        let length = 0;
        for (let i = 0; i < lengthOfLen; i++)
          length = length << 8 | readByte(state);
        return length;
      }
      return first;
    };
    skipElement = (state, count = 1) => {
      for (; count-- > 0; ) {
        state.pos++;
        const length = parseLength(state);
        state.pos += length;
      }
    };
    expectTag = (state, expectedTag, errorMessage) => {
      if (readByte(state) !== expectedTag)
        throw new Error(errorMessage);
    };
    getSubarray = (state, length) => {
      if (length < 0 || state.pos + length > state.data.length)
        throw new Error("Unexpected end of ASN.1 input");
      const result = state.data.subarray(state.pos, state.pos + length);
      return state.pos += length, result;
    };
    parseAlgorithmOID = (state) => {
      expectTag(state, 6, "Expected algorithm OID");
      const oidLen = parseLength(state);
      return getSubarray(state, oidLen);
    };
    parseECAlgorithmIdentifier = (state) => {
      const algOid = parseAlgorithmOID(state);
      if (bytesEqual(algOid, [43, 101, 110]))
        return "X25519";
      if (!bytesEqual(algOid, [42, 134, 72, 206, 61, 2, 1]))
        throw new Error("Unsupported key algorithm");
      expectTag(state, 6, "Expected curve OID");
      const curveOidLen = parseLength(state), curveOid = getSubarray(state, curveOidLen);
      if (bytesEqual(curveOid, [42, 134, 72, 206, 61, 3, 1, 7]))
        return "P-256";
      if (bytesEqual(curveOid, [43, 129, 4, 0, 34]))
        return "P-384";
      if (bytesEqual(curveOid, [43, 129, 4, 0, 35]))
        return "P-521";
      throw new Error("Unsupported named curve");
    };
    genericImport = async (keyFormat, keyData, alg, options) => {
      const extractable = validateExtractableOption(options?.extractable), entry = keyAlgorithm(alg, algArgument);
      entry.secret && unsupportedAlg(algArgument);
      const isPublic = keyFormat === "spki";
      let algorithm;
      if (entry.resolve)
        try {
          const state = createASN1State(keyData);
          parseKeyHeader(state, keyFormat), algorithm = entry.resolve({ crv: parseECAlgorithmIdentifier(state) });
        } catch {
          throw new JOSENotSupported("Invalid or unsupported key format");
        }
      else
        algorithm = entry.subtle;
      return crypto.subtle.importKey(keyFormat, keyData, algorithm, extractable ?? isPublic, entry.usages[isPublic ? 0 : 1]);
    };
    processPEMData = (pem, pattern) => decodeBase64(pem.replace(pattern, ""));
    fromPKCS8 = (pem, alg, options) => {
      const keyData = processPEMData(pem, /(?:-----(?:BEGIN|END) PRIVATE KEY-----|\s)/g);
      return genericImport("pkcs8", keyData, alg, options);
    };
    fromSPKI = (pem, alg, options) => {
      const keyData = processPEMData(pem, /(?:-----(?:BEGIN|END) PUBLIC KEY-----|\s)/g);
      return genericImport("spki", keyData, alg, options);
    };
    fromX509 = (pem, alg, options) => {
      let spki;
      try {
        const certificate = processPEMData(pem, /(?:-----(?:BEGIN|END) CERTIFICATE-----|\s)/g);
        spki = spkiFromX509(certificate);
      } catch (cause) {
        throw new TypeError("Failed to parse the X.509 certificate", { cause });
      }
      return genericImport("spki", spki, alg, options);
    };
  }
});

// node_modules/jose/dist/webapi/key/export.js
function exportSPKI(key) {
  return toSPKI(key);
}
function exportPKCS8(key) {
  return toPKCS8(key);
}
async function exportJWK(key) {
  if (isKeyObject(key))
    if (key.type === "secret")
      key = key.export();
    else
      return key.export({ format: "jwk" });
  if (key instanceof Uint8Array)
    return {
      kty: "oct",
      k: encode2(key)
    };
  if (!isCryptoKey(key))
    throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "Uint8Array"));
  if (!key.extractable)
    throw new TypeError("non-extractable CryptoKey cannot be exported as a JWK");
  const jwk = await crypto.subtle.exportKey("jwk", key);
  delete jwk.ext, delete jwk.key_ops, delete jwk.use, jwk.kty !== "AKP" && delete jwk.alg;
  for (const parameter of Object.keys(jwk))
    jwk[parameter] === void 0 && delete jwk[parameter];
  return jwk;
}
var init_export = __esm({
  "node_modules/jose/dist/webapi/key/export.js"() {
    init_asn1();
    init_key();
    init_base64url();
  }
});

// node_modules/jose/dist/webapi/jwk/thumbprint.js
async function calculateJwkThumbprint(key, digestAlgorithm) {
  let jwk;
  if (isObject(key)) {
    if (jwk = snapshotJwk(key), typeof jwk.kty != "string")
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
  } else if (isKeyLike(key))
    jwk = snapshotJwk(await exportJWK(key));
  else
    throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
  if (digestAlgorithm ??= "sha256", digestAlgorithm !== "sha256" && digestAlgorithm !== "sha384" && digestAlgorithm !== "sha512")
    throw new TypeError('digestAlgorithm must one of "sha256", "sha384", or "sha512"');
  let components;
  switch (jwk.kty) {
    case "AKP":
      check(jwk.alg, '"alg" (Algorithm) Parameter'), check(jwk.pub, '"pub" (Public key) Parameter'), components = { alg: jwk.alg, kty: jwk.kty, pub: jwk.pub };
      break;
    case "EC":
      check(jwk.crv, '"crv" (Curve) Parameter'), check(jwk.x, '"x" (X Coordinate) Parameter'), check(jwk.y, '"y" (Y Coordinate) Parameter'), components = { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
      break;
    case "OKP":
      check(jwk.crv, '"crv" (Subtype of Key Pair) Parameter'), check(jwk.x, '"x" (Public Key) Parameter'), components = { crv: jwk.crv, kty: jwk.kty, x: jwk.x };
      break;
    case "RSA":
      check(jwk.e, '"e" (Exponent) Parameter'), check(jwk.n, '"n" (Modulus) Parameter'), components = { e: jwk.e, kty: jwk.kty, n: jwk.n };
      break;
    case "oct":
      if (typeof jwk.k != "string")
        throw new JWKInvalid('"k" (Key Value) Parameter missing or invalid');
      components = { k: jwk.k, kty: jwk.kty };
      break;
    default:
      throw new JOSENotSupported('"kty" (Key Type) Parameter missing or unsupported');
  }
  const data = encode(JSON.stringify(components));
  return encode2(await digest(digestAlgorithm, data));
}
async function calculateJwkThumbprintUri(key, digestAlgorithm) {
  digestAlgorithm ??= "sha256";
  const thumbprint = await calculateJwkThumbprint(key, digestAlgorithm);
  return `urn:ietf:params:oauth:jwk-thumbprint:sha-${digestAlgorithm.slice(-3)}:${thumbprint}`;
}
var check;
var init_thumbprint = __esm({
  "node_modules/jose/dist/webapi/jwk/thumbprint.js"() {
    init_buffer_utils();
    init_base64url();
    init_errors();
    init_key();
    init_validate();
    init_export();
    check = (value, description) => {
      if (typeof value != "string" || !value)
        throw new JWKInvalid(`${description} missing or invalid`);
    };
  }
});

// node_modules/jose/dist/webapi/jwk/embedded.js
async function EmbeddedJWK(protectedHeader, token) {
  const joseHeader = {
    ...protectedHeader,
    ...token?.header
  };
  if (!isObject(joseHeader.jwk))
    throw new JWSInvalid('"jwk" (JSON Web Key) Header Parameter must be a JSON object');
  let jwk;
  try {
    jwk = normalizeJwk(joseHeader.jwk);
  } catch (cause) {
    throw new JWSInvalid("Invalid Embedded JWK", { cause });
  }
  const entry = jwsAlgorithm(joseHeader.alg);
  if (jwk.use !== void 0 && jwk.use !== "sig")
    throw new JWSInvalid('Invalid Embedded JWK, its "use" must be "sig" when present');
  if (jwk.alg !== void 0 && jwk.alg !== entry.alg)
    throw new JWSInvalid(`Invalid Embedded JWK, its "alg" must be "${entry.alg}" when present`);
  const key = await jwkToKey(entry, jwk, true);
  if (key.type !== "public")
    throw new JWSInvalid('"jwk" (JSON Web Key) Header Parameter must be a public key');
  return key;
}
var init_embedded = __esm({
  "node_modules/jose/dist/webapi/jwk/embedded.js"() {
    init_key();
    init_jws_algorithms();
    init_validate();
    init_errors();
  }
});

// node_modules/jose/dist/webapi/jwks/local.js
function isUsableJWK(jwk, entry, alg, kid) {
  const { kty, key_ops: keyOps, ext, kid: jwkKid, alg: jwkAlg, use, crv } = jwk;
  return (ext === void 0 || typeof ext == "boolean") && (keyOps === void 0 || Array.isArray(keyOps) && keyOps.every((operation, index) => typeof operation == "string" && keyOps.indexOf(operation) === index) && keyOps.includes("verify")) && entry.kty.includes(kty) && (kid === void 0 || typeof kid == "string" && kid === jwkKid) && (jwkAlg === void 0 ? kty !== "AKP" : alg === jwkAlg) && (use === void 0 || use === "sig") && (!entry.crv || crv === entry.crv);
}
async function importWithAlgCache(cache2, jwk, entry) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk), { alg } = entry;
  if (cached[alg] === void 0) {
    const pending = jwkToKey(entry, jwk, true).then((key) => {
      if (key.type !== "public")
        throw new JWKSInvalid("JSON Web Key Set members must be public keys");
      return cached[alg] = key, key;
    }).catch((error) => {
      throw cached[alg] === pending && delete cached[alg], error;
    });
    cached[alg] = pending;
  }
  return cached[alg];
}
function createLocalJWKSet(jwks) {
  let snapshot;
  try {
    snapshot = structuredClone(jwks);
  } catch {
  }
  if (!isJwkSet(snapshot))
    throw new JWKSInvalid("JSON Web Key Set malformed");
  const metadata = snapshot.keys.map((jwk) => {
    const normalized = snapshotJwk(jwk);
    return Array.isArray(normalized.key_ops) && (normalized.key_ops = [...normalized.key_ops]), normalized;
  }), cached = /* @__PURE__ */ new WeakMap();
  return Object.defineProperty(async (protectedHeader, token) => {
    const { alg, kid } = { ...protectedHeader, ...token?.header }, entry = typeof alg == "string" ? JWS[alg] : void 0;
    if (!entry || entry.secret)
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
    const candidates = snapshot.keys.filter((_, index) => isUsableJWK(metadata[index], entry, alg, kid)), { 0: jwk, length } = candidates;
    if (!length)
      throw new JWKSNoMatchingKey();
    if (length !== 1) {
      const error = new JWKSMultipleMatchingKeys();
      throw error[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates)
          try {
            yield await importWithAlgCache(cached, jwk2, entry);
          } catch {
          }
      }, error;
    }
    return importWithAlgCache(cached, jwk, entry);
  }, "jwks", {
    value: () => structuredClone(snapshot)
  });
}
var init_local = __esm({
  "node_modules/jose/dist/webapi/jwks/local.js"() {
    init_key();
    init_jws_algorithms();
    init_errors();
    init_validate();
  }
});

// node_modules/jose/dist/webapi/jwks/remote.js
function isCloudflareWorkers() {
  return typeof WebSocketPair < "u" || typeof navigator < "u" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime < "u" && EdgeRuntime === "vercel";
}
async function fetchJwks(url, headers, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers
  }).catch((err) => {
    throw err.name === "TimeoutError" ? new JWKSTimeout() : err;
  });
  if (response.status !== 200)
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
function isFreshFor(timestamp, duration) {
  return Number.isFinite(timestamp) && Date.now() < timestamp + duration;
}
function validateDuration(value, fallback, option) {
  if (Number.isNaN(value))
    throw new TypeError(`"${option}" option must not be NaN`);
  return typeof value == "number" ? value : fallback;
}
function createRemoteJWKSet(url, options) {
  if (!(url instanceof URL))
    throw new TypeError("url must be an instance of URL");
  const href = new URL(url.href).href, opts = options ?? {}, timeoutOption = opts.timeoutDuration;
  if (typeof timeoutOption == "number" && (!Number.isInteger(timeoutOption) || timeoutOption < 0))
    throw new TypeError('"timeoutDuration" option must be a non-negative integer');
  const timeoutDuration = typeof timeoutOption == "number" ? timeoutOption : 5e3, cooldownDuration = validateDuration(opts.cooldownDuration, 3e4, "cooldownDuration"), cacheMaxAge = validateDuration(opts.cacheMaxAge, 6e5, "cacheMaxAge"), headers = new Headers(opts.headers);
  USER_AGENT && !headers.has("User-Agent") && headers.set("User-Agent", USER_AGENT), headers.has("accept") || headers.set("accept", "application/json, application/jwk-set+json");
  const fetchImpl = opts[customFetch], cache2 = opts[jwksCache];
  let jwksTimestamp, pendingFetch, reloadSequence = 0, appliedSequence = 0, local;
  if (cache2 && typeof cache2 == "object") {
    const { uat, jwks } = cache2;
    isFreshFor(uat, cacheMaxAge) && isJwkSet(jwks) && (jwksTimestamp = uat, local = createLocalJWKSet(jwks));
  }
  const reload = async () => {
    if (pendingFetch && isCloudflareWorkers() && (pendingFetch = void 0), !pendingFetch) {
      const sequence = ++reloadSequence, current = pendingFetch = fetchJwks(href, headers, AbortSignal.timeout(timeoutDuration), fetchImpl).then((json) => {
        const next = createLocalJWKSet(json);
        if (sequence <= appliedSequence)
          return;
        local = next;
        const updatedAt = Date.now();
        cache2 && (cache2.uat = updatedAt, cache2.jwks = json), jwksTimestamp = updatedAt, appliedSequence = sequence;
      }).finally(() => {
        pendingFetch === current && (pendingFetch = void 0);
      });
    }
    await pendingFetch;
  };
  return Object.defineProperties(async (protectedHeader, token) => {
    (!local || !isFreshFor(jwksTimestamp, cacheMaxAge)) && await reload();
    try {
      return await local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey && !isFreshFor(jwksTimestamp, cooldownDuration))
        return await reload(), local(protectedHeader, token);
      throw err;
    }
  }, {
    coolingDown: {
      get: () => isFreshFor(jwksTimestamp, cooldownDuration),
      enumerable: true
    },
    fresh: {
      get: () => isFreshFor(jwksTimestamp, cacheMaxAge),
      enumerable: true
    },
    reload: {
      value: reload,
      enumerable: true
    },
    reloading: {
      get: () => !!pendingFetch,
      enumerable: true
    },
    jwks: {
      value: () => local?.jwks(),
      enumerable: true
    }
  });
}
var USER_AGENT, customFetch, jwksCache;
var init_remote = __esm({
  "node_modules/jose/dist/webapi/jwks/remote.js"() {
    init_errors();
    init_local();
    init_validate();
    (typeof navigator > "u" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) && (USER_AGENT = "jose/v6.2.12");
    customFetch = /* @__PURE__ */ Symbol();
    jwksCache = /* @__PURE__ */ Symbol();
  }
});

// node_modules/jose/dist/webapi/jwt/unsecured.js
var UnsecuredJWT_base, UnsecuredJWT;
var init_unsecured = __esm({
  "node_modules/jose/dist/webapi/jwt/unsecured.js"() {
    init_base64url();
    init_validate();
    init_errors();
    init_jwt_claims_set();
    UnsecuredJWT_base = JWTClaimsBuilder;
    UnsecuredJWT = class extends UnsecuredJWT_base {
      encode() {
        const header = encode2(JSON.stringify({ alg: "none" })), payload = encode2(jwtData(this));
        return `${header}.${payload}.`;
      }
      static decode(jwt, options) {
        if (typeof jwt != "string")
          throw new JWTInvalid("Unsecured JWT must be a string");
        const { 0: encodedHeader, 1: encodedPayload, 2: signature, length } = jwt.split(".");
        if (length !== 3 || signature !== "")
          throw new JWTInvalid("Invalid Unsecured JWT");
        let header, b64;
        try {
          header = parseJoseHeader(encodedHeader, JWSInvalid, "JWS Protected Header is invalid");
          const extensions = validateCrit(JWSInvalid, JWS_RECOGNIZED, void 0, header, header);
          b64 = validateB64(header, extensions);
        } catch (cause) {
          throw cause instanceof JWSInvalid ? new JWTInvalid("Invalid Unsecured JWT", { cause }) : cause;
        }
        if (header.alg !== "none")
          throw new JWTInvalid("Invalid Unsecured JWT");
        if (!b64)
          throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
        return { payload: validateClaimsSet(header, decodeBase64url(encodedPayload, "payload", JWTInvalid), options), header };
      }
    };
  }
});

// node_modules/jose/dist/webapi/key/import.js
async function importSPKI(spki, alg, options) {
  if (typeof spki != "string" || spki.indexOf("-----BEGIN PUBLIC KEY-----") !== 0)
    throw new TypeError('"spki" must be SPKI formatted string');
  return fromSPKI(spki, alg, options);
}
async function importX509(x509, alg, options) {
  if (typeof x509 != "string" || x509.indexOf("-----BEGIN CERTIFICATE-----") !== 0)
    throw new TypeError('"x509" must be X.509 formatted string');
  return fromX509(x509, alg, options);
}
async function importPKCS8(pkcs8, alg, options) {
  if (typeof pkcs8 != "string" || pkcs8.indexOf("-----BEGIN PRIVATE KEY-----") !== 0)
    throw new TypeError('"pkcs8" must be PKCS#8 formatted string');
  return fromPKCS8(pkcs8, alg, options);
}
async function importJWK(jwk, alg, options) {
  if (!isObject(jwk))
    throw new TypeError("JWK must be an object");
  const normalized = normalizeJwk(jwk), extractable = validateExtractableOption(options?.extractable), { alg: jwkAlg } = normalized;
  if (alg ??= jwkAlg, normalized.kty !== "oct" && !alg)
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  switch (normalized.kty) {
    case "oct":
      if (typeof normalized.k != "string")
        throw new TypeError('missing "k" (Key Value) Parameter value');
      return decode(normalized.k);
    case "AKP": {
      if (typeof jwkAlg != "string" || !jwkAlg)
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      if (alg !== jwkAlg)
        throw new TypeError("JWK alg and alg option value mismatch");
      return jwkToKey(keyAlgorithm(alg), normalized, extractable);
    }
    case "RSA":
    case "EC":
    case "OKP":
      return jwkToKey(keyAlgorithm(alg), normalized, extractable);
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
var init_import = __esm({
  "node_modules/jose/dist/webapi/key/import.js"() {
    init_base64url();
    init_asn1();
    init_key();
    init_key_algorithm();
    init_errors();
    init_validate();
  }
});

// node_modules/jose/dist/webapi/util/decode_protected_header.js
function decodeProtectedHeader(token) {
  let protectedB64u;
  if (typeof token == "string") {
    const parts = token.split(".");
    (parts.length === 3 || parts.length === 5) && ([protectedB64u] = parts);
  } else if (typeof token == "object" && token)
    if ("protected" in token)
      protectedB64u = token.protected;
    else
      throw new TypeError("Token does not contain a Protected Header");
  const invalid2 = "Invalid Token or Protected Header formatting";
  if (typeof protectedB64u != "string" || !protectedB64u)
    throw new TypeError(invalid2);
  return parseJoseHeader(protectedB64u, TypeError, invalid2);
}
var init_decode_protected_header = __esm({
  "node_modules/jose/dist/webapi/util/decode_protected_header.js"() {
    init_validate();
  }
});

// node_modules/jose/dist/webapi/util/decode_jwt.js
function decodeJwt(jwt) {
  if (typeof jwt != "string")
    throw new JWTInvalid("JWTs must use Compact JWS serialization, JWT must be a string");
  const { 1: payload, length } = jwt.split(".");
  if (length === 5)
    throw new JWTInvalid("Only JWTs using Compact JWS serialization can be decoded");
  if (length !== 3)
    throw new JWTInvalid("Invalid JWT");
  if (!payload)
    throw new JWTInvalid("JWTs must contain a payload");
  let decoded;
  try {
    decoded = decode(payload);
  } catch {
    throw new JWTInvalid("Failed to base64url decode the payload");
  }
  let result;
  try {
    result = JSON.parse(strictDecoder.decode(decoded));
  } catch {
    throw new JWTInvalid("Failed to parse the decoded payload as JSON");
  }
  if (!isObject(result))
    throw new JWTInvalid("Invalid JWT Claims Set");
  return result;
}
var init_decode_jwt = __esm({
  "node_modules/jose/dist/webapi/util/decode_jwt.js"() {
    init_base64url();
    init_buffer_utils();
    init_validate();
    init_errors();
  }
});

// node_modules/jose/dist/webapi/key/generate_key_pair.js
function getModulusLengthOption(options) {
  const modulusLength = options?.modulusLength ?? 2048;
  if (typeof modulusLength != "number" || !Number.isInteger(modulusLength) || modulusLength < 2048)
    throw new JOSENotSupported("Invalid or unsupported modulusLength option provided, 2048 bits or larger keys must be used");
  return modulusLength;
}
async function generateKeyPair(alg, options) {
  const extractable = validateExtractableOption(options?.extractable), entry = keyAlgorithm(alg, algArgument);
  entry.secret && unsupportedAlg(algArgument);
  let algorithm;
  if (entry.resolve) {
    const crv = options?.crv ?? "P-256";
    if (!["P-256", "P-384", "P-521", "X25519"].includes(crv))
      throw new JOSENotSupported("Invalid or unsupported crv option provided, supported values are P-256, P-384, P-521, and X25519");
    algorithm = entry.resolve({ crv });
  } else {
    if (entry.crv !== void 0 && options?.crv !== void 0 && options.crv !== entry.crv)
      throw new JOSENotSupported(`Invalid or unsupported crv option provided, the only supported value for ${alg} is ${entry.crv}`);
    algorithm = entry.kty[0] === "RSA" ? {
      ...entry.subtle,
      publicExponent: Uint8Array.of(1, 0, 1),
      modulusLength: getModulusLengthOption(options)
    } : entry.subtle;
  }
  return crypto.subtle.generateKey(algorithm, extractable ?? false, [
    ...entry.usages[1],
    ...entry.usages[0]
  ]);
}
var init_generate_key_pair = __esm({
  "node_modules/jose/dist/webapi/key/generate_key_pair.js"() {
    init_errors();
    init_key();
    init_key_algorithm();
  }
});

// node_modules/jose/dist/webapi/key/generate_secret.js
async function generateSecret(alg, options) {
  const extractable = validateExtractableOption(options?.extractable);
  let length, algorithm, keyUsages;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      length = +alg.slice(-3), algorithm = { name: "HMAC", hash: `SHA-${length}`, length }, keyUsages = ["sign", "verify"];
      break;
    case "A128CBC-HS256":
    case "A192CBC-HS384":
    case "A256CBC-HS512":
      return crypto.getRandomValues(new Uint8Array(+alg.slice(-3) >> 3));
    case "A128KW":
    case "A192KW":
    case "A256KW":
      length = +alg.slice(1, 4), algorithm = { name: "AES-KW", length }, keyUsages = ["wrapKey", "unwrapKey"];
      break;
    case "A128GCMKW":
    case "A192GCMKW":
    case "A256GCMKW":
    case "A128GCM":
    case "A192GCM":
    case "A256GCM":
      length = +alg.slice(1, 4), algorithm = { name: "AES-GCM", length }, keyUsages = ["encrypt", "decrypt"];
      break;
    default:
      unsupportedAlg(algArgument);
  }
  return crypto.subtle.generateKey(algorithm, extractable ?? false, keyUsages);
}
var init_generate_secret = __esm({
  "node_modules/jose/dist/webapi/key/generate_secret.js"() {
    init_key_algorithm();
    init_key();
  }
});

// node_modules/jose/dist/webapi/index.js
var webapi_exports = {};
__export(webapi_exports, {
  CompactEncrypt: () => CompactEncrypt,
  CompactSign: () => CompactSign,
  EmbeddedJWK: () => EmbeddedJWK,
  EncryptJWT: () => EncryptJWT,
  FlattenedEncrypt: () => FlattenedEncrypt,
  FlattenedSign: () => FlattenedSign,
  GeneralEncrypt: () => GeneralEncrypt,
  GeneralSign: () => GeneralSign,
  SignJWT: () => SignJWT,
  UnsecuredJWT: () => UnsecuredJWT,
  base64url: () => base64url_exports,
  calculateJwkThumbprint: () => calculateJwkThumbprint,
  calculateJwkThumbprintUri: () => calculateJwkThumbprintUri,
  compactDecrypt: () => compactDecrypt,
  compactVerify: () => compactVerify,
  createLocalJWKSet: () => createLocalJWKSet,
  createRemoteJWKSet: () => createRemoteJWKSet,
  cryptoRuntime: () => cryptoRuntime,
  customFetch: () => customFetch,
  decodeJwt: () => decodeJwt,
  decodeProtectedHeader: () => decodeProtectedHeader,
  errors: () => errors_exports,
  exportJWK: () => exportJWK,
  exportPKCS8: () => exportPKCS8,
  exportSPKI: () => exportSPKI,
  flattenedDecrypt: () => flattenedDecrypt,
  flattenedVerify: () => flattenedVerify,
  generalDecrypt: () => generalDecrypt,
  generalVerify: () => generalVerify,
  generateKeyPair: () => generateKeyPair,
  generateSecret: () => generateSecret,
  importJWK: () => importJWK,
  importPKCS8: () => importPKCS8,
  importSPKI: () => importSPKI,
  importX509: () => importX509,
  jwksCache: () => jwksCache,
  jwtDecrypt: () => jwtDecrypt,
  jwtVerify: () => jwtVerify
});
var cryptoRuntime;
var init_webapi = __esm({
  "node_modules/jose/dist/webapi/index.js"() {
    init_decrypt();
    init_decrypt2();
    init_decrypt3();
    init_encrypt();
    init_verify();
    init_verify2();
    init_verify3();
    init_verify4();
    init_decrypt4();
    init_encrypt2();
    init_encrypt3();
    init_sign();
    init_sign2();
    init_sign3();
    init_sign4();
    init_encrypt4();
    init_thumbprint();
    init_embedded();
    init_local();
    init_remote();
    init_unsecured();
    init_export();
    init_import();
    init_decode_protected_header();
    init_decode_jwt();
    init_errors();
    init_generate_key_pair();
    init_generate_secret();
    init_base64url();
    cryptoRuntime = "WebCryptoAPI";
  }
});

// node_modules/jwks-rsa/src/errors/JwksError.js
var require_JwksError = __commonJS({
  "node_modules/jwks-rsa/src/errors/JwksError.js"(exports, module) {
    function JwksError(message2) {
      Error.call(this, message2);
      Error.captureStackTrace(this, this.constructor);
      this.name = "JwksError";
      this.message = message2;
    }
    JwksError.prototype = Object.create(Error.prototype);
    JwksError.prototype.constructor = JwksError;
    module.exports = JwksError;
  }
});

// node_modules/jwks-rsa/src/utils.js
var require_utils2 = __commonJS({
  "node_modules/jwks-rsa/src/utils.js"(exports, module) {
    var jose = (init_webapi(), __toCommonJS(webapi_exports));
    var JwksError = require_JwksError();
    function resolveAlg(jwk) {
      if (jwk.alg) {
        return jwk.alg;
      }
      if (jwk.kty === "RSA") {
        return "RS256";
      }
      if (jwk.kty === "EC") {
        switch (jwk.crv) {
          case "P-256":
            return "ES256";
          case "P-384":
            return "ES384";
          case "P-521":
            return "ES512";
        }
      }
      if (jwk.kty === "OKP") {
        switch (jwk.crv) {
          case "Ed25519":
          case "Ed448":
            return "EdDSA";
        }
      }
      throw new JwksError("Unsupported JWK");
    }
    async function retrieveSigningKeys(jwks) {
      const results = [];
      jwks = jwks.filter(({ use }) => use === "sig" || use === void 0).filter(({ kty }) => kty === "RSA" || kty === "EC" || kty === "OKP");
      for (const jwk of jwks) {
        try {
          const key = await jose.importJWK({ ...jwk, ext: true }, resolveAlg(jwk));
          if (key.type !== "public") {
            continue;
          }
          let getSpki;
          switch (key[Symbol.toStringTag]) {
            case "CryptoKey": {
              const spki = await jose.exportSPKI(key);
              getSpki = () => spki;
              break;
            }
            case "KeyObject":
            // Assume legacy Node.js version without the Symbol.toStringTag backported
            // Fall through
            default:
              getSpki = () => key.export({ format: "pem", type: "spki" });
          }
          results.push({
            get publicKey() {
              return getSpki();
            },
            get rsaPublicKey() {
              return getSpki();
            },
            getPublicKey() {
              return getSpki();
            },
            ...typeof jwk.kid === "string" && jwk.kid ? { kid: jwk.kid } : void 0,
            ...typeof jwk.alg === "string" && jwk.alg ? { alg: jwk.alg } : void 0
          });
        } catch (err) {
          continue;
        }
      }
      return results;
    }
    module.exports = {
      retrieveSigningKeys
    };
  }
});

// node_modules/jwks-rsa/src/errors/ArgumentError.js
var require_ArgumentError = __commonJS({
  "node_modules/jwks-rsa/src/errors/ArgumentError.js"(exports, module) {
    function ArgumentError(message2) {
      Error.call(this, message2);
      Error.captureStackTrace(this, this.constructor);
      this.name = "ArgumentError";
      this.message = message2;
    }
    ArgumentError.prototype = Object.create(Error.prototype);
    ArgumentError.prototype.constructor = ArgumentError;
    module.exports = ArgumentError;
  }
});

// node_modules/jwks-rsa/src/wrappers/request.js
var require_request = __commonJS({
  "node_modules/jwks-rsa/src/wrappers/request.js"(exports, module) {
    var http = __require("http");
    var https = __require("https");
    var ArgumentError = require_ArgumentError();
    module.exports.default = (options) => {
      if (options.fetcher) {
        return options.fetcher(options.uri);
      }
      return new Promise((resolve, reject) => {
        let url;
        try {
          url = new URL(options.uri);
        } catch (err) {
          throw new ArgumentError("Invalid JWKS URI: The provided URI is not a valid URL.");
        }
        const { hostname, port, protocol, pathname, search } = url;
        const path = pathname + search;
        const requestOptions = {
          hostname,
          path,
          port,
          method: "GET",
          ...options.headers && { headers: { ...options.headers } },
          ...options.timeout && { timeout: options.timeout },
          ...options.agent && { agent: options.agent }
        };
        const httpRequestLib = protocol === "https:" ? https : http;
        const httpRequest = httpRequestLib.request(requestOptions, (res) => {
          let rawData = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            rawData += chunk;
          });
          res.on("end", () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              const errorMsg = res.body && (res.body.message || res.body) || res.statusMessage || `Http Error ${res.statusCode}`;
              reject({ errorMsg });
            } else {
              try {
                resolve(rawData && JSON.parse(rawData));
              } catch (error) {
                reject(error);
              }
            }
          });
        });
        httpRequest.on("timeout", () => httpRequest.destroy()).on("error", (e) => reject(e)).end();
      });
    };
  }
});

// node_modules/jwks-rsa/node_modules/lru-cache/dist/commonjs/node/index.min.js
var require_index_min = __commonJS({
  "node_modules/jwks-rsa/node_modules/lru-cache/dist/commonjs/node/index.min.js"(exports) {
    "use strict";
    var j = (u, t) => () => (t || u((t = { exports: {} }).exports, t), t.exports);
    var I = j((O) => {
      "use strict";
      Object.defineProperty(O, "__esModule", { value: true });
      O.tracing = O.metrics = void 0;
      var U = __require("node:diagnostics_channel");
      O.metrics = (0, U.channel)("lru-cache:metrics");
      O.tracing = (0, U.tracingChannel)("lru-cache");
    });
    var P = j((R) => {
      "use strict";
      Object.defineProperty(R, "__esModule", { value: true });
      R.defaultPerf = void 0;
      R.defaultPerf = typeof performance == "object" && performance && typeof performance.now == "function" ? performance : Date;
    });
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LRUCache = void 0;
    var g = I();
    var N = P();
    var C = () => g.metrics.hasSubscribers || g.tracing.hasSubscribers;
    var k = /* @__PURE__ */ new Set();
    var G = typeof process == "object" && process ? process : {};
    var V = (u, t, e, i) => {
      typeof G.emitWarning == "function" ? G.emitWarning(u, t, e, i) : console.error(`[${e}] ${t}: ${u}`);
    };
    var q = (u) => !k.has(u);
    var T = (u) => !!u && u === Math.floor(u) && u > 0 && isFinite(u);
    var H = (u) => T(u) ? u <= Math.pow(2, 8) ? Uint8Array : u <= Math.pow(2, 16) ? Uint16Array : u <= Math.pow(2, 32) ? Uint32Array : u <= Number.MAX_SAFE_INTEGER ? W : null : null;
    var W = class extends Array {
      constructor(t) {
        super(t), this.fill(0);
      }
    };
    var L = class u {
      heap;
      length;
      static #o = false;
      static create(t) {
        let e = H(t);
        if (!e) return [];
        u.#o = true;
        let i = new u(t, e);
        return u.#o = false, i;
      }
      constructor(t, e) {
        if (!u.#o) throw new TypeError("instantiate Stack using Stack.create(n)");
        this.heap = new e(t), this.length = 0;
      }
      push(t) {
        this.heap[this.length++] = t;
      }
      pop() {
        return this.heap[--this.length];
      }
    };
    var M = class u {
      #o;
      #c;
      #m;
      #W;
      #S;
      #x;
      #j;
      #w;
      get perf() {
        return this.#w;
      }
      ttl;
      ttlResolution;
      ttlAutopurge;
      updateAgeOnGet;
      updateAgeOnHas;
      allowStale;
      noDisposeOnSet;
      noUpdateTTL;
      maxEntrySize;
      sizeCalculation;
      noDeleteOnFetchRejection;
      noDeleteOnStaleGet;
      allowStaleOnFetchAbort;
      allowStaleOnFetchRejection;
      ignoreFetchAbort;
      backgroundFetchSize;
      #n;
      #b;
      #s;
      #i;
      #t;
      #l;
      #u;
      #a;
      #h;
      #_;
      #r;
      #y;
      #F;
      #d;
      #g;
      #T;
      #U;
      #f;
      #R;
      static unsafeExposeInternals(t) {
        return { starts: t.#F, ttls: t.#d, autopurgeTimers: t.#g, sizes: t.#y, keyMap: t.#s, keyList: t.#i, valList: t.#t, next: t.#l, prev: t.#u, get head() {
          return t.#a;
        }, get tail() {
          return t.#h;
        }, free: t.#_, isBackgroundFetch: (e) => t.#e(e), backgroundFetch: (e, i, s, n) => t.#G(e, i, s, n), moveToTail: (e) => t.#M(e), indexes: (e) => t.#A(e), rindexes: (e) => t.#z(e), isStale: (e) => t.#p(e) };
      }
      get max() {
        return this.#o;
      }
      get maxSize() {
        return this.#c;
      }
      get calculatedSize() {
        return this.#b;
      }
      get size() {
        return this.#n;
      }
      get fetchMethod() {
        return this.#x;
      }
      get memoMethod() {
        return this.#j;
      }
      get dispose() {
        return this.#m;
      }
      get onInsert() {
        return this.#W;
      }
      get disposeAfter() {
        return this.#S;
      }
      constructor(t) {
        let { max: e = 0, ttl: i, ttlResolution: s = 1, ttlAutopurge: n, updateAgeOnGet: o, updateAgeOnHas: l, allowStale: h, dispose: r, onInsert: c, disposeAfter: w, noDisposeOnSet: y, noUpdateTTL: d, maxSize: p = 0, maxEntrySize: f = 0, sizeCalculation: _, fetchMethod: a, memoMethod: S, noDeleteOnFetchRejection: F, noDeleteOnStaleGet: b, allowStaleOnFetchRejection: m, allowStaleOnFetchAbort: A, ignoreFetchAbort: z, backgroundFetchSize: x = 1, perf: v } = t;
        if (this.backgroundFetchSize = x, v !== void 0 && typeof v?.now != "function") throw new TypeError("perf option must have a now() method if specified");
        if (this.#w = v ?? N.defaultPerf, e !== 0 && !T(e)) throw new TypeError("max option must be a nonnegative integer");
        let E = e ? H(e) : Array;
        if (!E) throw new Error("invalid max value: " + e);
        if (this.#o = e, this.#c = p, this.maxEntrySize = f || this.#c, this.sizeCalculation = _, this.sizeCalculation) {
          if (!this.#c && !this.maxEntrySize) throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
          if (typeof this.sizeCalculation != "function") throw new TypeError("sizeCalculation set to non-function");
        }
        if (S !== void 0 && typeof S != "function") throw new TypeError("memoMethod must be a function if defined");
        if (this.#j = S, a !== void 0 && typeof a != "function") throw new TypeError("fetchMethod must be a function if specified");
        if (this.#x = a, this.#U = !!a, this.#s = /* @__PURE__ */ new Map(), this.#i = Array.from({ length: e }).fill(void 0), this.#t = Array.from({ length: e }).fill(void 0), this.#l = new E(e), this.#u = new E(e), this.#a = 0, this.#h = 0, this.#_ = L.create(e), this.#n = 0, this.#b = 0, typeof r == "function" && (this.#m = r), typeof c == "function" && (this.#W = c), typeof w == "function" ? (this.#S = w, this.#r = []) : (this.#S = void 0, this.#r = void 0), this.#T = !!this.#m, this.#R = !!this.#W, this.#f = !!this.#S, this.noDisposeOnSet = !!y, this.noUpdateTTL = !!d, this.noDeleteOnFetchRejection = !!F, this.allowStaleOnFetchRejection = !!m, this.allowStaleOnFetchAbort = !!A, this.ignoreFetchAbort = !!z, this.maxEntrySize !== 0) {
          if (this.#c !== 0 && !T(this.#c)) throw new TypeError("maxSize must be a positive integer if specified");
          if (!T(this.maxEntrySize)) throw new TypeError("maxEntrySize must be a positive integer if specified");
          this.#X();
        }
        if (this.allowStale = !!h, this.noDeleteOnStaleGet = !!b, this.updateAgeOnGet = !!o, this.updateAgeOnHas = !!l, this.ttlResolution = T(s) || s === 0 ? s : 1, this.ttlAutopurge = !!n, this.ttl = i || 0, this.ttl) {
          if (!T(this.ttl)) throw new TypeError("ttl must be a positive integer if specified");
          this.#k();
        }
        if (this.#o === 0 && this.ttl === 0 && this.#c === 0) throw new TypeError("At least one of max, maxSize, or ttl is required");
        if (!this.ttlAutopurge && !this.#o && !this.#c) {
          let D = "LRU_CACHE_UNBOUNDED";
          q(D) && (k.add(D), V("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.", "UnboundedCacheWarning", D, u));
        }
      }
      getRemainingTTL(t) {
        return this.#s.has(t) ? 1 / 0 : 0;
      }
      #k() {
        let t = new W(this.#o), e = new W(this.#o);
        this.#d = t, this.#F = e;
        let i = this.ttlAutopurge ? Array.from({ length: this.#o }) : void 0;
        this.#g = i, this.#H = (h, r, c = this.#w.now()) => {
          e[h] = r !== 0 ? c : 0, t[h] = r, s(h, r);
        }, this.#D = (h) => {
          e[h] = t[h] !== 0 ? this.#w.now() : 0, s(h, t[h]);
        };
        let s = this.ttlAutopurge ? (h, r) => {
          if (i?.[h] && (clearTimeout(i[h]), i[h] = void 0), r && r !== 0 && i) {
            let c = setTimeout(() => {
              this.#p(h) ? (this.#v(this.#i[h], "expire"), i[h] = void 0) : s(h, l(h));
            }, r + 1);
            c.unref && c.unref(), i[h] = c;
          }
        } : () => {
        };
        this.#E = (h, r) => {
          if (t[r]) {
            let c = t[r], w = e[r];
            if (!c || !w) return;
            h.ttl = c, h.start = w, h.now = n || o();
            let y = h.now - w;
            h.remainingTTL = c - y;
          }
        };
        let n = 0, o = () => {
          let h = this.#w.now();
          if (this.ttlResolution > 0) {
            n = h;
            let r = setTimeout(() => n = 0, this.ttlResolution);
            r.unref && r.unref();
          }
          return h;
        };
        this.getRemainingTTL = (h) => {
          let r = this.#s.get(h);
          return r === void 0 ? 0 : l(r);
        };
        let l = (h) => {
          let r = t[h], c = e[h];
          if (!r || !c) return 1 / 0;
          let w = (n || o()) - c;
          return r - w;
        };
        this.#p = (h) => {
          let r = e[h], c = t[h];
          return !!c && !!r && (n || o()) - r > c;
        };
      }
      #D = () => {
      };
      #E = () => {
      };
      #H = () => {
      };
      #p = () => false;
      #X() {
        let t = new W(this.#o);
        this.#b = 0, this.#y = t, this.#C = (e) => {
          this.#b -= t[e], t[e] = 0;
        }, this.#N = (e, i, s, n) => {
          if (!T(s)) {
            if (this.#e(i)) return this.backgroundFetchSize;
            if (n) {
              if (typeof n != "function") throw new TypeError("sizeCalculation must be a function");
              if (s = n(i, e), !T(s)) throw new TypeError("sizeCalculation return invalid (expect positive integer)");
            } else throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
          }
          return s;
        }, this.#I = (e, i, s) => {
          if (t[e] = i, this.#c) {
            let n = this.#c - t[e];
            for (; this.#b > n; ) this.#P(true);
          }
          this.#b += t[e], s && (s.entrySize = i, s.totalCalculatedSize = this.#b);
        };
      }
      #C = (t) => {
      };
      #I = (t, e, i) => {
      };
      #N = (t, e, i, s) => {
        if (i || s) throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
        return 0;
      };
      *#A({ allowStale: t = this.allowStale } = {}) {
        if (this.#n) for (let e = this.#h; this.#V(e) && ((t || !this.#p(e)) && (yield e), e !== this.#a); ) e = this.#u[e];
      }
      *#z({ allowStale: t = this.allowStale } = {}) {
        if (this.#n) for (let e = this.#a; this.#V(e) && ((t || !this.#p(e)) && (yield e), e !== this.#h); ) e = this.#l[e];
      }
      #V(t) {
        return t !== void 0 && this.#s.get(this.#i[t]) === t;
      }
      *entries() {
        for (let t of this.#A()) this.#t[t] !== void 0 && this.#i[t] !== void 0 && !this.#e(this.#t[t]) && (yield [this.#i[t], this.#t[t]]);
      }
      *rentries() {
        for (let t of this.#z()) this.#t[t] !== void 0 && this.#i[t] !== void 0 && !this.#e(this.#t[t]) && (yield [this.#i[t], this.#t[t]]);
      }
      *keys() {
        for (let t of this.#A()) {
          let e = this.#i[t];
          e !== void 0 && !this.#e(this.#t[t]) && (yield e);
        }
      }
      *rkeys() {
        for (let t of this.#z()) {
          let e = this.#i[t];
          e !== void 0 && !this.#e(this.#t[t]) && (yield e);
        }
      }
      *values() {
        for (let t of this.#A()) this.#t[t] !== void 0 && !this.#e(this.#t[t]) && (yield this.#t[t]);
      }
      *rvalues() {
        for (let t of this.#z()) this.#t[t] !== void 0 && !this.#e(this.#t[t]) && (yield this.#t[t]);
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      [Symbol.toStringTag] = "LRUCache";
      find(t, e = {}) {
        for (let i of this.#A()) {
          let s = this.#t[i], n = this.#e(s) ? s.__staleWhileFetching : s;
          if (n !== void 0 && t(n, this.#i[i], this)) return this.#L(this.#i[i], e);
        }
      }
      forEach(t, e = this) {
        for (let i of this.#A()) {
          let s = this.#t[i], n = this.#e(s) ? s.__staleWhileFetching : s;
          n !== void 0 && t.call(e, n, this.#i[i], this);
        }
      }
      rforEach(t, e = this) {
        for (let i of this.#z()) {
          let s = this.#t[i], n = this.#e(s) ? s.__staleWhileFetching : s;
          n !== void 0 && t.call(e, n, this.#i[i], this);
        }
      }
      purgeStale() {
        let t = false;
        for (let e of this.#z({ allowStale: true })) this.#p(e) && (this.#v(this.#i[e], "expire"), t = true);
        return t;
      }
      info(t) {
        let e = this.#s.get(t);
        if (e === void 0) return;
        let i = this.#t[e], s = this.#e(i) ? i.__staleWhileFetching : i;
        if (s === void 0) return;
        let n = { value: s };
        if (this.#d && this.#F) {
          let o = this.#d[e], l = this.#F[e];
          if (o && l) {
            let h = o - (this.#w.now() - l);
            n.ttl = h, n.start = Date.now();
          }
        }
        return this.#y && (n.size = this.#y[e]), n;
      }
      dump() {
        let t = [];
        for (let e of this.#A({ allowStale: true })) {
          let i = this.#i[e], s = this.#t[e], n = this.#e(s) ? s.__staleWhileFetching : s;
          if (n === void 0 || i === void 0) continue;
          let o = { value: n };
          if (this.#d && this.#F) {
            o.ttl = this.#d[e];
            let l = this.#w.now() - this.#F[e];
            o.start = Math.floor(Date.now() - l);
          }
          this.#y && (o.size = this.#y[e]), t.unshift([i, o]);
        }
        return t;
      }
      load(t) {
        this.clear();
        for (let [e, i] of t) {
          if (i.start) {
            let s = Date.now() - i.start;
            i.start = this.#w.now() - s;
          }
          this.#O(e, i.value, i);
        }
      }
      set(t, e, i = {}) {
        let { status: s = g.metrics.hasSubscribers ? {} : void 0 } = i;
        i.status = s, s && (s.op = "set", s.key = t, e !== void 0 && (s.value = e), s.cache = this);
        let n = this.#O(t, e, i);
        return s && g.metrics.hasSubscribers && g.metrics.publish(s), n;
      }
      #O(t, e, i, s) {
        let { ttl: n = this.ttl, start: o, noDisposeOnSet: l = this.noDisposeOnSet, sizeCalculation: h = this.sizeCalculation, status: r } = i, c = this.#e(e);
        if (e === void 0) return r && (r.set = "deleted"), this.delete(t), this;
        let { noUpdateTTL: w = this.noUpdateTTL } = i;
        r && !c && (r.value = e);
        let y = this.#N(t, e, i.size || 0, h, r);
        if (this.maxEntrySize && y > this.maxEntrySize) return this.#v(t, "set"), r && (r.set = "miss", r.maxEntrySizeExceeded = true), this;
        let d = this.#n === 0 ? void 0 : this.#s.get(t);
        if (d === void 0) d = this.#n === 0 ? this.#h : this.#_.length !== 0 ? this.#_.pop() : this.#n === this.#o ? this.#P(false) : this.#n, this.#i[d] = t, this.#t[d] = e, this.#s.set(t, d), this.#l[this.#h] = d, this.#u[d] = this.#h, this.#h = d, this.#n++, this.#I(d, y, r), r && (r.set = "add"), w = false, this.#R && !c && this.#W?.(e, t, "add");
        else {
          this.#M(d);
          let p = this.#t[d];
          if (e !== p) {
            if (!l) if (this.#e(p)) {
              p !== s && p.__abortController.abort(new Error("replaced"));
              let { __staleWhileFetching: f } = p;
              f !== void 0 && f !== e && (this.#T && this.#m?.(f, t, "set"), this.#f && this.#r?.push([f, t, "set"]));
            } else this.#T && this.#m?.(p, t, "set"), this.#f && this.#r?.push([p, t, "set"]);
            if (this.#C(d), this.#I(d, y, r), this.#t[d] = e, !c) {
              let f = p && this.#e(p) ? p.__staleWhileFetching : p, _ = f === void 0 ? "add" : e !== f ? "replace" : "update";
              r && (r.set = _, f !== void 0 && (r.oldValue = f)), this.#R && this.onInsert?.(e, t, _);
            }
          } else c || (r && (r.set = "update"), this.#R && this.onInsert?.(e, t, "update"));
        }
        if (n !== 0 && !this.#d && this.#k(), this.#d && (w || this.#H(d, n, o), r && this.#E(r, d)), !l && this.#f && this.#r) {
          let p = this.#r, f;
          for (; f = p?.shift(); ) this.#S?.(...f);
        }
        return this;
      }
      pop() {
        try {
          for (; this.#n; ) {
            let t = this.#t[this.#a];
            if (this.#P(true), this.#e(t)) {
              if (t.__staleWhileFetching) return t.__staleWhileFetching;
            } else if (t !== void 0) return t;
          }
        } finally {
          if (this.#f && this.#r) {
            let t = this.#r, e;
            for (; e = t?.shift(); ) this.#S?.(...e);
          }
        }
      }
      #P(t) {
        let e = this.#a, i = this.#i[e], s = this.#t[e], n = this.#e(s);
        n && s.__abortController.abort(new Error("evicted"));
        let o = n ? s.__staleWhileFetching : s;
        return (this.#T || this.#f) && o !== void 0 && (this.#T && this.#m?.(o, i, "evict"), this.#f && this.#r?.push([o, i, "evict"])), this.#C(e), this.#g?.[e] && (clearTimeout(this.#g[e]), this.#g[e] = void 0), t && (this.#i[e] = void 0, this.#t[e] = void 0, this.#_.push(e)), this.#n === 1 ? (this.#a = this.#h = 0, this.#_.length = 0) : this.#a = this.#l[e], this.#s.delete(i), this.#n--, e;
      }
      has(t, e = {}) {
        let { status: i = g.metrics.hasSubscribers ? {} : void 0 } = e;
        e.status = i, i && (i.op = "has", i.key = t, i.cache = this);
        let s = this.#Y(t, e);
        return g.metrics.hasSubscribers && g.metrics.publish(i), s;
      }
      #Y(t, e = {}) {
        let { updateAgeOnHas: i = this.updateAgeOnHas, status: s } = e, n = this.#s.get(t);
        if (n !== void 0) {
          let o = this.#t[n];
          if (this.#e(o) && o.__staleWhileFetching === void 0) return false;
          if (this.#p(n)) s && (s.has = "stale", this.#E(s, n));
          else return i && this.#D(n), s && (s.has = "hit", this.#E(s, n)), true;
        } else s && (s.has = "miss");
        return false;
      }
      peek(t, e = {}) {
        let { status: i = C() ? {} : void 0 } = e;
        i && (i.op = "peek", i.key = t, i.cache = this), e.status = i;
        let s = this.#J(t, e);
        return g.metrics.hasSubscribers && g.metrics.publish(i), s;
      }
      #J(t, e) {
        let { status: i, allowStale: s = this.allowStale } = e, n = this.#s.get(t);
        if (n === void 0 || !s && this.#p(n)) {
          i && (i.peek = n === void 0 ? "miss" : "stale");
          return;
        }
        let o = this.#t[n], l = this.#e(o) ? o.__staleWhileFetching : o;
        return i && (l !== void 0 ? (i.peek = "hit", i.value = l) : i.peek = "miss"), l;
      }
      #G(t, e, i, s) {
        let n = e === void 0 ? void 0 : this.#t[e];
        if (this.#e(n)) return n;
        let o = new AbortController(), { signal: l } = i;
        l?.addEventListener("abort", () => o.abort(l.reason), { signal: o.signal });
        let h = { signal: o.signal, options: i, context: s }, r = (f, _ = false) => {
          let { aborted: a } = o.signal, S = i.ignoreFetchAbort && f !== void 0, F = i.ignoreFetchAbort || !!(i.allowStaleOnFetchAbort && f !== void 0);
          if (i.status && (a && !_ ? (i.status.fetchAborted = true, i.status.fetchError = o.signal.reason, S && (i.status.fetchAbortIgnored = true)) : i.status.fetchResolved = true), a && !S && !_) return w(o.signal.reason, F);
          let b = d, m = this.#t[e];
          return (m === d || m === void 0 && S && _) && (f === void 0 ? b.__staleWhileFetching !== void 0 ? this.#t[e] = b.__staleWhileFetching : this.#v(t, "fetch") : (i.status && (i.status.fetchUpdated = true), this.#O(t, f, h.options, b))), f;
        }, c = (f) => (i.status && (i.status.fetchRejected = true, i.status.fetchError = f), w(f, false)), w = (f, _) => {
          let { aborted: a } = o.signal, S = a && i.allowStaleOnFetchAbort, F = S || i.allowStaleOnFetchRejection, b = F || i.noDeleteOnFetchRejection, m = d;
          if (this.#t[e] === d && (!b || !_ && m.__staleWhileFetching === void 0 ? this.#v(t, "fetch") : S || (this.#t[e] = m.__staleWhileFetching)), F) return i.status && m.__staleWhileFetching !== void 0 && (i.status.returnedStale = true), m.__staleWhileFetching;
          if (m.__returned === m) throw f;
        }, y = (f, _) => {
          let a = this.#x?.(t, n, h);
          o.signal.addEventListener("abort", () => {
            (!i.ignoreFetchAbort || i.allowStaleOnFetchAbort) && (f(void 0), i.allowStaleOnFetchAbort && (f = (S) => r(S, true)));
          }), a && a instanceof Promise ? a.then((S) => f(S === void 0 ? void 0 : S), _) : a !== void 0 && f(a);
        };
        i.status && (i.status.fetchDispatched = true);
        let d = new Promise(y).then(r, c), p = Object.assign(d, { __abortController: o, __staleWhileFetching: n, __returned: void 0 });
        return e === void 0 ? (this.#O(t, p, { ...h.options, status: void 0 }), e = this.#s.get(t)) : this.#t[e] = p, p;
      }
      #e(t) {
        if (!this.#U) return false;
        let e = t;
        return !!e && e instanceof Promise && e.hasOwnProperty("__staleWhileFetching") && e.__abortController instanceof AbortController;
      }
      fetch(t, e = {}) {
        let i = g.tracing.hasSubscribers, { status: s = C() ? {} : void 0 } = e;
        e.status = s, s && e.context && (s.context = e.context);
        let n = this.#q(t, e);
        return s && i && (s.trace = true, g.tracing.tracePromise(() => n, s).catch(() => {
        })), n;
      }
      async #q(t, e = {}) {
        let { allowStale: i = this.allowStale, updateAgeOnGet: s = this.updateAgeOnGet, noDeleteOnStaleGet: n = this.noDeleteOnStaleGet, ttl: o = this.ttl, noDisposeOnSet: l = this.noDisposeOnSet, size: h = 0, sizeCalculation: r = this.sizeCalculation, noUpdateTTL: c = this.noUpdateTTL, noDeleteOnFetchRejection: w = this.noDeleteOnFetchRejection, allowStaleOnFetchRejection: y = this.allowStaleOnFetchRejection, ignoreFetchAbort: d = this.ignoreFetchAbort, allowStaleOnFetchAbort: p = this.allowStaleOnFetchAbort, context: f, forceRefresh: _ = false, status: a, signal: S } = e;
        if (a && (a.op = "fetch", a.key = t, _ && (a.forceRefresh = true), a.cache = this), !this.#U) return a && (a.fetch = "get"), this.#L(t, { allowStale: i, updateAgeOnGet: s, noDeleteOnStaleGet: n, status: a });
        let F = { allowStale: i, updateAgeOnGet: s, noDeleteOnStaleGet: n, ttl: o, noDisposeOnSet: l, size: h, sizeCalculation: r, noUpdateTTL: c, noDeleteOnFetchRejection: w, allowStaleOnFetchRejection: y, allowStaleOnFetchAbort: p, ignoreFetchAbort: d, status: a, signal: S }, b = this.#s.get(t);
        if (b === void 0) {
          a && (a.fetch = "miss");
          let m = this.#G(t, b, F, f);
          return m.__returned = m;
        } else {
          let m = this.#t[b];
          if (this.#e(m)) {
            let E = i && m.__staleWhileFetching !== void 0;
            return a && (a.fetch = "inflight", E && (a.returnedStale = true)), E ? m.__staleWhileFetching : m.__returned = m;
          }
          let A = this.#p(b);
          if (!_ && !A) return a && (a.fetch = "hit"), this.#M(b), s && this.#D(b), a && this.#E(a, b), m;
          let z = this.#G(t, b, F, f), v = z.__staleWhileFetching !== void 0 && i;
          return a && (a.fetch = A ? "stale" : "refresh", v && A && (a.returnedStale = true)), v ? z.__staleWhileFetching : z.__returned = z;
        }
      }
      forceFetch(t, e = {}) {
        let i = g.tracing.hasSubscribers, { status: s = C() ? {} : void 0 } = e;
        e.status = s, s && e.context && (s.context = e.context);
        let n = this.#K(t, e);
        return s && i && (s.trace = true, g.tracing.tracePromise(() => n, s).catch(() => {
        })), n;
      }
      async #K(t, e = {}) {
        let i = await this.#q(t, e);
        if (i === void 0) throw new Error("fetch() returned undefined");
        return i;
      }
      memo(t, e = {}) {
        let { status: i = g.metrics.hasSubscribers ? {} : void 0 } = e;
        e.status = i, i && (i.op = "memo", i.key = t, e.context && (i.context = e.context), i.cache = this);
        let s = this.#Q(t, e);
        return i && (i.value = s), g.metrics.hasSubscribers && g.metrics.publish(i), s;
      }
      #Q(t, e = {}) {
        let i = this.#j;
        if (!i) throw new Error("no memoMethod provided to constructor");
        let { context: s, status: n, forceRefresh: o, ...l } = e;
        n && o && (n.forceRefresh = true);
        let h = this.#L(t, l), r = o || h === void 0;
        if (n && (n.memo = r ? "miss" : "hit", r || (n.value = h)), !r) return h;
        let c = i(t, h, { options: l, context: s });
        return n && (n.value = c), this.#O(t, c, l), c;
      }
      get(t, e = {}) {
        let { status: i = g.metrics.hasSubscribers ? {} : void 0 } = e;
        e.status = i, i && (i.op = "get", i.key = t, i.cache = this);
        let s = this.#L(t, e);
        return i && (s !== void 0 && (i.value = s), g.metrics.hasSubscribers && g.metrics.publish(i)), s;
      }
      #L(t, e = {}) {
        let { allowStale: i = this.allowStale, updateAgeOnGet: s = this.updateAgeOnGet, noDeleteOnStaleGet: n = this.noDeleteOnStaleGet, status: o } = e, l = this.#s.get(t);
        if (l === void 0) {
          o && (o.get = "miss");
          return;
        }
        let h = this.#t[l], r = this.#e(h);
        return o && this.#E(o, l), this.#p(l) ? r ? (o && (o.get = "stale-fetching"), i && h.__staleWhileFetching !== void 0 ? (o && (o.returnedStale = true), h.__staleWhileFetching) : void 0) : (n || this.#v(t, "expire"), o && (o.get = "stale"), i ? (o && (o.returnedStale = true), h) : void 0) : (o && (o.get = r ? "fetching" : "hit"), this.#M(l), s && this.#D(l), r ? h.__staleWhileFetching : h);
      }
      #B(t, e) {
        this.#u[e] = t, this.#l[t] = e;
      }
      #M(t) {
        t !== this.#h && (t === this.#a ? this.#a = this.#l[t] : this.#B(this.#u[t], this.#l[t]), this.#B(this.#h, t), this.#h = t);
      }
      delete(t) {
        return this.#v(t, "delete");
      }
      #v(t, e) {
        g.metrics.hasSubscribers && g.metrics.publish({ op: "delete", delete: e, key: t, cache: this });
        let i = false;
        if (this.#n !== 0) {
          let s = this.#s.get(t);
          if (s !== void 0) if (this.#g?.[s] && (clearTimeout(this.#g[s]), this.#g[s] = void 0), i = true, this.#n === 1) this.#$(e);
          else {
            this.#C(s);
            let n = this.#t[s];
            if (this.#e(n) ? n.__abortController.abort(new Error("deleted")) : (this.#T || this.#f) && (this.#T && this.#m?.(n, t, e), this.#f && this.#r?.push([n, t, e])), this.#s.delete(t), this.#i[s] = void 0, this.#t[s] = void 0, s === this.#h) this.#h = this.#u[s];
            else if (s === this.#a) this.#a = this.#l[s];
            else {
              let o = this.#u[s];
              this.#l[o] = this.#l[s];
              let l = this.#l[s];
              this.#u[l] = this.#u[s];
            }
            this.#n--, this.#_.push(s);
          }
        }
        if (this.#f && this.#r?.length) {
          let s = this.#r, n;
          for (; n = s?.shift(); ) this.#S?.(...n);
        }
        return i;
      }
      clear() {
        return this.#$("delete");
      }
      #$(t) {
        for (let e of this.#z({ allowStale: true })) {
          let i = this.#t[e];
          if (this.#e(i)) i.__abortController.abort(new Error("deleted"));
          else {
            let s = this.#i[e];
            this.#T && this.#m?.(i, s, t), this.#f && this.#r?.push([i, s, t]);
          }
        }
        if (this.#s.clear(), this.#t.fill(void 0), this.#i.fill(void 0), this.#d && this.#F) {
          this.#d.fill(0), this.#F.fill(0);
          for (let e of this.#g ?? []) e !== void 0 && clearTimeout(e);
          this.#g?.fill(void 0);
        }
        if (this.#y && this.#y.fill(0), this.#a = 0, this.#h = 0, this.#_.length = 0, this.#b = 0, this.#n = 0, this.#f && this.#r) {
          let e = this.#r, i;
          for (; i = e?.shift(); ) this.#S?.(...i);
        }
      }
    };
    exports.LRUCache = M;
  }
});

// node_modules/jwks-rsa/src/wrappers/cache.js
var require_cache = __commonJS({
  "node_modules/jwks-rsa/src/wrappers/cache.js"(exports, module) {
    var logger = __require("debug")("jwks");
    var memoizer = __require("lru-memoizer");
    var { LRUCache } = require_index_min();
    var { promisify, callbackify } = __require("util");
    function cacheWrapper(client, { cacheMaxEntries = 5, cacheMaxAge = 6e5, cacheMaxAgeFallback, onStaleCacheFallback }) {
      logger(`Configured caching of signing keys. Max: ${cacheMaxEntries} / Age: ${cacheMaxAge}${cacheMaxAgeFallback ? ` / Fallback: ${cacheMaxAgeFallback}` : ""}`);
      let load;
      if (cacheMaxAgeFallback) {
        const staleCache = new LRUCache({ max: cacheMaxEntries });
        const getSigningKey = client.getSigningKey.bind(client);
        load = callbackify(async (kid) => {
          try {
            const key = await getSigningKey(kid);
            staleCache.set(kid, { key, fetchedAt: Date.now() });
            return key;
          } catch (err) {
            if (err.isEndpointUnavailable) {
              const stale = staleCache.get(kid);
              if (stale && Date.now() - stale.fetchedAt < cacheMaxAge + cacheMaxAgeFallback) {
                logger(`JWKS endpoint unavailable, serving stale signing key for '${kid}': ${err.message}`);
                if (onStaleCacheFallback) {
                  onStaleCacheFallback(err, kid, stale.key);
                }
                return stale.key;
              }
              logger(`JWKS endpoint unavailable and no valid stale entry for '${kid}', fallback window expired or key never fetched`);
            }
            throw err;
          }
        });
      } else {
        load = callbackify(client.getSigningKey.bind(client));
      }
      return promisify(memoizer({
        hash: (kid) => kid,
        load,
        ttl: cacheMaxAge,
        max: cacheMaxEntries
      }));
    }
    module.exports.default = cacheWrapper;
  }
});

// node_modules/jwks-rsa/src/errors/JwksRateLimitError.js
var require_JwksRateLimitError = __commonJS({
  "node_modules/jwks-rsa/src/errors/JwksRateLimitError.js"(exports, module) {
    function JwksRateLimitError(message2) {
      Error.call(this, message2);
      Error.captureStackTrace(this, this.constructor);
      this.name = "JwksRateLimitError";
      this.message = message2;
    }
    JwksRateLimitError.prototype = Object.create(Error.prototype);
    JwksRateLimitError.prototype.constructor = JwksRateLimitError;
    module.exports = JwksRateLimitError;
  }
});

// node_modules/jwks-rsa/src/wrappers/rateLimit.js
var require_rateLimit = __commonJS({
  "node_modules/jwks-rsa/src/wrappers/rateLimit.js"(exports, module) {
    var logger = __require("debug")("jwks");
    var { RateLimiter } = __require("limiter");
    var JwksRateLimitError = require_JwksRateLimitError();
    function rateLimitWrapper(client, { jwksRequestsPerMinute = 10 }) {
      const getSigningKey = client.getSigningKey.bind(client);
      const limiter = new RateLimiter(jwksRequestsPerMinute, "minute", true);
      logger(`Configured rate limiting to JWKS endpoint at ${jwksRequestsPerMinute}/minute`);
      return async (kid) => await new Promise((resolve, reject) => {
        limiter.removeTokens(1, async (err, remaining) => {
          if (err) {
            reject(err);
          }
          logger("Requests to the JWKS endpoint available for the next minute:", remaining);
          if (remaining < 0) {
            logger("Too many requests to the JWKS endpoint");
            reject(new JwksRateLimitError("Too many requests to the JWKS endpoint"));
          } else {
            try {
              const key = await getSigningKey(kid);
              resolve(key);
            } catch (error) {
              reject(error);
            }
          }
        });
      });
    }
    module.exports.default = rateLimitWrapper;
  }
});

// node_modules/jwks-rsa/src/wrappers/interceptor.js
var require_interceptor = __commonJS({
  "node_modules/jwks-rsa/src/wrappers/interceptor.js"(exports, module) {
    var retrieveSigningKeys = require_utils2().retrieveSigningKeys;
    function getKeysInterceptor(client, { getKeysInterceptor: getKeysInterceptor2 }) {
      const getSigningKey = client.getSigningKey.bind(client);
      return async (kid) => {
        const keys = await getKeysInterceptor2();
        let signingKeys;
        if (keys && keys.length) {
          signingKeys = await retrieveSigningKeys(keys);
        }
        if (signingKeys && signingKeys.length) {
          const key = signingKeys.find((k) => !kid || k.kid === kid);
          if (key) {
            return key;
          }
        }
        return getSigningKey(kid);
      };
    }
    module.exports.default = getKeysInterceptor;
  }
});

// node_modules/jwks-rsa/src/wrappers/callbackSupport.js
var require_callbackSupport = __commonJS({
  "node_modules/jwks-rsa/src/wrappers/callbackSupport.js"(exports, module) {
    var { callbackify } = __require("util");
    var callbackSupport = (client) => {
      const getSigningKey = client.getSigningKey.bind(client);
      return (kid, cb) => {
        if (cb) {
          const callbackFunc = callbackify(getSigningKey);
          return callbackFunc(kid, cb);
        }
        return getSigningKey(kid);
      };
    };
    module.exports.default = callbackSupport;
  }
});

// node_modules/jwks-rsa/src/wrappers/index.js
var require_wrappers = __commonJS({
  "node_modules/jwks-rsa/src/wrappers/index.js"(exports, module) {
    module.exports = {
      request: require_request().default,
      cacheSigningKey: require_cache().default,
      rateLimitSigningKey: require_rateLimit().default,
      getKeysInterceptor: require_interceptor().default,
      callbackSupport: require_callbackSupport().default
    };
  }
});

// node_modules/jwks-rsa/src/errors/SigningKeyNotFoundError.js
var require_SigningKeyNotFoundError = __commonJS({
  "node_modules/jwks-rsa/src/errors/SigningKeyNotFoundError.js"(exports, module) {
    function SigningKeyNotFoundError(message2) {
      Error.call(this, message2);
      Error.captureStackTrace(this, this.constructor);
      this.name = "SigningKeyNotFoundError";
      this.message = message2;
    }
    SigningKeyNotFoundError.prototype = Object.create(Error.prototype);
    SigningKeyNotFoundError.prototype.constructor = SigningKeyNotFoundError;
    module.exports = SigningKeyNotFoundError;
  }
});

// node_modules/jwks-rsa/src/JwksClient.js
var require_JwksClient = __commonJS({
  "node_modules/jwks-rsa/src/JwksClient.js"(exports, module) {
    var logger = __require("debug")("jwks");
    var { retrieveSigningKeys } = require_utils2();
    var { request, cacheSigningKey, rateLimitSigningKey, getKeysInterceptor, callbackSupport } = require_wrappers();
    var JwksError = require_JwksError();
    var SigningKeyNotFoundError = require_SigningKeyNotFoundError();
    var JwksClient = class {
      constructor(options) {
        this.options = {
          rateLimit: false,
          cache: true,
          timeout: 3e4,
          ...options
        };
        if (this.options.getKeysInterceptor) {
          this.getSigningKey = getKeysInterceptor(this, options);
        }
        if (this.options.rateLimit) {
          this.getSigningKey = rateLimitSigningKey(this, options);
        }
        if (this.options.cache) {
          this.getSigningKey = cacheSigningKey(this, options);
        }
        this.getSigningKey = callbackSupport(this, options);
      }
      async getKeys() {
        logger(`Fetching keys from '${this.options.jwksUri}'`);
        try {
          const res = await request({
            uri: this.options.jwksUri,
            headers: this.options.requestHeaders,
            agent: this.options.requestAgent,
            timeout: this.options.timeout,
            fetcher: this.options.fetcher
          });
          logger("Keys:", res.keys);
          return res.keys;
        } catch (err) {
          const { errorMsg } = err;
          logger("Failure:", errorMsg || err);
          const error = errorMsg ? new JwksError(errorMsg) : err;
          error.isEndpointUnavailable = true;
          throw error;
        }
      }
      async getSigningKeys() {
        const keys = await this.getKeys();
        if (!keys || !keys.length) {
          throw new JwksError("The JWKS endpoint did not contain any keys");
        }
        const signingKeys = await retrieveSigningKeys(keys);
        if (!signingKeys.length) {
          throw new JwksError("The JWKS endpoint did not contain any signing keys");
        }
        logger("Signing Keys:", signingKeys);
        return signingKeys;
      }
      async getSigningKey(kid) {
        logger(`Fetching signing key for '${kid}'`);
        const keys = await this.getSigningKeys();
        const kidDefined = kid !== void 0 && kid !== null;
        if (!kidDefined && keys.length > 1) {
          logger("No KID specified and JWKS endpoint returned more than 1 key");
          throw new SigningKeyNotFoundError("No KID specified and JWKS endpoint returned more than 1 key");
        }
        const key = keys.find((k) => !kidDefined || k.kid === kid);
        if (key) {
          return key;
        } else {
          logger(`Unable to find a signing key that matches '${kid}'`);
          throw new SigningKeyNotFoundError(`Unable to find a signing key that matches '${kid}'`);
        }
      }
    };
    module.exports = {
      JwksClient
    };
  }
});

// node_modules/jwks-rsa/src/errors/index.js
var require_errors = __commonJS({
  "node_modules/jwks-rsa/src/errors/index.js"(exports, module) {
    module.exports = {
      ArgumentError: require_ArgumentError(),
      JwksError: require_JwksError(),
      JwksRateLimitError: require_JwksRateLimitError(),
      SigningKeyNotFoundError: require_SigningKeyNotFoundError()
    };
  }
});

// node_modules/jwks-rsa/src/integrations/config.js
var require_config = __commonJS({
  "node_modules/jwks-rsa/src/integrations/config.js"(exports, module) {
    var allowedSignatureAlg = [
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
      "ES256",
      "ES384",
      "ES512",
      "EdDSA"
    ];
    module.exports = allowedSignatureAlg;
  }
});

// node_modules/jwks-rsa/src/integrations/hapi.js
var require_hapi = __commonJS({
  "node_modules/jwks-rsa/src/integrations/hapi.js"(exports, module) {
    var { ArgumentError } = require_errors();
    var { JwksClient } = require_JwksClient();
    var supportedAlg = require_config();
    var handleSigningKeyError = (err, cb) => {
      if (err && err.name === "SigningKeyNotFoundError") {
        return cb(err, null, null);
      }
      if (err) {
        return cb(err, null, null);
      }
    };
    module.exports.hapiJwt2KeyAsync = (options) => {
      const secretProvider = module.exports.hapiJwt2Key(options);
      return function(decoded) {
        return new Promise((resolve, reject) => {
          const cb = (err, key) => {
            !key || err ? reject(err) : resolve({ key });
          };
          secretProvider(decoded, cb);
        });
      };
    };
    module.exports.hapiJwt2Key = function(options) {
      if (options === null || options === void 0) {
        throw new ArgumentError("An options object must be provided when initializing hapiJwt2Key");
      }
      const client = new JwksClient(options);
      const onError = options.handleSigningKeyError || handleSigningKeyError;
      return function secretProvider(decoded, cb) {
        if (!decoded || !decoded.header) {
          return cb(new Error("Cannot find a signing certificate if there is no header"), null, null);
        }
        if (!supportedAlg.includes(decoded.header.alg)) {
          return cb(new Error("Unsupported algorithm " + decoded.header.alg + " supplied."), null, null);
        }
        client.getSigningKey(decoded.header.kid).then((key) => {
          return cb(null, key.publicKey || key.rsaPublicKey, key);
        }).catch((err) => {
          return onError(err, (newError) => cb(newError, null, null));
        });
      };
    };
  }
});

// node_modules/jwks-rsa/src/integrations/express.js
var require_express = __commonJS({
  "node_modules/jwks-rsa/src/integrations/express.js"(exports, module) {
    var { ArgumentError } = require_errors();
    var { JwksClient } = require_JwksClient();
    var supportedAlg = require_config();
    var handleSigningKeyError = (err, cb) => {
      if (err && err.name === "SigningKeyNotFoundError") {
        return cb(null);
      }
      if (err) {
        return cb(err);
      }
    };
    module.exports.expressJwtSecret = function(options) {
      if (options === null || options === void 0) {
        throw new ArgumentError("An options object must be provided when initializing expressJwtSecret");
      }
      const client = new JwksClient(options);
      const onError = options.handleSigningKeyError || handleSigningKeyError;
      const expressJwt7Provider = async (req, token) => {
        if (!token) {
          return;
        }
        const header = token.header;
        if (!header || !supportedAlg.includes(header.alg)) {
          return;
        }
        try {
          const key = await client.getSigningKey(header.kid);
          return key.publicKey || key.rsaPublicKey;
        } catch (err) {
          return new Promise((resolve, reject) => {
            onError(err, (newError) => {
              if (!newError) {
                return resolve();
              }
              reject(newError);
            });
          });
        }
      };
      return function secretProvider(req, header, payload, cb) {
        if (arguments.length === 4) {
          expressJwt7Provider(req, { header }).then((key) => {
            setImmediate(cb, null, key);
          }).catch((err) => {
            setImmediate(cb, err);
          });
          return;
        }
        return expressJwt7Provider(req, arguments[1]);
      };
    };
  }
});

// node_modules/jwks-rsa/src/integrations/koa.js
var require_koa = __commonJS({
  "node_modules/jwks-rsa/src/integrations/koa.js"(exports, module) {
    var { ArgumentError } = require_errors();
    var { JwksClient } = require_JwksClient();
    var supportedAlg = require_config();
    module.exports.koaJwtSecret = function(options = {}) {
      if (!options.jwksUri) {
        throw new ArgumentError("No JWKS provided. Please provide a jwksUri");
      }
      const client = new JwksClient(options);
      return function secretProvider({ alg, kid } = {}) {
        return new Promise((resolve, reject) => {
          if (!supportedAlg.includes(alg)) {
            return reject(new Error("Missing / invalid token algorithm"));
          }
          client.getSigningKey(kid).then((key) => {
            resolve(key.publicKey || key.rsaPublicKey);
          }).catch((err) => {
            if (options.handleSigningKeyError) {
              return options.handleSigningKeyError(err).then(reject);
            }
            return reject(err);
          });
        });
      };
    };
  }
});

// node_modules/jwks-rsa/src/integrations/passport.js
var require_passport = __commonJS({
  "node_modules/jwks-rsa/src/integrations/passport.js"(exports, module) {
    var jose = (init_webapi(), __toCommonJS(webapi_exports));
    var { ArgumentError } = require_errors();
    var { JwksClient } = require_JwksClient();
    var supportedAlg = require_config();
    var handleSigningKeyError = (err, cb) => {
      if (err && err.name === "SigningKeyNotFoundError") {
        return cb(null);
      }
      if (err) {
        return cb(err);
      }
    };
    module.exports.passportJwtSecret = function(options) {
      if (options === null || options === void 0) {
        throw new ArgumentError("An options object must be provided when initializing passportJwtSecret");
      }
      if (!options.jwksUri) {
        throw new ArgumentError("No JWKS provided. Please provide a jwksUri");
      }
      const client = new JwksClient(options);
      const onError = options.handleSigningKeyError || handleSigningKeyError;
      return function secretProvider(req, rawJwtToken, cb) {
        let decoded;
        try {
          decoded = {
            payload: jose.decodeJwt(rawJwtToken),
            header: jose.decodeProtectedHeader(rawJwtToken)
          };
        } catch (err) {
          decoded = null;
        }
        if (!decoded || !supportedAlg.includes(decoded.header.alg)) {
          return cb(null, null);
        }
        client.getSigningKey(decoded.header.kid).then((key) => {
          cb(null, key.publicKey || key.rsaPublicKey);
        }).catch((err) => {
          onError(err, (newError) => cb(newError, null));
        });
      };
    };
  }
});

// node_modules/jwks-rsa/src/index.js
var require_src = __commonJS({
  "node_modules/jwks-rsa/src/index.js"(exports, module) {
    var { JwksClient } = require_JwksClient();
    var errors = require_errors();
    var { hapiJwt2Key, hapiJwt2KeyAsync } = require_hapi();
    var { expressJwtSecret } = require_express();
    var { koaJwtSecret } = require_koa();
    var { passportJwtSecret } = require_passport();
    module.exports = (options) => {
      return new JwksClient(options);
    };
    module.exports.JwksClient = JwksClient;
    module.exports.ArgumentError = errors.ArgumentError;
    module.exports.JwksError = errors.JwksError;
    module.exports.JwksRateLimitError = errors.JwksRateLimitError;
    module.exports.SigningKeyNotFoundError = errors.SigningKeyNotFoundError;
    module.exports.expressJwtSecret = expressJwtSecret;
    module.exports.hapiJwt2Key = hapiJwt2Key;
    module.exports.hapiJwt2KeyAsync = hapiJwt2KeyAsync;
    module.exports.koaJwtSecret = koaJwtSecret;
    module.exports.passportJwtSecret = passportJwtSecret;
  }
});

// node_modules/firebase-admin/lib/utils/jwt.js
var require_jwt = __commonJS({
  "node_modules/firebase-admin/lib/utils/jwt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JwtErrorCode = exports.JwtError = exports.EmulatorSignatureVerifier = exports.PublicKeySignatureVerifier = exports.UrlKeyFetcher = exports.JwksFetcher = exports.ALGORITHM_ES256 = exports.ALGORITHM_RS256 = void 0;
    exports.verifyJwtSignature = verifyJwtSignature;
    exports.decodeJwt = decodeJwt2;
    var validator = require_validator();
    var jwt = __require("jsonwebtoken");
    var jwks = require_src();
    var api_request_1 = require_api_request();
    exports.ALGORITHM_RS256 = "RS256";
    exports.ALGORITHM_ES256 = "ES256";
    var JWT_CALLBACK_ERROR_PREFIX = "error in secret or public key callback: ";
    var NO_MATCHING_KID_ERROR_MESSAGE = "no-matching-kid-error";
    var NO_KID_IN_HEADER_ERROR_MESSAGE = "no-kid-in-header-error";
    var HOUR_IN_SECONDS = 3600;
    var JwksFetcher = class {
      constructor(jwksUrl, httpAgent) {
        this.publicKeysExpireAt = 0;
        if (!validator.isURL(jwksUrl)) {
          throw new Error("The provided JWKS URL is not a valid URL.");
        }
        this.client = jwks({
          jwksUri: jwksUrl,
          cache: false,
          // disable jwks-rsa LRU cache as the keys are always cached for 6 hours.
          requestAgent: httpAgent
        });
      }
      fetchPublicKeys() {
        if (this.shouldRefresh()) {
          return this.refresh();
        }
        return Promise.resolve(this.publicKeys);
      }
      shouldRefresh() {
        return !this.publicKeys || this.publicKeysExpireAt <= Date.now();
      }
      refresh() {
        return this.client.getSigningKeys().then((signingKeys) => {
          this.publicKeysExpireAt = 0;
          const newKeys = signingKeys.reduce((map, signingKey) => {
            map[signingKey.kid] = signingKey.getPublicKey();
            return map;
          }, {});
          this.publicKeysExpireAt = Date.now() + HOUR_IN_SECONDS * 6 * 1e3;
          this.publicKeys = newKeys;
          return newKeys;
        }).catch((err) => {
          throw new Error(`Error fetching Json Web Keys: ${err.message}`);
        });
      }
    };
    exports.JwksFetcher = JwksFetcher;
    var UrlKeyFetcher = class {
      constructor(clientCertUrl, httpAgent) {
        this.clientCertUrl = clientCertUrl;
        this.httpAgent = httpAgent;
        this.publicKeysExpireAt = 0;
        if (!validator.isURL(clientCertUrl)) {
          throw new Error("The provided public client certificate URL is not a valid URL.");
        }
      }
      /**
       * Fetches the public keys for the Google certs.
       *
       * @returns A promise fulfilled with public keys for the Google certs.
       */
      fetchPublicKeys() {
        if (this.shouldRefresh()) {
          return this.refresh();
        }
        return Promise.resolve(this.publicKeys);
      }
      /**
       * Checks if the cached public keys need to be refreshed.
       *
       * @returns Whether the keys should be fetched from the client certs url or not.
       */
      shouldRefresh() {
        return !this.publicKeys || this.publicKeysExpireAt <= Date.now();
      }
      refresh() {
        const client = new api_request_1.HttpClient();
        const request = {
          method: "GET",
          url: this.clientCertUrl,
          httpAgent: this.httpAgent
        };
        return client.send(request).then((resp) => {
          if (!resp.isJson() || resp.data.error) {
            throw new api_request_1.RequestResponseError(resp);
          }
          this.publicKeysExpireAt = 0;
          if (Object.prototype.hasOwnProperty.call(resp.headers, "cache-control")) {
            const cacheControlHeader = resp.headers["cache-control"];
            const parts = cacheControlHeader.split(",");
            parts.forEach((part) => {
              const subParts = part.trim().split("=");
              if (subParts[0] === "max-age") {
                const maxAge = +subParts[1];
                this.publicKeysExpireAt = Date.now() + maxAge * 1e3;
              }
            });
          }
          this.publicKeys = resp.data;
          return resp.data;
        }).catch((err) => {
          if (err instanceof api_request_1.RequestResponseError) {
            let errorMessage = "Error fetching public keys for Google certs: ";
            const resp = err.response;
            if (resp.isJson() && resp.data.error) {
              errorMessage += `${resp.data.error}`;
              if (resp.data.error_description) {
                errorMessage += " (" + resp.data.error_description + ")";
              }
            } else {
              errorMessage += `${resp.text}`;
            }
            throw new Error(errorMessage);
          }
          throw err;
        });
      }
    };
    exports.UrlKeyFetcher = UrlKeyFetcher;
    var PublicKeySignatureVerifier = class _PublicKeySignatureVerifier {
      constructor(keyFetcher) {
        this.keyFetcher = keyFetcher;
        if (!validator.isNonNullObject(keyFetcher)) {
          throw new Error("The provided key fetcher is not an object or null.");
        }
      }
      static withCertificateUrl(clientCertUrl, httpAgent) {
        return new _PublicKeySignatureVerifier(new UrlKeyFetcher(clientCertUrl, httpAgent));
      }
      static withJwksUrl(jwksUrl, httpAgent) {
        return new _PublicKeySignatureVerifier(new JwksFetcher(jwksUrl, httpAgent));
      }
      verify(token) {
        if (!validator.isString(token)) {
          return Promise.reject(new JwtError(JwtErrorCode.INVALID_ARGUMENT, "The provided token must be a string."));
        }
        return verifyJwtSignature(token, getKeyCallback(this.keyFetcher), { algorithms: [exports.ALGORITHM_RS256, exports.ALGORITHM_ES256] }).catch((error) => {
          if (error.code === JwtErrorCode.NO_KID_IN_HEADER) {
            return this.verifyWithoutKid(token);
          }
          throw error;
        });
      }
      verifyWithoutKid(token) {
        return this.keyFetcher.fetchPublicKeys().then((publicKeys) => this.verifyWithAllKeys(token, publicKeys));
      }
      verifyWithAllKeys(token, keys) {
        const promises = [];
        Object.values(keys).forEach((key) => {
          const result = verifyJwtSignature(token, key).then(() => true).catch((error) => {
            if (error.code === JwtErrorCode.TOKEN_EXPIRED) {
              throw error;
            }
            return false;
          });
          promises.push(result);
        });
        return Promise.all(promises).then((result) => {
          if (result.every((r) => r === false)) {
            throw new JwtError(JwtErrorCode.INVALID_SIGNATURE, "Invalid token signature.");
          }
        });
      }
    };
    exports.PublicKeySignatureVerifier = PublicKeySignatureVerifier;
    var EmulatorSignatureVerifier = class {
      verify(token) {
        return verifyJwtSignature(token, void 0, { algorithms: ["none"] });
      }
    };
    exports.EmulatorSignatureVerifier = EmulatorSignatureVerifier;
    function getKeyCallback(fetcher) {
      return (header, callback) => {
        if (!header.kid) {
          callback(new Error(NO_KID_IN_HEADER_ERROR_MESSAGE));
        }
        const kid = header.kid || "";
        fetcher.fetchPublicKeys().then((publicKeys) => {
          if (!Object.prototype.hasOwnProperty.call(publicKeys, kid)) {
            callback(new Error(NO_MATCHING_KID_ERROR_MESSAGE));
          } else {
            callback(null, publicKeys[kid]);
          }
        }).catch((error) => {
          callback(error);
        });
      };
    }
    function verifyJwtSignature(token, secretOrPublicKey, options) {
      if (!validator.isString(token)) {
        return Promise.reject(new JwtError(JwtErrorCode.INVALID_ARGUMENT, "The provided token must be a string."));
      }
      return new Promise((resolve, reject) => {
        jwt.verify(token, secretOrPublicKey, options, (error) => {
          if (!error) {
            return resolve();
          }
          if (error.name === "TokenExpiredError") {
            return reject(new JwtError(JwtErrorCode.TOKEN_EXPIRED, "The provided token has expired. Get a fresh token from your client app and try again."));
          } else if (error.name === "JsonWebTokenError") {
            if (error.message && error.message.includes(JWT_CALLBACK_ERROR_PREFIX)) {
              const message2 = error.message.split(JWT_CALLBACK_ERROR_PREFIX).pop() || "Error fetching public keys.";
              let code = JwtErrorCode.KEY_FETCH_ERROR;
              if (message2 === NO_MATCHING_KID_ERROR_MESSAGE) {
                code = JwtErrorCode.NO_MATCHING_KID;
              } else if (message2 === NO_KID_IN_HEADER_ERROR_MESSAGE) {
                code = JwtErrorCode.NO_KID_IN_HEADER;
              }
              return reject(new JwtError(code, message2));
            }
          }
          return reject(new JwtError(JwtErrorCode.INVALID_SIGNATURE, error.message));
        });
      });
    }
    function decodeJwt2(jwtToken) {
      if (!validator.isString(jwtToken)) {
        return Promise.reject(new JwtError(JwtErrorCode.INVALID_ARGUMENT, "The provided token must be a string."));
      }
      const fullDecodedToken = jwt.decode(jwtToken, {
        complete: true
      });
      if (!fullDecodedToken) {
        return Promise.reject(new JwtError(JwtErrorCode.INVALID_ARGUMENT, "Decoding token failed."));
      }
      const header = fullDecodedToken?.header;
      const payload = fullDecodedToken?.payload;
      return Promise.resolve({ header, payload });
    }
    var JwtError = class extends Error {
      constructor(code, message2) {
        super(message2);
        this.code = code;
        this.message = message2;
      }
    };
    exports.JwtError = JwtError;
    var JwtErrorCode;
    (function(JwtErrorCode2) {
      JwtErrorCode2["INVALID_ARGUMENT"] = "invalid-argument";
      JwtErrorCode2["INVALID_CREDENTIAL"] = "invalid-credential";
      JwtErrorCode2["TOKEN_EXPIRED"] = "token-expired";
      JwtErrorCode2["INVALID_SIGNATURE"] = "invalid-token";
      JwtErrorCode2["NO_MATCHING_KID"] = "no-matching-kid-error";
      JwtErrorCode2["NO_KID_IN_HEADER"] = "no-kid-error";
      JwtErrorCode2["KEY_FETCH_ERROR"] = "key-fetch-error";
    })(JwtErrorCode || (exports.JwtErrorCode = JwtErrorCode = {}));
  }
});

// node_modules/firebase-admin/lib/auth/token-verifier.js
var require_token_verifier = __commonJS({
  "node_modules/firebase-admin/lib/auth/token-verifier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirebaseTokenVerifier = exports.SESSION_COOKIE_INFO = exports.AUTH_BLOCKING_TOKEN_INFO = exports.ID_TOKEN_INFO = void 0;
    exports.createIdTokenVerifier = createIdTokenVerifier;
    exports.createAuthBlockingTokenVerifier = createAuthBlockingTokenVerifier;
    exports.createSessionCookieVerifier = createSessionCookieVerifier;
    var error_1 = require_error3();
    var util = require_utils();
    var validator = require_validator();
    var jwt_1 = require_jwt();
    var FIREBASE_AUDIENCE = "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
    var CLIENT_CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
    var SESSION_COOKIE_CERT_URL = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";
    var EMULATOR_VERIFIER = new jwt_1.EmulatorSignatureVerifier();
    exports.ID_TOKEN_INFO = {
      url: "https://firebase.google.com/docs/auth/admin/verify-id-tokens",
      verifyApiName: "verifyIdToken()",
      jwtName: "Firebase ID token",
      shortName: "ID token",
      expiredErrorCode: error_1.authClientErrorCode.ID_TOKEN_EXPIRED
    };
    exports.AUTH_BLOCKING_TOKEN_INFO = {
      url: "https://cloud.google.com/identity-platform/docs/blocking-functions",
      verifyApiName: "_verifyAuthBlockingToken()",
      jwtName: "Firebase Auth Blocking token",
      shortName: "Auth Blocking token",
      expiredErrorCode: error_1.authClientErrorCode.AUTH_BLOCKING_TOKEN_EXPIRED
    };
    exports.SESSION_COOKIE_INFO = {
      url: "https://firebase.google.com/docs/auth/admin/manage-cookies",
      verifyApiName: "verifySessionCookie()",
      jwtName: "Firebase session cookie",
      shortName: "session cookie",
      expiredErrorCode: error_1.authClientErrorCode.SESSION_COOKIE_EXPIRED
    };
    var FirebaseTokenVerifier = class {
      constructor(clientCertUrl, issuer, tokenInfo, app) {
        this.issuer = issuer;
        this.tokenInfo = tokenInfo;
        this.app = app;
        if (!validator.isURL(clientCertUrl)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "The provided public client certificate URL is an invalid URL.");
        } else if (!validator.isURL(issuer)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "The provided JWT issuer is an invalid URL.");
        } else if (!validator.isNonNullObject(tokenInfo)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "The provided JWT information is not an object or null.");
        } else if (!validator.isURL(tokenInfo.url)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "The provided JWT verification documentation URL is invalid.");
        } else if (!validator.isNonEmptyString(tokenInfo.verifyApiName)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "The JWT verify API name must be a non-empty string.");
        } else if (!validator.isNonEmptyString(tokenInfo.jwtName)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "The JWT public full name must be a non-empty string.");
        } else if (!validator.isNonEmptyString(tokenInfo.shortName)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "The JWT public short name must be a non-empty string.");
        } else if (!validator.isNonNullObject(tokenInfo.expiredErrorCode) || !("code" in tokenInfo.expiredErrorCode)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "The JWT expiration error code must be a non-null ErrorInfo object.");
        }
        this.shortNameArticle = tokenInfo.shortName.charAt(0).match(/[aeiou]/i) ? "an" : "a";
        this.signatureVerifier = jwt_1.PublicKeySignatureVerifier.withCertificateUrl(clientCertUrl, app.options.httpAgent);
      }
      /**
       * Verifies the format and signature of a Firebase Auth JWT token.
       *
       * @param jwtToken - The Firebase Auth JWT token to verify.
       * @param isEmulator - Whether to accept Auth Emulator tokens.
       * @returns A promise fulfilled with the decoded claims of the Firebase Auth ID token.
       */
      verifyJWT(jwtToken, isEmulator = false) {
        if (!validator.isString(jwtToken)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `First argument to ${this.tokenInfo.verifyApiName} must be a ${this.tokenInfo.jwtName} string.`);
        }
        return this.ensureProjectId().then((projectId) => {
          return this.decodeAndVerify(jwtToken, projectId, isEmulator);
        }).then((decoded) => {
          const decodedIdToken = decoded.payload;
          decodedIdToken.uid = decodedIdToken.sub;
          return decodedIdToken;
        });
      }
      /**
       * @excludeFromDocs
       */
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _verifyAuthBlockingToken(jwtToken, isEmulator, audience) {
        if (!validator.isString(jwtToken)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, `First argument to ${this.tokenInfo.verifyApiName} must be a ${this.tokenInfo.jwtName} string.`);
        }
        return this.ensureProjectId().then((projectId) => {
          if (typeof audience === "undefined") {
            audience = `${projectId}.cloudfunctions.net/`;
          }
          return this.decodeAndVerify(jwtToken, projectId, isEmulator, audience);
        }).then((decoded) => {
          const decodedAuthBlockingToken = decoded.payload;
          decodedAuthBlockingToken.uid = decodedAuthBlockingToken.sub;
          return decodedAuthBlockingToken;
        });
      }
      ensureProjectId() {
        return util.findProjectId(this.app).then((projectId) => {
          if (!validator.isNonEmptyString(projectId)) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CREDENTIAL, `Must initialize app with a cert credential or set your Firebase project ID as the GOOGLE_CLOUD_PROJECT environment variable to call ${this.tokenInfo.verifyApiName}.`);
          }
          return Promise.resolve(projectId);
        });
      }
      decodeAndVerify(token, projectId, isEmulator, audience) {
        return this.safeDecode(token).then((decodedToken) => {
          this.verifyContent(decodedToken, projectId, isEmulator, audience);
          return this.verifySignature(token, isEmulator).then(() => decodedToken);
        });
      }
      safeDecode(jwtToken) {
        return (0, jwt_1.decodeJwt)(jwtToken).catch((err) => {
          if (err.code === jwt_1.JwtErrorCode.INVALID_ARGUMENT) {
            const verifyJwtTokenDocsMessage = ` See ${this.tokenInfo.url} for details on how to retrieve ${this.shortNameArticle} ${this.tokenInfo.shortName}.`;
            const errorMessage = `Decoding ${this.tokenInfo.jwtName} failed. Make sure you passed the entire string JWT which represents ${this.shortNameArticle} ${this.tokenInfo.shortName}.` + verifyJwtTokenDocsMessage;
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, errorMessage);
          }
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, err.message);
        });
      }
      /**
       * Verifies the content of a Firebase Auth JWT.
       *
       * @param fullDecodedToken - The decoded JWT.
       * @param projectId - The Firebase Project Id.
       * @param isEmulator - Whether the token is an Emulator token.
       */
      verifyContent(fullDecodedToken, projectId, isEmulator, audience) {
        const header = fullDecodedToken && fullDecodedToken.header;
        const payload = fullDecodedToken && fullDecodedToken.payload;
        const projectIdMatchMessage = ` Make sure the ${this.tokenInfo.shortName} comes from the same Firebase project as the service account used to authenticate this SDK.`;
        const verifyJwtTokenDocsMessage = ` See ${this.tokenInfo.url} for details on how to retrieve ${this.shortNameArticle} ${this.tokenInfo.shortName}.`;
        let errorMessage;
        if (!isEmulator && typeof header.kid === "undefined") {
          const isCustomToken = payload.aud === FIREBASE_AUDIENCE;
          const isLegacyCustomToken = header.alg === "HS256" && payload.v === 0 && "d" in payload && "uid" in payload.d;
          if (isCustomToken) {
            errorMessage = `${this.tokenInfo.verifyApiName} expects ${this.shortNameArticle} ${this.tokenInfo.shortName}, but was given a custom token.`;
          } else if (isLegacyCustomToken) {
            errorMessage = `${this.tokenInfo.verifyApiName} expects ${this.shortNameArticle} ${this.tokenInfo.shortName}, but was given a legacy custom token.`;
          } else {
            errorMessage = `${this.tokenInfo.jwtName} has no "kid" claim.`;
          }
          errorMessage += verifyJwtTokenDocsMessage;
        } else if (!isEmulator && header.alg !== jwt_1.ALGORITHM_RS256) {
          errorMessage = `${this.tokenInfo.jwtName} has incorrect algorithm. Expected "` + jwt_1.ALGORITHM_RS256 + '" but got "' + header.alg + '".' + verifyJwtTokenDocsMessage;
        } else if (typeof audience !== "undefined" && !payload.aud.includes(audience)) {
          errorMessage = `${this.tokenInfo.jwtName} has incorrect "aud" (audience) claim. Expected "` + audience + '" but got "' + payload.aud + '".' + verifyJwtTokenDocsMessage;
        } else if (typeof audience === "undefined" && payload.aud !== projectId) {
          errorMessage = `${this.tokenInfo.jwtName} has incorrect "aud" (audience) claim. Expected "` + projectId + '" but got "' + payload.aud + '".' + projectIdMatchMessage + verifyJwtTokenDocsMessage;
        } else if (payload.iss !== this.issuer + projectId) {
          errorMessage = `${this.tokenInfo.jwtName} has incorrect "iss" (issuer) claim. Expected "${this.issuer}` + projectId + '" but got "' + payload.iss + '".' + projectIdMatchMessage + verifyJwtTokenDocsMessage;
        } else if (!(payload.event_type !== void 0 && (payload.event_type === "beforeSendSms" || payload.event_type === "beforeSendEmail"))) {
          if (typeof payload.sub !== "string") {
            errorMessage = `${this.tokenInfo.jwtName} has no "sub" (subject) claim.` + verifyJwtTokenDocsMessage;
          } else if (payload.sub === "") {
            errorMessage = `${this.tokenInfo.jwtName} has an empty "sub" (subject) claim.` + verifyJwtTokenDocsMessage;
          } else if (payload.sub.length > 128) {
            errorMessage = `${this.tokenInfo.jwtName} has a "sub" (subject) claim longer than 128 characters.` + verifyJwtTokenDocsMessage;
          }
        }
        if (errorMessage) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, errorMessage);
        }
      }
      verifySignature(jwtToken, isEmulator) {
        const verifier = isEmulator ? EMULATOR_VERIFIER : this.signatureVerifier;
        return verifier.verify(jwtToken).catch((error) => {
          throw this.mapJwtErrorToAuthError(error);
        });
      }
      /**
       * Maps JwtError to FirebaseAuthError
       *
       * @param error - JwtError to be mapped.
       * @returns FirebaseAuthError or Error instance.
       */
      mapJwtErrorToAuthError(error) {
        const verifyJwtTokenDocsMessage = ` See ${this.tokenInfo.url} for details on how to retrieve ${this.shortNameArticle} ${this.tokenInfo.shortName}.`;
        if (error.code === jwt_1.JwtErrorCode.TOKEN_EXPIRED) {
          const errorMessage = `${this.tokenInfo.jwtName} has expired. Get a fresh ${this.tokenInfo.shortName} from your client app and try again (auth/${this.tokenInfo.expiredErrorCode.code}).` + verifyJwtTokenDocsMessage;
          return new error_1.FirebaseAuthError(this.tokenInfo.expiredErrorCode, errorMessage);
        } else if (error.code === jwt_1.JwtErrorCode.INVALID_SIGNATURE) {
          const errorMessage = `${this.tokenInfo.jwtName} has invalid signature.` + verifyJwtTokenDocsMessage;
          return new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, errorMessage);
        } else if (error.code === jwt_1.JwtErrorCode.NO_MATCHING_KID) {
          const errorMessage = `${this.tokenInfo.jwtName} has "kid" claim which does not correspond to a known public key. Most likely the ${this.tokenInfo.shortName} is expired, so get a fresh token from your client app and try again.`;
          return new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, errorMessage);
        }
        return new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, error.message);
      }
    };
    exports.FirebaseTokenVerifier = FirebaseTokenVerifier;
    function createIdTokenVerifier(app) {
      return new FirebaseTokenVerifier(CLIENT_CERT_URL, "https://securetoken.google.com/", exports.ID_TOKEN_INFO, app);
    }
    function createAuthBlockingTokenVerifier(app) {
      return new FirebaseTokenVerifier(CLIENT_CERT_URL, "https://securetoken.google.com/", exports.AUTH_BLOCKING_TOKEN_INFO, app);
    }
    function createSessionCookieVerifier(app) {
      return new FirebaseTokenVerifier(SESSION_COOKIE_CERT_URL, "https://session.firebase.google.com/", exports.SESSION_COOKIE_INFO, app);
    }
  }
});

// node_modules/firebase-admin/lib/auth/user-record.js
var require_user_record = __commonJS({
  "node_modules/firebase-admin/lib/auth/user-record.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserRecord = exports.UserInfo = exports.UserMetadata = exports.MultiFactorSettings = exports.TotpMultiFactorInfo = exports.TotpInfo = exports.PhoneMultiFactorInfo = exports.MultiFactorInfo = void 0;
    var deep_copy_1 = require_deep_copy();
    var validator_1 = require_validator();
    var utils = require_utils();
    var error_1 = require_error3();
    var B64_REDACTED = Buffer.from("REDACTED").toString("base64");
    function parseDate(time) {
      try {
        const date = new Date(parseInt(time, 10));
        if (!isNaN(date.getTime())) {
          return date.toUTCString();
        }
      } catch (e) {
      }
      return null;
    }
    var MultiFactorId;
    (function(MultiFactorId2) {
      MultiFactorId2["Phone"] = "phone";
      MultiFactorId2["Totp"] = "totp";
    })(MultiFactorId || (MultiFactorId = {}));
    var MultiFactorInfo = class {
      /**
       * Initializes the MultiFactorInfo associated subclass using the server side.
       * If no MultiFactorInfo is associated with the response, null is returned.
       *
       * @param response - The server side response.
       * @internal
       */
      static initMultiFactorInfo(response) {
        let multiFactorInfo = null;
        try {
          if (response.phoneInfo !== void 0) {
            multiFactorInfo = new PhoneMultiFactorInfo(response);
          } else if (response.totpInfo !== void 0) {
            multiFactorInfo = new TotpMultiFactorInfo(response);
          } else {
          }
        } catch (e) {
        }
        return multiFactorInfo;
      }
      /**
       * Initializes the MultiFactorInfo object using the server side response.
       *
       * @param response - The server side response.
       * @constructor
       * @internal
       */
      constructor(response) {
        this.initFromServerResponse(response);
      }
      /**
       * Returns a JSON-serializable representation of this object.
       *
       * @returns A JSON-serializable representation of this object.
       */
      toJSON() {
        return {
          uid: this.uid,
          displayName: this.displayName,
          factorId: this.factorId,
          enrollmentTime: this.enrollmentTime
        };
      }
      /**
       * Initializes the MultiFactorInfo object using the provided server response.
       *
       * @param response - The server side response.
       */
      initFromServerResponse(response) {
        const factorId = response && this.getFactorId(response);
        if (!factorId || !response || !response.mfaEnrollmentId) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid multi-factor info response");
        }
        utils.addReadonlyGetter(this, "uid", response.mfaEnrollmentId);
        utils.addReadonlyGetter(this, "factorId", factorId);
        utils.addReadonlyGetter(this, "displayName", response.displayName);
        if (response.enrolledAt) {
          utils.addReadonlyGetter(this, "enrollmentTime", new Date(response.enrolledAt).toUTCString());
        } else {
          utils.addReadonlyGetter(this, "enrollmentTime", null);
        }
      }
    };
    exports.MultiFactorInfo = MultiFactorInfo;
    var PhoneMultiFactorInfo = class extends MultiFactorInfo {
      /**
       * Initializes the PhoneMultiFactorInfo object using the server side response.
       *
       * @param response - The server side response.
       * @constructor
       * @internal
       */
      constructor(response) {
        super(response);
        utils.addReadonlyGetter(this, "phoneNumber", response.phoneInfo);
      }
      /**
       * {@inheritdoc MultiFactorInfo.toJSON}
       */
      toJSON() {
        return Object.assign(super.toJSON(), {
          phoneNumber: this.phoneNumber
        });
      }
      /**
       * Returns the factor ID based on the response provided.
       *
       * @param response - The server side response.
       * @returns The multi-factor ID associated with the provided response. If the response is
       *     not associated with any known multi-factor ID, null is returned.
       *
       * @internal
       */
      getFactorId(response) {
        return response && response.phoneInfo ? MultiFactorId.Phone : null;
      }
    };
    exports.PhoneMultiFactorInfo = PhoneMultiFactorInfo;
    var TotpInfo = class {
    };
    exports.TotpInfo = TotpInfo;
    var TotpMultiFactorInfo = class extends MultiFactorInfo {
      /**
       * Initializes the `TotpMultiFactorInfo` object using the server side response.
       *
       * @param response - The server side response.
       * @constructor
       * @internal
       */
      constructor(response) {
        super(response);
        utils.addReadonlyGetter(this, "totpInfo", response.totpInfo);
      }
      /**
       * {@inheritdoc MultiFactorInfo.toJSON}
       */
      toJSON() {
        return Object.assign(super.toJSON(), {
          totpInfo: this.totpInfo
        });
      }
      /**
       * Returns the factor ID based on the response provided.
       *
       * @param response - The server side response.
       * @returns The multi-factor ID associated with the provided response. If the response is
       *     not associated with any known multi-factor ID, `null` is returned.
       *
       * @internal
       */
      getFactorId(response) {
        return response && response.totpInfo ? MultiFactorId.Totp : null;
      }
    };
    exports.TotpMultiFactorInfo = TotpMultiFactorInfo;
    var MultiFactorSettings = class {
      /**
       * Initializes the `MultiFactor` object using the server side or JWT format response.
       *
       * @param response - The server side response.
       * @constructor
       * @internal
       */
      constructor(response) {
        const parsedEnrolledFactors = [];
        if (!(0, validator_1.isNonNullObject)(response)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid multi-factor response");
        } else if (response.mfaInfo) {
          response.mfaInfo.forEach((factorResponse) => {
            const multiFactorInfo = MultiFactorInfo.initMultiFactorInfo(factorResponse);
            if (multiFactorInfo) {
              parsedEnrolledFactors.push(multiFactorInfo);
            }
          });
        }
        utils.addReadonlyGetter(this, "enrolledFactors", Object.freeze(parsedEnrolledFactors));
      }
      /**
       * Returns a JSON-serializable representation of this multi-factor object.
       *
       * @returns A JSON-serializable representation of this multi-factor object.
       */
      toJSON() {
        return {
          enrolledFactors: this.enrolledFactors.map((info) => info.toJSON())
        };
      }
    };
    exports.MultiFactorSettings = MultiFactorSettings;
    var UserMetadata = class {
      /**
       * @param response - The server side response returned from the `getAccountInfo`
       *     endpoint.
       * @constructor
       * @internal
       */
      constructor(response) {
        utils.addReadonlyGetter(this, "creationTime", parseDate(response.createdAt));
        utils.addReadonlyGetter(this, "lastSignInTime", parseDate(response.lastLoginAt));
        const lastRefreshAt = response.lastRefreshAt ? new Date(response.lastRefreshAt).toUTCString() : null;
        utils.addReadonlyGetter(this, "lastRefreshTime", lastRefreshAt);
      }
      /**
       * Returns a JSON-serializable representation of this object.
       *
       * @returns A JSON-serializable representation of this object.
       */
      toJSON() {
        return {
          lastSignInTime: this.lastSignInTime,
          creationTime: this.creationTime,
          lastRefreshTime: this.lastRefreshTime
        };
      }
    };
    exports.UserMetadata = UserMetadata;
    var UserInfo = class {
      /**
       * @param response - The server side response returned from the `getAccountInfo`
       *     endpoint.
       * @constructor
       * @internal
       */
      constructor(response) {
        if (!response.rawId || !response.providerId) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid user info response");
        }
        utils.addReadonlyGetter(this, "uid", response.rawId);
        utils.addReadonlyGetter(this, "displayName", response.displayName);
        utils.addReadonlyGetter(this, "email", response.email);
        utils.addReadonlyGetter(this, "photoURL", response.photoUrl);
        utils.addReadonlyGetter(this, "providerId", response.providerId);
        utils.addReadonlyGetter(this, "phoneNumber", response.phoneNumber);
      }
      /**
       * Returns a JSON-serializable representation of this object.
       *
       * @returns A JSON-serializable representation of this object.
       */
      toJSON() {
        return {
          uid: this.uid,
          displayName: this.displayName,
          email: this.email,
          photoURL: this.photoURL,
          providerId: this.providerId,
          phoneNumber: this.phoneNumber
        };
      }
    };
    exports.UserInfo = UserInfo;
    var UserRecord = class {
      /**
       * @param response - The server side response returned from the getAccountInfo
       *     endpoint.
       * @constructor
       * @internal
       */
      constructor(response) {
        if (!response.localId) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid user response");
        }
        utils.addReadonlyGetter(this, "uid", response.localId);
        utils.addReadonlyGetter(this, "email", response.email);
        utils.addReadonlyGetter(this, "emailVerified", !!response.emailVerified);
        utils.addReadonlyGetter(this, "displayName", response.displayName);
        utils.addReadonlyGetter(this, "photoURL", response.photoUrl);
        utils.addReadonlyGetter(this, "phoneNumber", response.phoneNumber);
        utils.addReadonlyGetter(this, "disabled", response.disabled || false);
        utils.addReadonlyGetter(this, "metadata", new UserMetadata(response));
        const providerData = [];
        for (const entry of response.providerUserInfo || []) {
          providerData.push(new UserInfo(entry));
        }
        utils.addReadonlyGetter(this, "providerData", providerData);
        if (response.passwordHash === B64_REDACTED) {
          utils.addReadonlyGetter(this, "passwordHash", void 0);
        } else {
          utils.addReadonlyGetter(this, "passwordHash", response.passwordHash);
        }
        utils.addReadonlyGetter(this, "passwordSalt", response.salt);
        if (response.customAttributes) {
          utils.addReadonlyGetter(this, "customClaims", JSON.parse(response.customAttributes));
        }
        let validAfterTime = null;
        if (typeof response.validSince !== "undefined") {
          validAfterTime = parseDate(parseInt(response.validSince, 10) * 1e3);
        }
        utils.addReadonlyGetter(this, "tokensValidAfterTime", validAfterTime || void 0);
        utils.addReadonlyGetter(this, "tenantId", response.tenantId);
        const multiFactor = new MultiFactorSettings(response);
        if (multiFactor.enrolledFactors.length > 0) {
          utils.addReadonlyGetter(this, "multiFactor", multiFactor);
        }
      }
      /**
       * Returns a JSON-serializable representation of this object.
       *
       * @returns A JSON-serializable representation of this object.
       */
      toJSON() {
        const json = {
          uid: this.uid,
          email: this.email,
          emailVerified: this.emailVerified,
          displayName: this.displayName,
          photoURL: this.photoURL,
          phoneNumber: this.phoneNumber,
          disabled: this.disabled,
          // Convert metadata to json.
          metadata: this.metadata.toJSON(),
          passwordHash: this.passwordHash,
          passwordSalt: this.passwordSalt,
          customClaims: (0, deep_copy_1.deepCopy)(this.customClaims),
          tokensValidAfterTime: this.tokensValidAfterTime,
          tenantId: this.tenantId
        };
        if (this.multiFactor) {
          json.multiFactor = this.multiFactor.toJSON();
        }
        json.providerData = [];
        for (const entry of this.providerData) {
          json.providerData.push(entry.toJSON());
        }
        return json;
      }
    };
    exports.UserRecord = UserRecord;
  }
});

// node_modules/firebase-admin/lib/auth/base-auth.js
var require_base_auth = __commonJS({
  "node_modules/firebase-admin/lib/auth/base-auth.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseAuth = void 0;
    exports.createFirebaseTokenGenerator = createFirebaseTokenGenerator;
    var error_1 = require_error3();
    var deep_copy_1 = require_deep_copy();
    var validator = require_validator();
    var auth_api_request_1 = require_auth_api_request();
    var token_generator_1 = require_token_generator();
    var token_verifier_1 = require_token_verifier();
    var auth_config_1 = require_auth_config();
    var user_record_1 = require_user_record();
    var identifier_1 = require_identifier();
    var crypto_signer_1 = require_crypto_signer();
    function createFirebaseTokenGenerator(app, tenantId, isEmulator) {
      try {
        const shouldEmulate = isEmulator !== void 0 ? isEmulator : (0, auth_api_request_1.useEmulator)();
        const signer = shouldEmulate ? new token_generator_1.EmulatedSigner() : (0, crypto_signer_1.cryptoSignerFromApp)(app);
        return new token_generator_1.FirebaseTokenGenerator(signer, tenantId);
      } catch (err) {
        throw (0, token_generator_1.handleCryptoSignerError)(err);
      }
    }
    var BaseAuth = class {
      /**
       * The BaseAuth class constructor.
       *
       * @param app - The FirebaseApp to associate with this Auth instance.
       * @param authRequestHandler - The RPC request handler for this instance.
       * @param tokenGenerator - Optional token generator. If not specified, a
       *     (non-tenant-aware) instance will be created. Use this paramter to
       *     specify a tenant-aware tokenGenerator.
       * @constructor
       * @internal
       */
      constructor(app, authRequestHandler, tokenGenerator) {
        this.authRequestHandler = authRequestHandler;
        this.emulatorMode = !!this.authRequestHandler.emulatorHostValue;
        if (tokenGenerator) {
          this.tokenGenerator = tokenGenerator;
        } else {
          this.tokenGenerator = createFirebaseTokenGenerator(app);
        }
        this.sessionCookieVerifier = (0, token_verifier_1.createSessionCookieVerifier)(app);
        this.idTokenVerifier = (0, token_verifier_1.createIdTokenVerifier)(app);
        this.authBlockingTokenVerifier = (0, token_verifier_1.createAuthBlockingTokenVerifier)(app);
      }
      /**
       * Creates a new Firebase custom token (JWT) that can be sent back to a client
       * device to use to sign in with the client SDKs' `signInWithCustomToken()`
       * methods. (Tenant-aware instances will also embed the tenant ID in the
       * token.)
       *
       * See {@link https://firebase.google.com/docs/auth/admin/create-custom-tokens | Create Custom Tokens}
       * for code samples and detailed documentation.
       *
       * @param uid - The `uid` to use as the custom token's subject.
       * @param developerClaims - Optional additional claims to include
       *   in the custom token's payload.
       *
       * @returns A promise fulfilled with a custom token for the
       *   provided `uid` and payload.
       */
      createCustomToken(uid, developerClaims) {
        return this.tokenGenerator.createCustomToken(uid, developerClaims);
      }
      /**
       * Verifies a Firebase ID token (JWT). If the token is valid, the promise is
       * fulfilled with the token's decoded claims; otherwise, the promise is
       * rejected.
       *
       * If `checkRevoked` is set to true, first verifies whether the corresponding
       * user is disabled. If yes, an `auth/user-disabled` error is thrown. If no,
       * verifies if the session corresponding to the ID token was revoked. If the
       * corresponding user's session was invalidated, an `auth/id-token-revoked`
       * error is thrown. If not specified the check is not applied.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/verify-id-tokens | Verify ID Tokens}
       * for code samples and detailed documentation.
       *
       * @param idToken - The ID token to verify.
       * @param checkRevoked - Whether to check if the ID token was revoked.
       *   This requires an extra request to the Firebase Auth backend to check
       *   the `tokensValidAfterTime` time for the corresponding user.
       *   When not specified, this additional check is not applied.
       *
       * @returns A promise fulfilled with the
       *   token's decoded claims if the ID token is valid; otherwise, a rejected
       *   promise.
       */
      verifyIdToken(idToken, checkRevoked = false) {
        const isEmulator = this.emulatorMode;
        return this.idTokenVerifier.verifyJWT(idToken, isEmulator).then((decodedIdToken) => {
          if (checkRevoked || isEmulator) {
            return this.verifyDecodedJWTNotRevokedOrDisabled(decodedIdToken, error_1.authClientErrorCode.ID_TOKEN_REVOKED);
          }
          return decodedIdToken;
        });
      }
      /**
       * Gets the user data for the user corresponding to a given `uid`.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-users#retrieve_user_data | Retrieve user data}
       * for code samples and detailed documentation.
       *
       * @param uid - The `uid` corresponding to the user whose data to fetch.
       *
       * @returns A promise fulfilled with the user
       *   data corresponding to the provided `uid`.
       */
      getUser(uid) {
        return this.authRequestHandler.getAccountInfoByUid(uid).then((response) => {
          return new user_record_1.UserRecord(response.users[0]);
        });
      }
      /**
       * Gets the user data for the user corresponding to a given email.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-users#retrieve_user_data | Retrieve user data}
       * for code samples and detailed documentation.
       *
       * @param email - The email corresponding to the user whose data to
       *   fetch.
       *
       * @returns A promise fulfilled with the user
       *   data corresponding to the provided email.
       */
      getUserByEmail(email) {
        return this.authRequestHandler.getAccountInfoByEmail(email).then((response) => {
          return new user_record_1.UserRecord(response.users[0]);
        });
      }
      /**
       * Gets the user data for the user corresponding to a given phone number. The
       * phone number has to conform to the E.164 specification.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-users#retrieve_user_data | Retrieve user data}
       * for code samples and detailed documentation.
       *
       * @param phoneNumber - The phone number corresponding to the user whose
       *   data to fetch.
       *
       * @returns A promise fulfilled with the user
       *   data corresponding to the provided phone number.
       */
      getUserByPhoneNumber(phoneNumber) {
        return this.authRequestHandler.getAccountInfoByPhoneNumber(phoneNumber).then((response) => {
          return new user_record_1.UserRecord(response.users[0]);
        });
      }
      /**
       * Gets the user data for the user corresponding to a given provider id.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-users#retrieve_user_data | Retrieve user data}
       * for code samples and detailed documentation.
       *
       * @param providerId - The provider ID, for example, "google.com" for the
       *   Google provider.
       * @param uid - The user identifier for the given provider.
       *
       * @returns A promise fulfilled with the user data corresponding to the
       *   given provider id.
       */
      getUserByProviderUid(providerId, uid) {
        if (providerId === "phone") {
          return this.getUserByPhoneNumber(uid);
        } else if (providerId === "email") {
          return this.getUserByEmail(uid);
        }
        return this.authRequestHandler.getAccountInfoByFederatedUid(providerId, uid).then((response) => {
          return new user_record_1.UserRecord(response.users[0]);
        });
      }
      /**
       * Gets the user data corresponding to the specified identifiers.
       *
       * There are no ordering guarantees; in particular, the nth entry in the result list is not
       * guaranteed to correspond to the nth entry in the input parameters list.
       *
       * Only a maximum of 100 identifiers may be supplied. If more than 100 identifiers are supplied,
       * this method throws a FirebaseAuthError.
       *
       * @param identifiers - The identifiers used to indicate which user records should be returned.
       *     Must not have more than 100 entries.
       * @returns A promise that resolves to the corresponding user records.
       * @throws FirebaseAuthError If any of the identifiers are invalid or if more than 100
       *     identifiers are specified.
       */
      getUsers(identifiers) {
        if (!validator.isArray(identifiers)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "`identifiers` parameter must be an array");
        }
        return this.authRequestHandler.getAccountInfoByIdentifiers(identifiers).then((response) => {
          const isUserFound = ((id, userRecords) => {
            return !!userRecords.find((userRecord) => {
              if ((0, identifier_1.isUidIdentifier)(id)) {
                return id.uid === userRecord.uid;
              } else if ((0, identifier_1.isEmailIdentifier)(id)) {
                return id.email === userRecord.email;
              } else if ((0, identifier_1.isPhoneIdentifier)(id)) {
                return id.phoneNumber === userRecord.phoneNumber;
              } else if ((0, identifier_1.isProviderIdentifier)(id)) {
                const matchingUserInfo = userRecord.providerData.find((userInfo) => {
                  return id.providerId === userInfo.providerId;
                });
                return !!matchingUserInfo && id.providerUid === matchingUserInfo.uid;
              } else {
                throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "Unhandled identifier type");
              }
            });
          });
          const users = response.users ? response.users.map((user) => new user_record_1.UserRecord(user)) : [];
          const notFound = identifiers.filter((id) => !isUserFound(id, users));
          return { users, notFound };
        });
      }
      /**
       * Retrieves a list of users (single batch only) with a size of `maxResults`
       * starting from the offset as specified by `pageToken`. This is used to
       * retrieve all the users of a specified project in batches.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-users#list_all_users | List all users}
       * for code samples and detailed documentation.
       *
       * @param maxResults - The page size, 1000 if undefined. This is also
       *   the maximum allowed limit.
       * @param pageToken - The next page token. If not specified, returns
       *   users starting without any offset.
       * @returns A promise that resolves with
       *   the current batch of downloaded users and the next page token.
       */
      listUsers(maxResults, pageToken) {
        return this.authRequestHandler.downloadAccount(maxResults, pageToken).then((response) => {
          const users = [];
          response.users.forEach((userResponse) => {
            users.push(new user_record_1.UserRecord(userResponse));
          });
          const result = {
            users,
            pageToken: response.nextPageToken
          };
          if (typeof result.pageToken === "undefined") {
            delete result.pageToken;
          }
          return result;
        });
      }
      /**
       * Creates a new user.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-users#create_a_user | Create a user}
       * for code samples and detailed documentation.
       *
       * @param properties - The properties to set on the
       *   new user record to be created.
       *
       * @returns A promise fulfilled with the user
       *   data corresponding to the newly created user.
       */
      createUser(properties) {
        return this.authRequestHandler.createNewAccount(properties).then((uid) => {
          return this.getUser(uid);
        }).catch((error) => {
          if (error.code === "auth/user-not-found") {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "Unable to create the user record provided.");
          }
          throw error;
        });
      }
      /**
       * Deletes an existing user.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-users#delete_a_user | Delete a user}
       * for code samples and detailed documentation.
       *
       * @param uid - The `uid` corresponding to the user to delete.
       *
       * @returns An empty promise fulfilled once the user has been
       *   deleted.
       */
      deleteUser(uid) {
        return this.authRequestHandler.deleteAccount(uid).then(() => {
        });
      }
      /**
       * Deletes the users specified by the given uids.
       *
       * Deleting a non-existing user won't generate an error (i.e. this method
       * is idempotent.) Non-existing users are considered to be successfully
       * deleted, and are therefore counted in the
       * `DeleteUsersResult.successCount` value.
       *
       * Only a maximum of 1000 identifiers may be supplied. If more than 1000
       * identifiers are supplied, this method throws a FirebaseAuthError.
       *
       * This API is currently rate limited at the server to 1 QPS. If you exceed
       * this, you may get a quota exceeded error. Therefore, if you want to
       * delete more than 1000 users, you may need to add a delay to ensure you
       * don't go over this limit.
       *
       * @param uids - The `uids` corresponding to the users to delete.
       *
       * @returns A Promise that resolves to the total number of successful/failed
       *     deletions, as well as the array of errors that corresponds to the
       *     failed deletions.
       */
      deleteUsers(uids) {
        if (!validator.isArray(uids)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "`uids` parameter must be an array");
        }
        return this.authRequestHandler.deleteAccounts(
          uids,
          /*force=*/
          true
        ).then((batchDeleteAccountsResponse) => {
          const result = {
            failureCount: 0,
            successCount: uids.length,
            errors: []
          };
          if (!validator.isNonEmptyArray(batchDeleteAccountsResponse.errors)) {
            return result;
          }
          result.failureCount = batchDeleteAccountsResponse.errors.length;
          result.successCount = uids.length - batchDeleteAccountsResponse.errors.length;
          result.errors = batchDeleteAccountsResponse.errors.map((batchDeleteErrorInfo) => {
            if (batchDeleteErrorInfo.index === void 0) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INTERNAL_ERROR, "Corrupt BatchDeleteAccountsResponse detected");
            }
            const errMsgToError = (msg) => {
              const code = msg && msg.startsWith("NOT_DISABLED") ? error_1.authClientErrorCode.USER_NOT_DISABLED : error_1.authClientErrorCode.INTERNAL_ERROR;
              return new error_1.FirebaseAuthError(code, batchDeleteErrorInfo.message);
            };
            return {
              index: batchDeleteErrorInfo.index,
              error: errMsgToError(batchDeleteErrorInfo.message)
            };
          });
          return result;
        });
      }
      /**
       * Updates an existing user.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-users#update_a_user | Update a user}
       * for code samples and detailed documentation.
       *
       * @param uid - The `uid` corresponding to the user to update.
       * @param properties - The properties to update on
       *   the provided user.
       *
       * @returns A promise fulfilled with the
       *   updated user data.
       */
      updateUser(uid, properties) {
        properties = (0, deep_copy_1.deepCopy)(properties);
        if (properties?.providerToLink) {
          if (properties.providerToLink.providerId === "email") {
            if (typeof properties.email !== "undefined") {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "Both UpdateRequest.email and UpdateRequest.providerToLink.providerId='email' were set. To link to the email/password provider, only specify the UpdateRequest.email field.");
            }
            properties.email = properties.providerToLink.uid;
            delete properties.providerToLink;
          } else if (properties.providerToLink.providerId === "phone") {
            if (typeof properties.phoneNumber !== "undefined") {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "Both UpdateRequest.phoneNumber and UpdateRequest.providerToLink.providerId='phone' were set. To link to a phone provider, only specify the UpdateRequest.phoneNumber field.");
            }
            properties.phoneNumber = properties.providerToLink.uid;
            delete properties.providerToLink;
          }
        }
        if (properties?.providersToUnlink) {
          if (properties.providersToUnlink.indexOf("phone") !== -1) {
            if (properties.phoneNumber === null) {
              throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, "Both UpdateRequest.phoneNumber=null and UpdateRequest.providersToUnlink=['phone'] were set. To unlink from a phone provider, only specify the UpdateRequest.phoneNumber=null field.");
            }
          }
        }
        return this.authRequestHandler.updateExistingAccount(uid, properties).then((existingUid) => {
          return this.getUser(existingUid);
        });
      }
      /**
       * Sets additional developer claims on an existing user identified by the
       * provided `uid`, typically used to define user roles and levels of
       * access. These claims should propagate to all devices where the user is
       * already signed in (after token expiration or when token refresh is forced)
       * and the next time the user signs in. If a reserved OIDC claim name
       * is used (sub, iat, iss, etc), an error is thrown. They are set on the
       * authenticated user's ID token JWT.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/custom-claims |
       * Defining user roles and access levels}
       * for code samples and detailed documentation.
       *
       * @param uid - The `uid` of the user to edit.
       * @param customUserClaims - The developer claims to set. If null is
       *   passed, existing custom claims are deleted. Passing a custom claims payload
       *   larger than 1000 bytes will throw an error. Custom claims are added to the
       *   user's ID token which is transmitted on every authenticated request.
       *   For profile non-access related user attributes, use database or other
       *   separate storage systems.
       * @returns A promise that resolves when the operation completes
       *   successfully.
       */
      setCustomUserClaims(uid, customUserClaims) {
        return this.authRequestHandler.setCustomUserClaims(uid, customUserClaims).then(() => {
        });
      }
      /**
       * Revokes all refresh tokens for an existing user.
       *
       * This API will update the user's {@link UserRecord.tokensValidAfterTime} to
       * the current UTC. It is important that the server on which this is called has
       * its clock set correctly and synchronized.
       *
       * While this will revoke all sessions for a specified user and disable any
       * new ID tokens for existing sessions from getting minted, existing ID tokens
       * may remain active until their natural expiration (one hour). To verify that
       * ID tokens are revoked, use {@link BaseAuth.verifyIdToken}
       * where `checkRevoked` is set to true.
       *
       * @param uid - The `uid` corresponding to the user whose refresh tokens
       *   are to be revoked.
       *
       * @returns An empty promise fulfilled once the user's refresh
       *   tokens have been revoked.
       */
      revokeRefreshTokens(uid) {
        return this.authRequestHandler.revokeRefreshTokens(uid).then(() => {
        });
      }
      /**
       * Imports the provided list of users into Firebase Auth.
       * A maximum of 1000 users are allowed to be imported one at a time.
       * When importing users with passwords,
       * {@link UserImportOptions} are required to be
       * specified.
       * This operation is optimized for bulk imports and will ignore checks on `uid`,
       * `email` and other identifier uniqueness which could result in duplications.
       *
       * @param users - The list of user records to import to Firebase Auth.
       * @param options - The user import options, required when the users provided include
       *   password credentials.
       * @returns A promise that resolves when
       *   the operation completes with the result of the import. This includes the
       *   number of successful imports, the number of failed imports and their
       *   corresponding errors.
      */
      importUsers(users, options) {
        return this.authRequestHandler.uploadAccount(users, options);
      }
      /**
       * Creates a new Firebase session cookie with the specified options. The created
       * JWT string can be set as a server-side session cookie with a custom cookie
       * policy, and be used for session management. The session cookie JWT will have
       * the same payload claims as the provided ID token.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-cookies | Manage Session Cookies}
       * for code samples and detailed documentation.
       *
       * @param idToken - The Firebase ID token to exchange for a session
       *   cookie.
       * @param sessionCookieOptions - The session
       *   cookie options which includes custom session duration.
       *
       * @returns A promise that resolves on success with the
       *   created session cookie.
       */
      createSessionCookie(idToken, sessionCookieOptions) {
        if (!validator.isNonNullObject(sessionCookieOptions) || !validator.isNumber(sessionCookieOptions.expiresIn)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_SESSION_COOKIE_DURATION));
        }
        return this.authRequestHandler.createSessionCookie(idToken, sessionCookieOptions.expiresIn);
      }
      /**
       * Verifies a Firebase session cookie. Returns a Promise with the cookie claims.
       * Rejects the promise if the cookie could not be verified.
       *
       * If `checkRevoked` is set to true, first verifies whether the corresponding
       * user is disabled: If yes, an `auth/user-disabled` error is thrown. If no,
       * verifies if the session corresponding to the session cookie was revoked.
       * If the corresponding user's session was invalidated, an
       * `auth/session-cookie-revoked` error is thrown. If not specified the check
       * is not performed.
       *
       * See {@link https://firebase.google.com/docs/auth/admin/manage-cookies#verify_session_cookie_and_check_permissions |
       * Verify Session Cookies}
       * for code samples and detailed documentation
       *
       * @param sessionCookie - The session cookie to verify.
       * @param checkForRevocation -  Whether to check if the session cookie was
       *   revoked. This requires an extra request to the Firebase Auth backend to
       *   check the `tokensValidAfterTime` time for the corresponding user.
       *   When not specified, this additional check is not performed.
       *
       * @returns A promise fulfilled with the
       *   session cookie's decoded claims if the session cookie is valid; otherwise,
       *   a rejected promise.
       */
      verifySessionCookie(sessionCookie, checkRevoked = false) {
        const isEmulator = this.emulatorMode;
        return this.sessionCookieVerifier.verifyJWT(sessionCookie, isEmulator).then((decodedIdToken) => {
          if (checkRevoked || isEmulator) {
            return this.verifyDecodedJWTNotRevokedOrDisabled(decodedIdToken, error_1.authClientErrorCode.SESSION_COOKIE_REVOKED);
          }
          return decodedIdToken;
        });
      }
      /**
       * Generates the out of band email action link to reset a user's password.
       * The link is generated for the user with the specified email address. The
       * optional  {@link ActionCodeSettings} object
       * defines whether the link is to be handled by a mobile app or browser and the
       * additional state information to be passed in the deep link, etc.
       *
       * @example
       * ```javascript
       * var actionCodeSettings = {
       *   url: 'https://www.example.com/?email=user@example.com',
       *   iOS: {
       *     bundleId: 'com.example.ios'
       *   },
       *   android: {
       *     packageName: 'com.example.android',
       *     installApp: true,
       *     minimumVersion: '12'
       *   },
       *   handleCodeInApp: true,
       *   linkDomain: 'project-id.firebaseapp.com'
       * };
       * admin.auth()
       *     .generatePasswordResetLink('user@example.com', actionCodeSettings)
       *     .then(function(link) {
       *       // The link was successfully generated.
       *     })
       *     .catch(function(error) {
       *       // Some error occurred, you can inspect the code: error.code
       *     });
       * ```
       *
       * @param email - The email address of the user whose password is to be
       *   reset.
       * @param actionCodeSettings - The action
       *     code settings. If specified, the state/continue URL is set as the
       *     "continueUrl" parameter in the password reset link. The default password
       *     reset landing page will use this to display a link to go back to the app
       *     if it is installed.
       *     If the actionCodeSettings is not specified, no URL is appended to the
       *     action URL.
       *     The state URL provided must belong to a domain that is whitelisted by the
       *     developer in the console. Otherwise an error is thrown.
       *     Mobile app redirects are only applicable if the developer configures
       *     and accepts the Firebase Dynamic Links terms of service.
       *     The Android package name and iOS bundle ID are respected only if they
       *     are configured in the same Firebase Auth project.
       * @returns A promise that resolves with the generated link.
       */
      generatePasswordResetLink(email, actionCodeSettings) {
        return this.authRequestHandler.getEmailActionLink("PASSWORD_RESET", email, actionCodeSettings);
      }
      /**
       * Generates the out of band email action link to verify the user's ownership
       * of the specified email. The {@link ActionCodeSettings} object provided
       * as an argument to this method defines whether the link is to be handled by a
       * mobile app or browser along with additional state information to be passed in
       * the deep link, etc.
       *
       * @example
       * ```javascript
       * var actionCodeSettings = {
       *   url: 'https://www.example.com/cart?email=user@example.com&cartId=123',
       *   iOS: {
       *     bundleId: 'com.example.ios'
       *   },
       *   android: {
       *     packageName: 'com.example.android',
       *     installApp: true,
       *     minimumVersion: '12'
       *   },
       *   handleCodeInApp: true,
       *   linkDomain: 'project-id.firebaseapp.com'
       * };
       * admin.auth()
       *     .generateEmailVerificationLink('user@example.com', actionCodeSettings)
       *     .then(function(link) {
       *       // The link was successfully generated.
       *     })
       *     .catch(function(error) {
       *       // Some error occurred, you can inspect the code: error.code
       *     });
       * ```
       *
       * @param email - The email account to verify.
       * @param actionCodeSettings - The action
       *     code settings. If specified, the state/continue URL is set as the
       *     "continueUrl" parameter in the email verification link. The default email
       *     verification landing page will use this to display a link to go back to
       *     the app if it is installed.
       *     If the actionCodeSettings is not specified, no URL is appended to the
       *     action URL.
       *     The state URL provided must belong to a domain that is whitelisted by the
       *     developer in the console. Otherwise an error is thrown.
       *     Mobile app redirects are only applicable if the developer configures
       *     and accepts the Firebase Dynamic Links terms of service.
       *     The Android package name and iOS bundle ID are respected only if they
       *     are configured in the same Firebase Auth project.
       * @returns A promise that resolves with the generated link.
       */
      generateEmailVerificationLink(email, actionCodeSettings) {
        return this.authRequestHandler.getEmailActionLink("VERIFY_EMAIL", email, actionCodeSettings);
      }
      /**
       * Generates an out-of-band email action link to verify the user's ownership
       * of the specified email. The {@link ActionCodeSettings} object provided
       * as an argument to this method defines whether the link is to be handled by a
       * mobile app or browser along with additional state information to be passed in
       * the deep link, etc.
       *
       * @param email - The current email account.
       * @param newEmail - The email address the account is being updated to.
       * @param actionCodeSettings - The action
       *     code settings. If specified, the state/continue URL is set as the
       *     "continueUrl" parameter in the email verification link. The default email
       *     verification landing page will use this to display a link to go back to
       *     the app if it is installed.
       *     If the actionCodeSettings is not specified, no URL is appended to the
       *     action URL.
       *     The state URL provided must belong to a domain that is authorized
       *     in the console, or an error will be thrown.
       *     Mobile app redirects are only applicable if the developer configures
       *     and accepts the Firebase Dynamic Links terms of service.
       *     The Android package name and iOS bundle ID are respected only if they
       *     are configured in the same Firebase Auth project.
       * @returns A promise that resolves with the generated link.
       */
      generateVerifyAndChangeEmailLink(email, newEmail, actionCodeSettings) {
        return this.authRequestHandler.getEmailActionLink("VERIFY_AND_CHANGE_EMAIL", email, actionCodeSettings, newEmail);
      }
      /**
       * Generates the out of band email action link to verify the user's ownership
       * of the specified email. The {@link ActionCodeSettings} object provided
       * as an argument to this method defines whether the link is to be handled by a
       * mobile app or browser along with additional state information to be passed in
       * the deep link, etc.
       *
       * @example
       * ```javascript
       * var actionCodeSettings = {
       *   url: 'https://www.example.com/cart?email=user@example.com&cartId=123',
       *   iOS: {
       *     bundleId: 'com.example.ios'
       *   },
       *   android: {
       *     packageName: 'com.example.android',
       *     installApp: true,
       *     minimumVersion: '12'
       *   },
       *   handleCodeInApp: true,
       *   linkDomain: 'project-id.firebaseapp.com'
       * };
       * admin.auth()
       *     .generateEmailVerificationLink('user@example.com', actionCodeSettings)
       *     .then(function(link) {
       *       // The link was successfully generated.
       *     })
       *     .catch(function(error) {
       *       // Some error occurred, you can inspect the code: error.code
       *     });
       * ```
       *
       * @param email - The email account to verify.
       * @param actionCodeSettings - The action
       *     code settings. If specified, the state/continue URL is set as the
       *     "continueUrl" parameter in the email verification link. The default email
       *     verification landing page will use this to display a link to go back to
       *     the app if it is installed.
       *     If the actionCodeSettings is not specified, no URL is appended to the
       *     action URL.
       *     The state URL provided must belong to a domain that is whitelisted by the
       *     developer in the console. Otherwise an error is thrown.
       *     Mobile app redirects are only applicable if the developer configures
       *     and accepts the Firebase Dynamic Links terms of service.
       *     The Android package name and iOS bundle ID are respected only if they
       *     are configured in the same Firebase Auth project.
       * @returns A promise that resolves with the generated link.
       */
      generateSignInWithEmailLink(email, actionCodeSettings) {
        return this.authRequestHandler.getEmailActionLink("EMAIL_SIGNIN", email, actionCodeSettings);
      }
      /**
       * Returns the list of existing provider configurations matching the filter
       * provided. At most, 100 provider configs can be listed at a time.
       *
       * SAML and OIDC provider support requires Google Cloud's Identity Platform
       * (GCIP). To learn more about GCIP, including pricing and features,
       * see the {@link https://cloud.google.com/identity-platform | GCIP documentation}.
       *
       * @param options - The provider config filter to apply.
       * @returns A promise that resolves with the list of provider configs meeting the
       *   filter requirements.
       */
      listProviderConfigs(options) {
        const processResponse = (response, providerConfigs) => {
          const result = {
            providerConfigs
          };
          if (Object.prototype.hasOwnProperty.call(response, "nextPageToken")) {
            result.pageToken = response.nextPageToken;
          }
          return result;
        };
        if (options && options.type === "oidc") {
          return this.authRequestHandler.listOAuthIdpConfigs(options.maxResults, options.pageToken).then((response) => {
            const providerConfigs = [];
            response.oauthIdpConfigs.forEach((configResponse) => {
              providerConfigs.push(new auth_config_1.OIDCConfig(configResponse));
            });
            return processResponse(response, providerConfigs);
          });
        } else if (options && options.type === "saml") {
          return this.authRequestHandler.listInboundSamlConfigs(options.maxResults, options.pageToken).then((response) => {
            const providerConfigs = [];
            response.inboundSamlConfigs.forEach((configResponse) => {
              providerConfigs.push(new auth_config_1.SAMLConfig(configResponse));
            });
            return processResponse(response, providerConfigs);
          });
        }
        return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ARGUMENT, '"AuthProviderConfigFilter.type" must be either "saml" or "oidc"'));
      }
      /**
       * Looks up an Auth provider configuration by the provided ID.
       * Returns a promise that resolves with the provider configuration
       * corresponding to the provider ID specified. If the specified ID does not
       * exist, an `auth/configuration-not-found` error is thrown.
       *
       * SAML and OIDC provider support requires Google Cloud's Identity Platform
       * (GCIP). To learn more about GCIP, including pricing and features,
       * see the {@link https://cloud.google.com/identity-platform | GCIP documentation}.
       *
       * @param providerId - The provider ID corresponding to the provider
       *     config to return.
       * @returns A promise that resolves
       *     with the configuration corresponding to the provided ID.
       */
      getProviderConfig(providerId) {
        if (auth_config_1.OIDCConfig.isProviderId(providerId)) {
          return this.authRequestHandler.getOAuthIdpConfig(providerId).then((response) => {
            return new auth_config_1.OIDCConfig(response);
          });
        } else if (auth_config_1.SAMLConfig.isProviderId(providerId)) {
          return this.authRequestHandler.getInboundSamlConfig(providerId).then((response) => {
            return new auth_config_1.SAMLConfig(response);
          });
        }
        return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
      }
      /**
       * Deletes the provider configuration corresponding to the provider ID passed.
       * If the specified ID does not exist, an `auth/configuration-not-found` error
       * is thrown.
       *
       * SAML and OIDC provider support requires Google Cloud's Identity Platform
       * (GCIP). To learn more about GCIP, including pricing and features,
       * see the {@link https://cloud.google.com/identity-platform | GCIP documentation}.
       *
       * @param providerId - The provider ID corresponding to the provider
       *     config to delete.
       * @returns A promise that resolves on completion.
       */
      deleteProviderConfig(providerId) {
        if (auth_config_1.OIDCConfig.isProviderId(providerId)) {
          return this.authRequestHandler.deleteOAuthIdpConfig(providerId);
        } else if (auth_config_1.SAMLConfig.isProviderId(providerId)) {
          return this.authRequestHandler.deleteInboundSamlConfig(providerId);
        }
        return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
      }
      /**
       * Returns a promise that resolves with the updated `AuthProviderConfig`
       * corresponding to the provider ID specified.
       * If the specified ID does not exist, an `auth/configuration-not-found` error
       * is thrown.
       *
       * SAML and OIDC provider support requires Google Cloud's Identity Platform
       * (GCIP). To learn more about GCIP, including pricing and features,
       * see the {@link https://cloud.google.com/identity-platform | GCIP documentation}.
       *
       * @param providerId - The provider ID corresponding to the provider
       *     config to update.
       * @param updatedConfig - The updated configuration.
       * @returns A promise that resolves with the updated provider configuration.
       */
      updateProviderConfig(providerId, updatedConfig) {
        if (!validator.isNonNullObject(updatedConfig)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, 'Request is missing "UpdateAuthProviderRequest" configuration.'));
        }
        if (auth_config_1.OIDCConfig.isProviderId(providerId)) {
          return this.authRequestHandler.updateOAuthIdpConfig(providerId, updatedConfig).then((response) => {
            return new auth_config_1.OIDCConfig(response);
          });
        } else if (auth_config_1.SAMLConfig.isProviderId(providerId)) {
          return this.authRequestHandler.updateInboundSamlConfig(providerId, updatedConfig).then((response) => {
            return new auth_config_1.SAMLConfig(response);
          });
        }
        return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
      }
      /**
       * Returns a promise that resolves with the newly created `AuthProviderConfig`
       * when the new provider configuration is created.
       *
       * SAML and OIDC provider support requires Google Cloud's Identity Platform
       * (GCIP). To learn more about GCIP, including pricing and features,
       * see the {@link https://cloud.google.com/identity-platform | GCIP documentation}.
       *
       * @param config - The provider configuration to create.
       * @returns A promise that resolves with the created provider configuration.
       */
      createProviderConfig(config2) {
        if (!validator.isNonNullObject(config2)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_CONFIG, 'Request is missing "AuthProviderConfig" configuration.'));
        }
        if (auth_config_1.OIDCConfig.isProviderId(config2.providerId)) {
          return this.authRequestHandler.createOAuthIdpConfig(config2).then((response) => {
            return new auth_config_1.OIDCConfig(response);
          });
        } else if (auth_config_1.SAMLConfig.isProviderId(config2.providerId)) {
          return this.authRequestHandler.createInboundSamlConfig(config2).then((response) => {
            return new auth_config_1.SAMLConfig(response);
          });
        }
        return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_PROVIDER_ID));
      }
      /**
       * @excludeFromDocs
       */
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _verifyAuthBlockingToken(token, audience) {
        const isEmulator = this.emulatorMode;
        return this.authBlockingTokenVerifier._verifyAuthBlockingToken(token, isEmulator, audience).then((decodedAuthBlockingToken) => {
          return decodedAuthBlockingToken;
        });
      }
      /**
       * Verifies the decoded Firebase issued JWT is not revoked or disabled. Returns a promise that
       * resolves with the decoded claims on success. Rejects the promise with revocation error if revoked
       * or user disabled.
       *
       * @param decodedIdToken - The JWT's decoded claims.
       * @param revocationErrorInfo - The revocation error info to throw on revocation
       *     detection.
       * @returns A promise that will be fulfilled after a successful verification.
       */
      verifyDecodedJWTNotRevokedOrDisabled(decodedIdToken, revocationErrorInfo) {
        return this.getUser(decodedIdToken.sub).then((user) => {
          if (user.disabled) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.USER_DISABLED, "The user record is disabled.");
          }
          if (user.tokensValidAfterTime) {
            const authTimeUtc = decodedIdToken.auth_time * 1e3;
            const validSinceUtc = new Date(user.tokensValidAfterTime).getTime();
            if (authTimeUtc < validSinceUtc) {
              throw new error_1.FirebaseAuthError(revocationErrorInfo);
            }
          }
          return decodedIdToken;
        });
      }
    };
    exports.BaseAuth = BaseAuth;
  }
});

// node_modules/firebase-admin/lib/auth/tenant-manager.js
var require_tenant_manager = __commonJS({
  "node_modules/firebase-admin/lib/auth/tenant-manager.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TenantManager = exports.TenantAwareAuth = void 0;
    var validator = require_validator();
    var utils = require_utils();
    var error_1 = require_error3();
    var base_auth_1 = require_base_auth();
    var tenant_1 = require_tenant();
    var auth_api_request_1 = require_auth_api_request();
    var TenantAwareAuth = class extends base_auth_1.BaseAuth {
      /**
       * The TenantAwareAuth class constructor.
       *
       * @param app - The app that created this tenant.
       * @param tenantId - The corresponding tenant ID.
       * @param emHost - Optional emulator host captured at init time.
       * @constructor
       * @internal
       */
      constructor(app, tenantId, emHost) {
        const emIsSet = emHost !== void 0;
        super(app, new auth_api_request_1.TenantAwareAuthRequestHandler(app, tenantId, emHost), (0, base_auth_1.createFirebaseTokenGenerator)(app, tenantId, emIsSet ? !!emHost : void 0));
        utils.addReadonlyGetter(this, "tenantId", tenantId);
      }
      /**
       * {@inheritdoc BaseAuth.verifyIdToken}
       */
      verifyIdToken(idToken, checkRevoked = false) {
        return super.verifyIdToken(idToken, checkRevoked).then((decodedClaims) => {
          if (decodedClaims.firebase.tenant !== this.tenantId) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MISMATCHING_TENANT_ID);
          }
          return decodedClaims;
        });
      }
      /**
       * {@inheritdoc BaseAuth.createSessionCookie}
       */
      createSessionCookie(idToken, sessionCookieOptions) {
        if (!validator.isNonEmptyString(idToken)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_ID_TOKEN));
        }
        if (!validator.isNonNullObject(sessionCookieOptions) || !validator.isNumber(sessionCookieOptions.expiresIn)) {
          return Promise.reject(new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_SESSION_COOKIE_DURATION));
        }
        return this.verifyIdToken(idToken).then(() => {
          return super.createSessionCookie(idToken, sessionCookieOptions);
        });
      }
      /**
       * {@inheritdoc BaseAuth.verifySessionCookie}
       */
      verifySessionCookie(sessionCookie, checkRevoked = false) {
        return super.verifySessionCookie(sessionCookie, checkRevoked).then((decodedClaims) => {
          if (decodedClaims.firebase.tenant !== this.tenantId) {
            throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.MISMATCHING_TENANT_ID);
          }
          return decodedClaims;
        });
      }
    };
    exports.TenantAwareAuth = TenantAwareAuth;
    var TenantManager = class {
      /**
       * Initializes a TenantManager instance for a specified FirebaseApp.
       *
       * @param app - The app for this TenantManager instance.
       *
       * @constructor
       * @internal
       */
      constructor(app) {
        this.app = app;
        this.authRequestHandler = new auth_api_request_1.AuthRequestHandler(app);
        this.emulatorHost = this.authRequestHandler.emulatorHostValue;
        this.tenantsMap = {};
      }
      /**
       * Returns a `TenantAwareAuth` instance bound to the given tenant ID.
       *
       * @param tenantId - The tenant ID whose `TenantAwareAuth` instance is to be returned.
       *
       * @returns The `TenantAwareAuth` instance corresponding to this tenant identifier.
       */
      authForTenant(tenantId) {
        if (!validator.isNonEmptyString(tenantId)) {
          throw new error_1.FirebaseAuthError(error_1.authClientErrorCode.INVALID_TENANT_ID);
        }
        if (typeof this.tenantsMap[tenantId] === "undefined") {
          this.tenantsMap[tenantId] = new TenantAwareAuth(this.app, tenantId, this.emulatorHost ?? null);
        }
        return this.tenantsMap[tenantId];
      }
      /**
       * Gets the tenant configuration for the tenant corresponding to a given `tenantId`.
       *
       * @param tenantId - The tenant identifier corresponding to the tenant whose data to fetch.
       *
       * @returns A promise fulfilled with the tenant configuration to the provided `tenantId`.
       */
      getTenant(tenantId) {
        return this.authRequestHandler.getTenant(tenantId).then((response) => {
          return new tenant_1.Tenant(response);
        });
      }
      /**
       * Retrieves a list of tenants (single batch only) with a size of `maxResults`
       * starting from the offset as specified by `pageToken`. This is used to
       * retrieve all the tenants of a specified project in batches.
       *
       * @param maxResults - The page size, 1000 if undefined. This is also
       *   the maximum allowed limit.
       * @param pageToken - The next page token. If not specified, returns
       *   tenants starting without any offset.
       *
       * @returns A promise that resolves with
       *   a batch of downloaded tenants and the next page token.
       */
      listTenants(maxResults, pageToken) {
        return this.authRequestHandler.listTenants(maxResults, pageToken).then((response) => {
          const tenants = [];
          response.tenants.forEach((tenantResponse) => {
            tenants.push(new tenant_1.Tenant(tenantResponse));
          });
          const result = {
            tenants,
            pageToken: response.nextPageToken
          };
          if (typeof result.pageToken === "undefined") {
            delete result.pageToken;
          }
          return result;
        });
      }
      /**
       * Deletes an existing tenant.
       *
       * @param tenantId - The `tenantId` corresponding to the tenant to delete.
       *
       * @returns An empty promise fulfilled once the tenant has been deleted.
       */
      deleteTenant(tenantId) {
        return this.authRequestHandler.deleteTenant(tenantId);
      }
      /**
       * Creates a new tenant.
       * When creating new tenants, tenants that use separate billing and quota will require their
       * own project and must be defined as `full_service`.
       *
       * @param tenantOptions - The properties to set on the new tenant configuration to be created.
       *
       * @returns A promise fulfilled with the tenant configuration corresponding to the newly
       *   created tenant.
       */
      createTenant(tenantOptions) {
        return this.authRequestHandler.createTenant(tenantOptions).then((response) => {
          return new tenant_1.Tenant(response);
        });
      }
      /**
       * Updates an existing tenant configuration.
       *
       * @param tenantId - The `tenantId` corresponding to the tenant to delete.
       * @param tenantOptions - The properties to update on the provided tenant.
       *
       * @returns A promise fulfilled with the update tenant data.
       */
      updateTenant(tenantId, tenantOptions) {
        return this.authRequestHandler.updateTenant(tenantId, tenantOptions).then((response) => {
          return new tenant_1.Tenant(response);
        });
      }
    };
    exports.TenantManager = TenantManager;
  }
});

// node_modules/firebase-admin/lib/auth/project-config-manager.js
var require_project_config_manager = __commonJS({
  "node_modules/firebase-admin/lib/auth/project-config-manager.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProjectConfigManager = void 0;
    var project_config_1 = require_project_config();
    var auth_api_request_1 = require_auth_api_request();
    var ProjectConfigManager = class {
      /**
       * Initializes a ProjectConfigManager instance for a specified FirebaseApp.
       *
       * @param app - The app for this ProjectConfigManager instance.
       *
       * @constructor
       * @internal
       */
      constructor(app) {
        this.authRequestHandler = new auth_api_request_1.AuthRequestHandler(app);
      }
      /**
       * Get the project configuration.
       *
       * @returns A promise fulfilled with the project configuration.
       */
      getProjectConfig() {
        return this.authRequestHandler.getProjectConfig().then((response) => {
          return new project_config_1.ProjectConfig(response);
        });
      }
      /**
       * Updates an existing project configuration.
       *
       * @param projectConfigOptions - The properties to update on the project.
       *
       * @returns A promise fulfilled with the updated project config.
       */
      updateProjectConfig(projectConfigOptions) {
        return this.authRequestHandler.updateProjectConfig(projectConfigOptions).then((response) => {
          return new project_config_1.ProjectConfig(response);
        });
      }
    };
    exports.ProjectConfigManager = ProjectConfigManager;
  }
});

// node_modules/firebase-admin/lib/auth/auth.js
var require_auth = __commonJS({
  "node_modules/firebase-admin/lib/auth/auth.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Auth = void 0;
    var auth_api_request_1 = require_auth_api_request();
    var tenant_manager_1 = require_tenant_manager();
    var base_auth_1 = require_base_auth();
    var project_config_manager_1 = require_project_config_manager();
    var Auth = class extends base_auth_1.BaseAuth {
      /**
       * @param app - The app for this Auth service.
       * @constructor
       * @internal
       */
      constructor(app) {
        super(app, new auth_api_request_1.AuthRequestHandler(app));
        this.app_ = app;
        this.tenantManager_ = new tenant_manager_1.TenantManager(app);
        this.projectConfigManager_ = new project_config_manager_1.ProjectConfigManager(app);
      }
      /**
       * Returns the app associated with this Auth instance.
       *
       * @returns The app associated with this Auth instance.
       */
      get app() {
        return this.app_;
      }
      /**
       * Returns the tenant manager instance associated with the current project.
       *
       * @returns The tenant manager instance associated with the current project.
       */
      tenantManager() {
        return this.tenantManager_;
      }
      /**
       * Returns the project config manager instance associated with the current project.
       *
       * @returns The project config manager instance associated with the current project.
       */
      projectConfigManager() {
        return this.projectConfigManager_;
      }
    };
    exports.Auth = Auth;
  }
});

// node_modules/firebase-admin/lib/auth/index.js
var require_auth2 = __commonJS({
  "node_modules/firebase-admin/lib/auth/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthErrorCode = exports.FirebaseAuthError = exports.UserRecord = exports.UserMetadata = exports.UserInfo = exports.PhoneMultiFactorInfo = exports.MultiFactorSettings = exports.MultiFactorInfo = exports.ProjectConfigManager = exports.ProjectConfig = exports.TenantManager = exports.TenantAwareAuth = exports.Tenant = exports.BaseAuth = exports.Auth = void 0;
    exports.getAuth = getAuth2;
    var index_1 = require_app();
    var auth_1 = require_auth();
    function getAuth2(app) {
      if (typeof app === "undefined") {
        app = (0, index_1.getApp)();
      }
      const firebaseApp = app;
      return firebaseApp.getOrInitService("auth", (app2) => new auth_1.Auth(app2));
    }
    var auth_2 = require_auth();
    Object.defineProperty(exports, "Auth", { enumerable: true, get: function() {
      return auth_2.Auth;
    } });
    var base_auth_1 = require_base_auth();
    Object.defineProperty(exports, "BaseAuth", { enumerable: true, get: function() {
      return base_auth_1.BaseAuth;
    } });
    var tenant_1 = require_tenant();
    Object.defineProperty(exports, "Tenant", { enumerable: true, get: function() {
      return tenant_1.Tenant;
    } });
    var tenant_manager_1 = require_tenant_manager();
    Object.defineProperty(exports, "TenantAwareAuth", { enumerable: true, get: function() {
      return tenant_manager_1.TenantAwareAuth;
    } });
    Object.defineProperty(exports, "TenantManager", { enumerable: true, get: function() {
      return tenant_manager_1.TenantManager;
    } });
    var project_config_1 = require_project_config();
    Object.defineProperty(exports, "ProjectConfig", { enumerable: true, get: function() {
      return project_config_1.ProjectConfig;
    } });
    var project_config_manager_1 = require_project_config_manager();
    Object.defineProperty(exports, "ProjectConfigManager", { enumerable: true, get: function() {
      return project_config_manager_1.ProjectConfigManager;
    } });
    var user_record_1 = require_user_record();
    Object.defineProperty(exports, "MultiFactorInfo", { enumerable: true, get: function() {
      return user_record_1.MultiFactorInfo;
    } });
    Object.defineProperty(exports, "MultiFactorSettings", { enumerable: true, get: function() {
      return user_record_1.MultiFactorSettings;
    } });
    Object.defineProperty(exports, "PhoneMultiFactorInfo", { enumerable: true, get: function() {
      return user_record_1.PhoneMultiFactorInfo;
    } });
    Object.defineProperty(exports, "UserInfo", { enumerable: true, get: function() {
      return user_record_1.UserInfo;
    } });
    Object.defineProperty(exports, "UserMetadata", { enumerable: true, get: function() {
      return user_record_1.UserMetadata;
    } });
    Object.defineProperty(exports, "UserRecord", { enumerable: true, get: function() {
      return user_record_1.UserRecord;
    } });
    var error_1 = require_error3();
    Object.defineProperty(exports, "FirebaseAuthError", { enumerable: true, get: function() {
      return error_1.FirebaseAuthError;
    } });
    Object.defineProperty(exports, "AuthErrorCode", { enumerable: true, get: function() {
      return error_1.AuthErrorCode;
    } });
  }
});

// node_modules/firebase-admin/lib/firestore/error.js
var require_error4 = __commonJS({
  "node_modules/firebase-admin/lib/firestore/error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirebaseFirestoreError = exports.FirestoreErrorCode = void 0;
    var error_1 = require_error();
    exports.FirestoreErrorCode = {
      FAILED_PRECONDITION: "failed-precondition",
      INVALID_ARGUMENT: "invalid-argument",
      INVALID_CREDENTIAL: "invalid-credential",
      MISSING_DEPENDENCIES: "missing-dependencies"
    };
    var FirebaseFirestoreError = class extends error_1.FirebaseError {
      /**
       * @param info - The error code info.
       * @param message - The error message. This will override the default
       *     message if provided.
       */
      constructor(info, message2) {
        super({
          code: `firestore/${info.code}`,
          message: message2 || info.message,
          httpResponse: info.httpResponse,
          cause: info.cause
        });
        this.codePrefix = "firestore";
      }
    };
    exports.FirebaseFirestoreError = FirebaseFirestoreError;
  }
});

// node_modules/firebase-admin/lib/firestore/firestore-internal.js
var require_firestore_internal = __commonJS({
  "node_modules/firebase-admin/lib/firestore/firestore-internal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirestoreService = exports.DEFAULT_DATABASE_ID = void 0;
    exports.getFirestoreOptions = getFirestoreOptions;
    var error_1 = require_error4();
    var credential_internal_1 = require_credential_internal();
    var validator = require_validator();
    var utils = require_utils();
    exports.DEFAULT_DATABASE_ID = "(default)";
    var FirestoreService = class {
      constructor(app) {
        this.databases = /* @__PURE__ */ new Map();
        this.firestoreSettings = /* @__PURE__ */ new Map();
        this.appInternal = app;
      }
      initializeDatabase(databaseId, settings) {
        const existingInstance = this.databases.get(databaseId);
        if (existingInstance) {
          const initialSettings = this.firestoreSettings.get(databaseId) ?? {};
          if (this.checkIfSameSettings(settings, initialSettings)) {
            return existingInstance;
          }
          throw new error_1.FirebaseFirestoreError({
            code: "failed-precondition",
            message: "initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance."
          });
        }
        const newInstance = initFirestore(this.app, databaseId, settings);
        this.databases.set(databaseId, newInstance);
        this.firestoreSettings.set(databaseId, settings);
        return newInstance;
      }
      getDatabase(databaseId) {
        let database = this.databases.get(databaseId);
        if (database === void 0) {
          database = initFirestore(this.app, databaseId, {});
          this.databases.set(databaseId, database);
          this.firestoreSettings.set(databaseId, {});
        }
        return database;
      }
      checkIfSameSettings(settingsA, settingsB) {
        const a = settingsA ?? {};
        const b = settingsB ?? {};
        return a.preferRest === b.preferRest;
      }
      /**
       * Returns the app associated with this Storage instance.
       *
       * @returns The app associated with this Storage instance.
       */
      get app() {
        return this.appInternal;
      }
    };
    exports.FirestoreService = FirestoreService;
    function getFirestoreOptions(app, firestoreSettings) {
      if (!validator.isNonNullObject(app) || !("options" in app)) {
        throw new error_1.FirebaseFirestoreError({
          code: "invalid-argument",
          message: "First argument passed to admin.firestore() must be a valid Firebase app instance."
        });
      }
      const projectId = utils.getExplicitProjectId(app);
      const credential = app.options.credential;
      const sdkVersion = utils.getSdkVersion();
      const preferRest = firestoreSettings?.preferRest;
      if (credential instanceof credential_internal_1.ServiceAccountCredential) {
        return {
          credentials: {
            private_key: credential.privateKey,
            client_email: credential.clientEmail
          },
          // When the SDK is initialized with ServiceAccountCredentials an explicit projectId is
          // guaranteed to be available.
          projectId,
          firebaseVersion: sdkVersion,
          firebaseAdminVersion: sdkVersion,
          preferRest
        };
      } else if ((0, credential_internal_1.isApplicationDefault)(app.options.credential)) {
        return validator.isNonEmptyString(projectId) ? {
          projectId,
          firebaseVersion: sdkVersion,
          firebaseAdminVersion: sdkVersion,
          preferRest
        } : {
          firebaseVersion: sdkVersion,
          firebaseAdminVersion: sdkVersion,
          preferRest
        };
      }
      throw new error_1.FirebaseFirestoreError({
        code: "invalid-credential",
        message: "Failed to initialize Google Cloud Firestore client with the available credentials. Must initialize the SDK with a certificate credential or application default credentials to use Cloud Firestore API."
      });
    }
    function initFirestore(app, databaseId, firestoreSettings) {
      const options = getFirestoreOptions(app, firestoreSettings);
      options.databaseId = databaseId;
      let firestoreDatabase;
      try {
        firestoreDatabase = __require("@google-cloud/firestore").Firestore;
      } catch (err) {
        throw new error_1.FirebaseFirestoreError({
          code: "missing-dependencies",
          message: 'Failed to import the Cloud Firestore client library for Node.js. Make sure to install the "@google-cloud/firestore" npm package.',
          cause: err
        });
      }
      return new firestoreDatabase(options);
    }
  }
});

// node_modules/firebase-admin/lib/firestore/index.js
var require_firestore = __commonJS({
  "node_modules/firebase-admin/lib/firestore/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirebaseFirestoreError = exports.FirestoreErrorCode = exports.setLogFunction = exports.v1 = exports.WriteResult = exports.WriteBatch = exports.Transaction = exports.Timestamp = exports.QuerySnapshot = exports.QueryPartition = exports.QueryDocumentSnapshot = exports.Query = exports.GrpcStatus = exports.GeoPoint = exports.Firestore = exports.Filter = exports.FieldValue = exports.FieldPath = exports.DocumentSnapshot = exports.DocumentReference = exports.CollectionReference = exports.CollectionGroup = exports.BundleBuilder = exports.BulkWriter = exports.AggregateQuerySnapshot = exports.AggregateQuery = exports.AggregateField = void 0;
    exports.getFirestore = getFirestore2;
    exports.initializeFirestore = initializeFirestore;
    var app_1 = require_app();
    var firestore_internal_1 = require_firestore_internal();
    var firestore_1 = __require("@google-cloud/firestore");
    Object.defineProperty(exports, "AggregateField", { enumerable: true, get: function() {
      return firestore_1.AggregateField;
    } });
    Object.defineProperty(exports, "AggregateQuery", { enumerable: true, get: function() {
      return firestore_1.AggregateQuery;
    } });
    Object.defineProperty(exports, "AggregateQuerySnapshot", { enumerable: true, get: function() {
      return firestore_1.AggregateQuerySnapshot;
    } });
    Object.defineProperty(exports, "BulkWriter", { enumerable: true, get: function() {
      return firestore_1.BulkWriter;
    } });
    Object.defineProperty(exports, "BundleBuilder", { enumerable: true, get: function() {
      return firestore_1.BundleBuilder;
    } });
    Object.defineProperty(exports, "CollectionGroup", { enumerable: true, get: function() {
      return firestore_1.CollectionGroup;
    } });
    Object.defineProperty(exports, "CollectionReference", { enumerable: true, get: function() {
      return firestore_1.CollectionReference;
    } });
    Object.defineProperty(exports, "DocumentReference", { enumerable: true, get: function() {
      return firestore_1.DocumentReference;
    } });
    Object.defineProperty(exports, "DocumentSnapshot", { enumerable: true, get: function() {
      return firestore_1.DocumentSnapshot;
    } });
    Object.defineProperty(exports, "FieldPath", { enumerable: true, get: function() {
      return firestore_1.FieldPath;
    } });
    Object.defineProperty(exports, "FieldValue", { enumerable: true, get: function() {
      return firestore_1.FieldValue;
    } });
    Object.defineProperty(exports, "Filter", { enumerable: true, get: function() {
      return firestore_1.Filter;
    } });
    Object.defineProperty(exports, "Firestore", { enumerable: true, get: function() {
      return firestore_1.Firestore;
    } });
    Object.defineProperty(exports, "GeoPoint", { enumerable: true, get: function() {
      return firestore_1.GeoPoint;
    } });
    Object.defineProperty(exports, "GrpcStatus", { enumerable: true, get: function() {
      return firestore_1.GrpcStatus;
    } });
    Object.defineProperty(exports, "Query", { enumerable: true, get: function() {
      return firestore_1.Query;
    } });
    Object.defineProperty(exports, "QueryDocumentSnapshot", { enumerable: true, get: function() {
      return firestore_1.QueryDocumentSnapshot;
    } });
    Object.defineProperty(exports, "QueryPartition", { enumerable: true, get: function() {
      return firestore_1.QueryPartition;
    } });
    Object.defineProperty(exports, "QuerySnapshot", { enumerable: true, get: function() {
      return firestore_1.QuerySnapshot;
    } });
    Object.defineProperty(exports, "Timestamp", { enumerable: true, get: function() {
      return firestore_1.Timestamp;
    } });
    Object.defineProperty(exports, "Transaction", { enumerable: true, get: function() {
      return firestore_1.Transaction;
    } });
    Object.defineProperty(exports, "WriteBatch", { enumerable: true, get: function() {
      return firestore_1.WriteBatch;
    } });
    Object.defineProperty(exports, "WriteResult", { enumerable: true, get: function() {
      return firestore_1.WriteResult;
    } });
    Object.defineProperty(exports, "v1", { enumerable: true, get: function() {
      return firestore_1.v1;
    } });
    Object.defineProperty(exports, "setLogFunction", { enumerable: true, get: function() {
      return firestore_1.setLogFunction;
    } });
    function getFirestore2(appOrDatabaseId, optionalDatabaseId) {
      const app = typeof appOrDatabaseId === "object" ? appOrDatabaseId : (0, app_1.getApp)();
      const databaseId = (typeof appOrDatabaseId === "string" ? appOrDatabaseId : optionalDatabaseId) || firestore_internal_1.DEFAULT_DATABASE_ID;
      const firebaseApp = app;
      const firestoreService = firebaseApp.getOrInitService("firestore", (app2) => new firestore_internal_1.FirestoreService(app2));
      return firestoreService.getDatabase(databaseId);
    }
    function initializeFirestore(app, settings, databaseId) {
      settings ??= {};
      databaseId ??= firestore_internal_1.DEFAULT_DATABASE_ID;
      const firebaseApp = app;
      const firestoreService = firebaseApp.getOrInitService("firestore", (app2) => new firestore_internal_1.FirestoreService(app2));
      return firestoreService.initializeDatabase(databaseId, settings);
    }
    var error_1 = require_error4();
    Object.defineProperty(exports, "FirestoreErrorCode", { enumerable: true, get: function() {
      return error_1.FirestoreErrorCode;
    } });
    Object.defineProperty(exports, "FirebaseFirestoreError", { enumerable: true, get: function() {
      return error_1.FirebaseFirestoreError;
    } });
  }
});

// node_modules/firebase-admin/lib/messaging/error.js
var require_error5 = __commonJS({
  "node_modules/firebase-admin/lib/messaging/error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirebaseMessagingError = exports.messagingClientErrorCode = exports.MessagingErrorCode = void 0;
    var error_1 = require_error();
    var deep_copy_1 = require_deep_copy();
    exports.MessagingErrorCode = {
      INVALID_ARGUMENT: "invalid-argument",
      INVALID_RECIPIENT: "invalid-recipient",
      INVALID_PAYLOAD: "invalid-payload",
      INVALID_DATA_PAYLOAD_KEY: "invalid-data-payload-key",
      PAYLOAD_SIZE_LIMIT_EXCEEDED: "payload-size-limit-exceeded",
      INVALID_OPTIONS: "invalid-options",
      INVALID_REGISTRATION_TOKEN: "invalid-registration-token",
      REGISTRATION_TOKEN_NOT_REGISTERED: "registration-token-not-registered",
      INSTALLATION_ID_NOT_REGISTERED: "installation-id-not-registered",
      MISMATCHED_CREDENTIAL: "mismatched-credential",
      INVALID_PACKAGE_NAME: "invalid-package-name",
      DEVICE_MESSAGE_RATE_EXCEEDED: "device-message-rate-exceeded",
      TOPICS_MESSAGE_RATE_EXCEEDED: "topics-message-rate-exceeded",
      TOPICS_SUBSCRIPTION_RATE_EXCEEDED: "topics-subscription-rate-exceeded",
      MESSAGE_RATE_EXCEEDED: "message-rate-exceeded",
      THIRD_PARTY_AUTH_ERROR: "third-party-auth-error",
      TOO_MANY_TOPICS: "too-many-topics",
      AUTHENTICATION_ERROR: "authentication-error",
      SERVER_UNAVAILABLE: "server-unavailable",
      INTERNAL_ERROR: "internal-error",
      UNKNOWN_ERROR: "unknown-error"
    };
    exports.messagingClientErrorCode = {
      INVALID_ARGUMENT: {
        code: exports.MessagingErrorCode.INVALID_ARGUMENT,
        message: "Invalid argument provided."
      },
      INVALID_RECIPIENT: {
        code: exports.MessagingErrorCode.INVALID_RECIPIENT,
        message: "Invalid message recipient provided."
      },
      INVALID_PAYLOAD: {
        code: exports.MessagingErrorCode.INVALID_PAYLOAD,
        message: "Invalid message payload provided."
      },
      INVALID_DATA_PAYLOAD_KEY: {
        code: exports.MessagingErrorCode.INVALID_DATA_PAYLOAD_KEY,
        message: "The data message payload contains an invalid key. See the reference documentation for the DataMessagePayload type for restricted keys."
      },
      PAYLOAD_SIZE_LIMIT_EXCEEDED: {
        code: exports.MessagingErrorCode.PAYLOAD_SIZE_LIMIT_EXCEEDED,
        message: "The provided message payload exceeds the FCM size limits. See the error documentation for more details."
      },
      INVALID_OPTIONS: {
        code: exports.MessagingErrorCode.INVALID_OPTIONS,
        message: "Invalid message options provided."
      },
      INVALID_REGISTRATION_TOKEN: {
        code: exports.MessagingErrorCode.INVALID_REGISTRATION_TOKEN,
        message: "Invalid registration token provided. Make sure it matches the registration token the client app receives from registering with FCM."
      },
      REGISTRATION_TOKEN_NOT_REGISTERED: {
        code: exports.MessagingErrorCode.REGISTRATION_TOKEN_NOT_REGISTERED,
        message: "The provided registration token is not registered. A previously valid registration token can be unregistered for a variety of reasons. See the error documentation for more details. Remove this registration token and stop using it to send messages."
      },
      INSTALLATION_ID_NOT_REGISTERED: {
        code: exports.MessagingErrorCode.INSTALLATION_ID_NOT_REGISTERED,
        message: "The provided installation ID is not registered. A previously valid installation ID can be unregistered for a variety of reasons. See the error documentation for more details. Remove this installation ID and stop using it to send messages."
      },
      MISMATCHED_CREDENTIAL: {
        code: exports.MessagingErrorCode.MISMATCHED_CREDENTIAL,
        message: "The credential used to authenticate this SDK does not have permission to send messages to the device corresponding to the provided registration token. Make sure the credential and registration token both belong to the same Firebase project."
      },
      INVALID_PACKAGE_NAME: {
        code: exports.MessagingErrorCode.INVALID_PACKAGE_NAME,
        message: 'The message was addressed to a registration token whose package name does not match the provided "restrictedPackageName" option.'
      },
      DEVICE_MESSAGE_RATE_EXCEEDED: {
        code: exports.MessagingErrorCode.DEVICE_MESSAGE_RATE_EXCEEDED,
        message: "The rate of messages to a particular device is too high. Reduce the number of messages sent to this device and do not immediately retry sending to this device."
      },
      TOPICS_MESSAGE_RATE_EXCEEDED: {
        code: exports.MessagingErrorCode.TOPICS_MESSAGE_RATE_EXCEEDED,
        message: "The rate of messages to subscribers to a particular topic is too high. Reduce the number of messages sent for this topic, and do not immediately retry sending to this topic."
      },
      TOPICS_SUBSCRIPTION_RATE_EXCEEDED: {
        code: exports.MessagingErrorCode.TOPICS_SUBSCRIPTION_RATE_EXCEEDED,
        message: "The rate of subscription management requests to a particular topic is too high. Reduce the number of requests sent for this topic, and do not immediately retry the request."
      },
      MESSAGE_RATE_EXCEEDED: {
        code: exports.MessagingErrorCode.MESSAGE_RATE_EXCEEDED,
        message: "Sending limit exceeded for the message target."
      },
      THIRD_PARTY_AUTH_ERROR: {
        code: exports.MessagingErrorCode.THIRD_PARTY_AUTH_ERROR,
        message: "A message targeted to an iOS device could not be sent because the required APNs SSL certificate was not uploaded or has expired. Check the validity of your development and production certificates."
      },
      TOO_MANY_TOPICS: {
        code: exports.MessagingErrorCode.TOO_MANY_TOPICS,
        message: "The maximum number of topics the provided registration token can be subscribed to has been exceeded."
      },
      AUTHENTICATION_ERROR: {
        code: exports.MessagingErrorCode.AUTHENTICATION_ERROR,
        message: "An error occurred when trying to authenticate to the FCM servers. Make sure the credential used to authenticate this SDK has the proper permissions. See https://firebase.google.com/docs/admin/setup for setup instructions."
      },
      SERVER_UNAVAILABLE: {
        code: exports.MessagingErrorCode.SERVER_UNAVAILABLE,
        message: "The FCM server could not process the request in time. See the error documentation for more details."
      },
      INTERNAL_ERROR: {
        code: exports.MessagingErrorCode.INTERNAL_ERROR,
        message: "An internal error has occurred. Please retry the request."
      },
      UNKNOWN_ERROR: {
        code: exports.MessagingErrorCode.UNKNOWN_ERROR,
        message: "An unknown server error was returned."
      }
    };
    var MESSAGING_SERVER_TO_CLIENT_CODE = {
      /* GENERIC ERRORS */
      // Generic invalid message parameter provided.
      InvalidParameters: "INVALID_ARGUMENT",
      // Mismatched sender ID.
      MismatchSenderId: "MISMATCHED_CREDENTIAL",
      // FCM server unavailable.
      Unavailable: "SERVER_UNAVAILABLE",
      // FCM server internal error.
      InternalServerError: "INTERNAL_ERROR",
      /* SEND ERRORS */
      // Invalid registration token format.
      InvalidRegistration: "INVALID_REGISTRATION_TOKEN",
      // Registration token is not registered.
      NotRegistered: "REGISTRATION_TOKEN_NOT_REGISTERED",
      // Registration token does not match restricted package name.
      InvalidPackageName: "INVALID_PACKAGE_NAME",
      // Message payload size limit exceeded.
      MessageTooBig: "PAYLOAD_SIZE_LIMIT_EXCEEDED",
      // Invalid key in the data message payload.
      InvalidDataKey: "INVALID_DATA_PAYLOAD_KEY",
      // Invalid time to live option.
      InvalidTtl: "INVALID_OPTIONS",
      // Device message rate exceeded.
      DeviceMessageRateExceeded: "DEVICE_MESSAGE_RATE_EXCEEDED",
      // Topics message rate exceeded.
      TopicsMessageRateExceeded: "TOPICS_MESSAGE_RATE_EXCEEDED",
      // Invalid APNs credentials.
      InvalidApnsCredential: "THIRD_PARTY_AUTH_ERROR",
      /* FCM v1 canonical error codes */
      NOT_FOUND: "REGISTRATION_TOKEN_NOT_REGISTERED",
      PERMISSION_DENIED: "MISMATCHED_CREDENTIAL",
      RESOURCE_EXHAUSTED: "MESSAGE_RATE_EXCEEDED",
      UNAUTHENTICATED: "THIRD_PARTY_AUTH_ERROR",
      /* FCM v1 new error codes */
      APNS_AUTH_ERROR: "THIRD_PARTY_AUTH_ERROR",
      INTERNAL: "INTERNAL_ERROR",
      INVALID_ARGUMENT: "INVALID_ARGUMENT",
      QUOTA_EXCEEDED: "MESSAGE_RATE_EXCEEDED",
      SENDER_ID_MISMATCH: "MISMATCHED_CREDENTIAL",
      THIRD_PARTY_AUTH_ERROR: "THIRD_PARTY_AUTH_ERROR",
      UNAVAILABLE: "SERVER_UNAVAILABLE",
      UNREGISTERED: "REGISTRATION_TOKEN_NOT_REGISTERED",
      UNREGISTERED_FID: "INSTALLATION_ID_NOT_REGISTERED",
      UNSPECIFIED_ERROR: "UNKNOWN_ERROR"
    };
    var TOPIC_MGT_SERVER_TO_CLIENT_CODE = {
      /* TOPIC SUBSCRIPTION MANAGEMENT ERRORS */
      NOT_FOUND: "REGISTRATION_TOKEN_NOT_REGISTERED",
      UNREGISTERED: "REGISTRATION_TOKEN_NOT_REGISTERED",
      INVALID_ARGUMENT: "INVALID_REGISTRATION_TOKEN",
      TOO_MANY_TOPICS: "TOO_MANY_TOPICS",
      RESOURCE_EXHAUSTED: "TOPICS_SUBSCRIPTION_RATE_EXCEEDED",
      PERMISSION_DENIED: "AUTHENTICATION_ERROR",
      DEADLINE_EXCEEDED: "SERVER_UNAVAILABLE",
      INTERNAL: "INTERNAL_ERROR",
      UNKNOWN: "UNKNOWN_ERROR"
    };
    var FirebaseMessagingError = class _FirebaseMessagingError extends error_1.FirebaseError {
      /**
       * Creates the developer-facing error corresponding to the backend error code.
       *
       * @param serverErrorCode - The server error code.
       * @param [message] The error message. The default message is used
       *     if not provided.
       * @param [serverError] The error's raw server response.
       * @returns The corresponding developer-facing error.
       * @internal
       */
      static fromServerError(serverErrorCode, message2, serverError) {
        let clientCodeKey = "UNKNOWN_ERROR";
        if (serverErrorCode && serverErrorCode in MESSAGING_SERVER_TO_CLIENT_CODE) {
          clientCodeKey = MESSAGING_SERVER_TO_CLIENT_CODE[serverErrorCode];
        }
        const error = (0, deep_copy_1.deepCopy)(exports.messagingClientErrorCode[clientCodeKey]);
        error.message = message2 || error.message;
        const rawData = serverError?.response?.data;
        if (clientCodeKey === "UNKNOWN_ERROR" && typeof rawData !== "undefined") {
          try {
            error.message += ` Raw server response: "${typeof rawData === "string" ? rawData : JSON.stringify(rawData)}"`;
          } catch (e) {
          }
        }
        error.cause = serverError;
        error.httpResponse = serverError?.response ? (0, error_1.toHttpResponse)(serverError.response) : void 0;
        return new _FirebaseMessagingError(error);
      }
      /**
       * @internal
       */
      static fromTopicManagementServerError(serverErrorCode, message2, serverError) {
        const clientCodeKey = TOPIC_MGT_SERVER_TO_CLIENT_CODE[serverErrorCode] || "UNKNOWN_ERROR";
        const error = (0, deep_copy_1.deepCopy)(exports.messagingClientErrorCode[clientCodeKey]);
        error.message = message2 || error.message;
        const rawData = serverError?.response?.data;
        if (clientCodeKey === "UNKNOWN_ERROR" && typeof rawData !== "undefined") {
          try {
            error.message += ` Raw server response: "${typeof rawData === "string" ? rawData : JSON.stringify(rawData)}"`;
          } catch (e) {
          }
        }
        error.cause = serverError;
        error.httpResponse = serverError?.response ? (0, error_1.toHttpResponse)(serverError.response) : void 0;
        return new _FirebaseMessagingError(error);
      }
      /**
       *
       * @param info - The error code info.
       * @param message - The error message. This will override the default message if provided.
       */
      constructor(info, message2) {
        super({
          code: `messaging/${info.code}`,
          message: message2 || info.message,
          httpResponse: info.httpResponse,
          cause: info.cause
        });
        this.codePrefix = "messaging";
      }
    };
    exports.FirebaseMessagingError = FirebaseMessagingError;
  }
});

// node_modules/firebase-admin/lib/messaging/messaging-internal.js
var require_messaging_internal = __commonJS({
  "node_modules/firebase-admin/lib/messaging/messaging-internal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BLACKLISTED_OPTIONS_KEYS = exports.BLACKLISTED_DATA_PAYLOAD_KEYS = void 0;
    exports.validateMessage = validateMessage;
    var index_1 = require_utils();
    var error_1 = require_error5();
    var validator = require_validator();
    exports.BLACKLISTED_DATA_PAYLOAD_KEYS = ["from"];
    exports.BLACKLISTED_OPTIONS_KEYS = [
      "condition",
      "data",
      "notification",
      "registrationIds",
      "registration_ids",
      "to"
    ];
    function validateMessage(message2) {
      if (!validator.isNonNullObject(message2)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "Message must be a non-null object");
      }
      const anyMessage = message2;
      if (anyMessage.topic) {
        if (anyMessage.topic.startsWith("/topics/")) {
          anyMessage.topic = anyMessage.topic.replace(/^\/topics\//, "");
        }
        if (!/^[a-zA-Z0-9-_.~%]+$/.test(anyMessage.topic)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "Malformed topic name");
        }
      }
      const targets = [anyMessage.fid, anyMessage.token, anyMessage.topic, anyMessage.condition];
      if (targets.filter((v) => validator.isNonEmptyString(v)).length !== 1) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "Exactly one of fid, topic, token or condition is required");
      }
      validateStringMap(message2.data, "data");
      validateAndroidConfig(message2.android);
      validateWebpushConfig(message2.webpush);
      validateApnsConfig(message2.apns);
      validateFcmOptions(message2.fcmOptions);
      validateNotification(message2.notification);
    }
    function validateStringMap(map, label) {
      if (typeof map === "undefined") {
        return;
      } else if (!validator.isNonNullObject(map)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, `${label} must be a non-null object`);
      }
      Object.keys(map).forEach((key) => {
        if (!validator.isString(map[key])) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, `${label} must only contain string values`);
        }
      });
    }
    function validateWebpushConfig(config2) {
      if (typeof config2 === "undefined") {
        return;
      } else if (!validator.isNonNullObject(config2)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "webpush must be a non-null object");
      }
      validateStringMap(config2.headers, "webpush.headers");
      validateStringMap(config2.data, "webpush.data");
    }
    function validateApnsConfig(config2) {
      if (typeof config2 === "undefined") {
        return;
      } else if (!validator.isNonNullObject(config2)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns must be a non-null object");
      }
      validateApnsLiveActivityToken(config2.liveActivityToken);
      validateStringMap(config2.headers, "apns.headers");
      validateApnsPayload(config2.payload);
      validateApnsFcmOptions(config2.fcmOptions);
      const propertyMappings = {
        liveActivityToken: "live_activity_token"
      };
      (0, index_1.renameProperties)(config2, propertyMappings);
    }
    function validateApnsLiveActivityToken(liveActivityToken) {
      if (typeof liveActivityToken === "undefined") {
        return;
      } else if (!validator.isString(liveActivityToken)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.liveActivityToken must be a string value");
      } else if (!validator.isNonEmptyString(liveActivityToken)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.liveActivityToken must be a non-empty string");
      }
    }
    function validateApnsFcmOptions(fcmOptions) {
      if (typeof fcmOptions === "undefined") {
        return;
      } else if (!validator.isNonNullObject(fcmOptions)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "fcmOptions must be a non-null object");
      }
      if (typeof fcmOptions.imageUrl !== "undefined" && !validator.isURL(fcmOptions.imageUrl)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "imageUrl must be a valid URL string");
      }
      if (typeof fcmOptions.analyticsLabel !== "undefined" && !validator.isString(fcmOptions.analyticsLabel)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "analyticsLabel must be a string value");
      }
      const propertyMappings = {
        imageUrl: "image"
      };
      Object.keys(propertyMappings).forEach((key) => {
        if (key in fcmOptions && propertyMappings[key] in fcmOptions) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, `Multiple specifications for ${key} in ApnsFcmOptions`);
        }
      });
      (0, index_1.renameProperties)(fcmOptions, propertyMappings);
    }
    function validateFcmOptions(fcmOptions) {
      if (typeof fcmOptions === "undefined") {
        return;
      } else if (!validator.isNonNullObject(fcmOptions)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "fcmOptions must be a non-null object");
      }
      if (typeof fcmOptions.analyticsLabel !== "undefined" && !validator.isString(fcmOptions.analyticsLabel)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "analyticsLabel must be a string value");
      }
    }
    function validateNotification(notification) {
      if (typeof notification === "undefined") {
        return;
      } else if (!validator.isNonNullObject(notification)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "notification must be a non-null object");
      }
      if (typeof notification.imageUrl !== "undefined" && !validator.isURL(notification.imageUrl)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "notification.imageUrl must be a valid URL string");
      }
      const propertyMappings = {
        imageUrl: "image"
      };
      Object.keys(propertyMappings).forEach((key) => {
        if (key in notification && propertyMappings[key] in notification) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, `Multiple specifications for ${key} in Notification`);
        }
      });
      (0, index_1.renameProperties)(notification, propertyMappings);
    }
    function validateApnsPayload(payload) {
      if (typeof payload === "undefined") {
        return;
      } else if (!validator.isNonNullObject(payload)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload must be a non-null object");
      }
      validateAps(payload.aps);
    }
    function validateAps(aps) {
      if (typeof aps === "undefined") {
        return;
      } else if (!validator.isNonNullObject(aps)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload.aps must be a non-null object");
      }
      validateApsAlert(aps.alert);
      validateApsSound(aps.sound);
      const propertyMappings = {
        contentAvailable: "content-available",
        mutableContent: "mutable-content",
        threadId: "thread-id"
      };
      Object.keys(propertyMappings).forEach((key) => {
        if (key in aps && propertyMappings[key] in aps) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, `Multiple specifications for ${key} in Aps`);
        }
      });
      (0, index_1.renameProperties)(aps, propertyMappings);
      const contentAvailable = aps["content-available"];
      if (typeof contentAvailable !== "undefined" && contentAvailable !== 1) {
        if (contentAvailable === true) {
          aps["content-available"] = 1;
        } else {
          delete aps["content-available"];
        }
      }
      const mutableContent = aps["mutable-content"];
      if (typeof mutableContent !== "undefined" && mutableContent !== 1) {
        if (mutableContent === true) {
          aps["mutable-content"] = 1;
        } else {
          delete aps["mutable-content"];
        }
      }
    }
    function validateApsSound(sound) {
      if (typeof sound === "undefined" || validator.isNonEmptyString(sound)) {
        return;
      } else if (!validator.isNonNullObject(sound)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload.aps.sound must be a non-empty string or a non-null object");
      }
      if (!validator.isNonEmptyString(sound.name)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload.aps.sound.name must be a non-empty string");
      }
      const volume = sound.volume;
      if (typeof volume !== "undefined") {
        if (!validator.isNumber(volume)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload.aps.sound.volume must be a number");
        }
        if (volume < 0 || volume > 1) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload.aps.sound.volume must be in the interval [0, 1]");
        }
      }
      const soundObject = sound;
      const key = "critical";
      const critical = soundObject[key];
      if (typeof critical !== "undefined" && critical !== 1) {
        if (critical === true) {
          soundObject[key] = 1;
        } else {
          delete soundObject[key];
        }
      }
    }
    function validateApsAlert(alert) {
      if (typeof alert === "undefined" || validator.isString(alert)) {
        return;
      } else if (!validator.isNonNullObject(alert)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload.aps.alert must be a string or a non-null object");
      }
      const apsAlert = alert;
      if (validator.isNonEmptyArray(apsAlert.locArgs) && !validator.isNonEmptyString(apsAlert.locKey)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload.aps.alert.locKey is required when specifying locArgs");
      }
      if (validator.isNonEmptyArray(apsAlert.titleLocArgs) && !validator.isNonEmptyString(apsAlert.titleLocKey)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload.aps.alert.titleLocKey is required when specifying titleLocArgs");
      }
      if (validator.isNonEmptyArray(apsAlert.subtitleLocArgs) && !validator.isNonEmptyString(apsAlert.subtitleLocKey)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "apns.payload.aps.alert.subtitleLocKey is required when specifying subtitleLocArgs");
      }
      const propertyMappings = {
        locKey: "loc-key",
        locArgs: "loc-args",
        titleLocKey: "title-loc-key",
        titleLocArgs: "title-loc-args",
        subtitleLocKey: "subtitle-loc-key",
        subtitleLocArgs: "subtitle-loc-args",
        actionLocKey: "action-loc-key",
        launchImage: "launch-image"
      };
      (0, index_1.renameProperties)(apsAlert, propertyMappings);
    }
    function validateAndroidConfig(config2) {
      if (typeof config2 === "undefined") {
        return;
      } else if (!validator.isNonNullObject(config2)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android must be a non-null object");
      }
      if (typeof config2.ttl !== "undefined") {
        if (!validator.isNumber(config2.ttl) || config2.ttl < 0) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "TTL must be a non-negative duration in milliseconds");
        }
        const duration = (0, index_1.transformMillisecondsToSecondsString)(config2.ttl);
        config2.ttl = duration;
      }
      validateStringMap(config2.data, "android.data");
      validateAndroidNotification(config2.notification);
      validateAndroidFcmOptions(config2.fcmOptions);
      const propertyMappings = {
        collapseKey: "collapse_key",
        restrictedPackageName: "restricted_package_name",
        directBootOk: "direct_boot_ok",
        bandwidthConstrainedOk: "bandwidth_constrained_ok",
        restrictedSatelliteOk: "restricted_satellite_ok"
      };
      (0, index_1.renameProperties)(config2, propertyMappings);
    }
    function validateAndroidNotification(notification) {
      if (typeof notification === "undefined") {
        return;
      } else if (!validator.isNonNullObject(notification)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification must be a non-null object");
      }
      if (typeof notification.color !== "undefined" && !/^#[0-9a-fA-F]{6}$/.test(notification.color)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.color must be in the form #RRGGBB");
      }
      if (validator.isNonEmptyArray(notification.bodyLocArgs) && !validator.isNonEmptyString(notification.bodyLocKey)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.bodyLocKey is required when specifying bodyLocArgs");
      }
      if (validator.isNonEmptyArray(notification.titleLocArgs) && !validator.isNonEmptyString(notification.titleLocKey)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.titleLocKey is required when specifying titleLocArgs");
      }
      if (typeof notification.imageUrl !== "undefined" && !validator.isURL(notification.imageUrl)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.imageUrl must be a valid URL string");
      }
      if (typeof notification.eventTimestamp !== "undefined") {
        if (!(notification.eventTimestamp instanceof Date)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.eventTimestamp must be a valid `Date` object");
        }
        const zuluTimestamp = notification.eventTimestamp.toISOString();
        notification.eventTimestamp = zuluTimestamp;
      }
      if (typeof notification.vibrateTimingsMillis !== "undefined") {
        if (!validator.isNonEmptyArray(notification.vibrateTimingsMillis)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.vibrateTimingsMillis must be a non-empty array of numbers");
        }
        const vibrateTimings = [];
        notification.vibrateTimingsMillis.forEach((value) => {
          if (!validator.isNumber(value) || value < 0) {
            throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.vibrateTimingsMillis must be non-negative durations in milliseconds");
          }
          const duration = (0, index_1.transformMillisecondsToSecondsString)(value);
          vibrateTimings.push(duration);
        });
        notification.vibrateTimingsMillis = vibrateTimings;
      }
      if (typeof notification.priority !== "undefined") {
        const priority = "PRIORITY_" + notification.priority.toUpperCase();
        notification.priority = priority;
      }
      if (typeof notification.proxy !== "undefined") {
        const proxy = notification.proxy.toUpperCase();
        notification.proxy = proxy;
      }
      if (typeof notification.visibility !== "undefined") {
        const visibility = notification.visibility.toUpperCase();
        notification.visibility = visibility;
      }
      validateLightSettings(notification.lightSettings);
      const propertyMappings = {
        clickAction: "click_action",
        bodyLocKey: "body_loc_key",
        bodyLocArgs: "body_loc_args",
        titleLocKey: "title_loc_key",
        titleLocArgs: "title_loc_args",
        channelId: "channel_id",
        imageUrl: "image",
        eventTimestamp: "event_time",
        localOnly: "local_only",
        priority: "notification_priority",
        vibrateTimingsMillis: "vibrate_timings",
        defaultVibrateTimings: "default_vibrate_timings",
        defaultSound: "default_sound",
        lightSettings: "light_settings",
        defaultLightSettings: "default_light_settings",
        notificationCount: "notification_count"
      };
      (0, index_1.renameProperties)(notification, propertyMappings);
    }
    function validateLightSettings(lightSettings) {
      if (typeof lightSettings === "undefined") {
        return;
      } else if (!validator.isNonNullObject(lightSettings)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.lightSettings must be a non-null object");
      }
      if (!validator.isNumber(lightSettings.lightOnDurationMillis) || lightSettings.lightOnDurationMillis < 0) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.lightSettings.lightOnDurationMillis must be a non-negative duration in milliseconds");
      }
      const durationOn = (0, index_1.transformMillisecondsToSecondsString)(lightSettings.lightOnDurationMillis);
      lightSettings.lightOnDurationMillis = durationOn;
      if (!validator.isNumber(lightSettings.lightOffDurationMillis) || lightSettings.lightOffDurationMillis < 0) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.lightSettings.lightOffDurationMillis must be a non-negative duration in milliseconds");
      }
      const durationOff = (0, index_1.transformMillisecondsToSecondsString)(lightSettings.lightOffDurationMillis);
      lightSettings.lightOffDurationMillis = durationOff;
      if (!validator.isString(lightSettings.color) || !/^#[0-9a-fA-F]{6}$/.test(lightSettings.color) && !/^#[0-9a-fA-F]{8}$/.test(lightSettings.color)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "android.notification.lightSettings.color must be in the form #RRGGBB or #RRGGBBAA format");
      }
      const colorString = lightSettings.color.length === 7 ? lightSettings.color + "FF" : lightSettings.color;
      const rgb = /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/i.exec(colorString);
      if (!rgb || rgb.length < 4) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INTERNAL_ERROR, "regex to extract rgba values from " + colorString + " failed.");
      }
      const color = {
        red: parseInt(rgb[1], 16) / 255,
        green: parseInt(rgb[2], 16) / 255,
        blue: parseInt(rgb[3], 16) / 255,
        alpha: parseInt(rgb[4], 16) / 255
      };
      lightSettings.color = color;
      const propertyMappings = {
        lightOnDurationMillis: "light_on_duration",
        lightOffDurationMillis: "light_off_duration"
      };
      (0, index_1.renameProperties)(lightSettings, propertyMappings);
    }
    function validateAndroidFcmOptions(fcmOptions) {
      if (typeof fcmOptions === "undefined") {
        return;
      } else if (!validator.isNonNullObject(fcmOptions)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "fcmOptions must be a non-null object");
      }
      if (typeof fcmOptions.analyticsLabel !== "undefined" && !validator.isString(fcmOptions.analyticsLabel)) {
        throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_PAYLOAD, "analyticsLabel must be a string value");
      }
    }
  }
});

// node_modules/firebase-admin/lib/messaging/messaging-errors-internal.js
var require_messaging_errors_internal = __commonJS({
  "node_modules/firebase-admin/lib/messaging/messaging-errors-internal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createFirebaseError = createFirebaseError;
    exports.getErrorCode = getErrorCode;
    exports.getErrorMessage = getErrorMessage;
    var error_1 = require_error5();
    var error_2 = require_error();
    var validator = require_validator();
    function createFirebaseError(err) {
      if (err.response.isJson()) {
        const json = err.response.data;
        let errorCode = getErrorCode(json);
        const errorMessage = getErrorMessage(json);
        if (errorCode === "UNREGISTERED" || errorCode === "NOT_FOUND") {
          let requestData = err.response.config && err.response.config.data;
          if (requestData && (typeof requestData === "string" || Buffer.isBuffer(requestData))) {
            try {
              const strData = typeof requestData === "string" ? requestData : requestData.toString("utf-8");
              requestData = JSON.parse(strData);
            } catch (e) {
            }
          }
          const messageObj = requestData && requestData.message;
          if (messageObj && typeof messageObj.fid === "string") {
            errorCode = "UNREGISTERED_FID";
          }
        }
        return error_1.FirebaseMessagingError.fromServerError(errorCode, errorMessage, err);
      }
      let error;
      switch (err.response.status) {
        case 400:
          error = error_1.messagingClientErrorCode.INVALID_ARGUMENT;
          break;
        case 401:
        case 403:
          error = error_1.messagingClientErrorCode.AUTHENTICATION_ERROR;
          break;
        case 500:
          error = error_1.messagingClientErrorCode.INTERNAL_ERROR;
          break;
        case 503:
          error = error_1.messagingClientErrorCode.SERVER_UNAVAILABLE;
          break;
        default:
          error = error_1.messagingClientErrorCode.UNKNOWN_ERROR;
      }
      return new error_1.FirebaseMessagingError({
        code: error.code,
        message: `${error.message} Raw server response: "${err.response.text}". Status code: ${err.response.status}.`,
        httpResponse: (0, error_2.toHttpResponse)(err.response),
        cause: err
      });
    }
    function getErrorCode(response) {
      if (validator.isNonNullObject(response) && "error" in response) {
        const error = response.error;
        if (validator.isString(error)) {
          return error;
        }
        if (validator.isArray(error.details)) {
          const fcmErrorType = "type.googleapis.com/google.firebase.fcm.v1.FcmError";
          for (const element of error.details) {
            if (element["@type"] === fcmErrorType) {
              return element.errorCode;
            }
          }
        }
        if ("status" in error) {
          return error.status;
        } else {
          return error.message;
        }
      }
      return null;
    }
    function getErrorMessage(response) {
      if (validator.isNonNullObject(response) && "error" in response && validator.isNonEmptyString(response.error.message)) {
        return response.error.message;
      }
      return null;
    }
  }
});

// node_modules/firebase-admin/lib/messaging/messaging-api-request-internal.js
var require_messaging_api_request_internal = __commonJS({
  "node_modules/firebase-admin/lib/messaging/messaging-api-request-internal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FirebaseMessagingRequestHandler = void 0;
    var api_request_1 = require_api_request();
    var messaging_errors_internal_1 = require_messaging_errors_internal();
    var index_1 = require_utils();
    var error_1 = require_error5();
    var error_2 = require_error();
    var FIREBASE_MESSAGING_TIMEOUT = 15e3;
    var FIREBASE_MESSAGING_HTTP_METHOD = "POST";
    var FIREBASE_MESSAGING_HEADERS = {
      "X-Firebase-Client": `fire-admin-node/${(0, index_1.getSdkVersion)()}`,
      "access_token_auth": "true"
    };
    var FirebaseMessagingRequestHandler = class {
      /**
       * @param app - The app used to fetch access tokens to sign API requests.
       * @constructor
       */
      constructor(app) {
        this.httpClient = new api_request_1.AuthorizedHttpClient(app);
        this.http2Client = new api_request_1.AuthorizedHttp2Client(app);
      }
      /**
       * Invokes the request handler with the provided request data.
       *
       * @param host - The host to which to send the request.
       * @param path - The path to which to send the request.
       * @param requestData - The request data.
       * @returns A promise that resolves with the response.
       */
      invokeRequestHandler(host, path, requestData) {
        const request = {
          method: FIREBASE_MESSAGING_HTTP_METHOD,
          url: `https://${host}${path}`,
          data: requestData,
          headers: FIREBASE_MESSAGING_HEADERS,
          timeout: FIREBASE_MESSAGING_TIMEOUT
        };
        return this.httpClient.send(request).then((response) => {
          if (!response.isJson()) {
            throw new api_request_1.RequestResponseError(response);
          }
          const errorCode = (0, messaging_errors_internal_1.getErrorCode)(response.data);
          if (errorCode) {
            throw new api_request_1.RequestResponseError(response);
          }
          return response.data;
        }).catch((err) => {
          if (err instanceof api_request_1.RequestResponseError) {
            throw (0, messaging_errors_internal_1.createFirebaseError)(err);
          }
          throw err;
        });
      }
      /**
       * Invokes the HTTP/1.1 request handler with the provided request data.
       *
       * @param host - The host to which to send the request.
       * @param path - The path to which to send the request.
       * @param requestData - The request data.
       * @returns A promise that resolves with the {@link SendResponse}.
       */
      invokeHttpRequestHandlerForSendResponse(host, path, requestData) {
        const request = {
          method: FIREBASE_MESSAGING_HTTP_METHOD,
          url: `https://${host}${path}`,
          data: requestData,
          headers: FIREBASE_MESSAGING_HEADERS,
          timeout: FIREBASE_MESSAGING_TIMEOUT
        };
        return this.httpClient.send(request).then((response) => {
          return this.buildSendResponse(response);
        }).catch((err) => {
          if (err instanceof api_request_1.RequestResponseError) {
            return this.buildSendResponseFromError(err);
          }
          throw err;
        });
      }
      /**
       * Invokes the HTTP/2 request handler with the provided request data.
       *
       * @param host - The host to which to send the request.
       * @param path - The path to which to send the request.
       * @param requestData - The request data.
       * @returns A promise that resolves with the {@link SendResponse}.
       */
      invokeHttp2RequestHandlerForSendResponse(host, path, requestData, http2SessionHandler) {
        const request = {
          method: FIREBASE_MESSAGING_HTTP_METHOD,
          url: `https://${host}${path}`,
          data: requestData,
          headers: FIREBASE_MESSAGING_HEADERS,
          timeout: FIREBASE_MESSAGING_TIMEOUT,
          http2SessionHandler
        };
        return this.http2Client.send(request).then((response) => {
          return this.buildSendResponse(response);
        }).catch((err) => {
          if (err instanceof api_request_1.RequestResponseError) {
            return this.buildSendResponseFromError(err);
          }
          throw err;
        });
      }
      buildSendResponse(response) {
        const result = {
          success: response.status === 200
        };
        if (result.success) {
          result.messageId = response.data.name;
        } else {
          result.error = (0, messaging_errors_internal_1.createFirebaseError)(new api_request_1.RequestResponseError(response));
        }
        return result;
      }
      buildSendResponseFromError(err) {
        return {
          success: false,
          error: (0, messaging_errors_internal_1.createFirebaseError)(err)
        };
      }
      /**
       * Invokes the HTTP/1.1 request handler for a topic management operation.
       *
       * @param host - The host to which to send the request.
       * @param path - The path to which to send the request.
       * @param methodName - The name of the calling method (subscribeToTopic or unsubscribeFromTopic).
       * @param requestData - The request data (or undefined for DELETE).
       * @returns A promise that resolves with the {@link TopicSubscriptionResponse}.
       */
      invokeHttpRequestHandlerForTopicSubscriptionResponse(host, path, methodName, requestData) {
        const request = {
          method: methodName === "subscribeToTopic" ? "POST" : "DELETE",
          url: `https://${host}${path}`,
          data: requestData,
          headers: FIREBASE_MESSAGING_HEADERS,
          timeout: FIREBASE_MESSAGING_TIMEOUT
        };
        return this.httpClient.send(request).then((response) => {
          return this.buildTopicSubscriptionResponse(response, methodName);
        }).catch((err) => {
          if (err instanceof api_request_1.RequestResponseError) {
            return this.buildTopicSubscriptionResponseFromError(err, methodName);
          }
          throw err;
        });
      }
      /**
       * Invokes the HTTP/2 request handler for a topic management operation.
       *
       * @param host - The host to which to send the request.
       * @param path - The path to which to send the request.
       * @param methodName - The name of the calling method (subscribeToTopic or unsubscribeFromTopic).
       * @param requestData - The request data (or undefined for DELETE).
       * @param http2SessionHandler - The HTTP/2 session handler.
       * @returns A promise that resolves with the {@link TopicSubscriptionResponse}.
       */
      invokeHttp2RequestHandlerForTopicSubscriptionResponse(host, path, methodName, requestData, http2SessionHandler) {
        const request = {
          method: methodName === "subscribeToTopic" ? "POST" : "DELETE",
          url: `https://${host}${path}`,
          data: requestData,
          headers: FIREBASE_MESSAGING_HEADERS,
          timeout: FIREBASE_MESSAGING_TIMEOUT,
          http2SessionHandler
        };
        return this.http2Client.send(request).then((response) => {
          return this.buildTopicSubscriptionResponse(response, methodName);
        }).catch((err) => {
          if (err instanceof api_request_1.RequestResponseError) {
            return this.buildTopicSubscriptionResponseFromError(err, methodName);
          }
          throw err;
        });
      }
      buildTopicSubscriptionResponse(response, methodName) {
        if (response.status === 200) {
          return { success: true };
        }
        return this.buildTopicSubscriptionResponseFromError(new api_request_1.RequestResponseError(response), methodName);
      }
      buildTopicSubscriptionResponseFromError(err, methodName) {
        if (err.response.isJson()) {
          const json = err.response.data;
          const errorCode2 = (0, messaging_errors_internal_1.getErrorCode)(json);
          if (methodName === "subscribeToTopic" && (errorCode2 === "ALREADY_EXISTS" || err.response.status === 409)) {
            return { success: true };
          }
          const errorMessage = (0, messaging_errors_internal_1.getErrorMessage)(json);
          return {
            success: false,
            error: error_1.FirebaseMessagingError.fromTopicManagementServerError(errorCode2 || "UNKNOWN_ERROR", errorMessage, err)
          };
        }
        if (methodName === "subscribeToTopic" && err.response.status === 409) {
          return { success: true };
        }
        let errorCode;
        switch (err.response.status) {
          case 400:
            errorCode = error_1.MessagingErrorCode.INVALID_REGISTRATION_TOKEN;
            break;
          case 401:
          case 403:
            errorCode = error_1.MessagingErrorCode.AUTHENTICATION_ERROR;
            break;
          case 404:
            errorCode = error_1.MessagingErrorCode.REGISTRATION_TOKEN_NOT_REGISTERED;
            break;
          case 429:
            errorCode = error_1.MessagingErrorCode.TOPICS_SUBSCRIPTION_RATE_EXCEEDED;
            break;
          case 500:
            errorCode = error_1.MessagingErrorCode.INTERNAL_ERROR;
            break;
          case 503:
            errorCode = error_1.MessagingErrorCode.SERVER_UNAVAILABLE;
            break;
          default:
            errorCode = error_1.MessagingErrorCode.UNKNOWN_ERROR;
        }
        return {
          success: false,
          error: new error_1.FirebaseMessagingError({
            code: errorCode,
            message: `Server responded with status ${err.response.status}.`,
            httpResponse: (0, error_2.toHttpResponse)(err.response),
            cause: err
          })
        };
      }
    };
    exports.FirebaseMessagingRequestHandler = FirebaseMessagingRequestHandler;
  }
});

// node_modules/firebase-admin/lib/messaging/messaging.js
var require_messaging = __commonJS({
  "node_modules/firebase-admin/lib/messaging/messaging.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Messaging = void 0;
    var deep_copy_1 = require_deep_copy();
    var error_1 = require_error5();
    var utils = require_utils();
    var validator = require_validator();
    var messaging_internal_1 = require_messaging_internal();
    var messaging_api_request_internal_1 = require_messaging_api_request_internal();
    var api_request_1 = require_api_request();
    var FCM_SEND_HOST = "fcm.googleapis.com";
    var FCM_TOPIC_MANAGEMENT_HOST = "iid.googleapis.com";
    var FCM_TOPIC_MANAGEMENT_ADD_PATH = "/iid/v1:batchAdd";
    var FCM_TOPIC_MANAGEMENT_REMOVE_PATH = "/iid/v1:batchRemove";
    var FCM_MAX_BATCH_SIZE = 500;
    function mapRawResponseToTopicManagementResponse(response) {
      const result = {
        successCount: 0,
        failureCount: 0,
        errors: []
      };
      if ("results" in response) {
        response.results.forEach((tokenManagementResult, index) => {
          if ("error" in tokenManagementResult) {
            result.failureCount += 1;
            const newError = error_1.FirebaseMessagingError.fromTopicManagementServerError(
              tokenManagementResult.error,
              /* message */
              void 0,
              tokenManagementResult.error
            );
            result.errors.push({
              index,
              error: newError
            });
          } else {
            result.successCount += 1;
          }
        });
      }
      return result;
    }
    async function runWithConcurrencyLimit(tasks, limit = 100) {
      const results = new Array(tasks.length);
      let currentIndex = 0;
      const worker = async () => {
        while (currentIndex < tasks.length) {
          const index = currentIndex++;
          try {
            const value = await tasks[index]();
            results[index] = { status: "fulfilled", value };
          } catch (reason) {
            results[index] = { status: "rejected", reason };
          }
        }
      };
      const workers = [];
      const workerCount = Math.min(limit, tasks.length);
      for (let i = 0; i < workerCount; i++) {
        workers.push(worker());
      }
      await Promise.all(workers);
      return results;
    }
    var Messaging = class {
      /**
       * @internal
       */
      constructor(app) {
        this.useLegacyTransport = false;
        if (!validator.isNonNullObject(app) || !("options" in app)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, "First argument passed to admin.messaging() must be a valid Firebase app instance.");
        }
        this.appInternal = app;
        this.messagingRequestHandler = new messaging_api_request_internal_1.FirebaseMessagingRequestHandler(app);
      }
      /**
       * The {@link firebase-admin.app#App} associated with the current `Messaging` service
       * instance.
       *
       * @example
       * ```javascript
       * var app = messaging.app;
       * ```
       */
      get app() {
        return this.appInternal;
      }
      /**
       * Enables the use of legacy HTTP/1.1 transport for `sendEach()` and `sendEachForMulticast()`.
       *
       * @example
       * ```javascript
       * const messaging = getMessaging(app);
       * messaging.enableLegacyTransport();
       * messaging.sendEach(messages);
       * ```
       *
       * @deprecated This will be removed when the HTTP/2 transport implementation reaches the same
       * stability as the legacy HTTP/1.1 implementation.
       */
      enableLegacyHttpTransport() {
        this.useLegacyTransport = true;
      }
      /**
       * Sends the given message via FCM.
       *
       * @param message - The message payload.
       * @param dryRun - Whether to send the message in the dry-run
       *   (validation only) mode.
       * @returns A promise fulfilled with a unique message ID
       *   string after the message has been successfully handed off to the FCM
       *   service for delivery.
       */
      send(message2, dryRun) {
        const copy = (0, deep_copy_1.deepCopy)(message2);
        (0, messaging_internal_1.validateMessage)(copy);
        if (typeof dryRun !== "undefined" && !validator.isBoolean(dryRun)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, "dryRun must be a boolean");
        }
        return this.getUrlPath().then((urlPath) => {
          const request = { message: copy };
          if (dryRun) {
            request.validate_only = true;
          }
          return this.messagingRequestHandler.invokeRequestHandler(FCM_SEND_HOST, urlPath, request);
        }).then((response) => {
          return response.name;
        });
      }
      /**
      * Sends each message in the given array via Firebase Cloud Messaging.
      *
      * This method makes a single RPC call for each message
      * in the given array.
      *
      * The responses list obtained from the return value corresponds to the order of `messages`.
      * An error from this method or a `BatchResponse` with all failures indicates a total failure,
      * meaning that none of the messages in the list could be sent. Partial failures or no
      * failures are only indicated by a `BatchResponse` return value.
      *
      * @param messages - A non-empty array
      *   containing up to 500 messages.
      * @param dryRun - Whether to send the messages in the dry-run
      *   (validation only) mode.
      * @returns A Promise fulfilled with an object representing the result of the
      *   send operation.
      */
      sendEach(messages, dryRun) {
        if (validator.isArray(messages) && messages.constructor !== Array) {
          messages = Array.from(messages);
        }
        const copy = (0, deep_copy_1.deepCopy)(messages);
        if (!validator.isNonEmptyArray(copy)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, "messages must be a non-empty array");
        }
        if (copy.length > FCM_MAX_BATCH_SIZE) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, `messages list must not contain more than ${FCM_MAX_BATCH_SIZE} items`);
        }
        if (typeof dryRun !== "undefined" && !validator.isBoolean(dryRun)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, "dryRun must be a boolean");
        }
        const http2SessionHandler = this.useLegacyTransport ? void 0 : new api_request_1.Http2SessionHandler(`https://${FCM_SEND_HOST}`);
        return this.getUrlPath().then((urlPath) => {
          const requests = copy.map(async (message2) => {
            (0, messaging_internal_1.validateMessage)(message2);
            const request = { message: message2 };
            if (dryRun) {
              request.validate_only = true;
            }
            if (http2SessionHandler) {
              return this.messagingRequestHandler.invokeHttp2RequestHandlerForSendResponse(FCM_SEND_HOST, urlPath, request, http2SessionHandler);
            } else {
              return this.messagingRequestHandler.invokeHttpRequestHandlerForSendResponse(FCM_SEND_HOST, urlPath, request);
            }
          });
          return Promise.allSettled(requests);
        }).then((results) => {
          const sessionErrors = http2SessionHandler ? http2SessionHandler.getErrors() : [];
          return this.parseSendResponses(results, sessionErrors);
        }).finally(() => {
          http2SessionHandler?.close();
        });
      }
      parseSendResponses(results, sessionErrors = []) {
        const responses = [];
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            responses.push(result.value);
          } else {
            const error = sessionErrors.length > 0 ? this.createSessionError(result.reason, sessionErrors) : result.reason;
            responses.push({ success: false, error });
          }
        });
        const successCount = responses.filter((resp) => resp.success).length;
        return {
          responses,
          successCount,
          failureCount: responses.length - successCount
        };
      }
      createSessionError(streamReason, sessionErrors) {
        const allErrors = [streamReason, ...sessionErrors];
        const cause = new AggregateError(allErrors, "Stream failure and session failures occurred");
        const streamMessage = streamReason?.message || "Unknown stream error";
        const sessionMessage = `. Session failures: ${sessionErrors.map((e) => e.message).join(", ")}`;
        return new error_1.FirebaseMessagingError({
          code: error_1.messagingClientErrorCode.UNKNOWN_ERROR.code,
          message: `${streamMessage}${sessionMessage}`,
          cause
        });
      }
      sendEachForMulticast(message2, dryRun) {
        const copy = (0, deep_copy_1.deepCopy)(message2);
        if (!validator.isNonNullObject(copy)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, "MulticastMessage must be a non-null object");
        }
        const { tokens, fids, ...baseMessage } = copy;
        if (tokens !== void 0 && !validator.isArray(tokens)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, "tokens must be a valid array");
        }
        if (fids !== void 0 && !validator.isArray(fids)) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, "fids must be a valid array");
        }
        const tokenList = tokens || [];
        const fidList = fids || [];
        if (tokenList.length === 0 && fidList.length === 0) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, "Either tokens or fids must be a non-empty array");
        }
        const totalLength = tokenList.length + fidList.length;
        if (totalLength > FCM_MAX_BATCH_SIZE) {
          throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, `The total number of tokens and fids must not exceed ${FCM_MAX_BATCH_SIZE}.`);
        }
        const messages = [
          ...tokenList.map((token) => ({ ...baseMessage, token })),
          ...fidList.map((fid) => ({ ...baseMessage, fid }))
        ];
        return this.sendEach(messages, dryRun);
      }
      /**
       * Subscribes a device to an FCM topic.
       *
       * See {@link https://firebase.google.com/docs/cloud-messaging/manage-topics#suscribe_and_unsubscribe_using_the |
       * Subscribe to a topic}
       * for code samples and detailed documentation. Optionally, you can provide an
       * array of tokens to subscribe multiple devices.
       *
       * @param registrationTokenOrTokens - A token or array of registration tokens
       *   for the devices to subscribe to the topic.
       * @param topic - The topic to which to subscribe.
       *
       * @returns A promise fulfilled with the server's response after the device has been
       *   subscribed to the topic.
       */
      subscribeToTopic(registrationTokenOrTokens, topic) {
        return this.sendTopicManagementRequestV1(registrationTokenOrTokens, topic, "subscribeToTopic");
      }
      /**
       * Subscribes a device or list of devices to an FCM topic using the legacy Instance ID API.
       * Served as a backup/legacy endpoint.
       *
       * @param registrationTokenOrTokens - A token or array of registration tokens
       *   for the devices to subscribe to the topic.
       * @param topic - The topic to which to subscribe.
       *
       * @returns A promise fulfilled with the server's response after the device has been
       *   subscribed to the topic.
       *
       * @deprecated Use {@link Messaging.subscribeToTopic} instead.
       */
      subscribeToTopicLegacy(registrationTokenOrTokens, topic) {
        return this.sendTopicManagementRequest(registrationTokenOrTokens, topic, "subscribeToTopicLegacy", FCM_TOPIC_MANAGEMENT_ADD_PATH);
      }
      /**
       * Unsubscribes a device from an FCM topic.
       *
       * See {@link https://firebase.google.com/docs/cloud-messaging/admin/manage-topic-subscriptions#unsubscribe_from_a_topic |
       * Unsubscribe from a topic}
       * for code samples and detailed documentation.  Optionally, you can provide an
       * array of tokens to unsubscribe multiple devices.
       *
       * @param registrationTokenOrTokens - A device registration token or an array of
       *   device registration tokens to unsubscribe from the topic.
       * @param topic - The topic from which to unsubscribe.
       *
       * @returns A promise fulfilled with the server's response after the device has been
       *   unsubscribed from the topic.
       */
      unsubscribeFromTopic(registrationTokenOrTokens, topic) {
        return this.sendTopicManagementRequestV1(registrationTokenOrTokens, topic, "unsubscribeFromTopic");
      }
      /**
       * Unsubscribes a device or list of devices from an FCM topic using the legacy Instance ID API.
       * Served as a backup/legacy endpoint.
       *
       * @param registrationTokenOrTokens - A device registration token or an array of
       *   device registration tokens to unsubscribe from the topic.
       * @param topic - The topic from which to unsubscribe.
       *
       * @returns A promise fulfilled with the server's response after the device has been
       *   unsubscribed from the topic.
       *
       * @deprecated Use {@link Messaging.unsubscribeFromTopic} instead.
       */
      unsubscribeFromTopicLegacy(registrationTokenOrTokens, topic) {
        return this.sendTopicManagementRequest(registrationTokenOrTokens, topic, "unsubscribeFromTopicLegacy", FCM_TOPIC_MANAGEMENT_REMOVE_PATH);
      }
      getProjectId() {
        if (this.projectId) {
          return Promise.resolve(this.projectId);
        }
        return utils.findProjectId(this.app).then((projectId) => {
          if (!validator.isNonEmptyString(projectId)) {
            throw new error_1.FirebaseMessagingError(error_1.messagingClientErrorCode.INVALID_ARGUMENT, "Failed to determine project ID for Messaging. Initialize the SDK with service account credentials or set project ID as an app option. Alternatively set the GOOGLE_CLOUD_PROJECT environment variable.");
          }
          this.projectId = projectId;
          return this.projectId;
        });
      }
      getUrlPath() {
        if (this.urlPath) {
          return Promise.resolve(this.urlPath);
        }
        return this.getProjectId().then((projectId) => {
          this.urlPath = `/v1/projects/${projectId}/messages:send`;
          return this.urlPath;
        });
      }
      /**
       * Helper method which sends and handles topic subscription management requests via FCM v1 API.
       *
       * @param registrationTokenOrTokens - The registration token or an array of
       *     registration tokens to subscribe/unsubscribe.
       * @param topic - The topic to subscribe/unsubscribe.
       * @param methodName - The name of the original method called.
       *
       * @returns A Promise fulfilled with the parsed server response.
       */
      sendTopicManagementRequestV1(registrationTokenOrTokens, topic, methodName) {
        this.validateRegistrationTokensType(registrationTokenOrTokens, methodName);
        this.validateTopicType(topic, methodName);
        const normalizedTopic = this.normalizeTopic(topic);
        return Promise.resolve().then(() => {
          this.validateRegistrationTokens(registrationTokenOrTokens, methodName);
          this.validateTopic(normalizedTopic, methodName);
          let registrationTokensArray = registrationTokenOrTokens;
          if (validator.isString(registrationTokenOrTokens)) {
            registrationTokensArray = [registrationTokenOrTokens];
          }
          const topicName = normalizedTopic.replace(/^\/topics\//, "");
          const http2SessionHandler = this.useLegacyTransport ? void 0 : new api_request_1.Http2SessionHandler(`https://${FCM_SEND_HOST}`);
          return this.getProjectId().then((projectId) => {
            const tasks = registrationTokensArray.map((token) => async () => {
              const encodedToken = encodeURIComponent(token);
              const encodedTopic = encodeURIComponent(topicName);
              const basePath = `/v1/projects/${projectId}/registrations/${encodedToken}/topicSubscriptions`;
              const path = methodName === "subscribeToTopic" ? `${basePath}?topic_name=${encodedTopic}` : `${basePath}/${encodedTopic}?allow_missing=true`;
              const requestData = methodName === "subscribeToTopic" ? {} : void 0;
              if (http2SessionHandler) {
                return this.messagingRequestHandler.invokeHttp2RequestHandlerForTopicSubscriptionResponse(FCM_SEND_HOST, path, methodName, requestData, http2SessionHandler);
              }
              return this.messagingRequestHandler.invokeHttpRequestHandlerForTopicSubscriptionResponse(FCM_SEND_HOST, path, methodName, requestData);
            });
            return runWithConcurrencyLimit(tasks, 100);
          }).then((results) => {
            const sessionErrors = http2SessionHandler ? http2SessionHandler.getErrors() : [];
            return this.parseTopicManagementResponses(results, sessionErrors);
          }).finally(() => {
            http2SessionHandler?.close();
          });
        });
      }
      parseTopicManagementResponses(results, sessionErrors = []) {
        const response = {
          successCount: 0,
          failureCount: 0,
          errors: []
        };
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const tokenResponse = result.value;
            if (tokenResponse.success) {
              response.successCount += 1;
            } else {
              response.failureCount += 1;
              const error = tokenResponse.error || error_1.FirebaseMessagingError.fromTopicManagementServerError("UNKNOWN_ERROR", "Unknown error during topic management.");
              response.errors.push({
                index,
                error
              });
            }
          } else {
            response.failureCount += 1;
            let error;
            if (sessionErrors.length > 0) {
              error = this.createSessionError(result.reason, sessionErrors);
            } else if (result.reason instanceof error_1.FirebaseMessagingError) {
              error = result.reason;
            } else {
              error = error_1.FirebaseMessagingError.fromTopicManagementServerError("UNKNOWN_ERROR", result.reason?.message || result.reason?.toString() || "Unknown error during topic management.");
            }
            response.errors.push({
              index,
              error
            });
          }
        });
        return response;
      }
      /**
       * Helper method which sends and handles topic subscription management requests.
       *
       * @param registrationTokenOrTokens - The registration token or an array of
       *     registration tokens to unsubscribe from the topic.
       * @param topic - The topic to which to subscribe.
       * @param methodName - The name of the original method called.
       * @param path - The endpoint path to use for the request.
       *
       * @returns A Promise fulfilled with the parsed server
       *   response.
       */
      sendTopicManagementRequest(registrationTokenOrTokens, topic, methodName, path) {
        this.validateRegistrationTokensType(registrationTokenOrTokens, methodName);
        this.validateTopicType(topic, methodName);
        topic = this.normalizeTopic(topic);
        return Promise.resolve().then(() => {
          this.validateRegistrationTokens(registrationTokenOrTokens, methodName);
          this.validateTopic(topic, methodName);
          let registrationTokensArray = registrationTokenOrTokens;
          if (validator.isString(registrationTokenOrTokens)) {
            registrationTokensArray = [registrationTokenOrTokens];
          }
          const request = {
            to: topic,
            registration_tokens: registrationTokensArray
          };
          return this.messagingRequestHandler.invokeRequestHandler(FCM_TOPIC_MANAGEMENT_HOST, path, request);
        }).then((response) => {
          return mapRawResponseToTopicManagementResponse(response);
        });
      }
      /**
       * Validates the type of the provided registration token(s). If invalid, an error will be thrown.
       *
       * @param registrationTokenOrTokens - The registration token(s) to validate.
       * @param method - The method name to use in error messages.
       * @param errorInfo - The error info to use if the registration tokens are invalid.
       */
      validateRegistrationTokensType(registrationTokenOrTokens, methodName, errorInfo = error_1.messagingClientErrorCode.INVALID_ARGUMENT) {
        if (!validator.isNonEmptyArray(registrationTokenOrTokens) && !validator.isNonEmptyString(registrationTokenOrTokens)) {
          throw new error_1.FirebaseMessagingError(errorInfo, `Registration token(s) provided to ${methodName}() must be a non-empty string or a non-empty array.`);
        }
      }
      /**
       * Validates the provided registration tokens. If invalid, an error will be thrown.
       *
       * @param registrationTokenOrTokens - The registration token or an array of
       *     registration tokens to validate.
       * @param method - The method name to use in error messages.
       * @param errorInfo - The error info to use if the registration tokens are invalid.
       */
      validateRegistrationTokens(registrationTokenOrTokens, methodName, errorInfo = error_1.messagingClientErrorCode.INVALID_ARGUMENT) {
        if (validator.isArray(registrationTokenOrTokens)) {
          if (registrationTokenOrTokens.length > 1e3) {
            throw new error_1.FirebaseMessagingError(errorInfo, `Too many registration tokens provided in a single request to ${methodName}(). Batch your requests to contain no more than 1,000 registration tokens per request.`);
          }
          registrationTokenOrTokens.forEach((registrationToken, index) => {
            if (!validator.isNonEmptyString(registrationToken)) {
              throw new error_1.FirebaseMessagingError(errorInfo, `Registration token provided to ${methodName}() at index ${index} must be a non-empty string.`);
            }
          });
        }
      }
      /**
       * Validates the type of the provided topic. If invalid, an error will be thrown.
       *
       * @param topic - The topic to validate.
       * @param method - The method name to use in error messages.
       * @param errorInfo - The error info to use if the topic is invalid.
       */
      validateTopicType(topic, methodName, errorInfo = error_1.messagingClientErrorCode.INVALID_ARGUMENT) {
        if (!validator.isNonEmptyString(topic)) {
          throw new error_1.FirebaseMessagingError(errorInfo, `Topic provided to ${methodName}() must be a string which matches the format "/topics/[a-zA-Z0-9-_.~%]+".`);
        }
      }
      /**
       * Validates the provided topic. If invalid, an error will be thrown.
       *
       * @param topic - The topic to validate.
       * @param method - The method name to use in error messages.
       * @param errorInfo - The error info to use if the topic is invalid.
       */
      validateTopic(topic, methodName, errorInfo = error_1.messagingClientErrorCode.INVALID_ARGUMENT) {
        if (!validator.isTopic(topic)) {
          throw new error_1.FirebaseMessagingError(errorInfo, `Topic provided to ${methodName}() must be a string which matches the format "/topics/[a-zA-Z0-9-_.~%]+".`);
        }
      }
      /**
       * Normalizes the provided topic name by prepending it with '/topics/', if necessary.
       *
       * @param topic - The topic name to normalize.
       *
       * @returns The normalized topic name.
       */
      normalizeTopic(topic) {
        if (!/^\/topics\//.test(topic)) {
          topic = `/topics/${topic}`;
        }
        return topic;
      }
    };
    exports.Messaging = Messaging;
  }
});

// node_modules/firebase-admin/lib/messaging/index.js
var require_messaging2 = __commonJS({
  "node_modules/firebase-admin/lib/messaging/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessagingErrorCode = exports.FirebaseMessagingError = exports.Messaging = void 0;
    exports.getMessaging = getMessaging2;
    var app_1 = require_app();
    var messaging_1 = require_messaging();
    var messaging_2 = require_messaging();
    Object.defineProperty(exports, "Messaging", { enumerable: true, get: function() {
      return messaging_2.Messaging;
    } });
    function getMessaging2(app) {
      if (typeof app === "undefined") {
        app = (0, app_1.getApp)();
      }
      const firebaseApp = app;
      return firebaseApp.getOrInitService("messaging", (app2) => new messaging_1.Messaging(app2));
    }
    var error_1 = require_error5();
    Object.defineProperty(exports, "FirebaseMessagingError", { enumerable: true, get: function() {
      return error_1.FirebaseMessagingError;
    } });
    Object.defineProperty(exports, "MessagingErrorCode", { enumerable: true, get: function() {
      return error_1.MessagingErrorCode;
    } });
  }
});

// src/server/daily-reminders.ts
import { timingSafeEqual as timingSafeEqual2 } from "node:crypto";

// src/server/firebaseAdmin.ts
var import_app = __toESM(require_app(), 1);
var import_auth = __toESM(require_auth2(), 1);
var import_firestore = __toESM(require_firestore(), 1);

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0577827038",
  appId: "1:73430242023:web:cbe9bf95d52c7ce1238842",
  apiKey: "AIzaSyAS0KuQEdp8qRKQ_3gE43uRw5MQK1PlakY",
  authDomain: "gen-lang-client-0577827038.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-883d63ae-2b86-4327-a3b3-69a91a290e23",
  storageBucket: "gen-lang-client-0577827038.firebasestorage.app",
  messagingSenderId: "73430242023",
  measurementId: "G-WP6PMK0877",
  oAuthClientId: "73430242023-m62f0jhvtjbiih249k201r2bf5634r9c.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/server/firebaseAdmin.ts
function initializeExistingFirebase() {
  if (!(0, import_app.getApps)().length) {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (serviceAccount.project_id !== firebase_applet_config_default.projectId) throw new Error("Firebase project mismatch");
      credential = (0, import_app.cert)(serviceAccount);
    } else {
      credential = (0, import_app.applicationDefault)();
    }
    (0, import_app.initializeApp)({ projectId: firebase_applet_config_default.projectId, credential });
  }
  if ((0, import_app.getApp)().options.projectId !== firebase_applet_config_default.projectId) throw new Error("Firebase project mismatch");
  const databaseId = firebase_applet_config_default.firestoreDatabaseId === "(default)" ? void 0 : firebase_applet_config_default.firestoreDatabaseId;
  return { auth: (0, import_auth.getAuth)(), database: (0, import_firestore.getFirestore)((0, import_app.getApp)(), databaseId) };
}

// src/server/dailyReminders.ts
var import_messaging = __toESM(require_messaging2(), 1);
function malaysiaToday() {
  return new Date(Date.now() + 8 * 3600 * 1e3).toISOString().slice(0, 10);
}
async function sendDailyReminders(db, { dryRun = false } = {}) {
  const today = malaysiaToday();
  const result = { eligible: 0, sent: 0, failed: 0, skippedAlreadyActive: 0, dryRun };
  const snapshot = await db.collection("users").where("fcmToken", "!=", null).limit(200).get();
  if (snapshot.empty) return result;
  const tokens = [];
  const streakTokens = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const token = data.fcmToken ?? null;
    if (!token) continue;
    const lastActive = data.usage?.date ?? null;
    if (lastActive === today) {
      result.skippedAlreadyActive++;
      continue;
    }
    result.eligible++;
    if (data.streak && data.streak > 1) {
      streakTokens.push(token);
    } else {
      tokens.push(token);
    }
  }
  if (dryRun) {
    console.log(`[DryRun] Daily reminders: ${result.eligible} eligible, ${result.skippedAlreadyActive} already active today`);
    return result;
  }
  const messaging = (0, import_messaging.getMessaging)();
  if (streakTokens.length > 0) {
    const batchResult = await messaging.sendEachForMulticast({
      tokens: streakTokens,
      notification: {
        title: "\u{1F525} Jangan putus streak kamu!",
        body: "Kamu ada streak aktif. Praktis sikit hari ni untuk kekalkan streak English kamu."
      },
      webpush: {
        notification: { icon: "/icon-192x192.png", badge: "/icon-192x192.png", tag: "ez-reminder-streak" },
        fcmOptions: { link: "https://ez-academy.my" }
      }
    });
    result.sent += batchResult.successCount;
    result.failed += batchResult.failureCount;
  }
  if (tokens.length > 0) {
    const batchResult = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: "\u{1F4DA} Masa untuk latihan English!",
        body: "Cuba speaking, writing, reading atau listening hari ni. Setiap minit berguna!"
      },
      webpush: {
        notification: { icon: "/icon-192x192.png", badge: "/icon-192x192.png", tag: "ez-reminder-general" },
        fcmOptions: { link: "https://ez-academy.my" }
      }
    });
    result.sent += batchResult.successCount;
    result.failed += batchResult.failureCount;
  }
  return result;
}

// src/server/daily-reminders.ts
var config = { schedule: "0 0 * * *" };
async function handler(request) {
  if (process.env.MIGRATION_MODE !== "production") {
    return new Response("Production only", { status: 403 });
  }
  const expected = process.env.OPS_RUN_SECRET || "";
  const actual = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual2(Buffer.from(actual), Buffer.from(expected))) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    const { database } = initializeExistingFirebase();
    const payload = await request.json().catch(() => ({}));
    const result = await sendDailyReminders(database, { dryRun: payload.dryRun === true });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[daily-reminders] Failed:", err);
    return new Response("Reminder dispatch failed", { status: 500 });
  }
}
export {
  config,
  handler as default
};
/*! Bundled license information:

firebase-admin/lib/utils/error.js:
firebase-admin/lib/utils/validator.js:
firebase-admin/lib/utils/index.js:
firebase-admin/lib/utils/deep-copy.js:
firebase-admin/lib/app/firebase-app.js:
firebase-admin/lib/utils/api-request.js:
firebase-admin/lib/auth/auth-api-request.js:
firebase-admin/lib/auth/token-generator.js:
firebase-admin/lib/auth/user-record.js:
firebase-admin/lib/auth/auth.js:
firebase-admin/lib/firestore/firestore-internal.js:
firebase-admin/lib/messaging/messaging-api-request-internal.js:
firebase-admin/lib/messaging/messaging.js:
  (*! firebase-admin v14.5.0 *)
  (*!
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase-admin/lib/app/error.js:
firebase-admin/lib/auth/error.js:
firebase-admin/lib/firestore/error.js:
firebase-admin/lib/messaging/error.js:
  (*! firebase-admin v14.5.0 *)
  (*!
   * Copyright 2026 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase-admin/lib/app/credential-internal.js:
  (*! firebase-admin v14.5.0 *)
  (*!
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase-admin/lib/app/lifecycle.js:
firebase-admin/lib/app/credential-factory.js:
firebase-admin/lib/app/index.js:
firebase-admin/lib/utils/crypto-signer.js:
  (*! firebase-admin v14.5.0 *)
  (*!
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase-admin/lib/auth/user-import-builder.js:
firebase-admin/lib/auth/action-code-settings-builder.js:
firebase-admin/lib/auth/auth-config.js:
firebase-admin/lib/auth/token-verifier.js:
  (*! firebase-admin v14.5.0 *)
  (*!
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase-admin/lib/auth/tenant.js:
firebase-admin/lib/auth/tenant-manager.js:
firebase-admin/lib/messaging/messaging-errors-internal.js:
  (*! firebase-admin v14.5.0 *)
  (*!
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase-admin/lib/auth/identifier.js:
firebase-admin/lib/auth/index.js:
firebase-admin/lib/firestore/index.js:
firebase-admin/lib/messaging/messaging-internal.js:
firebase-admin/lib/messaging/index.js:
  (*! firebase-admin v14.5.0 *)
  (*!
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase-admin/lib/auth/project-config.js:
  (*! firebase-admin v14.5.0 *)
  (*!
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase-admin/lib/utils/jwt.js:
firebase-admin/lib/auth/base-auth.js:
  (*! firebase-admin v14.5.0 *)
  (*!
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase-admin/lib/auth/project-config-manager.js:
  (*! firebase-admin v14.5.0 *)
*/

require('google-auth-library');
require('fast-deep-equal');
require('@fastify/busboy');
require('debug');
require('lru-memoizer');
require('limiter');
require('jsonwebtoken');
require('@google-cloud/firestore');