
import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCandidates } from "../store/candidates/candidatesThunks";
import { castVote, fetchVoteStatus } from "../store/voting/votingThunks";
import "./VotingPage.css";

const API = "https://localhost:7227/api/Voting";

interface VotingPageProps {
  onViewResults: () => void;
}

interface ElectionStatus {
  isClosed: boolean;
}

interface ExtendedVoteStatus {
  hasVoted: boolean;
  voteDate?: string | null;
}

export default function VotingPage({ onViewResults }: VotingPageProps) {
  const dispatch = useAppDispatch();

  const { token, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  const {
    items: candidates,
    loading,
    error: candidatesError,
  } = useAppSelector((state) => state.candidates);

  const {
    hasVoted,
    checkingStatus,
    statusChecked,
    submitting,
    error: votingError,
  } = useAppSelector((state) => state.voting);

  const [ranking, setRanking] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [electionClosed, setElectionClosed] = useState(false);
  const [electionStatusChecked, setElectionStatusChecked] = useState(false);
  const [electionStatusError, setElectionStatusError] = useState("");
  const [voteDate, setVoteDate] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchCandidates());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    void dispatch(fetchVoteStatus());
  }, [dispatch, isAuthenticated, token]);

  useEffect(() => {
    let active = true;

    setElectionStatusChecked(false);
    setElectionStatusError("");

    if (!isAuthenticated || !token) {
      setElectionStatusChecked(true);
      return;
    }

    async function checkElectionStatus() {
      try {
        const [electionResponse, voteResponse] =
          await Promise.all([
            fetch(`${API}/election-status`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(`${API}/status`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        if (!electionResponse.ok || !voteResponse.ok) {
          throw new Error(
            "לא ניתן לבדוק את מצב הבחירות מול השרת."
          );
        }

        const election =
          (await electionResponse.json()) as ElectionStatus;

        const vote =
          (await voteResponse.json()) as ExtendedVoteStatus;

        if (!active) return;

        setElectionClosed(election.isClosed);
        setVoteDate(vote.voteDate ?? null);
      } catch (err) {
        if (active) {
          setElectionStatusError(
            err instanceof Error
              ? err.message
              : "שגיאה בבדיקת מצב הבחירות."
          );
        }
      } finally {
        if (active) {
          setElectionStatusChecked(true);
        }
      }
    }

    void checkElectionStatus();

    return () => {
      active = false;
    };
  }, [isAuthenticated, token]);

  const canEdit =
    isAuthenticated &&
    Boolean(token) &&
    statusChecked &&
    !checkingStatus &&
    !hasVoted &&
    !submitted &&
    !submitting &&
    electionStatusChecked &&
    !electionStatusError &&
    !electionClosed;

  const validCandidates = candidates.filter(
    (candidate) =>
      typeof candidate.candidateId === "number"
  );

  const available = validCandidates.filter(
    (candidate) =>
      !ranking.includes(candidate.candidateId!)
  );

  const addCandidate = (id: number) => {
    if (!canEdit) return;

    setRanking((previous) =>
      previous.includes(id) || previous.length >= 5
        ? previous
        : [...previous, id]
    );
  };

  const removeCandidate = (id: number) => {
    if (!canEdit) return;

    setRanking((previous) =>
      previous.filter((item) => item !== id)
    );
  };

  const moveCandidate = (from: number, to: number) => {
    if (
      !canEdit ||
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

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    if (!canEdit) {
      event.preventDefault();
      return;
    }

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
    if (
      !canEdit ||
      ranking.length < 1 ||
      ranking.length > 5
    ) {
      setError(
        "לא ניתן לשלוח הצבעה כרגע. יש לבחור בין מועמד אחד לחמישה."
      );
      setShowConfirmation(false);
      return;
    }

    setError("");

    try {
      await dispatch(castVote(ranking)).unwrap();

      setSubmitted(true);
      setShowConfirmation(false);

      void dispatch(fetchVoteStatus());
    } catch (err) {
      setShowConfirmation(false);

      setError(
        typeof err === "string"
          ? err
          : "לא ניתן לאשר את ההצבעה."
      );

      // בדיקה חוזרת למקרה שהשרת שמר את ההצבעה
      // אך התקשורת נקטעה.
      void dispatch(fetchVoteStatus());
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
            {!statusChecked ||
            checkingStatus ||
            !electionStatusChecked
              ? "בודק את מצב ההצבעה..."
              : electionStatusError || !statusChecked
              ? "לא ניתן לאמת את מצב ההצבעה"
              : electionClosed
              ? "הבחירות הסתיימו"
              : hasVoted || submitted
              ? "כבר הצבעתם בבחירות אלו"
              : "ההצבעה פתוחה"}
          </div>

          {voteDate && (hasVoted || submitted) && (
            <p>
              הצבעתכם נקלטה בתאריך{" "}
              {new Date(voteDate).toLocaleDateString("he-IL")}
            </p>
          )}

          <div
            style={{
              textAlign: "center",
              marginTop: "24px",
            }}
          >
            <button
              type="button"
              onClick={onViewResults}
              style={{
                padding: "14px 30px",
                borderRadius: "14px",
                border: "none",
                background:
                  "linear-gradient(135deg, #7c3aed, #2563eb)",
                color: "white",
                fontSize: "17px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow:
                  "0 6px 18px rgba(124, 58, 237, 0.25)",
              }}
            >
              צפייה בתוצאות הבחירות
            </button>
          </div>
        </div>

        {!isAuthenticated && (
          <p className="voting-error" role="alert">
            יש להתחבר לאתר לפני ההצבעה.
          </p>
        )}

        {isAuthenticated && checkingStatus && (
          <p className="posts-status">
            בודק אם כבר הצבעת...
          </p>
        )}

        {isAuthenticated &&
          !checkingStatus &&
          !statusChecked && (
            <p className="voting-error" role="alert">
              לא ניתן לאמת את סטטוס ההצבעה.{" "}
              {votingError ?? ""}
            </p>
          )}

        {electionStatusError && (
          <p className="voting-error" role="alert">
            {electionStatusError}
          </p>
        )}

        {electionClosed && (
          <p className="voting-error">
            לא ניתן להצביע לאחר סגירת הבחירות.
          </p>
        )}

        {(hasVoted || submitted) && (
          <div className="voting-success" role="status">
            ✓ ההצבעה שלך כבר נקלטה במערכת.
          </div>
        )}

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
                      draggable={canEdit}
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
                            index === 0 || !canEdit
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
                            !canEdit
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
                          disabled={!canEdit}
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
                    disabled={
                      !canEdit ||
                      ranking.length >= 5
                    }
                    onClick={() =>
                      addCandidate(
                        candidate.candidateId!
                      )
                    }
                  >
                    <span>
                      {candidate.name}
                    </span>

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

              {ranking.length === 5 &&
                available.length > 0 && (
                  <p className="voting-all-selected">
                    הגעתם למקסימום של חמישה מועמדים.
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
              {validCandidates.length} מועמדים
            </p>
          </div>

          <button
            type="button"
            className="voting-submit-button"
            disabled={
              !canEdit ||
              ranking.length === 0 ||
              ranking.length > 5 ||
              loading ||
              Boolean(candidatesError)
            }
            onClick={() =>
              setShowConfirmation(true)
            }
          >
            {hasVoted || submitted
              ? "ההצבעה נשלחה"
              : electionClosed
              ? "הבחירות הסתיימו"
              : "המשך לאישור ההצבעה ←"}
          </button>
        </div>

        {error && (
          <p className="voting-error" role="alert">
            {error}
          </p>
        )}

        {votingError && !error && (
          <p className="voting-error" role="alert">
            {votingError}
          </p>
        )}
      </div>

      {showConfirmation && canEdit && (
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
