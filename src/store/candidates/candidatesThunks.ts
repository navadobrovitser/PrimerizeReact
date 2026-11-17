
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Candidate } from "../../types";
import { API_ORIGIN } from "../../config/api";

const API_URL = `${API_ORIGIN}/api/Candidates`;

export const fetchCandidates = createAsyncThunk<
  Candidate[],
  void,
  { rejectValue: string }
>(
  "candidates/fetchCandidates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
      });

      if (!response.ok) {
        return rejectWithValue(
          `שגיאה בטעינת המועמדים (${response.status})`
        );
      }

      const candidates: Candidate[] =
        await response.json();

      return candidates;
    } catch (error) {
      console.error("Fetch candidates error:", error);

      return rejectWithValue(
        "לא ניתן להתחבר לשרת לצורך טעינת המועמדים."
      );
    }
  }
);
