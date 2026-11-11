
import { useEffect, useState } from "react";
import type { Page } from "./Component/Header";
import { useAppSelector } from "./store/hooks";

import AboutPage from "./Component/AboutPage";
import Header from "./Component/Header";
import Footer from "./Component/Footer";
import HomePage from "./Component/HomePage";
import LoginPage from "./Component/LoginPage";
import PrimariesPage from "./Component/PrimariesPage";
import PartyRegisterPage from "./Component/PartyRegisterPage";
import CandidateRegistrationPage from "./Component/CandidateRegistrationPage";
import { CandidatesFeedPage } from "./Component/CandidatesFeedPage";
import CandidateMatchPage from "./Component/CandidateMatchPage";
import VotingPage from "./Component/VotingPage";
import CreatePostPage from "./Component/CreatePostPage";
import AdminDashboard from "./Component/AdminDashboard";

// העמוד החדש להגדרת סיסמה
import SetPasswordPage from "./Component/SetPasswordPage";

import "./App.css";

// =============================================
// עמוד זמני לעמודים שעדיין בבנייה
// =============================================

function PlaceholderPage({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <section className="placeholder-page">
      <h1>{title}</h1>
      <p>העמוד הזה נמצא כרגע בבנייה.</p>

      <button type="button" onClick={onBack}>
        חזרה לעמוד הבית
      </button>
    </section>
  );
}

// =============================================
// הקומפוננטה הראשית
// =============================================

export default function App() {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const role = useAppSelector(
    (state) => state.auth.role
  );

  const isLoggedIn = Boolean(token);
  const isAdmin = role === "Admin";

  // בדיקה האם המשתמש הגיע מקישור להגדרת סיסמה
  const [isPasswordSetupPage, setIsPasswordSetupPage] =
    useState(
      () => window.location.pathname === "/set-password"
    );

  const [page, setPage] = useState<Page>("home");

  const [
    candidateRefreshKey,
    setCandidateRefreshKey,
  ] = useState(0);

  // =============================================
  // לאחר התחברות / התנתקות
  // =============================================

  useEffect(() => {
    if (!isPasswordSetupPage) {
      setPage("home");
      window.scrollTo(0, 0);
    }
  }, [isLoggedIn, isPasswordSetupPage]);

  // =============================================
  // תמיכה בניווט חזרה / קדימה בדפדפן
  // =============================================

  useEffect(() => {
    const handlePopState = () => {
      setIsPasswordSetupPage(
        window.location.pathname === "/set-password"
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  // =============================================
  // מעבר מעמוד הגדרת סיסמה להתחברות
  // =============================================

  const goToLoginFromPasswordSetup = () => {
    window.history.replaceState({}, "", "/");

    setIsPasswordSetupPage(false);
    setPage("login");

    window.scrollTo(0, 0);
  };

  // =============================================
  // ניווט בין עמודים
  // =============================================

  const navigate = (next: Page) => {
    // משתמש לא מחובר לא יכול להיכנס לעמודים מוגנים
    if (
      !isLoggedIn &&
      next !== "login" &&
      next !== "register"
    ) {
      setPage("login");
      return;
    }

    // רק מנהל רשאי להיכנס ללוח הבקרה
    if (next === "admin" && !isAdmin) {
      setPage("home");
      return;
    }

    setPage(next);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =============================================
  // רענון נתוני מועמדים
  // =============================================

  const handleCandidateCreated = () => {
    setCandidateRefreshKey((prev) => prev + 1);
  };

  // =============================================
  // עמוד הגדרת סיסמה - ללא צורך בהתחברות
  // =============================================

  if (isPasswordSetupPage) {
    return (
      <div className="app-layout" dir="rtl">
        <main className="app-main">
          <SetPasswordPage
            onGoToLogin={goToLoginFromPasswordSetup}
          />
        </main>
      </div>
    );
  }

  // =============================================
  // משתמש לא מחובר
  // =============================================

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
              onLoginSuccess={() =>
                navigate("home")
              }
              onRegisterClick={() =>
                navigate("register")
              }
            />
          )}
        </main>
      </div>
    );
  }

  // =============================================
  // מניעת מצב של עמוד התחברות לאחר כניסה
  // =============================================

  const currentPage: Page =
    page === "login" || page === "register"
      ? "home"
      : page;

  // =============================================
  // משתמש מחובר
  // =============================================

  return (
    <div className="app-layout" dir="rtl">
      <Header
        onNavigate={navigate}
        candidateRefreshKey={candidateRefreshKey}
      />

      <main className="app-main">
        {/* דף הבית */}

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

        {/* אודות */}

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

        {/* פריימריז */}

        {currentPage === "primaries" && (
          <PrimariesPage
            onApplyClick={() =>
              navigate("candidate-registration")
            }
          />
        )}

        {/* רישום מועמד */}

        {currentPage === "candidate-registration" && (
          <CandidateRegistrationPage
            onCandidateCreated={
              handleCandidateCreated
            }
          />
        )}

        {/* פוסטים */}

        {currentPage === "candidates" && (
          <CandidatesFeedPage />
        )}

        {/* יצירת פוסט */}

        {currentPage === "create-post" && (
          <CreatePostPage />
        )}

        {/* התאמה חכמה */}

        {currentPage === "match" && (
          <CandidateMatchPage />
        )}

        {/* הצבעה - גם מנהל יכול להצביע */}

        {currentPage === "voting" && (
          <VotingPage />
        )}

        {/* לוח בקרה - למנהל בלבד */}

        {currentPage === "admin" && isAdmin && (
          <AdminDashboard
            onNavigateToVoting={() =>
              navigate("voting")
            }
          />
        )}

        {/* הנהגה */}

        {currentPage === "leadership" && (
          <PlaceholderPage
            title="הנהגת תנופה"
            onBack={() => navigate("home")}
          />
        )}

        {/* התוכנית */}

        {currentPage === "program" && (
          <PlaceholderPage
            title="התוכנית שלנו"
            onBack={() => navigate("home")}
          />
        )}

        {/* חדשות */}

        {currentPage === "news" && (
          <PlaceholderPage
            title="חדשות ועדכונים"
            onBack={() => navigate("home")}
          />
        )}

        {/* תוצאות - עמוד זמני */}

        {currentPage === "results" && (
          <PlaceholderPage
            title="תוצאות הבחירות"
            onBack={() => navigate("home")}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
