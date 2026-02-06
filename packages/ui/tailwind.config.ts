import type { Config } from "tailwindcss";
import { subfyPreset } from "./src/tailwind-preset";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [subfyPreset as Config],
  plugins: [],
};

export default config;
