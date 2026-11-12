
import { useCallback, useEffect, useState } from "react";
import type { Page } from "./Component/Header";
import { useAppSelector } from "./store/hooks";

import Header from "./Component/Header";
import Footer from "./Component/Footer";
import HomePage from "./Component/HomePage";
import LoginPage from "./Component/LoginPage";
import AboutPage from "./Component/AboutPage";
import PrimariesPage from "./Component/PrimariesPage";
import PartyRegisterPage from "./Component/PartyRegisterPage";
import CandidateRegistrationPage from "./Component/CandidateRegistrationPage";
import CandidatePersonalArea from "./Component/CandidatePersonalArea";
import { CandidatesFeedPage } from "./Component/CandidatesFeedPage";
import CandidateMatchPage from "./Component/CandidateMatchPage";
import VotingPage from "./Component/VotingPage";
import ElectionResultsPage from "./Component/ElectionResultsPage";
import CreatePostPage from "./Component/CreatePostPage";
import AdminDashboard from "./Component/AdminDashboard";
import SetPasswordPage from "./Component/SetPasswordPage";

import "./App.css";

function PlaceholderPage({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <section className="placeholder-page" dir="rtl">
      <h1>{title}</h1>
      <p>העמוד הזה נמצא כרגע בבנייה.</p>
      <button type="button" onClick={onBack}>
        חזרה לעמוד הבית
      </button>
    </section>
  );
}

function AccessDenied({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <section
      className="placeholder-page"
      dir="rtl"
      role="alert"
    >
      <h1>אין הרשאה</h1>
      <p>{message}</p>

      <button type="button" onClick={onBack}>
        חזרה לעמוד הבית
      </button>
    </section>
  );
}

