
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  searchCandidateMatches,
} from "./candidateMatchThunks";
import type {
  MatchCandidate,
} from "./candidateMatchThunks";

interface CandidateMatchState {
  query: string;
  results: MatchCandidate[];
  detectedTopics: string[];
  loading: boolean;
  searched: boolean;
  error: string | null;
  currentRequestId: string | null;
}

const initialState: CandidateMatchState = {
  query: "",
  results: [],
  detectedTopics: [],
  loading: false,
  searched: false,
  error: null,
  currentRequestId: null,
};

const candidateMatchSlice = createSlice({
  name: "candidateMatch",
  initialState,

  reducers: {
    setMatchQuery: (
      state,
      action: PayloadAction<string>
    ) => {
      state.query = action.payload;
      state.searched = false;
      state.error = null;
    },

    resetCandidateMatch: () => initialState,

    clearMatchError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(searchCandidateMatches.pending, (state, action) => {
        state.loading = true;
        state.searched = false;
        state.error = null;
        state.results = [];
        state.detectedTopics = [];
        state.currentRequestId = action.meta.requestId;
      })

      .addCase(searchCandidateMatches.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.searched = true;
        state.currentRequestId = null;
        state.results = action.payload.results;
        state.detectedTopics = action.payload.detectedTopics;
      })

      .addCase(searchCandidateMatches.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.currentRequestId = null;

        if (action.meta.aborted) {
          return;
        }

        state.error =
          action.payload ||
          "אירעה שגיאה בחיפוש מועמדים";
      });
  },
});

export const {
  setMatchQuery,
  resetCandidateMatch,
  clearMatchError,
} = candidateMatchSlice.actions;

export default candidateMatchSlice.reducer;
