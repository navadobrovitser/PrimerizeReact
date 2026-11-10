
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAppSelector } from "../store/hooks";
import "./CandidateRegistrationPage.css";

const API_URL = "https://localhost:7227/api/Candidates";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

const ALLOWED_VIDEO_EXTENSIONS = [
  ".mp4",
  ".avi",
  ".mov",
];

interface CandidateRegistrationPageProps {
  onCandidateCreated: () => void;
}

interface EligibilityResponse {
  eligible: boolean;
  partyJoinDate: string | null;
  eligibleFrom: string | null;
  alreadyCandidate: boolean;
}

function formatDate(date: string | null): string {
  if (!date) return "לא ידוע";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "לא ידוע";
  }

  return parsed.toLocaleDateString("he-IL");
}

function hasAllowedExtension(
  file: File,
  extensions: string[]
): boolean {
  const name = file.name.toLowerCase();

  return extensions.some((ext) =>
    name.endsWith(ext)
  );
}

async function getServerError(
  response: Response
): Promise<string> {
  const result = await response
    .json()
    .catch(() => null);

  if (typeof result?.message === "string") {
    return result.message;
  }

  if (typeof result?.title === "string") {
    return result.title;
  }

  if (result?.errors) {
    const messages = Object.values(result.errors)
      .flat()
      .filter(
        (value): value is string =>
          typeof value === "string"
      );

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (response.status === 401) {
    return "פג תוקף ההתחברות. יש להתחבר מחדש.";
  }

  if (response.status === 403) {
    return "אין לך הרשאה לבצע פעולה זו.";
  }

  if (response.status === 409) {
    return "כבר קיימת מועמדות עבור המשתמש הזה.";
  }

  return "אירעה שגיאה. נסי שוב.";
}

export default function CandidateRegistrationPage({
  onCandidateCreated,
}: CandidateRegistrationPageProps) {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const [eligibility, setEligibility] =
    useState<EligibilityResponse | null>(null);

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [slogan, setSlogan] = useState("");
  const [resume, setResume] = useState("");

  const [image, setImage] = useState<File | null>(
    null
  );
  const [video, setVideo] = useState<File | null>(
    null
  );

  // בדיקת זכאות של המשתמש המחובר
  useEffect(() => {
    let cancelled = false;

    const checkEligibility = async () => {
      setChecking(true);
      setError("");
      setEligibility(null);

      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/eligibility`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            await getServerError(response)
          );
        }

        const data: EligibilityResponse =
          await response.json();

        if (!cancelled) {
          setEligibility(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "לא ניתן לבדוק את הזכאות."
          );
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    void checkEligibility();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // בחירת תמונה
  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setImage(null);
      return;
    }

    if (
      !hasAllowedExtension(
        file,
        ALLOWED_IMAGE_EXTENSIONS
      )
    ) {
      setError(
        "יש לבחור תמונה בפורמט JPG, JPEG, PNG או WEBP."
      );
      setImage(null);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(
        "גודל התמונה לא יכול לעלות על 5MB."
      );
      setImage(null);
      e.target.value = "";
      return;
    }

    setImage(file);
  };

  // בחירת סרטון
  const handleVideoChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setVideo(null);
      return;
    }

    if (
      !hasAllowedExtension(
        file,
        ALLOWED_VIDEO_EXTENSIONS
      )
    ) {
      setError(
        "יש לבחור סרטון בפורמט MP4, AVI או MOV."
      );
      setVideo(null);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError(
        "גודל הסרטון לא יכול לעלות על 20MB."
      );
      setVideo(null);
      e.target.value = "";
      return;
    }

    setVideo(file);
  };

  // שליחת המועמדות לשרת
  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (submitting) return;

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "יש להתחבר כדי להגיש מועמדות."
      );
      return;
    }

    if (!eligibility?.eligible) {
      setError(
        "אינך זכאית כרגע להגיש מועמדות."
      );
      return;
    }

    const cleanSlogan = slogan.trim();
    const cleanResume = resume.trim();

    if (!cleanSlogan || !cleanResume) {
      setError(
        "יש למלא סיסמת בחירות וקורות חיים."
      );
      return;
    }

    if (cleanSlogan.length > 100) {
      setError(
        "סיסמת הבחירות מוגבלת ל-100 תווים."
      );
      return;
    }

    if (cleanResume.length > 2000) {
      setError(
        "קורות החיים מוגבלים ל-2000 תווים."
      );
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      // פרטי המועמדות בלבד.
      // השרת מזהה את המשתמש מהטוקן.
      formData.append("Slogan", cleanSlogan);
      formData.append("Resume", cleanResume);

      if (image) {
        formData.append("ImageFile", image);
      }

      if (video) {
        formData.append("VideoFile", video);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await getServerError(response)
        );
      }

      // המועמדות נשמרה בהצלחה
      setSuccess(
        "המועמדות הוגשה בהצלחה!"
      );

      // עדכון סטטוס הזכאות
      setEligibility((prev) =>
        prev
          ? {
              ...prev,
              eligible: false,
              alreadyCandidate: true,
            }
          : prev
      );

      // הודעה ל-App כדי שה-Header יתעדכן
      onCandidateCreated();

      // ניקוי הטופס
      setSlogan("");
      setResume("");
      setImage(null);
      setVideo(null);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בהגשת המועמדות."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="candidate-registration-page"
      dir="rtl"
    >
      <div className="candidate-registration-container">

        <header className="candidate-registration-hero">
          <span>תנופה | הדרך להנהגה</span>

          <h1>הגשת מועמדות</h1>

          <p>
            רוצים לקחת חלק בהובלת המפלגה?
            בדקו את זכאותכם והגישו מועמדות.
          </p>
        </header>

        {!token ? (
          <section className="candidate-registration-message">
            <h2>יש להתחבר למערכת</h2>

            <p>
              כדי להגיש מועמדות יש להתחבר
              לחשבון האישי שלך.
            </p>
          </section>

        ) : checking ? (
          <section className="candidate-registration-message">
            <h2>בודקים את הזכאות שלך...</h2>

            <p>
              אנחנו בודקים את הוותק שלך במפלגה.
            </p>
          </section>

        ) : !eligibility ? (
          <section className="candidate-registration-message">
            <h2>
              לא ניתן להציג את טופס המועמדות
            </h2>

            <p>
              בדיקת הזכאות לא הושלמה.
              נסי לרענן את העמוד.
            </p>
          </section>

        ) : eligibility.alreadyCandidate ? (
          <section className="candidate-registration-message">
            <h2>
              {success
                ? "המועמדות הוגשה בהצלחה!"
                : "כבר הגשת מועמדות"}
            </h2>

            <p>
              המועמדות שלך רשומה במערכת.
              לא ניתן להגיש מועמדות נוספת.
            </p>
          </section>

        ) : !eligibility.eligible ? (
          <section className="candidate-registration-message">
            <h2>עדיין אין לך מספיק ותק</h2>

            <p>
              להגשת מועמדות נדרשות לפחות
              ארבע שנות חברות במפלגה.
            </p>

            <p>
              תאריך ההצטרפות שלך:{" "}
              <strong>
                {formatDate(
                  eligibility.partyJoinDate
                )}
              </strong>
            </p>

            <p>
              תאריך הזכאות שלך:{" "}
              <strong>
                {formatDate(
                  eligibility.eligibleFrom
                )}
              </strong>
            </p>
          </section>

        ) : (
          <form
            className="candidate-registration-form"
            onSubmit={handleSubmit}
          >
            <h2>פרטי המועמדות</h2>

            <p>
              נמצאו לפחות ארבע שנות ותק.
              ניתן להגיש מועמדות.
            </p>

            <label htmlFor="slogan">
              סיסמת הבחירות *
            </label>

            <input
              id="slogan"
              type="text"
              value={slogan}
              onChange={(e) =>
                setSlogan(e.target.value)
              }
              placeholder="לדוגמה: ביחד מובילים קדימה"
              maxLength={100}
              required
              disabled={submitting}
            />

            <label htmlFor="resume">
              קורות חיים *
            </label>

            <textarea
              id="resume"
              value={resume}
              onChange={(e) =>
                setResume(e.target.value)
              }
              placeholder="ספרו על עצמכם, הניסיון שלכם והחזון שלכם"
              rows={7}
              maxLength={2000}
              required
              disabled={submitting}
            />

            <label htmlFor="profile-image">
              תמונת פרופיל
            </label>

            <input
              id="profile-image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleImageChange}
              disabled={submitting}
            />

            <small>
              JPG, PNG או WEBP — עד 5MB
            </small>

            {image && (
              <p>
                התמונה שנבחרה: {image.name}
              </p>
            )}

            <label htmlFor="video">
              סרטון הצגה (לא חובה)
            </label>

            <input
              id="video"
              type="file"
              accept=".mp4,.avi,.mov"
              onChange={handleVideoChange}
              disabled={submitting}
            />

            <small>
              MP4, AVI או MOV — עד 20MB
            </small>

            {video && (
              <p>
                הסרטון שנבחר: {video.name}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "שולח מועמדות..."
                : "הגשת מועמדות"}
            </button>
          </form>
        )}

        {error && (
          <p
            className="candidate-form-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="candidate-form-success"
            role="status"
          >
            {success}
          </p>
        )}

      </div>
    </main>
  );
}
