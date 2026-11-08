
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./PartyRegisterPage.css";

interface RegisterData {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
}

interface PartyRegisterPageProps {
  onSwitchToLogin?: () => void;
  onRegisterSuccess?: () => void;
}

const API_URL = "https://localhost:7001/api/Users";

const initialData: RegisterData = {
  id: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "",
};

export default function PartyRegisterPage({
  onSwitchToLogin,
  onRegisterSuccess,
}: PartyRegisterPageProps) {
  const [data, setData] = useState(initialData);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const validate = (): string => {
    if (!/^\d{9}$/.test(data.id))
      return "תעודת זהות חייבת להכיל בדיוק 9 ספרות.";

    if (!data.name.trim())
      return "יש להזין שם מלא.";

    if (data.name.length > 50)
      return "השם לא יכול להכיל יותר מ־50 תווים.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      return "כתובת האימייל אינה תקינה.";

    if (data.password.length < 8)
      return "הסיסמה חייבת להכיל לפחות 8 תווים.";

    if (data.password !== confirmPassword)
      return "הסיסמאות אינן תואמות.";

    if (!/^\+?[\d\s()-]{7,20}$/.test(data.phone))
      return "מספר הטלפון אינו תקין.";

    if (!data.gender)
      return "יש לבחור מגדר.";

    if (!acceptedTerms)
      return "יש לאשר את תנאי החברות.";

    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
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
          id: data.id,
          name: data.name.trim(),
          email: data.email.trim(),
          password: data.password,
          phone: data.phone.trim(),
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
          // השרת לא החזיר JSON
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

  return (
    <div className="party-register-page" dir="rtl">
      <div className="party-register-layout">

        <aside className="party-register-side">
          <div className="party-side-content">
            <div className="party-brand">
              <span className="party-brand-symbol">✦</span>
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
                <strong>חשבון אישי</strong>
                <small>גישה למידע ולשירותי החברים</small>
              </div>
            </div>

            <div className="party-side-feature">
              <span>03</span>
              <div>
                <strong>ניהול מאובטח</strong>
                <small>שמירה על פרטיות המשתמשים</small>
              </div>
            </div>
          </div>

          <div className="party-side-decoration" />
        </aside>

        <main className="party-register-main">
          <div className="party-register-card">

            {success ? (
              <div className="party-success">
                <div className="party-success-icon">✓</div>

                <h2>ההרשמה בוצעה בהצלחה!</h2>

                <p>
                  החשבון נוצר במערכת.
                  כעת אפשר לעבור להתחברות.
                </p>

                <button
                  className="party-primary-button"
                  onClick={
                    onSwitchToLogin ??
                    onRegisterSuccess
                  }
                >
                  מעבר להתחברות ←
                </button>
              </div>
            ) : (
              <>
                <div className="party-form-heading">
                  <span className="party-form-eyebrow">
                    הצטרפות לתנופה
                  </span>

                  <h2>נעים להכיר!</h2>

                  <p>
                    מלאו את הפרטים הבאים
                    כדי ליצור חשבון חדש.
                  </p>
                </div>

                <form
                  className="party-register-form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="party-form-grid">

                    <div className="party-field">
                      <label htmlFor="register-name">
                        שם מלא *
                      </label>

                      <input
                        id="register-name"
                        name="name"
                        value={data.name}
                        onChange={update}
                        placeholder="השם המלא שלך"
                        maxLength={50}
                        autoComplete="name"
                        required
                      />
                    </div>

                    <div className="party-field">
                      <label htmlFor="register-id">
                        תעודת זהות *
                      </label>

                      <input
                        id="register-id"
                        name="id"
                        value={data.id}
                        onChange={update}
                        placeholder="9 ספרות"
                        maxLength={9}
                        inputMode="numeric"
                        required
                      />
                    </div>

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
                        required
                      />
                    </div>

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
                        <option value="">בחירת מגדר</option>
                        <option value="Female">נקבה</option>
                        <option value="Male">זכר</option>
                      </select>
                    </div>

                    <div className="party-field">
                      <label htmlFor="register-password">
                        סיסמה *
                      </label>

                      <input
                        id="register-password"
                        name="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={data.password}
                        onChange={update}
                        placeholder="לפחות 8 תווים"
                        autoComplete="new-password"
                        required
                      />
                    </div>

                    <div className="party-field party-field-full">
                      <label htmlFor="register-confirm">
                        אימות סיסמה *
                      </label>

                      <input
                        id="register-confirm"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        placeholder="הקלידו שוב את הסיסמה"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  <label className="party-check-row">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) =>
                        setShowPassword(e.target.checked)
                      }
                    />
                    הצגת סיסמאות
                  </label>

                  <div className="party-form-divider" />

                  <label className="party-check-row party-terms">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) =>
                        setAcceptedTerms(e.target.checked)
                      }
                    />

                    <span>
                      קראתי ואני מסכים/ה
                      לתנאי החברות ולמדיניות
                      הפרטיות של המערכת.
                    </span>
                  </label>

                  {error && (
                    <div
                      className="party-error"
                      role="alert"
                    >
                      ⚠ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="party-primary-button"
                    disabled={loading}
                  >
                    {loading
                      ? "מבצע הרשמה..."
                      : "יצירת חשבון ←"}
                  </button>
                </form>

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
