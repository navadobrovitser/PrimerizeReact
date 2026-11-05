// ייבוא ספריית React וההוק useState לניהול מצבי הטופס ברכיב
import React, { useState } from 'react';

// הגדרת מבנה הנתונים (Props) שהרכיב מקבל מבחוץ
interface LoginScreenProps {
  onLoginSuccess: () => void; // פונקציה המופעלת בעת הצלחה בכניסה למערכת
}

// הגדרת רכיב מסך ההתחברות למתנדבים וחברי ארגון
export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // משתנה State לשמירת מספר תעודת הזהות או מספר החבר שהוקלד
  const [idInput, setIdInput] = useState<string>('');
  
  // משתנה State בוליאני המציין האם קוד האימות (OTP) נשלח כבר
  const [otpSent, setOtpSent] = useState<boolean>(false);
  
  // משתנה State לשמירת קוד האימות (עם ערך ברירת מחדל לדוגמה)
  const [otpInput, setOtpInput] = useState<string>('582910');

  // פונקציה לטיפול בשליחת קוד האימות לאחר הזנת תעודת זהות
  const handleSendOtp = () => {
    // בדיקת תקינות: לוודא ששדה תעודת הזהות אינו ריק
    if (!idInput.trim()) {
      alert('אנא הזן מספר תעודת זהות או חבר ארגון');
      return;
    }
    // עדכון מצב השליחה לאמת כדי לעבור לשלב הזנת הקוד
    setOtpSent(true);
  };

  // פונקציה לטיפול בתהליך ההתחברות הסופי
  const handleLogin = (e: React.FormEvent) => {
    // מניעת רענון ברירת המחדל של הדפדפן בשליחת טופס
    e.preventDefault();
    // הפעלת פונקציית ההצלחה החיצונית למעבר למסך הפיד
    onLoginSuccess();
  };

  // החזרת מבנה ה-JSX המעוצב של מסך ההתחברות
  return (
    // מעטפת ראשית מעוצבת ככרטיס מרכזי
    <div style={{ maxWidth: '400px', margin: '40px auto', background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {/* כותרת ראשית למסך ההתחברות */}
      <h3 style={{ marginTop: '0', textAlign: 'center', color: '#1e3a8a' }}>כניסת מתנדבים וחברי ארגון</h3>
      
      {/* טופס ההתחברות המקושר לפונקציית handleLogin */}
      <form onSubmit={handleLogin}>
        
        {/* אזור הזנת תעודת זהות או מספר חבר */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.95rem' }}>
            מספר תעודת זהות / חבר מפלגה:
          </label>
          <input 
            type="text" 
            value={idInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdInput(e.target.value)} // עדכון סטייט בעת הקלדה
            placeholder="לדוגמה: 012345678" 
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* תצוגה מותנית לפי מצב שליחת קוד האימות (otpSent) */}
        {!otpSent ? (
          // כפתור לשליחת קוד אימות כל עוד הקוד טרם נשלח
          <button 
            type="button" 
            onClick={handleSendOtp} // הפעלת פונקציית מעבר לשלב הבא
            style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}
          >
            שלח קוד אימות ל-SMS
          </button>
        ) : (
          // אזור הזנת קוד האימות והשלמת ההתחברות לאחר שליחת הקוד
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.95rem' }}>
                הזן קוד אימות (6 ספרות):
              </label>
              <input 
                type="text" 
                value={otpInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtpInput(e.target.value)} // עדכון סטייט קוד האימות
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>
            {/* כפתור סיום התחברות */}
            <button 
              type="submit"
              style={{ width: '100%', background: '#059669', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              התחבר למערכת ➔
            </button>
          </div>
        )}
      </form>
    </div>
  );
}