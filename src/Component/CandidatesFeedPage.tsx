
import CandidatePost from "./CandidatePost";
import type { CandidatePostData } from "./CandidatePost";
import "./CandidatesFeedPage.css";

const candidates: CandidatePostData[] = [
  {
    id: 1,
    name: 'ד"ר אמיר כהן',
    role: "כלכלה, תעסוקה ודיור",
    city: "חיפה",
    imageUrl: "/candidates/amir.jpg",
    description:
      "כלכלה עם ניסיון של ממש שנים בשוק העבודה ובמדיניות דיור. הכירו את החזון שלי המתמקד בשלושה דברים פשוטים: דיור בהישג יד לצעירים, הכשרה מקצועית שמתאימה את עצמה לשוק, ועסקים קטנים שמקבלים אוויר לנשימה. אני מאמין שכל שקל ציבורי צריך להיות מלווה ביעד מדיד.",
    likes: 0,
    comments: [
      {
        id: 1,
        author: "מיכל",
        text: "איך אתה מתכנן לסייע לזוגות צעירים ברכישת דירה?",
      },
    ],
  },
  {
    id: 2,
    name: "נועה בן ארי",
    role: "חינוך וחדשנות",
    city: "תל אביב",
    imageUrl: "/candidates/noa.jpg",
    description:
      "אני מאמינה בחינוך שמעניק לכל תלמיד הזדמנות להצליח. החזון שלי הוא לקדם חדשנות בבתי הספר, לחזק את המורים ולהרחיב את הנגישות ללימודים איכותיים.",
    likes: 0,
    comments: [],
  },
  {
    id: 3,
    name: "אילן שדה",
    role: "תשתיות ותחבורה",
    city: "ירושלים",
    imageUrl: "/candidates/ilan.jpg",
    description:
      "תחבורה ציבורית טובה היא הבסיס לחברה מתקדמת. אני רוצה לקדם תשתיות חכמות, תחבורה נגישה ושירות יעיל בכל רחבי הארץ.",
    likes: 0,
    comments: [],
  },
];

export default function CandidatesFeedPage() {
  return (
    <section className="candidates-feed-page">
      <div className="candidates-feed-heading">
        <span>פריימריז תנופה</span>
        <h1>הכירו את המועמדים שלנו</h1>
        <p>
          קראו את החזון של כל מועמד, שתפו את דעתכם
          והשתתפו בשיח.
        </p>
      </div>

      <div className="candidates-feed-list">
        {candidates.map((candidate) => (
          <CandidatePost
            key={candidate.id}
            candidate={candidate}
          />
        ))}
      </div>
    </section>
  );
}
