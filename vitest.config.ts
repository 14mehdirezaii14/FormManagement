import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  // The app tsconfig uses `jsx: preserve` (Next.js/SWC). Vitest's
  // esbuild transform must therefore be told explicitly to use the
  // automatic runtime, otherwise JSX compiles to `React.createElement`
  // with no React import in scope.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});
