'use client';

import { Bookmark } from '@/types';
import BookmarkCard from './BookmarkCard';

interface Props {
  bookmarks: Bookmark[];
  deletingIds: Set<string>;
  onDelete: (id: string) => Promise<void>;
}

export default function BookmarkList({ bookmarks, deletingIds, onDelete }: Props) {
  if (bookmarks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center animate-fade-in">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No bookmarks yet</p>
        <p className="text-gray-400 text-sm mt-1">Add your first bookmark above to get started</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Bookmark list" role="list">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id} className="animate-slide-in">
          <BookmarkCard
            bookmark={bookmark}
            isDeleting={deletingIds.has(bookmark.id)}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
