
import { useState } from "react";
import type { FormEvent } from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "../store/hooks";

import {
  loginStep1,
  verifyLoginCode,
} from "../store/Auth/authThunks";

import "./LoginPage.css";

interface LoginPageProps {
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
}

export default function LoginPage({
  onLoginSuccess,
  onRegisterClick,
}: LoginPageProps) {
  const dispatch = useAppDispatch();

  const { loading, error: authError } = useAppSelector(
    (state) => state.auth
  );

  const [step, setStep] = useState<1 | 2>(1);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // בדיקת 9 ספרות בתעודת זהות
  const isValidIsraeliId = (id: string) => {
    return /^\d{9}$/.test(id);

    /*
    // בדיקת ספרת ביקורת - אפשר להחזיר בהמשך
    const sum = id.split("").reduce((total, digit, i) => {
      const value = Number(digit) * (i % 2 === 0 ? 1 : 2);
      return total + (value > 9 ? value - 9 : value);
    }, 0);

    return sum % 10 === 0;
    */
  };

  // שלב ראשון: סיסמה ושליחת קוד אימות
  const handleCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidIsraeliId(identity)) {
      setError("יש להזין מספר תעודת זהות בן 9 ספרות");
      return;
    }

    if (!password.trim()) {
      setError("יש להזין סיסמה");
      return;
    }

    const result = await dispatch(
      loginStep1({
        idNumber: identity,
        password,
      })
    );

    if (loginStep1.fulfilled.match(result)) {
      setPassword("");
      setCode("");
      setStep(2);
    }
  };

  // שלב שני: אימות הקוד מול השרת
  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("יש להזין קוד אימות בן 6 ספרות");
      return;
    }

    const result = await dispatch(
      verifyLoginCode({
        idNumber: identity,
        code,
      })
    );

    if (verifyLoginCode.fulfilled.match(result)) {
      const token = result.payload?.token;

      if (typeof token === "string" && token.length > 0) {
        onLoginSuccess();
      } else {
        setError("השרת לא החזיר טוקן תקין");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-glow" />

      <div className="login-shell">

        {/* צד ההסבר */}
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
            התחברו לאזור האישי שלכם,
            הכירו את המועמדים
            וקחו חלק בעיצוב העתיד.
          </p>

          <div className="login-intro-feature">
            <span className="feature-icon">✓</span>
            תהליך התחברות פשוט ומאובטח
          </div>

          <div className="login-intro-feature">
            <span className="feature-icon">✓</span>
            אימות נוסף באמצעות דוא"ל
          </div>
        </div>

        {/* כרטיס ההתחברות */}
        <div className="login-card">
          <div className="login-card-top">
            <div className="login-lock">♙</div>
            <span>כניסה מאובטחת</span>
          </div>

          <div className="login-progress">
            {[1, 2].map((number) => (
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
            שלב {step} מתוך 2
          </div>

          {/* שלב 1 - תעודת זהות וסיסמה */}
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
                >
                  {showPassword ? "הסתר" : "הצג"}
                </button>
              </div>

              {(error || authError) && (
                <div className="login-error" role="alert">
                  {error || authError}
                </div>
              )}

              <button
                className="login-main-btn"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "בודקים את הפרטים..."
                  : "המשך לאימות זהות"}
                <span>←</span>
              </button>
            </form>
          )}

          {/* שלב 2 - קוד אימות */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <div className="login-code-symbol">✉</div>

              <h2>רק עוד שלב קטן</h2>

              <p className="login-subtitle">
                אם פרטי ההתחברות אושרו,
                קוד אימות בן 6 ספרות נשלח
                לכתובת המייל הרשומה שלכם.
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
                  setCode(
                    e.target.value.replace(/\D/g, "")
                  )
                }
              />

              {(error || authError) && (
                <div className="login-error" role="alert">
                  {error || authError}
                </div>
              )}

              <button
                type="submit"
                className="login-main-btn"
                disabled={loading}
              >
                {loading
                  ? "מאמתים את הקוד..."
                  : "אימות וכניסה לאתר"}
                <span>←</span>
              </button>

              <button
                type="button"
                className="login-back"
                disabled={loading}
                onClick={() => {
                  setError("");
                  setCode("");
                  setStep(1);
                }}
              >
                חזרה לפרטי ההתחברות
              </button>
            </form>
          )}

          {/* הודעת אבטחה */}
          <div className="login-card-footer">
            <span>♢</span>
            הפרטים שלכם נשמרים בסביבה מאובטחת
          </div>

          {/* מעבר להרשמה - בתוך הכרטיס */}
          {step === 1 && (
            <div className="login-register-link">
              <span>עדיין אין לך חשבון?</span>

              <button
                type="button"
                onClick={onRegisterClick}
              >
                להרשמה
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
