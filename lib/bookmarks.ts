import { SupabaseClient } from '@supabase/supabase-js';
import { BookmarkInsert, Bookmark } from '@/types';

const PAGE_SIZE = 50;

export async function getBookmarks(
  supabase: SupabaseClient,
  page = 0
): Promise<{ data: Bookmark[]; error: string | null; hasMore: boolean }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { data: [], error: error.message, hasMore: false };
  }

  const hasMore = count != null && count > to + 1;
  return { data: (data as Bookmark[]) ?? [], error: null, hasMore };
}

export async function addBookmark(
  supabase: SupabaseClient,
  userId: string,
  bookmark: BookmarkInsert
): Promise<{ data: Bookmark | null; error: string | null }> {
  if (!isValidUrl(bookmark.url)) {
    return { data: null, error: 'Invalid URL. Please include http:// or https://' };
  }

  const title = bookmark.title.trim();
  if (!title || title.length > 500) {
    return { data: null, error: 'Title must be between 1 and 500 characters' };
  }

  const url = normalizeUrl(bookmark.url.trim());

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, url, title })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Bookmark, error: null };
}

export async function deleteBookmark(
  supabase: SupabaseClient,
  bookmarkId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return url;
  }
}
