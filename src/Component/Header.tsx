
import { useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import Logo from "./Logo";
import "./Header.css";
import { API_ORIGIN } from "../config/api";

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
  | "regulation-chat"
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

interface NavItem {
  label: string;
  page: Page;
}

const navigationLinks: NavItem[] = [
  { label: "בית", page: "home" },
  { label: "אודות", page: "about" },
  { label: "הנהגה", page: "leadership" },
  { label: "התוכנית", page: "program" },
  { label: "חדשות", page: "news" },
  { label: "מועמדים", page: "primaries" },
  { label: "פוסטים", page: "posts" },
  { label: "הצבעה", page: "voting" },
  { label: "תוצאות הבחירות", page: "results" },
  { label: "התאמה חכמה", page: "match" },
  { label: "צ'אט התקנון", page: "regulation-chat" },
];

export default function Header({
  onNavigate,
  candidateRefreshKey = 0,
  onCandidateStatusChange,
}: HeaderProps) {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const role = useAppSelector(
    (state) => state.auth.role
  );

  const [isCandidate, setIsCandidate] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activePage, setActivePage] =
    useState<Page>("home");

  const isAdmin = role?.toLowerCase() === "admin";

  // בדיקה אם המשתמש המחובר הוא מועמד
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

        const exists =
          candidate !== null &&
          Number(candidate.candidateId) > 0;

        setIsCandidate(exists);
        onCandidateStatusChange?.(exists);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error(
          "Candidate status error:",
          error
        );

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

        {/* לוגו */}
        <button
          type="button"
          className="header-logo-button"
          aria-label="מעבר לעמוד הבית"
          onClick={() => navigate("home")}
        >
          <Logo />
        </button>

        {/* כל הקישורים בסרגל אחד */}
        <nav
          className="site-nav"
          aria-label="ניווט ראשי"
        >
          <div className="header-main-links">
            {navigationLinks.map((item) =>
              navLink(item.label, item.page)
            )}
          </div>

          {/* כפתורים בהתאם להרשאות */}
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
