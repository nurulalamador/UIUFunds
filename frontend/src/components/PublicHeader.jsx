import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Moon, Search, Sun } from "lucide-react";
import Brand from "./Brand";

export default function PublicHeader() {
  const [darkTheme, setDarkTheme] = useState(
    () => localStorage.getItem("uiufunds-theme") === "dark",
  );

  useEffect(() => {
    const theme = darkTheme ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("uiufunds-theme", theme);
  }, [darkTheme]);

  return (
    <header className="public-header">
      <Brand />
      <nav className="public-nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About Us</NavLink>
      </nav>
      <div className="public-actions">
        <button
          className="icon-button soft"
          type="button"
          onClick={() => setDarkTheme((enabled) => !enabled)}
          title={darkTheme ? "Switch to light theme" : "Switch to dark theme"}
        >
          {darkTheme ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link className="button primary" to="/signup">
          Get Started
        </Link>
      </div>
    </header>
  );
}
