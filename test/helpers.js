import dns from "dns";

import { createServer } from "vite";
import request from "supertest";

import pluginAllowedHosts from "./../src/index.js";

const ORIGINAL_DNS_LOOKUP = dns.lookup;

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 5173;

const TEMPORIZE_DELAY = 5000; // 5 seconds

let currentServer;

/**
 * Initializes server
 * @public
 * @param  {object} hosts
 * @param  {string} [serverHost]
 * @param  {number} [serverPort]
 * @return {object} Promise object
 */
var initServer = async function(hosts, serverHost = null, serverPort = null) {
  currentServer = await createServer({
    configFile: false,
    envFile: false,

    root: "./test",

    server: {
      host: serverHost !== null ? serverHost : DEFAULT_HOST,
      port: serverPort !== null ? serverPort : DEFAULT_PORT
    },

    plugins: [
      pluginAllowedHosts({
        hosts: hosts
      })
    ]
  });

  await currentServer.listen();

  await __temporize();

  return Promise.resolve();
};

/**
 * Destroys server
 * @public
 * @return {object} Promise object
 */
var destroyServer = async function() {
  await currentServer.close();

  await __temporize();

  return Promise.resolve();
};

/**
 * Overrides DNS lookup
 * @public
 * @param  {string} host
 * @param  {string} ip
 * @return {object} Promise object
 */
var overrideDNSLookup = function(host, ip) {
  dns.lookup = function(domain, callback) {
    if (domain === host) {
      return callback(null, ip, 4); // 4 = IPv4
    }

    return ORIGINAL_DNS_LOOKUP.call(this, domain, callback);
  }
};

/**
 * Restores DNS lookup
 * @public
 * @return {object} Promise object
 */
var restoreDNSLookup = function() {
  dns.lookup = ORIGINAL_DNS_LOOKUP;
};

/**
 * Sends request to server
 * @public
 * @param  {string} [host]
 * @param  {string} [ip]
 * @return {object} Promise object
 */
var sendRequest = async function(host = null, ip = null) {
  // Pass the underlying http.Server
  const res = await request(currentServer.httpServer)
    .get("/index.html")
    .set("Host", host !== null ? host : `${DEFAULT_HOST}:${DEFAULT_PORT}`)
    .connect(ip !== null ? ip : undefined);

// request.get("http://example.com");
  return Promise.resolve(res);
};

/**
 * Temporizes
 * @private
 * @return {object} Promise object
 */
var __temporize = async function() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, TEMPORIZE_DELAY);
  });
};

export {
  initServer,
  destroyServer,
  sendRequest,
  overrideDNSLookup,
  restoreDNSLookup
};
