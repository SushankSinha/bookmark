/**
 * Tests for bookmark service layer (lib/bookmarks.ts)
 * These are unit tests that mock the Supabase client.
 */

import { isValidUrl, normalizeUrl, addBookmark, deleteBookmark, getBookmarks } from '@/lib/bookmarks';
import { SupabaseClient } from '@supabase/supabase-js';

// --------------- URL Validation Tests ---------------

describe('isValidUrl', () => {
  describe('valid URLs', () => {
    it('accepts http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('accepts https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('accepts URLs with paths', () => {
      expect(isValidUrl('https://github.com/user/repo')).toBe(true);
    });

    it('accepts URLs with query strings', () => {
      expect(isValidUrl('https://google.com/search?q=hello')).toBe(true);
    });

    it('accepts URLs with ports', () => {
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('accepts URLs with subdomains', () => {
      expect(isValidUrl('https://docs.example.com/page')).toBe(true);
    });

    it('accepts URLs with fragments', () => {
      expect(isValidUrl('https://example.com/page#section')).toBe(true);
    });

    it('trims whitespace before validating', () => {
      expect(isValidUrl('  https://example.com  ')).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('rejects plain text', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('rejects ftp protocol', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    it('rejects URLs without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false);
    });

    it('rejects javascript protocol', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('rejects data URIs', () => {
      expect(isValidUrl('data:text/html,<h1>test</h1>')).toBe(false);
    });

    it('rejects just a slash', () => {
      expect(isValidUrl('/')).toBe(false);
    });
  });
});

// --------------- URL Normalization Tests ---------------

describe('normalizeUrl', () => {
  it('lowercases the protocol', () => {
    expect(normalizeUrl('HTTP://EXAMPLE.COM')).toMatch(/^http:/);
  });

  it('lowercases the hostname', () => {
    expect(normalizeUrl('https://EXAMPLE.COM/path')).toContain('example.com');
  });

  it('preserves path case', () => {
    // Path is case-sensitive by spec
    const result = normalizeUrl('https://example.com/MyPath');
    expect(result).toContain('/MyPath');
  });

  it('preserves query params', () => {
    const result = normalizeUrl('https://example.com?foo=bar');
    expect(result).toContain('foo=bar');
  });

  it('returns original URL on parse error', () => {
    const bad = 'not-a-url';
    expect(normalizeUrl(bad)).toBe(bad);
  });
});

// --------------- Supabase Mock Helpers ---------------

function makeMockSupabase(overrides: Record<string, unknown> = {}): SupabaseClient {
  const chain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    ...overrides,
  };

  return {
    from: jest.fn().mockReturnValue(chain),
    _chain: chain,
  } as unknown as SupabaseClient;
}

// --------------- getBookmarks Tests ---------------

describe('getBookmarks', () => {
  it('returns bookmarks on success', async () => {
    const mockBookmarks = [
      { id: '1', user_id: 'u1', url: 'https://a.com', title: 'A', created_at: '2024-01-01', updated_at: '2024-01-01' },
    ];

    const supabase = makeMockSupabase({
      range: jest.fn().mockResolvedValue({ data: mockBookmarks, error: null, count: 1 }),
    });

    const result = await getBookmarks(supabase);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].url).toBe('https://a.com');
  });

  it('returns empty array and error message on failure', async () => {
    const supabase = makeMockSupabase({
      range: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' }, count: null }),
    });

    const result = await getBookmarks(supabase);
    expect(result.data).toHaveLength(0);
    expect(result.error).toBe('DB error');
  });

  it('correctly computes hasMore when more pages exist', async () => {
    const mockBookmarks = Array(50).fill(null).map((_, i) => ({
      id: String(i),
      user_id: 'u1',
      url: `https://example${i}.com`,
      title: `Site ${i}`,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }));

    const supabase = makeMockSupabase({
      range: jest.fn().mockResolvedValue({ data: mockBookmarks, error: null, count: 120 }),
    });

    const result = await getBookmarks(supabase, 0);
    expect(result.hasMore).toBe(true);
  });

  it('returns hasMore=false on last page', async () => {
    const supabase = makeMockSupabase({
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 30 }),
    });

    const result = await getBookmarks(supabase, 1); // page 1 of 30 items (50/page)
    expect(result.hasMore).toBe(false);
  });
});

// --------------- addBookmark Tests ---------------

describe('addBookmark', () => {
  const userId = 'user-123';

  it('adds a valid bookmark', async () => {
    const inserted = {
      id: 'bm-1',
      user_id: userId,
      url: 'https://example.com',
      title: 'Example',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const supabase = makeMockSupabase({
      single: jest.fn().mockResolvedValue({ data: inserted, error: null }),
    });

    const result = await addBookmark(supabase, userId, { url: 'https://example.com', title: 'Example' });
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe('bm-1');
  });

  it('returns error for invalid URL', async () => {
    const supabase = makeMockSupabase();
    const result = await addBookmark(supabase, userId, { url: 'not-a-url', title: 'Test' });
    expect(result.error).toMatch(/Invalid URL/i);
    expect(result.data).toBeNull();
  });

  it('returns error for empty title', async () => {
    const supabase = makeMockSupabase();
    const result = await addBookmark(supabase, userId, { url: 'https://example.com', title: '' });
    expect(result.error).toBeTruthy();
    expect(result.data).toBeNull();
  });

  it('returns error when title exceeds 500 characters', async () => {
    const supabase = makeMockSupabase();
    const result = await addBookmark(supabase, userId, {
      url: 'https://example.com',
      title: 'a'.repeat(501),
    });
    expect(result.error).toBeTruthy();
  });

  it('trims whitespace from title and url', async () => {
    const inserted = {
      id: 'bm-2',
      user_id: userId,
      url: 'https://example.com/',
      title: 'My Site',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const supabase = makeMockSupabase({
      single: jest.fn().mockResolvedValue({ data: inserted, error: null }),
    });

    const result = await addBookmark(supabase, userId, {
      url: '  https://example.com  ',
      title: '  My Site  ',
    });
    expect(result.error).toBeNull();
  });

  it('propagates database errors', async () => {
    const supabase = makeMockSupabase({
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Unique constraint violated' } }),
    });

    const result = await addBookmark(supabase, userId, { url: 'https://example.com', title: 'Test' });
    expect(result.error).toBe('Unique constraint violated');
    expect(result.data).toBeNull();
  });
});

// --------------- deleteBookmark Tests ---------------

describe('deleteBookmark', () => {
  it('deletes a bookmark successfully', async () => {
    const supabase = makeMockSupabase({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const result = await deleteBookmark(supabase, 'bm-123');
    expect(result.error).toBeNull();
  });

  it('returns error on database failure', async () => {
    const supabase = makeMockSupabase({
      eq: jest.fn().mockResolvedValue({ error: { message: 'Row not found' } }),
    });

    const result = await deleteBookmark(supabase, 'bm-999');
    expect(result.error).toBe('Row not found');
  });
});
