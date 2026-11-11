import { createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = "https://localhost:7227/api/Posts";

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

export const fetchPosts = createAsyncThunk<
  Post[],
  void,
  { rejectValue: string }
>("posts/fetchPosts", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      return rejectWithValue("לא ניתן לטעון את הפוסטים");
    }

    return (await response.json()) as Post[];
  } catch {
    return rejectWithValue("שגיאה בחיבור לשרת");
  }
});

export const createPost = createAsyncThunk<
  Post,
  CreatePostData,
  { state: { auth: { token: string | null } }; rejectValue: string }
>(
  "posts/createPost",
  async (data, { getState, rejectWithValue }) => {
    const token = getState().auth.token;

    if (!token) {
      return rejectWithValue("יש להתחבר כדי לפרסם פוסט");
    }

    const formData = new FormData();

    formData.append("Content", data.content);

    if (data.mediaFile) {
      formData.append("MediaFile", data.mediaFile);
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
          result.message || "לא ניתן לפרסם את הפוסט"
        );
      }

      return result.data as Post;
    } catch {
      return rejectWithValue("שגיאה בחיבור לשרת");
    }
  }
);