import type { Config } from "tailwindcss";
import { subfyPreset } from "@subfy/ui/tailwind-preset";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    // Include the UI package components so Tailwind scans their classes
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [subfyPreset as Config],
  plugins: [],
};

export default config;
