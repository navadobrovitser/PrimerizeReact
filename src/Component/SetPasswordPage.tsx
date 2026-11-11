
import { useState, type FormEvent } from "react";
import "./SetPasswordPage.css";

interface SetPasswordPageProps {
  onGoToLogin: () => void;
}

export default function SetPasswordPage({
  onGoToLogin,
}: SetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const token = new URLSearchParams(
    window.location.search
  ).get("token");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("הקישור חסר או אינו תקין.");
      return;
    }

    if (password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים.");
      return;
    }

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://localhost:7227/api/Users/set-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.message ||
          "לא ניתן להגדיר סיסמה. ייתכן שתוקף הקישור פג."
        );
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");

      // הסרת הטוקן משורת הכתובת לאחר הצלחה
      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה. נסי שוב."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="set-password-page" dir="rtl">
      <div className="set-password-panel">
        <div className="set-password-brand">תנופה</div>

        {!success ? (
          <>
            <span className="set-password-eyebrow">
              השלמת פתיחת חשבון
            </span>

            <h1>מגדירים סיסמה אישית</h1>

            <p className="set-password-description">
              בקשת ההצטרפות שלך אושרה.
              <br />
              נשאר רק לבחור סיסמה כדי להיכנס למערכת.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="new-password">
                סיסמה חדשה
              </label>

              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="לפחות 8 תווים"
                autoComplete="new-password"
                required
                minLength={8}
              />

              <label htmlFor="confirm-password">
                אימות סיסמה
              </label>

              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="הקלידי שוב את הסיסמה"
                autoComplete="new-password"
                required
              />

              <label className="set-password-show">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) =>
                    setShowPassword(e.target.checked)
                  }
                />
                הצגת הסיסמאות
              </label>

              {error && (
                <p className="set-password-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="set-password-submit"
                type="submit"
                disabled={loading || !token}
              >
                {loading
                  ? "שומרים את הסיסמה..."
                  : "שמירת הסיסמה והמשך"}
              </button>
            </form>

            {!token && (
              <p className="set-password-error">
                לא נמצא קישור תקין להגדרת סיסמה.
              </p>
            )}
          </>
        ) : (
          <div className="set-password-success" role="status">
            <span className="set-password-eyebrow">
              החשבון מוכן
            </span>

            <h1>הסיסמה הוגדרה בהצלחה!</h1>

            <p>
              אפשר להתחבר עכשיו למערכת תנופה
              באמצעות תעודת הזהות והסיסמה שבחרת.
            </p>

            <button
              className="set-password-submit"
              type="button"
              onClick={onGoToLogin}
            >
              מעבר להתחברות
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
