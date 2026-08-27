import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    nitro(),
    react(),
  ],
  ssr: {
    // Forces Vite to bundle tslib & Supabase directly into Nitro's build output
    noExternal: ["tslib", "@supabase/functions-js", "@supabase/supabase-js"],
  },
});
