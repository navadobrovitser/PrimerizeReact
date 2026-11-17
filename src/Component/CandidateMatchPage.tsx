
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

// =====================================
// Types
// =====================================

type MatchType = "exact" | "keyword" | "semantic";

type SourceType = "resume" | "slogan" | "post";

type MatchSource = {
  sourceType: SourceType;
  postId: number | null;
  matchType: MatchType;
  quote: string;
};

type CandidateResult = {
  candidateId: number;
  name: string;
  slogan: string;
  profileImageUrl?: string | null;
  explanation?: string | null;
  sources?: MatchSource[];
};

// =====================================
// API
// =====================================

import { API_ORIGIN } from "../config/api";



function getImageUrl(
  url: string | null | undefined
): string | undefined {
  if (!url) return undefined;

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

// =====================================
// Helpers
// =====================================

function getSourceTitle(source: MatchSource): string {
  switch (source.sourceType) {
    case "resume":
      return "קורות החיים";

    case "slogan":
      return "סלוגן";

    case "post":
      return `פוסט #${source.postId ?? ""}`;

    default:
      return "מקור";
  }
}

function getMatchLabel(type: MatchType): string {
  switch (type) {
    case "exact":
      return "התאמה מדויקת";

    case "keyword":
      return "התאמה למילת מפתח";

    case "semantic":
      return "התאמה סמנטית";

    default:
      return "התאמה";
  }
}

function getMatchDescription(type: MatchType): string {
  switch (type) {
    case "exact":
      return "ביטוי החיפוש נמצא במקור.";

    case "keyword":
      return "נמצאה מילה משמעותית מתוך החיפוש.";

    case "semantic":
      return "נמצא קשר אפשרי במשמעות, בעזרת AI.";

    default:
      return "";
  }
}

function getMatchStyle(type: MatchType) {
  switch (type) {
    case "exact":
      return {
        background: "#e8f5ee",
        color: "#216747",
        border: "1px solid #b9dfc8",
      };

    case "keyword":
      return {
        background: "#fff4df",
        color: "#966014",
        border: "1px solid #f0d8a5",
      };

    case "semantic":
      return {
        background: "#eaf0ff",
        color: "#3655a4",
        border: "1px solid #c9d7fa",
      };
  }
}

function getSources(result: CandidateResult): MatchSource[] {
  if (Array.isArray(result.sources)) {
    const unique = new Set<string>();

    return result.sources.filter((source) => {
      if (!source || !source.quote?.trim()) {
        return false;
      }

      const key = [
        source.sourceType,
        source.postId ?? "",
        source.matchType,
        source.quote.trim(),
      ].join("|");

      if (unique.has(key)) {
        return false;
      }

      unique.add(key);
      return true;
    });
  }

  // תאימות זמנית לשרת הישן
  if (!result.explanation) return [];

  return result.explanation
    .split(" | ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({
      sourceType: "post" as const,
      postId: null,
      matchType: "exact" as const,
      quote: part,
    }));
}

function getPriority(type: MatchType): number {
  switch (type) {
    case "exact":
      return 0;

    case "keyword":
      return 1;

    case "semantic":
      return 2;

    default:
      return 3;
  }
}

