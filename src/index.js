import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";
import { ErrorBoundary } from "./ErrorBoundry";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

const consoleError = console.error;
const SUPPRESSED_WARNINGS = [
  'Warning: Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>.',
  'Warning: Each child in a list should have a unique "key" prop.'
];

console.error = function filterWarnings(msg, ...args) {
    if (!SUPPRESSED_WARNINGS.some((entry) => msg.includes(entry))) {
      consoleError(msg, ...args);
    }
};