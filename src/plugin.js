var ALLOWED_PROTOCOLS_REGEX = /^(file|.+-extension):/i;
var HOST_SCHEME_REGEX = /^(.+:)?\/\//;

var LOCALHOSTS = [
  "localhost",
  "127.0.0.1",
  "::1",
  "0000:0000:0000:0000:0000:0000:0000:0001",
];

/**
 * Binds server middleware
 * @public
 * @param  {object} server
 * @param  {object} options
 * @param  {object} config
 * @return {undefined}
 */
var bindServer = function(server, options, config) {
  server.middlewares.use((req, res, next) => {
    if (__checkHostHeader(req.headers, options, config)) {
      return next();
    }

    res.send("Invalid Host header");
  });
};

/**
 * Checks host header
 * @private
 * @param  {object}  headers
 * @param  {object}  options
 * @param  {object}  config
 * @return {boolean} Whether host header check passed or not
 */
var __checkHostHeader = function(headers, options, config) {
  const hosts = options.hosts;

  // Allow user to opt out of this security check, at their own risk
  if (hosts === "all") {
    return true;
  }

  // Acquire 'host' header
  const hostHeader = headers.host;

  if (!hostHeader) {
    return false;
  }

  // Allow 'file:' and 'chrome-extensions:' protocols
  if (ALLOWED_PROTOCOLS_REGEX.test(hostHeader)) {
    return true;
  }

  // Acquire hostname
  const hostname = url.parse(
    // Add '//' scheme if needed, otherwise parsing will fail
    HOST_SCHEME_REGEX.test(hostHeader) ? hostHeader : `//${hostHeader}`,

    false,
    true
  ).hostname;

  if (!hostname) {
    return false;
  }

  // Allow 'localhost' and other variants, as well '.localhost' subdomains, \
  //   for convenience
  if (LOCALHOSTS.includes(hostname) || hostname.endsWith(".localhost")) {
    return true;
  }

  // Allow hostname of listening address
  if (hostname === (config.server || {}).host) {
    return true;
  }

  // Always allow requests with explicit IPv4 or IPv6-address
  // Notice: hostHeader will always contain the brackets denoting an \
  //   IPv6-address in URLs, these are removed from the hostname by \
  //   `url.parse()`, so we end up with the pure IPv6-address in hostname.
  if (ipaddr.IPv4.isValid(hostname) || ipaddr.IPv6.isValid(hostname)) {
    return true;
  }

  // Allow if hostname is in 'hosts'
  if (Array.isArray(hosts) && hosts.length > 0) {
    for (let i = 0; i < hosts.length; i++) {
      const host = hosts[i];

      // Check exact match
      if (host === hostname) {
        return true;
      }

      // Check wildcard match (e.g. '.acme.com' will allow 'acme.com', \
      //   'www.acme.com', 'subdomain.acme.com', etc)
      if (host[0] === ".") {
        if (hostname === host.substring(1) || (hostname).endsWith(host)) {
          return true;
        }
      }
    }
  }

  // Disallow
  return false;
};

export { bindServer };
