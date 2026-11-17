
import { useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { API_ORIGIN } from "../config/api";
import "./PostLikes.css";

const API = `${API_ORIGIN}/api/PostLikes`;

type Reaction = "Like" | "Dislike";

interface PostLikeDto {
  postLikeId: number;
  postId: number;
  userId: number;
  type: string | number;
}

interface PostLikesProps {
  postId: number;
}

function parseReaction(type: string | number): Reaction | null {
  const value = String(type).toLowerCase();

  if (value === "like" || value === "0") return "Like";
  if (value === "dislike" || value === "1") return "Dislike";

  return null;
}

function getUserIdFromToken(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const data = JSON.parse(atob(base64));

    const id =
      data.nameid ??
      data.sub ??
      data[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);

  return (
    data?.message ||
    data?.title ||
    "אירעה שגיאה בעדכון התגובה"
  );
}

function ThumbIcon({ down = false }: { down?: boolean }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={down ? { transform: "rotate(180deg)" } : undefined}
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12.5 3a3.13 3.13 0 0 1 3 2.88Z" />
    </svg>
  );
}

export default function PostLikes({ postId }: PostLikesProps) {
  const token = useAppSelector((state) => state.auth.token);

  const [likes, setLikes] = useState<PostLikeDto[]>([]);
  const [currentReaction, setCurrentReaction] =
    useState<Reaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = token
    ? getUserIdFromToken(token)
    : null;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      setLikes([]);
      setCurrentReaction(null);

      try {
        const response = await fetch(`${API}/post/${postId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const data: PostLikeDto[] = await response.json();

        if (controller.signal.aborted) return;

        const items = Array.isArray(data) ? data : [];
        setLikes(items);

        const mine = items.find(
          (item) => item.userId === currentUserId
        );

        setCurrentReaction(
          mine ? parseReaction(mine.type) : null
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "שגיאה בטעינת התגובות"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [postId, token, currentUserId]);

  const handleReaction = async (type: Reaction) => {
    if (!token || saving || loading) return;

    setSaving(true);
    setError("");

    const isRemoving = currentReaction === type;

    try {
      const response = await fetch(
        isRemoving ? `${API}?postId=${postId}` : API,
        {
          method: isRemoving ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(!isRemoving
              ? { "Content-Type": "application/json" }
              : {}),
          },
          ...(!isRemoving
            ? { body: JSON.stringify({ postId, type }) }
            : {}),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const updatedResponse = await fetch(
        `${API}/post/${postId}`
      );

      if (!updatedResponse.ok) {
        throw new Error(
          "התגובה נשמרה, אך לא ניתן לרענן את הנתונים"
        );
      }

      const data: PostLikeDto[] =
        await updatedResponse.json();

      const updatedLikes = Array.isArray(data) ? data : [];
      setLikes(updatedLikes);

      const mine = updatedLikes.find(
        (item) => item.userId === currentUserId
      );

      setCurrentReaction(
        mine ? parseReaction(mine.type) : null
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "שגיאה בעדכון התגובה"
      );
    } finally {
      setSaving(false);
    }
  };

  const likeCount = likes.filter(
    (item) => parseReaction(item.type) === "Like"
  ).length;

  const dislikeCount = likes.filter(
    (item) => parseReaction(item.type) === "Dislike"
  ).length;

  return (
    <div className="post-likes" dir="rtl">
      <div className="post-likes-pill">
        <button
          type="button"
          className={`post-likes-action ${
            currentReaction === "Like" ? "selected" : ""
          }`}
          onClick={() => void handleReaction("Like")}
          disabled={!token || loading || saving}
          aria-pressed={currentReaction === "Like"}
          aria-label={`לייק, ${likeCount}`}
          title="אהבתי"
        >
          <ThumbIcon />
          <span className="post-likes-number">
            {loading ? "..." : likeCount}
          </span>
        </button>

        <span
          className="post-likes-separator"
          aria-hidden="true"
        />

        <button
          type="button"
          className={`post-likes-action ${
            currentReaction === "Dislike" ? "selected" : ""
          }`}
          onClick={() => void handleReaction("Dislike")}
          disabled={!token || loading || saving}
          aria-pressed={currentReaction === "Dislike"}
          aria-label={`דיסלייק, ${dislikeCount}`}
          title="לא אהבתי"
        >
          <ThumbIcon down />
          <span className="post-likes-number">
            {loading ? "..." : dislikeCount}
          </span>
        </button>
      </div>

      {saving && (
        <p className="post-likes-status" role="status">
          מעדכן תגובה...
        </p>
      )}

      {error && (
        <p className="post-likes-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
