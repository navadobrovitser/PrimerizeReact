
import { useEffect, useState } from "react";
import CandidatePost from "./CandidatePost";
import type { Post } from "../store/posts/postsThunks";
import "./CandidateProfilePage.css";

const API = "https://localhost:7227";

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

// בניית כתובת תקינה לקובצי תמונה וסרטונים
function mediaUrl(url?: string | null): string {
  if (!url) return "";

  const cleanUrl = url.trim();

  // כתובת מלאה
  if (/^https?:\/\//i.test(cleanUrl)) {
    return cleanUrl;
  }

  // הסרת לוכסנים מתחילת הנתיב
  const cleanPath = cleanUrl.replace(/^\/+/, "");

  // אם כבר קיים הנתיב Images
  if (/^Images\//i.test(cleanPath)) {
    return `${API}/${cleanPath}`;
  }

  // אם התקבל רק שם קובץ
  return `${API}/Images/${cleanPath}`;
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

    const load = async () => {
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
              { signal: controller.signal }
            ),
            fetch(`${API}/api/Posts`, {
              signal: controller.signal,
            }),
          ]);

        if (!candidateResponse.ok) {
          throw new Error("לא ניתן לטעון את פרטי המועמד");
        }

        if (!postsResponse.ok) {
          throw new Error("לא ניתן לטעון את הפוסטים");
        }

        const candidateData: CandidateProfile =
          await candidateResponse.json();

        const postsData: Post[] =
          await postsResponse.json();

        if (controller.signal.aborted) return;

        setCandidate(candidateData);

        const candidatePosts = postsData
          .filter(
            (post) => post.candidateId === candidateId
          )
          .sort((a, b) => {
            const dateA = new Date(
              a.createdAt ?? 0
            ).getTime();

            const dateB = new Date(
              b.createdAt ?? 0
            ).getTime();

            return dateB - dateA || b.postId - a.postId;
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

    void load();

    return () => controller.abort();
  }, [candidateId]);

  return (
    <section
      className="candidate-profile-page"
      dir="rtl"
    >
      <div className="candidate-profile-container">
        <button
          type="button"
          className="candidate-profile-back"
          onClick={onBack}
        >
          ← חזרה לכל המועמדים
        </button>

        {loading && <p>טוען פרופיל...</p>}

        {error && (
          <p className="candidate-profile-error">
            {error}
          </p>
        )}

        {!loading && candidate && (
          <>
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
                <span>הכירו את המועמד</span>

                <h1>{candidate.name}</h1>

                <h2>{candidate.slogan}</h2>
              </div>
            </div>

            <div className="candidate-profile-resume">
              <h2>קצת עליי | קורות חיים</h2>

              <p>
                {candidate.resume ||
                  "המועמד עדיין לא הוסיף קורות חיים."}
              </p>
            </div>

            {candidate.explanationVideoUrl && (
              <div className="candidate-profile-video">
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
              </div>
            )}

            <div className="candidate-profile-posts">
              <h2>
                הפוסטים של {candidate.name}
              </h2>

              {posts.length === 0 ? (
                <p>
                  המועמד עדיין לא פרסם פוסטים.
                </p>
              ) : (
                posts.map((post) => (
                  <CandidatePost
                    key={post.postId}
                    post={post}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
