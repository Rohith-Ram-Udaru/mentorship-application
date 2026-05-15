import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/app">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <NavLink className="rounded-md px-3 py-2 text-sm font-semibold text-foreground/70 transition hover:bg-muted hover:text-primary" to="/app">
              Dashboard
            </NavLink>
            <NavLink className="rounded-md px-3 py-2 text-sm font-semibold text-foreground/70 transition hover:bg-muted hover:text-primary" to="/app/org">
              Analytics
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-xs text-foreground/50">{user?.email}</div>
            </div>
            <Button variant="outline" size="icon" onClick={toggleTheme} title="Toggle dark mode" className="relative overflow-hidden">
              <motion.span
                key={dark ? "sun" : "moon"}
                initial={{ rotate: -35, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.22 }}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </motion.span>
            </Button>
            <Button variant="outline" size="icon" onClick={signOut} title="Sign out">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
