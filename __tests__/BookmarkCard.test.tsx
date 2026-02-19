/**
 * Component tests for BookmarkCard
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookmarkCard from '@/components/BookmarkCard';
import { Bookmark } from '@/types';

const mockBookmark: Bookmark = {
  id: 'bm-1',
  user_id: 'user-1',
  url: 'https://github.com',
  title: 'GitHub',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('BookmarkCard', () => {
  it('renders bookmark title', () => {
    render(<BookmarkCard bookmark={mockBookmark} isDeleting={false} onDelete={jest.fn()} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('renders hostname of the URL', () => {
    render(<BookmarkCard bookmark={mockBookmark} isDeleting={false} onDelete={jest.fn()} />);
    expect(screen.getByText('github.com')).toBeInTheDocument();
  });

  it('shows confirm button on first delete click', () => {
    render(<BookmarkCard bookmark={mockBookmark} isDeleting={false} onDelete={jest.fn()} />);

    // Hover to reveal buttons, then click delete
    const deleteBtn = screen.getByLabelText(`Delete ${mockBookmark.title}`);
    fireEvent.click(deleteBtn);

    expect(screen.getByLabelText('Confirm delete')).toBeInTheDocument();
    expect(screen.getByLabelText('Cancel delete')).toBeInTheDocument();
  });

  it('calls onDelete on second click (confirm)', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(<BookmarkCard bookmark={mockBookmark} isDeleting={false} onDelete={onDelete} />);

    // First click — triggers confirmation state
    fireEvent.click(screen.getByLabelText(`Delete ${mockBookmark.title}`));

    // Second click — confirms
    fireEvent.click(screen.getByLabelText('Confirm delete'));

    expect(onDelete).toHaveBeenCalledWith('bm-1');
  });

  it('does NOT call onDelete if cancel is clicked', () => {
    const onDelete = jest.fn();
    render(<BookmarkCard bookmark={mockBookmark} isDeleting={false} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText(`Delete ${mockBookmark.title}`));
    fireEvent.click(screen.getByLabelText('Cancel delete'));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('shows loading spinner when isDeleting is true', () => {
    render(<BookmarkCard bookmark={mockBookmark} isDeleting={true} onDelete={jest.fn()} />);
    // Card becomes disabled/loading
    const card = screen.getByRole('article');
    expect(card.className).toContain('opacity-50');
  });

  it('renders a link to the bookmark URL', () => {
    render(<BookmarkCard bookmark={mockBookmark} isDeleting={false} onDelete={jest.fn()} />);
    const links = screen.getAllByRole('link');
    const targetLink = links.find(l => (l as HTMLAnchorElement).href === 'https://github.com/');
    expect(targetLink).toBeTruthy();
    expect(targetLink).toHaveAttribute('target', '_blank');
    expect(targetLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows "Just now" for very recent bookmarks', () => {
    render(<BookmarkCard bookmark={mockBookmark} isDeleting={false} onDelete={jest.fn()} />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('shows relative date for older bookmarks', () => {
    const old = {
      ...mockBookmark,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    render(<BookmarkCard bookmark={old} isDeleting={false} onDelete={jest.fn()} />);
    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });
});
