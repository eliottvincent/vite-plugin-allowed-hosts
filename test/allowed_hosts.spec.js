import os from "os";
import { describe, it, expect, afterEach } from "vitest";

import { initServer, destroyServer, sendRequest } from "./helpers.js";

const TEST_TIMEOUT = 20000; // 20 seconds

const HOST_IPV4 = "192.168.1.1";
const HOST_IPV6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
const HOST_DOMAIN = "acme.com";
const HOST_WILDCARD = ".acme.com";
const HOST_SUBDOMAIN = "sub.acme.com";

const LOCALHOSTS = [
  "localhost",
  "sub.localhost",
  "127.0.0.1",
  "0000:0000:0000:0000:0000:0000:0000:0001",
];

const VALID_HOST_STATUS = 200;
const VALID_HOST_TEXT = "Hello World";
const INVALID_HOST_STATUS = 400;
const INVALID_HOST_TEXT = "Invalid Host header";

// Always destroy the server after each test, to avoid dangling connections \
//   (this will run even when a test fails)
afterEach(async () => {
  await destroyServer();
});

describe("basic behavior", () => {
  it("should allow all requests - 'hosts' set to 'all'", async () => {
    const server = await initServer("all");

    const defaultRes = await sendRequest(server);
    expect(defaultRes.statusCode).toBe(VALID_HOST_STATUS);
    expect(defaultRes.text.includes(VALID_HOST_TEXT)).toBe(true);

    const ipv4Res = await sendRequest(server, HOST_IPV4);
    expect(ipv4Res.statusCode).toBe(VALID_HOST_STATUS);
    expect(ipv4Res.text.includes(VALID_HOST_TEXT)).toBe(true);

    const ipv6Res = await sendRequest(server, HOST_IPV6);
    expect(ipv6Res.statusCode).toBe(VALID_HOST_STATUS);
    expect(ipv6Res.text.includes(VALID_HOST_TEXT)).toBe(true);

    const domainRes = await sendRequest(server, HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(VALID_HOST_STATUS);
    expect(domainRes.text.includes(VALID_HOST_TEXT)).toBe(true);

    const subDomainRes = await sendRequest(server, HOST_SUBDOMAIN);
    expect(subDomainRes.statusCode).toBe(VALID_HOST_STATUS);
    expect(subDomainRes.text.includes(VALID_HOST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should not allow a request - empty 'host' header", async () => {
    const server = await initServer();

    const res = await sendRequest(server, "");
    expect(res.statusCode).toEqual(INVALID_HOST_STATUS);
    expect(res.text).toEqual(INVALID_HOST_TEXT);
  }, TEST_TIMEOUT);

  it("should allow a request - same 'host' as Vite server", async () => {
    // Use the hostname of the current OS, this avoids setting up a dedicated \
    //   network interface
    const host = os.hostname().toLowerCase();

    // Configure Vite server with custom hostname
    const server = await initServer([], host);

    // Proceed to request with the same hostname
    const domainRes = await sendRequest(server, host);
    expect(domainRes.statusCode).toBe(VALID_HOST_STATUS);
    expect(domainRes.text.includes(VALID_HOST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should allow localhost and IP requests - no 'hosts'", async () => {
    const server = await initServer();

    const defaultRes = await sendRequest(server);
    expect(defaultRes.statusCode).toBe(VALID_HOST_STATUS);
    expect(defaultRes.text.includes(VALID_HOST_TEXT)).toBe(true);

    // Test all localhost variants
    await Promise.all(LOCALHOSTS.map(async (localhost) => {
      const localhostRes = await sendRequest(server, localhost);
      expect(localhostRes.statusCode).toBe(VALID_HOST_STATUS);
      expect(localhostRes.text.includes(VALID_HOST_TEXT)).toBe(true);
    }));

    const ipv4Res = await sendRequest(server, HOST_IPV4);
    expect(ipv4Res.statusCode).toBe(VALID_HOST_STATUS);
    expect(ipv4Res.text.includes(VALID_HOST_TEXT)).toBe(true);

    const ipv6Res = await sendRequest(server, HOST_IPV6);
    expect(ipv6Res.statusCode).toBe(VALID_HOST_STATUS);
    expect(ipv6Res.text.includes(VALID_HOST_TEXT)).toBe(true);

    const domainRes = await sendRequest(server, HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(INVALID_HOST_STATUS);
    expect(domainRes.text.includes(INVALID_HOST_TEXT)).toBe(true);

    const subDomainRes = await sendRequest(server, HOST_SUBDOMAIN);
    expect(subDomainRes.statusCode).toBe(INVALID_HOST_STATUS);
    expect(subDomainRes.text.includes(INVALID_HOST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should allow requests with correct hostname - 'hosts' string", async () => {
    const server = await initServer(HOST_DOMAIN);

    const domainRes = await sendRequest(server, HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(VALID_HOST_STATUS);
    expect(domainRes.text.includes(VALID_HOST_TEXT)).toBe(true);

    const subdomainRes = await sendRequest(server, HOST_SUBDOMAIN);
    expect(subdomainRes.statusCode).toBe(INVALID_HOST_STATUS);
    expect(subdomainRes.text.includes(INVALID_HOST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should allow requests with correct hostname - 'hosts' set to 'acme.com'", async () => {
    const server = await initServer([HOST_DOMAIN]);

    const domainRes = await sendRequest(server, HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(VALID_HOST_STATUS);
    expect(domainRes.text.includes(VALID_HOST_TEXT)).toBe(true);

    const subdomainRes = await sendRequest(server, HOST_SUBDOMAIN);
    expect(subdomainRes.statusCode).toBe(INVALID_HOST_STATUS);
    expect(subdomainRes.text.includes(INVALID_HOST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should allow requests with correct hostname - 'hosts' set to ['acme.com']", async () => {
    const server = await initServer([HOST_DOMAIN]);

    const domainRes = await sendRequest(server, HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(VALID_HOST_STATUS);
    expect(domainRes.text.includes(VALID_HOST_TEXT)).toBe(true);

    const subdomainRes = await sendRequest(server, HOST_SUBDOMAIN);
    expect(subdomainRes.statusCode).toBe(INVALID_HOST_STATUS);
    expect(subdomainRes.text.includes(INVALID_HOST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);


    it("should allow requests with correct hostname - 'hosts' set to ['.acme.com']", async () => {
      const server = await initServer([HOST_WILDCARD]);

      const domainRes = await sendRequest(server, HOST_DOMAIN);
      expect(domainRes.statusCode).toBe(VALID_HOST_STATUS);
      expect(domainRes.text.includes(VALID_HOST_TEXT)).toBe(true);

      const subdomainRes = await sendRequest(server, HOST_SUBDOMAIN);
      expect(subdomainRes.statusCode).toBe(VALID_HOST_STATUS);
      expect(subdomainRes.text.includes(VALID_HOST_TEXT)).toBe(true);

      const fooBarRes = await sendRequest(server, "foo.bar");
      expect(fooBarRes.statusCode).toBe(INVALID_HOST_STATUS);
      expect(fooBarRes.text.includes(INVALID_HOST_TEXT)).toBe(true);
    }, TEST_TIMEOUT);
});
