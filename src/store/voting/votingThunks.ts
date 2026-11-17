
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { API_ORIGIN } from "../../config/api";

const API_URL = `${API_ORIGIN}/api/Voting`;

export interface VoteStatus {
  hasVoted: boolean;
  voteDate?: string | null;
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
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        return rejectWithValue(
          "פג תוקף ההתחברות. יש להתחבר מחדש."
        );
      }

      if (!response.ok) {
        return rejectWithValue(
          `לא ניתן לבדוק את סטטוס ההצבעה (${response.status})`
        );
      }

      return (await response.json()) as VoteStatus;
    } catch (error) {
      console.error("Vote status error:", error);
      return rejectWithValue(
        "לא ניתן להתחבר לשרת לבדיקת סטטוס ההצבעה."
      );
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

    if (
      candidateIds.length < 1 ||
      candidateIds.length > 5 ||
      new Set(candidateIds).size !== candidateIds.length
    ) {
      return rejectWithValue(
        "יש לבחור בין מועמד אחד לחמישה, ללא כפילויות."
      );
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

      if (response.status === 401) {
        return rejectWithValue(
          "פג תוקף ההתחברות. יש להתחבר מחדש."
        );
      }

      if (response.status === 409) {
        return rejectWithValue(
          "ההצבעה נדחתה. ייתכן שהבחירות הסתיימו או שכבר הצבעת."
        );
      }

      if (!response.ok) {
        return rejectWithValue(
          `השרת לא אישר את ההצבעה (${response.status}).`
        );
      }
    } catch (error) {
      console.error("Cast vote error:", error);

      return rejectWithValue(
        "לא התקבל אישור מהשרת. בדקי אם ההצבעה נקלטה לפני ניסיון חוזר."
      );
    }
  }
);
