import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/tailwind-preset.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  // In turbo dev, `ui:build` and `ui:dev` can overlap.
  // Avoid cleaning dist in watch mode to prevent unlink races on Windows.
  clean: !process.argv.includes("--watch"),
  external: ["react", "react-dom"],
  treeshake: true,
});
