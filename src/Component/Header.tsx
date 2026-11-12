
import { useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
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
  | "register"
  | "candidate-registration"
  | "create-post"
  | "admin";
interface HeaderProps {
  onNavigate: (page: Page) => void;
  candidateRefreshKey?: number;
}

const links: { label: string; page: Page }[] = [
  { label: "בית", page: "home" },
  { label: "אודות", page: "about" },
  { label: "הנהגה", page: "leadership" },
  { label: "התוכנית", page: "program" },
  { label: "חדשות", page: "news" },
  { label: "פריימריז", page: "primaries" },
  { label: "פוסטים", page: "candidates" },
  { label: "הצבעה", page: "voting" },
  { label: "התאמה חכמה ✦", page: "match" },

];

export default function Header({
  onNavigate,
  candidateRefreshKey = 0,
}: HeaderProps) {
  const token = useAppSelector(
    (state) => state.auth.token
  );
 const role = useAppSelector((state) => state.auth.role);
  const [open, setOpen] = useState(false);
  const [candidate, setCandidate] = useState(false);
  const [checking, setChecking] = useState(true);
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    setCandidate(false);
    setChecking(true);
    setStatusLoaded(false);

    if (!token) {
      setChecking(false);
      setStatusLoaded(true);
      return () => controller.abort();
    }

    fetch(
      "https://localhost:7227/api/Candidates/eligibility",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("בדיקת מועמדות נכשלה");
        }

        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setCandidate(data.alreadyCandidate === true);
          setStatusLoaded(true);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      });

    return () => controller.abort();
  }, [token, candidateRefreshKey]);

  const navigate = (page: Page) => {
    setOpen(false);
    onNavigate(page);
  };
console.log("Current role:", role);
console.log("Is candidate:", candidate);
  return (
    <header className="site-header" dir="rtl">
      <div className="header-inner">
        <div
          onClick={() => navigate("home")}
          style={{ cursor: "pointer" }}
        >
          <Logo />
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={open}
          aria-label={
            open ? "סגירת תפריט" : "פתיחת תפריט"
          }
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "✕" : "☰"}
        </button>

        <nav className={`site-nav ${open ? "open" : ""}`}>
          {links.map((item) => (
            <a
              key={item.page}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(item.page);
              }}
            >
              {item.label}
            </a>
          ))}

          {!checking && statusLoaded && (
            candidate ? (
              <a
                href="#"
                className="candidate-nav-button"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("create-post");
                }}
              >
                + הוספת פוסט
              </a>
            ) : (
              <a
                href="#"
                className="candidate-nav-button"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("candidate-registration");
                }}
              >
                הגשת מועמדות
              </a>
            )
          )}

          {role === "Admin" && (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      navigate("admin");
    }}
  >
    ניהול מערכת
  </a>
)}
        </nav>
      </div>
    </header>
  );
}
