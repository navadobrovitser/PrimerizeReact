
import "./HomePage.css";
interface HomePageProps {
  onJoinClick?: () => void;
  onProgramClick?: () => void;
}

const values = [
  {
    number: "01",
    title: "שקיפות ואחריות",
    description:
      "אנחנו מאמינים שמנהיגות טובה מתחילה באחריות ציבורית, בקבלת החלטות שקופה ובהצגת תוצאות ברורות.",
  },
  {
    number: "02",
    title: "שיתוף הציבור",
    description:
      "החלטות משמעותיות צריכות להישען על הקשבה אמיתית לציבור ועל מתן מקום למגוון רעיונות וקולות.",
  },
  {
    number: "03",
    title: "חדשנות וקידמה",
    description:
      "אנחנו שואפים לקדם פתרונות מעשיים באמצעות טכנולוגיה, חשיבה יצירתית ושיפור השירותים הציבוריים.",
  },
  {
    number: "04",
    title: "עשייה ותוצאות",
    description:
      "לא מספיק להציג חזון. חשוב להציב יעדים, למדוד התקדמות ולפעול בעקביות להשגתם.",
  },
];

const areas = [
  {
    number: "01",
    title: "חינוך והכשרה",
    description:
      "קידום חינוך איכותי, פיתוח מיומנויות לעתיד והרחבת הזדמנויות ללמידה ולהכשרה מקצועית.",
  },
  {
    number: "02",
    title: "כלכלה ותעסוקה",
    description:
      "עידוד יזמות, תמיכה בעסקים קטנים ופיתוח הזדמנויות תעסוקה ברחבי הארץ.",
  },
  {
    number: "03",
    title: "טכנולוגיה וחדשנות",
    description:
      "שיפור השירותים הממשלתיים באמצעות כלים דיגיטליים והנגשת שירותים לציבור.",
  },
  {
    number: "04",
    title: "קהילה וחברה",
    description:
      "חיזוק יוזמות מקומיות, עידוד התנדבות ויצירת שיתופי פעולה בין קהילות.",
  },
];

