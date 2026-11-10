import { createSlice } from "@reduxjs/toolkit";
import { initialAuthState } from "./authState";
import { loginStep1, verifyLoginCode } from "./authThunks";

function getRoleFromToken(token: string): string | null {
  try {
    const payload = token.split(".")[1];

    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = JSON.parse(atob(normalized));

    const role =
      decoded.role ??
      decoded[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ];

    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,

  reducers: {
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.codeSent = false;
      state.loading = false;
      state.error = null;
    },

    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginStep1.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.codeSent = false;
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

      .addCase(verifyLoginCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(verifyLoginCode.fulfilled, (state, action) => {
        state.loading = false;

        const token = action.payload?.token;

        if (typeof token === "string" && token) {
          state.token = token;
          state.role = getRoleFromToken(token);
          state.isAuthenticated = true;
          state.codeSent = false;
        } else {
          state.error = "השרת לא החזיר טוקן תקין";
        }
      })

      .addCase(verifyLoginCode.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "קוד האימות שגוי";
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;