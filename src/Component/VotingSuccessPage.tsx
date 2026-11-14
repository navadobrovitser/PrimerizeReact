import "./VotingSuccessPage.css";

interface VotingSuccessPageProps {
  onReturnHome: () => void;
  onLogout: () => void;
}

export default function VotingSuccessPage({
  onReturnHome,
  onLogout,
}: VotingSuccessPageProps) {
  return (
    <section className="vote-finished-page" dir="rtl">
      <div className="vote-finished-card">
        <div className="vote-finished-icon">✓</div>

        <span className="vote-finished-eyebrow">
          פריימריז תנופה
        </span>

     <h1>כבר השתתפת בהצבעה!</h1>

<p>
  הצבעתך נקלטה בהצלחה במערכת.
  <br />
  ניתן להצביע פעם אחת בלבד.
</p>

<p>
  תוצאות הבחירות יפורסמו לאחר סיום ההצבעה.
</p>

        <div className="vote-finished-notice">
          ההצבעה הושלמה ולא ניתן להצביע פעם נוספת.
        </div>

        <div className="vote-finished-actions">
          <button
            type="button"
            className="vote-finished-home"
            onClick={onReturnHome}
          >
            חזרה לאתר
          </button>

          <button
            type="button"
            className="vote-finished-logout"
            onClick={onLogout}
          >
            התנתקות מהחשבון
          </button>
        </div>
      </div>
    </section>
  );
}