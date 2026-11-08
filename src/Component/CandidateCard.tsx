
import "./CandidateCard.css";

export interface Candidate {
  id: number;
  name: string;
  role: string;
  imageUrl: string;
}

interface CandidateCardProps {
  candidate: Candidate;
  onClick?: (candidate: Candidate) => void;
}

export default function CandidateCard({
  candidate,
  onClick,
}: CandidateCardProps) {
  return (
    <article
      className={`candidate-card ${onClick ? "clickable" : ""}`}
      onClick={() => onClick?.(candidate)}
    >
      <div className="candidate-image">
        {candidate.imageUrl ? (
          <img
            src={candidate.imageUrl}
            alt={candidate.name}
          />
        ) : (
          <div className="candidate-placeholder">
            <svg
              width="55"
              height="55"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a8b8c0"
              strokeWidth="1.3"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
            </svg>
          </div>
        )}
      </div>

      <div className="candidate-details">
        <h3>{candidate.name}</h3>
        <p>{candidate.role}</p>
      </div>
    </article>
  );
}
