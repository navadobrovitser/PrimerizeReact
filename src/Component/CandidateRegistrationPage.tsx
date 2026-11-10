import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAppSelector } from "../store/hooks";
import "./CandidateRegistrationPage.css";

const API_URL = "https://localhost:7227/api/Candidates";

interface EligibilityResponse {
  eligible: boolean;
  partyJoinDate: string;
  eligibleFrom: string;
  alreadyCandidate: boolean;
}

export default function CandidateRegistrationPage() {
  const token = useAppSelector((state) => state.auth.token);

  const [eligibility, setEligibility] =
    useState<EligibilityResponse | null>(null);

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [slogan, setSlogan] = useState("");
  const [resume, setResume] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    const checkEligibility = async () => {
      try {
        const response = await fetch(
          `${API_URL}/eligibility`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("לא ניתן לבדוק את הזכאות");
        }

        const data: EligibilityResponse =
          await response.json();

        setEligibility(data);
      } catch {
        setError("אירעה שגיאה בבדיקת הזכאות");
      } finally {
        setChecking(false);
      }
    };

    checkEligibility();
  }, [token]);

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setImage(e.target.files?.[0] ?? null);
  };

  const handleVideoChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setVideo(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!token || !eligibility?.eligible) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    const formData = new FormData();

    formData.append("Slogan", slogan);
    formData.append("Resume", resume);

    if (image) {
      formData.append("ProfileImage", image);
    }

    if (video) {
      formData.append("ExplanationVideo", video);
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.message || "הגשת המועמדות נכשלה"
        );
      }

      setSuccess("המועמדות הוגשה בהצלחה!");
      setEligibility((prev) =>
        prev
          ? { ...prev, alreadyCandidate: true, eligible: false }
          : prev
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="candidate-registration-page" dir="rtl">
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
            <p>רק משתמשים רשומים יכולים להגיש מועמדות.</p>
          </section>
        ) : checking ? (
          <section className="candidate-registration-message">
            <p>בודקים את הזכאות שלך...</p>
          </section>
        ) : eligibility?.alreadyCandidate ? (
          <section className="candidate-registration-message">
            <h2>המועמדות כבר רשומה במערכת</h2>
            <p>לא ניתן להגיש מועמדות נוספת.</p>
          </section>
        ) : eligibility && !eligibility.eligible ? (
          <section className="candidate-registration-message">
            <h2>עדיין אין לך מספיק ותק</h2>
            <p>
              להגשת מועמדות נדרשות לפחות 4 שנות חברות במפלגה.
            </p>
            <p>
              תאריך הזכאות שלך:{" "}
              <strong>
                {new Date(
                  eligibility.eligibleFrom
                ).toLocaleDateString("he-IL")}
              </strong>
            </p>
          </section>
        ) : eligibility?.eligible ? (
          <form
            className="candidate-registration-form"
            onSubmit={handleSubmit}
          >
            <h2>פרטי המועמדות</h2>

            <label htmlFor="slogan">סיסמת הבחירות</label>
            <input
              id="slogan"
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="הסיסמה שתייצג את המועמדות שלך"
              required
              maxLength={200}
            />

            <label htmlFor="resume">קורות חיים</label>
            <textarea
              id="resume"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="ספרו על הניסיון והפעילות שלכם"
              rows={7}
              required
            />

            <label htmlFor="profile-image">תמונת פרופיל</label>
            <input
              id="profile-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            <label htmlFor="video">סרטון הצגה (לא חובה)</label>
            <input
              id="video"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "שולח מועמדות..." : "הגשת מועמדות"}
            </button>
          </form>
        ) : null}

        {error && <p className="candidate-form-error" role="alert">{error}</p>}
        {success && <p className="candidate-form-success" role="status">{success}</p>}
      </div>
    </main>
  );
}