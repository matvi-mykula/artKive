import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://matvi-mykula.vercel.app",
  output: "static",
  integrations: [react()],
});
