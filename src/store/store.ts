
import { configureStore } from "@reduxjs/toolkit";

import candidatesReducer from "./candidates/candidatesSlice";
import usersReducer from "./users/usersSlice";
import authReducer from "./Auth/authSlice";
import postsReducer from "./posts/postsSlice";

import candidateMatchReducer from "./candidateMatch/candidateMatchSlice";

export const store = configureStore({
  reducer: {
    candidates: candidatesReducer,
    users: usersReducer,
    auth: authReducer,
    posts: postsReducer,
    candidateMatch: candidateMatchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
