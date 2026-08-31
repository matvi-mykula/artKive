import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://art-kive.vercel.app",
  output: "static",
  integrations: [react()],
});