export default function App() {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const role = useAppSelector(
    (state) => state.auth.role
  );

  const isLoggedIn = Boolean(token);

  const isAdmin =
    role?.toLowerCase() === "admin";

  const [isPasswordSetupPage, setIsPasswordSetupPage] =
    useState(
      () =>
        window.location.pathname ===
        "/set-password"
    );

  const [page, setPage] = useState<Page>("home");

  const [showLoginSuccess, setShowLoginSuccess] =
    useState(false);

  const [
    candidateRefreshKey,
    setCandidateRefreshKey,
  ] = useState(0);

  // null = עדיין לא הסתיימה בדיקת הזכאות
  const [candidateStatus, setCandidateStatus] =
    useState<boolean | null>(null);

  const handleCandidateStatusChange = useCallback(
    (isCandidate: boolean) => {
      setCandidateStatus(isCandidate);
    },
    []
  );

  useEffect(() => {
    if (!isPasswordSetupPage) {
      setPage("home");
      window.scrollTo(0, 0);
    }
  }, [isLoggedIn, isPasswordSetupPage]);

  useEffect(() => {
    const handlePopState = () => {
      setIsPasswordSetupPage(
        window.location.pathname ===
          "/set-password"
      );
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  useEffect(() => {
    setCandidateStatus(null);
  }, [token, candidateRefreshKey]);

  const goToLoginFromPasswordSetup = () => {
    window.history.replaceState(
      {},
      "",
      "/"
    );

    setIsPasswordSetupPage(false);
    setPage("login");
    window.scrollTo(0, 0);
  };

  const navigate = (next: Page) => {
    if (
      !isLoggedIn &&
      next !== "login" &&
      next !== "register"
    ) {
      setPage("login");
      return;
    }

    if (next === "admin" && !isAdmin) {
      setPage("home");
      return;
    }

    if (
      (next === "candidate-personal-area" ||
        next === "create-post") &&
      candidateStatus !== true
    ) {
      setPage("home");
      return;
    }

    setPage(next);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCandidateCreated = () => {
    setCandidateRefreshKey(
      (previous) => previous + 1
    );

    // לאחר יצירת מועמד, נבדוק שוב
    // את הסטטוס מול השרת
    setCandidateStatus(null);

    setPage("primaries");
  };

  const handleCandidateSaved = () => {
    setCandidateRefreshKey(
      (previous) => previous + 1
    );
  };

  if (isPasswordSetupPage) {
    return (
      <div className="app-layout" dir="rtl">
        <main className="app-main">
          <SetPasswordPage
            onGoToLogin={
              goToLoginFromPasswordSetup
            }
          />
        </main>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="app-layout" dir="rtl">
        <main className="app-main">
          {page === "register" ? (
            <PartyRegisterPage
              onSwitchToLogin={() =>
                navigate("login")
              }
            />
          ) : (
            <LoginPage
              onLoginSuccess={() => {
                setShowLoginSuccess(true);
                navigate("home");
              }}
              onRegisterClick={() =>
                navigate("register")
              }
            />
          )}
        </main>
      </div>
    );
  }

  const currentPage: Page =
    page === "login" || page === "register"
      ? "home"
      : page;

  return (
    <div className="app-layout" dir="rtl">
      <Header
        onNavigate={navigate}
        candidateRefreshKey={
          candidateRefreshKey
        }
        onCandidateStatusChange={
          handleCandidateStatusChange
        }
      />

      <main className="app-main">
        {showLoginSuccess && (
          <div
            role="status"
            style={{
              backgroundColor: "#e7f7ed",
              color: "#17653a",
              padding: "16px 24px",
              margin: "20px auto",
              maxWidth: "600px",
              borderRadius: "12px",
              textAlign: "center",
              fontWeight: "bold",
              border: "1px solid #a8dfba",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              direction: "rtl",
            }}
          >
            <span>
              ✓ התחברת בהצלחה! כעת אפשר
              להמשיך לאזור האישי ולהצבעה.
            </span>

            <button
              type="button"
              onClick={() =>
                setShowLoginSuccess(false)
              }
              aria-label="סגירת הודעת הצלחה"
              style={{
                background: "transparent",
                border: "none",
                color: "#17653a",
                cursor: "pointer",
                fontSize: "22px",
                fontWeight: "bold",
              }}
            >
              ×
            </button>
          </div>
        )}

        {currentPage === "home" && (
          <HomePage
            onJoinClick={() =>
              navigate("candidates")
            }
            onProgramClick={() =>
              navigate("program")
            }
          />
        )}

        {currentPage === "about" && (
          <AboutPage
            onCandidatesClick={() =>
              navigate("candidates")
            }
            onProgramClick={() =>
              navigate("program")
            }
          />
        )}

        {currentPage === "primaries" && (
          <PrimariesPage
            onApplyClick={() =>
              navigate(
                "candidate-registration"
              )
            }
          />
        )}

        {currentPage ===
          "candidate-registration" && (
          <CandidateRegistrationPage
            onCandidateCreated={
              handleCandidateCreated
            }
          />
        )}

        {currentPage ===
          "candidate-personal-area" &&
          (candidateStatus === true ? (
            <CandidatePersonalArea
              onBack={() =>
                navigate("primaries")
              }
              onSaved={
                handleCandidateSaved
              }
            />
          ) : candidateStatus === null ? (
            <div
              className="placeholder-page"
              role="status"
            >
              בודק הרשאות מועמד...
            </div>
          ) : (
            <AccessDenied
              message="עמוד זה מיועד למועמדים בלבד."
              onBack={() =>
                navigate("home")
              }
            />
          ))}

        {currentPage === "candidates" && (
          <CandidatesFeedPage />
        )}

        {currentPage === "create-post" &&
          (candidateStatus === true ? (
            <CreatePostPage />
          ) : (
            <AccessDenied
              message="רק מועמד רשום יכול לפרסם פוסטים."
              onBack={() =>
                navigate("home")
              }
            />
          ))}

        {currentPage === "match" && (
          <CandidateMatchPage />
        )}

        {currentPage === "voting" && (
          <VotingPage
            onViewResults={() =>
              navigate("results")
            }
          />
        )}

        {currentPage === "results" && (
          <ElectionResultsPage />
        )}

        {currentPage === "admin" &&
          (isAdmin ? (
            <AdminDashboard
              onNavigateToVoting={() =>
                navigate("voting")
              }
            />
          ) : (
            <AccessDenied
              message="עמוד זה מיועד למנהלי המערכת בלבד."
              onBack={() =>
                navigate("home")
              }
            />
          ))}

        {currentPage === "leadership" && (
          <PlaceholderPage
            title="הנהגת תנופה"
            onBack={() =>
              navigate("home")
            }
          />
        )}

        {currentPage === "program" && (
          <PlaceholderPage
            title="התוכנית שלנו"
            onBack={() =>
              navigate("home")
            }
          />
        )}

        {currentPage === "news" && (
          <PlaceholderPage
            title="חדשות ועדכונים"
            onBack={() =>
              navigate("home")
            }
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
