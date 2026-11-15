
import { createAsyncThunk } from "@reduxjs/toolkit";

// כתובת השרת לפי סביבת העבודה
const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://primerize.runasp.net"
).replace(/\/+$/, "");

const API_URL = `${API_ORIGIN}/api/Auth`;

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

// קריאת תשובה מהשרת, גם במקרה של שגיאה
async function readResponse(
  response: Response
): Promise<any> {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  return {};
}

// התחברות - שלב ראשון
export const loginStep1 = createAsyncThunk(
  "auth/loginStep1",
  async (
    data: LoginStep1Dto,
    { rejectWithValue }
  ) => {
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

      const result = await readResponse(response);

      if (!response.ok) {
        return rejectWithValue(
          result.message ||
            `ההתחברות נכשלה (${response.status})`
        );
      }

      return result;
    } catch (error) {
      console.error("Login step 1 error:", error);

      return rejectWithValue(
        "לא ניתן להתחבר לשרת. בדקו שהשרת פעיל ושכתובת ה-API תקינה."
      );
    }
  }
);

// אימות קוד - שלב שני
export const verifyLoginCode = createAsyncThunk(
  "auth/verifyCode",
  async (
    data: VerifyCodeDto,
    { rejectWithValue }
  ) => {
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

      const result = await readResponse(response);

      if (!response.ok) {
        return rejectWithValue(
          result.message ||
            `אימות הקוד נכשל (${response.status})`
        );
      }

      return result;
    } catch (error) {
      console.error("Login verification error:", error);

      return rejectWithValue(
        "לא ניתן לאמת את הקוד מול השרת. בדקו את החיבור ונסו שוב."
      );
    }
  }
);
