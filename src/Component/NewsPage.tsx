
import { useEffect, useMemo, useState } from "react";
import "./NewsPage.css";

const API =
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227";

interface PostDto {
  postId: number;
  candidateId: number;
  candidateName: string;
  content: string;
  contentType: string;
  mediaUrl: string | null;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
}

interface NewsPageProps {
  onOpenPost: (postId: number) => void;
  onBack?: () => void;
}

const PAGE_SIZE = 10;

function getFirstLine(content: string): string {
  if (!content?.trim()) {
    return "לצפייה בפרסום המלא";
  }

  const firstLine = content
    .split(/\r?\n/)
    .find((line) => line.trim().length > 0);

  return firstLine?.trim() || "לצפייה בפרסום המלא";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "תאריך לא זמין";
  }

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function NewsPage({
  onOpenPost,
  onBack,
}: NewsPageProps) {
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] =
    useState(PAGE_SIZE);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPosts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API}/api/Posts`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `שגיאה בטעינת העדכונים (${response.status})`
          );
        }

        const data: PostDto[] =
          await response.json();

        if (!controller.signal.aborted) {
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "לא ניתן לטעון את העדכונים"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => controller.abort();
  }, []);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (
        Number.isNaN(dateA) ||
        Number.isNaN(dateB)
      ) {
        return b.postId - a.postId;
      }

      return dateB - dateA;
    });
  }, [posts]);

  const visiblePosts = sortedPosts.slice(
    0,
    visibleCount
  );

  return (
    <main className="news-page" dir="rtl">
      <div className="news-container">

        <div className="news-heading">
          <span className="news-label">
            הפרסומים האחרונים
          </span>

          <h1>חדשות ועדכונים</h1>

          <p>
            מתעדכנים בכל מה שקורה בפריימריז.
            כל העדכונים האחרונים מהמועמדים,
            במקום אחד.
          </p>
        </div>

        <div className="news-section-heading">
          <h2>עדכונים אחרונים</h2>

          {!loading && !error && (
            <span>
              {sortedPosts.length} פרסומים
            </span>
          )}
        </div>

        {loading && (
          <div className="news-state">
            טוען את העדכונים האחרונים...
          </div>
        )}

        {error && (
          <div
            className="news-state news-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          sortedPosts.length === 0 && (
            <div className="news-state">
              עדיין לא פורסמו עדכונים.
            </div>
          )}

        {!loading && !error && (
          <div className="news-list">
            {visiblePosts.map((post) => (
              <button
                type="button"
                key={post.postId}
                className="news-card"
                onClick={() =>
                  onOpenPost(post.postId)
                }
              >
                <div className="news-card-top">
                  <div className="news-author">
                    <span className="news-author-avatar">
                      {post.candidateName
                        ?.charAt(0) || "מ"}
                    </span>

                    <div className="news-author-details">
                      <strong>
                        {post.candidateName ||
                          "מועמד"}
                      </strong>

                      <span>פרסום חדש</span>
                    </div>
                  </div>

                  <time
                    className="news-date"
                    dateTime={post.createdAt}
                  >
                    {formatDate(post.createdAt)}
                  </time>
                </div>

                <div className="news-card-content">
                  <p>
                    {getFirstLine(post.content)}
                  </p>
                </div>

                <div className="news-card-bottom">
                  <span className="news-read-link">
                    לקריאת הפוסט המלא
                    <span aria-hidden="true">
                      {" "}←
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading &&
          !error &&
          visibleCount < sortedPosts.length && (
            <button
              type="button"
              className="news-more-button"
              onClick={() =>
                setVisibleCount(
                  (current) =>
                    current + PAGE_SIZE
                )
              }
            >
              הצגת עדכונים נוספים
            </button>
          )}

        {onBack && (
          <div className="news-footer">
            <button
              type="button"
              onClick={onBack}
              className="news-back-button"
            >
              חזרה לעמוד הבית
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
