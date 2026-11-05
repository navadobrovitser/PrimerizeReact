// ייבוא ספריית React וההוק useState לניהול מצב המסך הנוכחי באפליקציה
import React, { useState } from 'react';
// ייבוא רכיב מסך ההתחברות
import { LoginScreen } from './Component/LoginScreen';
// ייבוא רכיב מסך ההרשמה
import { RegisterScreen } from './Component/RegisterScreen';
// ייבוא רכיב לוח העדכונים (הפיד)
import { FeedScreen } from './Component/FeedScreen';
// ייבוא רכיב מסך הוספת מועמד חדש
import { AddCandidateScreen } from './Component/AddCandidateScreen';

// הגדרת הרכיב הראשי והמרכזי של המערכת (App)
export function App() {
  // הגדרת משתנה State לניהול המסך המוצג כרגע (מתחיל במסך 'login' כברירת מחדל)
  const [currentScreen, setCurrentScreen] = useState<string>('login');

  // משתנה בוליאני לבדיקה האם המשתמש מחובר (נמצא בפיד או במסך הוספת מועמד) לצורך הצגת סרגל הניווט
  const isLoggedIn = currentScreen === 'feed' || currentScreen === 'add-candidate';

  // החזרת מבנה ה-JSX המעוצב של האפליקציה כולה
  return (
    // מעטפת ראשית המגדירה את עיצוב הבסיס, כיוון כתיבה מימין לשמאל (RTL) וצבע רקע
    <div style={{ fontFamily: 'system-ui, sans-serif', direction: 'rtl', background: '#f1f5f9', minHeight: '100vh', margin: 0, padding: '20px' }}>
      
      {/* כותרת עליונה ראשית של המערכת */}
      <header style={{ background: '#1e3a8a', color: 'white', padding: '16px 24px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>מערכת פריימריז והצבעות</h1>
      </header>

      {/* תצוגה מותנית: סרגל ניווט עליון קבוע המופיע אך ורק לאחר שהמשתמש התחבר בהצלחה */}
      {isLoggedIn && (
        <nav style={{ maxWidth: '600px', margin: '0 auto 20px auto', display: 'flex', gap: '10px', justifyContent: 'center', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          
          {/* כפתור מעבר ללוח העדכונים (הפיד) */}
          <button
            onClick={() => setCurrentScreen('feed')}
            style={{ 
              background: currentScreen === 'feed' ? '#1e3a8a' : '#f8fafc', 
              color: currentScreen === 'feed' ? 'white' : '#1e3a8a', 
              border: '1px solid #cbd5e1', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 600,
              flex: 1
            }}
          >
            📋 לוח עדכונים (פיד)
          </button>
          
          {/* כפתור מעבר למסך הוספת מועמד חדש */}
          <button
            onClick={() => setCurrentScreen('add-candidate')}
            style={{ 
              background: currentScreen === 'add-candidate' ? '#1e3a8a' : '#f8fafc', 
              color: currentScreen === 'add-candidate' ? 'white' : '#1e3a8a', 
              border: '1px solid #cbd5e1', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 600,
              flex: 1
            }}
          >
            ➕ הוסף מועמד חדש
          </button>

          {/* כפתור התנתקות המאפשר לחזור למסך ההתחברות */}
          <button
            onClick={() => setCurrentScreen('login')}
            style={{ 
              background: '#fee2e2', 
              color: '#991b1b', 
              border: '1px solid #fca5a5', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 600 
            }}
          >
            🚪 התנתק
          </button>
        </nav>
      )}

      {/* אזור התוכן המרכזי המציג את המסך הנוכחי בהתאם למשתנה ה-State */}
      <main>
        {/* תצוגת מסך ההתחברות (מוצג כאשר ערך הסטייט הוא 'login') */}
        {currentScreen === 'login' && (
          <div>
            {/* טעינת רכיב מסך ההתחברות והגדרת מעבר למסך הפיד בהצלחה */}
            <LoginScreen onLoginSuccess={() => setCurrentScreen('feed')} />
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              {/* כפתור מעבר לטופס הרשמה למשתמשים חדשים */}
              <button 
                onClick={() => setCurrentScreen('register')}
                style={{ background: 'transparent', border: '1px solid #1e3a8a', color: '#1e3a8a', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                אין לך חשבון? לחץ כאן להרשמה
              </button>
            </div>
          </div>
        )}

        {/* תצוגת מסך ההרשמה (מוצג כאשר ערך הסטייט הוא 'register') */}
        {currentScreen === 'register' && (
          <RegisterScreen 
            onRegisterSuccess={() => setCurrentScreen('feed')} 
            onSwitchToLogin={() => setCurrentScreen('login')} 
          />
        )}

        {/* תצוגת מסך הפיד (מוצג כאשר ערך הסטייט הוא 'feed') */}
        {currentScreen === 'feed' && (
          <FeedScreen onNavigateToAdd={() => setCurrentScreen('add-candidate')} />
        )}

        {/* תצוגת מסך הוספת מועמד (מוצג כאשר ערך הסטייט הוא 'add-candidate') */}
        {currentScreen === 'add-candidate' && (
          <AddCandidateScreen
            onCandidateAdded={() => setCurrentScreen('feed')}
            onCancel={() => setCurrentScreen('feed')}
          />
        )}
      </main>
    </div>
  );
}

// ייצוא רכיב האפליקציה כברירת מחדל
export default App;