
import { createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = "https://localhost:7227/api/Auth";

// הנתונים שנשלחים בשלב הראשון
export interface LoginStep1Dto {
  idNumber: string;
  password: string;
}

// הנתונים שנשלחים באימות הקוד
export interface VerifyCodeDto {
  idNumber: string;
  code: string;
}

// התחברות שלב ראשון
export const loginStep1 = createAsyncThunk(
  "auth/loginStep1",
  async (data: LoginStep1Dto, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/login-step1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          result.message || "פרטי ההתחברות שגויים"
        );
      }

      return result;
    } catch {
      return rejectWithValue(
        "לא ניתן להתחבר לשרת"
      );
    }
  }
);

// אימות קוד - שלב שני בשרת
export const verifyLoginCode = createAsyncThunk(
  "auth/verifyCode",
  async (data: VerifyCodeDto, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/login-step2-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          result.message || "קוד האימות שגוי"
        );
      }

      return result;
    } catch {
      return rejectWithValue(
        "לא ניתן לאמת את הקוד מול השרת"
      );
    }
  }
);
