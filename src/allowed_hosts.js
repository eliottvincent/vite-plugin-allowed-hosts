import { bindServer } from "./plugin";

var pluginAllowedHosts = function (options) {
  let config;

  return {
    name: "vite-plugin-allowed-hosts",
    apply: "serve",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(server) {
      bindServer(server, options, config);
    }
  };
};

export default pluginAllowedHosts;

export { pluginAllowedHosts };
