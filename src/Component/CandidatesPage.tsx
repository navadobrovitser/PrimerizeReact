
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCandidates } from "../store/candidates/candidatesThunks";
import "./CandidatesPage.css";

interface CandidatesPageProps {
  onSelectCandidate: (candidateId: number) => void;
}

const API_ORIGIN = "https://localhost:7227";


function getImageUrl(url?: string | null): string {
  if (!url) return "";

  const API_ORIGIN = "https://localhost:7227";

  // כתובת מלאה שכבר כוללת את שם השרת
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // ניקוי לוכסנים מתחילת הנתיב
  const cleanPath = url.replace(/^\/+/, "");

  // אם הנתיב כבר מתחיל ב-Images
  if (/^Images\//i.test(cleanPath)) {
    return `${API_ORIGIN}/${cleanPath}`;
  }

  // אם קיבלנו רק שם קובץ
  return `${API_ORIGIN}/Images/${cleanPath}`;
}


export default function CandidatesPage({
  onSelectCandidate,
}: CandidatesPageProps) {
  const dispatch = useAppDispatch();

  const { items, loading, error } = useAppSelector(
    (state) => state.candidates
  );

  useEffect(() => {
    void dispatch(fetchCandidates());
  }, [dispatch]);

  return (
    <section className="candidates-directory" dir="rtl">
      <div className="candidates-directory-heading">
        <span>תנופה | האנשים שמובילים שינוי</span>
        <h1>הכירו את המועמדים</h1>
        <p>
          כל המועמדים במקום אחד. לחצו על מועמד כדי
          להכיר אותו, לקרוא את קורות החיים שלו
          ולצפות בפוסטים שפרסם.
        </p>
      </div>

      {loading && (
        <p className="candidates-directory-status">
          טוען מועמדים...
        </p>
      )}

      {error && (
        <p className="candidates-directory-error">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="candidates-directory-status">
          עדיין אין מועמדים להצגה.
        </p>
      )}

      <div className="candidates-directory-grid">
        {items.map((candidate) => {
          const candidateId = candidate.candidateId;

          if (candidateId == null) return null;

          const imageUrl = getImageUrl(
            candidate.profileImageUrl ?? candidate.imageUrl
          );

          return (
            <button
              type="button"
              key={candidateId}
              className="directory-candidate-card"
              onClick={() => onSelectCandidate(candidateId)}
            >
              <div className="directory-candidate-image">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={candidate.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="directory-candidate-placeholder">
                    {candidate.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>

              <div className="directory-candidate-details">
                <h2>{candidate.name}</h2>
                <p>{candidate.slogan || "מועמד בתנופה"}</p>
                <span>לפרופיל המועמד ←</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
