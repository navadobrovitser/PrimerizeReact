
import { createSlice } from "@reduxjs/toolkit";

import {
  fetchPosts,
  fetchPostById,
  createPost,
} from "./postsThunks";

import type { Post } from "./postsThunks";

interface PostsState {
  items: Post[];
  loading: boolean;
  creating: boolean;
  error: string | null;

  selectedPost: Post | null;
  selectedPostLoading: boolean;
  selectedPostError: string | null;
}

const initialState: PostsState = {
  items: [],
  loading: false,
  creating: false,
  error: null,

  selectedPost: null,
  selectedPostLoading: false,
  selectedPostError: null,
};

const postsSlice = createSlice({
  name: "posts",
  initialState,

  reducers: {
    clearPostsError: (state) => {
      state.error = null;
    },

    clearSelectedPost: (state) => {
      state.selectedPost = null;
      state.selectedPostError = null;
      state.selectedPostLoading = false;
    },
  },

  extraReducers: (builder) => {
    builder
      // כל הפוסטים
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

        if (action.meta.aborted) return;

        state.error =
          action.payload ||
          "שגיאה בטעינת הפוסטים";
      })

      // פוסט בודד
      .addCase(fetchPostById.pending, (state) => {
        state.selectedPostLoading = true;
        state.selectedPostError = null;
        state.selectedPost = null;
      })

      .addCase(
        fetchPostById.fulfilled,
        (state, action) => {
          state.selectedPostLoading = false;
          state.selectedPost = action.payload;
        }
      )

      .addCase(
        fetchPostById.rejected,
        (state, action) => {
          state.selectedPostLoading = false;

          if (action.meta.aborted) return;

          state.selectedPostError =
            action.payload ||
            "שגיאה בטעינת הפוסט";
        }
      )

      // יצירת פוסט
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
          action.payload ||
          "שגיאה בפרסום הפוסט";
      });
  },
});

export const {
  clearPostsError,
  clearSelectedPost,
} = postsSlice.actions;

export default postsSlice.reducer;
