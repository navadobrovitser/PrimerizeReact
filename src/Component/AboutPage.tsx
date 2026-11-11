
import "./AboutPage.css";

interface AboutPageProps {
  onCandidatesClick?: () => void;
  onProgramClick?: () => void;
}

const principles = [
  {
    number: "01",
    title: "אחריות ציבורית",
    description:
      "קבלת החלטות מתוך מחויבות לציבור, הצבת יעדים ברורים ובחינה מתמדת של התוצאות.",
  },
  {
    number: "02",
    title: "שקיפות",
    description:
      "הנגשת מידע לחברי המפלגה, הצגת תהליכי קבלת ההחלטות ועידוד שיח פתוח.",
  },
  {
    number: "03",
    title: "שיתוף חברים",
    description:
      "מתן אפשרות לחברי המפלגה להכיר מועמדים, להביע עמדות ולהשתתף בתהליכי הבחירה.",
  },
  {
    number: "04",
    title: "חשיבה מתקדמת",
    description:
      "בחינת רעיונות חדשים ושילוב כלים דיגיטליים לשיפור תהליכים ארגוניים וציבוריים.",
  },
];

const structure = [
  {
    number: "01",
    title: "חברי המפלגה",
    description:
      "חברי המפלגה הם חלק מרכזי בפעילות הארגון ומשתתפים בתהליכי הבחירה הפנימיים.",
  },
  {
    number: "02",
    title: "המועמדים",
    description:
      "מציגים את ניסיונם, חזונם ועמדותיהם באמצעות פרופילים אישיים, פרסומים ועדכונים.",
  },
  {
    number: "03",
    title: "הנהלת המפלגה",
    description:
      "אחראית על ניהול הפעילות השוטפת, קביעת נהלים ופיקוח על תהליכים ארגוניים.",
  },
  {
    number: "04",
    title: "מערכת הבחירות",
    description:
      "מאפשרת לחברים בעלי הרשאה להשתתף בהצבעות בהתאם למועדים ולכללים שנקבעו.",
  },
];

