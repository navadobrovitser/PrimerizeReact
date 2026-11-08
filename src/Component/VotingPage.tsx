
import { useState } from "react";
import type { DragEvent } from "react";
import "./VotingPage.css";

interface VotingCandidate {
  id: number;
  name: string;
}

interface VotingPageProps {
  onSubmitVote?: (candidateIds: number[]) => Promise<void>;
}

const candidates: VotingCandidate[] = [
  { id: 1, name: "עו״ד שרה לוי" },
  { id: 2, name: "ד״ר אמיר כהן" },
  { id: 3, name: "מיכל אדרי" },
  { id: 4, name: "יואב בן דוד" },
  { id: 5, name: "ד״ר נועם שפירא" },
  { id: 6, name: "סא״ל (במיל׳) רון אשכנזי" },
];

export default function VotingPage({
  onSubmitVote,
}: VotingPageProps) {
  const [ranking, setRanking] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] =
    useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const available = candidates.filter(
    (candidate) => !ranking.includes(candidate.id)
  );

  const addCandidate = (id: number) => {
    if (submitted) return;
    setRanking((previous) =>
      previous.includes(id) ? previous : [...previous, id]
    );
  };

  const removeCandidate = (id: number) => {
    if (submitted) return;
    setRanking((previous) =>
      previous.filter((item) => item !== id)
    );
  };

  const moveCandidate = (from: number, to: number) => {
    if (
      submitted ||
      to < 0 ||
      to >= ranking.length ||
      from === to
    ) return;

    setRanking((previous) => {
      const updated = [...previous];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    targetIndex: number
  ) => {
    event.preventDefault();
    if (draggedIndex !== null) {
      moveCandidate(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const handleSubmit = async () => {
    if (!onSubmitVote) {
      setError(
        "יש לחבר את מערכת ההצבעה לשרת לפני שליחת הצבעה."
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onSubmitVote(ranking);
      setSubmitted(true);
      setShowConfirmation(false);
    } catch {
      setError("שליחת ההצבעה נכשלה. נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="voting-page" dir="rtl">
      <div className="voting-container">
        <div className="voting-heading">
          <span className="voting-eyebrow">
            פריימריז תנופה
          </span>

          <h1>ההצבעה שלכם, העתיד של כולנו</h1>

          <p>
            בחרו את המועמדים שתרצו לראות בהנהגה
            ודרגו אותם לפי סדר העדיפות שלכם.
            ניתן לשנות את הדירוג לפני אישור ההצבעה.
          </p>

          <div className="voting-deadline">
            ◷ מועד סגירת ההצבעה יפורסם על ידי המפלגה
          </div>
        </div>

        <div className="voting-columns">
          <div className="voting-panel">
            <div className="voting-panel-header">
              <h2>הדירוג שלי</h2>
              <span className="voting-count">
                {ranking.length} בדירוג
              </span>
            </div>

            {ranking.length === 0 ? (
              <div className="voting-empty">
                <div className="voting-empty-icon">☷</div>
                <h3>עדיין לא בחרתם מועמדים</h3>
                <p>
                  לחצו על מועמד ברשימה כדי להוסיף
                  אותו לדירוג שלכם.
                </p>
              </div>
            ) : (
              <div className="voting-ranked-list">
                {ranking.map((id, index) => {
                  const candidate = candidates.find(
                    (item) => item.id === id
                  );
                  if (!candidate) return null;

                  return (
                    <div
                      key={id}
                      className="voting-ranked-item"
                      draggable={!submitted}
                      onDragStart={(event) =>
                        handleDragStart(event, index)
                      }
                      onDragOver={(event) =>
                        event.preventDefault()
                      }
                      onDrop={(event) =>
                        handleDrop(event, index)
                      }
                      onDragEnd={() =>
                        setDraggedIndex(null)
                      }
                    >
                      <span className="voting-rank-number">
                        {index + 1}
                      </span>

                      <span className="voting-ranked-name">
                        {candidate.name}
                      </span>

                      <div className="voting-rank-actions">
                        <button
                          type="button"
                          aria-label="העלה בדירוג"
                          disabled={index === 0 || submitted}
                          onClick={() =>
                            moveCandidate(index, index - 1)
                          }
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          aria-label="הורד בדירוג"
                          disabled={
                            index === ranking.length - 1 ||
                            submitted
                          }
                          onClick={() =>
                            moveCandidate(index, index + 1)
                          }
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          className="voting-remove"
                          aria-label="הסר מועמד"
                          disabled={submitted}
                          onClick={() =>
                            removeCandidate(id)
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="voting-panel">
            <div className="voting-panel-header">
              <h2>מועמדים זמינים</h2>
              <span className="voting-count">
                {available.length} מועמדים
              </span>
            </div>

            <div className="voting-available-list">
              {available.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className="voting-available-item"
                  disabled={submitted}
                  onClick={() =>
                    addCandidate(candidate.id)
                  }
                >
                  <span>{candidate.name}</span>
                  <span className="voting-plus">+</span>
                </button>
              ))}

              {available.length === 0 && (
                <p className="voting-all-selected">
                  כל המועמדים נוספו לדירוג שלכם.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="voting-summary">
          <div>
            <h2>סיכום ההצבעה</h2>
            <p>
              בחרתם {ranking.length} מתוך{" "}
              {candidates.length} מועמדים
            </p>
          </div>

          <button
            type="button"
            className="voting-submit-button"
            disabled={
              ranking.length === 0 ||
              submitted ||
              submitting
            }
            onClick={() => setShowConfirmation(true)}
          >
            {submitted
              ? "ההצבעה נשלחה"
              : "המשך לאישור ההצבעה ←"}
          </button>
        </div>

        {error && (
          <p className="voting-error" role="alert">
            {error}
          </p>
        )}

        {submitted && (
          <div className="voting-success" role="status">
            ✓ ההצבעה התקבלה בהצלחה.
          </div>
        )}
      </div>

      {showConfirmation && (
        <div className="voting-modal-overlay">
          <div
            className="voting-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vote-confirm-title"
          >
            <div className="voting-modal-icon">✓</div>
            <h2 id="vote-confirm-title">
              אישור ההצבעה
            </h2>
            <p>
              בדקו את סדר המועמדים לפני שליחת
              ההצבעה.
            </p>

            <ol>
              {ranking.map((id) => (
                <li key={id}>
                  {candidates.find((c) => c.id === id)?.name}
                </li>
              ))}
            </ol>

            <div className="voting-modal-actions">
              <button
                type="button"
                className="voting-confirm"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting
                  ? "שולח..."
                  : "אישור ושליחת ההצבעה"}
              </button>

              <button
                type="button"
                className="voting-cancel"
                disabled={submitting}
                onClick={() =>
                  setShowConfirmation(false)
                }
              >
                חזרה לעריכה
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
