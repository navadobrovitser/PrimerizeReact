import { createSlice } from "@reduxjs/toolkit";
import { fetchPosts, createPost } from "./postsThunks";
import type { Post } from "./postsThunks";

interface PostsState {
  items: Post[];
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: PostsState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
};

const postsSlice = createSlice({
  name: "posts",
  initialState,

  reducers: {
    clearPostsError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })

      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "שגיאה בטעינת הפוסטים";
      })

      .addCase(createPost.pending, (state) => {
        state.creating = true;
        state.error = null;
      })

      .addCase(createPost.fulfilled, (state, action) => {
        state.creating = false;
        state.items.unshift(action.payload);
      })

      .addCase(createPost.rejected, (state, action) => {
        state.creating = false;
        state.error =
          action.payload || "שגיאה בפרסום הפוסט";
      });
  },
});

export const { clearPostsError } = postsSlice.actions;

export default postsSlice.reducer;