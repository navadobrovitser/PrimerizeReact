
import { useState } from "react";
import Logo from "./Logo";
import "./Header.css";


export type Page =
  | "home"
  | "about"
  | "leadership"
  | "program"
  | "news"
  | "primaries"
  | "candidates"
  | "login"
  | "voting"
  | "results"
  | "match"
  | "register";
interface HeaderProps {
  onNavigate: (page: Page) => void;
}

interface NavItem {
  label: string;
  page: Page;
}

const navItems: NavItem[] = [
  { label: "בית", page: "home" },
  { label: "אודות", page: "about" },
  { label: "הנהגה", page: "leadership" },
  { label: "התוכנית", page: "program" },
  { label: "חדשות", page: "news" },
  { label: "פריימריז", page: "primaries" },
  { label: "פוסטים", page: "candidates" },
   { label: "הצבעה", page: "voting" },
   { label: "התאמה חכמה ✦", page: "match" },
   { label: "הרשמה", page: "register" },
];

export default function Header({
  onNavigate,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setIsOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-inner">

        <div
          onClick={() => handleNavigate("home")}
          style={{ cursor: "pointer" }}
        >
          <Logo />
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={
            isOpen ? "סגירת תפריט" : "פתיחת תפריט"
          }
        >
          {isOpen ? "✕" : "☰"}
        </button>

        <nav className={`site-nav ${isOpen ? "open" : ""}`}>

          {navItems.map((item) => (
            <a
              key={item.page}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate(item.page);
              }}
            >
              {item.label}
            </a>
          ))}

          <a
            className="header-join-button"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate("login");
            }}
          >
            הצטרפו אלינו
          </a>

        </nav>
      </div>
    </header>
  );
}
