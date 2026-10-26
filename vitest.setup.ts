import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Vitest runs with `globals: false`, so Testing Library's automatic
// cleanup (which hooks into a global afterEach) never registers.
// Without this, each test's rendered form stays mounted and later
// queries find duplicate buttons, labels and headings.
afterEach(() => {
  cleanup();
});
