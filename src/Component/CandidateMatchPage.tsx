
import { useState } from "react";
import type { FormEvent } from "react";
import "./CandidateMatchPage.css";

interface Candidate {
  id: number;
  name: string;
  role: string;
  city: string;
  description: string;
  imageUrl: string;
  topics: string[];
}

interface MatchResult {
  candidate: Candidate;
  score: number;
  matchedTopics: string[];
}

const candidates: Candidate[] = [
  {
    id: 1,
    name: "ד״ר אמיר כהן",
    role: "כלכלה, תעסוקה ודיור",
    city: "חיפה",
    description:
      "פועל לקידום דיור בר השגה, יצירת מקומות עבודה, תמיכה בעסקים קטנים ושיפור ההזדמנויות הכלכליות לצעירים.",
    imageUrl: "/candidates/amir.jpg",
    topics: ["דיור", "כלכלה", "תעסוקה", "צעירים"],
  },
  {
    id: 2,
    name: "מיכל אדרי",
    role: "חינוך, משפחה וקהילה",
    city: "ירושלים",
    description:
      "מקדמת חינוך איכותי, צמצום פערים, חיזוק השירותים החברתיים ותמיכה במשפחות ובקהילות.",
    imageUrl: "/candidates/michal.jpg",
    topics: ["חינוך", "משפחות", "קהילה", "רווחה"],
  },
  {
    id: 3,
    name: "יואב בן דוד",
    role: "תחבורה ותשתיות",
    city: "תל אביב",
    description:
      "מקדם תחבורה ציבורית נגישה, שיפור תשתיות, רכבות, פתרונות לפקקים ופיתוח ערים חכמות.",
    imageUrl: "/candidates/yoav.jpg",
    topics: ["תחבורה", "תשתיות", "רכבות", "סביבה"],
  },
  {
    id: 4,
    name: "עו״ד שרה לוי",
    role: "משפט, שקיפות ומנהל ציבורי",
    city: "פתח תקווה",
    description:
      "פועלת לקידום שקיפות ציבורית, שיפור השירות לאזרח, אחריות שלטונית ומאבק בשחיתות.",
    imageUrl: "/candidates/sara.jpg",
    topics: ["משפט", "שקיפות", "ממשל", "שחיתות"],
  },
  {
    id: 5,
    name: "ד״ר נועם שפירא",
    role: "בריאות ומדע",
    city: "באר שבע",
    description:
      "מקדם שיפור שירותי הבריאות, חדשנות רפואית, מחקר מדעי ונגישות לשירותים בפריפריה.",
    imageUrl: "/candidates/noam.jpg",
    topics: ["בריאות", "רפואה", "מדע", "פריפריה"],
  },
  {
    id: 6,
    name: "רון אשכנזי",
    role: "ביטחון וחירום",
    city: "אשדוד",
    description:
      "פועל לשיפור המוכנות לחירום, חיזוק הביטחון האישי, שירותי הצלה וחוסן קהילתי.",
    imageUrl: "/candidates/ron.jpg",
    topics: ["ביטחון", "חירום", "הצלה", "קהילה"],
  },
];

