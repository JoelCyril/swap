import { createRequire } from "node:module";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const require = createRequire(import.meta.url);
const tslibEsm = require.resolve("tslib/tslib.es6.mjs");

const nodeRolldown = { platform: "node" as const };

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    // Vite/Nitro SSR otherwise emits __toESM(tslib).default.__extends, which is undefined.
    // https://github.com/nitrojs/nitro/issues/4113
    nitro({
      rolldownConfig: nodeRolldown,
    }),
    react(),
  ],
  resolve: {
    alias: {
      tslib: tslibEsm,
    },
  },
  ssr: {
    target: "node",
  },
  environments: {
    ssr: {
      build: {
        rolldownOptions: nodeRolldown,
      },
    },
  },
});
