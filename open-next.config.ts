import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

if (!config.default.bundle) {
  config.default.bundle = {};
}
config.default.bundle.minify = true;

if (config.middleware) {
  if (!config.middleware.bundle) {
    config.middleware.bundle = {};
  }
  config.middleware.bundle.minify = true;
}

export default config;
