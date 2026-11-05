// ייבוא ספריית React וההוק useState לניהול מצבי הצגת תגובות והקלדת טקסט
import React, { useState } from 'react';
// ייבוא טיפוס הנתונים (Interface) של מועמד מתוך קובץ הטיפוסים המרכזי
import type { Candidate } from '../types';

// הגדרת מבנה הנתונים (Props) שהרכיב מקבל מבחוץ
interface CandidateCardProps {
  candidate: Candidate;                  // אובייקט המועמד שמכיל את פרטיו
  onLike: (id: string) => void;          // פונקציה לעדכון לייק למועמד
  onAddComment: (candidateId: string, commentText: string) => void; // פונקציה להוספת תגובה
}

// הגדרת רכיב כרטיס המועמד המציג את פרטי המועמד בפיד
export function CandidateCard({ candidate, onLike, onAddComment }: CandidateCardProps) {
  // משתנה State המציין האם אזור התגובות פתוח או סגור כרגע
  const [showComments, setShowComments] = useState<boolean>(false);
  // משתנה State לשמירת הטקסט שמקליד המשתמש בשדה הוספת התגובה
  const [newComment, setNewComment] = useState<string>('');

  // פונקציה המופעלת בעת שליחת טופס הוספת תגובה
  const handleCommentSubmit = (e: React.FormEvent) => {
    // מניעת רענון ברירת המחדל של הדפדפן בשליחת טופס
    e.preventDefault();
    // בדיקה שהתגובה אינה ריקה או מורכבת מרווחים בלבד
    if (!newComment.trim()) return;
    
    // קריאה לפונקציה החיצונית להוספת התגובה עם מזהה המועמד ותוכן התגובה
    onAddComment(candidate.id, newComment.trim());
    // איפוס שדה הקלט של התגובה לאחר השליחה המוצלחת
    setNewComment(''); 
  };

  // החזרת מבנה ה-JSX המעוצב של כרטיס המועמד
  return (
    // מעטפת ראשית מעוצבת לכרטיס המועמד
    <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      
      {/* אזור כותרת הכרטיס הכולל תמונת פרופיל/אווטאר, שם ותפקיד */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        {/* עיגול האווטאר המציג את ראשי התיבות של שם המועמד */}
        <div style={{ width: '44px', height: '44px', background: candidate.avatarBg || '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569' }}>
          {candidate.name.substring(0, 2)}
        </div>
        {/* פרטי השם והתפקיד של המועמד */}
        <div>
          <strong style={{ fontSize: '1.05rem' }}>{candidate.name}</strong>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{candidate.role}</div>
        </div>
      </div>

      {/* הצגת תיאור פועלו וחזונות של המועמד */}
      <p style={{ color: '#334155', lineHeight: '1.5' }}>{candidate.description}</p>

      {/* תצוגה מותנית: הצגת קוביית סרטון ההסבר אם קיים כזה */}
      {candidate.videoTitle && (
        <div style={{ background: '#0f172a', color: 'white', height: '140px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0', fontSize: '0.9rem' }}>
          🎬 {candidate.videoTitle}
        </div>
      )}

      {/* סרגל כפתורי האינטראקציה: כפתור לייקים וכפתור פתיחת תגובות */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.9rem' }}>
        {/* כפתור לייקים המעודכן במספר הלייקים הנוכחי */}
        <button 
          onClick={() => onLike(candidate.id)}
          style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
        >
          ❤️ {candidate.likesCount} לייקים
        </button>
        {/* כפתור פתיחה/סגירה של אזור התגובות */}
        <button 
          onClick={() => setShowComments(!showComments)}
          style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
        >
          💬 {candidate.comments.length} תגובות
        </button>
      </div>

      {/* אזור תצוגת התגובות והוספת תגובה חדשה (מוצג רק כאשר showComments הוא true) */}
      {showComments && (
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
          
          {/* בדיקה האם קיימות תגובות או הצגת הודעה שאין עדיין תגובות */}
          {candidate.comments.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>טרם נכתבו תגובות למועמד זה.</div>
          ) : (
            // מעבר בלולאה על כל התגובות הקיימות והצגתן במסגרת מעוצבת
            candidate.comments.map((comment) => (
              <div key={comment.id} style={{ fontSize: '0.85rem', background: '#f8fafc', padding: '8px 10px', borderRadius: '4px', marginBottom: '6px', border: '1px solid #e2e8f0' }}>
                <strong>{comment.author}:</strong> {comment.text}
              </div>
            ))
          )}

          {/* טופס להקלדה והוספה של תגובה חדשה */}
          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {/* שדה קלט לטקסט התגובה */}
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="כתוב תגובה..."
              style={{ flex: 1, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
            {/* כפתור שליחת התגובה */}
            <button 
              type="submit"
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
            >
              הגב
            </button>
          </form>
        </div>
      )}
    </div>
  );
}