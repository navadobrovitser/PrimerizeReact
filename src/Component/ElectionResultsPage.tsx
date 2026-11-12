
import { useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import "./ElectionResultsPage.css";

const API_URL = "https://localhost:7227/api/Voting";

interface CandidateResult {
  candidateId: number;
  name: string;
  position: number;
  totalVotes: number;
}

interface ElectionResults {
  totalVoters: number;
  results: CandidateResult[];
}

interface ElectionStatus {
  isClosed: boolean;
}

export default function ElectionResultsPage() {
  const { token, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadResults() {
      setLoading(true);
      setMessage("");
      setResults(null);
      setIsClosed(false);

      if (!isAuthenticated || !token) {
        setMessage("יש להתחבר לאתר כדי לצפות בתוצאות הבחירות.");
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const statusResponse = await fetch(
          `${API_URL}/election-status`,
          {
            headers,
            signal: controller.signal,
          }
        );

        if (statusResponse.status === 401) {
          setMessage("פג תוקף ההתחברות. יש להתחבר מחדש.");
          return;
        }

        if (!statusResponse.ok) {
          throw new Error("לא ניתן לבדוק את מצב הבחירות.");
        }

        const status: ElectionStatus = await statusResponse.json();

        if (!status.isClosed) {
          setMessage("ההצבעה עדיין פתוחה. התוצאות יתפרסמו לאחר סגירתה.");
          return;
        }

        setIsClosed(true);

        const response = await fetch(`${API_URL}/results`, {
          headers,
          signal: controller.signal,
        });

        if (response.status === 401) {
          setMessage("פג תוקף ההתחברות. יש להתחבר מחדש.");
          return;
        }

        if (response.status === 403) {
          setMessage("התוצאות עדיין אינן זמינות לצפייה.");
          return;
        }

        if (!response.ok) {
          throw new Error("לא ניתן לטעון את תוצאות הבחירות.");
        }

        const data: ElectionResults = await response.json();
        setResults(data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setMessage(
          error instanceof Error
            ? error.message
            : "אירעה שגיאה בחיבור לשרת."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadResults();

    return () => controller.abort();
  }, [token, isAuthenticated]);

  const rankedResults = [...(results?.results ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <section className="election-results-page" dir="rtl">
      <div className="election-results-container">
        <div className="election-results-hero">
          <span className="election-results-eyebrow">
            פריימריז תנופה
          </span>

          <h1>תוצאות הבחירות</h1>

          <p>
            דירוג המועמדים לפי תוצאות ההצבעה
          </p>
        </div>

        {loading && (
          <div className="election-results-notice" role="status">
            טוען את תוצאות הבחירות...
          </div>
        )}

        {!loading && message && (
          <div className="election-results-notice" role="status">
            <div className="election-results-notice-icon">
              {isClosed ? "ℹ" : "◷"}
            </div>
            <h2>{isClosed ? "עדכון תוצאות" : "התוצאות טרם פורסמו"}</h2>
            <p>{message}</p>
          </div>
        )}

        {!loading && results && (
          <>
            <div className="election-results-summary">
              <div>
                <span>מספר המצביעים</span>
                <strong>{results.totalVoters}</strong>
              </div>

              <div>
                <span>מספר המועמדים</span>
                <strong>{rankedResults.length}</strong>
              </div>

              <div>
                <span>סטטוס הבחירות</span>
                <strong>הסתיימו</strong>
              </div>
            </div>

            {rankedResults.length === 0 ? (
              <div className="election-results-notice">
                עדיין אין מועמדים להצגת תוצאות.
              </div>
            ) : (
              <div className="election-results-list">
                {rankedResults.map((candidate) => (
                  <article
                    key={candidate.candidateId}
                    className={`election-result-card ${
                      candidate.position <= 3
                        ? "election-result-top"
                        : ""
                    }`}
                  >
                    <div className="election-result-position">
                      {candidate.position === 1
                        ? "🥇"
                        : candidate.position === 2
                        ? "🥈"
                        : candidate.position === 3
                        ? "🥉"
                        : candidate.position}
                    </div>

                    <div className="election-result-avatar">
                      {candidate.name?.trim().charAt(0) || "?"}
                    </div>

                    <div className="election-result-info">
                      <h2>{candidate.name || "מועמד ללא שם"}</h2>
                      <p>מקום {candidate.position} ברשימת המועמדים</p>
                    </div>

                    <div className="election-result-votes">
                      <strong>{candidate.totalVotes}</strong>
                      <span>פתקים שבהם דורג</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
