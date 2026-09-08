// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // sitemap·RSS·canonical이 전부 이 값을 기준으로 생성된다.
  site: "https://blog.study-about.club",
  markdown: {
    shikiConfig: {
      theme: "github-light",
      wrap: false,
    },
  },
});
