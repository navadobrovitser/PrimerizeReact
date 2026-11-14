
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";

const API_URL = "https://localhost:7227/api/Voting";

export interface VoteStatus {
  hasVoted: boolean;
}

interface CastVoteRequest {
  rankings: {
    candidateId: number;
    priority: number;
  }[];
}

export const fetchVoteStatus = createAsyncThunk<
  VoteStatus,
  void,
  { state: RootState; rejectValue: string }
>(
  "voting/fetchStatus",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;

    if (!token) {
      return rejectWithValue("יש להתחבר כדי להצביע");
    }

    try {
      const response = await fetch(`${API_URL}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return rejectWithValue(
          response.status === 401
            ? "פג תוקף ההתחברות. יש להתחבר מחדש."
            : "לא ניתן לבדוק את סטטוס ההצבעה"
        );
      }

      return (await response.json()) as VoteStatus;
    } catch {
      return rejectWithValue("שגיאה בחיבור לשרת");
    }
  }
);

export const castVote = createAsyncThunk<
  void,
  number[],
  { state: RootState; rejectValue: string }
>(
  "voting/castVote",
  async (candidateIds, { getState, rejectWithValue }) => {
    const token = getState().auth.token;

    if (!token) {
      return rejectWithValue("יש להתחבר כדי להצביע");
    }

    if (candidateIds.length < 1 || candidateIds.length > 5) {
      return rejectWithValue("יש לבחור בין מועמד אחד לחמישה");
    }

    const body: CastVoteRequest = {
      rankings: candidateIds.map((candidateId, index) => ({
        candidateId,
        priority: index + 1,
      })),
    };

    try {
      const response = await fetch(`${API_URL}/cast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return rejectWithValue(
            "פג תוקף ההתחברות. יש להתחבר מחדש."
          );
        }

        return rejectWithValue(
          "ההצבעה לא אושרה על ידי השרת. בדקי אם כבר הצבעת או אם הדירוג תקין."
        );
      }
    } catch {
      return rejectWithValue(
        "לא התקבל אישור מהשרת. בדקי את סטטוס ההצבעה לפני ניסיון חוזר."
      );
    }
  }
);
