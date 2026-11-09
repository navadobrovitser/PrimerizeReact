export interface Comment {
  id: string;
  author: string;
  text: string;
}

export interface Candidate {
  id?: string | number;
  candidateId?: number;
  name: string;
  role?: string;
  slogan?: string;
  description?: string;
  videoTitle?: string;
  likesCount?: number;
  likes?: number;
  comments?: Comment[];
  avatarBg?: string;
  imageUrl?: string;
  profileImageUrl?: string;
  city?: string;
}