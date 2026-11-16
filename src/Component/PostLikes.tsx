
import { useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import "./PostLikes.css";

import { API_ORIGIN } from "../config/api";

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

// זיהוי סוג התגובה
function parseReaction(
  type: string | number
): Reaction | null {
  const value = String(type).toLowerCase();

  if (value === "like") return "Like";
  if (value === "dislike") return "Dislike";

  return null;
}

// חילוץ מזהה המשתמש מהטוקן
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

  const [likes, setLikes] = useState<
    PostLikeDto[]
  >([]);

  const [currentReaction, setCurrentReaction] =
    useState<Reaction | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = token
    ? getUserIdFromToken(token)
    : null;

  // טעינת כל התגובות לפוסט
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
          (item) =>
            item.userId === currentUserId
        );

        setCurrentReaction(
          myLike
            ? parseReaction(myLike.type)
            : null
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

  // עדכון תגובה
  const handleReaction = async (
    type: Reaction
  ) => {
    if (!token || saving || loading) return;

    setSaving(true);
    setError("");

    const isRemoving =
      currentReaction === type;

    try {
      const response = await fetch(
        isRemoving
          ? `${API}?postId=${postId}`
          : API,
        {
          method: isRemoving
            ? "DELETE"
            : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(!isRemoving
              ? {
                  "Content-Type":
                    "application/json",
                }
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

      // רענון התגובות אחרי השמירה
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
        (item) =>
          item.userId === currentUserId
      );

      setCurrentReaction(
        myLike
          ? parseReaction(myLike.type)
          : null
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
    (item) =>
      parseReaction(item.type) === "Like"
  ).length;

  const dislikeCount = likes.filter(
    (item) =>
      parseReaction(item.type) === "Dislike"
  ).length;

  return (
    <div className="post-likes" dir="rtl">
      <div className="post-likes-buttons">
        <button
          type="button"
          className={`post-like-button ${
            currentReaction === "Like"
              ? "active"
              : ""
          }`}
          onClick={() =>
            void handleReaction("Like")
          }
          disabled={
            !token || loading || saving
          }
          aria-pressed={
            currentReaction === "Like"
          }
        >
          <span className="post-like-symbol">
            👍
          </span>

          <span>לייק</span>

          <strong>
            {loading ? "..." : likeCount}
          </strong>
        </button>

        <button
          type="button"
          className={`post-like-button ${
            currentReaction === "Dislike"
              ? "active dislike-active"
              : ""
          }`}
          onClick={() =>
            void handleReaction("Dislike")
          }
          disabled={
            !token || loading || saving
          }
          aria-pressed={
            currentReaction === "Dislike"
          }
        >
          <span className="post-like-symbol">
            👎
          </span>

          <span>דיסלייק</span>

          <strong>
            {loading ? "..." : dislikeCount}
          </strong>
        </button>
      </div>

      {saving && (
        <p className="post-likes-status">
          מעדכן תגובה...
        </p>
      )}

      {error && (
        <p
          className="post-likes-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
