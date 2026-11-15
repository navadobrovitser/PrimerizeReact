import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";

// =====================================================
// כתובת שרת ה-API
// =====================================================

const API =
  (import.meta.env.VITE_API_ORIGIN || "https://localhost:7227")
    .replace(/\/$/, "") + "/api";

// =====================================================
// טיפוסים של נתוני התקנון
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

export default function RegulationManagement() {
  const token = useAppSelector((state) => state.auth.token);

  // =====================================================
  // ניהול גרסאות התקנון
  // =====================================================

  const [versions, setVersions] = useState<RegulationVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null
  );
  const [newVersionNumber, setNewVersionNumber] = useState("");

  const [loadingVersions, setLoadingVersions] = useState(true);
  const [creatingDraft, setCreatingDraft] = useState(false);

  // =====================================================
  // ניהול סעיפי הגרסה שנבחרה
  // =====================================================

  const [sections, setSections] = useState<RegulationSection[]>([]);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const [loadingSections, setLoadingSections] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // =====================================================
  // פונקציית עזר לטיפול בתשובות שגיאה מהשרת
  // =====================================================

  const getErrorMessage = async (
    response: Response,
    fallback: string
  ): Promise<string> => {
    const data = await response.json().catch(() => null);

    return data?.message || data?.title || fallback;
  };

  // =====================================================
  // טעינת כל גרסאות התקנון
  //
  // משתמשים ב-GET /api/regulation/versions.
  // אם קיימת טיוטה, נבחר אותה כברירת מחדל.
  // אחרת נבחר את הגרסה הראשונה.
  // =====================================================

  const loadVersions = useCallback(async () => {
    if (!token) {
      setLoadingVersions(false);
      setError("יש להתחבר כמנהלת כדי לנהל את התקנון.");
      return;
    }

    setLoadingVersions(true);
    setError("");

    try {
      const response = await fetch(`${API}/regulation/versions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || "לא ניתן לטעון את גרסאות התקנון."
        );
      }

      const data: RegulationVersion[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("רשימת הגרסאות שהתקבלה אינה תקינה.");
      }

      setVersions(data);

      setSelectedVersionId((current) => {
        if (current !== null &&
            data.some((v) => v.versionId === current)) {
          return current;
        }

        const draft = data.find((v) => v.status === "Draft");

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
  }, [token]);

  // =====================================================
  // טעינה ראשונית של הגרסאות
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
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || "לא ניתן לטעון את סעיפי התקנון."
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

  // =====================================================
  // טעינה מחדש בכל שינוי גרסה
  // =====================================================

  useEffect(() => {
    void loadSections();
  }, [loadSections]);

  // =====================================================
  // בחירת גרסה אחרת
  //
  // אם יש שינויים שלא נשמרו, מבקשים אישור.
  // =====================================================

  const changeVersion = (versionId: number) => {
    if (saving || loadingSections) return;

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
  // יצירת טיוטה חדשה מתוך הגרסה המפורסמת
  //
  // לא מעתיקים ידנית את הסעיפים ב-React.
  // השרת יוצר את הגרסה ומחזיר את המזהה שלה.
  // =====================================================

  const createDraft = async () => {
    if (!token || creatingDraft) return;

    const versionNumber = newVersionNumber.trim();

    if (!versionNumber) {
      setError("יש להזין מספר גרסה חדשה.");
      return;
    }

    if (versionNumber.length > 20) {
      setError("מספר הגרסה ארוך מדי.");
      return;
    }

    if (versions.some((v) => v.versionNumber === versionNumber)) {
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

      const result: { versionId: number } = await response.json();

      if (!Number.isInteger(result.versionId)) {
        throw new Error("השרת לא החזיר מזהה טיוטה תקין.");
      }

      // טוענים מחדש את הגרסאות כדי לקבל גם
      // את הסטטוס ומספר הסעיפים של הטיוטה החדשה.
      const versionsResponse = await fetch(
        `${API}/regulation/versions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!versionsResponse.ok) {
        throw new Error(
          "הטיוטה נוצרה, אך לא ניתן לרענן את רשימת הגרסאות."
        );
      }

      const updatedVersions: RegulationVersion[] =
        await versionsResponse.json();

      setVersions(updatedVersions);
      setSelectedVersionId(result.versionId);
      setNewVersionNumber("");
      setMessage(`טיוטת גרסה ${versionNumber} נוצרה בהצלחה.`);
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
  // בחירת סעיף לעריכה
  // =====================================================

  const selectSection = (sectionNumber: string) => {
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
  // שמירת סעיף בטיוטה בלבד
  //
  // גם React וגם השרת בודקים את מצב הגרסה.
  // =====================================================

  const saveSection = async () => {
    if (
      !token ||
      selectedVersionId === null ||
      !selectedNumber ||
      !isDraft ||
      saving
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
      setMessage(`סעיף ${selectedNumber} נשמר בהצלחה.`);

      // מרעננים את מצב ה-Embeddings לאחר השמירה.
      // פעולה זו לא משנה את הגרסה שנבחרה.
      const versionsResponse = await fetch(
        `${API}/regulation/versions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (versionsResponse.ok) {
        const updatedVersions: RegulationVersion[] =
          await versionsResponse.json();

        setVersions(updatedVersions);
      }
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
  // תצוגת מסך הניהול
  // =====================================================

  return (
    <article className="admin-panel" dir="rtl">
      <div className="admin-panel-number">
        07 / ניהול התקנון
      </div>

      <h2>ניהול גרסאות התקנון</h2>

      <p>
        צפייה בגרסאות, יצירת טיוטות ועריכת סעיפים.
        הגרסה המפורסמת נשארת ללא שינוי עד לפרסום חדש.
      </p>

      {/* ===============================================
          אזור בחירת הגרסה
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
          disabled={loadingVersions || creatingDraft || saving}
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
                  : version.status}
            </option>
          ))}
        </select>
      </div>

      {/* ===============================================
          פרטי הגרסה שנבחרה
      =============================================== */}

      {selectedVersion && (
        <div style={{ marginTop: 20, lineHeight: 2 }}>
          <p>
            <strong>מספר גרסה:</strong>{" "}
            {selectedVersion.versionNumber}
          </p>

          <p>
            <strong>סטטוס:</strong>{" "}
            {isDraft ? "טיוטה — ניתנת לעריכה" : "מפורסמת — לצפייה בלבד"}
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
          disabled={creatingDraft}
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
          disabled={creatingDraft || !newVersionNumber.trim()}
        >
          {creatingDraft ? "יוצר טיוטה..." : "יצירת טיוטה"}
        </button>
      </div>

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
          {isDraft ? "עריכת סעיפי הטיוטה" : "צפייה בסעיפי התקנון"}
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
            loadingSections ||
            saving ||
            selectedVersionId === null
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
              style={{ display: "block", marginBottom: 8 }}
            >
              בחרי סעיף:
            </label>

            <select
              id="regulation-section-select"
              value={selectedNumber}
              onChange={(event) =>
                selectSection(event.target.value)
              }
              disabled={saving}
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
              style={{ display: "block", marginBottom: 8 }}
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
              disabled={saving}
              rows={12}
              dir="rtl"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                background: isDraft ? "#fff" : "#f1f5f9",
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
                    saving ||
                    loadingSections ||
                    !hasChanges ||
                    !editedContent.trim()
                  }
                >
                  {saving ? "שומר..." : "שמירת השינויים"}
                </button>

                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => {
                    if (!selectedSection) return;

                    setEditedContent(selectedSection.content);
                    setError("");
                    setMessage("");
                  }}
                  disabled={saving || !hasChanges}
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