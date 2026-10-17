import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ theme, toggle }) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="theme-toggle"
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}