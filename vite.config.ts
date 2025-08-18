import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/word-imposter",
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: {
    include: ["@imposter/shared"],
  },
  build: {
    rollupOptions: {
      preserveSymlinks: true,
    },
  },
});
