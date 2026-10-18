import { AppShell } from "@/AppShell";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");

createRoot(container).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
);
