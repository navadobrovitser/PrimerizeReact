
interface LogoProps {
  light?: boolean;
}

export default function Logo({ light = false }: LogoProps) {
  return (
    <a
      href="/"
      className="brand-logo"
      aria-label="תנופה - עמוד הבית"
    >
      <span className="brand-symbol">
        <svg
          width="27"
          height="27"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 17L10 10L14 14L21 5" />
          <path d="M15 5H21V11" />
        </svg>
      </span>

      <span className="brand-text">
        <strong
          style={{
            color: light ? "#ffffff" : "#123c56",
          }}
        >
          תנופה
        </strong>
        <small>מפלגת תנופה</small>
      </span>
    </a>
  );
}
