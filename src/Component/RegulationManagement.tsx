
import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";

// =====================================================
// כתובת שרת ה-API
// =====================================================

import { API_ORIGIN } from "../config/api";

const API = `${API_ORIGIN}/api`;

// =====================================================
// טיפוסים
// =====================================================

type RegulationVersion = {
  versionId: number;
  versionNumber: string;
  status: string;
  publishedAt: string | null;
  totalSections: number;
  missingEmbeddings: number;
};

type RegulationSection = {
  sectionNumber: string;
  content: string;
};

type ReuseResult = {
  message: string;
  versionId: number;
  reusedCount: number;
  remaining: number;
};

export default function RegulationManagement() {
  const token = useAppSelector((state) => state.auth.token);

  // =====================================================
  // ניהול גרסאות
  // =====================================================

  const [versions, setVersions] = useState<RegulationVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] =
    useState<number | null>(null);
  const [newVersionNumber, setNewVersionNumber] = useState("");

  const [loadingVersions, setLoadingVersions] = useState(true);
  const [creatingDraft, setCreatingDraft] = useState(false);

  // =====================================================
  // ניהול סעיפים
  // =====================================================

  const [sections, setSections] = useState<RegulationSection[]>([]);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const [loadingSections, setLoadingSections] = useState(false);
  const [saving, setSaving] = useState(false);

  // =====================================================
  // הכנת Embeddings
  // =====================================================

  const [reusing, setReusing] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =====================================================
  // נתונים מחושבים
  // =====================================================

  const selectedVersion = versions.find(
    (version) => version.versionId === selectedVersionId
  );

  const selectedSection = sections.find(
    (section) => section.sectionNumber === selectedNumber
  );

  const isDraft = selectedVersion?.status === "Draft";

  const hasChanges =
    selectedSection !== undefined &&
    editedContent !== selectedSection.content;

  const preparedEmbeddings = selectedVersion
    ? selectedVersion.totalSections - selectedVersion.missingEmbeddings
    : 0;

  const isPreparing = reusing || completing;

  const isBusy =
    loadingVersions ||
    loadingSections ||
    creatingDraft ||
    saving ||
    isPreparing;

  const preparationComplete =
    !!selectedVersion &&
    selectedVersion.totalSections > 0 &&
    selectedVersion.missingEmbeddings === 0;

  // =====================================================
  // טיפול בתשובות שגיאה
  // =====================================================

  const getErrorMessage = async (
    response: Response,
    fallback: string
  ): Promise<string> => {
    const data = await response.json().catch(() => null);

    if (response.status === 429) {
      return "מכסת Gemini הסתיימה כרגע. נסי שוב לאחר חידוש המכסה.";
    }

    return data?.message || data?.title || fallback;
  };

  // =====================================================
  // בקשה לרשימת גרסאות מהשרת
  // =====================================================

  const fetchVersions = useCallback(async (): Promise<
    RegulationVersion[]
  > => {
    if (!token) {
      throw new Error("יש להתחבר כמנהלת כדי לנהל את התקנון.");
    }

    const response = await fetch(`${API}/regulation/versions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "לא ניתן לטעון את גרסאות התקנון."
        )
      );
    }

    const data: RegulationVersion[] = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("רשימת הגרסאות שהתקבלה אינה תקינה.");
    }

    return data;
  }, [token]);

  // =====================================================
  // רענון גרסאות ושמירה על הגרסה שנבחרה
  // =====================================================

  const loadVersions = useCallback(async () => {
    setLoadingVersions(true);
    setError("");

    try {
      const data = await fetchVersions();

      setVersions(data);

      setSelectedVersionId((current) => {
        if (
          current !== null &&
          data.some((version) => version.versionId === current)
        ) {
          return current;
        }

        const draft = data.find(
          (version) => version.status === "Draft"
        );

        return draft?.versionId ?? data[0]?.versionId ?? null;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בטעינת הגרסאות."
      );
    } finally {
      setLoadingVersions(false);
    }
  }, [fetchVersions]);

  // =====================================================
  // טעינה ראשונית
  // =====================================================

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  // =====================================================
  // טעינת סעיפי הגרסה שנבחרה
  // =====================================================

  const loadSections = useCallback(async () => {
    if (!token || selectedVersionId === null) {
      setSections([]);
      setSelectedNumber("");
      setEditedContent("");
      return;
    }

    setLoadingSections(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/regulation/versions/${selectedVersionId}/sections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "לא ניתן לטעון את סעיפי התקנון."
          )
        );
      }

      const data: RegulationSection[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("רשימת הסעיפים שהתקבלה אינה תקינה.");
      }

      setSections(data);
      setSelectedNumber(data[0]?.sectionNumber ?? "");
      setEditedContent(data[0]?.content ?? "");
    } catch (err) {
      setSections([]);
      setSelectedNumber("");
      setEditedContent("");

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בטעינת הסעיפים."
      );
    } finally {
      setLoadingSections(false);
    }
  }, [token, selectedVersionId]);

  useEffect(() => {
    void loadSections();
  }, [loadSections]);

  // =====================================================
  // מעבר לגרסה אחרת
  // =====================================================

  const changeVersion = (versionId: number) => {
    if (isBusy) return;

    if (
      hasChanges &&
      !window.confirm(
        "יש שינויים שלא נשמרו. האם לעבור לגרסה אחרת?"
      )
    ) {
      return;
    }

    setSections([]);
    setSelectedNumber("");
    setEditedContent("");
    setSelectedVersionId(versionId);
    setError("");
    setMessage("");
  };

  // =====================================================
  // יצירת טיוטה חדשה
  // =====================================================

  const createDraft = async () => {
    if (!token || isBusy) return;

    const versionNumber = newVersionNumber.trim();

    if (!versionNumber) {
      setError("יש להזין מספר גרסה חדשה.");
      return;
    }

    if (versionNumber.length > 20) {
      setError("מספר הגרסה ארוך מדי.");
      return;
    }

    if (
      versions.some(
        (version) => version.versionNumber === versionNumber
      )
    ) {
      setError("כבר קיימת גרסת תקנון עם מספר זה.");
      return;
    }

    if (
      hasChanges &&
      !window.confirm(
        "יש שינויים שלא נשמרו. האם להמשיך ביצירת טיוטה?"
      )
    ) {
      return;
    }

    setCreatingDraft(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/regulation/create-draft?versionNumber=${encodeURIComponent(
          versionNumber
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "יצירת הטיוטה נכשלה."
          )
        );
      }

      const result: { versionId: number } =
        await response.json();

      if (!Number.isInteger(result.versionId)) {
        throw new Error("השרת לא החזיר מזהה טיוטה תקין.");
      }

      const updatedVersions = await fetchVersions();

      setVersions(updatedVersions);
      setSelectedVersionId(result.versionId);
      setNewVersionNumber("");

      setMessage(
        `טיוטת גרסה ${versionNumber} נוצרה בהצלחה.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה ביצירת הטיוטה."
      );
    } finally {
      setCreatingDraft(false);
    }
  };

  // =====================================================
  // בחירת סעיף
  // =====================================================

  const selectSection = (sectionNumber: string) => {
    if (isBusy) return;

    const section = sections.find(
      (item) => item.sectionNumber === sectionNumber
    );

    if (!section) return;

    if (
      hasChanges &&
      !window.confirm(
        "יש שינויים שלא נשמרו. האם לעבור לסעיף אחר?"
      )
    ) {
      return;
    }

    setSelectedNumber(section.sectionNumber);
    setEditedContent(section.content);
    setError("");
    setMessage("");
  };

  // =====================================================
  // שמירת סעיף בטיוטה
  // =====================================================

  const saveSection = async () => {
    if (
      !token ||
      selectedVersionId === null ||
      !selectedNumber ||
      !isDraft ||
      isBusy
    ) {
      return;
    }

    if (!editedContent.trim()) {
      setError("תוכן הסעיף אינו יכול להיות ריק.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/regulation/versions/${selectedVersionId}/sections/${encodeURIComponent(
          selectedNumber
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: editedContent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "שמירת הסעיף נכשלה."
          )
        );
      }

      const savedContent = editedContent.trim();

      setSections((previous) =>
        previous.map((section) =>
          section.sectionNumber === selectedNumber
            ? { ...section, content: savedContent }
            : section
        )
      );

      setEditedContent(savedContent);

      // לאחר שינוי סעיף, ה-Embedding שלו עשוי להתבטל.
      const updatedVersions = await fetchVersions();
      setVersions(updatedVersions);

      setMessage(
        `סעיף ${selectedNumber} נשמר בהצלחה.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בשמירת הסעיף."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // שימוש חוזר ב-Embeddings
  //
  // מעתיק מהגרסה המפורסמת וקטורים של סעיפים
  // בעלי מספר ותוכן זהים.
  //
  // לא מבצע קריאות ל-Gemini.
  // =====================================================

  const reuseEmbeddings = async () => {
    if (
      !token ||
      selectedVersionId === null ||
      !isDraft ||
      isBusy
    ) {
      return;
    }

    if (hasChanges) {
      setError(
        "יש לשמור או לבטל את השינויים בסעיף לפני הכנת התקנון."
      );
      return;
    }

    setReusing(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/regulation/reuse-embeddings?versionId=${selectedVersionId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "העתקת ה-Embeddings נכשלה."
          )
        );
      }

      const result: ReuseResult = await response.json();

      const updatedVersions = await fetchVersions();
      setVersions(updatedVersions);

      setMessage(
        `הבדיקה הסתיימה: הועתקו ${result.reusedCount} Embeddings. ` +
          `נותרו ${result.remaining} סעיפים להכנה.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בשימוש החוזר ב-Embeddings."
      );
    } finally {
      setReusing(false);
    }
  };

  // =====================================================
  // השלמת Embeddings חסרים
  //
  // מפעילה את פעולת ההשלמה הקיימת בשרת.
  // פעולה זו עשויה לצרוך מכסת Gemini.
  // =====================================================

  const completeEmbeddings = async () => {
    if (
      !token ||
      selectedVersionId === null ||
      !isDraft ||
      isBusy ||
      !selectedVersion ||
      selectedVersion.missingEmbeddings === 0
    ) {
      return;
    }

    if (hasChanges) {
      setError(
        "יש לשמור או לבטל את השינויים לפני השלמת Embeddings."
      );
      return;
    }

    const confirmed = window.confirm(
      `לגרסה ${selectedVersion.versionNumber} חסרים ` +
        `${selectedVersion.missingEmbeddings} Embeddings.\n\n` +
        "הפעולה תשלח בקשות ל-Gemini ועשויה לצרוך מכסה.\n" +
        "האם להמשיך?"
    );

    if (!confirmed) return;

    setCompleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/regulation/complete-embeddings?versionId=${selectedVersionId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "השלמת ה-Embeddings נכשלה."
          )
        );
      }

      // השרת עשוי להחזיר נתוני סיכום.
      // מקור האמת למצב העדכני הוא רשימת הגרסאות.
      const updatedVersions = await fetchVersions();
      setVersions(updatedVersions);

      const updatedVersion = updatedVersions.find(
        (version) => version.versionId === selectedVersionId
      );

      if (updatedVersion) {
        const prepared =
          updatedVersion.totalSections -
          updatedVersion.missingEmbeddings;

        setMessage(
          `הפעולה הסתיימה. מוכנים ${prepared} מתוך ` +
            `${updatedVersion.totalSections} Embeddings.`
        );
      } else {
        setMessage(
          "פעולת ההשלמה הסתיימה. יש לרענן את הגרסאות."
        );
      }
    } catch (err) {
      // גם אם ההשלמה נכשלה באמצע,
      // ייתכן שחלק מהווקטורים נשמרו בשרת.
      // לכן מרעננים את המצב העדכני.
      try {
        const updatedVersions = await fetchVersions();
        setVersions(updatedVersions);
      } catch {
        // משאירים את השגיאה המקורית להצגה.
      }

      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בהשלמת ה-Embeddings."
      );
    } finally {
      setCompleting(false);
    }
  };
