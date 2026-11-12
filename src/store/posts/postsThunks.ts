
import { createAsyncThunk } from "@reduxjs/toolkit";

const API_URL =
  import.meta.env.VITE_API_ORIGIN
    ? `${import.meta.env.VITE_API_ORIGIN}/api/Posts`
    : "https://localhost:7227/api/Posts";

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

// שליפת כל הפוסטים
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
          "לא ניתן לטעון את הפוסטים"
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

// שליפת פוסט בודד לפי מזהה
export const fetchPostById = createAsyncThunk<
  Post,
  number,
  { rejectValue: string }
>(
  "posts/fetchPostById",
  async (postId, { rejectWithValue, signal }) => {
    try {
      const response = await fetch(
        `${API_URL}/${postId}`,
        { signal }
      );

      if (!response.ok) {
        return rejectWithValue(
          response.status === 404
            ? "הפוסט המבוקש לא נמצא"
            : "לא ניתן לטעון את הפוסט"
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

// יצירת פוסט חדש
export const createPost = createAsyncThunk<
  Post,
  CreatePostData,
  {
    state: {
      auth: { token: string | null };
    };
    rejectValue: string;
  }
>(
  "posts/createPost",
  async (data, { getState, rejectWithValue }) => {
    const token = getState().auth.token;

    if (!token) {
      return rejectWithValue(
        "יש להתחבר כדי לפרסם פוסט"
      );
    }

    const formData = new FormData();

    formData.append(
      "Content",
      data.content
    );

    if (data.mediaFile) {
      formData.append(
        "MediaFile",
        data.mediaFile
      );
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          result.message ||
            "לא ניתן לפרסם את הפוסט"
        );
      }

      return result.data as Post;
    } catch {
      return rejectWithValue(
        "שגיאה בחיבור לשרת"
      );
    }
  }
);
