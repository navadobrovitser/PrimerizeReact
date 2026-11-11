
import { useEffect, useRef } from "react";
import type { FormEvent } from "react";

import { useAppDispatch, useAppSelector } from "../store/hooks";

import {
  searchCandidateMatches,
} from "../store/candidateMatch/candidateMatchThunks";

import {
  setMatchQuery,
  resetCandidateMatch,
} from "../store/candidateMatch/candidateMatchSlice";

import "./CandidateMatchPage.css";

const API_ORIGIN = "https://localhost:7227";

function getImageUrl(url: string | null): string | undefined {
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
              ✦ TENופה SMART MATCH
            </span>

            <h1>
              המועמדים שלך.
              <br />
              <span>לפי מה שחשוב לך.</span>
            </h1>

            <p className="match-subtitle">
              לא צריך לעבור על עשרות מועמדים.
              פשוט כתבו מה חשוב לכם,
              והמערכת תאתר מועמדים העוסקים
              בנושאים שביקשתם.
            </p>

            <form
              className="match-search-form"
              onSubmit={handleSearch}
            >
              <label htmlFor="match-query">
                מה חשוב לך במועמד?
              </label>

              <textarea
                id="match-query"
                value={query}
                onChange={(event) =>
                  updateQuery(event.target.value)
                }
                placeholder="לדוגמה: אני מחפשת מועמד שעוסק בדיור לצעירים ובתחבורה ציבורית..."
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
                  ✦ {loading
                    ? "מחפש..."
                    : "מצאו לי מועמדים"}
                </button>
              </div>
            </form>

            <div className="match-suggestions">
              <span>אפשר לנסות:</span>

              {[
                "דיור לצעירים וכלכלה",
                "חינוך ובריאות",
                "תחבורה ותשתיות",
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
            <h2>מנתחים את בקשת החיפוש...</h2>
            <p>
              המערכת בודקת את המידע הקיים
              על המועמדים.
            </p>
          </section>
        )}

        {!loading && !searched && (
          <section className="match-intro">
            <div className="match-intro-icon">✦</div>

            <h2>התאמה שמתחילה במה שחשוב לך</h2>

            <p>
              כתבו את הדרישות שלכם,
              והמערכת תציג מועמדים עם תחומי
              פעילות רלוונטיים והסבר להתאמה.
            </p>

            <div className="match-features">
              <div>◈ חיפוש בשפה חופשית</div>
              <div>◎ ניתוח נושאים</div>
              <div>▤ הסבר לכל תוצאה</div>
            </div>
          </section>
        )}

        {!loading && searched && (
          <section className="match-results">

            <div className="match-results-header">
              <div>
                <span className="match-section-label">
                  תוצאות החיפוש
                </span>

                <h2>המועמדים הרלוונטיים</h2>

                <p>
                  נמצאו {results.length} מועמדים
                  עם תחומי פעילות הקשורים
                  לנושאים שביקשת.
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
                <strong>הנושאים שזוהו:</strong>

                {detectedTopics.map((topic) => (
                  <span key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            )}

            {results.length === 0 ? (
              <div className="match-no-results">
                <div>⌕</div>

                <h3>לא נמצאה התאמה</h3>

                <p>
                  נסו לנסח את הבקשה מחדש
                  או להשתמש במונחים אחרים.
                </p>
              </div>
            ) : (
              <div className="match-results-grid">

                {results.map((result, index) => (
                  <article
                    className="match-candidate-card"
                    key={result.candidateId}
                  >
                    <div className="match-card-top">

                      <div className="match-avatar">
                        {result.profileImageUrl && (
                          <img
                            src={getImageUrl(
                              result.profileImageUrl
                            )}
                            alt={result.name}
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        )}

                        <span>👤</span>
                      </div>

                      <div className="match-card-identity">
                        <h3>{result.name}</h3>

                        <span>{result.slogan}</span>
                      </div>

                      <div className="match-score">
                        <strong>
                          {result.score}%
                        </strong>

                        <span>
                          רלוונטיות משוערת
                        </span>
                      </div>
                    </div>

                    <div className="match-progress">
                      <div
                        style={{
                          width: `${result.score}%`,
                        }}
                      />
                    </div>

                    <p className="match-candidate-description">
                      {result.explanation}
                    </p>

                    <div className="match-explanation">
                      <strong>
                        ✦ למה המועמד מופיע?
                      </strong>

                      <p>
                        לפי המידע הקיים במערכת,
                        נמצאו הנושאים הבאים:
                      </p>

                      <div className="match-topic-tags">
                        {result.matchedTopics.map((topic) => (
                          <span key={topic}>
                            ✓ {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="match-card-footer">
                      <span>
                        #{index + 1} בתוצאות החיפוש
                      </span>

                      <span>
                        {result.matchedTopics.length} נושאים תואמים
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="match-disclaimer">
              ℹ התוצאות מבוססות על ניתוח AI
              של מידע המועמדים במערכת.
              אחוזי הרלוונטיות הם אומדן,
              ולא מדד מדויק או המלצת הצבעה.
            </div>

          </section>
        )}

      </div>
    </div>
  );
}
