export type ReadingStatus = "read" | "reading" | "want_to_read";

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  reading_goal: number;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  description: string | null;
  page_count: number | null;
  published_date: string | null;
  genre: string | null;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  rating: number | null;
  pages_read: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  book?: Book;
}

export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  chapter: string | null;
  content: string;
  highlight: string | null;
  created_at: string;
  book?: Book;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_by: string;
  current_book_id: string | null;
  next_book_id: string | null;
  member_count: number;
  created_at: string;
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    pageCount?: number;
    publishedDate?: string;
    categories?: string[];
  };
}
