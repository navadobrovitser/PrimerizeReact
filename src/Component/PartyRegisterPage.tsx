
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./PartyRegisterPage.css";

// =============================================
// Types
// =============================================

interface RegisterData {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
}

interface PartyRegisterPageProps {
  onSwitchToLogin?: () => void;
  onRegisterSuccess?: () => void;
}

const API_URL =
  "https://localhost:7227/api/Users/register";

const initialData: RegisterData = {
  id: "",
  name: "",
  email: "",
  phone: "",
  gender: "",
};

// =============================================
// Component
// =============================================

export default function PartyRegisterPage({
  onSwitchToLogin,
  onRegisterSuccess,
}: PartyRegisterPageProps) {
  const [data, setData] = useState<RegisterData>(
    initialData
  );

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // =============================================
  // Update fields
  // =============================================

  const update = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // =============================================
  // Validation
  // =============================================

  const validate = (): string => {
    const cleanId = data.id.trim();

    if (!/^\d{9}$/.test(cleanId)) {
      return "תעודת זהות חייבת להכיל בדיוק 9 ספרות.";
    }

    if (!data.name.trim()) {
      return "יש להזין שם מלא.";
    }

    if (data.name.trim().length > 50) {
      return "השם לא יכול להכיל יותר מ־50 תווים.";
    }

    const email = data.email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "כתובת האימייל אינה תקינה.";
    }

    // Remove spaces and hyphens from phone
    const cleanPhone = data.phone.replace(
      /[\s-]/g,
      ""
    );

    if (!/^05\d{8}$/.test(cleanPhone)) {
      return "יש להזין מספר טלפון נייד תקין בן 10 ספרות.";
    }

    if (!data.gender) {
      return "יש לבחור מגדר.";
    }

    if (!acceptedTerms) {
      return "יש לאשר את תנאי החברות.";
    }

    return "";
  };

  // =============================================
  // Submit registration
  // =============================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data.id.trim(),
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone.replace(/[\s-]/g, ""),
          gender: data.gender,
        }),
      });

      if (!response.ok) {
        let message = "ההרשמה נכשלה. נסו שוב.";

        try {
          const result = await response.json();

          if (result.errors) {
            message = Object.values(result.errors)
              .flat()
              .join(" ");
          } else if (result.detail) {
            message = result.detail;
          } else if (result.message) {
            message = result.message;
          } else if (result.title) {
            message = result.title;
          }
        } catch {
          // Server did not return JSON
        }

        throw new Error(message);
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בהרשמה."
      );
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // JSX
  // =============================================

  return (
    <div className="party-register-page" dir="rtl">
      <div className="party-register-layout">
        {/* =====================================
            Side section
        ===================================== */}

        <aside className="party-register-side">
          <div className="party-side-content">
            <div className="party-brand">
              <span className="party-brand-symbol">
                ✦
              </span>
              <span>תנופה</span>
            </div>

            <span className="party-side-badge">
              הצטרפות למפלגה
            </span>

            <h1>
              העתיד מתחיל
              <br />
              <span>במעורבות שלך.</span>
            </h1>

            <p>
              כאן מתחיל תהליך ההרשמה
              לחברות במפלגת תנופה.
              מלאו את הפרטים האישיים
              ליצירת חשבון במערכת.
            </p>

            <div className="party-side-line" />

            <div className="party-side-feature">
              <span>01</span>
              <div>
                <strong>הרשמה פשוטה</strong>
                <small>מילוי פרטים אישיים</small>
              </div>
            </div>

            <div className="party-side-feature">
              <span>02</span>
              <div>
                <strong>אישור מנהל</strong>
                <small>
                  בדיקת הבקשה ואישור ההצטרפות
                </small>
              </div>
            </div>

            <div className="party-side-feature">
              <span>03</span>
              <div>
                <strong>הפעלת החשבון</strong>
                <small>
                  קבלת קישור להגדרת סיסמה במייל
                </small>
              </div>
            </div>
          </div>

          <div className="party-side-decoration" />
        </aside>

        {/* =====================================
            Main section
        ===================================== */}

        <main className="party-register-main">
          <div className="party-register-card">
            {success ? (
              // =================================
              // Success
              // =================================

              <div className="party-success">
                <div className="party-success-icon">
                  ✓
                </div>

                <h2>בקשת ההצטרפות התקבלה!</h2>

                <p>
                  הפרטים שלך נשמרו בהצלחה.
                  <br />
                  הבקשה ממתינה כעת לאישור
                  מנהל המערכת.
                  <br />
                  לאחר האישור יישלח אליך מייל
                  עם קישור להגדרת הסיסמה
                  האישית שלך.
                </p>

                <button
                  type="button"
                  className="party-primary-button"
                  onClick={
                    onSwitchToLogin ??
                    onRegisterSuccess
                  }
                >
                  חזרה להתחברות ←
                </button>
              </div>
            ) : (
              <>
                {/* =============================
                    Form heading
                ============================= */}

                <div className="party-form-heading">
                  <span className="party-form-eyebrow">
                    הצטרפות לתנופה
                  </span>

                  <h2>נעים להכיר!</h2>

                  <p>
                    מלאו את הפרטים הבאים
                    כדי לשלוח בקשת הצטרפות.
                  </p>
                </div>

                {/* =============================
                    Registration form
                ============================= */}

                <form
                  className="party-register-form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="party-form-grid">
                    {/* Full name */}

                    <div className="party-field">
                      <label htmlFor="register-name">
                        שם מלא *
                      </label>

                      <input
                        id="register-name"
                        name="name"
                        type="text"
                        value={data.name}
                        onChange={update}
                        placeholder="השם המלא שלך"
                        maxLength={50}
                        autoComplete="name"
                        required
                      />
                    </div>

                    {/* ID */}

                    <div className="party-field">
                      <label htmlFor="register-id">
                        תעודת זהות *
                      </label>

                      <input
                        id="register-id"
                        name="id"
                        type="text"
                        value={data.id}
                        onChange={update}
                        placeholder="9 ספרות"
                        maxLength={9}
                        inputMode="numeric"
                        required
                      />
                    </div>

                    {/* Email */}

                    <div className="party-field">
                      <label htmlFor="register-email">
                        כתובת אימייל *
                      </label>

                      <input
                        id="register-email"
                        name="email"
                        type="email"
                        value={data.email}
                        onChange={update}
                        placeholder="example@gmail.com"
                        autoComplete="email"
                        required
                      />
                    </div>

                    {/* Phone */}

                    <div className="party-field">
                      <label htmlFor="register-phone">
                        טלפון נייד *
                      </label>

                      <input
                        id="register-phone"
                        name="phone"
                        type="tel"
                        value={data.phone}
                        onChange={update}
                        placeholder="0501234567"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                      />
                    </div>

                    {/* Gender */}

                    <div className="party-field">
                      <label htmlFor="register-gender">
                        מגדר *
                      </label>

                      <select
                        id="register-gender"
                        name="gender"
                        value={data.gender}
                        onChange={update}
                        required
                      >
                        <option value="">
                          בחירת מגדר
                        </option>

                        <option value="Female">
                          נקבה
                        </option>

                        <option value="Male">
                          זכר
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* =============================
                      Terms
                  ============================= */}

                  <label className="party-check-row party-terms">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) =>
                        setAcceptedTerms(
                          e.target.checked
                        )
                      }
                    />

                    <span>
                      קראתי ואני מסכים/ה
                      לתנאי החברות ולמדיניות
                      הפרטיות של המערכת.
                    </span>
                  </label>

                  {/* =============================
                      Error message
                  ============================= */}

                  {error && (
                    <div
                      className="party-error"
                      role="alert"
                    >
                      ⚠ {error}
                    </div>
                  )}

                  {/* =============================
                      Submit button
                  ============================= */}

                  <button
                    type="submit"
                    className="party-primary-button"
                    disabled={loading}
                  >
                    {loading
                      ? "שולחים את הבקשה..."
                      : "שליחת בקשת הצטרפות ←"}
                  </button>
                </form>

                {/* =============================
                    Login link
                ============================= */}

                <div className="party-login-link">
                  כבר יש לך חשבון?{" "}

                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                  >
                    להתחברות
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
