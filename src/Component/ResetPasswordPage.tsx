
import { useState } from "react";
import type { FormEvent } from "react";
import { API_ORIGIN } from "../config/api";
import "./ResetPasswordPage.css";
import { usePasswordVisibility } from "../hooks/usePasswordVisibility";
interface Props {
  onBack: () => void;
}

interface ApiResponse {
  message?: string;
}

export default function ResetPasswordPage({
  onBack,
}: Props) {
  const token = new URLSearchParams(
    window.location.search
  ).get("resetToken");

  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
const {
  isVisible: showPassword,
  toggleVisibility,
  inputType,
} = usePasswordVisibility();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // קריאת תשובה בטוחה גם כשהשרת מחזיר גוף ריק
  const readResponse = async (
    response: Response
  ): Promise<ApiResponse> => {
    const text = await response.text();

    if (!text.trim()) {
      return {};
    }

    try {
      return JSON.parse(text) as ApiResponse;
    } catch {
      return {};
    }
  };

  // =====================================
  // שליחת קישור לאיפוס סיסמה
  // =====================================
  const sendResetLink = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!/^\d{9}$/.test(idNumber)) {
      setError("יש להזין תעודת זהות בת 9 ספרות");
      return;
    }

    if (!email.trim()) {
      setError("יש להזין כתובת מייל");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_ORIGIN}/api/Auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idNumber,
            email: email.trim(),
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            `הבקשה נכשלה (שגיאה ${response.status})`
        );
      }

      setSuccess(
        data.message ||
          "אם הפרטים תואמים לחשבון פעיל, יישלח קישור לאיפוס הסיסמה למייל."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בשליחת הבקשה"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // שמירת סיסמה חדשה
  // =====================================
  const saveNewPassword = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("קישור האיפוס אינו תקין");
      return;
    }

    if (password.length < 8) {
      setError(
        "הסיסמה חייבת להכיל לפחות 8 תווים"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_ORIGIN}/api/Auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            `איפוס הסיסמה נכשל (שגיאה ${response.status})`
        );
      }

      setPassword("");
      setConfirmPassword("");

      setSuccess("הסיסמה עודכנה בהצלחה!");

      // הסרת הטוקן מכתובת הדפדפן
      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה באיפוס הסיסמה"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reset-page" dir="rtl">
      <section className="reset-card">
        <div className="reset-brand">
          תנופה
        </div>

        <h1>
          {token
            ? "הגדרת סיסמה חדשה"
            : "שכחת את הסיסמה?"}
        </h1>

        <p className="reset-description">
          {token
            ? "בחרו סיסמה חדשה לחשבון שלכם"
            : "הזינו תעודת זהות וכתובת מייל הרשומה במערכת, ונשלח קישור לאיפוס הסיסמה"}
        </p>

        {/* בקשת קישור לאיפוס */}
        {!token && !success && (
          <form onSubmit={sendResetLink}>
            <label htmlFor="reset-id">
              מספר תעודת זהות
            </label>

            <input
              id="reset-id"
              type="text"
              inputMode="numeric"
              maxLength={9}
              autoComplete="username"
              placeholder="9 ספרות"
              value={idNumber}
              onChange={(e) =>
                setIdNumber(
                  e.target.value.replace(/\D/g, "")
                )
              }
              required
            />

            <label htmlFor="reset-email">
              כתובת מייל
            </label>

            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

            <button
              type="submit"
              className="reset-submit"
              disabled={loading}
            >
              {loading
                ? "שולחים..."
                : "שליחת קישור לאיפוס"}
            </button>
          </form>
        )}

        {/* הגדרת סיסמה חדשה */}
        {token && !success && (
          <form onSubmit={saveNewPassword}>
            <label htmlFor="new-password">
              סיסמה חדשה
            </label>

            <input
              id="new-password"
              type={inputType}
              minLength={8}
              autoComplete="new-password"
              placeholder="לפחות 8 תווים"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            <label htmlFor="confirm-password">
              אימות סיסמה
            </label>

            <input
              id="confirm-password"
              type={inputType}
              minLength={8}
              autoComplete="new-password"
              placeholder="הקלידו שוב את הסיסמה"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              required
            />
            <button
  type="button"
  onClick={toggleVisibility}
  aria-pressed={showPassword}
  style={{
    background: "transparent",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    marginTop: "8px",
    marginBottom: "16px",
    fontWeight: 600,
  }}
>
  {showPassword ? "הסתרת הסיסמאות" : "הצגת הסיסמאות"}
</button>
            <button
              type="submit"
              className="reset-submit"
              disabled={loading}
            >
              {loading
                ? "שומרים..."
                : "שמירת הסיסמה החדשה"}
            </button>
          </form>
        )}

        {error && (
          <p className="reset-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="reset-success" role="status">
            {success}
          </p>
        )}

        <button
          type="button"
          className="reset-back"
          onClick={onBack}
        >
          חזרה להתחברות
        </button>
      </section>
    </main>
  );
}
