
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RegisterUserDto } from "./usersState";

interface RegisterResponse {
  message: string;
}

interface ApiError {
  message?: string;
  detail?: string;
  title?: string;
  errors?: Record<string, string[]>;
}
import { API_ORIGIN } from "../../config/api";
export const registerUser = createAsyncThunk<
  RegisterResponse,
  RegisterUserDto,
  { rejectValue: string }
>(
  "users/register",
  async (user, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_ORIGIN}/api/Users/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        }
      );

      const responseText = await response.text();

      let data: ApiError = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText) as ApiError;
        } catch {
          // טיפול בתשובה שאינה JSON
        }
      }

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors)
              .flat()
              .join(" ")
          : "";

        const message =
          data.message ||
          validationErrors ||
          data.detail ||
          data.title ||
          `שגיאה בהרשמת המשתמש (${response.status})`;

        return rejectWithValue(message);
      }

      return {
        message:
          data.message ||
          "בקשת ההצטרפות נשלחה בהצלחה וממתינה לאישור מנהל.",
      };
    } catch {
      return rejectWithValue(
        "לא ניתן להתחבר לשרת. ודאי שהשרת פועל."
      );
    }
  }
);
