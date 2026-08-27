import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

function ensureTrailingSlash(pathname: string): string {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")?.[1];
  const inferredPagesBase = repoName ? `/${repoName}/` : "/";
  const base = ensureTrailingSlash(process.env.BASE_PATH ?? inferredPagesBase);

  return {
    base,
    plugins: [solid()],
    server: {
      port: 5174,
    },
    build: {
      target: "esnext",
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/maplibre-gl")) return "maplibre";
            if (id.includes("node_modules/solid-js")) return "solid";
          },
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },
  };
});
