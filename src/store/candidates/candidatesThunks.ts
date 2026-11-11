
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Candidate } from "../../types";

const API_URL = "https://localhost:7227/api/Candidates";

export const fetchCandidates = createAsyncThunk<
  Candidate[],
  void,
  { rejectValue: string }
>(
  "candidates/fetchCandidates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        return rejectWithValue(
          `שגיאה בטעינת המועמדים (${response.status})`
        );
      }

      const candidates: Candidate[] =
        await response.json();

      return candidates;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "לא ניתן להתחבר לשרת"
      );
    }
  }
);
