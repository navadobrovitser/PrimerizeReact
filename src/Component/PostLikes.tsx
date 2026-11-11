
import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useAppSelector } from "../store/hooks";
import "./PostLikes.css";

const API = "https://localhost:7227/api/PostLikes";

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

function parseReaction(
  type: string | number
): Reaction | null {
  const value = String(type).toLowerCase();

  if (value === "like") return "Like";
  if (value === "dislike") return "Dislike";

  return null;
}

function getUserIdFromToken(
  token: string
): number | null {
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

    return Number.isFinite(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

async function getErrorMessage(
  response: Response
): Promise<string> {
  const data = await response
    .json()
    .catch(() => null);

  return (
    data?.message ||
    data?.title ||
    "אירעה שגיאה בעדכון התגובה"
  );
}

export default function PostLikes({
  postId,
}: PostLikesProps) {
  const token = useAppSelector(
    (state) => state.auth.token
  );

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

    const load = async () => {
      setLoading(true);
      setError("");
      setLikes([]);
      setCurrentReaction(null);

      try {
        const response = await fetch(
          `${API}/post/${postId}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(response)
          );
        }

        const data: PostLikeDto[] =
          await response.json();

        if (controller.signal.aborted) return;

        setLikes(data);

        const myLike = data.find(
          (item) => item.userId === currentUserId
        );

        setCurrentReaction(
          myLike ? parseReaction(myLike.type) : null
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
    };

    void load();

    return () => controller.abort();
  }, [postId, token, currentUserId]);

  const handleReaction = async (
    type: Reaction
  ) => {
    if (!token || saving || loading) return;

    setSaving(true);
    setError("");

    const isRemoving = currentReaction === type;

    try {
      const response = await fetch(
        isRemoving
          ? `${API}?postId=${postId}`
          : API,
        {
          method: isRemoving ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(!isRemoving
              ? { "Content-Type": "application/json" }
              : {}),
          },
          ...(!isRemoving
            ? {
                body: JSON.stringify({
                  postId,
                  type,
                }),
              }
            : {}),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response)
        );
      }

      const updatedResponse = await fetch(
        `${API}/post/${postId}`
      );

      if (!updatedResponse.ok) {
        throw new Error(
          "התגובה נשמרה, אך לא ניתן לרענן את הנתונים"
        );
      }

      const updatedLikes: PostLikeDto[] =
        await updatedResponse.json();

      setLikes(updatedLikes);

      const myLike = updatedLikes.find(
        (item) => item.userId === currentUserId
      );

      setCurrentReaction(
        myLike ? parseReaction(myLike.type) : null
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
      <div
        className="post-likes-pill"
        role="group"
        aria-label="דירוג הפוסט"
      >
        <button
          type="button"
          className={`post-likes-action ${
            currentReaction === "Like" ? "selected" : ""
          }`}
          onClick={() => void handleReaction("Like")}
          disabled={!token || loading || saving}
          aria-pressed={currentReaction === "Like"}
          title="אהבתי"
        >
          <ThumbsUp
            size={19}
            strokeWidth={1.8}
            fill={
              currentReaction === "Like"
                ? "currentColor"
                : "none"
            }
          />
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
          title="לא אהבתי"
        >
          <ThumbsDown
            size={19}
            strokeWidth={1.8}
            fill={
              currentReaction === "Dislike"
                ? "currentColor"
                : "none"
            }
          />
          <span className="post-likes-number">
            {loading ? "..." : dislikeCount}
          </span>
        </button>
      </div>

      {error && (
        <p className="post-likes-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
