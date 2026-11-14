
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/+$/, "");

const API_URL = `${API_ORIGIN}/api/Posts`;

// =====================================
// TYPES
// =====================================

export interface Post {
  postId: number;
  candidateId: number;
  candidateName?: string;
  content?: string;
  title?: string;
  contentType?: string;
  mediaUrl?: string;
  createdAt?: string;
  likesCount?: number;
  dislikesCount?: number;
  commentsCount?: number;

  candidate?: {
    name?: string;
    slogan?: string;
    profileImageUrl?: string;
    user?: {
      name?: string;
    };
  };
}

export interface CreatePostData {
  content: string;
  mediaFile?: File | null;
}

type PostMediaType = "Text" | "Image" | "Video";

const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
];

const VIDEO_EXTENSIONS = [
  "mp4",
  "webm",
  "mov",
];

// =====================================
// זיהוי סוג הקובץ
// =====================================

function detectContentType(
  file?: File | null
): PostMediaType {
  if (!file) return "Text";

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (
    extension &&
    IMAGE_EXTENSIONS.includes(extension)
  ) {
    return "Image";
  }

  if (
    extension &&
    VIDEO_EXTENSIONS.includes(extension)
  ) {
    return "Video";
  }

  throw new Error(
    "סוג הקובץ אינו נתמך. יש לבחור תמונה או סרטון."
  );
}

// =====================================
// קריאת שגיאות מהשרת
// =====================================

async function readServerError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.title === "string") {
      return data.title;
    }

    if (data?.errors) {
      const messages = Object.values(data.errors)
        .flat()
        .filter(
          (value): value is string =>
            typeof value === "string"
        );

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  } catch {
    // תשובה ללא JSON
  }

  return fallback;
}

// =====================================
// GET ALL POSTS
// =====================================

export const fetchPosts = createAsyncThunk<
  Post[],
  void,
  { rejectValue: string }
>(
  "posts/fetchPosts",
  async (_, { rejectWithValue, signal }) => {
    try {
      const response = await fetch(API_URL, {
        signal,
      });

      if (!response.ok) {
        return rejectWithValue(
          await readServerError(
            response,
            "לא ניתן לטעון את הפוסטים"
          )
        );
      }

      const data = await response.json();

      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        "שגיאה בחיבור לשרת"
      );
    }
  }
);

// =====================================
// GET POST BY ID
// =====================================

export const fetchPostById = createAsyncThunk<
  Post,
  number,
  { rejectValue: string }
>(
  "posts/fetchPostById",
  async (
    postId,
    { rejectWithValue, signal }
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/${postId}`,
        { signal }
      );

      if (!response.ok) {
        return rejectWithValue(
          response.status === 404
            ? "הפוסט המבוקש לא נמצא"
            : await readServerError(
                response,
                "לא ניתן לטעון את הפוסט"
              )
        );
      }

      return (await response.json()) as Post;
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        "שגיאה בחיבור לשרת"
      );
    }
  }
);

// =====================================
// CREATE POST
// =====================================

export const createPost = createAsyncThunk<
  Post,
  CreatePostData,
  {
    state: RootState;
    rejectValue: string;
  }
>(
  "posts/createPost",
  async (
    data,
    { getState, rejectWithValue, signal }
  ) => {
    const token = getState().auth.token;

    if (!token) {
      return rejectWithValue(
        "יש להתחבר כדי לפרסם פוסט"
      );
    }

    if (!data.content.trim()) {
      return rejectWithValue(
        "יש להזין תוכן לפוסט"
      );
    }

    if (data.content.trim().length > 4000) {
      return rejectWithValue(
        "תוכן הפוסט ארוך מדי"
      );
    }

    try {
      const contentType = detectContentType(
        data.mediaFile
      );

      const formData = new FormData();

      formData.append(
        "Content",
        data.content.trim()
      );

      formData.append(
        "ContentType",
        contentType
      );

      if (data.mediaFile) {
        formData.append(
          "MediaFile",
          data.mediaFile,
          data.mediaFile.name
        );
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal,
      });

      if (!response.ok) {
        return rejectWithValue(
          await readServerError(
            response,
            "לא ניתן לפרסם את הפוסט"
          )
        );
      }

      const result = await response.json();

      return result.data as Post;
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "שגיאה בחיבור לשרת"
      );
    }
  }
);
