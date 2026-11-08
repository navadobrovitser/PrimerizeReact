



import "./Footer.css";

import Logo from "./Logo";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
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
          <a href="/">בית</a>
          <a href="/about">אודות</a>
          <a href="/leadership">הנהגה</a>
          <a href="/plan">התוכנית</a>
          <a href="/news">חדשות</a>
          <a href="/primaries">פריימריז</a>
        </div>

        <div className="footer-column">
          <h3>מידע נוסף</h3>
          <a href="/join">הצטרפות למפלגה</a>
          <a href="/contact">יצירת קשר</a>
          <a href="/privacy">מדיניות פרטיות</a>
          <a href="/terms">תנאי שימוש</a>
        </div>

        <div className="footer-column">
          <h3>בואו להיות חלק</h3>

          <p>
            הצטרפו אלינו וקחו חלק בעיצוב העתיד.
          </p>

          <a href="/join" className="footer-join">
            הצטרפו עכשיו
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        © {year} מפלגת תנופה. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
