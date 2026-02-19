'use client';

import { useEffect, useCallback, useReducer, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isValidUrl } from '@/lib/bookmarks';
import { Bookmark } from '@/types';
import BookmarkList from './BookmarkList';
import AddBookmarkForm from './AddBookmarkForm';
import Header from './Header';

interface User {
  id: string;
  email: string;
  avatar_url: string | null;
  full_name: string;
}

interface Props {
  user: User;
  initialBookmarks: Bookmark[];
}

// --------------- State Machine ---------------
type State = {
  bookmarks: Bookmark[];
  loading: boolean;
  addError: string | null;
  isAdding: boolean;
  deletingIds: Set<string>;
};

type Action =
  | { type: 'SET_BOOKMARKS'; payload: Bookmark[] }
  | { type: 'REALTIME_INSERT'; payload: Bookmark }
  | { type: 'REALTIME_DELETE'; payload: string }
  | { type: 'START_ADD' }
  | { type: 'ADD_SUCCESS'; payload: Bookmark }
  | { type: 'ADD_ERROR'; payload: string }
  | { type: 'START_DELETE'; payload: string }
  | { type: 'DELETE_SUCCESS'; payload: string }
  | { type: 'DELETE_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_BOOKMARKS':
      return { ...state, bookmarks: action.payload, loading: false };

    case 'REALTIME_INSERT': {
      // Avoid duplicates (optimistic update may have already added it)
      const exists = state.bookmarks.some((b) => b.id === action.payload.id);
      if (exists) return state;
      return {
        ...state,
        bookmarks: [action.payload, ...state.bookmarks],
      };
    }

    case 'REALTIME_DELETE':
      return {
        ...state,
        bookmarks: state.bookmarks.filter((b) => b.id !== action.payload),
        deletingIds: new Set([...state.deletingIds].filter((id) => id !== action.payload)),
      };

    case 'START_ADD':
      return { ...state, isAdding: true, addError: null };

    case 'ADD_SUCCESS':
      return {
        ...state,
        isAdding: false,
        addError: null,
        // Optimistically prepend; realtime will dedup
        bookmarks: [action.payload, ...state.bookmarks],
      };

    case 'ADD_ERROR':
      return { ...state, isAdding: false, addError: action.payload };

    case 'START_DELETE': {
      const next = new Set(state.deletingIds);
      next.add(action.payload);
      return { ...state, deletingIds: next };
    }

    case 'DELETE_SUCCESS':
      return {
        ...state,
        bookmarks: state.bookmarks.filter((b) => b.id !== action.payload),
        deletingIds: new Set([...state.deletingIds].filter((id) => id !== action.payload)),
      };

    case 'DELETE_ERROR': {
      const next = new Set(state.deletingIds);
      next.delete(action.payload);
      return { ...state, deletingIds: next };
    }

    default:
      return state;
  }
}

// --------------- Component ---------------
export default function BookmarkApp({ user, initialBookmarks }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    bookmarks: initialBookmarks,
    loading: false,
    addError: null,
    isAdding: false,
    deletingIds: new Set<string>(),
  });

  const supabase = useRef(createClient()).current;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // --------------- Realtime subscription ---------------
  useEffect(() => {
    const channel = supabase
      .channel(`bookmarks:user:${user.id}`, {
        config: { presence: { key: user.id } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          dispatch({ type: 'REALTIME_INSERT', payload: payload.new as Bookmark });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          dispatch({ type: 'REALTIME_DELETE', payload: payload.old.id as string });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase]);

  // --------------- Actions ---------------
  const handleAdd = useCallback(
    async (url: string, title: string) => {
      // Client-side validation
      if (!isValidUrl(url)) {
        dispatch({ type: 'ADD_ERROR', payload: 'Invalid URL. Please include http:// or https://' });
        return;
      }
      if (!title.trim()) {
        dispatch({ type: 'ADD_ERROR', payload: 'Title is required' });
        return;
      }

      dispatch({ type: 'START_ADD' });

      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), title: title.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        dispatch({ type: 'ADD_ERROR', payload: json.error ?? 'Failed to add bookmark' });
        return;
      }

      dispatch({ type: 'ADD_SUCCESS', payload: json.data });
    },
    []
  );

  const handleDelete = useCallback(async (id: string) => {
    dispatch({ type: 'START_DELETE', payload: id });

    const res = await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const json = await res.json();
      console.error('Delete failed:', json.error);
      dispatch({ type: 'DELETE_ERROR', payload: id });
      return;
    }

    dispatch({ type: 'DELETE_SUCCESS', payload: id });
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onSignOut={handleSignOut} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <AddBookmarkForm
          onAdd={handleAdd}
          isAdding={state.isAdding}
          error={state.addError}
          onClearError={() => dispatch({ type: 'ADD_ERROR', payload: '' })}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Your Bookmarks
            </h2>
            <span className="text-sm text-gray-400">
              {state.bookmarks.length} saved
            </span>
          </div>

          <BookmarkList
            bookmarks={state.bookmarks}
            deletingIds={state.deletingIds}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  );
}
