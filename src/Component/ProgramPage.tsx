
import { useState } from "react";
import "./ProgramPage.css";

interface ProgramPageProps {
  onCandidatesClick: () => void;
}

interface ProgramTopic {
  id: number;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  goals: string[];
}

const programTopics: ProgramTopic[] = [
  {
    id: 1,
    number: "01",
    title: "חינוך והשכלה",
    subtitle: "משקיעים בדור הבא",
    description:
      "תחום החינוך עומד במרכז הדיון על עתיד החברה. התוכנית בתחום זה מתמקדת באיכות הלמידה, בנגישות להשכלה ובהכנה לעולם התעסוקה המשתנה.",
    goals: [
      "שיפור איכות ההוראה והלמידה",
      "הרחבת ההזדמנויות להשכלה ולהכשרה",
      "קידום מיומנויות טכנולוגיות",
      "יצירת מסלולי התפתחות מקצועית",
    ],
  },
  {
    id: 2,
    number: "02",
    title: "כלכלה ותעסוקה",
    subtitle: "כלכלה שמאפשרת לצמוח",
    description:
      "תוכנית כלכלית נדרשת להתייחס ליוקר המחיה, להזדמנויות תעסוקה ולצמיחה ארוכת טווח. בתחום זה מוצגים הנושאים המרכזיים לדיון ולגיבוש מדיניות.",
    goals: [
      "עידוד עסקים קטנים ובינוניים",
      "הרחבת אפשרויות התעסוקה",
      "פיתוח הכשרות מקצועיות",
      "קידום תחרות וחדשנות",
    ],
  },
  {
    id: 3,
    number: "03",
    title: "בריאות ורווחה",
    subtitle: "שירותים נגישים ואיכותיים",
    description:
      "מערכות הבריאות והרווחה משפיעות על איכות החיים של כלל האזרחים. התוכנית בוחנת דרכים לשיפור השירותים ולחיזוק המענה לצרכים השונים.",
    goals: [
      "שיפור נגישות לשירותי בריאות",
      "קידום שירותים דיגיטליים",
      "חיזוק מערכות התמיכה בקהילה",
      "צמצום פערים בנגישות לשירותים",
    ],
  },
  {
    id: 4,
    number: "04",
    title: "חדשנות וטכנולוגיה",
    subtitle: "מכינים את העתיד",
    description:
      "הטכנולוגיה משנה את הדרך שבה אנשים עובדים, לומדים ומקבלים שירותים. התחום עוסק בשילוב פתרונות חדשניים ובפיתוח תשתיות מתקדמות.",
    goals: [
      "קידום שירותים ממשלתיים דיגיטליים",
      "פיתוח תשתיות טכנולוגיות",
      "עידוד יזמות וחדשנות",
      "הרחבת הנגישות לטכנולוגיה",
    ],
  },
  {
    id: 5,
    number: "05",
    title: "תחבורה ותשתיות",
    subtitle: "מחברים בין אנשים ומקומות",
    description:
      "תשתיות ותחבורה הן מרכיב מרכזי בפיתוח כלכלי וחברתי. בתחום זה נבחנים פתרונות לשיפור הניידות ולפיתוח תשתיות לטווח הארוך.",
    goals: [
      "שיפור מערכות התחבורה הציבורית",
      "פיתוח תשתיות באזורים שונים",
      "קידום פתרונות תחבורה חכמים",
      "שיפור הנגישות למרכזי תעסוקה",
    ],
  },
  {
    id: 6,
    number: "06",
    title: "סביבה ואיכות חיים",
    subtitle: "אחריות לעתיד",
    description:
      "איכות הסביבה משפיעה על הבריאות ועל איכות החיים. התחום מתמקד בתכנון סביבתי, בשמירה על משאבים ובפיתוח פתרונות בני קיימא.",
    goals: [
      "קידום תכנון סביבתי אחראי",
      "שיפור איכות המרחב הציבורי",
      "עידוד שימוש יעיל במשאבים",
      "פיתוח פתרונות סביבתיים חדשניים",
    ],
  },
];

