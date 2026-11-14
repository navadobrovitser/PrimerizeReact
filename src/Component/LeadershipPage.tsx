
import { useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import "./LeadershipPage.css";

interface PartyLeader {
  userId: number;
  name: string;
  role: string;
}

interface LeadershipPageProps {
  onCandidatesClick: () => void;
}

const API = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/$/, "");

export default function LeadershipPage({
  onCandidatesClick,
}: LeadershipPageProps) {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const [leader, setLeader] =
    useState<PartyLeader | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadLeader = async () => {
      setLoading(true);
      setError("");
      setLeader(null);

      try {
        if (!token) {
          throw new Error(
            "עמוד זה מיועד לחברי מפלגה מחוברים בלבד."
          );
        }

        const response = await fetch(
          `${API}/api/Users/party-leader`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          throw new Error(
            "יש להתחבר למערכת כדי לצפות בעמוד ההנהגה."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "הגישה מותרת לחברי מפלגה מאושרים, מועמדים ולמנהל בלבד."
          );
        }

        if (response.status === 404) {
          throw new Error(
            "לא נמצאו פרטי ראש המפלגה."
          );
        }

        if (!response.ok) {
          throw new Error(
            `אירעה שגיאה בטעינת ההנהגה (${response.status}).`
          );
        }

        const data: PartyLeader =
          await response.json();

        if (
          !data ||
          typeof data.name !== "string" ||
          !data.name.trim()
        ) {
          throw new Error(
            "השרת החזיר פרטי הנהגה לא תקינים."
          );
        }

        if (!controller.signal.aborted) {
          setLeader(data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "אירעה שגיאה לא צפויה."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadLeader();

    return () => controller.abort();
  }, [token, retryKey]);

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("");

  return (
    <main className="leadership-page" dir="rtl">
      {/* HERO */}

      <section className="leadership-hero">
        <div className="leadership-hero-inner">
          <span className="leadership-eyebrow">
            תנופה / הנהגת המפלגה
          </span>

          <h1>הנהגת תנופה.</h1>

          <p>
            מאחורי כל דרך עומדים אנשים שמובילים
            אותה. הכירו את ראש המפלגה ואת
            פעילות ההנהגה.
          </p>

          <div className="leadership-hero-line" />
        </div>
      </section>

      {/* LEADER */}

      <section className="leadership-content">
        <div className="leadership-heading">
          <div>
            <span className="leadership-small-title">
              האנשים שמובילים
            </span>

            <h2>
              ראש <span>המפלגה</span>
            </h2>
          </div>

          <p>
            הכירו את האדם העומד בראש תנופה
            ומוביל את פעילות המפלגה.
          </p>
        </div>

        {loading && (
          <div
            className="leadership-message"
            role="status"
          >
            <div className="leadership-loader" />
            <p>טוען את פרטי ראש המפלגה...</p>
          </div>
        )}

        {!loading && error && (
          <div
            className="leadership-message leadership-error"
            role="alert"
          >
            <h3>לא ניתן להציג את פרטי ההנהגה</h3>

            <p>{error}</p>

            {token && (
              <button
                type="button"
                onClick={() =>
                  setRetryKey((previous) => previous + 1)
                }
              >
                נסי שוב
              </button>
            )}
          </div>
        )}

        {!loading && !error && leader && (
          <article className="leadership-card">
            <div className="leadership-card-visual">
              <div className="leadership-portrait">
                {getInitials(leader.name)}
              </div>

              <div className="leadership-visual-bottom">
                <span className="leadership-visual-line" />
                <span>הנהגת תנופה</span>
              </div>
            </div>

            <div className="leadership-card-details">
              <span className="leadership-role">
                {leader.role || "ראש המפלגה"}
              </span>

              <h3>{leader.name}</h3>

              <div className="leadership-accent" />

              <p className="leadership-description">
                ראש המפלגה אחראי להובלת פעילותה,
                לתיאום עבודת ההנהלה ולקידום
                המטרות שהוגדרו במסגרת פעילות
                המפלגה.
              </p>

              <div className="leadership-info-strip">
                <div>
                  <span>תפקיד</span>
                  <strong>ראש המפלגה</strong>
                </div>

                <div>
                  <span>מסגרת פעילות</span>
                  <strong>מפלגת תנופה</strong>
                </div>
              </div>

              <button
                type="button"
                className="leadership-primary-button"
                onClick={onCandidatesClick}
              >
                הכירו את המועמדים
                <span aria-hidden="true">←</span>
              </button>
            </div>
          </article>
        )}
      </section>

      {/* STRUCTURE */}

      {!loading && !error && leader && (
        <>
          <section className="leadership-structure">
            <div className="leadership-structure-inner">
              <div className="leadership-structure-heading">
                <span className="leadership-small-title">
                  מבנה המפלגה
                </span>

                <h2>
                  הנהגה, מועמדים
                  <span> וחברי מפלגה</span>
                </h2>

                <p>
                  במערכת הפריימריז לכל גורם יש
                  תפקיד מוגדר, המאפשר ניהול
                  מסודר של התהליך.
                </p>
              </div>

              <div className="leadership-structure-grid">
                <div className="leadership-structure-card">
                  <span className="leadership-structure-number">
                    01
                  </span>
                  <h3>ראש המפלגה</h3>
                  <p>
                    מנהל המערכת, האחראי על
                    פעולות הניהול וההרשאות.
                  </p>
                </div>

                <div className="leadership-structure-card">
                  <span className="leadership-structure-number">
                    02
                  </span>
                  <h3>המועמדים</h3>
                  <p>
                    מציגים את עצמם, מפרסמים
                    תכנים ומשתתפים בפריימריז.
                  </p>
                </div>

                <div className="leadership-structure-card">
                  <span className="leadership-structure-number">
                    03
                  </span>
                  <h3>חברי המפלגה</h3>
                  <p>
                    נחשפים למידע על המועמדים
                    ומשתתפים בתהליך בהתאם
                    להרשאות שלהם.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}

          <section className="leadership-cta">
            <div className="leadership-cta-inner">
              <div>
                <span>השלב הבא</span>

                <h2>
                  הכירו את האנשים
                  <br />
                  שמתמודדים בפריימריז.
                </h2>

                <p>
                  קראו על המועמדים, הכירו את
                  הרקע שלהם וגלו את התכנים
                  שהם מפרסמים באתר.
                </p>
              </div>

              <button
                type="button"
                onClick={onCandidatesClick}
              >
                מעבר לפריימריז
                <span aria-hidden="true">←</span>
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
