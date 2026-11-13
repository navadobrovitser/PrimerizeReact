import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { registerUser } from "../store/users/usersThunks";
import { clearRegisterStatus } from "../store/users/usersSlice";

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterScreen({
  onRegisterSuccess,
  onSwitchToLogin,
}: RegisterScreenProps) {
  const dispatch = useAppDispatch();

  const { loading, error, successMessage } = useAppSelector(
    (state) => state.users
  );

  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [validationError, setValidationError] = useState("");

  const clearErrors = () => {
    setValidationError("");
    if (error) {
      dispatch(clearRegisterStatus());
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: "14px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    marginBottom: "6px",
    fontSize: "0.95rem",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setValidationError("");
    dispatch(clearRegisterStatus());

    if (!fullName.trim()) {
      setValidationError("יש להזין שם מלא");
      return;
    }

    if (!/^\d{9}$/.test(idNumber)) {
      setValidationError("תעודת זהות חייבת להכיל 9 ספרות");
      return;
    }

    if (!/^05\d{8}$/.test(phone)) {
      setValidationError("יש להזין מספר טלפון תקין");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError("כתובת האימייל אינה תקינה");
      return;
    }

    if (password.length < 8) {
      setValidationError("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("הסיסמאות אינן תואמות");
      return;
    }

    if (!gender) {
      setValidationError("יש לבחור מגדר");
      return;
    }

    const result = await dispatch(
      registerUser({
        id: idNumber,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone,
        gender,
      })
    );

    if (registerUser.fulfilled.match(result)) {
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        maxWidth: "420px",
        margin: "40px auto",
        background: "white",
        padding: "24px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          textAlign: "center",
          color: "#1e3a8a",
        }}
      >
        הוספת חבר מפלגה
      </h3>

      {successMessage ? (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "42px",
              color: "#0d9488",
              marginBottom: "15px",
            }}
          >
            ✓
          </div>

          <h3 style={{ color: "#0d9488" }}>
            {successMessage}
          </h3>

          <p>בקשת ההצטרפות נשלחה בהצלחה וממתינה לאישור מנהל.</p>

          <button
            type="button"
            onClick={() => {
              dispatch(clearRegisterStatus());
              onRegisterSuccess();
            }}
            style={{
              width: "100%",
              background: "#0d9488",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            המשך
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>שם מלא:</label>
            <input
              style={inputStyle}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearErrors();
              }}
              placeholder="הזן שם מלא"
              maxLength={50}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>תעודת זהות:</label>
            <input
              style={inputStyle}
              value={idNumber}
              onChange={(e) => {
                setIdNumber(
                  e.target.value.replace(/\D/g, "").slice(0, 9)
                );
                clearErrors();
              }}
              placeholder="9 ספרות"
              inputMode="numeric"
              maxLength={9}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>טלפון נייד:</label>
            <input
              style={inputStyle}
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearErrors();
              }}
              placeholder="0526775666"
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>כתובת אימייל:</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrors();
              }}
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>סיסמה:</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearErrors();
              }}
              placeholder="לפחות 8 תווים"
              autoComplete="new-password"
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>אימות סיסמה:</label>
            <input
              style={inputStyle}
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearErrors();
              }}
              placeholder="הקלידי שוב את הסיסמה"
              autoComplete="new-password"
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>מגדר:</label>
            <select
              style={inputStyle}
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                clearErrors();
              }}
              required
            >
              <option value="">בחרי מגדר</option>
              <option value="נקבה">נקבה</option>
              <option value="זכר">זכר</option>
            </select>
          </div>

          {(validationError || error) && (
            <div
              role="alert"
              aria-live="polite"
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                padding: "12px 14px",
                borderRadius: "8px",
                marginBottom: "15px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              ⚠ {validationError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#94a3b8" : "#2563eb",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "שולח בקשה..." : "הוספת חבר מפלגה"}
          </button>
        </form>
      )}

      <div
        style={{
          textAlign: "center",
          marginTop: "16px",
          fontSize: "0.9rem",
        }}
      >
        <button
          type="button"
          onClick={() => {
            dispatch(clearRegisterStatus());
            onSwitchToLogin();
          }}
          style={{
            background: "none",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          חזרה להתחברות
        </button>
      </div>
    </div>
  );
}