
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCandidates } from "../store/candidates/candidatesThunks";
import CandidateCard from "./CandidateCard";
import "./PrimariesPage.css";

interface PrimariesPageProps {
  onApplyClick?: () => void;
  onCandidateClick: (candidateId: number) => void;
}




const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/+$/, "");

function mediaUrl(value?: string | null): string {
  if (!value) return "";

  const url = value.trim().replace(/\\/g, "/");

  if (!url) return "";

  // אם התקבלה כתובת מלאה
  if (/^https?:\/\//i.test(url)) {
    const parsed = new URL(url);

    // תיקון כתובות שמפנות בטעות לשרת Vite
    if (parsed.port === "5173") {
      return `${API_ORIGIN}${parsed.pathname}`;
    }

    return url;
  }

  const path = url.replace(/^\/+/, "");

  if (/^Images\//i.test(path)) {
    return `${API_ORIGIN}/${path}`;
  }

  return `${API_ORIGIN}/Images/${path}`;
}


export default function PrimariesPage({
  onApplyClick,
  onCandidateClick,
}: PrimariesPageProps) {
  const dispatch = useAppDispatch();

  const { items, loading, error } = useAppSelector(
    (state) => state.candidates
  );

  const [search, setSearch] = useState("");

  // טעינת המועמדים מהשרת
  useEffect(() => {
    void dispatch(fetchCandidates());
  }, [dispatch]);

  // התאמת הנתונים שמגיעים מהשרת לכרטיסי המועמדים
  const candidates = useMemo(() => {
    return items
      .filter(
        (candidate) =>
          typeof candidate.candidateId === "number"
      )
      .map((candidate) => ({
        id: candidate.candidateId!,
        name: candidate.name || "מועמד",
        role: candidate.slogan || "מועמד בפריימריז",
        imageUrl: mediaUrl(
          candidate.profileImageUrl || candidate.imageUrl
        ),
      }));
  }, [items]);

  // סינון לפי שם המועמד
  const filteredCandidates = useMemo(() => {
    const searchValue = search
      .trim()
      .toLocaleLowerCase("he-IL");

    if (!searchValue) return candidates;

    return candidates.filter((candidate) =>
      candidate.name
        .toLocaleLowerCase("he-IL")
        .includes(searchValue)
    );
  }, [candidates, search]);

  // פתיחת הפרופיל האישי
  const handleCandidateClick = (candidateId: number) => {
    onCandidateClick(candidateId);
  };

  // מעבר לרשימת המועמדים
  const scrollToCandidates = () => {
    document
      .getElementById("primaries-candidates")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="primaries-page" dir="rtl">
      {/* אזור פתיחה */}
      <section className="primaries-hero">
        <div className="primaries-decoration" />

        <div className="primaries-container">
          <div className="primaries-content">
            <div className="primaries-eyebrow">
              <span className="eyebrow-line" />
              פריימריז תנופה
            </div>

            <h1 className="primaries-title">
              הבחירה שלכם קובעת
              <br />
              מי יוביל את התנופה
            </h1>

            <p className="primaries-description">
              הכירו את המועמדים המתמודדים בפריימריז,
              קראו על הדרך והחזון שלהם, צפו בסרטוני
              ההיכרות והכירו את האנשים שמבקשים
              להוביל את המפלגה קדימה.
            </p>

            <div className="primaries-actions">
              <button
                type="button"
                className="primaries-primary-btn"
                onClick={scrollToCandidates}
              >
                הכירו את המועמדים
              </button>

              {onApplyClick && (
                <button
                  type="button"
                  className="primaries-outline-btn"
                  onClick={onApplyClick}
                >
                  הגשת מועמדות
                </button>
              )}
            </div>

            <div className="primaries-notice">
              <p>
                הגשת מועמדות מיועדת לחברי מפלגה
                מאושרים בעלי ותק של ארבע שנים לפחות,
                בכפוף לבדיקת הזכאות במערכת.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* רשימת המועמדים */}
      <section
        id="primaries-candidates"
        className="primaries-candidates-section"
      >
        <div className="primaries-list-container">
          <div className="primaries-section-header">
            <div>
              <span className="primaries-section-label">
                האנשים שמאחורי החזון
              </span>

              <h2>הכירו את המועמדים</h2>

              <p>
                לחצו על כרטיס מועמד כדי לעבור
                לפרופיל האישי שלו, לקרוא את קורות
                החיים ולצפות בפוסטים שפרסם.
              </p>
            </div>

            <div className="primaries-search">
              <input
                type="search"
                placeholder="חיפוש מועמד לפי שם..."
                aria-label="חיפוש מועמד לפי שם"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          {/* מספר המועמדים */}
          {!loading && !error && candidates.length > 0 && (
            <div className="primaries-results-count">
              {search.trim()
                ? `נמצאו ${filteredCandidates.length} מועמדים`
                : `${candidates.length} מועמדים בפריימריז`}
            </div>
          )}

          {/* טעינה */}
          {loading && (
            <div
              className="primaries-loading"
              role="status"
            >
              <p>טוענים את המועמדים...</p>
            </div>
          )}

          {/* שגיאה */}
          {!loading && error && (
            <div
              className="primaries-error"
              role="alert"
            >
              <h3>לא הצלחנו לטעון את המועמדים</h3>

              <p>{error}</p>

              <button
                type="button"
                onClick={() =>
                  void dispatch(fetchCandidates())
                }
              >
                נסו שוב
              </button>
            </div>
          )}

          {/* כרטיסי מועמדים */}
          {!loading &&
            !error &&
            filteredCandidates.length > 0 && (
              <div className="primaries-cards-grid">
                {filteredCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onClick={(selectedCandidate) =>
                      handleCandidateClick(
                        selectedCandidate.id
                      )
                    }
                  />
                ))}
              </div>
            )}

          {/* אין תוצאות */}
          {!loading &&
            !error &&
            filteredCandidates.length === 0 && (
              <div className="primaries-empty">
                <h3>
                  {search.trim()
                    ? "לא נמצאו מועמדים"
                    : "אין מועמדים להצגה כרגע"}
                </h3>

                <p>
                  {search.trim()
                    ? "נסו לחפש שם אחר."
                    : "המועמדים יוצגו כאן לאחר הוספתם למערכת."}
                </p>

                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    ניקוי החיפוש
                  </button>
                )}
              </div>
            )}
        </div>
      </section>
    </div>
  );
}