// =====================================================
// פרסום גרסת תקנון
//
// הפעולה זמינה רק לטיוטה שכל ה-Embeddings
// שלה מוכנים.
//
// לפני הפרסום מבקשים אישור מפורש מהמנהלת.
// השרת מעביר את הגרסה הקודמת לארכיון.
// =====================================================

const [publishing, setPublishing] = useState(false);

const publishRegulation = async () => {
  if (
    !token ||
    selectedVersionId === null ||
    !isDraft ||
    !preparationComplete ||
    isBusy ||
    publishing
  ) {
    return;
  }

  if (hasChanges) {
    setError("יש לשמור או לבטל שינויים לפני הפרסום.");
    return;
  }

  const confirmed = window.confirm(
    `האם לפרסם את גרסת התקנון ${selectedVersion?.versionNumber}?\n\n` +
      "הגרסה הנוכחית תועבר לארכיון.\n" +
      "הגרסה החדשה תהפוך לגרסה הפעילה בצ'אט.\n\n" +
      "האם את בטוחה שברצונך להמשיך?"
  );

  if (!confirmed) return;

  setPublishing(true);
  setError("");
  setMessage("");

  try {
    const response = await fetch(
      `${API}/regulation/publish?versionId=${selectedVersionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "פרסום גרסת התקנון נכשל."
        )
      );
    }

    const result: {
      versionNumber: string;
      archivedVersions: number;
    } = await response.json();

    const updatedVersions = await fetchVersions();
    setVersions(updatedVersions);

    setMessage(
      `גרסה ${result.versionNumber} פורסמה בהצלחה! ` +
        `${result.archivedVersions} גרסאות קודמות הועברו לארכיון.`
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "אירעה שגיאה בפרסום התקנון."
    );
  } finally {
    setPublishing(false);
  }
};
  // =====================================================
  // תצוגת מסך הניהול
  // =====================================================

  return (
    <article className="admin-panel" dir="rtl">
      <div className="admin-panel-number">
        07 / ניהול התקנון
      </div>

      <h2>ניהול גרסאות התקנון</h2>

      <p>
        צפייה בגרסאות, יצירת טיוטות, עריכת סעיפים
        והכנת התקנון לפרסום.
        הגרסה המפורסמת נשארת ללא שינוי עד לפרסום חדש.
      </p>

      {/* ===============================================
          בחירת גרסה
      =============================================== */}

      <div style={{ marginTop: 24 }}>
        <label
          htmlFor="regulation-version-select"
          style={{ display: "block", marginBottom: 8 }}
        >
          <strong>בחירת גרסת תקנון:</strong>
        </label>

        <select
          id="regulation-version-select"
          value={selectedVersionId ?? ""}
          onChange={(event) =>
            changeVersion(Number(event.target.value))
          }
          disabled={isBusy}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "#fff",
            color: "#172b4d",
          }}
        >
          {versions.length === 0 && (
            <option value="">אין גרסאות להצגה</option>
          )}

          {versions.map((version) => (
            <option
              key={version.versionId}
              value={version.versionId}
            >
              גרסה {version.versionNumber} —{" "}
              {version.status === "Draft"
                ? "טיוטה"
                : version.status === "Published"
                  ? "מפורסמת"
                  : version.status === "Archived"
                    ? "בארכיון"
                    : version.status}
            </option>
          ))}
        </select>
      </div>

      {/* ===============================================
          פרטי הגרסה
      =============================================== */}

      {selectedVersion && (
        <div style={{ marginTop: 20, lineHeight: 2 }}>
          <p>
            <strong>מספר גרסה:</strong>{" "}
            {selectedVersion.versionNumber}
          </p>

          <p>
            <strong>סטטוס:</strong>{" "}
            {isDraft
              ? "טיוטה — ניתנת לעריכה"
              : selectedVersion.status === "Published"
                ? "מפורסמת — לצפייה בלבד"
                : "בארכיון — לצפייה בלבד"}
          </p>

          <p>
            <strong>מספר סעיפים:</strong>{" "}
            {selectedVersion.totalSections}
          </p>

          <p>
            <strong>Embeddings מוכנים:</strong>{" "}
            {preparedEmbeddings} מתוך{" "}
            {selectedVersion.totalSections}
          </p>

          {selectedVersion.publishedAt && (
            <p>
              <strong>תאריך פרסום:</strong>{" "}
              {new Date(
                selectedVersion.publishedAt
              ).toLocaleString("he-IL")}
            </p>
          )}
        </div>
      )}

      {/* ===============================================
          יצירת טיוטה חדשה
      =============================================== */}

      <div
        style={{
          marginTop: 28,
          padding: 20,
          border: "1px solid #e2e8f0",
          borderRadius: 12,
        }}
      >
        <h3>יצירת טיוטה חדשה</h3>

        <p>
          הטיוטה החדשה תיווצר כהעתק של התקנון
          המפורסם האחרון, ללא שינוי בגרסה הפעילה.
        </p>

        <label
          htmlFor="new-regulation-version"
          style={{ display: "block", marginBottom: 8 }}
        >
          מספר גרסה חדשה:
        </label>

        <input
          id="new-regulation-version"
          type="text"
          value={newVersionNumber}
          onChange={(event) =>
            setNewVersionNumber(event.target.value)
          }
          placeholder="לדוגמה: 1.2"
          maxLength={20}
          disabled={isBusy}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            marginBottom: 14,
          }}
        />

        <button
          type="button"
          className="admin-primary"
          onClick={() => void createDraft()}
          disabled={isBusy || !newVersionNumber.trim()}
        >
          {creatingDraft ? "יוצר טיוטה..." : "יצירת טיוטה"}
        </button>
      </div>

      {/* ===============================================
          הכנת הטיוטה לפרסום — אזור חדש
      =============================================== */}

      {selectedVersion && isDraft && (
        <div
          style={{
            marginTop: 28,
            padding: 20,
            border: "1px solid #cbd5e1",
            borderRadius: 12,
          }}
        >
          <h3>הכנת הטיוטה לפרסום</h3>

          <p>
            המערכת בודקת אילו סעיפים כבר מוכנים,
            ומשלימה Embeddings רק לפי הצורך.
          </p>

          <div style={{ marginTop: 16 }}>
            <strong>מצב ההכנה:</strong>

            <p>
              {preparedEmbeddings} מתוך{" "}
              {selectedVersion.totalSections} סעיפים מוכנים
            </p>

            <progress
              value={preparedEmbeddings}
              max={selectedVersion.totalSections || 1}
              style={{
                width: "100%",
                height: 14,
              }}
            />

            <p>
              חסרים:{" "}
              <strong>
                {selectedVersion.missingEmbeddings}
              </strong>
            </p>
          </div>

          <div
            className="admin-actions"
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="admin-secondary"
              onClick={() => void reuseEmbeddings()}
              disabled={
                isBusy ||
                hasChanges ||
                selectedVersion.missingEmbeddings === 0
              }
            >
              {reusing
                ? "בודק ומעתיק Embeddings..."
                : "שימוש חוזר ב-Embeddings"}
            </button>

            <button
              type="button"
              className="admin-primary"
              onClick={() => void completeEmbeddings()}
              disabled={
                isBusy ||
                hasChanges ||
                selectedVersion.missingEmbeddings === 0
              }
            >
              {completing
                ? "משלים Embeddings..."
                : "השלמת Embeddings חסרים"}
            </button>
          </div>

          {hasChanges && (
            <p style={{ marginTop: 12, color: "#a16207" }}>
              יש לשמור או לבטל שינויים לפני הכנת התקנון.
            </p>
          )}

          {preparationComplete && (
            <p style={{ marginTop: 16 }}>
              <strong>
                כל ה-Embeddings מוכנים!
              </strong>{" "}
              ניתן להתקדם לשלב בדיקות הפרסום.
            </p>
          )}

{/* ===============================================
    כפתור פרסום גרסת התקנון
=============================================== */}

{preparationComplete && (
  <div style={{ marginTop: 20 }}>
    <button
      type="button"
      className="admin-primary"
      onClick={() => void publishRegulation()}
      disabled={isBusy || publishing || hasChanges}
    >
      {publishing
        ? "מפרסם את התקנון..."
        : "פרסום גרסת התקנון"}
    </button>

    <p style={{ marginTop: 10, fontSize: 13 }}>
      הפרסום יהפוך את הגרסה הזאת לגרסה הפעילה בצ'אט.
      הגרסה המפורסמת הקודמת תישמר בארכיון.
    </p>
  </div>
)}


          <p style={{ marginTop: 16, fontSize: 13 }}>
            שימוש חוזר אינו צורך מכסת Gemini.
            השלמת Embeddings חסרים עשויה לצרוך מכסה.
            הכנת הטיוטה אינה מפרסמת אותה.
          </p>
        </div>
      )}

      {/* ===============================================
          הודעות מערכת
      =============================================== */}

      {error && (
        <div
          className="admin-alert error"
          role="alert"
          style={{ marginTop: 16 }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="admin-alert success"
          role="status"
          style={{ marginTop: 16 }}
        >
          {message}
        </div>
      )}

      {/* ===============================================
          רשימת סעיפים ועריכתם
      =============================================== */}

      <div style={{ marginTop: 28 }}>
        <h3>
          {isDraft
            ? "עריכת סעיפי הטיוטה"
            : "צפייה בסעיפי התקנון"}
        </h3>

        <button
          type="button"
          className="admin-refresh"
          onClick={() => {
            if (
              hasChanges &&
              !window.confirm(
                "יש שינויים שלא נשמרו. האם לרענן?"
              )
            ) {
              return;
            }

            void loadSections();
          }}
          disabled={
            isBusy || selectedVersionId === null
          }
        >
          רענון סעיפים
        </button>

        {loadingSections ? (
          <p>טוען את סעיפי התקנון...</p>
        ) : sections.length === 0 ? (
          <p>לא נמצאו סעיפים להצגה.</p>
        ) : (
          <div style={{ marginTop: 20 }}>
            <p>
              <strong>מספר יחידות מידע:</strong>{" "}
              {sections.length}
            </p>

            <label
              htmlFor="regulation-section-select"
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              בחרי סעיף:
            </label>

            <select
              id="regulation-section-select"
              value={selectedNumber}
              onChange={(event) =>
                selectSection(event.target.value)
              }
              disabled={isBusy}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#172b4d",
                marginBottom: 20,
              }}
            >
              {sections.map((section) => (
                <option
                  key={section.sectionNumber}
                  value={section.sectionNumber}
                >
                  {section.sectionNumber === "0.0"
                    ? "מבוא והגדרות"
                    : `סעיף ${section.sectionNumber}`}
                </option>
              ))}
            </select>

            <label
              htmlFor="regulation-content"
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              תוכן הסעיף:
            </label>

            <textarea
              id="regulation-content"
              value={editedContent}
              onChange={(event) => {
                setEditedContent(event.target.value);
                setMessage("");
              }}
              readOnly={!isDraft}
              disabled={isBusy}
              rows={12}
              dir="rtl"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                background: isDraft
                  ? "#fff"
                  : "#f1f5f9",
                color: "#172b4d",
                fontSize: 15,
                lineHeight: 1.8,
                resize: "vertical",
              }}
            />

            {hasChanges && isDraft && (
              <p style={{ color: "#a16207" }}>
                יש שינויים שטרם נשמרו.
              </p>
            )}

            {isDraft && (
              <div
                className="admin-actions"
                style={{ marginTop: 16 }}
              >
                <button
                  type="button"
                  className="admin-primary"
                  onClick={() => void saveSection()}
                  disabled={
                    isBusy ||
                    !hasChanges ||
                    !editedContent.trim()
                  }
                >
                  {saving
                    ? "שומר..."
                    : "שמירת השינויים"}
                </button>

                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => {
                    if (!selectedSection) return;

                    setEditedContent(
                      selectedSection.content
                    );
                    setError("");
                    setMessage("");
                  }}
                  disabled={isBusy || !hasChanges}
                >
                  ביטול שינויים שלא נשמרו
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ marginTop: 24 }}>
        שינויים בטיוטה אינם משפיעים על צ'אט התקנון
        עד לפרסום גרסה חדשה.
      </p>
    </article>
  );
}
