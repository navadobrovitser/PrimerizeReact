import { configureStore } from '@reduxjs/toolkit';

import candidatesReducer from './candidates/candidatesSlice';
import usersReducer from './users/usersSlice';

export const store = configureStore({
  reducer: {
    candidates: candidatesReducer,
    users: usersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;