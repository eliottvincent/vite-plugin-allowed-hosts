import os from "os";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import {
  initServer, destroyServer, sendRequest, overrideDNSLookup, restoreDNSLookup
} from "./helpers.js";

const HOST_FILE = "file://my-storage/index.html";
const HOST_CHROME_EXTENSION = "chrome-extension://my-extension/index.html";
const HOST_IPV4 = "192.168.1.1";
const HOST_IPV6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
const HOST_DOMAIN = "acme.com";
const HOST_DOMAINS = [
  "acme.com", "emca.com"
];
const HOST_WILDCARD = ".acme.com";
const HOST_SUBDOMAIN = "app.acme.com";
const HOST_SUBDOMAINS = [
  "www.acme.com",
  "subdomain.acme.com",
  "acme.com",
  "subsubcomain.subdomain.acme.com",
  "acme.com:80",
  "subdomain.acme.com:80",
];

const LOCALHOSTS = [
  "localhost",
  "app.localhost",
  "127.0.0.1",
  "0000:0000:0000:0000:0000:0000:0000:0001",
];

const OK_STATUS = 200;
const OK_TEXT = "Hello World";
const FORBIDDEN_STATUS = 403;
const FORBIDDEN_TEXT = "Invalid Host header";

describe("server with no 'hosts'", () => {
  beforeAll(async () => {
    await initServer();
  });

  it("should allow :file and :chrome-extension", async () => {
    const fileRes = await sendRequest(HOST_FILE);
    expect(fileRes.statusCode).toBe(OK_STATUS);
    expect(fileRes.text.includes(OK_TEXT)).toBe(true);

    const chromeExtensionRes = await sendRequest(HOST_CHROME_EXTENSION);
    expect(chromeExtensionRes.statusCode).toBe(OK_STATUS);
    expect(chromeExtensionRes.text.includes(OK_TEXT)).toBe(true);
  });

  it("should allow all localhost variants", async () => {
    await Promise.all(LOCALHOSTS.map(async (localhost) => {
      const res = await sendRequest(localhost);
      expect(res.statusCode).toBe(OK_STATUS);
      expect(res.text.includes(OK_TEXT)).toBe(true);
    }));
  });

  it("should not allow domain and subdomain", async () => {
    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(FORBIDDEN_STATUS);
    expect(domainRes.text.includes(FORBIDDEN_TEXT)).toBe(true);

    const subDomainRes = await sendRequest(HOST_SUBDOMAIN);
    expect(subDomainRes.statusCode).toBe(FORBIDDEN_STATUS);
    expect(subDomainRes.text.includes(FORBIDDEN_TEXT)).toBe(true);
  });

  // Destroy the server to avoid dangling connections (this will run even \
  //   when a test fails)
  afterAll(async () => {
    await destroyServer();
  });
});

describe("server with empty 'hosts'", () => {
  beforeAll(async () => {
    await initServer([]);
  });

  it("should not allow domain and subdomain", async () => {
    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(FORBIDDEN_STATUS);
    expect(domainRes.text.includes(FORBIDDEN_TEXT)).toBe(true);

    const subDomainRes = await sendRequest(HOST_SUBDOMAIN);
    expect(subDomainRes.statusCode).toBe(FORBIDDEN_STATUS);
    expect(subDomainRes.text.includes(FORBIDDEN_TEXT)).toBe(true);
  });

  // Destroy the server to avoid dangling connections (this will run even \
  //   when a test fails)
  afterAll(async () => {
    await destroyServer();
  });
});

describe("server with 'hosts' set to 'all'", () => {
  beforeAll(async () => {
    await initServer("all");
  });

  it("should allow default request", async () => {
    const res = await sendRequest();
    expect(res.statusCode).toBe(OK_STATUS);
    expect(res.text.includes(OK_TEXT)).toBe(true);
  });

  it("should allow explicit IPv4 or IPv6 address", async () => {
    const ipv4Res = await sendRequest(HOST_IPV4);
    expect(ipv4Res.statusCode).toBe(OK_STATUS);
    expect(ipv4Res.text.includes(OK_TEXT)).toBe(true);

    const ipv6Res = await sendRequest(HOST_IPV6);
    expect(ipv6Res.statusCode).toBe(OK_STATUS);
    expect(ipv6Res.text.includes(OK_TEXT)).toBe(true);
  });

  it("should allow domain and subdomain", async () => {
    const domainRes = await sendRequest(HOST_DOMAIN);
    expect(domainRes.statusCode).toBe(OK_STATUS);
    expect(domainRes.text.includes(OK_TEXT)).toBe(true);

    const subDomainRes = await sendRequest(HOST_SUBDOMAIN);
    expect(subDomainRes.statusCode).toBe(OK_STATUS);
    expect(subDomainRes.text.includes(OK_TEXT)).toBe(true);
  });

  afterAll(async () => {
    // Destroy the server to avoid dangling connections (this will run even \
    //   when a test fails)
    await destroyServer();
  });
});

