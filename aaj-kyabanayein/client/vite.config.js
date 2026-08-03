import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiTarget = process.env.VITE_API_PROXY || "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
  server: {
    host: true, // 0.0.0.0 — phone on same Wi‑Fi can open Mac IP:3000
    port: Number(process.env.VITE_PORT) || 3000,
    strictPort: false,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
