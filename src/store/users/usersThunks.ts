import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RegisterUserDto } from "./usersState";

interface RegisterResponse {
  message: string;
}

export const registerUser = createAsyncThunk<
  RegisterResponse,
  RegisterUserDto,
  { rejectValue: string }
>(
  "users/register",
  async (user, { rejectWithValue }) => {
    try {
      const response = await fetch(
        "https://localhost:7227/api/Users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        const message = errorData?.errors
          ? Object.values(errorData.errors)
              .flat()
              .join(" ")
          : errorData?.message ||
            errorData?.detail ||
            "שגיאה בהרשמת המשתמש";

        return rejectWithValue(message);
      }

      return (await response.json()) as RegisterResponse;
    } catch {
      return rejectWithValue(
        "לא ניתן להתחבר לשרת. ודאי שהשרת פועל."
      );
    }
  }
);