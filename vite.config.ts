import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@imposter/shared": "./shared",
    },
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
