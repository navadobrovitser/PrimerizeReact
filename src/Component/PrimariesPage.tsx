
import { useState } from "react";

import CandidateCard from "./CandidateCard";
import type { Candidate } from "./CandidateCard";

import "./PrimariesPage.css";

interface PrimariesPageProps {
  onApplyClick?: () => void;
}

const candidates: Candidate[] = [
  {
    id: 1,
    name: "נועה בן ארי",
    role: "מועמדת בפריימריז",
    imageUrl: "",
  },
  {
    id: 2,
    name: "אילן שדה",
    role: "מועמד בפריימריז",
    imageUrl: "",
  },
  {
    id: 3,
    name: "מיכל רוזן",
    role: "מועמדת בפריימריז",
    imageUrl: "",
  },
];

export default function PrimariesPage({
  onApplyClick,
}: PrimariesPageProps) {
  const [search, setSearch] = useState("");

  const filteredCandidates = candidates.filter((candidate) =>
    candidate.name.includes(search.trim())
  );

  const scrollToCandidates = () => {
    document
      .getElementById("primaries-candidates")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="primaries-page">
      {/* אזור הכותרת הראשית */}
      <section className="primaries-hero">
        <div className="primaries-decoration" />

        <div className="primaries-container">
          <div className="primaries-content">

            <div className="primaries-eyebrow">
              <span className="eyebrow-line" />
              פריימריז תנופה
            </div>

            <h1 className="primaries-title">
              הבחירה שלכם קובעת מי יוביל את
              <br className="desktop-break" />
              התנופה
            </h1>

            <p className="primaries-description">
              כל מועמד ומועמדת מעלים תמונה ופוסט הצגה.
              קראו, הגיבו, תנו לייקים - ובסוף דרגו את
              המועמדים לפי סדר העדיפות שלכם.
            </p>

            <div className="primaries-actions">
              <button
                type="button"
                className="primaries-primary-btn"
                onClick={scrollToCandidates}
              >
                למועמדים
              </button>

              <button
                type="button"
                className="primaries-outline-btn"
                onClick={onApplyClick}
              >
                הגשת מועמדות
              </button>
            </div>

            <div className="primaries-notice">
              <span className="notice-icon" aria-hidden="true">
                ℹ
              </span>
              <p>
                כל מועמדות נבדקת ומאושרת על ידי מטה
                המפלגה לפני שהיא מופיעה באתר.
                תוצאות ההצבעה יפורסמו רק לאחר סגירתה.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* אזור המועמדים */}
      <section
        id="primaries-candidates"
        className="primaries-candidates-section"
      >
        <div className="primaries-list-container">
          <div className="primaries-section-header">
            <div>
              <span className="primaries-section-label">
                הכירו את המתמודדים
              </span>
              <h2>המועמדים שלנו</h2>
              <p>
                הכירו את המועמדים המשתתפים בפריימריז
                של מפלגת תנופה.
              </p>
            </div>

            <div className="primaries-search">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              <input
                type="search"
                placeholder="חיפוש מועמד..."
                aria-label="חיפוש מועמד"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          {filteredCandidates.length > 0 ? (
            <div className="primaries-cards-grid">
              {filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                />
              ))}
            </div>
          ) : (
            <div className="primaries-empty">
              לא נמצאו מועמדים המתאימים לחיפוש.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
