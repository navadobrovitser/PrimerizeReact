
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
  import.meta.env.VITE_API_ORIGIN || window.location.origin
).replace(/\/$/, "");

function mediaUrl(value?: string | null): string {
  if (!value) return "";

  const cleanUrl = value.trim();

  if (/^https?:\/\//i.test(cleanUrl)) {
    return cleanUrl;
  }

  const cleanPath = cleanUrl.replace(/^\/+/, "");

  if (/^Images\//i.test(cleanPath)) {
    return `${API_ORIGIN}/${cleanPath}`;
  }

  return `${API_ORIGIN}/Images/${cleanPath}`;
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

  useEffect(() => {
    void dispatch(fetchCandidates());
  }, [dispatch]);

  const candidates = useMemo(
    () =>
      items
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
        })),
    [items]
  );

  const filtered = candidates.filter((candidate) =>
    candidate.name
      .toLocaleLowerCase("he-IL")
      .includes(search.trim().toLocaleLowerCase("he-IL"))
  );

  return (
    <div className="primaries-page" dir="rtl">
      <section className="primaries-hero">
        <div className="primaries-decoration" />

        <div className="primaries-container">
          <div className="primaries-content">
            <div className="primaries-eyebrow">
              <span className="eyebrow-line" />
              פריימריז תנופה
            </div>

            <h1 className="primaries-title">
              הכירו את המועמדים לפריימריז
            </h1>

            <p className="primaries-description">
              היכנסו לפרופיל של כל מועמד כדי לקרוא
              את קורות החיים, לצפות בסרטון ההיכרות
              ולעיין בפוסטים שפרסם.
            </p>

            <div className="primaries-actions">
              <button
                type="button"
                className="primaries-primary-btn"
                onClick={() =>
                  document
                    .getElementById("primaries-candidates")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
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
                הגשת מועמדות פתוחה לחברי מפלגה
                מאושרים בעלי ותק של ארבע שנים,
                בהתאם לבדיקת הזכאות בשרת.
              </p>
            </div>
          </div>
        </div>
      </section>

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
                לחצו על "לפרופיל המלא" כדי לצפות
                במידע של כל מועמד.
              </p>
            </div>

            <div className="primaries-search">
              <input
                type="search"
                aria-label="חיפוש מועמד"
                placeholder="חיפוש לפי שם..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          {loading && (
            <p role="status">טוען מועמדים...</p>
          )}

          {!loading && error && (
            <div role="alert">
              <p>לא ניתן לטעון מועמדים: {error}</p>

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

          {!loading &&
            !error &&
            (filtered.length > 0 ? (
              <div className="primaries-cards-grid">
                {filtered.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="primaries-profile-card-wrapper"
                  >
                    <CandidateCard candidate={candidate} />

                    <button
                      type="button"
                      className="primaries-profile-button"
                      onClick={() =>
                        onCandidateClick(candidate.id)
                      }
                    >
                      לצפייה בפרופיל המלא
                      <span aria-hidden="true"> ←</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                {search
                  ? "לא נמצאו מועמדים שמתאימים לחיפוש."
                  : "עדיין לא הוגשו מועמדויות."}
              </p>
            ))}
        </div>
      </section>
    </div>
  );
}
