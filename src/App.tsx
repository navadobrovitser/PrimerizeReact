
import { useState } from "react";
import type { Page } from "./Component/Header";
import CandidateMatchPage from "./Component/CandidateMatchPage";

// רכיבים קבועים בכל האתר
import Header from "./Component/Header";
import Footer from "./Component/Footer";
import PartyRegisterPage from "./Component/PartyRegisterPage";

// עמודי האתר
import ElectionResultsPage from "./Component/ElectionResultsPage";
import HomePage from "./Component/HomePage";
import LoginPage from "./Component/LoginPage";
import PrimariesPage from "./Component/PrimariesPage";
import { CandidatesFeedPage } from "./Component/CandidatesFeedPage";
import VotingPage from "./Component/VotingPage";

// עיצוב כללי
import "./App.css";

// עמוד זמני לעמודים שעדיין לא נבנו
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

// הרכיב הראשי של האתר
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);

  // מעבר בין עמודים
  const navigate = (newPage: Page) => {
    setPage(newPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // לאחר התחברות מוצלחת
  const handleLoginSuccess = () => {
    setShowLoginSuccess(true);
    navigate("home");
  };

  return (
    <div className="app-layout" dir="rtl">

      {/* תפריט עליון קבוע */}
      <Header onNavigate={navigate} />

      {/* תוכן האתר */}
      <main className="app-main">

        {/* הודעת התחברות מוצלחת */}
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
              ✓ התחברת בהצלחה! כעת אפשר להמשיך לאזור האישי ולהצבעה.
            </span>

            <button
              type="button"
              onClick={() => setShowLoginSuccess(false)}
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

        {/* עמוד הבית */}
        {page === "home" && (
          <HomePage
            onJoinClick={() => navigate("login")}
            onProgramClick={() => navigate("program")}
          />
        )}

        {/* עמוד התחברות */}
        {page === "login" && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* עמוד פריימריז */}
        {page === "primaries" && (
          <PrimariesPage
            onApplyClick={() => navigate("login")}
          />
        )}

        {/* פוסטים של מועמדים */}
        {page === "candidates" && (
          <CandidatesFeedPage />
        )}

        {/* התאמת מועמדים */}
        {page === "match" && (
          <CandidateMatchPage />
        )}

        {/* עמוד הצבעה */}
       {page === "voting" && (
  <VotingPage
    onViewResults={() => navigate("results")}
  />
)}
{/* עמוד תוצאות הבחירות */}
{page === "results" && (
  <ElectionResultsPage />
)}
        {/* עמוד אודות */}
        {page === "about" && (
          <PlaceholderPage
            title="אודות תנופה"
            onBack={() => navigate("home")}
          />
        )}

        {/* עמוד הנהגה */}
        {page === "leadership" && (
          <PlaceholderPage
            title="הנהגת תנופה"
            onBack={() => navigate("home")}
          />
        )}

        {/* עמוד התוכנית */}
        {page === "program" && (
          <PlaceholderPage
            title="התוכנית שלנו"
            onBack={() => navigate("home")}
          />
        )}

        {/* עמוד חדשות */}
        {page === "news" && (
          <PlaceholderPage
            title="חדשות ועדכונים"
            onBack={() => navigate("home")}
          />
        )}

        {/* עמוד הרשמה */}
        {page === "register" && (
          <PartyRegisterPage
            onSwitchToLogin={() => navigate("login")}
          />
        )}

      </main>

      {/* תחתית האתר */}
      <Footer />

    </div>
  );
}
