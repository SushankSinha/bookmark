'use client';

import { useState, useCallback } from 'react';
import { Bookmark } from '@/types';

interface Props {
  bookmark: Bookmark;
  isDeleting: boolean;
  onDelete: (id: string) => Promise<void>;
}

function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: days > 365 ? 'numeric' : undefined });
}

export default function BookmarkCard({ bookmark, isDeleting, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const faviconUrl = getFaviconUrl(bookmark.url);

  const handleDelete = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Auto-cancel after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete(bookmark.id);
  }, [confirmDelete, bookmark.id, onDelete]);

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  }, []);

  let hostname = '';
  try {
    hostname = new URL(bookmark.url).hostname;
  } catch {
    hostname = bookmark.url;
  }

  return (
    <div
      className={`group bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-100 hover:shadow-md transition-all duration-200 ${
        isDeleting ? 'opacity-50 scale-95 pointer-events-none' : ''
      }`}
      role="article"
      aria-label={bookmark.title}
    >
      <div className="flex items-start gap-3">
        {/* Favicon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mt-0.5 overflow-hidden">
          {faviconUrl && !faviconError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faviconUrl}
              alt=""
              width={16}
              height={16}
              onError={() => setFaviconError(true)}
              className="w-4 h-4"
            />
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 block"
          >
            {bookmark.title}
          </a>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 truncate max-w-[200px]">
              {hostname}
            </span>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatDate(bookmark.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors font-medium"
                aria-label="Confirm delete"
              >
                Delete
              </button>
              <button
                onClick={handleCancelDelete}
                className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                aria-label={`Open ${bookmark.title}`}
                title="Open link"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                aria-label={`Delete ${bookmark.title}`}
                title="Delete bookmark"
              >
                {isDeleting ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
