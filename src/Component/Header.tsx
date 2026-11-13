
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
  | "candidate-profile"
  | "posts"
  | "login"
  | "voting"
  | "results"
  | "match"
  | "register"
  | "candidate-registration"
  | "candidate-personal-area"
  | "create-post"
  | "admin";

interface HeaderProps {
  onNavigate: (page: Page) => void;
  candidateRefreshKey?: number;
  onCandidateStatusChange?: (isCandidate: boolean) => void;
}

interface CandidateProfile {
  candidateId: number;
  userId?: number;
  name?: string;
}

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/$/, "");

const links: { label: string; page: Page }[] = [
  { label: "בית", page: "home" },
  { label: "אודות", page: "about" },
  { label: "הנהגה", page: "leadership" },
  { label: "התוכנית", page: "program" },
  { label: "חדשות", page: "news" },
  { label: "פריימריז", page: "primaries" },
  { label: "פוסטים", page: "posts" },
  { label: "הצבעה", page: "voting" },
  { label: "התאמה חכמה", page: "match" },
];

export default function Header({
  onNavigate,
  candidateRefreshKey = 0,
  onCandidateStatusChange,
}: HeaderProps) {
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.role);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isCandidate, setIsCandidate] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activePage, setActivePage] = useState<Page>("home");

  const isAdmin = role?.toLowerCase() === "admin";

  useEffect(() => {
    const controller = new AbortController();

    setIsCandidate(false);
    setChecking(true);

    if (!token) {
      setChecking(false);
      onCandidateStatusChange?.(false);

      return () => controller.abort();
    }

    const checkCandidateStatus = async () => {
      try {
        const response = await fetch(
          `${API_ORIGIN}/api/Candidates/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        if (response.status === 404) {
          setIsCandidate(false);
          onCandidateStatusChange?.(false);
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Candidate check failed: ${response.status}`
          );
        }

        const candidate: CandidateProfile | null =
          await response.json();

        if (controller.signal.aborted) return;

        const candidateExists =
          candidate !== null &&
          Number(candidate.candidateId) > 0;

        setIsCandidate(candidateExists);
        onCandidateStatusChange?.(candidateExists);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Candidate status error:", error);
        setIsCandidate(false);
        onCandidateStatusChange?.(false);
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    };

    void checkCandidateStatus();

    return () => controller.abort();
  }, [
    token,
    candidateRefreshKey,
    onCandidateStatusChange,
  ]);

  const navigate = (page: Page) => {
    setMenuOpen(false);
    setActivePage(page);
    onNavigate(page);
  };

  const navLink = (
    label: string,
    page: Page,
    className = "header-nav-link"
  ) => (
    <button
      key={page}
      type="button"
      className={`${className} ${
        activePage === page ? "is-active" : ""
      }`}
      onClick={() => navigate(page)}
      aria-current={
        activePage === page ? "page" : undefined
      }
    >
      {label}
    </button>
  );

  return (
    <header className="site-header" dir="rtl">
      <div className="header-inner">
        <button
          type="button"
          onClick={() => navigate("home")}
          aria-label="מעבר לעמוד הבית"
          className="header-logo-button"
        >
          <Logo />
        </button>

        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={menuOpen}
          aria-controls="main-site-navigation"
          aria-label={
            menuOpen
              ? "סגירת תפריט"
              : "פתיחת תפריט"
          }
          onClick={() =>
            setMenuOpen((previous) => !previous)
          }
        >
          <span className="mobile-menu-lines">
            {menuOpen ? "✕" : "☰"}
          </span>
        </button>

        <nav
          id="main-site-navigation"
          className={`site-nav ${
            menuOpen ? "open" : ""
          }`}
          aria-label="ניווט ראשי"
        >
          <div className="header-main-links">
            {links.map((item) =>
              navLink(item.label, item.page)
            )}
          </div>

          <div className="header-actions">
            {!checking && isCandidate && (
              <>
                {navLink(
                  "האזור האישי שלי",
                  "candidate-personal-area",
                  "candidate-nav-button candidate-area-button"
                )}

                {navLink(
                  "+ הוספת פוסט",
                  "create-post",
                  "candidate-nav-button candidate-post-button"
                )}
              </>
            )}

            {isAdmin &&
              navLink(
                "ניהול מערכת",
                "admin",
                "candidate-nav-button candidate-area-button"
              )}
          </div>
        </nav>
      </div>
    </header>
  );
}
