import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const seedDreamTarget = env.VITE_SEEDDREAM_API_URL;
  const seedDreamApiKey = env.VITE_SEEDDREAM_API_KEY;
  const proxyPath = env.VITE_SEEDDREAM_PROXY_PATH || "/seed-dream";

  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const proxy = seedDreamTarget
    ? {
        [proxyPath]: {
          target: seedDreamTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(new RegExp(`^${escapeRegex(proxyPath)}`), ""),
          configure: (proxyServer: any) => {
            proxyServer.on("proxyReq", (proxyReq: any) => {
              if (seedDreamApiKey) {
                proxyReq.setHeader("Authorization", `Bearer ${seedDreamApiKey}`);
              }
              if (!proxyReq.getHeader("content-type")) {
                proxyReq.setHeader("Content-Type", "application/json");
              }
            });
          }
        }
      }
    : undefined;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: "0.0.0.0",
      proxy
    }
  };
});
