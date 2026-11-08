
import { useState } from "react";
import type { Page } from "./Component/Header";

import Header from "./Component/Header";
import Footer from "./Component/Footer";
import HomePage from "./Component/HomePage";
import LoginPage from "./Component/LoginPage";
import PrimariesPage from "./Component/PrimariesPage";
import CandidatesFeedPage from "./Component/CandidatesFeedPage";

import "./App.css";

export default function App() {
  const [page, setPage] = useState<Page>("home");

  const navigate = (newPage: Page) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const PlaceholderPage = ({
    title,
  }: {
    title: string;
  }) => (
    <section className="placeholder-page">
      <h1>{title}</h1>
      <p>העמוד הזה נמצא כרגע בבנייה.</p>
      <button onClick={() => navigate("home")}>
        חזרה לעמוד הבית
      </button>
    </section>
  );

  return (
    <div className="app-layout" dir="rtl">
      <Header onNavigate={navigate} />

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

        {page === "primaries" && (
          <PrimariesPage
            onApplyClick={() => navigate("login")}
          />
        )}

        {page === "candidates" && (
          <CandidatesFeedPage />
        )}

        {page === "about" && (
          <PlaceholderPage title="אודות תנופה" />
        )}

        {page === "leadership" && (
          <PlaceholderPage title="הנהגת תנופה" />
        )}

        {page === "program" && (
          <PlaceholderPage title="התוכנית שלנו" />
        )}

        {page === "news" && (
          <PlaceholderPage title="חדשות ועדכונים" />
        )}

      </main>

      <Footer />
    </div>
  );
}
