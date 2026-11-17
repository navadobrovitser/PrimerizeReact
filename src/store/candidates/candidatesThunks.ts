
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { Candidate } from "../../types";
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
    const token = getState().auth.token;

    if (!token) {
      return rejectWithValue(
        "יש להתחבר לאתר כדי לצפות במועמדים."
      );
    }

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.status === 401) {
        return rejectWithValue(
          "פג תוקף ההתחברות או שהמשתמש אינו מאומת. יש להתחבר מחדש."
        );
      }

      if (response.status === 403) {
        return rejectWithValue(
          "אין הרשאה לצפות ברשימת המועמדים."
        );
      }

      if (!response.ok) {
        return rejectWithValue(
          `שגיאה בטעינת המועמדים (${response.status})`
        );
      }

      const candidates: Candidate[] =
        await response.json();

      return candidates;
    } catch (error) {
      console.error(
        "Fetch candidates error:",
        error
      );

      return rejectWithValue(
        "לא ניתן להתחבר לשרת לצורך טעינת המועמדים."
      );
    }
  }
);
