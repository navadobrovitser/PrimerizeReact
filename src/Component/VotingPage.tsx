
import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCandidates } from "../store/candidates/candidatesThunks";
import "./VotingPage.css";

const API = "https://localhost:7227/api/Voting";

async function apiRequest<T>(
  url: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.title ||
      `שגיאת שרת (${response.status})`
    );
  }

  return data as T;
}

export default function VotingPage() {
  const dispatch = useAppDispatch();

  const token = useAppSelector(
    (state) => state.auth.token
  );

  const {
    items: candidates,
    loading,
    error: candidatesError,
  } = useAppSelector((state) => state.candidates);

  const [ranking, setRanking] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] =
    useState<number | null>(null);

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [checkingStatus, setCheckingStatus] =
    useState(true);

  const [statusFailed, setStatusFailed] =
    useState(false);

  const [electionClosed, setElectionClosed] =
    useState(false);

  const [voteDate, setVoteDate] =
    useState<string | null>(null);

  // טעינת המועמדים
  useEffect(() => {
    dispatch(fetchCandidates());
  }, [dispatch]);

  // בדיקת מצב ההצבעה מול השרת
  useEffect(() => {
    let active = true;

    async function checkStatus() {
      setCheckingStatus(true);
      setError("");
      setStatusFailed(false);

      if (!token) {
        setError("יש להתחבר כדי להצביע.");
        setCheckingStatus(false);
        return;
      }

      try {
        const [vote, election] = await Promise.all([
          apiRequest<{
            hasVoted: boolean;
            voteDate: string | null;
          }>(`${API}/status`, token),

          apiRequest<{
            isClosed: boolean;
          }>(`${API}/election-status`, token),
        ]);

        if (!active) return;

        setSubmitted(vote.hasVoted);
        setVoteDate(vote.voteDate);
        setElectionClosed(election.isClosed);
      } catch (e) {
        if (active) {
          setStatusFailed(true);
          setError(
            e instanceof Error
              ? e.message
              : "שגיאה בבדיקת מצב ההצבעה."
          );
        }
      } finally {
        if (active) {
          setCheckingStatus(false);
        }
      }
    }

    void checkStatus();

    return () => {
      active = false;
    };
  }, [token]);

  const cannotEdit =
    submitted ||
    electionClosed ||
    checkingStatus ||
    submitting ||
    statusFailed;

  // מועמדים עם מזהה מספרי תקין
  const validCandidates = candidates.filter(
    (candidate) =>
      typeof candidate.candidateId === "number"
  );

  // מועמדים שעדיין לא נבחרו
  const available = validCandidates.filter(
    (candidate) =>
      !ranking.includes(candidate.candidateId!)
  );

  // הוספת מועמד לדירוג
  const addCandidate = (id: number) => {
    if (cannotEdit) return;

    setRanking((previous) =>
      previous.includes(id) || previous.length >= 5
        ? previous
        : [...previous, id]
    );
  };

  // הסרת מועמד
  const removeCandidate = (id: number) => {
    if (cannotEdit) return;

    setRanking((previous) =>
      previous.filter((item) => item !== id)
    );
  };

  // שינוי סדר המועמדים
  const moveCandidate = (
    from: number,
    to: number
  ) => {
    if (
      cannotEdit ||
      to < 0 ||
      to >= ranking.length ||
      from === to
    ) {
      return;
    }

    setRanking((previous) => {
      const updated = [...previous];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  // התחלת גרירה
  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
  };

  // שחרור מועמד במקום החדש
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

  // שליחת ההצבעה לשרת
  const handleSubmit = async () => {
    if (
      !token ||
      checkingStatus ||
      statusFailed ||
      submitted ||
      electionClosed ||
      ranking.length < 1 ||
      ranking.length > 5
    ) {
      setError(
        "לא ניתן לשלוח הצבעה במצב הנוכחי. יש לבחור בין מועמד אחד לחמישה."
      );

      setShowConfirmation(false);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const rankings = ranking.map(
        (candidateId, index) => ({
          candidateId,
          priority: index + 1,
        })
      );

      await apiRequest<{ message: string }>(
        `${API}/cast`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ rankings }),
        }
      );

      setSubmitted(true);
      setShowConfirmation(false);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "שליחת ההצבעה נכשלה. נסו שוב."
      );

      setShowConfirmation(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="voting-page" dir="rtl">
      <div className="voting-container">

        {/* כותרת העמוד */}
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
            {checkingStatus
              ? "בודק את מצב ההצבעה..."
              : electionClosed
              ? "הבחירות הסתיימו"
              : submitted
              ? "כבר הצבעתם בבחירות אלו"
              : "ההצבעה פתוחה"}
          </div>

          {submitted && voteDate && (
            <p>
              הצבעתכם נקלטה בתאריך{" "}
              {new Date(voteDate).toLocaleDateString(
                "he-IL"
              )}
            </p>
          )}

          {electionClosed && (
            <p className="voting-error">
              לא ניתן להצביע לאחר סגירת הבחירות.
            </p>
          )}
        </div>

        {/* אזור בחירת המועמדים */}
        <div className="voting-columns">

          {/* הדירוג האישי */}
          <div className="voting-panel">
            <div className="voting-panel-header">
              <h2>הדירוג שלי</h2>

              <span className="voting-count">
                {ranking.length} בדירוג
              </span>
            </div>

            {ranking.length === 0 ? (
              <div className="voting-empty">
                <div className="voting-empty-icon">
                  ☷
                </div>

                <h3>עדיין לא בחרתם מועמדים</h3>

                <p>
                  לחצו על מועמד ברשימה כדי להוסיף
                  אותו לדירוג שלכם.
                </p>
              </div>
            ) : (
              <div className="voting-ranked-list">
                {ranking.map((id, index) => {
                  const candidate =
                    validCandidates.find(
                      (item) =>
                        item.candidateId === id
                    );

                  if (!candidate) return null;

                  return (
                    <div
                      key={id}
                      className="voting-ranked-item"
                      draggable={!cannotEdit}
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
                          disabled={
                            index === 0 || cannotEdit
                          }
                          onClick={() =>
                            moveCandidate(
                              index,
                              index - 1
                            )
                          }
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          aria-label="הורד בדירוג"
                          disabled={
                            index ===
                              ranking.length - 1 ||
                            cannotEdit
                          }
                          onClick={() =>
                            moveCandidate(
                              index,
                              index + 1
                            )
                          }
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          className="voting-remove"
                          aria-label="הסר מועמד"
                          disabled={cannotEdit}
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

          {/* מועמדים זמינים */}
          <div className="voting-panel">
            <div className="voting-panel-header">
              <h2>מועמדים זמינים</h2>

              <span className="voting-count">
                {available.length} מועמדים
              </span>
            </div>

            <div className="voting-available-list">

              {loading && (
                <p>טוען מועמדים מהשרת...</p>
              )}

              {candidatesError && (
                <p
                  className="voting-error"
                  role="alert"
                >
                  שגיאה בטעינת המועמדים:{" "}
                  {candidatesError}
                </p>
              )}

              {!loading &&
                !candidatesError &&
                validCandidates.length === 0 && (
                  <p>
                    לא נמצאו מועמדים להצבעה.
                  </p>
                )}

              {!loading &&
                !candidatesError &&
                available.map((candidate) => (
                  <button
                    key={candidate.candidateId}
                    type="button"
                    className="voting-available-item"
                    disabled={cannotEdit}
                    onClick={() =>
                      addCandidate(
                        candidate.candidateId!
                      )
                    }
                  >
                    <span>{candidate.name}</span>

                    <span className="voting-plus">
                      +
                    </span>
                  </button>
                ))}

              {!loading &&
                !candidatesError &&
                validCandidates.length > 0 &&
                available.length === 0 && (
                  <p className="voting-all-selected">
                    כל המועמדים נוספו לדירוג שלכם.
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* סיכום ההצבעה */}
        <div className="voting-summary">
          <div>
            <h2>סיכום ההצבעה</h2>

            <p>
              בחרתם {ranking.length} מתוך{" "}
              {validCandidates.length} מועמדים
            </p>
          </div>

          <button
            type="button"
            className="voting-submit-button"
            disabled={
              ranking.length === 0 ||
              ranking.length > 5 ||
              checkingStatus ||
              statusFailed ||
              electionClosed ||
              !token ||
              loading ||
              Boolean(candidatesError) ||
              cannotEdit ||
              submitting
            }
            onClick={() =>
              setShowConfirmation(true)
            }
          >
            {submitted
              ? "ההצבעה נשלחה"
              : electionClosed
              ? "הבחירות הסתיימו"
              : "המשך לאישור ההצבעה ←"}
          </button>
        </div>

        {error && (
          <p
            className="voting-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {submitted && (
          <div
            className="voting-success"
            role="status"
          >
            ✓ ההצבעה התקבלה בהצלחה.
          </div>
        )}
      </div>

      {/* חלון אישור ההצבעה */}
      {showConfirmation &&
        !submitted &&
        !electionClosed && (
          <div className="voting-modal-overlay">
            <div
              className="voting-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="vote-confirm-title"
            >
              <div className="voting-modal-icon">
                ✓
              </div>

              <h2 id="vote-confirm-title">
                אישור ההצבעה
              </h2>

              <p>
                בדקו את סדר המועמדים לפני
                שליחת ההצבעה.
              </p>

              <ol>
                {ranking.map((id) => (
                  <li key={id}>
                    {validCandidates.find(
                      (candidate) =>
                        candidate.candidateId === id
                    )?.name}
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
