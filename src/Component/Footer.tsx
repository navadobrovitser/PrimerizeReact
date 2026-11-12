
import "./Footer.css";
import Logo from "./Logo";
import type { Page } from "./Header";

interface FooterProps {
  onNavigate: (page: Page) => void;
}

export default function Footer({
  onNavigate,
}: FooterProps) {
  const year = new Date().getFullYear();

  const navigate = (page: Page) => {
    onNavigate(page);
  };

  return (
    <footer className="site-footer" dir="rtl">
      <div className="footer-container">
        <div className="footer-about">
          <Logo light />

          <p>
            ביחד יוצרים תנופה.
            <br />
            מקום לרעיונות, לעשייה ולהשפעה.
          </p>
        </div>

        <div className="footer-column">
          <h3>ניווט מהיר</h3>

          <button type="button" onClick={() => navigate("home")}>
            בית
          </button>

          <button type="button" onClick={() => navigate("about")}>
            אודות
          </button>

          <button type="button" onClick={() => navigate("leadership")}>
            הנהגה
          </button>

          <button type="button" onClick={() => navigate("program")}>
            התוכנית
          </button>

          <button type="button" onClick={() => navigate("news")}>
            חדשות
          </button>

          <button type="button" onClick={() => navigate("primaries")}>
            פריימריז
          </button>
        </div>

        <div className="footer-column">
          <h3>מידע נוסף</h3>

          <button
            type="button"
            onClick={() => navigate("candidates")}
          >
            פוסטים ועדכונים
          </button>

          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            מדיניות פרטיות
          </a>

          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            תנאי שימוש
          </a>
        </div>

        <div className="footer-column">
          <h3>בואו להיות חלק</h3>

          <p>
            הכירו את המועמדים,
            התעדכנו בפעילותם וקחו חלק
            בעיצוב העתיד.
          </p>

          <button
            type="button"
            className="footer-join"
            onClick={() => navigate("primaries")}
          >
            הכירו את המועמדים
          </button>
        </div>
      </div>

      <div className="footer-bottom">
        © {year} מפלגת תנופה. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
