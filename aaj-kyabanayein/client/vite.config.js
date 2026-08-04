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
        timeout: 30000,
        proxyTimeout: 30000,
        configure: (proxy) => {
          proxy.on("error", (err, _req, res) => {
            console.error(`[vite] API proxy error (${apiTarget}): ${err.message}`);
            console.error("  → Is API running on port 5000? Try: npm run dev:kill && npm run dev");
            if (res && !res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                success: false,
                message: "API server unavailable. Restart with: npm run dev:kill && npm run dev",
              }));
            }
          });
        },
      },
    },
  },
});
