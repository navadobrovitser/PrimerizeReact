import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import "./SecureVotingGate.css";

interface SecureVotingGateProps {
  children: ReactNode;
  onActiveChange: (active: boolean) => void;
  onSessionReset: () => void;
  completed: boolean;
  submitting: boolean;
}

type GateStatus = "welcome" | "active" | "interrupted";

export default function SecureVotingGate({
  children,
  onActiveChange,
  onSessionReset,
  completed,
  submitting,
}: SecureVotingGateProps) {
  const [status, setStatus] = useState<GateStatus>("welcome");
  const [error, setError] = useState("");

  const gateRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<GateStatus>("welcome");
  const completedRef = useRef(completed);
  const submittingRef = useRef(submitting);

  completedRef.current = completed;
  submittingRef.current = submitting;

  const updateStatus = useCallback(
    (next: GateStatus) => {
      statusRef.current = next;
      setStatus(next);
      onActiveChange(next === "active");
    },
    [onActiveChange]
  );

  const interrupt = useCallback(() => {
    if (
      statusRef.current !== "active" ||
      completedRef.current ||
      submittingRef.current
    ) {
      return;
    }

    updateStatus("interrupted");
    onSessionReset();
  }, [onSessionReset, updateStatus]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (
        statusRef.current === "active" &&
        document.fullscreenElement !== gateRef.current
      ) {
        interrupt();
      }
    };

    const handleBlur = () => {
      if (statusRef.current === "active") {
        interrupt();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        interrupt();
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener("blur", handleBlur);
    };
  }, [interrupt]);

  useEffect(() => {
    if (!completed || statusRef.current !== "active") {
      return;
    }

    updateStatus("welcome");

    if (document.fullscreenElement === gateRef.current) {
      void document.exitFullscreen().catch(console.error);
    }
  }, [completed, updateStatus]);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement === gateRef.current) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const enterVoting = async () => {
    setError("");

    if (!gateRef.current) {
      return;
    }

    try {
      await gateRef.current.requestFullscreen();

      updateStatus("active");
    } catch {
      setError(
        "לא ניתן להפעיל מסך מלא. בדקי שהדפדפן מאפשר זאת ונסי שוב."
      );
    }
  };

  const returnToWelcome = () => {
    updateStatus("welcome");
    setError("");

    if (document.fullscreenElement === gateRef.current) {
      void document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={gateRef}
      className="secure-voting-root"
      dir="rtl"
    >
      {status === "active" ? (
        <div className="secure-voting-content">
          {children}
        </div>
      ) : (
        <div className="secure-voting-entrance">
          <div className="secure-voting-card">
            <div className="secure-voting-symbol">✦</div>

            <span className="secure-voting-eyebrow">
              פריימריז תנופה
            </span>

            {status === "interrupted" ? (
              <>
                <h1>ההצבעה הופסקה</h1>

                <p>
                  זוהתה יציאה מסביבת ההצבעה.
                  טיוטת הדירוג נמחקה.
                </p>

                <p>
                  כדי להמשיך יש להיכנס מחדש
                  לקלפי ולדרג את המועמדים.
                </p>
              </>
            ) : (
              <>
                <h1>ברוכים הבאים לקלפי הדיגיטלית</h1>

                <p>
                  בעוד רגע תיכנסו לסביבת הצבעה
                  ייעודית במסך מלא.
                </p>

                <div className="secure-voting-instructions">
                  <p>✓ סרגל המשימות וממשק הדפדפן יוסתרו.</p>
                  <p>✓ תוכלו לדרג עד חמישה מועמדים.</p>
                  <p>✓ יש לאשר את הדירוג לפני השליחה.</p>
                  <p>
                    ✓ יציאה מזוהה לפני השליחה
                    תגרום למחיקת הטיוטה.
                  </p>
                </div>
              </>
            )}

            {error && (
              <p className="secure-voting-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              className="secure-voting-enter"
              onClick={enterVoting}
            >
              {status === "interrupted"
                ? "כניסה מחדש לקלפי"
                : "כניסה לקלפי המאובטחת"}
            </button>

            {status === "interrupted" && (
              <button
                type="button"
                className="secure-voting-secondary"
                onClick={returnToWelcome}
              >
                חזרה למסך הכניסה
              </button>
            )}

            <small>
              סביבת מסך מלא עם זיהוי יציאה.
              אינה נועלת את מערכת ההפעלה.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}