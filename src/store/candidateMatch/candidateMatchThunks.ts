
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";

const API_URL = "https://localhost:7227/api/candidate-match";

export interface MatchCandidate {
  candidateId: number;
  name: string;
  slogan: string;
  profileImageUrl: string | null;
  score: number;
  explanation: string;
  matchedTopics: string[];
}

export interface CandidateMatchResponse {
  detectedTopics: string[];
  results: MatchCandidate[];
}

export const searchCandidateMatches = createAsyncThunk<
  CandidateMatchResponse,
  string,
  {
    state: RootState;
    rejectValue: string;
  }
>(
  "candidateMatch/search",
  async (query, { getState, rejectWithValue, signal }) => {
    const token = getState().auth.token;

    if (!token) {
      return rejectWithValue("יש להתחבר כדי לחפש מועמדים");
    }

    if (!query.trim()) {
      return rejectWithValue("יש להזין בקשת חיפוש");
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: query.trim(),
        }),
        signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return rejectWithValue(
            "ההתחברות פגה או שאין הרשאה. יש להתחבר מחדש."
          );
        }

        if (response.status === 429 || response.status === 503) {
          return rejectWithValue(
            "שירות החיפוש עמוס כרגע. נסו שוב בעוד רגע."
          );
        }

        return rejectWithValue(
          `שגיאה בחיפוש מועמדים (${response.status})`
        );
      }

      const data: CandidateMatchResponse =
        await response.json();

      if (
        !Array.isArray(data.results) ||
        !Array.isArray(data.detectedTopics)
      ) {
        return rejectWithValue(
          "השרת החזיר נתונים בפורמט לא תקין"
        );
      }

      return data;
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(
        "לא ניתן להתחבר לשרת. בדקי ששרת C# פועל."
      );
    }
  }
);