export default function HomePage({
  onJoinClick,
  onProgramClick,
}: HomePageProps) {
  return (
    <div className="about-page" dir="rtl">
      {/* אזור פתיחה */}
      <section className="about-hero">
        <div className="about-container">
          <div className="about-hero-content">
            <span className="about-eyebrow">
              להכיר את תנופה
            </span>

            <h1>
              דרך חדשה לחשוב.
              <br />
              דרך חדשה להתקדם.
            </h1>

            <p>
              תנופה היא מפלגה המבקשת לקדם מנהיגות
              אחראית, חדשנות ציבורית ושיתוף אמיתי
              של חבריה בתהליכי קבלת ההחלטות.
            </p>

            <div className="about-hero-actions">
              <button
                type="button"
                className="about-button-primary"
               onClick={onJoinClick}
              >
                הכירו את המועמדים
                <span aria-hidden="true">←</span>
              </button>

              <button
                type="button"
                className="about-button-outline"
                onClick={onProgramClick}
              >
                לתוכנית המפלגה
              </button>
            </div>
          </div>

          <div className="about-hero-art" aria-hidden="true">
            <div className="about-art-ring about-art-ring-one" />
            <div className="about-art-ring about-art-ring-two" />

            <div className="about-art-center">
              <span>תנופה</span>
              <small>חושבים קדימה.</small>
            </div>

            <div className="about-art-line" />
          </div>
        </div>
      </section>

      {/* סיפור המפלגה */}
      <section className="about-story">
        <div className="about-container about-story-grid">
          <div>
            <span className="about-section-label">
              הסיפור שלנו
            </span>

            <h2>
              שינוי משמעותי
              <br />
              מתחיל ברעיון.
            </h2>
          </div>

          <div className="about-story-text">
            <p>
              תנופה נוסדה מתוך תפיסה שלפיה
              התקדמות ציבורית מתחילה בהקשבה,
              באחריות ובנכונות לבחון דרכים חדשות.
            </p>

            <p>
              המפלגה מבקשת ליצור מסגרת שבה חברים
              יכולים להכיר מועמדים, לבחון את
              עמדותיהם, לשאול שאלות ולהשתתף
              בתהליכי בחירה באופן נגיש ושקוף.
            </p>

            <p>
              באמצעות שילוב של עשייה ציבורית
              וטכנולוגיה, תנופה שואפת לחבר בין
              רעיונות לבין אנשים המסוגלים
              להוציא אותם לפועל.
            </p>
          </div>
        </div>
      </section>

      {/* משפט מרכזי */}
      <section className="about-statement">
        <div className="about-container">
          <span>החזון שלנו</span>

          <h2>
            לבנות מערכת ציבורית שמקשיבה לאנשים,
            מקדמת רעיונות טובים ומודדת הצלחה
            לפי העשייה בשטח.
          </h2>

          <div className="about-statement-accent" />
        </div>
      </section>

      {/* ערכי המפלגה */}
      <section className="about-values">
        <div className="about-container">
          <div className="about-section-heading">
            <div>
              <span className="about-section-label">
                העקרונות שמנחים אותנו
              </span>

              <h2>הערכים שלנו</h2>
            </div>

            <p>
              ארבעה עקרונות שמלווים את הדרך שלנו
              ואת תהליכי קבלת ההחלטות.
            </p>
          </div>

          <div className="about-values-grid">
            {values.map((value) => (
              <article
                className="about-value-card"
                key={value.number}
              >
                <span className="about-value-number">
                  {value.number}
                </span>

                <h3>{value.title}</h3>

                <p>{value.description}</p>

                <div className="about-value-bottom" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* תחומי פעילות */}
      <section className="about-areas">
        <div className="about-container">
          <div className="about-section-heading">
            <div>
              <span className="about-section-label">
                מסתכלים קדימה
              </span>

              <h2>במה אנחנו מתמקדים?</h2>
            </div>

            <p>
              תחומי הפעילות שבהם תנופה מבקשת
              לפתח רעיונות ולקדם פתרונות.
            </p>
          </div>

          <div className="about-areas-list">
            {areas.map((area) => (
              <article
                className="about-area-row"
                key={area.number}
              >
                <span className="about-area-number">
                  {area.number}
                </span>

                <h3>{area.title}</h3>

                <p>{area.description}</p>

                <span
                  className="about-area-arrow"
                  aria-hidden="true"
                >
                  ↖
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* המערכת הדיגיטלית */}
      <section className="about-digital">
        <div className="about-container about-digital-grid">
          <div className="about-digital-content">
            <span className="about-section-label">
              המערכת הדיגיטלית של תנופה
            </span>

            <h2>
              הבחירה מתחילה
              <br />
              במידע.
            </h2>

            <p>
              האתר של תנופה מאפשר לחברי המפלגה
              להכיר את המועמדים, לקרוא פוסטים
              ועדכונים, להביע את דעתם ולהשתתף
              בתהליכי הבחירה.
            </p>

            <p>
              מערכת התאמת מועמדים מבוססת AI
              מסייעת לחברים למצוא מועמדים
              בהתאם לנושאים החשובים להם.
            </p>

            <button
              type="button"
              className="about-button-primary"
             onClick={onJoinClick}
            >
              לצפייה במועמדים
              <span aria-hidden="true">←</span>
            </button>
          </div>

          <div className="about-digital-preview">
            <div className="about-preview-top">
              <span>תנופה</span>
              <span className="about-preview-dots">
                <i />
                <i />
                <i />
              </span>
            </div>

            <div className="about-preview-body">
              <span className="about-preview-tag">
                אזור חברי המפלגה
              </span>

              <h3>הקול שלך. הבחירה שלך.</h3>

              <div className="about-preview-item">
                <span className="about-preview-square" />
                <div>
                  <strong>היכרות עם מועמדים</strong>
                  <small>
                    פרופילים, חזון ועדכונים
                  </small>
                </div>
              </div>

              <div className="about-preview-item">
                <span className="about-preview-square" />
                <div>
                  <strong>התאמה חכמה</strong>
                  <small>
                    חיפוש לפי תחומי עניין
                  </small>
                </div>
              </div>

              <div className="about-preview-item">
                <span className="about-preview-square" />
                <div>
                  <strong>השתתפות בהצבעות</strong>
                  <small>
                    תהליך דיגיטלי מאובטח
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* סיום */}
      <section className="about-final">
        <div className="about-container">
          <span className="about-section-label">
            ממשיכים קדימה
          </span>

          <h2>
            הכירו את האנשים
            <br />
            שמאחורי הרעיונות.
          </h2>

          <p>
            לכל מועמד יש דרך, ניסיון וחזון משלו.
            היכנסו לעמוד המועמדים והכירו את
            האנשים המבקשים להוביל את תנופה.
          </p>

          <button
            type="button"
            className="about-button-primary"
            onClick={onJoinClick}
          >
            הכירו את המועמדים
            <span aria-hidden="true">←</span>
          </button>
        </div>
      </section>
    </div>
  );
}
