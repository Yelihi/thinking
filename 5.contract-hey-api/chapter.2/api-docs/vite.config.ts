import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { yamlImportPlugin } from "./vite-yaml-import-plugin";

export default defineConfig({
  plugins: [
    react(),
    yamlImportPlugin({
      inputFile: "index.yml",
      outputFile: "/output.yml",
    }),
  ],
});