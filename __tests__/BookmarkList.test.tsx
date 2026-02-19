/**
 * Component tests for BookmarkList
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import BookmarkList from '@/components/BookmarkList';
import { Bookmark } from '@/types';

const makeBookmark = (i: number): Bookmark => ({
  id: `bm-${i}`,
  user_id: 'user-1',
  url: `https://example${i}.com`,
  title: `Bookmark ${i}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('BookmarkList', () => {
  it('shows empty state when no bookmarks', () => {
    render(<BookmarkList bookmarks={[]} deletingIds={new Set()} onDelete={jest.fn()} />);
    expect(screen.getByText(/No bookmarks yet/i)).toBeInTheDocument();
  });

  it('renders all bookmarks', () => {
    const bookmarks = [makeBookmark(1), makeBookmark(2), makeBookmark(3)];
    render(<BookmarkList bookmarks={bookmarks} deletingIds={new Set()} onDelete={jest.fn()} />);

    expect(screen.getByText('Bookmark 1')).toBeInTheDocument();
    expect(screen.getByText('Bookmark 2')).toBeInTheDocument();
    expect(screen.getByText('Bookmark 3')).toBeInTheDocument();
  });

  it('renders list with correct ARIA role', () => {
    const bookmarks = [makeBookmark(1)];
    render(<BookmarkList bookmarks={bookmarks} deletingIds={new Set()} onDelete={jest.fn()} />);
    expect(screen.getByRole('list', { name: /bookmark list/i })).toBeInTheDocument();
  });
});
