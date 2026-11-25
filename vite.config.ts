import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    {
      name: "dompet-character",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "assets/spiderman-fallback.webp",
          source: readFileSync(
            new URL(
              "./src/characters/spiderman-fallback.webp",
              import.meta.url,
            ),
          ),
        });
        this.emitFile({
          type: "asset",
          fileName: "assets/dompet-spiderman.glb",
          source: readFileSync(
            new URL(
              "./downloaded assets/spiderman/dompet-spiderman.glb",
              import.meta.url,
            ),
          ),
        });
        this.emitFile({
          type: "asset",
          fileName: "assets/dompet-human.glb",
          source: readFileSync(
            new URL("./downloaded assets/dompet-human.glb", import.meta.url),
          ),
        });
        this.emitFile({
          type: "asset",
          fileName: "assets/tabby.glb",
          source: readFileSync(
            new URL("./src/characters/tabby.glb", import.meta.url),
          ),
        });
      },
    },
  ],
  build: {
    rollupOptions: { output: { chunkFileNames: "chunks/[name]-[hash].js" } },
    lib: { entry: "src/index.ts", formats: ["es"], fileName: () => "index.js" },
  },
});