export default function AboutPage({
  onCandidatesClick,
  onProgramClick,
}: AboutPageProps) {
  return (
    <div className="about-page" dir="rtl">
      {/* כותרת העמוד */}
      <section className="about-intro">
        <div className="about-container">
          <div className="about-breadcrumb">
            <span>תנופה</span>
            <span className="about-breadcrumb-divider">/</span>
            <strong>אודות</strong>
          </div>

          <div className="about-intro-content">
            <div>
              <span className="about-eyebrow">
                אודות המפלגה
              </span>

              <h1>להכיר את תנופה</h1>

              <p>
                הרקע להקמת המפלגה, הדרך שבה היא
                פועלת והעקרונות שמנחים את פעילותה.
              </p>
            </div>

            <div className="about-intro-mark">
              <span>תנופה</span>
              <small>מפלגה לדוגמה</small>
            </div>
          </div>
        </div>
      </section>

      {/* הסיפור */}
      <section className="about-story">
        <div className="about-container about-story-layout">
          <aside className="about-section-aside">
            <span className="about-section-index">01 / 05</span>
            <h2>הסיפור שלנו</h2>
            <div className="about-short-line" />
          </aside>

          <div className="about-story-content">
            <h3>
              מפלגה שנוסדה מתוך רצון
              לקדם דרך ציבורית חדשה.
            </h3>

            <p>
              תנופה היא מפלגה בדיונית שהוקמה
              מתוך תפיסה שלפיה פעילות ציבורית
              משמעותית דורשת אחריות, הקשבה
              ושיתוף של חברי הארגון.
            </p>

            <p>
              הרעיון העומד בבסיס המפלגה הוא
              לאפשר לחברים לקחת חלק פעיל
              בתהליכים הפנימיים שלה, להכיר
              את האנשים המבקשים לייצג אותם
              ולקבל מידע מסודר לפני קבלת החלטות.
            </p>

            <p>
              המפלגה משלבת מבנה ארגוני מסודר
              עם מערכת דיגיטלית המאפשרת
              ניהול מועמדים, פרסום עדכונים
              וקיום תהליכי בחירה.
            </p>
          </div>
        </div>
      </section>

      {/* חזון */}
      <section className="about-vision">
        <div className="about-container about-vision-layout">
          <div>
            <span className="about-light-label">
              החזון שלנו
            </span>

            <h2>
              ארגון ציבורי המבוסס
              על אחריות, שיתוף
              וחשיבה קדימה.
            </h2>
          </div>

          <div className="about-vision-text">
            <p>
              חזונה של תנופה הוא ליצור מסגרת
              שבה תהליכים ארגוניים מתקיימים
              באופן מסודר, נגיש ושקוף.
            </p>

            <p>
              אנחנו מאמינים בחשיבות של מידע
              אמין, דיון ענייני ומעורבות
              של חברי המפלגה בתהליכי הבחירה.
            </p>
          </div>
        </div>
      </section>

      {/* עקרונות */}
      <section className="about-principles">
        <div className="about-container">
          <div className="about-section-header">
            <div>
              <span className="about-section-index">
                02 / 05
              </span>
              <h2>העקרונות שלנו</h2>
            </div>

            <p>
              ארבעה עקרונות מרכזיים שעליהם
              מבוססת הפעילות הארגונית של תנופה.
            </p>
          </div>

          <div className="about-principles-grid">
            {principles.map((item) => (
              <article
                className="about-principle"
                key={item.number}
              >
                <span className="about-principle-number">
                  {item.number}
                </span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* מבנה המפלגה */}
      <section className="about-structure">
        <div className="about-container">
          <div className="about-section-header">
            <div>
              <span className="about-section-index">
                03 / 05
              </span>
              <h2>איך המפלגה פועלת?</h2>
            </div>

            <p>
              המבנה הארגוני מאפשר חלוקת
              אחריות ברורה והשתתפות של
              חברי המפלגה בפעילותה.
            </p>
          </div>

          <div className="about-structure-list">
            {structure.map((item) => (
              <div
                className="about-structure-row"
                key={item.number}
              >
                <span className="about-structure-number">
                  {item.number}
                </span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* בחירות פנימיות */}
      <section className="about-primaries">
        <div className="about-container about-primaries-layout">
          <div className="about-primaries-main">
            <span className="about-section-index">
              04 / 05
            </span>

            <h2>תהליך הפריימריז</h2>

            <p>
              הפריימריז הם חלק מהמערכת
              הארגונית של תנופה. במסגרת
              התהליך, חברי המפלגה יכולים
              להכיר את המועמדים ולהשתתף
              בהצבעה בהתאם לכללים
              ולהרשאות שנקבעו.
            </p>

            <p>
              לכל מועמד מוצג פרופיל אישי
              הכולל מידע, ניסיון, חזון
              ופרסומים. כך ניתן להתרשם
              מהמועמדים לפני ההצבעה.
            </p>

            <button
              type="button"
              className="about-link-button"
              onClick={onCandidatesClick}
            >
              לצפייה במועמדים
              <span aria-hidden="true">←</span>
            </button>
          </div>

          <div className="about-process">
            <div className="about-process-item">
              <span>01</span>
              <div>
                <h3>היכרות עם המועמדים</h3>
                <p>
                  צפייה בפרופילים ובמידע
                  שהמועמדים מפרסמים.
                </p>
              </div>
            </div>

            <div className="about-process-item">
              <span>02</span>
              <div>
                <h3>בחינת העמדות</h3>
                <p>
                  קריאת פרסומים והיכרות
                  עם תחומי הפעילות.
                </p>
              </div>
            </div>

            <div className="about-process-item">
              <span>03</span>
              <div>
                <h3>השתתפות בהצבעה</h3>
                <p>
                  הצבעה בתקופה שנקבעה,
                  בהתאם לזכאות המשתמש.
                </p>
              </div>
            </div>

            <div className="about-process-item">
              <span>04</span>
              <div>
                <h3>פרסום תוצאות</h3>
                <p>
                  הצגת התוצאות לאחר
                  השלמת תהליך הבחירה.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* מידע נוסף */}
      <section className="about-more">
        <div className="about-container">
          <div className="about-more-inner">
            <div>
              <span className="about-section-index">
                05 / 05
              </span>

              <h2>רוצים להכיר את התוכנית שלנו?</h2>

              <p>
                בעמוד התוכנית ניתן לקרוא
                על תחומי הפעילות, היעדים
                והנושאים שבהם המפלגה עוסקת.
              </p>
            </div>

            <button
              type="button"
              className="about-more-button"
              onClick={onProgramClick}
            >
              לתוכנית המפלגה
              <span aria-hidden="true">←</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
