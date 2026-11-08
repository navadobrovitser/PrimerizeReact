
import { useState } from "react";
import "./LoginPage.css";

type LoginStep = 1 | 2 | 3;
type VerificationMethod = "email" | "sms";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({
  onLoginSuccess,
}: LoginPageProps) {
  const [step, setStep] = useState<LoginStep>(1);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [method, setMethod] =
    useState<VerificationMethod>("email");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // בדיקת ספרת ביקורת בתעודת זהות ישראלית
  const isValidIsraeliId = (id: string) => {
    if (!/^\d{9}$/.test(id)) return false;

    const sum = id.split("").reduce((total, digit, i) => {
      const value = Number(digit) * (i % 2 === 0 ? 1 : 2);
      return total + (value > 9 ? value - 9 : value);
    }, 0);

    return sum % 10 === 0;
  };

  const handleCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidIsraeliId(identity)) {
      setError("יש להזין מספר תעודת זהות תקין בן 9 ספרות");
      return;
    }

    if (!password.trim()) {
      setError("יש להזין סיסמה");
      return;
    }

    // כאן נחבר בהמשך את בדיקת הפרטים מול השרת
    setStep(2);
  };

  const handleSendCode = () => {
    setError("");
    setCode("");

    // כאן נחבר שליחת קוד אמיתי דרך השרת
    setStep(3);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("יש להזין קוד אימות בן 6 ספרות");
      return;
    }

    // כאן נבצע אימות קוד מול השרת.
    // אין לאשר התחברות לפני תשובת אימות מוצלחת.
    setError("אימות הקוד יפעל לאחר חיבור לשרת.");
  };

  return (
    <div className="login-page">
      <div className="login-glow" />

      <div className="login-shell">
        <div className="login-intro">
          <div className="login-intro-badge">
            <span>✦</span> האזור האישי של תנופה
          </div>

          <h1>
            הדרך להשפיע
            <br />
            <span>מתחילה כאן.</span>
          </h1>

          <p>
            התחברו לאזור האישי שלכם, הכירו את
            המועמדים וקחו חלק בעיצוב העתיד.
          </p>

          <div className="login-intro-feature">
            <span className="feature-icon">✓</span>
            תהליך התחברות פשוט ומאובטח
          </div>

          <div className="login-intro-feature">
            <span className="feature-icon">✓</span>
            אימות נוסף באמצעות SMS או דוא"ל
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-top">
            <div className="login-lock">♙</div>
            <span>כניסה מאובטחת</span>
          </div>

          <div className="login-progress">
            {[1, 2, 3].map((number) => (
              <div
                key={number}
                className={
                  "login-progress-line " +
                  (step >= number ? "active" : "")
                }
              />
            ))}
          </div>

          <div className="login-step-label">
            שלב {step} מתוך 3
          </div>

          {step === 1 && (
            <form onSubmit={handleCredentials}>
              <h2>שמחים שחזרתם!</h2>
              <p className="login-subtitle">
                הזינו את פרטי ההתחברות שלכם
              </p>

              <label htmlFor="login-id">
                מספר תעודת זהות
              </label>
              <div className="login-field">
                <input
                  id="login-id"
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  autoComplete="username"
                  placeholder="9 ספרות"
                  value={identity}
                  onChange={(e) =>
                    setIdentity(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                />
                <span>♙</span>
              </div>

              <label htmlFor="login-password">
                סיסמה
              </label>
              <div className="login-field">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="הזינו סיסמה"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "הסתר סיסמה"
                      : "הצג סיסמה"
                  }
                >
                  {showPassword ? "הסתר" : "הצג"}
                </button>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <button className="login-main-btn" type="submit">
                המשך לאימות זהות
                <span>←</span>
              </button>
            </form>
          )}

          {step === 2 && (
            <div>
              <h2>איך תרצו לקבל קוד?</h2>
              <p className="login-subtitle">
                בחרו את הדרך הנוחה לכם לקבלת
                קוד אימות חד־פעמי.
              </p>

              <div className="login-methods">
                <button
                  type="button"
                  className={
                    "login-method " +
                    (method === "email" ? "selected" : "")
                  }
                  onClick={() => setMethod("email")}
                >
                  <span className="method-icon">✉</span>
                  <span className="method-text">
                    <strong>שליחה לדוא"ל</strong>
                    <small>קבלת קוד לתיבת המייל</small>
                  </span>
                  <span className="method-radio" />
                </button>

                <button
                  type="button"
                  className={
                    "login-method " +
                    (method === "sms" ? "selected" : "")
                  }
                  onClick={() => setMethod("sms")}
                >
                  <span className="method-icon">▣</span>
                  <span className="method-text">
                    <strong>שליחה ב־SMS</strong>
                    <small>קבלת קוד לטלפון הנייד</small>
                  </span>
                  <span className="method-radio" />
                </button>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="button"
                className="login-main-btn"
                onClick={handleSendCode}
              >
                שלחו לי קוד אימות
                <span>←</span>
              </button>

              <button
                type="button"
                className="login-back"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
              >
                חזרה לפרטי ההתחברות
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleVerifyCode}>
              <div className="login-code-symbol">✉</div>

              <h2>רק עוד שלב קטן</h2>
              <p className="login-subtitle">
                הזינו את הקוד בן 6 הספרות
                שנשלח אליכם ב־
                {method === "email" ? "דוא״ל" : "SMS"}.
              </p>

              <label htmlFor="verification-code">
                קוד אימות
              </label>

              <input
                id="verification-code"
                className="login-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                dir="ltr"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, ""))
                }
              />

              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-main-btn"
              >
                אימות וכניסה לאתר
                <span>←</span>
              </button>

              <button
                type="button"
                className="login-back"
                onClick={() => {
                  setError("");
                  setCode("");
                  setStep(2);
                }}
              >
                שינוי אופן קבלת הקוד
              </button>
            </form>
          )}

          <div className="login-card-footer">
            <span>♢</span>
            הפרטים שלכם נשמרים בסביבה מאובטחת
          </div>
        </div>
      </div>
    </div>
  );
}
