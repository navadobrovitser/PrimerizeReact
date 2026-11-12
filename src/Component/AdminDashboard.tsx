
import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import "./AdminDashboard.css";

const API = "https://localhost:7227/api";
const DAY_MS = 24 * 60 * 60 * 1000;

type User = {
  userId: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: string | number | null;
  isDeleted?: boolean;
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
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.role);
  console.log("Current user role:", role);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [waitingUsers, setWaitingUsers] = useState<User[]>([]);

  const [usersLoading, setUsersLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [waitingLoading, setWaitingLoading] = useState(true);

  const [usersError, setUsersError] = useState("");
  const [pendingError, setPendingError] = useState("");
  const [waitingError, setWaitingError] = useState("");

  const [activeAction, setActiveAction] = useState<string | null>(
    null
  );

  const [userMessage, setUserMessage] = useState("");

  const [closed, setClosed] = useState<boolean | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(
    null
  );
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(
    null
  );

  const [electionLoading, setElectionLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [electionError, setElectionError] = useState("");
  const [electionMessage, setElectionMessage] = useState("");

  const [searchText, setSearchText] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  // ==========================================
  // בקשות לשרת
  // ==========================================

  const request = useCallback(
    async <T,>(
      path: string,
      options: RequestInit = {}
    ): Promise<T> => {
      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.headers ?? {}),
        },
      });

      if (!response.ok) {
        let message = `שגיאת שרת (${response.status})`;

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          message = "אין הרשאה. יש להתחבר כמנהל.";
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

      return (text ? JSON.parse(text) : undefined) as T;
    },
    [token]
  );

  // ==========================================
  // טעינת כל המשתמשים
  // ==========================================

  const loadAllUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");

    try {
      const users = await request<User[]>("/Users");

      if (!Array.isArray(users)) {
        throw new Error("השרת לא החזיר רשימת משתמשים תקינה.");
      }

      setAllUsers(users);
    } catch (error) {
      setUsersError(
        error instanceof Error
          ? error.message
          : "טעינת המשתמשים נכשלה."
      );
    } finally {
      setUsersLoading(false);
    }
  }, [request]);

  // ==========================================
  // בקשות ממתינות
  // ==========================================

  const loadPendingUsers = useCallback(async () => {
    setPendingLoading(true);
    setPendingError("");

    try {
      const users = await request<User[]>("/Users/pending");

      if (!Array.isArray(users)) {
        throw new Error("השרת לא החזיר רשימה תקינה.");
      }

      setPendingUsers(users);
    } catch (error) {
      setPendingError(
        error instanceof Error
          ? error.message
          : "טעינת הבקשות נכשלה."
      );
    } finally {
      setPendingLoading(false);
    }
  }, [request]);

  // ==========================================
  // ממתינים להגדרת סיסמה
  // ==========================================

  const loadWaitingUsers = useCallback(async () => {
    setWaitingLoading(true);
    setWaitingError("");

    try {
      const users = await request<User[]>(
        "/Users/waiting-for-password"
      );

      if (!Array.isArray(users)) {
        throw new Error("השרת לא החזיר רשימה תקינה.");
      }

      setWaitingUsers(users);
    } catch (error) {
      setWaitingError(
        error instanceof Error
          ? error.message
          : "טעינת המשתמשים נכשלה."
      );
    } finally {
      setWaitingLoading(false);
    }
  }, [request]);

  // ==========================================
  // אישור משתמש
  // ==========================================

  const approveUser = async (userId: number) => {
    if (activeAction) return;

    setActiveAction(`approve-${userId}`);
    setUserMessage("");
    setPendingError("");

    try {
      await request(`/Users/${userId}/approve`, {
        method: "PUT",
      });

      setUserMessage("המשתמש אושר בהצלחה.");

      await Promise.all([
        loadAllUsers(),
        loadPendingUsers(),
        loadWaitingUsers(),
      ]);
    } catch (error) {
      setPendingError(
        error instanceof Error
          ? error.message
          : "אישור המשתמש נכשל."
      );
    } finally {
      setActiveAction(null);
    }
  };

  // ==========================================
  // שליחת קישור מחדש
  // ==========================================

  const resendPasswordLink = async (userId: number) => {
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
          : "שליחת הקישור נכשלה."
      );
    } finally {
      setActiveAction(null);
    }
  };

  // ==========================================
  // מחיקת בקשת הרשמה
  // ==========================================

  const deleteRegistration = async (userId: number) => {
    if (activeAction) return;

    const confirmed = window.confirm(
      "האם למחוק את בקשת ההרשמה? פעולה זו אינה ניתנת לביטול."
    );

    if (!confirmed) return;

    setActiveAction(`delete-request-${userId}`);
    setUserMessage("");
    setWaitingError("");

    try {
      await request(
        `/Users/${userId}/registration-request`,
        { method: "DELETE" }
      );

      setUserMessage("בקשת ההרשמה נמחקה בהצלחה.");

      await Promise.all([
        loadAllUsers(),
        loadPendingUsers(),
        loadWaitingUsers(),
      ]);
    } catch (error) {
      setWaitingError(
        error instanceof Error
          ? error.message
          : "מחיקת הבקשה נכשלה."
      );
    } finally {
      setActiveAction(null);
    }
  };

  // ==========================================
  // מחיקה לוגית של משתמש
  // ==========================================

  const softDeleteUser = async (user: User) => {
    if (activeAction) return;

    if (user.role === "Admin" || user.role === 1) {
      setUsersError("לא ניתן להסיר חשבון מנהל.");
      return;
    }

    const confirmed = window.confirm(
      `האם את בטוחה שברצונך להסיר את המשתמש "${user.name}"?\n\n` +
      "המשתמש לא יוכל להתחבר למערכת.\n" +
      "הנתונים שלו יישמרו במסד הנתונים וניתן יהיה לשחזר אותו."
    );

    if (!confirmed) return;

    setActiveAction(`remove-${user.userId}`);
    setUsersError("");
    setUserMessage("");

    try {
      await request(
        `/Users/${user.userId}/soft-delete`,
        { method: "DELETE" }
      );

      setUserMessage(
        `המשתמש "${user.name}" הוסר בהצלחה.`
      );

      await Promise.all([
        loadAllUsers(),
        loadPendingUsers(),
        loadWaitingUsers(),
      ]);
    } catch (error) {
      setUsersError(
        error instanceof Error
          ? error.message
          : "הסרת המשתמש נכשלה."
      );
    } finally {
      setActiveAction(null);
    }
  };

  // ==========================================
  // שחזור משתמש
  // ==========================================

  const restoreUser = async (user: User) => {
    if (activeAction) return;

    const confirmed = window.confirm(
      `האם לשחזר את המשתמש "${user.name}"?`
    );

    if (!confirmed) return;

    setActiveAction(`restore-${user.userId}`);
    setUsersError("");
    setUserMessage("");

    try {
      await request(
        `/Users/${user.userId}/restore`,
        { method: "PUT" }
      );

      setUserMessage(
        `המשתמש "${user.name}" שוחזר בהצלחה.`
      );

      await Promise.all([
        loadAllUsers(),
        loadPendingUsers(),
        loadWaitingUsers(),
      ]);
    } catch (error) {
      setUsersError(
        error instanceof Error
          ? error.message
          : "שחזור המשתמש נכשל."
      );
    } finally {
      setActiveAction(null);
    }
  };

  // ==========================================
  // נתוני בחירות
  // ==========================================

  const refreshElection = useCallback(async () => {
    setElectionLoading(true);
    setElectionError("");

    try {
      const status = await request<ElectionStatus>(
        "/Voting/election-status"
      );

      setClosed(status.isClosed);

      const [myVote, electionResults] = await Promise.all([
        request<VoteStatus>("/Voting/status"),
        status.isClosed
          ? request<ElectionResults>("/Voting/results")
          : Promise.resolve(null),
      ]);

      setVoteStatus(myVote);
      setResults(electionResults);
    } catch (error) {
      setElectionError(
        error instanceof Error
          ? error.message
          : "טעינת הבחירות נכשלה."
      );
    } finally {
      setElectionLoading(false);
    }
  }, [request]);

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
      const data = await request<ElectionResults>(
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
          : "סגירת הבחירות נכשלה."
      );

      await refreshElection();
    } finally {
      setClosing(false);
    }
  };

  // ==========================================
  // טעינה ראשונית
  // ==========================================

  useEffect(() => {
    if (role !== "Admin" || !token) return;

    void loadAllUsers();
    void loadPendingUsers();
    void loadWaitingUsers();
    void refreshElection();
  }, [
    role,
    token,
    loadAllUsers,
    loadPendingUsers,
    loadWaitingUsers,
    refreshElection,
  ]);

  const refreshAll = () => {
    void loadAllUsers();
    void loadPendingUsers();
    void loadWaitingUsers();
    void refreshElection();
  };

  // ==========================================
  // סינון משתמשים
  // ==========================================

  const filteredUsers = allUsers.filter((user) => {
    const search = searchText.trim().toLowerCase();

    const matchesSearch =
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.includes(search) ||
      String(user.userId).includes(search);

    const matchesStatus =
      showDeleted || !user.isDeleted;

    return matchesSearch && matchesStatus;
  });

  const activeUsersCount = allUsers.filter(
    (user) => !user.isDeleted
  ).length;

  const deletedUsersCount = allUsers.filter(
    (user) => user.isDeleted
  ).length;

  // ==========================================
  // הרשאות
  // ==========================================

  if (role !== "Admin") {
    return (
      <main className="admin-dashboard" dir="rtl">
        <p>
          הגישה ללוח הניהול מיועדת למנהלי מערכת בלבד.
        </p>
      </main>
    );
  }

  return (
    <section className="admin-dashboard" dir="rtl">
      <div className="admin-shell">

        {/* כותרת ראשית */}
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
              usersLoading ||
              Boolean(activeAction)
            }
          >
            רענון נתונים
          </button>
        </div>

        {/* הודעות */}
        {userMessage && (
          <div className="admin-alert success" role="status">
            {userMessage}
          </div>
        )}

        {electionError && (
          <div className="admin-alert error" role="alert">
            {electionError}
          </div>
        )}

        {electionMessage && (
          <div className="admin-alert success" role="status">
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
            <span>ההצבעה שלי</span>
            <strong>
              {voteStatus === null
                ? "—"
                : voteStatus.hasVoted
                ? "כבר הצבעתי"
                : "טרם הצבעתי"}
            </strong>
            <small>גם מנהל יכול להצביע פעם אחת</small>
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
              סגירת הבחירות ופרסום התוצאות הסופיות.
            </p>

            <div className="admin-actions">
              <button
                type="button"
                className="admin-primary"
                onClick={() => void closeElection()}
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

          <article className="admin-panel admin-vote-panel">
            <div className="admin-panel-number">
              02 / הצבעה אישית
            </div>

            <h2>גם למנהל יש קול</h2>
            <p>
              מעבר לעמוד ההצבעה והשתתפות בבחירות.
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

        {/* =====================================
            ניהול כל המשתמשים - חדש
        ===================================== */}

        <article className="admin-panel admin-pending-panel">
          <div className="admin-pending-head">
            <div>
              <div className="admin-panel-number">
                03 / ניהול חשבונות
              </div>

              <h2>ניהול כל המשתמשים</h2>

              <p>
                צפייה במשתמשים, הסרת חשבונות
                ושחזור חשבונות שהוסרו.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={() => void loadAllUsers()}
              disabled={usersLoading || Boolean(activeAction)}
            >
              רענון משתמשים
            </button>
          </div>

          <div
            className="admin-stats"
            style={{ marginTop: "20px" }}
          >
            <article className="admin-stat">
              <span>משתמשים פעילים</span>
              <strong>{activeUsersCount}</strong>
            </article>

            <article className="admin-stat">
              <span>משתמשים שהוסרו</span>
              <strong>{deletedUsersCount}</strong>
            </article>

            <article className="admin-stat">
              <span>סה"כ רשומות</span>
              <strong>{allUsers.length}</strong>
            </article>
          </div>

          {/* חיפוש וסינון */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              alignItems: "center",
              margin: "20px 0",
            }}
          >
            <input
              type="search"
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              placeholder="חיפוש לפי שם, מייל, טלפון או מזהה"
              aria-label="חיפוש משתמש"
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                minWidth: "250px",
                flex: "1",
                fontSize: "15px",
                background: "#fff",
                color: "#111827",
              }}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(event) =>
                  setShowDeleted(event.target.checked)
                }
              />
              הצגת משתמשים שהוסרו
            </label>
          </div>

          {usersError && (
            <div className="admin-alert error" role="alert">
              {usersError}
            </div>
          )}

          {usersLoading ? (
            <div className="admin-pending-empty">
              טוען משתמשים...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-pending-empty">
              לא נמצאו משתמשים להצגה.
            </div>
          ) : (
            <div className="admin-pending-table-wrap">
              <table className="admin-pending-table">
                <thead>
                  <tr>
                    <th>מזהה</th>
                    <th>שם מלא</th>
                    <th>מייל</th>
                    <th>טלפון</th>
                    <th>תפקיד</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const isAdmin =
                      user.role === "Admin" ||
                      user.role === 1;

                    return (
                      <tr key={user.userId}>
                        <td>{user.userId}</td>

                        <td className="admin-pending-name">
                          {user.name}
                        </td>

                        <td>{user.email}</td>
                        <td>{user.phone || "—"}</td>

                        <td>
                          {isAdmin
                            ? "מנהל"
                            : user.role === undefined ||
                              user.role === null
                            ? "—"
                            : String(user.role)}
                        </td>

                        <td>
                          <span className="admin-pending-status">
                            {user.isDeleted
                              ? "הוסר"
                              : "פעיל"}
                          </span>
                        </td>

                        <td>
                          {isAdmin ? (
                            <span>חשבון מנהל מוגן</span>
                          ) : user.isDeleted ? (
                            <button
                              type="button"
                              className="admin-outline"
                              disabled={Boolean(activeAction)}
                              onClick={() =>
                                void restoreUser(user)
                              }
                            >
                              {activeAction ===
                              `restore-${user.userId}`
                                ? "משחזר..."
                                : "שחזור משתמש"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-outline"
                              disabled={Boolean(activeAction)}
                              onClick={() =>
                                void softDeleteUser(user)
                              }
                              style={{
                                color: "#b91c1c",
                                borderColor: "#fca5a5",
                              }}
                            >
                              {activeAction ===
                              `remove-${user.userId}`
                                ? "מסיר..."
                                : "הסרת משתמש"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-pending-count">
            משתמשים מוצגים: {filteredUsers.length}
          </div>
        </article>

        {/* =====================================
            בקשות ממתינות לאישור
        ===================================== */}

        <article className="admin-panel admin-pending-panel">
          <div className="admin-pending-head">
            <div>
              <div className="admin-panel-number">
                04 / בקשות הצטרפות
              </div>

              <h2>בקשות הצטרפות ממתינות</h2>
              <p>
                משתמשים שנרשמו וממתינים לאישור מנהל.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={() => void loadPendingUsers()}
              disabled={
                pendingLoading || Boolean(activeAction)
              }
            >
              רענון בקשות
            </button>
          </div>

          {pendingError && (
            <div className="admin-alert error" role="alert">
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

        {/* =====================================
            ממתינים להגדרת סיסמה
        ===================================== */}

        <article className="admin-panel admin-pending-panel">
          <div className="admin-pending-head">
            <div>
              <div className="admin-panel-number">
                05 / השלמת הרשמה
              </div>

              <h2>ממתינים להגדרת סיסמה</h2>

              <p>
                משתמשים שאושרו אך עדיין לא השלימו
                את פתיחת החשבון.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={() => void loadWaitingUsers()}
              disabled={
                waitingLoading || Boolean(activeAction)
              }
            >
              רענון רשימה
            </button>
          </div>

          {waitingError && (
            <div className="admin-alert error" role="alert">
              {waitingError}
            </div>
          )}

          {waitingLoading ? (
            <div className="admin-pending-empty">
              טוען משתמשים...
            </div>
          ) : waitingUsers.length === 0 ? (
            <div className="admin-pending-empty">
              אין משתמשים שממתינים להגדרת סיסמה.
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
                              `delete-request-${user.userId}`
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

        {/* =====================================
            תוצאות הבחירות
        ===================================== */}

        <article
          id="election-results"
          className="admin-panel admin-results"
        >
          <div className="admin-panel-number">
            06 / תוצאות הבחירות
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
                  <span>סה"כ מצביעים</span>
                  <strong>
                    {results.totalVoters.toLocaleString(
                      "he-IL"
                    )}
                  </strong>
                </div>

                <div>
                  <span>מספר מועמדים</span>
                  <strong>{results.results.length}</strong>
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
                        {String(item.position).padStart(
                          2,
                          "0"
                        )}
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
