// electron.vite.config.ts
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
var __electron_vite_injected_import_meta_url = "file:///C:/WORK/Serp%20AI%20Chat/electron.vite.config.ts";
var __dirname = dirname(fileURLToPath(__electron_vite_injected_import_meta_url));
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "src/main/main.ts")
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/preload.ts"),
          "search-engine": resolve(__dirname, "src/guest/search-engine.ts"),
          "ai-chat": resolve(__dirname, "src/guest/ai-chat.ts")
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, "src/renderer"),
    base: "./",
    plugins: [
      {
        name: "strip-crossorigin",
        transformIndexHtml(html) {
          return html.replace(/\s+crossorigin(="[^"]*")?/g, "");
        }
      }
    ],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html")
        }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
