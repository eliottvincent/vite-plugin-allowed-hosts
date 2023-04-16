import os from "os";
import { describe, it, expect, afterEach } from "vitest";

import {
  initServer, destroyServer, sendRequest, overrideDNSLookup, restoreDNSLookup
} from "./helpers.js";

const TEST_TIMEOUT = 20000; // 20 seconds

const HOST_FILE = "file://my-storage/index.html";
const HOST_CHROME_EXTENSION = "chrome-extension://my-extension/index.html";
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

const OK_STATUS = 200;
const OK_TEXT = "Hello World";
const BAD_REQUEST_STATUS = 400;
const BAD_REQUEST_TEXT = "Invalid Host header";

// Always destroy the server after each test, to avoid dangling connections \
//   (this will run even when a test fails)
afterEach(async () => {
  await destroyServer();
});

describe("basic behavior", () => {
  it("should allow all requests - 'hosts' set to 'all'", async () => {
    await initServer("all");

    const defaultRes = await sendRequest();
    expect(defaultRes.statusCode).toBe(OK_STATUS);
    expect(defaultRes.text.includes(OK_TEXT)).toBe(true);

    const ipv4Res = await sendRequest(HOST_IPV4);
    expect(ipv4Res.statusCode).toBe(OK_STATUS);
    expect(ipv4Res.text.includes(OK_TEXT)).toBe(true);

    const ipv6Res = await sendRequest(HOST_IPV6);
    expect(ipv6Res.statusCode).toBe(OK_STATUS);
    expect(ipv6Res.text.includes(OK_TEXT)).toBe(true);

    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(OK_STATUS);
    expect(domainRes.text.includes(OK_TEXT)).toBe(true);

    const subDomainRes = await sendRequest(HOST_SUBDOMAIN);
    expect(subDomainRes.statusCode).toBe(OK_STATUS);
    expect(subDomainRes.text.includes(OK_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should not allow a request - empty 'host' header", async () => {
    await initServer();

    const res = await sendRequest("");
    expect(res.statusCode).toEqual(BAD_REQUEST_STATUS);
    expect(res.text).toEqual(BAD_REQUEST_TEXT);
  }, TEST_TIMEOUT);

  it("should allow a request - same 'host' as Vite server", async () => {
    // Force DNS lookup to resolve 'acme.com' as localhost, that way we can \
    //   virtually bind the server to 'acme.com' and proceed to requests to it
    overrideDNSLookup(HOST_DOMAIN, "localhost");

    // Bind Vite server to 'acme.com'
    await initServer([], HOST_DOMAIN);

    // Proceed to request with 'acme.com' as host header
    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(OK_STATUS);
    expect(domainRes.text.includes(OK_TEXT)).toBe(true);

    // Restore original DNS lookup behavior
    restoreDNSLookup();
  }, TEST_TIMEOUT);

  it("should allow file: and chrome-extension: requests - no 'hosts'", async () => {
    await initServer();

    const defaultRes = await sendRequest();
    expect(defaultRes.statusCode).toBe(OK_STATUS);
    expect(defaultRes.text.includes(OK_TEXT)).toBe(true);

    const fileRes = await sendRequest(HOST_FILE);
    expect(fileRes.statusCode).toBe(OK_STATUS);
    expect(fileRes.text.includes(OK_TEXT)).toBe(true);

    const chromeExtensionRes = await sendRequest(HOST_CHROME_EXTENSION);
    expect(chromeExtensionRes.statusCode).toBe(OK_STATUS);
    expect(chromeExtensionRes.text.includes(OK_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should allow localhost and IP requests - no 'hosts'", async () => {
    await initServer();

    const defaultRes = await sendRequest();
    expect(defaultRes.statusCode).toBe(OK_STATUS);
    expect(defaultRes.text.includes(OK_TEXT)).toBe(true);

    // Test all localhost variants
    await Promise.all(LOCALHOSTS.map(async (localhost) => {
      const localhostRes = await sendRequest(localhost);
      expect(localhostRes.statusCode).toBe(OK_STATUS);
      expect(localhostRes.text.includes(OK_TEXT)).toBe(true);
    }));

    const ipv4Res = await sendRequest(HOST_IPV4);
    expect(ipv4Res.statusCode).toBe(OK_STATUS);
    expect(ipv4Res.text.includes(OK_TEXT)).toBe(true);

    const ipv6Res = await sendRequest(HOST_IPV6);
    expect(ipv6Res.statusCode).toBe(OK_STATUS);
    expect(ipv6Res.text.includes(OK_TEXT)).toBe(true);

    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(BAD_REQUEST_STATUS);
    expect(domainRes.text.includes(BAD_REQUEST_TEXT)).toBe(true);

    const subDomainRes = await sendRequest(HOST_SUBDOMAIN);
    expect(subDomainRes.statusCode).toBe(BAD_REQUEST_STATUS);
    expect(subDomainRes.text.includes(BAD_REQUEST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should allow localhost and IP requests - empty 'hosts'", async () => {
    await initServer([]);

    const defaultRes = await sendRequest();
    expect(defaultRes.statusCode).toBe(OK_STATUS);
    expect(defaultRes.text.includes(OK_TEXT)).toBe(true);

    // Test all localhost variants
    await Promise.all(LOCALHOSTS.map(async (localhost) => {
      const localhostRes = await sendRequest(localhost);
      expect(localhostRes.statusCode).toBe(OK_STATUS);
      expect(localhostRes.text.includes(OK_TEXT)).toBe(true);
    }));

    const ipv4Res = await sendRequest(HOST_IPV4);
    expect(ipv4Res.statusCode).toBe(OK_STATUS);
    expect(ipv4Res.text.includes(OK_TEXT)).toBe(true);

    const ipv6Res = await sendRequest(HOST_IPV6);
    expect(ipv6Res.statusCode).toBe(OK_STATUS);
    expect(ipv6Res.text.includes(OK_TEXT)).toBe(true);

    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(BAD_REQUEST_STATUS);
    expect(domainRes.text.includes(BAD_REQUEST_TEXT)).toBe(true);

    const subDomainRes = await sendRequest(HOST_SUBDOMAIN);
    expect(subDomainRes.statusCode).toBe(BAD_REQUEST_STATUS);
    expect(subDomainRes.text.includes(BAD_REQUEST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should allow requests with correct hostname - 'hosts' set to 'acme.com'", async () => {
    await initServer(HOST_DOMAIN);

    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(OK_STATUS);
    expect(domainRes.text.includes(OK_TEXT)).toBe(true);

    const subdomainRes = await sendRequest(HOST_SUBDOMAIN);
    expect(subdomainRes.statusCode).toBe(BAD_REQUEST_STATUS);
    expect(subdomainRes.text.includes(BAD_REQUEST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should allow requests with correct hostname - 'hosts' set to ['acme.com']", async () => {
    await initServer([HOST_DOMAIN]);

    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(OK_STATUS);
    expect(domainRes.text.includes(OK_TEXT)).toBe(true);

    const subdomainRes = await sendRequest(HOST_SUBDOMAIN);
    expect(subdomainRes.statusCode).toBe(BAD_REQUEST_STATUS);
    expect(subdomainRes.text.includes(BAD_REQUEST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);

  it("should allow requests with correct hostname - 'hosts' set to ['.acme.com']", async () => {
    await initServer([HOST_WILDCARD]);

    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(OK_STATUS);
    expect(domainRes.text.includes(OK_TEXT)).toBe(true);

    const subdomainRes = await sendRequest(HOST_SUBDOMAIN);
    expect(subdomainRes.statusCode).toBe(OK_STATUS);
    expect(subdomainRes.text.includes(OK_TEXT)).toBe(true);

    const fooBarRes = await sendRequest("foo.bar");
    expect(fooBarRes.statusCode).toBe(BAD_REQUEST_STATUS);
    expect(fooBarRes.text.includes(BAD_REQUEST_TEXT)).toBe(true);
  }, TEST_TIMEOUT);
});
