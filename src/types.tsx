export interface Comment {
  id: string;
  author: string;
  text: string;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  description: string;
  videoTitle?: string; // 
  likesCount: number;
  comments: Comment[];
  avatarBg?: string;
}