
import { useState } from "react";
import type { Page } from "./Component/Header";
import CandidateMatchPage from "./Component/CandidateMatchPage";
// רכיבים קבועים בכל האתר
import Header from "./Component/Header";
import Footer from "./Component/Footer";
import PartyRegisterPage from "./Component/PartyRegisterPage";
// עמודי האתר
import HomePage from "./Component/HomePage";
import LoginPage from "./Component/LoginPage";
import PrimariesPage from "./Component/PrimariesPage";
import CandidatesFeedPage from "./Component/CandidatesFeedPage";
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

  // מעבר בין עמודים
  const navigate = (newPage: Page) => {
    setPage(newPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="app-layout" dir="rtl">

      {/* תפריט עליון קבוע */}
      <Header onNavigate={navigate} />

      {/* תוכן האתר */}
      <main className="app-main">

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
            onLoginSuccess={() => navigate("home")}
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
{page === "match" && (
  <CandidateMatchPage />
)}
        {/* עמוד הצבעה */}
       {page === "voting" && (
  <VotingPage />
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
