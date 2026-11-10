
import { useState } from "react";
import type { Page } from "./Component/Header";

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

import "./App.css";

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
      <button onClick={onBack}>
        חזרה לעמוד הבית
      </button>
    </section>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("home");

  const [
    candidateRefreshKey,
    setCandidateRefreshKey,
  ] = useState(0);

  const navigate = (next: Page) => {
    setPage(next);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCandidateCreated = () => {
    setCandidateRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="app-layout" dir="rtl">
      <Header
        onNavigate={navigate}
        candidateRefreshKey={candidateRefreshKey}
      />

      <main className="app-main">
        {page === "home" && (
          <HomePage
            onJoinClick={() => navigate("login")}
            onProgramClick={() => navigate("program")}
          />
        )}

        {page === "login" && (
          <LoginPage
            onLoginSuccess={() => navigate("home")}
          />
        )}

        {page === "candidate-registration" && (
          <CandidateRegistrationPage
            onCandidateCreated={handleCandidateCreated}
          />
        )}

        {page === "create-post" && (
          <CreatePostPage />
        )}

        {page === "primaries" && (
          <PrimariesPage
            onApplyClick={() =>
              navigate("candidate-registration")
            }
          />
        )}

        {page === "candidates" && (
          <CandidatesFeedPage />
        )}

        {page === "match" && (
          <CandidateMatchPage />
        )}

        {page === "voting" && (
          <VotingPage />
        )}

        {page === "register" && (
          <PartyRegisterPage
            onSwitchToLogin={() => navigate("login")}
          />
        )}

        {page === "about" && (
          <PlaceholderPage
            title="אודות תנופה"
            onBack={() => navigate("home")}
          />
        )}

        {page === "leadership" && (
          <PlaceholderPage
            title="הנהגת תנופה"
            onBack={() => navigate("home")}
          />
        )}

        {page === "program" && (
          <PlaceholderPage
            title="התוכנית שלנו"
            onBack={() => navigate("home")}
          />
        )}

        {page === "news" && (
          <PlaceholderPage
            title="חדשות ועדכונים"
            onBack={() => navigate("home")}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
