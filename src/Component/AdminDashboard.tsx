
import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import "./AdminDashboard.css";

const API = "https://localhost:7227/api";

type User = {
  userId: number;
  name: string;
  email: string;
  phone?: string | null;
  passwordSetupLinkSentAt?: string | null;
};

type ElectionStatus = {
  isClosed: boolean;
};

type CandidateResult = {
  candidateId: number;
  name: string;
  position: number;
  totalVotes: number;
};

type ElectionResults = {
  totalVoters: number;
  results: CandidateResult[];
};

type VoteStatus = {
  hasVoted: boolean;
  voteDate: string | null;
};

type Props = {
  onNavigateToVoting: () => void;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function getLinkStatus(sentAt?: string | null) {
  if (!sentAt) {
    return {
      expired: false,
      label: "טרם נשלח קישור",
    };
  }

  const time = new Date(sentAt).getTime();

  if (!Number.isFinite(time)) {
    return {
      expired: false,
      label: "תאריך לא תקין",
    };
  }

  const expired = Date.now() - time >= DAY_MS;

  return {
    expired,
    label: expired ? "תוקף הקישור פג" : "קישור בתוקף",
  };
}

export default function AdminDashboard({
  onNavigateToVoting,
}: Props) {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const role = useAppSelector(
    (state) => state.auth.role
  );

  const [pendingUsers, setPendingUsers] =
    useState<User[]>([]);

  const [waitingUsers, setWaitingUsers] =
    useState<User[]>([]);

  const [pendingLoading, setPendingLoading] =
    useState(true);

  const [waitingLoading, setWaitingLoading] =
    useState(true);

  const [activeAction, setActiveAction] =
    useState<string | null>(null);

  const [pendingError, setPendingError] =
    useState("");

  const [waitingError, setWaitingError] =
    useState("");

  const [userMessage, setUserMessage] =
    useState("");

  const [closed, setClosed] =
    useState<boolean | null>(null);

  const [results, setResults] =
    useState<ElectionResults | null>(null);

  const [voteStatus, setVoteStatus] =
    useState<VoteStatus | null>(null);

  const [electionLoading, setElectionLoading] =
    useState(true);

  const [closing, setClosing] =
    useState(false);

  const [electionError, setElectionError] =
    useState("");

  const [electionMessage, setElectionMessage] =
    useState("");

  // =========================================
  // בקשות API
  // =========================================

  const request = useCallback(
    async <T,>(
      path: string,
      options: RequestInit = {}
    ): Promise<T> => {
      const response = await fetch(
        `${API}${path}`,
        {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            ...(options.headers ?? {}),
          },
        }
      );

      if (!response.ok) {
        let message =
          `שגיאת שרת (${response.status})`;

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          message =
            "אין הרשאה. יש להתחבר כמנהל.";
        } else {
          const data = await response
            .json()
            .catch(() => null);

          if (data?.message) {
            message = data.message;
          }
        }

        throw new Error(message);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const text = await response.text();

      return (
        text ? JSON.parse(text) : undefined
      ) as T;
    },
    [token]
  );

  // =========================================
  // טעינת משתמשים
  // =========================================

  const loadPendingUsers = useCallback(
    async () => {
      setPendingLoading(true);
      setPendingError("");

      try {
        const users = await request<User[]>(
          "/Users/pending"
        );

        if (!Array.isArray(users)) {
          throw new Error(
            "השרת לא החזיר רשימת משתמשים"
          );
        }

        setPendingUsers(users);
      } catch (error) {
        setPendingError(
          error instanceof Error
            ? error.message
            : "טעינת הבקשות נכשלה"
        );
      } finally {
        setPendingLoading(false);
      }
    },
    [request]
  );

  const loadWaitingUsers = useCallback(
    async () => {
      setWaitingLoading(true);
      setWaitingError("");

      try {
        const users = await request<User[]>(
          "/Users/waiting-for-password"
        );

        if (!Array.isArray(users)) {
          throw new Error(
            "השרת לא החזיר רשימה תקינה"
          );
        }

        setWaitingUsers(users);
      } catch (error) {
        setWaitingError(
          error instanceof Error
            ? error.message
            : "טעינת המשתמשים נכשלה"
        );
      } finally {
        setWaitingLoading(false);
      }
    },
    [request]
  );

  // =========================================
  // אישור משתמש
  // =========================================

  const approveUser = async (userId: number) => {
    if (activeAction) return;

    setActiveAction(`approve-${userId}`);
    setUserMessage("");
    setPendingError("");

    try {
      await request(
        `/Users/${userId}/approve`,
        { method: "PUT" }
      );

      setUserMessage(
        "המשתמש אושר והבקשה טופלה בהצלחה."
      );

      await Promise.all([
        loadPendingUsers(),
        loadWaitingUsers(),
      ]);
    } catch (error) {
      setPendingError(
        error instanceof Error
          ? error.message
          : "אישור המשתמש נכשל"
      );
    } finally {
      setActiveAction(null);
    }
  };

  // =========================================
  // שליחת קישור מחדש
  // =========================================

  const resendPasswordLink = async (
    userId: number
  ) => {
    if (activeAction) return;

    setActiveAction(`resend-${userId}`);
    setUserMessage("");
    setWaitingError("");

    try {
      await request(
        `/Users/${userId}/resend-password-link`,
        { method: "POST" }
      );

      setUserMessage(
        "קישור חדש להגדרת סיסמה נשלח בהצלחה."
      );

      await loadWaitingUsers();
    } catch (error) {
      setWaitingError(
        error instanceof Error
          ? error.message
          : "שליחת הקישור נכשלה"
      );
    } finally {
      setActiveAction(null);
    }
  };

  // =========================================
  // מחיקת בקשת הרשמה
  // =========================================

  const deleteRegistration = async (
    userId: number
  ) => {
    if (activeAction) return;

    const confirmed = window.confirm(
      "האם למחוק את בקשת ההרשמה? פעולה זו אינה ניתנת לביטול."
    );

    if (!confirmed) return;

    setActiveAction(`delete-${userId}`);
    setUserMessage("");
    setWaitingError("");

    try {
      await request(
        `/Users/${userId}/registration-request`,
        { method: "DELETE" }
      );

      setUserMessage(
        "בקשת ההרשמה נמחקה בהצלחה."
      );

      await loadWaitingUsers();
    } catch (error) {
      setWaitingError(
        error instanceof Error
          ? error.message
          : "מחיקת הבקשה נכשלה"
      );
    } finally {
      setActiveAction(null);
    }
  };

  // =========================================
  // נתוני בחירות
  // =========================================

  const refreshElection = useCallback(
    async () => {
      setElectionLoading(true);
      setElectionError("");

      try {
        const status =
          await request<ElectionStatus>(
            "/Voting/election-status"
          );

        setClosed(status.isClosed);

        const [myVote, electionResults] =
          await Promise.all([
            request<VoteStatus>(
              "/Voting/status"
            ),
            status.isClosed
              ? request<ElectionResults>(
                  "/Voting/results"
                )
              : Promise.resolve(null),
          ]);

        setVoteStatus(myVote);
        setResults(electionResults);
      } catch (error) {
        setElectionError(
          error instanceof Error
            ? error.message
            : "טעינת הבחירות נכשלה"
        );
      } finally {
        setElectionLoading(false);
      }
    },
    [request]
  );

  const closeElection = async () => {
    if (closed !== false || closing) return;

    const confirmed = window.confirm(
      "האם לסגור את הבחירות ולפרסם תוצאות סופיות?"
    );

    if (!confirmed) return;

    setClosing(true);
    setElectionError("");
    setElectionMessage("");

    try {
      const data =
        await request<ElectionResults>(
          "/Voting/close",
          { method: "POST" }
        );

      setClosed(true);
      setResults(data);

      setElectionMessage(
        "הבחירות נסגרו והתוצאות פורסמו."
      );
    } catch (error) {
      setElectionError(
        error instanceof Error
          ? error.message
          : "סגירת הבחירות נכשלה"
      );

      await refreshElection();
    } finally {
      setClosing(false);
    }
  };

  // =========================================
  // טעינה ראשונית
  // =========================================

  useEffect(() => {
    if (role !== "Admin" || !token) return;

    void refreshElection();
    void loadPendingUsers();
    void loadWaitingUsers();
  }, [
    role,
    token,
    refreshElection,
    loadPendingUsers,
    loadWaitingUsers,
  ]);

  const refreshAll = () => {
    void refreshElection();
    void loadPendingUsers();
    void loadWaitingUsers();
  };

  // =========================================
  // הרשאות
  // =========================================

  if (role !== "Admin") {
    return (
      <main className="admin-dashboard">
        <p>
          הגישה ללוח הניהול מיועדת
          למנהלי מערכת בלבד.
        </p>
      </main>
    );
  }

  return (
    <section
      className="admin-dashboard"
      dir="rtl"
    >
      <div className="admin-shell">

        {/* כותרת */}
        <div className="admin-eyebrow">
          תנופה / אזור ניהול
        </div>

        <div className="admin-top">
          <div>
            <h1>לוח הבקרה</h1>
            <p>
              ניהול בחירות, משתמשים,
              בקשות הצטרפות ותוצאות.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh"
            onClick={refreshAll}
            disabled={
              electionLoading ||
              pendingLoading ||
              waitingLoading ||
              Boolean(activeAction)
            }
          >
            רענון נתונים
          </button>
        </div>

        {/* הודעות */}
        {userMessage && (
          <div
            className="admin-alert success"
            role="status"
          >
            {userMessage}
          </div>
        )}

        {electionError && (
          <div
            className="admin-alert error"
            role="alert"
          >
            {electionError}
          </div>
        )}

        {electionMessage && (
          <div
            className="admin-alert success"
            role="status"
          >
            {electionMessage}
          </div>
        )}

        {/* סטטיסטיקות */}
        <div className="admin-stats">
          <article className="admin-stat">
            <span>מצב הבחירות</span>
            <strong>
              {electionLoading
                ? "טוען..."
                : closed === null
                ? "לא ידוע"
                : closed
                ? "הסתיימו"
                : "פתוחות"}
            </strong>
            <small>סטטוס עדכני</small>
          </article>

          <article className="admin-stat">
            <span>מצביעים</span>
            <strong>
              {results
                ? results.totalVoters.toLocaleString(
                    "he-IL"
                  )
                : "—"}
            </strong>
            <small>
              {closed
                ? "מספר מצביעים סופי"
                : "זמין לאחר סגירת הבחירות"}
            </small>
          </article>

          <article className="admin-stat">
            <span>ההצבעה שלי</span>
            <strong>
              {voteStatus === null
                ? "—"
                : voteStatus.hasVoted
                ? "כבר הצבעתי"
                : "טרם הצבעתי"}
            </strong>
            <small>
              גם מנהל יכול להצביע פעם אחת
            </small>
          </article>
        </div>

        {/* ניהול בחירות */}
        <div className="admin-columns">
          <article className="admin-panel">
            <div className="admin-panel-number">
              01 / ניהול בחירות
            </div>

            <h2>שליטה בהצבעה</h2>
            <p>
              סגירת הבחירות ופרסום
              התוצאות הסופיות.
            </p>

            <div className="admin-actions">
              <button
                type="button"
                className="admin-primary"
                onClick={() =>
                  void closeElection()
                }
                disabled={
                  electionLoading ||
                  closing ||
                  closed !== false
                }
              >
                {closing
                  ? "סוגר בחירות..."
                  : closed
                  ? "הבחירות הסתיימו"
                  : "סגירת הבחירות ופרסום תוצאות"}
              </button>

              <button
                type="button"
                className="admin-secondary"
                disabled
                title="הפעולה עדיין אינה קיימת בשרת"
              >
                פתיחת בחירות חדשות — בקרוב
              </button>
            </div>
          </article>

          <article
            className="admin-panel admin-vote-panel"
          >
            <div className="admin-panel-number">
              02 / הצבעה אישית
            </div>

            <h2>גם למנהל יש קול</h2>
            <p>
              מעבר לעמוד ההצבעה
              והשתתפות בבחירות.
            </p>

            <button
              type="button"
              className="admin-outline"
              onClick={onNavigateToVoting}
            >
              מעבר לעמוד ההצבעה
            </button>
          </article>
        </div>

        {/* בקשות ממתינות לאישור */}
        <article
          className="admin-panel admin-pending-panel"
        >
          <div className="admin-pending-head">
            <div>
              <div className="admin-panel-number">
                03 / ניהול משתמשים
              </div>

              <h2>
                בקשות הצטרפות ממתינות
              </h2>

              <p>
                משתמשים שנרשמו
                וממתינים לאישור מנהל.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={() =>
                void loadPendingUsers()
              }
              disabled={
                pendingLoading ||
                Boolean(activeAction)
              }
            >
              רענון בקשות
            </button>
          </div>

          {pendingError && (
            <div
              className="admin-alert error"
              role="alert"
            >
              {pendingError}
            </div>
          )}

          {pendingLoading ? (
            <div className="admin-pending-empty">
              טוען בקשות...
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="admin-pending-empty">
              אין בקשות שממתינות לאישור.
            </div>
          ) : (
            <div className="admin-pending-table-wrap">
              <table className="admin-pending-table">
                <thead>
                  <tr>
                    <th>שם מלא</th>
                    <th>כתובת מייל</th>
                    <th>טלפון</th>
                    <th>סטטוס</th>
                    <th>פעולה</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.userId}>
                      <td className="admin-pending-name">
                        {user.name}
                      </td>

                      <td>{user.email}</td>
                      <td>{user.phone || "—"}</td>

                      <td>
                        <span className="admin-pending-status">
                          ממתין לאישור
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-primary admin-pending-approve"
                          disabled={Boolean(activeAction)}
                          onClick={() =>
                            void approveUser(user.userId)
                          }
                        >
                          {activeAction ===
                          `approve-${user.userId}`
                            ? "מאשר..."
                            : "אשר משתמש"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-pending-count">
            בקשות ממתינות: {pendingUsers.length}
          </div>
        </article>

        {/* ממתינים להגדרת סיסמה */}
        <article
          className="admin-panel admin-pending-panel"
        >
          <div className="admin-pending-head">
            <div>
              <div className="admin-panel-number">
                04 / השלמת הרשמה
              </div>

              <h2>
                ממתינים להגדרת סיסמה
              </h2>

              <p>
                משתמשים שאושרו אך עדיין
                לא השלימו את פתיחת החשבון.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={() =>
                void loadWaitingUsers()
              }
              disabled={
                waitingLoading ||
                Boolean(activeAction)
              }
            >
              רענון רשימה
            </button>
          </div>

          {waitingError && (
            <div
              className="admin-alert error"
              role="alert"
            >
              {waitingError}
            </div>
          )}

          {waitingLoading ? (
            <div className="admin-pending-empty">
              טוען משתמשים...
            </div>
          ) : waitingUsers.length === 0 ? (
            <div className="admin-pending-empty">
              אין משתמשים שממתינים
              להגדרת סיסמה.
            </div>
          ) : (
            <div className="admin-pending-table-wrap">
              <table className="admin-pending-table">
                <thead>
                  <tr>
                    <th>שם מלא</th>
                    <th>מייל</th>
                    <th>נשלח בתאריך</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>

                <tbody>
                  {waitingUsers.map((user) => {
                    const status = getLinkStatus(
                      user.passwordSetupLinkSentAt
                    );

                    const canResend =
                      Boolean(
                        user.passwordSetupLinkSentAt
                      ) && status.expired;

                    return (
                      <tr key={user.userId}>
                        <td className="admin-pending-name">
                          {user.name}
                        </td>

                        <td>{user.email}</td>

                        <td>
                          {user.passwordSetupLinkSentAt
                            ? new Date(
                                user.passwordSetupLinkSentAt
                              ).toLocaleString("he-IL")
                            : "—"}
                        </td>

                        <td>
                          <span className="admin-pending-status">
                            {status.label}
                          </span>
                        </td>

                        <td>
                          <div
                            className="admin-actions"
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <button
                              type="button"
                              className="admin-primary"
                              disabled={
                                Boolean(activeAction) ||
                                !canResend
                              }
                              onClick={() =>
                                void resendPasswordLink(
                                  user.userId
                                )
                              }
                            >
                              {activeAction ===
                              `resend-${user.userId}`
                                ? "שולח..."
                                : "שליחה חוזרת"}
                            </button>

                            <button
                              type="button"
                              className="admin-outline"
                              disabled={Boolean(activeAction)}
                              onClick={() =>
                                void deleteRegistration(
                                  user.userId
                                )
                              }
                            >
                              {activeAction ===
                              `delete-${user.userId}`
                                ? "מוחק..."
                                : "מחיקת בקשה"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-pending-count">
            ממתינים להגדרת סיסמה:{" "}
            {waitingUsers.length}
          </div>
        </article>

        {/* תוצאות הבחירות */}
        <article
          id="election-results"
          className="admin-panel admin-results"
        >
          <div className="admin-panel-number">
            05 / תוצאות הבחירות
          </div>

          <h2>התוצאות הסופיות</h2>

          {closed === null ? (
            <p>טוען מצב בחירות...</p>
          ) : !closed ? (
            <p>
              הבחירות עדיין פתוחות.
              התוצאות יוצגו לאחר סגירתן.
            </p>
          ) : results === null ? (
            <p>
              {electionLoading
                ? "טוען תוצאות..."
                : "לא ניתן להציג תוצאות כרגע."}
            </p>
          ) : (
            <>
              <div className="admin-results-summary">
                <div>
                  <span>סה״כ מצביעים</span>
                  <strong>
                    {results.totalVoters.toLocaleString(
                      "he-IL"
                    )}
                  </strong>
                </div>

                <div>
                  <span>מספר מועמדים</span>
                  <strong>
                    {results.results.length}
                  </strong>
                </div>
              </div>

              {results.results.length === 0 ? (
                <p>אין תוצאות להצגה.</p>
              ) : (
                <div className="admin-results-list">
                  {results.results.map((item) => (
                    <div
                      className="admin-result"
                      key={item.candidateId}
                    >
                      <span className="admin-rank">
                        {String(
                          item.position
                        ).padStart(2, "0")}
                      </span>

                      <strong>{item.name}</strong>

                      <span>
                        {item.totalVotes.toLocaleString(
                          "he-IL"
                        )}{" "}
                        דירוגים
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </article>
      </div>
    </section>
  );
}
