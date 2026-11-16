
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { API_ORIGIN } from "../config/api";
import "./RegulationChatPage.css";

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

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: RegulationSource[];
}

const CHAT_URL = `${API_ORIGIN}/api/regulation-chat/ask`;

export default function RegulationChatPage() {
  const token = useAppSelector((state) => state.auth.token);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState("");

  const requestController = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      requestController.current?.abort();
    };
  }, []);

  const sendQuestion = async () => {
    const currentQuestion = question.trim();

    if (!currentQuestion || sendingRef.current) return;

    if (!token) {
      setError("יש להתחבר לאתר כדי להשתמש בצ'אט.");
      return;
    }

    if (currentQuestion.length > 2000) {
      setError("ניתן להזין עד 2000 תווים בשאלה.");
      return;
    }

    const previousMessages = messages
      .slice(-10)
      .map((message) => ({
        role: message.role,
        text: message.text,
      }));

    const controller = new AbortController();
    requestController.current = controller;
    sendingRef.current = true;

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: currentQuestion,
      },
    ]);

    setQuestion("");
    setError("");
    setLoading(true);

    try {
      console.log("Regulation Chat request:", {
        url: CHAT_URL,
        question: currentQuestion,
        historyCount: previousMessages.length,
      });

      const response = await fetch(CHAT_URL, {
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
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        const responseText = await response.text();

        console.error("Regulation Chat API Error:", {
          status: response.status,
          url: response.url,
          response: responseText,
        });

        let message = `שגיאת שרת (${response.status}).`;

        if (response.status === 400) {
          message = "הבקשה שנשלחה לשרת אינה תקינה (400).";
        } else if (response.status === 401) {
          message = "פג תוקף ההתחברות. יש להתחבר מחדש.";
        } else if (response.status === 403) {
          message = "אין הרשאה להשתמש בצ'אט התקנון.";
        } else if (response.status === 404) {
          message = "שירות הצ'אט לא נמצא בשרת (404).";
        } else if (response.status === 429) {
          message = "נשלחו יותר מדי בקשות. נסי שוב מאוחר יותר.";
        } else if (response.status === 500) {
          message = "שגיאה פנימית בשרת הצ'אט (500).";
        } else if (
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504
        ) {
          message = "שירות הצ'אט אינו זמין כרגע.";
        }

        throw new Error(message);
      }

      const data: RegulationResponse = await response.json();

      if (controller.signal.aborted) return;

      if (
        !data ||
        typeof data.answer !== "string" ||
        !data.answer.trim()
      ) {
        throw new Error(
          "השרת החזיר תשובה ריקה או לא תקינה."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer,
          sources: Array.isArray(data.sources)
            ? data.sources
            : [],
        },
      ]);

      setVersion(data.versionNumber ?? "");
    } catch (err) {
      if (controller.signal.aborted) return;

      console.error("Regulation Chat Error:", err);

      if (err instanceof TypeError) {
        setError(
          "לא ניתן להתחבר לשרת. בדקי את כתובת השרת ואת החיבור."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "אירעה שגיאה לא צפויה."
        );
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        sendingRef.current = false;
        setLoading(false);
      }
    }
  };

  const startNewChat = () => {
    requestController.current?.abort();
    requestController.current = null;
    sendingRef.current = false;

    setMessages([]);
    setQuestion("");
    setError("");
    setVersion("");
    setLoading(false);
  };

  return (
    <section className="regulation-chat-page" dir="rtl">
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

            {message.role === "assistant" &&
              message.sources &&
              message.sources.length > 0 && (
                <details className="regulation-sources">
                  <summary>
                    הצגת מקורות מהתקנון (
                    {message.sources.length})
                  </summary>

                  <div className="regulation-sources-list">
                    {message.sources.map((source, index) => (
                      <div
                        key={`${source.sectionNumber}-${index}`}
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

      {error && (
        <div className="regulation-chat-error" role="alert">
          {error}
        </div>
      )}

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
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
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
