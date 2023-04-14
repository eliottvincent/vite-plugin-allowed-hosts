import { createServer } from "vite";
import request from "supertest";

import pluginAllowedHosts from "./../src/index.js";

const DEFAULT_HOST = "localhost";
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

  // Return the underlying http server
  return Promise.resolve(currentServer.httpServer);
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
 * Sends request to server
 * @public
 * @param  {object} server
 * @param  {string} [host]
 * @return {object} Promise object
 */
var sendRequest = async function(server, host = null) {
  const res = await request(server)
    .get("/index.html")
    .set("Host", host !== null ? host : `${DEFAULT_HOST}:${DEFAULT_PORT}`);

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

export { initServer, destroyServer, sendRequest };
