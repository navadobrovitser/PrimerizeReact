
import { createSlice } from "@reduxjs/toolkit";
import { castVote, fetchVoteStatus } from "./votingThunks";

interface VotingState {
  hasVoted: boolean;
  checkingStatus: boolean;
  statusChecked: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: VotingState = {
  hasVoted: false,
  checkingStatus: false,
  statusChecked: false,
  submitting: false,
  error: null,
};

const votingSlice = createSlice({
  name: "voting",
  initialState,
  reducers: {
    resetVoting: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVoteStatus.pending, (state) => {
        state.checkingStatus = true;
        state.statusChecked = false;
        state.error = null;
      })
      .addCase(fetchVoteStatus.fulfilled, (state, action) => {
        state.checkingStatus = false;
        state.statusChecked = true;
        state.hasVoted = action.payload.hasVoted;
      })
      .addCase(fetchVoteStatus.rejected, (state, action) => {
        state.checkingStatus = false;
        state.statusChecked = false;
        state.error = action.payload ?? "שגיאה בבדיקת הצבעה";
      })
      .addCase(castVote.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(castVote.fulfilled, (state) => {
        state.submitting = false;
        state.hasVoted = true;
        state.statusChecked = true;
      })
      .addCase(castVote.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload ?? "שגיאה בשליחת ההצבעה";
      });
  },
});

export const { resetVoting } = votingSlice.actions;
export default votingSlice.reducer;
