
import { useEffect, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

import { useAppSelector } from "../store/hooks";
import "./CreatePostPage.css";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227";

const POSTS_API = `${API_ORIGIN}/api/Posts`;
const CANDIDATE_API = `${API_ORIGIN}/api/Candidates/me`;

interface Post {
  postId: number;
  candidateId: number;
  content: string;
  contentType?: string;
  mediaUrl?: string | null;
  createdAt?: string;
}

interface CandidateProfile {
  candidateId: number;
}

async function readError(
  response: Response
): Promise<string> {
  const data = await response.json().catch(() => null);

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (typeof data?.title === "string") {
    return data.title;
  }

  if (response.status === 401) {
    return "פג תוקף ההתחברות. יש להתחבר מחדש.";
  }

  if (response.status === 403) {
    return "אין הרשאה לבצע פעולה זו.";
  }

  return `הבקשה נכשלה (${response.status})`;
}

export default function CreatePostPage() {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [content, setContent] = useState("");
  const [video, setVideo] = useState<File | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileKey, setFileKey] = useState(0);

  const loadPosts = async (
    currentToken: string,
    signal?: AbortSignal
  ) => {
    const response = await fetch(
      `${POSTS_API}/my-posts`,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const result: Post[] = await response.json();

    if (!signal?.aborted) {
      setPosts(result);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    setAuthorized(false);
    setChecking(true);
    setPosts([]);
    setError("");
    setSuccess("");

    if (!token) {
      setChecking(false);
      return () => controller.abort();
    }

    const run = async () => {
      try {
        // בדיקה אם המשתמש הוא מועמד רשום
        const response = await fetch(
          CANDIDATE_API,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        if (response.status === 404) {
          setAuthorized(false);
          return;
        }

        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const candidate: CandidateProfile =
          await response.json();

        if (controller.signal.aborted) return;

        if (!candidate || candidate.candidateId <= 0) {
          setAuthorized(false);
          return;
        }

        setAuthorized(true);

        await loadPosts(token, controller.signal);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "שגיאה בחיבור לשרת"
        );
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    };

    void run();

    return () => controller.abort();
  }, [token]);

  const chooseVideo = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file = e.target.files?.[0] ?? null;

    if (
      file &&
      (
        !/\.(mp4|avi|mov)$/i.test(file.name) ||
        file.size > 20 * 1024 * 1024
      )
    ) {
      setError(
        "ניתן להעלות סרטון MP4, AVI או MOV בגודל עד 20MB."
      );

      setVideo(null);
      e.target.value = "";
      return;
    }

    setVideo(file);
  };

  const submit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!token || !authorized || loading) return;

    const text = content.trim();

    if (!text || text.length > 4000) {
      setError("יש להזין תוכן עד 4000 תווים.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const form = new FormData();

      form.append("Content", text);

      form.append(
        "ContentType",
        video ? "Video" : "Text"
      );

      if (video) {
        form.append("MediaFile", video);
      }

      const response = await fetch(POSTS_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setContent("");
      setVideo(null);
      setFileKey((prev) => prev + 1);

      setSuccess("הפוסט פורסם בהצלחה!");

      // רענון רשימת הפוסטים האישיים
      try {
        await loadPosts(token);
      } catch (refreshError) {
        console.error(
          "Post published, but refresh failed:",
          refreshError
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "לא ניתן לפרסם את הפוסט"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="create-post-page" dir="rtl">
      <div className="create-post-container">
        <header className="create-post-hero">
          <span>תנופה | אזור המועמדים</span>

          <h1>הוספת פוסט</h1>

          <p>
            שתפו את החזון, הרעיונות
            והעדכונים שלכם עם חברי המפלגה.
          </p>
        </header>

        {!token ? (
          <div className="create-post-notice">
            יש להתחבר כדי לפרסם פוסטים.
          </div>
        ) : checking ? (
          <div className="create-post-notice">
            בודקים את סטטוס המועמדות...
          </div>
        ) : authorized ? (
          <form
            className="create-post-form"
            onSubmit={submit}
          >
            <h2>מה תרצו לשתף?</h2>

            <label htmlFor="post-content">
              תוכן הפוסט *
            </label>

            <textarea
              id="post-content"
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              maxLength={4000}
              rows={7}
              placeholder="כתבו כאן את הפוסט שלכם..."
              required
              disabled={loading}
            />

            <small>
              {content.length} / 4000 תווים
            </small>

            <label htmlFor="post-video">
              סרטון (לא חובה)
            </label>

            <input
              key={fileKey}
              id="post-video"
              type="file"
              accept=".mp4,.avi,.mov"
              onChange={chooseVideo}
              disabled={loading}
            />

            <small>
              MP4, AVI או MOV — עד 20MB
            </small>

            {video && (
              <small>
                נבחר: {video.name}
              </small>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim()}
            >
              {loading ? "מפרסם..." : "פרסום הפוסט"}
            </button>
          </form>
        ) : !error ? (
          <div className="create-post-notice">
            רק מועמד רשום יכול להוסיף פוסטים.
          </div>
        ) : null}

        {error && (
          <p
            className="create-post-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="create-post-success"
            role="status"
          >
            {success}
          </p>
        )}

        {authorized && (
          <section className="my-posts-section">
            <h2>הפוסטים שלי</h2>

            {posts.length === 0 ? (
              <p>עדיין לא פרסמת פוסטים.</p>
            ) : (
              posts.map((post) => (
                <article
                  className="my-post-card"
                  key={post.postId}
                >
                  <p>{post.content}</p>

                  {post.createdAt && (
                    <small>
                      {new Date(
                        post.createdAt
                      ).toLocaleDateString("he-IL")}
                    </small>
                  )}
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
}
