import type { Candidate } from '../../types';

export interface CandidatesState {
  items: Candidate[];
  loading: boolean;
  error: string | null;
}

export const initialState: CandidatesState = {
  items: [],
  loading: false,
  error: null,
};