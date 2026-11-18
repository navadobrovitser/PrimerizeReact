
import { useEffect, useRef } from "react";
import type { FormEvent } from "react";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { searchCandidateMatches } from "../store/candidateMatch/candidateMatchThunks";
import {
  setMatchQuery,
  resetCandidateMatch,
} from "../store/candidateMatch/candidateMatchSlice";

import { API_ORIGIN } from "../config/api";
import "./CandidateMatchPage.css";

type CandidateResult = {
  candidateId: number;
  name: string;
  slogan: string;
  profileImageUrl?: string | null;
  score?: number;
  explanation?: string | null;
  matchedTopics?: string[];
};

function getImageUrl(
  url: string | null | undefined
): string | undefined {
  if (!url) return undefined;

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function CandidateMatchPage() {
  const dispatch = useAppDispatch();

  const {
    query,
    results,
    detectedTopics,
    loading,
    searched,
    error,
  } = useAppSelector((state) => state.candidateMatch);

  const activeRequest = useRef<{
    abort: () => void;
  } | null>(null);

  useEffect(() => {
    return () => {
      activeRequest.current?.abort();
    };
  }, []);

  const updateQuery = (value: string) => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    dispatch(setMatchQuery(value));
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!query.trim()) return;

    activeRequest.current?.abort();

    const request = dispatch(
      searchCandidateMatches(query.trim())
    );

    activeRequest.current = request;
  };

  const handleReset = () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    dispatch(resetCandidateMatch());
  };

  return (
    <div className="match-page" dir="rtl">
      <div className="match-container">

        <section className="match-hero">
          <div className="match-hero-glow" />

          <div className="match-hero-content">
            <span className="match-eyebrow">
              ✦ TENופה SMART SEARCH
            </span>

            <h1>
              חיפוש חכם.
              <br />
              <span>מבוסס על מידע אמיתי.</span>
            </h1>

            <p className="match-subtitle">
              חפשו נושאים שמעניינים אתכם.
              המערכת מנתחת באמצעות בינה מלאכותית
              את קורות החיים של המועמדים,
              ומדרגת אותם לפי התאמה רעיונית לחיפוש.
            </p>

            <form
              className="match-search-form"
              onSubmit={handleSearch}
            >
              <label htmlFor="match-query">
                איזה נושא תרצו לחפש?
              </label>

              <textarea
                id="match-query"
                value={query}
                onChange={(event) =>
                  updateQuery(event.target.value)
                }
                placeholder="לדוגמה: חינוך, תחבורה ציבורית, דיור לצעירים..."
                rows={5}
                maxLength={1000}
              />

              <div className="match-form-footer">
                <span>
                  כתבו בשפה חופשית, עד 1,000 תווים
                </span>

                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                >
                  {loading
                    ? "מנתח התאמות..."
                    : "✦ חיפוש חכם במידע המועמדים"}
                </button>
              </div>
            </form>

            <div className="match-suggestions">
              <span>אפשר לנסות:</span>

              {[
                "חינוך",
                "דיור לצעירים",
                "תחבורה ציבורית",
                "ניהול פרויקטים",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => updateQuery(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <p
            role="alert"
            style={{
              color: "#b42318",
              marginTop: 20,
              fontWeight: 500,
            }}
          >
            {error}
          </p>
        )}

        {loading && (
          <section
            className="match-intro"
            aria-live="polite"
          >
            <div className="match-intro-icon">✦</div>

            <h2>הבינה המלאכותית מנתחת התאמות...</h2>

            <p>
              המערכת בוחנת את קורות החיים של
              המועמדים, משווה את המשמעות וההקשר
              לבקשתכם ומחשבת ציוני התאמה.
              התהליך עשוי להימשך מעט זמן.
            </p>
          </section>
        )}

        {!loading && !searched && (
          <section className="match-intro">
            <div className="match-intro-icon">✦</div>

            <h2>התאמה חכמה למועמדים</h2>

            <p>
              הזינו נושא, רעיון או העדפה בשפה חופשית,
              וקבלו דירוג מועמדים המבוסס על ניתוח
              סמנטי של קורות החיים באמצעות AI.
            </p>

            <div className="match-features">
              <div>◈ הבנת משמעות והקשר</div>
              <div>◎ דירוג התאמה אישי</div>
              <div>▤ ניתוח באמצעות AI</div>
            </div>
          </section>
        )}

        {!loading && searched && (
          <section className="match-results">

            <div className="match-results-header">
              <div>
                <span className="match-section-label">
                  תוצאות ההתאמה החכמה
                </span>

                <h2>המועמדים המתאימים לחיפוש שלך</h2>

                <p>
                  נותחו{" "}
                  <strong>{results.length}</strong>{" "}
                  מועמדים באמצעות בינה מלאכותית,
                  והם דורגו לפי מידת ההתאמה.
                </p>
              </div>

              <button
                className="match-reset-button"
                type="button"
                onClick={handleReset}
              >
                חיפוש חדש ↻
              </button>
            </div>

            {detectedTopics.length > 0 && (
              <div className="match-detected-topics">
                <strong>נושאים שזוהו בחיפוש:</strong>

                {detectedTopics.map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            )}

            {results.length === 0 ? (
              <div className="match-no-results">
                <div>⌕</div>
                <h3>לא נמצאו תוצאות</h3>
                <p>
                  נסו לנסח את החיפוש מחדש
                  או להשתמש במונחים אחרים.
                </p>
              </div>
            ) : (
              <div className="match-results-grid">
                {results
                  .slice()
                  .sort(
                    (a, b) =>
                      (b.score ?? 0) - (a.score ?? 0)
                  )
                  .map((result) => {
                    const candidate = result as CandidateResult;

                    const score =
                      typeof candidate.score === "number"
                        ? Math.max(
                            0,
                            Math.min(100, candidate.score)
                          )
                        : null;

                    return (
                      <article
                        className="match-candidate-card"
                        key={candidate.candidateId}
                      >
                        <div className="match-card-top">
                          <div className="match-avatar">
                            {candidate.profileImageUrl && (
                              <img
                                src={getImageUrl(
                                  candidate.profileImageUrl
                                )}
                                alt={candidate.name}
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            )}
                            <span>👤</span>
                          </div>

                          <div className="match-card-identity">
                            <h3>{candidate.name}</h3>
                            <span>{candidate.slogan}</span>
                          </div>
                        </div>

                        {score !== null && (
                          <div
                            style={{
                              padding: "20px",
                              margin: "18px 0",
                              background: "#f1f8f5",
                              borderRadius: 16,
                              border: "1px solid #d9e9e1",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                  "space-between",
                                gap: 12,
                                marginBottom: 14,
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: 16,
                                  color: "#244c40",
                                }}
                              >
                                רלוונטיות לחיפוש
                              </strong>

                              <strong
                                style={{
                                  fontSize: 32,
                                  color: "#176b57",
                                  fontWeight: 800,
                                }}
                              >
                                {Math.round(score)}%
                              </strong>
                            </div>

                            <div
                              role="progressbar"
                              aria-label={`התאמה של ${candidate.name}`}
                              aria-valuenow={score}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              style={{
                                width: "100%",
                                height: 12,
                                borderRadius: 20,
                                background: "#dce9e2",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${score}%`,
                                  height: "100%",
                                  borderRadius: 20,
                                  background: "#21866c",
                                }}
                              />
                            </div>

                            <p
                              style={{
                                fontSize: 12,
                                marginTop: 12,
                                marginBottom: 0,
                                color: "#557367",
                                lineHeight: 1.8,
                              }}
                            >
                              ציון התאמה רעיונית שנקבע
                              באמצעות בינה מלאכותית,
                              על בסיס קורות החיים.
                            </p>
                          </div>
                        )}

                        {candidate.explanation?.trim() && (
                          <div className="match-explanation">
                            <strong>
                              ✦ ניתוח ההתאמה של AI
                            </strong>

                            <p
                              style={{
                                marginTop: 14,
                                marginBottom: 0,
                                lineHeight: 1.9,
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {candidate.explanation}
                            </p>
                          </div>
                        )}

                        <div className="match-card-footer">
                          <span>התאמה חכמה</span>
                          <span>מבוסס AI</span>
                        </div>
                      </article>
                    );
                  })}
              </div>
            )}

            <div className="match-disclaimer">
              ציוני ההתאמה הם הערכות שמופקות באמצעות
              בינה מלאכותית על בסיס קורות החיים של
              המועמדים. האחוזים משקפים מידת התאמה
              רעיונית משוערת, אינם הסתברות סטטיסטית
              ואינם מהווים קביעה ודאית לגבי המועמדים.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
