import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "./usersState";
import { registerUser } from "./usersThunks";

const usersSlice = createSlice({
  name: "users",
  initialState,

  reducers: {
    clearRegisterStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          "הרישום נכשל";
      });
  },
});

export const { clearRegisterStatus } =
  usersSlice.actions;

export default usersSlice.reducer;