
import { createSlice } from "@reduxjs/toolkit";
import { initialAuthState } from "./authState";
import {
  loginStep1,
  verifyLoginCode,
} from "./authThunks";

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,

  reducers: {
    logout: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.codeSent = false;
      state.error = null;
    },

    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // שלב ראשון - שליחת תעודת זהות וסיסמה
      .addCase(loginStep1.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginStep1.fulfilled, (state) => {
        state.loading = false;
        state.codeSent = true;
      })

      .addCase(loginStep1.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "שגיאה בשליחת קוד האימות";
      })

      // שלב שני - אימות קוד וקבלת טוקן
      .addCase(verifyLoginCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        verifyLoginCode.fulfilled,
        (state, action) => {
          state.loading = false;

          // בהנחה שהשרת מחזיר { token: "..." }
          const token = action.payload?.token;

          if (typeof token === "string" && token) {
            state.token = token;
            state.isAuthenticated = true;
          } else {
            state.error =
              "השרת לא החזיר טוקן תקין";
          }
        }
      )

      .addCase(
        verifyLoginCode.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            (action.payload as string) ||
            "קוד האימות שגוי";
        }
      );
  },
});

export const { logout, clearAuthError } =
  authSlice.actions;

export default authSlice.reducer;
