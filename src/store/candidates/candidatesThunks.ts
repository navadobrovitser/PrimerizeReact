
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Candidate } from "../../types";
import type { RootState } from "../store";
import { API_ORIGIN } from "../../config/api";

const API_URL = `${API_ORIGIN}/api/Candidates`;

export const fetchCandidates = createAsyncThunk<
  Candidate[],
  void,
  {
    state: RootState;
    rejectValue: string;
  }
>(
  "candidates/fetchCandidates",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      const response = await fetch(API_URL, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
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
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "לא ניתן להתחבר לשרת"
      );
    }
  }
);