describe("server with 'hosts' set to 'acme.com'", () => {
  beforeAll(async () => {
    await initServer(HOST_DOMAIN);
  });

  it("should allow matching domain", async () => {
    const res = await sendRequest(HOST_DOMAIN);
    expect(res.statusCode).toBe(OK_STATUS);
    expect(res.text.includes(OK_TEXT)).toBe(true);
  });

  it("should not allow subdomain", async () => {
    const res = await sendRequest(HOST_SUBDOMAIN);
    expect(res.statusCode).toBe(FORBIDDEN_STATUS);
    expect(res.text.includes(FORBIDDEN_TEXT)).toBe(true);
  });

  it("should not allow non-matching domain", async () => {
    const res = await sendRequest("foo.bar");
    expect(res.statusCode).toBe(FORBIDDEN_STATUS);
    expect(res.text.includes(FORBIDDEN_TEXT)).toBe(true);
  });

  // Destroy the server to avoid dangling connections (this will run even \
  //   when a test fails)
  afterAll(async () => {
    await destroyServer();
  });
});

describe("server with 'hosts' set to ['acme.com']", () => {
  beforeAll(async () => {
    await initServer([HOST_DOMAIN]);
  });

  it("should allow matching domain", async () => {
    const res = await sendRequest(HOST_DOMAIN);
    expect(res.statusCode).toBe(OK_STATUS);
    expect(res.text.includes(OK_TEXT)).toBe(true);
  });

  it("should not allow subdomain", async () => {
    const res = await sendRequest(HOST_SUBDOMAIN);
    expect(res.statusCode).toBe(FORBIDDEN_STATUS);
    expect(res.text.includes(FORBIDDEN_TEXT)).toBe(true);
  });

  // Destroy the server to avoid dangling connections (this will run even \
  //   when a test fails)
  afterAll(async () => {
    await destroyServer();
  });
});

describe("server with 'hosts' set to ['acme.com', 'emca.com']", () => {
  beforeAll(async () => {
    await initServer(HOST_DOMAINS);
  });

  it("should allow all domain variants", async () => {
    await Promise.all(HOST_DOMAINS.map(async (domain) => {
      const res = await sendRequest(domain);
      expect(res.statusCode).toBe(OK_STATUS);
      expect(res.text.includes(OK_TEXT)).toBe(true);
    }));
  });

  it("should not allow subdomain", async () => {
    const res = await sendRequest(HOST_SUBDOMAIN);
    expect(res.statusCode).toBe(FORBIDDEN_STATUS);
    expect(res.text.includes(FORBIDDEN_TEXT)).toBe(true);
  });

  // Destroy the server to avoid dangling connections (this will run even \
  //   when a test fails)
  afterAll(async () => {
    await destroyServer();
  });
});

describe("server with 'hosts' set to ['.acme.com']", () => {
  beforeAll(async () => {
    await initServer([HOST_WILDCARD]);
  });

  it("should allow matching domain", async () => {
    const res = await sendRequest(HOST_DOMAIN);
    expect(res.statusCode).toBe(OK_STATUS);
    expect(res.text.includes(OK_TEXT)).toBe(true);
  });

  it("should allow subdomain", async () => {
    const res = await sendRequest(HOST_SUBDOMAIN);
    expect(res.statusCode).toBe(OK_STATUS);
    expect(res.text.includes(OK_TEXT)).toBe(true);
  });

  it("should allow all subdomain variants", async () => {
    await Promise.all(HOST_SUBDOMAINS.map(async (subDomain) => {
      const res = await sendRequest(subDomain);
      expect(res.statusCode).toBe(OK_STATUS);
      expect(res.text.includes(OK_TEXT)).toBe(true);
    }));
  });

  // Destroy the server to avoid dangling connections (this will run even \
  //   when a test fails)
  afterAll(async () => {
    await destroyServer();
  });
});

describe("request with empty 'host' header", () => {
  beforeAll(async () => {
    await initServer();
  });

  it("should not allow the request", async () => {
    const res = await sendRequest("");
    expect(res.statusCode).toEqual(FORBIDDEN_STATUS);
    expect(res.text).toEqual(FORBIDDEN_TEXT);
  });

  afterAll(async () => {
    // Destroy the server to avoid dangling connections (this will run even \
    //   when a test fails)
    await destroyServer();
  });
});

describe("request with same 'host' as the server", () => {
  beforeAll(async () => {
    // Force DNS lookup to resolve 'acme.com' as localhost, that way we can \
    //   virtually bind the server to 'acme.com' and proceed to requests to it
    overrideDNSLookup(HOST_DOMAIN, "localhost");

    // Bind server to 'acme.com'
    await initServer([], HOST_DOMAIN);
  });

  it("should allow the request", async () => {
    // Proceed to request with 'acme.com' as host header
    const res = await sendRequest(HOST_DOMAIN);
    expect(res.statusCode).toBe(OK_STATUS);
    expect(res.text.includes(OK_TEXT)).toBe(true);
  });

  afterAll(async () => {
    // Restore original DNS lookup behavior
    restoreDNSLookup();

    // Destroy the server to avoid dangling connections (this will run even \
    //   when a test fails)
    await destroyServer();
  });
});
