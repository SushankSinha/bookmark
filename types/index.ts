export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface BookmarkInsert {
  url: string;
  title: string;
}

export interface BookmarkRow {
  id: string;
  user_id: string;
  url: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      bookmarks: {
        Row: BookmarkRow;
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          title?: string;
          updated_at?: string;
        };
      };
    };
  };
};
