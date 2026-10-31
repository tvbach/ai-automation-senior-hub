import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Giống "paths" trong tsconfig.json: "@/lib/x" → <repo>/lib/x
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Mỗi file test chạy cô lập; không chia sẻ state qua globalThis.fetch / process.env
    isolate: true,
    restoreMocks: true,
  },
});
