
import { createAsyncThunk } from "@reduxjs/toolkit";

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  "https://localhost:7227"
).replace(/\/+$/, "");

const API_URL = `${API_ORIGIN}/api/Auth`;

export interface LoginStep1Dto {
  idNumber: string;
  password: string;
}

export interface VerifyCodeDto {
  idNumber: string;
  code: string;
}

interface ApiResponse {
  message?: string;
  token?: string;
  [key: string]: unknown;
}

async function readResponse(
  response: Response
): Promise<ApiResponse> {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      !Array.isArray(data)
    ) {
      return data as ApiResponse;
    }
  }

  return {};
}

function connectionError(error: unknown): string {
  console.error("Auth request failed:", error);

  return (
    `לא ניתן להתחבר לשרת (${API_ORIGIN}). ` +
    "ודאו שהשרת פועל, שכתובת ה-API נכונה " +
    "ושאישור HTTPS תקין."
  );
}

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
      return rejectWithValue(
        connectionError(error)
      );
    }
  }
);

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
      return rejectWithValue(
        connectionError(error)
      );
    }
  }
);
