// ייבוא ספריית React וההוק useState לניהול מצבי שדות הטופס ברכיב
import React, { useState } from 'react';

// הגדרת מבנה הנתונים (Props) שהרכיב מקבל מבחוץ
interface RegisterScreenProps {
  onRegisterSuccess: () => void; // פונקציה המופעלת בעת הצלחה ברישום למערכת
  onSwitchToLogin: () => void;   // פונקציה למעבר חזרה למסך ההתחברות
}

// הגדרת רכיב מסך ההרשמה למשתמשים חדשים במערכת
export function RegisterScreen({ onRegisterSuccess, onSwitchToLogin }: RegisterScreenProps) {
  // הגדרת משתנה State לשמירת השם המלא שהוקלד
  const [fullName, setFullName] = useState<string>('');
  
  // הגדרת משתנה State לשמירת מספר תעודת הזהות או מספר החבר
  const [idNumber, setIdNumber] = useState<string>('');
  
  // הגדרת משתנה State לשמירת מספר הטלפון הנייד
  const [phone, setPhone] = useState<string>('');
  
  // הגדרת משתנה State לשמירת תחום העיסוק או התפקיד המבוקש
  const [role, setRole] = useState<string>('');

  // פונקציה לטיפול בשליחת טופס ההרשמה
  const handleSubmit = (e: React.FormEvent) => {
    // מניעת רענון ברירת המחדל של הדפדפן בשליחת טופס
    e.preventDefault();
    
    // בדיקת תקינות מקומית: לוודא ששדות החובה (שם, תעודת זהות וטלפון) אינם ריקים
    if (!fullName.trim() || !idNumber.trim() || !phone.trim()) {
      alert('אנא מלא את כל שדות החובה');
      return;
    }
    
    // הצגת הודעת חיווי חיובית על הצלחת תהליך הרישום
    alert('הרישום בוצע בהצלחה!');
    
    // הפעלת פונקציית ההצלחה החיצונית למעבר אוטומטי למסך הבא
    onRegisterSuccess();
  };

  // החזרת מבנה ה-JSX המעוצב של מסך ההרשמה
  return (
    // מעטפת ראשית מעוצבת ככרטיס מרכזי נקי
    <div style={{ maxWidth: '420px', margin: '40px auto', background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      
      {/* כותרת ראשית למסך ההרשמה */}
      <h3 style={{ marginTop: '0', textAlign: 'center', color: '#1e3a8a' }}>הרשמה למערכת הפריימריז</h3>
      
      {/* טופס ההרשמה המקושר לפונקציית handleSubmit */}
      <form onSubmit={handleSubmit}>
        
        {/* שדה הזנת שם מלא */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.95rem' }}>
            שם מלא:
          </label>
          <input 
            type="text" 
            value={fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)} // עדכון סטייט השם בעת הקלדה
            placeholder="הזן את שמך המלא"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* שדה הזנת תעודת זהות או מספר חבר */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.95rem' }}>
            תעודת זהות / מספר חבר:
          </label>
          <input 
            type="text" 
            value={idNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdNumber(e.target.value)} // עדכון סטייט תעודת הזהות בעת הקלדה
            placeholder="לדוגמה: 012345678"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* שדה הזנת מספר טלפון נייד */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.95rem' }}>
            מספר טלפון נייד:
          </label>
          <input 
            type="tel" 
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} // עדכון סטייט מספר הטלפון בעת הקלדה
            placeholder="לדוגמה: 050-1234567"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* שדה הזנת תחום עיסוק או תפקיד מבוקש */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.95rem' }}>
            תחום עיסוק / תפקיד מבוקש:
          </label>
          <input 
            type="text" 
            value={role}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRole(e.target.value)} // עדכון סטייט תחום העיסוק בעת הקלדה
            placeholder="לדוגמה: חינוך, כלכלה, חברה"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* כפתור שליחת הטופס לביצוע הרישום */}
        <button 
          type="submit"
          style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}
        >
          הירשם למערכת
        </button>
      </form>

      {/* אזור מעבר למשתמשים שכבר רשומים (חזרה למסך התחברות) */}
      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem' }}>
        <span>כבר רשום במערכת? </span>
        <button 
          onClick={onSwitchToLogin} // הפעלת פונקציית המעבר חזרה למסך הכניסה
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
        >
          התחבר כאן
        </button>
      </div>
    </div>
  );
}