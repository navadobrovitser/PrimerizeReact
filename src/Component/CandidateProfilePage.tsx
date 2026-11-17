
import { useEffect, useState } from "react";
import CandidatePost from "./CandidatePost";
import type { Post } from "../store/posts/postsThunks";
import "./CandidateProfilePage.css";

// כתובת שרת ה-C#
import { API_ORIGIN } from "../config/api";

const API = API_ORIGIN;

interface CandidateProfile {
  candidateId: number;
  name: string;
  slogan: string;
  resume: string;
  profileImageUrl?: string | null;
  explanationVideoUrl?: string | null;
}

interface CandidateProfilePageProps {
  candidateId: number;
  onBack: () => void;
}

// בניית כתובת לתמונות ולסרטונים
function mediaUrl(url?: string | null): string {
  if (!url) return "";

  const cleanUrl = url.trim();

  if (/^https?:\/\//i.test(cleanUrl)) {
    return cleanUrl;
  }

  const cleanPath = cleanUrl.replace(/^\/+/, "");

  if (/^Images\//i.test(cleanPath)) {
    return `${API}/${cleanPath}`;
  }

  return `${API}/Images/${cleanPath}`;
}

// קריאת JSON בצורה בטוחה
async function readJson<T>(
  response: Response
): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    let message = `שגיאת שרת (${response.status})`;

    try {
      const errorData = JSON.parse(text);

      message =
        errorData.message ||
        errorData.detail ||
        errorData.title ||
        message;
    } catch {
      // השרת לא החזיר JSON
    }

    throw new Error(message);
  }

  if (!text.trim()) {
    throw new Error(
      "השרת החזיר תשובה ריקה."
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      "השרת החזיר HTML או תשובה שאינה JSON. " +
      "בדקי את כתובת ה-API: " +
      response.url
    );
  }
}

export default function CandidateProfilePage({
  candidateId,
  onBack,
}: CandidateProfilePageProps) {
  const [candidate, setCandidate] =
    useState<CandidateProfile | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setLoading(true);
      setError("");
      setCandidate(null);
      setPosts([]);
      setImageError(false);

      try {
        const [candidateResponse, postsResponse] =
          await Promise.all([
            fetch(
              `${API}/api/Candidates/profile/${candidateId}`,
              {
                signal: controller.signal,
                headers: {
                  Accept: "application/json",
                },
              }
            ),
            fetch(`${API}/api/Posts`, {
              signal: controller.signal,
              headers: {
                Accept: "application/json",
              },
            }),
          ]);

        const candidateData =
          await readJson<CandidateProfile>(
            candidateResponse
          );

        const postsData =
          await readJson<Post[]>(
            postsResponse
          );

        if (controller.signal.aborted) return;

        setCandidate(candidateData);

        const candidatePosts = postsData
          .filter(
            (post) =>
              Number(post.candidateId) ===
              Number(candidateId)
          )
          .sort((a, b) => {
            const dateA = new Date(
              a.createdAt ?? 0
            ).getTime();

            const dateB = new Date(
              b.createdAt ?? 0
            ).getTime();

            return (
              dateB - dateA ||
              b.postId - a.postId
            );
          });

        setPosts(candidatePosts);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "אירעה שגיאה בטעינת הפרופיל"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      controller.abort();
    };
  }, [candidateId]);

  return (
    <section
      className="candidate-profile-page"
      dir="rtl"
    >
      <div className="candidate-profile-container">
        {/* חזרה */}
        <button
          type="button"
          className="candidate-profile-back"
          onClick={onBack}
        >
          חזרה לכל המועמדים ←
        </button>

        {/* טעינה */}
        {loading && (
          <div className="candidate-profile-loading">
            טוען את פרופיל המועמד...
          </div>
        )}

        {/* שגיאה */}
        {!loading && error && (
          <div
            className="candidate-profile-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* תוכן הפרופיל */}
        {!loading && !error && candidate && (
          <>
            {/* כותרת המועמד */}
            <div className="candidate-profile-hero">
              <div className="candidate-profile-photo">
                {candidate.profileImageUrl &&
                !imageError ? (
                  <img
                    src={mediaUrl(
                      candidate.profileImageUrl
                    )}
                    alt={candidate.name}
                    onError={() =>
                      setImageError(true)
                    }
                  />
                ) : (
                  <span>
                    {candidate.name?.charAt(0) || "?"}
                  </span>
                )}
              </div>

              <div className="candidate-profile-intro">
                <span className="candidate-profile-eyebrow">
                  הכירו את המועמד
                </span>

                <h1>{candidate.name}</h1>

                {candidate.slogan && (
                  <h2>{candidate.slogan}</h2>
                )}
              </div>
            </div>

            {/* קורות חיים */}
            <section className="candidate-profile-resume">
              <h2>קצת עליי | קורות חיים</h2>

              <p>
                {candidate.resume ||
                  "המועמד עדיין לא הוסיף קורות חיים."}
              </p>
            </section>

            {/* סרטון */}
            {candidate.explanationVideoUrl && (
              <section className="candidate-profile-video">
                <h2>סרטון היכרות</h2>

                <video
                  controls
                  preload="metadata"
                  src={mediaUrl(
                    candidate.explanationVideoUrl
                  )}
                >
                  הדפדפן שלך אינו תומך בסרטונים.
                </video>
              </section>
            )}

            {/* פוסטים */}
            <section className="candidate-profile-posts">
              <div className="candidate-profile-posts-heading">
                <div>
                  <span className="candidate-profile-section-label">
                    עדכונים ופעילות
                  </span>

                  <h2>
                    הפוסטים של {candidate.name}
                  </h2>
                </div>

                <span className="candidate-profile-post-count">
                  {posts.length} פוסטים
                </span>
              </div>

              {posts.length === 0 ? (
                <div className="candidate-profile-empty">
                  המועמד עדיין לא פרסם פוסטים.
                </div>
              ) : (
                <div className="candidate-profile-posts-list">
                  {posts.map((post) => (
                    <div
                      className="candidate-profile-post-item"
                      key={post.postId}
                    >
                      <CandidatePost post={post} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  );
}
