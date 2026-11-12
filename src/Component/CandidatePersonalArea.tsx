
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAppSelector } from "../store/hooks";
import { getMediaUrl } from "../utils/mediaUrl";
import "./CandidatePersonalArea.css";

const API =
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227";

interface CandidateProfile {
  candidateId: number;
  name: string;
  slogan: string;
  resume: string;
  profileImageUrl?: string | null;
  explanationVideoUrl?: string | null;
}

interface Props {
  onBack?: () => void;
  onSaved?: () => void;
}

async function getErrorMessage(response: Response): Promise<string> {
  const body = await response.text();

  try {
    const data = JSON.parse(body);

    return (
      data.message ||
      data.title ||
      (data.errors
        ? Object.values(data.errors).flat().join(", ")
        : null) ||
      `שגיאה ${response.status}`
    );
  } catch {
    return body || `שגיאה ${response.status}`;
  }
}

export default function CandidatePersonalArea({
  onBack,
}: Props) {
  const token = useAppSelector((state) => state.auth.token);

  const [profile, setProfile] =
    useState<CandidateProfile | null>(null);

  const [slogan, setSlogan] = useState("");
  const [resume, setResume] = useState("");

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [videoFile, setVideoFile] =
    useState<File | null>(null);

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // טעינת פרופיל המועמד
  useEffect(() => {
    if (!token) {
      setProfile(null);
      setError("יש להתחבר כדי לצפות באזור האישי");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API}/api/Candidates/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(response)
          );
        }

        const data: CandidateProfile =
          await response.json();

        if (controller.signal.aborted) return;

        setProfile(data);
        setSlogan(data.slogan || "");
        setResume(data.resume || "");
      } catch (err) {
        if (!controller.signal.aborted) {
          setProfile(null);
          setError(
            err instanceof Error
              ? err.message
              : "לא ניתן לטעון את הפרופיל"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [token]);

  // תצוגה מקדימה לתמונה
  useEffect(() => {
    if (!imageFile) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.type)) {
      setError("יש לבחור תמונה מסוג JPG, PNG או WEBP");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("גודל התמונה לא יכול לעלות על 5MB");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setError("");
    setSuccess("");
  }

  function handleVideoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension =
      file.name.split(".").pop()?.toLowerCase();

    if (
      !extension ||
      !["mp4", "avi", "mov"].includes(extension)
    ) {
      setError("יש לבחור סרטון MP4, AVI או MOV");
      event.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("גודל הסרטון לא יכול לעלות על 20MB");
      event.target.value = "";
      return;
    }

    setVideoFile(file);
    setError("");
    setSuccess("");
  }

  // שמירת השינויים
  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!token || !profile || saving) return;

    if (!slogan.trim() || !resume.trim()) {
      setError("יש למלא סלוגן וקורות חיים");
      setSuccess("");
      return;
    }

    if (slogan.trim().length > 100) {
      setError("הסלוגן לא יכול לעבור 100 תווים");
      setSuccess("");
      return;
    }

    if (resume.trim().length > 2000) {
      setError("קורות החיים לא יכולים לעבור 2000 תווים");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("Slogan", slogan.trim());
      formData.append("Resume", resume.trim());

      // שמירת כתובות המדיה הקיימות
      if (profile.profileImageUrl) {
        formData.append(
          "ProfileImageUrl",
          profile.profileImageUrl
        );
      }

      if (profile.explanationVideoUrl) {
        formData.append(
          "ExplanationVideoUrl",
          profile.explanationVideoUrl
        );
      }

      // קבצים חדשים
      if (imageFile) {
        formData.append("ImageFile", imageFile);
      }

      if (videoFile) {
        formData.append("VideoFile", videoFile);
      }

      const response = await fetch(
        `${API}/api/Candidates`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response)
        );
      }

      // השמירה הצליחה - מציגים הודעה מיד
      setError("");
      setSuccess("השינויים נשמרו בהצלחה!");

      // רענון הפרטים מהשרת
      try {
        const refreshedResponse = await fetch(
          `${API}/api/Candidates/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (refreshedResponse.ok) {
          const updated: CandidateProfile =
            await refreshedResponse.json();

          setProfile(updated);
          setSlogan(updated.slogan || "");
          setResume(updated.resume || "");
        } else {
          setSuccess(
            "השינויים נשמרו, אך לא ניתן לרענן את הפרופיל כרגע."
          );
        }
      } catch {
        setSuccess(
          "השינויים נשמרו, אך לא ניתן לרענן את הפרופיל כרגע."
        );
      }

      setImageFile(null);
      setVideoFile(null);

      // לא מפעילים onSaved כאן,
      // כדי שהעמוד לא יתחלף וההודעה לא תיעלם.
    } catch (err) {
      setSuccess("");
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בשמירת השינויים"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="candidate-area-state" dir="rtl">
        טוען את האזור האישי שלך...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="candidate-area-state" dir="rtl">
        <h2>לא ניתן להציג את האזור האישי</h2>
        <p>{error || "לא נמצא פרופיל מועמד"}</p>

        {onBack && (
          <button type="button" onClick={onBack}>
            חזרה
          </button>
        )}
      </div>
    );
  }

  const currentImage =
    preview || getMediaUrl(profile.profileImageUrl);

  const currentVideo =
    getMediaUrl(profile.explanationVideoUrl);

  return (
    <main className="candidate-area" dir="rtl">
      <div className="candidate-area-container">

        {/* כותרת העמוד */}
        <div className="candidate-area-top">
          <div>
            <span className="candidate-area-eyebrow">
              האזור האישי שלי
            </span>

            <h1>ניהול פרופיל המועמד</h1>

            <p>
              כאן אפשר לעדכן את המידע שמוצג
              לחברי המפלגה.
            </p>
          </div>

          {onBack && (
            <button
              type="button"
              className="candidate-back"
              onClick={onBack}
            >
              חזרה למועמדים
            </button>
          )}
        </div>

        {/* הודעת הצלחה או שגיאה בראש העמוד */}
        {success && (
          <div
            role="status"
            aria-live="polite"
            style={{
              backgroundColor: "#e8f7ed",
              color: "#176534",
              border: "1px solid #a9dfb9",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
              fontSize: "16px",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            ✓ {success}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: "#fff0f0",
              color: "#a12323",
              border: "1px solid #e9b5b5",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form
          className="candidate-area-layout"
          onSubmit={handleSave}
        >
          {/* כרטיס פרופיל */}
          <aside className="candidate-profile-card">

            <div className="candidate-profile-photo">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={`תמונת הפרופיל של ${profile.name}`}
                />
              ) : (
                <div className="candidate-photo-placeholder">
                  {profile.name?.charAt(0) || "מ"}
                </div>
              )}
            </div>

            <h2>{profile.name}</h2>
            <p>מועמד בפריימריז</p>

            <label className="candidate-upload-button">
              החלפת תמונת פרופיל

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageChange}
                hidden
              />
            </label>

            <span className="candidate-file-hint">
              JPG, PNG או WEBP — עד 5MB
            </span>

            {imageFile && (
              <p className="candidate-selected-file">
                תמונה חדשה: {imageFile.name}
              </p>
            )}
          </aside>

          {/* עריכת הפרטים */}
          <section className="candidate-edit-card">

            <div className="candidate-edit-heading">
              <span>01 / פרטים אישיים</span>
              <h2>עריכת פרופיל</h2>

              <p>
                הפרטים שתשמרי כאן יוצגו בעמוד
                המועמד שלך.
              </p>
            </div>

            {/* סלוגן */}
            <div className="candidate-field">
              <div className="candidate-field-heading">
                <label htmlFor="candidate-slogan">
                  סלוגן הבחירות
                </label>

                <span>{slogan.length}/100</span>
              </div>

              <input
                id="candidate-slogan"
                type="text"
                value={slogan}
                maxLength={100}
                onChange={(event) => {
                  setSlogan(event.target.value);
                  setSuccess("");
                }}
                placeholder="הסלוגן שמייצג אותך"
                required
              />
            </div>

            {/* קורות חיים */}
            <div className="candidate-field">
              <div className="candidate-field-heading">
                <label htmlFor="candidate-resume">
                  קורות חיים
                </label>

                <span>{resume.length}/2000</span>
              </div>

              <textarea
                id="candidate-resume"
                value={resume}
                maxLength={2000}
                rows={10}
                onChange={(event) => {
                  setResume(event.target.value);
                  setSuccess("");
                }}
                placeholder="ספרו על הניסיון, העשייה והחזון שלכם"
                required
              />
            </div>

            {/* סרטון */}
            <div className="candidate-edit-heading">
              <span>02 / מדיה</span>
              <h2>סרטון הצגה</h2>

              <p>
                אפשר להעלות סרטון חדש או להשאיר
                את הסרטון הקיים.
              </p>
            </div>

            {currentVideo && !videoFile && (
              <video
                className="candidate-video-preview"
                controls
                src={currentVideo}
              />
            )}

            <label className="candidate-video-upload">
              <strong>בחירת סרטון חדש</strong>

              <span>
                MP4, AVI או MOV — עד 20MB
              </span>

              <input
                type="file"
                accept=".mp4,.avi,.mov"
                onChange={handleVideoChange}
              />
            </label>

            {videoFile && (
              <p className="candidate-selected-file">
                הסרטון החדש: {videoFile.name}
              </p>
            )}

            {/* הודעה נוספת ליד כפתור השמירה */}
            {success && (
              <div
                className="candidate-message success"
                role="status"
              >
                ✓ {success}
              </div>
            )}

            {/* כפתור שמירה */}
            <div className="candidate-form-actions">
              <button
                type="submit"
                className="candidate-save-button"
                disabled={saving}
              >
                {saving
                  ? "שומר שינויים..."
                  : "שמירת השינויים"}
              </button>
            </div>

          </section>
        </form>
      </div>
    </main>
  );
}
