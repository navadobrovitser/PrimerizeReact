
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
  | "candidate-personal-area"
  | "create-post"
  | "admin";

interface HeaderProps {
  onNavigate: (page: Page) => void;
  candidateRefreshKey?: number;
  onCandidateStatusChange?: (isCandidate: boolean) => void;
}

interface CandidateEligibility {
  eligible: boolean;
  alreadyCandidate: boolean;
  partyJoinDate?: string | null;
  eligibleFrom?: string | null;
}

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227";

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
  onCandidateStatusChange,
}: HeaderProps) {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const role = useAppSelector(
    (state) => state.auth.role
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const [isCandidate, setIsCandidate] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [checking, setChecking] = useState(true);

  const isAdmin =
    role?.toLowerCase() === "admin";

  useEffect(() => {
    const controller = new AbortController();

    setIsCandidate(false);
    setIsEligible(false);
    setChecking(true);

    if (!token) {
      setChecking(false);
      onCandidateStatusChange?.(false);

      return () => controller.abort();
    }

    async function checkCandidateStatus() {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // שלב 1: בדיקה אם המשתמש המחובר כבר מועמד
        const meResponse = await fetch(
          `${API_ORIGIN}/api/Candidates/me`,
          {
            method: "GET",
            headers,
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        if (meResponse.ok) {
          // המשתמש נמצא בטבלת Candidates
          setIsCandidate(true);
          setIsEligible(false);
          onCandidateStatusChange?.(true);
          return;
        }

        // אם אין מועמד - ממשיכים לבדיקת זכאות
        if (meResponse.status !== 404) {
          throw new Error(
            `Candidate check failed: ${meResponse.status}`
          );
        }

        // שלב 2: בדיקה אם המשתמש זכאי להגיש מועמדות
        const eligibilityResponse = await fetch(
          `${API_ORIGIN}/api/Candidates/eligibility`,
          {
            method: "GET",
            headers,
            signal: controller.signal,
          }
        );

        if (!eligibilityResponse.ok) {
          throw new Error(
            `Eligibility check failed: ${eligibilityResponse.status}`
          );
        }

        const data: CandidateEligibility =
          await eligibilityResponse.json();

        if (controller.signal.aborted) return;

        const candidate =
          data.alreadyCandidate === true;

        setIsCandidate(candidate);

        setIsEligible(
          !candidate && data.eligible === true
        );

        onCandidateStatusChange?.(candidate);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error(
          "Candidate status error:",
          error
        );

        setIsCandidate(false);
        setIsEligible(false);
        onCandidateStatusChange?.(false);
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    }

    void checkCandidateStatus();

    return () => {
      controller.abort();
    };
  }, [
    token,
    candidateRefreshKey,
    onCandidateStatusChange,
  ]);

  const navigate = (page: Page) => {
    setMenuOpen(false);
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
      className={className}
      onClick={() => navigate(page)}
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
          onClick={() => navigate("home")}
          aria-label="מעבר לעמוד הבית"
          className="header-logo-button"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <Logo />
        </button>

        {/* כפתור תפריט במובייל */}
        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={menuOpen}
          aria-label={
            menuOpen
              ? "סגירת תפריט"
              : "פתיחת תפריט"
          }
          onClick={() =>
            setMenuOpen((previous) => !previous)
          }
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* ניווט ראשי */}
        <nav
          className={`site-nav ${
            menuOpen ? "open" : ""
          }`}
          aria-label="ניווט ראשי"
        >
          {links.map((item) =>
            navLink(item.label, item.page)
          )}

          {/* כפתורים למועמד מחובר */}
          {!checking && isCandidate && (
            <>
              {navLink(
                "האזור האישי שלי",
                "candidate-personal-area",
                "candidate-nav-button"
              )}

              {navLink(
                "+ הוספת פוסט",
                "create-post",
                "candidate-nav-button"
              )}
            </>
          )}

          {/* כפתור למשתמש שזכאי להגיש מועמדות */}
          {!checking &&
            !isCandidate &&
            isEligible &&
            navLink(
              "הגשת מועמדות",
              "candidate-registration",
              "candidate-nav-button"
            )}

          {/* כפתור למנהל */}
          {isAdmin &&
            navLink(
              "ניהול מערכת",
              "admin",
              "candidate-nav-button"
            )}
        </nav>
      </div>
    </header>
  );
}
