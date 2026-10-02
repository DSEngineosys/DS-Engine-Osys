import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.FRONTEND_PORT ?? (process.env.PORT !== "8080" ? process.env.PORT : undefined);
const port = rawPort ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  appType: "spa",
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        proxyTimeout: 10_000,
        timeout: 10_000,
        configure: (proxy) => {
          proxy.on("error", (err, req, res) => {
            // Suppress noisy ECONNREFUSED/ECONNRESET during backend restarts
            const code = (err as NodeJS.ErrnoException).code ?? "";
            if (code === "ECONNREFUSED" || code === "ECONNRESET") {
              if ("writeHead" in res && typeof res.writeHead === "function") {
                res.writeHead(503, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Backend temporarily unavailable" }));
              }
            } else {
              console.error("[proxy error]", err.message);
            }
          });
        },
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