// מיפוי ביטויים לנושאים
const topicKeywords: Record<string, string[]> = {
  דיור: [
    "דיור", "דירה", "דירות", "משכנתא",
    "שכירות", "נדלן", "נדל״ן", "לקנות בית",
  ],
  כלכלה: [
    "כלכלה", "יוקר המחיה", "מחירים",
    "כסף", "מיסים", "מסים", "עסקים",
  ],
  תעסוקה: [
    "תעסוקה", "עבודה", "עובדים",
    "משכורת", "שכר", "משרות",
  ],
  צעירים: ["צעירים", "צעירות", "סטודנטים"],
  חינוך: [
    "חינוך", "לימודים", "בתי ספר",
    "מורים", "תלמידים", "השכלה",
  ],
  משפחות: [
    "משפחות", "משפחה", "הורים", "ילדים",
  ],
  קהילה: ["קהילה", "קהילות", "חברה", "התנדבות"],
  רווחה: ["רווחה", "סיוע", "שירותים חברתיים"],
  תחבורה: [
    "תחבורה", "אוטובוס", "אוטובוסים",
    "פקקים", "כבישים", "נסיעות",
  ],
  תשתיות: ["תשתיות", "כבישים", "פיתוח עירוני"],
  רכבות: ["רכבת", "רכבות", "מטרו"],
  סביבה: ["סביבה", "זיהום", "אקלים", "ירוק"],
  משפט: ["משפט", "חוקים", "חקיקה", "זכויות"],
  שקיפות: ["שקיפות", "מידע ציבורי"],
  ממשל: ["ממשל", "שלטון", "ממשלה"],
  שחיתות: ["שחיתות", "שוחד"],
  בריאות: ["בריאות", "בתי חולים", "קופות חולים"],
  רפואה: ["רפואה", "רופאים", "טיפול רפואי"],
  מדע: ["מדע", "מחקר", "טכנולוגיה", "חדשנות"],
  פריפריה: ["פריפריה", "נגב", "גליל"],
  ביטחון: ["ביטחון", "בטחון", "ביטחון אישי"],
  חירום: ["חירום", "מוכנות", "אסונות"],
  הצלה: ["הצלה", "חילוץ"],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[״"'׳.,!?;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findTopics(text: string): string[] {
  const normalized = normalizeText(text);

  return Object.entries(topicKeywords)
    .filter(([, keywords]) =>
      keywords.some((keyword) =>
        normalized.includes(normalizeText(keyword))
      )
    )
    .map(([topic]) => topic);
}

function matchCandidates(text: string): MatchResult[] {
  const requestedTopics = findTopics(text);

  if (requestedTopics.length === 0) return [];

  return candidates
    .map((candidate) => {
      const matchedTopics = candidate.topics.filter(
        (topic) => requestedTopics.includes(topic)
      );

      // אחוז כיסוי של הנושאים שהמשתמש ביקש
      const score = Math.round(
        (matchedTopics.length / requestedTopics.length) * 100
      );

      return { candidate, score, matchedTopics };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}

export default function CandidateMatchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [detectedTopics, setDetectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!query.trim()) return;

    setLoading(true);

    // חישוב מקומי. בעתיד יוחלף בקריאת API
    const topics = findTopics(query);
    const matches = matchCandidates(query);

    setDetectedTopics(topics);
    setResults(matches);
    setSearched(true);
    setLoading(false);
  };

  const handleReset = () => {
    setQuery("");
    setResults([]);
    setDetectedTopics([]);
    setSearched(false);
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
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearched(false);
                }}
                placeholder={
                  "לדוגמה: אני מחפשת מועמד שיקדם דיור לצעירים, ישפר את התחבורה הציבורית ויעזור למשפחות..."
                }
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
                  onClick={() => {
                    setQuery(suggestion);
                    setSearched(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        {!searched ? (
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
        ) : (
          <section className="match-results">
            <div className="match-results-header">
              <div>
                <span className="match-section-label">
                  תוצאות החיפוש
                </span>
                <h2>המועמדים הרלוונטיים</h2>
                <p>
                  נמצאו {results.length} מועמדים
                  עם תחומי פעילות שתואמים
                  לנושאים שזוהו בבקשה.
                </p>
              </div>

              <button
                className="match-reset-button"
                onClick={handleReset}
              >
                חיפוש חדש ↻
              </button>
            </div>

            {detectedTopics.length > 0 && (
              <div className="match-detected-topics">
                <strong>הנושאים שזוהו:</strong>

                {detectedTopics.map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            )}

            {results.length === 0 ? (
              <div className="match-no-results">
                <div>⌕</div>
                <h3>לא נמצאה התאמה</h3>
                <p>
                  נסו לנסח את הבקשה מחדש
                  או להשתמש במונחים כמו
                  חינוך, דיור, בריאות או תחבורה.
                </p>
              </div>
            ) : (
              <div className="match-results-grid">
                {results.map((result, index) => (
                  <article
                    className="match-candidate-card"
                    key={result.candidate.id}
                  >
                    <div className="match-card-top">
                      <div className="match-avatar">
                        {result.candidate.imageUrl ? (
                          <img
                            src={result.candidate.imageUrl}
                            alt={result.candidate.name}
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : null}
                        <span>👤</span>
                      </div>

                      <div className="match-card-identity">
                        <h3>{result.candidate.name}</h3>
                        <span>{result.candidate.role}</span>
                        <small>
                          📍 {result.candidate.city}
                        </small>
                      </div>

                      <div className="match-score">
                        <strong>{result.score}%</strong>
                        <span>כיסוי נושאים</span>
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
                      {result.candidate.description}
                    </p>

                    <div className="match-explanation">
                      <strong>✦ למה המועמד מופיע?</strong>
                      <p>
                        לפי נתוני הדוגמה, המועמד
                        עוסק בנושאים הבאים
                        שביקשת:
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
              ℹ ההתאמה מבוססת כרגע על מילות מפתח
              ונתוני הדגמה. היא אינה הערכה
              אובייקטיבית של המועמדים או המלצת הצבעה.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
