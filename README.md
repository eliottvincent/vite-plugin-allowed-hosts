# Vite Allowed Hosts

[![Build Status](https://github.com/eliottvincent/vite-plugin-allowed-hosts/actions/workflows/test.yml/badge.svg)](https://github.com/eliottvincent/vite-plugin-allowed-hosts/actions) [![Version](https://img.shields.io/npm/v/vite-plugin-allowed-hosts.svg)](https://www.npmjs.com/package/vite-plugin-allowed-hosts) [![Downloads](https://img.shields.io/npm/dt/vite-plugin-allowed-hosts.svg)](https://www.npmjs.com/package/vite-plugin-allowed-hosts)

> Specify a list of hosts that are allowed to access your Vite dev server.


## Motivation

By rejecting requests with an unrecognized `Host` header, this plugin prevents **DNS rebinding attacks**, which are possible even under many seemingly-safe web server configurations.

In a [DNS rebinding attack](https://en.wikipedia.org/wiki/DNS_rebinding), an attacker can create a malicious website that makes requests to the development server using the victim’s browser, potentially gaining access to sensitive data or executing unauthorized actions.


## Usage

```js
// vite.config.js
import allowedHostsPlugin from "vite-plugin-allowed-hosts";

export default {
  plugins: [
    allowedHostsPlugin({
      hosts: ["acme.com", ".dev.acme.com"]
    })
  ]
}
```


## Options

#### `hosts`

- **Type:** `'auto' | 'all' | string | string[]`
- **Default:** `'auto'`

  When set to `'auto'`, it will always allow `localhost` and [`server.host`](https://vitejs.dev/config/server-options.html#server-host).

  When set to `'all'`, no header check will be done. This is obviously **not recommended**.

  A value beginning with a period `.` can be used as a subdomain wildcard. For example, `'.acme.com'` will match `acme.com`, `www.acme.com`, and any other subdomain of `acme.com`.

  If the `Host` header doesn't match any value in this list, a **403** Forbidden HTTP error will be returned.

## License

vite-plugin-allowed-hosts is released under the MIT License. See the bundled LICENSE file for details.
