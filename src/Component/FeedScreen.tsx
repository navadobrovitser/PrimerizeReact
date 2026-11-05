// ייבוא ספריית React וההוק useState לניהול רשימת המועמדים והמצבים ברכיב
import React, { useState } from 'react';
// ייבוא טיפוס הנתונים (Interface) של מועמד מתוך קובץ הטיפוסים המרכזי
import type { Candidate } from '../types';
// ייבוא רכיב כרטיס המועמד האחראי על הצגת כל מועמד בנפרד
import { CandidateCard } from './CandidateCard';

// הגדרת מבנה הנתונים (Props) שהרכיב מקבל מבחוץ
interface FeedScreenProps {
  onNavigateToAdd: () => void; // פונקציה למעבר למסך הוספת מועמד חדש
}

// הגדרת רכיב הפיד (לוח העדכונים והמועמדים) המרכזי
export function FeedScreen({ onNavigateToAdd }: FeedScreenProps) {
  // הגדרת משתנה State המכיל את רשימת המועמדים (כולל נתונים זמניים לדוגמה עד לחיבור מלא מול השרת)
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'אבי רפפורט',
      role: 'מועמד לענייני ציבור ומינהל תקין',
      description: 'פועל רבות למען שקיפות מול הציבור, ייעול תהליכים מנהליים ומתן מענה אישי לכל פנייה.',
      avatarBg: '#3b82f6',
      videoTitle: 'סרטון חזון ועשייה ציבורית',
      likesCount: 8,
      comments: [
        { id: 'c1', author: 'מרדכי שפירא', text: 'עשייה חשובה מאין כמוה.' }
      ]
    },
    {
      id: '2',
      name: 'שמעון פרידמן',
      role: 'מועמד לקידום יוזמות קהילתיות',
      description: 'מקדם פרויקטים רוחניים וחברתיים לרווחת כלל תושבי הקהילה במסירות ובנאמנות.',
      avatarBg: '#10b981',
      videoTitle: 'סקירת פרויקטים קהילתיים לשנת הפעילות',
      likesCount: 15,
      comments: []
    }
  ]);

  // פונקציה לעדכון מספר הלייקים למועמד ספציפי לפי מזהה
  const handleLike = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likesCount: c.likesCount + 1 } : c))
    );
  };

  // פונקציה להוספת תגובה חדשה למועמד ספציפי ברשימה
  const handleAddComment = (candidateId: string, commentText: string) => {
    const newCommentObj = {
      id: String(Date.now()), // יצירת מזהה ייחודי המבוסס על חותמת זמן
      author: 'משתמש מחובר',    // שם הכותב המוצג בתגובה
      text: commentText,      // תוכן התגובה שהוקלד
    };
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, comments: [...c.comments, newCommentObj] } // הוספת התגובה החדשה למערך התגובות של אותו מועמד
          : c
      )
    );
  };

  // החזרת מבנה ה-JSX המעוצב של מסך הפיד
  return (
    // מעטפת ראשית ממורכזת המעוצבת באסתטיקה נקייה
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* שורת הכותרת העליונה הכוללת כותרת לוח עדכונים וכפתור מעבר להוספת מועמד */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1e3a8a', margin: 0 }}>לוח עדכונים ומועמדים</h2>
        <button
          onClick={onNavigateToAdd} // הפעלת פונקציית המעבר למסך הוספת מועמד חדש
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          + הוסף מועמד חדש
        </button>
      </div>

      {/* מעבר בלולאה על רשימת המועמדים והצגת רכיב כרטיס מועמד עבור כל אחד מהם */}
      {candidates.map((candidate) => (
        <CandidateCard 
          key={candidate.id}           // מזהה ייחודי לכל פריט ברשימה עבור מנוע ה-DOM של React
          candidate={candidate}        // העברת אובייקט הנתונים של המועמד לרכיב הכרטיס
          onLike={handleLike}          // העברת פונקציית הטיפול בלייקים
          onAddComment={handleAddComment} // העברת פונקציית הטיפול בהוספת תגובות
        />
      ))}
    </div>
  );
}