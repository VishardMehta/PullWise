import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      // Keep existing Supabase functions proxy
      "/functions/v1": {
        target: "https://tztjynfavmjghnzekogh.supabase.co",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },

      // Add this: forward any /api/* requests to your local backend
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        // no rewrite needed because we're keeping the same /api prefix
        // If your backend uses a different base (e.g. /), you can rewrite
        // rewrite: (path) => path.replace(/^\/api/, "")
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
