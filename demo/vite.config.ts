import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Run consumer examples against the working tree during playground tests.
export default defineConfig({
  optimizeDeps: {
    include: [
      "three",
      "three/addons/loaders/GLTFLoader.js",
      "react",
      "react-dom/client",
    ],
  },
  resolve: {
    alias: {
      dompet: fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
});
