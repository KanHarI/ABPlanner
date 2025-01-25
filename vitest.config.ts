import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,           // Enable global functions like `describe`, `it`, and `expect`
    environment: "node",     // Use Node.js environment for tests
    include: ["tests/**/*.test.ts"], // Include all test files in the `tests` folder
    coverage: {
      provider: "c8",        // Use c8 for coverage (default option)
      reporter: ["text", "html"], // Outputs coverage report in console and as an HTML file
    },
  },
});
