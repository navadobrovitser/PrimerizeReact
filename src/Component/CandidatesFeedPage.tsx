import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCandidates } from '../store/candidates/candidatesThunks';
import CandidatePost from './CandidatePost';

export function CandidatesFeedPage() {
  const dispatch = useAppDispatch();
  const { items: candidates, loading, error } = useAppSelector(
    (state) => state.candidates
  );

  useEffect(() => {
    dispatch(fetchCandidates());
  }, [dispatch]);

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '20px' }}>טוען נתונים מהשרת...</p>;
  }

  if (error) {
    return <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>שגיאה בחיבור לשרת: {error}</p>;
  }

  return (
    <div className="candidates-feed-container">
      <h1>הכר את המועמדים שלנו</h1>
      {candidates.length === 0 ? (
        <p style={{ textAlign: 'center' }}>אין מועמדים להצגה מהשרת</p>
      ) : (
        candidates.map((candidate, index) => (
          <CandidatePost 
            key={candidate.candidateId ?? candidate.id ?? index} 
            candidate={candidate} 
          />
        ))
      )}
    </div>
  );
}