export default function ProgramPage({
  onCandidatesClick,
}: ProgramPageProps) {
  const [expandedTopic, setExpandedTopic] =
    useState<number | null>(null);

  const toggleTopic = (id: number) => {
    setExpandedTopic((previous) =>
      previous === id ? null : id
    );
  };

  const scrollToTopics = () => {
    document
      .getElementById("program-topics")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="program-page" dir="rtl">
      {/* HERO */}
      <section className="program-hero">
        <div className="program-hero-content">
          <div className="program-eyebrow">
            תנופה / התוכנית שלנו
          </div>

          <h1>
            הדרך שלנו
            <span> לעתיד.</span>
          </h1>

          <p className="program-hero-description">
            חזון, יעדים ורעיונות למדיניות.
            כאן תוכלו להכיר את התחומים המרכזיים
            בתוכנית ולבחון את הנושאים שמעצבים
            את סדר היום הציבורי.
          </p>

          <div className="program-hero-buttons">
            <button
              type="button"
              className="program-primary-button"
              onClick={scrollToTopics}
            >
              גלו את התוכנית
              <span aria-hidden="true">←</span>
            </button>

            <button
              type="button"
              className="program-secondary-button"
              onClick={onCandidatesClick}
            >
              הכירו את המועמדים
            </button>
          </div>
        </div>

        <div className="program-hero-decoration">
          <div className="program-decoration-circle">
            <span>תנופה</span>
            <small>חושבים קדימה</small>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="program-intro">
        <div className="program-section-label">
          החזון שלנו
        </div>

        <h2>
          רעיונות גדולים.
          <br />
          <span>תוכנית ברורה.</span>
        </h2>

        <p>
          תוכנית ציבורית טובה מתחילה בהגדרת
          האתגרים, ממשיכה בהצבת יעדים ומסתיימת
          בדרכי פעולה שניתן לבחון ולמדוד.
          העמוד מציג את תחומי התוכנית בצורה
          ברורה ונגישה.
        </p>

        <div className="program-principles">
          <div className="program-principle">
            <strong>01</strong>
            <h3>שקיפות</h3>
            <p>הצגת מידע באופן ברור ונגיש.</p>
          </div>

          <div className="program-principle">
            <strong>02</strong>
            <h3>אחריות</h3>
            <p>הגדרת יעדים ובחינת התקדמות.</p>
          </div>

          <div className="program-principle">
            <strong>03</strong>
            <h3>חדשנות</h3>
            <p>בחינת פתרונות מתקדמים לאתגרים קיימים.</p>
          </div>
        </div>
      </section>

      {/* TOPICS */}
      <section
        className="program-topics-section"
        id="program-topics"
      >
        <div className="program-section-heading">
          <div>
            <span className="program-section-label">
              תחומי התוכנית
            </span>

            <h2>
              הנושאים שעל
              <span> סדר היום</span>
            </h2>
          </div>

          <p>
            לחצו על כל תחום כדי לקרוא
            על הנושאים והיעדים המרכזיים.
          </p>
        </div>

        <div className="program-topics-grid">
          {programTopics.map((topic) => {
            const isExpanded =
              expandedTopic === topic.id;

            return (
              <article
                key={topic.id}
                className={`program-topic-card ${
                  isExpanded ? "expanded" : ""
                }`}
              >
                <div className="program-topic-top">
                  <span className="program-topic-number">
                    {topic.number}
                  </span>

                  <span className="program-topic-line" />
                </div>

                <div className="program-topic-body">
                  <span className="program-topic-subtitle">
                    {topic.subtitle}
                  </span>

                  <h3>{topic.title}</h3>

                  <p>{topic.description}</p>
                </div>

                {isExpanded && (
                  <div
                    className="program-topic-details"
                    id={`topic-details-${topic.id}`}
                  >
                    <h4>נושאים מרכזיים</h4>

                    <ul>
                      {topic.goals.map((goal) => (
                        <li key={goal}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  className="program-topic-button"
                  onClick={() => toggleTopic(topic.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`topic-details-${topic.id}`}
                >
                  {isExpanded
                    ? "סגירת הפירוט"
                    : "לקריאת הפירוט"}

                  <span aria-hidden="true">
                    {isExpanded ? "↑" : "←"}
                  </span>
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* FINAL SECTION */}
      <section className="program-bottom-section">
        <div className="program-bottom-content">
          <span>האנשים שמאחורי הרעיונות</span>

          <h2>
            הכירו את המועמדים
            <br />
            שמציגים את הדרך שלהם.
          </h2>

          <p>
            לכל מועמד ניסיון, רעיונות
            ונקודת מבט משלו.
            בעמוד המועמדים תוכלו להכיר
            אותם ולקרוא את המידע שפרסמו.
          </p>

          <button
            type="button"
            onClick={onCandidatesClick}
          >
            מעבר לעמוד המועמדים
            <span aria-hidden="true">←</span>
          </button>
        </div>

        <div className="program-bottom-shape" />
      </section>
    </div>
  );
}
