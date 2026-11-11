
import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import "./AdminDashboard.css";

type ElectionStatus = { isClosed: boolean };

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

type PendingUser = {
  userId: number;
  name: string;
  email: string;
  phone?: string | null;
};

type Props = {
  onNavigateToVoting: () => void;
};

const API = "https://localhost:7227/api/Voting";
const USERS_API = "https://localhost:7227/api/Users";

export default function AdminDashboard({
  onNavigateToVoting,
}: Props) {
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.role);

  const [closed, setClosed] = useState<boolean | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [pendingError, setPendingError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");

  const request = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const response = await fetch(`${API}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init?.headers ?? {}),
        },
      });

      if (!response.ok) {
        let detail = `שגיאת שרת (${response.status})`;

        try {
          const data = await response.json();
          detail = data.message || detail;
        } catch {
          // תשובה ללא JSON
        }

        throw new Error(detail);
      }

      return response.json() as Promise<T>;
    },
    [token]
  );

  const usersRequest = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const response = await fetch(`${USERS_API}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init?.headers ?? {}),
        },
      });

      if (!response.ok) {
        let detail = `שגיאת שרת (${response.status})`;

        if (response.status === 401 || response.status === 403) {
          detail = "אין הרשאה לפעולה. יש להתחבר כמנהל.";
        } else {
          try {
            const data = await response.json();
            detail = data.message || detail;
          } catch {
            // תשובה ללא JSON
          }
        }

        throw new Error(detail);
      }

      return response.json() as Promise<T>;
    },
    [token]
  );

  const loadPendingUsers = useCallback(async () => {
    setPendingLoading(true);
    setPendingError("");

    try {
      const users = await usersRequest<PendingUser[]>("/pending");

      if (!Array.isArray(users)) {
        throw new Error("השרת החזיר רשימה לא תקינה");
      }

      setPendingUsers(users);
    } catch (e) {
      setPendingError(
        e instanceof Error ? e.message : "לא ניתן לטעון בקשות"
      );
    } finally {
      setPendingLoading(false);
    }
  }, [usersRequest]);

  const approvePendingUser = async (userId: number) => {
    setApprovingId(userId);
    setPendingError("");
    setPendingMessage("");

    try {
      await usersRequest<{ message: string }>(
        `/${userId}/approve`,
        { method: "PUT" }
      );

      setPendingUsers((current) =>
        current.filter((u) => u.userId !== userId)
      );

      setPendingMessage("המשתמש אושר בהצלחה.");
    } catch (e) {
      setPendingError(
        e instanceof Error ? e.message : "אישור המשתמש נכשל"
      );
    } finally {
      setApprovingId(null);
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const status = await request<ElectionStatus>(
        "/election-status"
      );

      setClosed(status.isClosed);

      const [myVote, electionResults] = await Promise.all([
        request<VoteStatus>("/status"),
        status.isClosed
          ? request<ElectionResults>("/results")
          : Promise.resolve(null),
      ]);

      setVoteStatus(myVote);
      setResults(electionResults);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "לא ניתן לטעון את הנתונים"
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (role === "Admin" && token) {
      void refresh();
      void loadPendingUsers();
    }
  }, [role, token, refresh, loadPendingUsers]);

  const closeElection = async () => {
    if (
      !window.confirm(
        "לסגור את הבחירות ולפרסם את התוצאות? לא ניתן לפתוח אותן מחדש באמצעות הממשק הקיים."
      )
    ) {
      return;
    }

    setClosing(true);
    setError("");
    setMessage("");

    try {
      await request<ElectionResults>("/close", {
        method: "POST",
      });

      setMessage("הבחירות נסגרו והתוצאות פורסמו.");
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "סגירת הבחירות נכשלה"
      );
    } finally {
      setClosing(false);
    }
  };

  if (role !== "Admin") {
    return (
      <main className="admin-dashboard">
        <p>הגישה ללוח הניהול מיועדת למנהלי מערכת בלבד.</p>
      </main>
    );
  }

  return (
    <section className="admin-dashboard" dir="rtl">
      <div className="admin-shell">
        <div className="admin-eyebrow">
          תנופה / אזור ניהול
        </div>

        <div className="admin-top">
          <div>
            <h1>לוח הבקרה</h1>
            <p>
              ניהול ההצבעה, מעקב אחר הסטטוס,
              בקשות הצטרפות וצפייה בתוצאות.
            </p>
          </div>

          <button
            className="admin-refresh"
            type="button"
            onClick={() => {
              void refresh();
              void loadPendingUsers();
            }}
            disabled={loading || closing || pendingLoading}
          >
            רענון נתונים
          </button>
        </div>

        {error && (
          <div className="admin-alert error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="admin-alert success" role="status">
            {message}
          </div>
        )}

        <div className="admin-stats">
          <article className="admin-stat">
            <span>מצב הבחירות</span>
            <strong>
              {loading
                ? "טוען..."
                : closed === null
                ? "לא ידוע"
                : closed
                ? "הסתיימו"
                : "פתוחות"}
            </strong>
            <small>לפי נתוני השרת</small>
          </article>

          <article className="admin-stat">
            <span>מצביעים</span>
            <strong>
              {results
                ? results.totalVoters.toLocaleString("he-IL")
                : "—"}
            </strong>
            <small>
              {closed
                ? "מספר מצביעים סופי"
                : "זמין לאחר סגירת הבחירות"}
            </small>
          </article>

          <article className="admin-stat">
            <span>ההצבעה האישית שלי</span>
            <strong>
              {voteStatus === null
                ? "—"
                : voteStatus.hasVoted
                ? "כבר הצבעתי"
                : "טרם הצבעתי"}
            </strong>
            <small>
              גם למנהל מותר להצביע פעם אחת
            </small>
          </article>
        </div>

        <div className="admin-columns">
          <article className="admin-panel">
            <div className="admin-panel-number">
              01 / ניהול בחירות
            </div>

            <h2>שליטה בהצבעה</h2>

            <p>
              ניתן לסגור את הבחירות ולפרסם את
              התוצאות. פתיחת בחירות חדשות תתווסף
              לאחר התאמת מנגנון השמירה בשרת.
            </p>

            <div className="admin-actions">
              <button
                type="button"
                className="admin-primary"
                onClick={() => void closeElection()}
                disabled={loading || closing || closed !== false}
              >
                {closing
                  ? "סוגר בחירות..."
                  : "סגירת הבחירות ופרסום תוצאות"}
              </button>

              <button
                type="button"
                className="admin-secondary"
                disabled
                title="הפעולה עדיין לא קיימת בשרת"
              >
                פתיחת בחירות חדשות — בקרוב
              </button>
            </div>
          </article>

          <article className="admin-panel admin-vote-panel">
            <div className="admin-panel-number">
              02 / הצבעה אישית
            </div>

            <h2>גם למנהל יש קול</h2>

            <p>
              ההצבעה מתבצעת דרך אותו מסך
              ואותן בדיקות שרת של כל חברי המפלגה.
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

        <article className="admin-panel admin-pending-panel">
          <div className="admin-pending-head">
            <div>
              <div className="admin-panel-number">
                03 / ניהול משתמשים
              </div>

              <h2>בקשות הצטרפות ממתינות</h2>

              <p>
                משתמשים חדשים שממתינים לאישור מנהל
                לפני התחברות למערכת.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={() => void loadPendingUsers()}
              disabled={pendingLoading || approvingId !== null}
            >
              רענון בקשות
            </button>
          </div>

          {pendingError && (
            <div className="admin-alert error" role="alert">
              {pendingError}
            </div>
          )}

          {pendingMessage && (
            <div className="admin-alert success" role="status">
              {pendingMessage}
            </div>
          )}

          {pendingLoading ? (
            <div className="admin-pending-empty">
              טוען בקשות מהשרת...
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="admin-pending-empty">
              אין כרגע בקשות שממתינות לאישור.
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
                          onClick={() =>
                            void approvePendingUser(user.userId)
                          }
                          disabled={approvingId !== null}
                        >
                          {approvingId === user.userId
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

        <article className="admin-panel admin-results">
          <div className="admin-panel-number">
            04 / תוצאות הבחירות
          </div>

          <h2>התוצאות הסופיות</h2>

          {!closed ? (
            <p>
              התוצאות יוצגו כאן לאחר סגירת הבחירות.
            </p>
          ) : results?.results?.length ? (
            <div className="admin-results-list">
              {results.results.map((item) => (
                <div
                  className="admin-result"
                  key={item.candidateId}
                >
                  <span className="admin-rank">
                    {item.position.toString().padStart(2, "0")}
                  </span>

                  <strong>{item.name}</strong>

                  <span>{item.totalVotes} דירוגים</span>
                </div>
              ))}
            </div>
          ) : (
            <p>
              {loading
                ? "טוען תוצאות..."
                : "לא נמצאו תוצאות להצגה."}
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
