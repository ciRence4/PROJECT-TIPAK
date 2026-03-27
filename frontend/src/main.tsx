import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    '[Project Tipak] Mount target #root not found. ' +
    'Ensure your index.html contains <div id="root"></div>.',
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);