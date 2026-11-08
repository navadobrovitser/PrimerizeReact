

import "./HomePage.css";


interface HomePageProps {
  onJoinClick?: () => void;
  onProgramClick?: () => void;
}

export default function HomePage({
  onJoinClick,
  onProgramClick,
}: HomePageProps) {
  return (
    <section className="tanufa-home">
      <div className="tanufa-home-inner">
        <div className="tanufa-home-content">
          <div className="tanufa-home-badge">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 17L10 10L14 14L21 5" />
              <path d="M15 5H21V11" />
            </svg>
            מפלגת תנופה
          </div>

          <h1 className="tanufa-home-title">
            תנופה - הכוח לשנות,
            <br />
            הדרך להתקדם
          </h1>

          <p className="tanufa-home-description">
            מפלגת תנופה קמה מתוך הרצון להוביל התחדשות,
            לקדם רעיונות חדשים ולבנות עתיד טוב יותר
            למדינת ישראל. אנחנו מאמינים בשיתוף הציבור,
            בהקשבה לקולות שונים ובעשייה שמובילה לתוצאות.
          </p>

          <div className="tanufa-home-actions">
            <button
              type="button"
              className="tanufa-home-join"
              onClick={onJoinClick}
            >
              הצטרפו לתנופה
            </button>

            <button
              type="button"
              className="tanufa-home-program"
              onClick={onProgramClick}
            >
              התכנית שלנו
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
