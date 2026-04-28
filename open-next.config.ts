import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

if (!config.default.bundle) {
  config.default.bundle = {};
}
config.default.bundle.minify = true;
config.default.bundle.esbuildOptions = {
  external: ["@libsql/isomorphic-ws"],
};

if (config.middleware) {
  if (!config.middleware.bundle) {
    config.middleware.bundle = {};
  }
  config.middleware.bundle.minify = true;
}

export default config;
