
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../store/hooks";
import "./RegulationChatPage.css";

// =====================================================
// מבנה הנתונים שמגיעים מהשרת
// =====================================================

interface RegulationSource {
  sectionNumber: string;
  content: string;
}

interface RegulationResponse {
  answer: string;
  versionId: number;
  versionNumber: string;
  publishedAt: string | null;
  sources: RegulationSource[];
}

// הודעה אחת בשיחה
interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: RegulationSource[];
}

// כתובת השרת הקיים
const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/$/, "");

export default function RegulationChatPage() {
  // הטוקן של המשתמש שכבר התחבר לאתר
  const token = useAppSelector((state) => state.auth.token);

  // =====================================================
  // ניהול מצב השיחה
  // =====================================================

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState("");

  // זיהוי הבקשה הפעילה כדי למנוע תשובות משיחה קודמת
  const requestController = useRef<AbortController | null>(null);

  // גלילה אוטומטית לתחתית השיחה
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, loading]);

  // ביטול בקשה אם המשתמש יוצא מהעמוד
  useEffect(() => {
    return () => {
      requestController.current?.abort();
    };
  }, []);

  // =====================================================
  // שליחת שאלה לשרת RAG
  // =====================================================

  const sendQuestion = async () => {
    const currentQuestion = question.trim();

    if (!currentQuestion || loading) return;

    if (!token) {
      setError("יש להתחבר לאתר כדי להשתמש בצ'אט.");
      return;
    }

    if (currentQuestion.length > 2000) {
      setError("ניתן להזין עד 2000 תווים בשאלה.");
      return;
    }

    // השרת מקבל עד 10 הודעות קודמות.
    // שולחים את ההיסטוריה הקצרה ביותר הדרושה להקשר.
    const previousMessages = messages
      .slice(-10)
      .map((message) => ({
        role: message.role,
        text: message.text,
      }));

    const controller = new AbortController();
    requestController.current = controller;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: currentQuestion },
    ]);

    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_ORIGIN}/api/regulation-chat/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: currentQuestion,
            previousMessages,
          }),
          signal: controller.signal,
        }
      );

      if (response.status === 401) {
        throw new Error(
          "פג תוקף ההתחברות. יש להתחבר מחדש."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "אין לך הרשאה להשתמש בצ'אט התקנון."
        );
      }

      if (!response.ok) {
        throw new Error(
          "אירעה שגיאה בקבלת תשובה. נסי שוב."
        );
      }

      const data: RegulationResponse = await response.json();

      // אם הבקשה בוטלה, לא מעדכנים את השיחה
      if (controller.signal.aborted) return;

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources,
        },
      ]);

      setVersion(data.versionNumber);
    } catch (err) {
      if (controller.signal.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : "לא ניתן להתחבר לשרת כרגע."
      );
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  };

  // =====================================================
  // התחלת שיחה חדשה
  // ההיסטוריה נמחקת מהדפדפן בלבד.
  // =====================================================

  const startNewChat = () => {
    requestController.current?.abort();
    requestController.current = null;

    setMessages([]);
    setQuestion("");
    setError("");
    setVersion("");
    setLoading(false);
  };

  return (
    <section className="regulation-chat-page" dir="rtl">
      {/* כותרת הצ'אט */}
      <div className="regulation-chat-header">
        <div>
          <h1>צ'אט התקנון החכם</h1>
          <p>
            שאלו שאלות וקבלו תשובות המבוססות על
            התקנון הרשמי של האתר.
          </p>

          {version && (
            <span className="regulation-version">
              גרסת תקנון: {version}
            </span>
          )}
        </div>

        <button
          type="button"
          className="regulation-new-chat"
          onClick={startNewChat}
        >
          + שיחה חדשה
        </button>
      </div>

      {/* אזור ההודעות */}
      <div
        className="regulation-chat-messages"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="regulation-chat-welcome">
            <h2>במה אפשר לעזור?</h2>
            <p>
              אפשר לשאול על הרשמה, מועמדות,
              הצבעה, תוצאות הבחירות וכל נושא
              שמופיע בתקנון.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`regulation-message ${
              message.role === "user"
                ? "regulation-message-user"
                : "regulation-message-assistant"
            }`}
          >
            <div className="regulation-message-label">
              {message.role === "user"
                ? "השאלה שלך"
                : "עוזר התקנון"}
            </div>

            <div className="regulation-message-text">
              {message.text}
            </div>

            {/* מקורות נפתחים לקריאה */}
            {message.role === "assistant" &&
              message.sources &&
              message.sources.length > 0 && (
                <details className="regulation-sources">
                  <summary>
                    הצגת מקורות מהתקנון (
                    {message.sources.length})
                  </summary>

                  <div className="regulation-sources-list">
                    {message.sources.map((source) => (
                      <div
                        key={source.sectionNumber}
                        className="regulation-source"
                      >
                        <strong>
                          סעיף {source.sectionNumber}
                        </strong>
                        <p>{source.content}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
          </div>
        ))}

        {loading && (
          <div className="regulation-chat-loading">
            מחפש סעיפים רלוונטיים ומכין תשובה...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* שגיאה ידידותית */}
      {error && (
        <div className="regulation-chat-error" role="alert">
          {error}
        </div>
      )}

      {/* אזור כתיבת השאלה */}
      <form
        className="regulation-chat-input-area"
        onSubmit={(event) => {
          event.preventDefault();
          void sendQuestion();
        }}
      >
        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          placeholder="כתבי כאן את השאלה שלך על התקנון..."
          maxLength={2000}
          rows={3}
          disabled={loading}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendQuestion();
            }
          }}
        />

        <button
          type="submit"
          disabled={loading || !question.trim()}
        >
          {loading ? "ממתין..." : "שליחה"}
        </button>
      </form>

      <p className="regulation-chat-disclaimer">
        התשובות מבוססות על סעיפי התקנון שאותרו
        במאגר הידע. במקרה של חוסר מידע,
        יש לעיין בתקנון הרשמי.
      </p>
    </section>
  );
}
