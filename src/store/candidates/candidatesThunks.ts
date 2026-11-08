import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Candidate } from '../../types';

const API_URL = 'http://localhost:5296/api/Candidates';

export const fetchCandidates = createAsyncThunk(
  'candidates/fetchCandidates',
  async () => {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('נכשלה טעינת המועמדים מהשרת');
    }
    return (await response.json()) as Candidate[];
  }
);