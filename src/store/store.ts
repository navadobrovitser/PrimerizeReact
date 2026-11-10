
import { configureStore } from "@reduxjs/toolkit";

import candidatesReducer from "./candidates/candidatesSlice";
import usersReducer from "./users/usersSlice";
import authReducer from "./Auth/authSlice";
import postsReducer from "./posts/postsSlice";
import votingReducer from "./voting/votingSlice";

export const store = configureStore({
  reducer: {
    candidates: candidatesReducer,
    users: usersReducer,
    auth: authReducer,
    posts: postsReducer,
    voting: votingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
