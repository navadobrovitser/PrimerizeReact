
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
  score?: number;
  explanation?: string | null;
  sources?: MatchSource[];
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
      return "נמצא קשר במשמעות בעזרת AI.";
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
      if (!source || !source.quote?.trim()) return false;

      const key = [
        source.sourceType,
        source.postId ?? "",
        source.matchType,
        source.quote.trim(),
      ].join("|");

      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    });
  }

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
              המערכת תאתר מידע מתוך קורות החיים,
              הסלוגנים והפוסטים של המועמדים.
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
                    ? "מחפש..."
                    : "✦ חיפוש במידע המועמדים"}
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

            <h2>מחפשים במידע הקיים...</h2>

            <p>
              המערכת בודקת קורות חיים,
              סלוגנים ופוסטים ומאתרת
              התאמות מדויקות וקשרים סמנטיים.
            </p>
          </section>
        )}

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

        {!loading && searched && (
          <section className="match-results">

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

            {detectedTopics.length > 0 && (
              <div className="match-detected-topics">
                <strong>מונח החיפוש:</strong>

                {detectedTopics.map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            )}

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
              <div className="match-results-grid">
                {results
                  .slice()
                  .sort((a, b) =>
                    (b.score ?? 0) - (a.score ?? 0)
                  )
                  .map((result) => {
                    const candidate = result as CandidateResult;

                    const sources = getSources(candidate)
                      .sort(
                        (a, b) =>
                          getPriority(a.matchType) -
                          getPriority(b.matchType)
                      );

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

                        {/* אחוזי רלוונטיות */}
                        {score !== null && (
                          <div
                            style={{
                              padding: "18px 20px",
                              margin: "16px 0",
                              background: "#f1f8f5",
                              borderRadius: 16,
                              border: "1px solid #d9e9e1",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                marginBottom: 12,
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: 15,
                                  color: "#244c40",
                                }}
                              >
                                רלוונטיות לחיפוש
                              </strong>

                              <strong
                                style={{
                                  fontSize: 28,
                                  color: "#176b57",
                                  fontWeight: 800,
                                }}
                              >
                                {Math.round(score)}%
                              </strong>
                            </div>

                            <div
                              style={{
                                width: "100%",
                                height: 11,
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
                                marginTop: 10,
                                marginBottom: 0,
                                color: "#557367",
                              }}
                            >
                              ציון המבוסס על נושאי החיפוש,
                              קורות החיים והסלוגן,
                              בהתאם למקורות שנמצאו.
                            </p>
                          </div>
                        )}

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
                                key={`${candidate.candidateId}-${source.sourceType}-${source.postId}-${index}`}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid #dceaea",
                                  borderRadius: 14,
                                  padding: "16px 18px",
                                  lineHeight: 1.8,
                                  overflowWrap: "anywhere",
                                }}
                              >
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
                            <p>לא התקבל פירוט מקורות.</p>
                          )}
                        </div>

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

            <div className="match-disclaimer">
              המערכת מאתרת אזכורים מתוך המידע הקיים
              על המועמדים. ציון הרלוונטיות הוא מדד
              חישובי המבוסס על מקורות שנמצאו, ולא
              הערכה ודאית או המלצה על מועמד.
              מומלץ לקרוא את המקורות המלאים
              כדי להבין את ההקשר.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
