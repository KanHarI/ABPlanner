import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // Enable global functions like describe, it, and expect
    environment: "node", // Use Node.js environment
    include: ["tests/**/*.test.ts"], // Include test files
    coverage: {
      reporter: ["text", "html"], // Generate both text and HTML reports
      reportsDirectory: "./coverage", // Directory for coverage reports
      all: true, // Include files without tests in the coverage report
      exclude: ["dist/**", "node_modules/**", "**/*.test.ts"], // Exclude generated files, tests, and node_modules
    },
  },
});
