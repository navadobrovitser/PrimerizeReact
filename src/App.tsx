
import { useCallback, useEffect, useState } from "react";
import type { Page } from "./Component/Header";
import { useAppDispatch, useAppSelector } from "./store/hooks";

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
import CandidateProfilePage from "./Component/CandidateProfilePage";
import CandidateMatchPage from "./Component/CandidateMatchPage";
import VotingPage from "./Component/VotingPage";
import VotingSuccessPage from "./Component/VotingSuccessPage";
import SecureVotingGate from "./Component/SecureVotingGate";
import ElectionResultsPage from "./Component/ElectionResultsPage";
import CreatePostPage from "./Component/CreatePostPage";
import AdminDashboard from "./Component/AdminDashboard";
import SetPasswordPage from "./Component/SetPasswordPage";
import ResetPasswordPage from "./Component/ResetPasswordPage";
import NewsPage from "./Component/NewsPage";
import LeadershipPage from "./Component/LeadershipPage";
import ProgramPage from "./Component/ProgramPage";
import RegulationChatPage from "./Component/RegulationChatPage";

import { logout } from "./store/Auth/authSlice";
import { resetVoting } from "./store/voting/votingSlice";
import { fetchVoteStatus } from "./store/voting/votingThunks";
import { API_ORIGIN } from "./config/api";

import "./App.css";

// ==========================================
// API - כתובת אחידה למקומי ולשרת הציבורי
// ==========================================

const VOTING_API = `${API_ORIGIN}/api/Voting`;

interface ElectionStatusResponse {
  isClosed: boolean;
}

// ==========================================
// הודעת חוסר הרשאה
// ==========================================

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

// ==========================================
// APP
// ==========================================

