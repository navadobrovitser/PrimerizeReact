// ייבוא ספריית React וההוק useState לניהול מצבים (State) ברכיב
import React, { useState } from 'react';

// הגדרת הממשק (Interface) המגדיר את טיפוסי ה-Props שהרכיב מקבל מ-App.tsx
interface AddCandidateScreenProps {
  onCandidateAdded: () => void; // פונקציה לביצוע בעת הצלחת הוספת מועמד (מעבר חזרה לפיד)
  onCancel: () => void;         // פונקציה לביצוע בעת לחיצה על ביטול (חזרה לפיד)
}

// הגדרת הרכיב המרכזי להוספת מועמד חדש
export function AddCandidateScreen({ onCandidateAdded, onCancel }: AddCandidateScreenProps) {
  // הגדרת משתנה State לשמירת שם המועמד המוקלד
  const [name, setName] = useState('');
  
  // הגדרת משתנה State לשמירת תפקיד או תחום העיסוק של המועמד
  const [role, setRole] = useState('');
  
  // הגדרת משתנה State לשמירת תיאור הפועל והחזון של המועמד
  const [description, setDescription] = useState('');
  
  // הגדרת משתנה State בוליאני המציין האם השליחה לשרת בעיצומה (למניעת לחיצות כפולות)
  const [submitting, setSubmitting] = useState(false);

  // פונקציה אסינכרונית לטיפול בשליחת הטופס מול השרת ומסד הנתונים
  const handleSubmit = async (e: React.FormEvent) => {
    // מניעת התנהגות ברירת המחדל של טופס בדפדפן (מניעת רענון העמוד)
    e.preventDefault();
    
    // בדיקת תקינות מקומית: לוודא שכל שדות החובה אינם ריקים
    if (!name.trim() || !role.trim() || !description.trim()) {
      alert('אנא מלא את כל שדות החובה');
      return;
    }

    // עדכון מצב השליחה ל-true (מציג חיווי טעינה על הכפתור)
    setSubmitting(true);
    
    try {
      // שליחת בקשת HTTP POST אסינכרונית לשרת עם נתוני המועמד בפורמט JSON
      const response = await fetch('http://localhost:5000/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, description }),
      });

      // בדיקה האם תשובת השרת תקינה, ואם לא - זריקת שגיאה
      if (!response.ok) throw new Error('שגיאה בשמירת הנתונים בשרת');

      // הודעת חיווי חיובית למשתמש על הצלחת השמירה במסד הנתונים
      alert('המועמד נוסף בהצלחה למסד הנתונים!');
      
      // הפעלת פונקציית הריענון והמעבר חזרה לעמוד הפיד
      onCandidateAdded();
    } catch (err) {
      // תפיסת שגיאות תקשורת או שרת והצגת הודעה מתאימה
      alert('שגיאה בתקשורת מול השרת');
      console.error(err);
    } finally {
      // איפוס מצב השליחה חזרה ל-false בסיום התהליך
      setSubmitting(false);
    }
  };

  // החזרת מבנה ה-JSX של ממשק המשתמש
  return (
    // מעטפת מעוצבת בצורת כרטיס מרכזי
    <div style={{ maxWidth: '450px', margin: '40px auto', background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {/* כותרת הטופס */}
      <h3 style={{ marginTop: 0, textAlign: 'center', color: '#1e3a8a' }}>הוספת מועמד חדש</h3>
      
      {/* אלמנט הטופס המקשר את אירוע השליחה לפונקציית handleSubmit */}
      <form onSubmit={handleSubmit}>
        
        {/* אזור הזנת שם המועמד */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>שם המועמד:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)} // עדכון משתנה ה-State של השם בעת הקלדה
            placeholder="הזן שם מלא"
            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
          />
        </div>

        {/* אזור הזנת תפקיד המועמד */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>תפקיד / תחום עיסוק:</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)} // עדכון משתנה ה-State של התפקיד בעת הקלדה
            placeholder="הזן תפקיד"
            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
          />
        </div>

        {/* אזור הזנת תיאור פועלו של המועמד */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>תיאור פועלו:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)} // עדכון משתנה ה-State של התיאור בעת הקלדה
            placeholder="הזן תיאור קצר"
            rows={4}
            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        {/* שורת כפתורי הפעולה: שמירה וביטול */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* כפתור שמירה השולח את הטופס */}
          <button
            type="submit"
            disabled={submitting} // ניטרול הכפתור בזמן שליחה
            style={{ flex: 1, background: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            {/* שינוי טקסט הכפתור בהתאם למצב השליחה */}
            {submitting ? 'שומר בשרת...' : 'שמור מועמד'}
          </button>
          
          {/* כפתור ביטול החוזר למסך הקודם */}
          <button
            type="button"
            onClick={onCancel} // הפעלת פונקציית הביטול
            style={{ background: '#64748b', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}