import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Plain static Vite SPA config. No backend, no dev-middleware integration,
// no Replit-specific plugins — `vite build` produces a static `dist/`
// directory that can be hosted anywhere (GitHub Pages, Netlify, Vercel, etc).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
