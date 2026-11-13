
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
import CandidatesPage from "./Component/CandidatesPage";
import CandidateProfilePage from "./Component/CandidateProfilePage";
import CandidateMatchPage from "./Component/CandidateMatchPage";
import VotingPage from "./Component/VotingPage";
import ElectionResultsPage from "./Component/ElectionResultsPage";
import CreatePostPage from "./Component/CreatePostPage";
import AdminDashboard from "./Component/AdminDashboard";
import SetPasswordPage from "./Component/SetPasswordPage";
import NewsPage from "./Component/NewsPage";
import LeadershipPage from "./Component/LeadershipPage";
import ProgramPage from "./Component/ProgramPage";

import "./App.css";

// =====================================
// הודעת חוסר הרשאה
// =====================================

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

// =====================================
// APP
// =====================================

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

  const [
    isPasswordSetupPage,
    setIsPasswordSetupPage,
  ] = useState(
    () =>
      window.location.pathname ===
      "/set-password"
  );

  const [page, setPage] =
    useState<Page>("home");

  const [
    selectedCandidateId,
    setSelectedCandidateId,
  ] = useState<number | null>(null);

  const [
    selectedPostId,
    setSelectedPostId,
  ] = useState<number | null>(null);

  const [
    showLoginSuccess,
    setShowLoginSuccess,
  ] = useState(false);

  const [
    candidateRefreshKey,
    setCandidateRefreshKey,
  ] = useState(0);

  const [
    candidateStatus,
    setCandidateStatus,
  ] = useState<boolean | null>(null);

  const handleCandidateStatusChange =
    useCallback((value: boolean) => {
      setCandidateStatus(value);
    }, []);

  // =====================================
  // אחרי התחברות
  // =====================================

  useEffect(() => {
    if (
      isLoggedIn &&
      !isPasswordSetupPage
    ) {
      setPage("home");
      setSelectedPostId(null);
      setSelectedCandidateId(null);

      window.scrollTo(0, 0);
    }
  }, [
    isLoggedIn,
    isPasswordSetupPage,
  ]);

  // =====================================
  // זיהוי ניווט להגדרת סיסמה
  // =====================================

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

  // =====================================
  // איפוס הרשאות מועמד
  // =====================================

  useEffect(() => {
    setCandidateStatus(null);
  }, [token, candidateRefreshKey]);

  // =====================================
  // חזרה להתחברות
  // =====================================

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

  // =====================================
  // ניווט בין עמודים
  // =====================================

  const navigate = (next: Page) => {
    setShowLoginSuccess(false);

    if (!isLoggedIn) {
      if (next === "register") {
        setPage("register");
      } else {
        setPage("login");
      }

      window.scrollTo(0, 0);
      return;
    }

    if (
      next === "register" ||
      next === "login"
    ) {
      setPage("home");
      return;
    }

    if (
      next === "admin" &&
      !isAdmin
    ) {
      setPage("home");
      return;
    }

    // אזור אישי והוספת פוסט למועמד בלבד
    if (
      (
        next === "candidate-personal-area" ||
        next === "create-post"
      ) &&
      candidateStatus !== true
    ) {
      setPage("home");
      return;
    }

    setSelectedPostId(null);
    setPage(next);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // פתיחת פרופיל מועמד
  // =====================================

  const openCandidateProfile = (
    candidateId: number
  ) => {
    setSelectedCandidateId(candidateId);
    navigate("candidate-profile");
  };

  // =====================================
  // פתיחת פוסט מתוך החדשות
  // =====================================

  const handleOpenPost = (
    postId: number
  ) => {
    setSelectedPostId(postId);
    setPage("posts");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // מועמד חדש
  // =====================================

  const handleCandidateCreated = () => {
    setCandidateRefreshKey(
      (previous) => previous + 1
    );

    setCandidateStatus(null);
    setPage("primaries");
  };

  // =====================================
  // עדכון מועמד
  // =====================================

  const handleCandidateSaved = () => {
    setCandidateRefreshKey(
      (previous) => previous + 1
    );
  };

  // =====================================
  // עמוד הגדרת סיסמה
  // =====================================

  if (isPasswordSetupPage) {
    return (
      <div
        className="app-layout"
        dir="rtl"
      >
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

  // =====================================
  // משתמש לא מחובר
  // =====================================

  if (!isLoggedIn) {
    return (
      <div
        className="app-layout"
        dir="rtl"
      >
        <main className="app-main">
          {page === "register" ? (
            <PartyRegisterPage
              onSwitchToLogin={() =>
                setPage("login")
              }
              onRegisterSuccess={() =>
                setPage("login")
              }
            />
          ) : (
            <LoginPage
              onLoginSuccess={() => {
                setShowLoginSuccess(true);
                setPage("home");
              }}
              onRegisterClick={() =>
                setPage("register")
              }
            />
          )}
        </main>
      </div>
    );
  }

  // =====================================
  // משתמש מחובר
  // =====================================

  return (
    <div
      className="app-layout"
      dir="rtl"
    >
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

        {/* הודעת התחברות */}
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
              justifyContent:
                "space-between",
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

        {/* בית */}
        {page === "home" && (
          <HomePage
            onJoinClick={() =>
              navigate("candidates")
            }
            onProgramClick={() =>
              navigate("program")
            }
          />
        )}

        {/* אודות */}
        {page === "about" && (
          <AboutPage
            onCandidatesClick={() =>
              navigate("candidates")
            }
            onProgramClick={() =>
              navigate("program")
            }
          />
        )}

        {/* הנהגה */}
        {page === "leadership" && (
          <LeadershipPage
            onCandidatesClick={() =>
              navigate("primaries")
            }
          />
        )}

        {/* התוכנית */}
        {page === "program" && (
          <ProgramPage
            onCandidatesClick={() =>
              navigate("primaries")
            }
          />
        )}

        {/* פריימריז */}
        {page === "primaries" && (
          <PrimariesPage
            onApplyClick={() =>
              navigate(
                "candidate-registration"
              )
            }
          />
        )}

        {/* הרשמה כמועמד */}
        {page === "candidate-registration" && (
          <CandidateRegistrationPage
            onCandidateCreated={
              handleCandidateCreated
            }
          />
        )}

        {/* אזור אישי למועמד */}
        {page === "candidate-personal-area" &&
          (
            candidateStatus === true ? (
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
            )
          )}

        {/* פוסטים */}
        {page === "posts" && (
          <CandidatesFeedPage
            selectedPostId={
              selectedPostId
            }
            isCandidate={
              candidateStatus === true
            }

            // הכפתור מעביר לטופס המרכזי
            onCreatePost={() =>
              navigate("create-post")
            }

            onClearSelectedPost={() => {
              setSelectedPostId(null);

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}

            onBackToNews={() => {
              setSelectedPostId(null);
              navigate("news");
            }}
          />
        )}

        {/* מועמדים */}
        {page === "candidates" && (
          <CandidatesPage
            onSelectCandidate={
              openCandidateProfile
            }
          />
        )}

        {/* פרופיל מועמד */}
        {page === "candidate-profile" &&
          selectedCandidateId !== null && (
            <CandidateProfilePage
              candidateId={
                selectedCandidateId
              }
              onBack={() =>
                navigate("candidates")
              }
            />
          )}

        {/* הוספת פוסט */}
        {page === "create-post" &&
          (
            candidateStatus === true ? (
              <CreatePostPage />
            ) : (
              <AccessDenied
                message="רק מועמד רשום יכול לפרסם פוסטים."
                onBack={() =>
                  navigate("home")
                }
              />
            )
          )}

        {/* התאמה חכמה */}
        {page === "match" && (
          <CandidateMatchPage />
        )}

        {/* הצבעה */}
        {page === "voting" && (
          <VotingPage
            onViewResults={() =>
              navigate("results")
            }
          />
        )}

        {/* תוצאות */}
        {page === "results" && (
          <ElectionResultsPage />
        )}

        {/* ניהול */}
        {page === "admin" &&
          (
            isAdmin ? (
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
            )
          )}

        {/* חדשות */}
        {page === "news" && (
          <NewsPage
            onOpenPost={
              handleOpenPost
            }
            onBack={() =>
              navigate("home")
            }
          />
        )}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}
