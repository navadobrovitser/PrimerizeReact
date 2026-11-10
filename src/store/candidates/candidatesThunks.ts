import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Candidate } from '../../types';

const API_URL = 'https://localhost:7227/api/Candidates';

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