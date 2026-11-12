
import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "./candidatesState";
import { fetchCandidates } from "./candidatesThunks";

const candidatesSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCandidates.fulfilled,
        (state, action) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(
        fetchCandidates.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            action.payload ??
            action.error.message ??
            "אירעה שגיאה בטעינת הנתונים";
        }
      );
  },
});

export default candidatesSlice.reducer;
