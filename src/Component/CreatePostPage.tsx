
import { useEffect, useState } from "react";
import type {
  FormEvent,
  ChangeEvent,
} from "react";

import { useAppSelector } from "../store/hooks";
import "./CreatePostPage.css";

const API = "https://localhost:7227/api/Posts";

interface Post {
  postId: number;
  candidateId: number;
  content: string;
  contentType?: string;
  mediaUrl?: string | null;
  createdAt?: string;
}

async function readError(
  response: Response
): Promise<string> {
  const data = await response
    .json()
    .catch(() => null);

  return (
    data?.message ||
    data?.title ||
    (response.status === 403
      ? "אין הרשאה לפרסם פוסט"
      : "הבקשה נכשלה")
  );
}

export default function CreatePostPage() {
  const token = useAppSelector(
    (state) => state.auth.token
  );

  const [authorized, setAuthorized] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [content, setContent] = useState("");
  const [video, setVideo] =
    useState<File | null>(null);

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
      `${API}/my-posts`,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        await readError(response)
      );
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

    if (!token) {
      setChecking(false);
      return () => controller.abort();
    }

    const run = async () => {
      try {
        const response = await fetch(
          "https://localhost:7227/api/Candidates/eligibility",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            await readError(response)
          );
        }

        const data = await response.json();

        if (!data.alreadyCandidate) {
          if (!controller.signal.aborted) {
            setError(
              "רק מועמד רשום יכול לפרסם פוסטים."
            );
          }
          return;
        }

        if (!controller.signal.aborted) {
          setAuthorized(true);
        }

        await loadPosts(
          token,
          controller.signal
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "שגיאה בחיבור לשרת"
          );
        }
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

    if (!token || !authorized || loading) {
      return;
    }

    const text = content.trim();

    if (!text || text.length > 4000) {
      setError(
        "יש להזין תוכן עד 4000 תווים."
      );
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

      const response = await fetch(API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(
          await readError(response)
        );
      }

      setContent("");
      setVideo(null);
      setFileKey((prev) => prev + 1);

      setSuccess(
        "הפוסט פורסם בהצלחה!"
      );

      await loadPosts(token);
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
              disabled={
                loading || !content.trim()
              }
            >
              {loading
                ? "מפרסם..."
                : "פרסום הפוסט"}
            </button>
          </form>
        ) : (
          <div className="create-post-notice">
            רק מועמד רשום יכול להוסיף פוסטים.
          </div>
        )}

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
              <p>
                עדיין לא פרסמת פוסטים.
              </p>
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
