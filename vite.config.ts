import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],

  // 🔧 Tving Vite til å alltid re-bundle deps i dev
  optimizeDeps: {
    force: true,
    include: ["react", "react/jsx-dev-runtime", "react-router"],
  },
});