export default function App() {
  const dispatch = useAppDispatch();

  // ==========================================
  // משתמש מחובר והרשאות
  // ==========================================

  const token = useAppSelector(
    (state) => state.auth.token
  );

  const role = useAppSelector(
    (state) => state.auth.role
  );

  const isLoggedIn = Boolean(token);

  const isAdmin =
    role?.toLowerCase() === "admin";

  // ==========================================
  // סטטוס ההצבעה מתוך Redux
  // ==========================================

  const hasVoted = useAppSelector(
    (state) => state.voting.hasVoted
  );

  const voteStatusChecked = useAppSelector(
    (state) => state.voting.statusChecked
  );

  const checkingVoteStatus = useAppSelector(
    (state) => state.voting.checkingStatus
  );

  const voteSubmitting = useAppSelector(
    (state) => state.voting.submitting
  );

  const votingError = useAppSelector(
    (state) => state.voting.error
  );

  // ==========================================
  // מצב הבחירות
  // ==========================================

  const [electionClosed, setElectionClosed] =
    useState<boolean | null>(null);

  const [electionStatusError, setElectionStatusError] =
    useState("");

  const [votingRefreshKey, setVotingRefreshKey] =
    useState(0);

  // ==========================================
  // ניהול מסך מלא בהצבעה
  // ==========================================

  const [
    votingFullscreenActive,
    setVotingFullscreenActive,
  ] = useState(false);

  const [
    votingSessionKey,
    setVotingSessionKey,
  ] = useState(0);

  const handleVotingSessionReset = useCallback(() => {
    setVotingSessionKey(
      (previous) => previous + 1
    );
  }, []);

  const handleVotingActiveChange = useCallback(
    (active: boolean) => {
      setVotingFullscreenActive(active);
    },
    []
  );

  // ==========================================
  // ניהול עמודים
  // ==========================================

  const [
    isPasswordSetupPage,
    setIsPasswordSetupPage,
  ] = useState(
    () =>
      window.location.pathname ===
      "/set-password"
  );

  const [page, setPage] =
    useState<Page | "forgot-password">(() =>
      new URLSearchParams(
        window.location.search
      ).has("resetToken")
        ? "forgot-password"
        : "home"
    );

  const [
    selectedCandidateId,
    setSelectedCandidateId,
  ] = useState<number | null>(null);

  const [
    selectedPostId,
    setSelectedPostId,
  ] = useState<number | null>(null);

  const [
    candidateRefreshKey,
    setCandidateRefreshKey,
  ] = useState(0);

  const [
    candidateStatus,
    setCandidateStatus,
  ] = useState<boolean | null>(null);

  // ==========================================
  // הסתרת תפריטים בזמן הצבעה
  // ==========================================

  const hideSiteNavigation =
    page === "voting" &&
    votingFullscreenActive &&
    !hasVoted;

  // ==========================================
  // בדיקת סטטוס ההצבעה מול השרת
  // ==========================================

  useEffect(() => {
    if (page !== "voting" || !token) {
      return;
    }

    const controller = new AbortController();

    // מאפסים את מצב הבדיקה הקודם
    setElectionClosed(null);
    setElectionStatusError("");

    // בודקים אם המשתמש כבר הצביע
    void dispatch(fetchVoteStatus());

    // בודקים אם הבחירות פתוחות
    const checkElectionStatus = async () => {
      try {
        const response = await fetch(
          `${VOTING_API}/election-status`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          throw new Error(
            "פג תוקף ההתחברות. יש להתחבר מחדש."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "אין הרשאה לבדוק את מצב הבחירות."
          );
        }

        if (!response.ok) {
          throw new Error(
            `בדיקת מצב הבחירות נכשלה (${response.status}).`
          );
        }

        const data: ElectionStatusResponse =
          await response.json();

        if (!controller.signal.aborted) {
          setElectionClosed(data.isClosed);
          setElectionStatusError("");
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(
          "Election status error:",
          error
        );

        setElectionStatusError(
          error instanceof Error
            ? error.message
            : "לא ניתן לבדוק את מצב הבחירות."
        );
      }
    };

    void checkElectionStatus();

    return () => {
      controller.abort();
    };
  }, [
    page,
    token,
    dispatch,
    votingRefreshKey,
  ]);

  // ==========================================
  // ניסיון חוזר במקרה של שגיאה
  // ==========================================

  const retryVotingStatus = () => {
    setElectionClosed(null);
    setElectionStatusError("");

    setVotingRefreshKey(
      (previous) => previous + 1
    );
  };

  // ==========================================
  // עדכון סטטוס מועמד
  // ==========================================

  const handleCandidateStatusChange =
    useCallback((value: boolean) => {
      setCandidateStatus(value);
    }, []);

  // ==========================================
  // מעבר לבית לאחר התחברות
  // ==========================================

  useEffect(() => {
    if (
      isLoggedIn &&
      !isPasswordSetupPage &&
      page !== "forgot-password"
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

  // ==========================================
  // טיפול בשינוי כתובת הדפדפן
  // ==========================================

  useEffect(() => {
    const handlePopState = () => {
      setIsPasswordSetupPage(
        window.location.pathname ===
          "/set-password"
      );

      if (
        new URLSearchParams(
          window.location.search
        ).has("resetToken")
      ) {
        setPage("forgot-password");
      }
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

  // ==========================================
  // איפוס סטטוס מועמד
  // ==========================================

  useEffect(() => {
    setCandidateStatus(null);
  }, [
    token,
    candidateRefreshKey,
  ]);

  // ==========================================
  // חזרה מהגדרת סיסמה
  // ==========================================

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

  // ==========================================
  // ניווט והרשאות
  // ==========================================

  const navigate = (next: Page) => {
    if (!isLoggedIn) {
      setPage(
        next === "register"
          ? "register"
          : "login"
      );

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

    // אזור מנהל
    if (
      next === "admin" &&
      !isAdmin
    ) {
      setPage("home");
      return;
    }

    // אזורים למועמדים בלבד
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

  // ==========================================
  // פתיחת פוסט
  // ==========================================

  const handleOpenPost = (postId: number) => {
    setSelectedPostId(postId);
    setPage("posts");

    window.scrollTo(0, 0);
  };

  // ==========================================
  // יצירת מועמד
  // ==========================================

  const handleCandidateCreated = () => {
    setCandidateRefreshKey(
      (previous) => previous + 1
    );

    setCandidateStatus(null);
    setPage("primaries");
  };

  // ==========================================
  // שמירת מועמד
  // ==========================================

  const handleCandidateSaved = () => {
    setCandidateRefreshKey(
      (previous) => previous + 1
    );
  };

  // ==========================================
  // חזרה מהצבעה
  // ==========================================

  const handleReturnFromVoting = () => {
    setVotingFullscreenActive(false);

    setPage("home");
    window.scrollTo(0, 0);
  };

  // ==========================================
  // התנתקות לאחר הצבעה
  // ==========================================

  const handleLogoutFromVoting = () => {
    setVotingFullscreenActive(false);

    dispatch(resetVoting());
    dispatch(logout());

    setElectionClosed(null);
    setElectionStatusError("");

    setPage("login");
    window.scrollTo(0, 0);
  };

  // ==========================================
  // הגדרת סיסמה
  // ==========================================

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

  // ==========================================
  // איפוס סיסמה
  // ==========================================

  if (page === "forgot-password") {
    return (
      <div
        className="app-layout"
        dir="rtl"
      >
        <main className="app-main">
          <ResetPasswordPage
            onBack={() => {
              window.history.replaceState(
                {},
                "",
                "/"
              );

              setPage(
                isLoggedIn
                  ? "home"
                  : "login"
              );

              window.scrollTo(0, 0);
            }}
          />
        </main>
      </div>
    );
  }

  // ==========================================
  // משתמש שעדיין לא התחבר
  // ==========================================

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
                setPage("home");
              }}
              onRegisterClick={() =>
                setPage("register")
              }
              onForgotPasswordClick={() =>
                setPage("forgot-password")
              }
            />
          )}
        </main>
      </div>
    );
  }

  // ==========================================
  // האתר למשתמש מחובר
  // ==========================================

  return (
    <div
      className="app-layout"
      dir="rtl"
    >
      {/* HEADER */}

      {!hideSiteNavigation && (
        <Header
          onNavigate={navigate}
          candidateRefreshKey={
            candidateRefreshKey
          }
          onCandidateStatusChange={
            handleCandidateStatusChange
          }
        />
      )}

      <main className="app-main">

        {/* דף הבית */}

        {page === "home" && (
          <HomePage
            onJoinClick={() =>
              navigate("primaries")
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
              navigate("primaries")
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
            onCandidateClick={(
              candidateId
            ) => {
              setSelectedCandidateId(
                candidateId
              );

              setPage(
                "candidate-profile"
              );

              window.scrollTo(0, 0);
            }}
          />
        )}

        {/* הרשמת מועמד */}

        {page ===
          "candidate-registration" && (
          <CandidateRegistrationPage
            onCandidateCreated={
              handleCandidateCreated
            }
          />
        )}

        {/* אזור אישי למועמד */}

        {page ===
          "candidate-personal-area" &&
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
          )
        }

        {/* פוסטים */}

        {page === "posts" && (
          <CandidatesFeedPage
            selectedPostId={
              selectedPostId
            }
            isCandidate={
              candidateStatus === true
            }
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
            onBackToNews={() =>
              navigate("news")
            }
          />
        )}

        {/* פרופיל מועמד */}

        {page ===
          "candidate-profile" &&
          selectedCandidateId !== null && (
            <CandidateProfilePage
              candidateId={
                selectedCandidateId
              }
              onBack={() =>
                navigate("primaries")
              }
            />
          )}

        {/* יצירת פוסט */}

        {page === "create-post" &&
          (
            candidateStatus === true ? (
              <CreatePostPage
                onPublished={(
                  postId
                ) => {
                  navigate("posts");

                  setSelectedPostId(
                    postId ?? null
                  );
                }}
              />
            ) : (
              <AccessDenied
                message="רק מועמד רשום יכול לפרסם פוסטים."
                onBack={() =>
                  navigate("home")
                }
              />
            )
          )
        }

        {/* התאמת מועמדים */}

        {page === "match" && (
          <CandidateMatchPage />
        )}

        {/* RAG */}

        {page ===
          "regulation-chat" && (
          <RegulationChatPage />
        )}

        {/* ====================================
            מערכת הצבעה מאובטחת
           ==================================== */}

        {page === "voting" && (
          checkingVoteStatus ||
          (
            electionClosed === null &&
            !electionStatusError
          )
            ? (
              <div
                className="placeholder-page"
                dir="rtl"
                role="status"
              >
                <h2>
                  בודקים את מצב ההצבעה...
                </h2>

                <p>
                  בודקים אם הבחירות פתוחות
                  ואם כבר הצבעת.
                </p>
              </div>
            )
            : (
              !voteStatusChecked ||
              Boolean(electionStatusError)
            )
            ? (
              <div
                className="placeholder-page"
                dir="rtl"
                role="alert"
              >
                <h2>
                  לא ניתן לאמת את מצב
                  ההצבעה
                </h2>

                <p>
                  {electionStatusError ||
                    votingError ||
                    "בדיקת מצב ההצבעה נכשלה."}
                </p>

                <button
                  type="button"
                  onClick={
                    retryVotingStatus
                  }
                >
                  ניסיון חוזר
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("home")
                  }
                >
                  חזרה לאתר
                </button>
              </div>
            )
            : electionClosed ? (
              <div
                className="placeholder-page"
                dir="rtl"
              >
                <h1>
                  הבחירות הסתיימו
                </h1>

                <p>
                  ההצבעה נסגרה ולא ניתן
                  להצביע כעת.
                </p>

                <p>
                  ניתן לצפות בתוצאות
                  הבחירות באתר.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("results")
                  }
                >
                  צפייה בתוצאות הבחירות
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("home")
                  }
                >
                  חזרה לעמוד הבית
                </button>
              </div>
            )
            : hasVoted ? (
              <VotingSuccessPage
                onReturnHome={
                  handleReturnFromVoting
                }
                onLogout={
                  handleLogoutFromVoting
                }
              />
            )
            : (
              <SecureVotingGate
                onActiveChange={
                  handleVotingActiveChange
                }
                onSessionReset={
                  handleVotingSessionReset
                }
                completed={
                  hasVoted
                }
                submitting={
                  voteSubmitting
                }
              >
                <VotingPage
                  key={
                    votingSessionKey
                  }
                />
              </SecureVotingGate>
            )
        )}

        {/* תוצאות הבחירות */}

        {page === "results" && (
          <ElectionResultsPage />
        )}

        {/* אזור מנהל */}

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
          )
        }

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

      {/* FOOTER */}

      {!hideSiteNavigation && (
        <Footer
          onNavigate={
            navigate
          }
        />
      )}

    </div>
  );
}