// =====================================
// Component
// =====================================

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

  // =====================================
  // Events
  // =====================================

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

  // =====================================
  // Render
  // =====================================

  return (
    <div className="match-page" dir="rtl">
      <div className="match-container">

        {/* =====================================
            HERO
        ===================================== */}

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
              המערכת תאתר מידע מתוך קורות החיים,
              הסלוגנים והפוסטים של המועמדים.
            </p>

            {/* SEARCH FORM */}

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
                    ? "מחפש..."
                    : "✦ חיפוש במידע המועמדים"}
                </button>
              </div>
            </form>

            {/* SUGGESTIONS */}

            <div className="match-suggestions">
              <span>אפשר לנסות:</span>

              {[
                "חינוך",
                "דיור לצעירים",
                "תחבורה ציבורית",
                "ילדים",
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

        {/* =====================================
            ERROR
        ===================================== */}

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

        {/* =====================================
            LOADING
        ===================================== */}

        {loading && (
          <section
            className="match-intro"
            aria-live="polite"
          >
            <div className="match-intro-icon">✦</div>

            <h2>מחפשים במידע הקיים...</h2>

            <p>
              המערכת בודקת קורות חיים,
              סלוגנים ופוסטים ומאתרת
              התאמות מדויקות, מילות מפתח
              וקשרים סמנטיים.
            </p>
          </section>
        )}

        {/* =====================================
            INITIAL STATE
        ===================================== */}

        {!loading && !searched && (
          <section className="match-intro">
            <div className="match-intro-icon">✦</div>

            <h2>מידע שאפשר לבדוק</h2>

            <p>
              הזינו נושא לחיפוש וקבלו תוצאות
              המבוססות על תוכן שנמצא במערכת.
            </p>

            <div className="match-features">
              <div>◈ חיפוש מדויק</div>
              <div>◎ חיפוש לפי מילות מפתח</div>
              <div>▤ חיפוש סמנטי</div>
            </div>
          </section>
        )}

        {/* =====================================
            RESULTS
        ===================================== */}

        {!loading && searched && (
          <section className="match-results">

            {/* RESULTS HEADER */}

            <div className="match-results-header">
              <div>
                <span className="match-section-label">
                  תוצאות החיפוש
                </span>

                <h2>מקורות שנמצאו</h2>

                <p>
                  נמצאו אזכורים במידע של{" "}
                  <strong>{results.length}</strong>{" "}
                  מועמדים.
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

            {/* SEARCH TOPICS */}

            {detectedTopics.length > 0 && (
              <div className="match-detected-topics">
                <strong>מונח החיפוש:</strong>

                {detectedTopics.map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            )}

            {/* LEGEND */}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                margin: "22px 0",
              }}
            >
              {(
                ["exact", "keyword", "semantic"] as MatchType[]
              ).map((type) => (
                <span
                  key={type}
                  title={getMatchDescription(type)}
                  style={{
                    ...getMatchStyle(type),
                    borderRadius: 20,
                    padding: "6px 13px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {getMatchLabel(type)}
                </span>
              ))}
            </div>

            {/* NO RESULTS */}

            {results.length === 0 ? (
              <div className="match-no-results">
                <div>⌕</div>

                <h3>לא נמצאו מקורות</h3>

                <p>
                  נסו לנסח את החיפוש מחדש
                  או להשתמש במונחים אחרים.
                </p>
              </div>
            ) : (

              /* CANDIDATE CARDS */

              <div className="match-results-grid">
                {results.map((result) => {
                  const sources = getSources(result)
                    .sort(
                      (a, b) =>
                        getPriority(a.matchType) -
                        getPriority(b.matchType)
                    );

                  return (
                    <article
                      className="match-candidate-card"
                      key={result.candidateId}
                    >

                      {/* CANDIDATE HEADER */}

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

                          <span>
                            {result.slogan}
                          </span>
                        </div>
                      </div>

                      {/* SOURCES */}

                      <div className="match-explanation">
                        <strong>
                          ✦ מקורות שנמצאו במערכת
                        </strong>

                        <p>
                          המקורות הבאים אותרו
                          בקורות החיים, בסלוגן
                          או בפוסטים.
                        </p>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            marginTop: 18,
                          }}
                        >
                          {sources.map((source, index) => (
                            <div
                              key={`${result.candidateId}-${source.sourceType}-${source.postId}-${index}`}
                              style={{
                                background: "#ffffff",
                                border: "1px solid #dceaea",
                                borderRadius: 14,
                                padding: "16px 18px",
                                lineHeight: 1.8,
                                overflowWrap: "anywhere",
                              }}
                            >

                              {/* SOURCE HEADER */}

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent:
                                    "space-between",
                                  flexWrap: "wrap",
                                  gap: 10,
                                  marginBottom: 10,
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: 15,
                                    color: "#183b3b",
                                  }}
                                >
                                  {getSourceTitle(source)}
                                </strong>

                                <span
                                  style={{
                                    ...getMatchStyle(
                                      source.matchType
                                    ),
                                    padding: "4px 11px",
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  {getMatchLabel(
                                    source.matchType
                                  )}
                                </span>
                              </div>

                              {/* QUOTE */}

                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  color: "#344545",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                "{source.quote}"
                              </p>

                              {/* MATCH EXPLANATION */}

                              <p
                                style={{
                                  marginTop: 12,
                                  marginBottom: 0,
                                  paddingTop: 10,
                                  borderTop:
                                    "1px solid #edf2f2",
                                  fontSize: 12,
                                  color: "#647777",
                                }}
                              >
                                {getMatchDescription(
                                  source.matchType
                                )}
                              </p>
                            </div>
                          ))}
                        </div>

                        {sources.length === 0 && (
                          <p>
                            לא התקבל פירוט מקורות.
                          </p>
                        )}
                      </div>

                      {/* CARD FOOTER */}

                      <div className="match-card-footer">
                        <span>תוצאת חיפוש</span>

                        <span>
                          {sources.length} מקורות מוצגים
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* DISCLAIMER */}

            <div className="match-disclaimer">
              המערכת מאתרת אזכורים מתוך
              המידע הקיים על המועמדים.
              התאמות סמנטיות הן הערכות
              של מערכת AI ולא קביעה ודאית.
              התאמה למילת מפתח אינה מעידה
              בהכרח שכל משפט החיפוש תואם.
              מומלץ לקרוא את המקורות המלאים
              כדי להבין את ההקשר.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
