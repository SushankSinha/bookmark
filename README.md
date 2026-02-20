# Smart Bookmarks

A production-ready, private bookmark manager with real-time sync across tabs.

**Live URL:** [Bookmark App](https://bookmark-topaz-tau.vercel.app/)

---

## Features

- **Google OAuth only** — no email/password, no friction
- **Private bookmarks** — database-level isolation via Row Level Security (RLS)
- **Real-time sync** — add in one tab, see it instantly in another (Supabase Realtime)
- **Optimistic UI** — bookmarks appear immediately; no waiting for the server
- **Confirm-before-delete** — two-click deletion to prevent accidents
- **Favicon display** — auto-fetches site favicons for visual recognition
- **Relative timestamps** — "Just now", "2h ago", "Yesterday", etc.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth + DB + Realtime | Supabase |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Deployment | Vercel |
| Testing | Jest + React Testing Library |

---

## Architecture

```
smart-bookmarks/
├── app/
│   ├── layout.tsx               # Root layout (font, metadata)
│   ├── page.tsx                 # Landing page (server component, redirects if authed)
│   ├── globals.css
│   ├── auth/callback/route.ts   # OAuth callback handler
│   ├── api/bookmarks/route.ts   # REST API (POST add, DELETE remove)
│   └── dashboard/page.tsx       # Protected dashboard (server component, initial SSR fetch)
├── components/
│   ├── BookmarkApp.tsx          # Main client component (state machine, realtime, actions)
│   ├── AddBookmarkForm.tsx      # Controlled form with validation
│   ├── BookmarkList.tsx         # List with empty state
│   ├── BookmarkCard.tsx         # Individual card (favicon, date, confirm-delete)
│   ├── Header.tsx               # Nav with user avatar + sign out
│   └── LoginButton.tsx          # Google OAuth trigger
├── lib/
│   ├── bookmarks.ts             # Business logic (validation, Supabase queries)
│   └── supabase/
│       ├── client.ts            # Browser client (singleton)
│       ├── server.ts            # Server-side client (per-request)
│       └── middleware.ts        # Session refresh + route protection
├── types/index.ts               # Shared TypeScript types + DB schema
├── middleware.ts                # Next.js middleware (session, redirects)
├── supabase/migrations/
│   └── 001_initial_schema.sql  # Full schema with indexes + RLS policies
└── __tests__/
    ├── bookmarks.test.ts        # Unit tests: URL validation, service layer
    ├── AddBookmarkForm.test.tsx # Component tests
    ├── BookmarkCard.test.tsx    # Component tests
    └── BookmarkList.test.tsx    # Component tests
```

---

## Database Design

### Schema

```sql
bookmarks (
  id          UUID      PK  DEFAULT gen_random_uuid()
  user_id     UUID      FK → auth.users(id) ON DELETE CASCADE
  url         TEXT      CHECK length 1..2048
  title       TEXT      CHECK length 1..500
  created_at  TIMESTAMPTZ DEFAULT now()
  updated_at  TIMESTAMPTZ DEFAULT now()
)
```

### Indexes (scalability rationale)

| Index | Columns | Purpose |
|---|---|---|
| `idx_bookmarks_user_id_created_at` | `(user_id, created_at DESC)` | Primary list query — covers the full `WHERE user_id = $1 ORDER BY created_at DESC` |
| `idx_bookmarks_user_id` | `(user_id)` | Realtime filter (`filter: user_id=eq.<uuid>`) + DELETE/UPDATE |
| `idx_bookmarks_id` | `(id)` | PK lookups, future cursor pagination |

The composite index `(user_id, created_at DESC)` means the database can satisfy the full list query as an index scan — no sort step, no table scan.

### Row Level Security (RLS)

RLS is enforced at the **PostgreSQL level**, not just the application layer. This means:

- A compromised API key cannot leak User A's data to User B
- Service role bypasses are explicit and intentional
- Each policy uses `auth.uid()` to bind requests to the authenticated user

Policies:
- `SELECT`: `auth.uid() = user_id`
- `INSERT` with check: `auth.uid() = user_id`  
- `UPDATE` with check: `auth.uid() = user_id`
- `DELETE`: `auth.uid() = user_id`

---

## Real-time Design

The Supabase Realtime subscription is scoped per user:

```ts
supabase.channel(`bookmarks:user:${user.id}`)
  .on('postgres_changes', { filter: `user_id=eq.${user.id}`, event: 'INSERT' }, handler)
  .on('postgres_changes', { filter: `user_id=eq.${user.id}`, event: 'DELETE' }, handler)
  .subscribe()
```

**Deduplication:** When the user adds a bookmark, we use optimistic updates (add to local state immediately). The subsequent Realtime INSERT event checks if the ID already exists before appending — preventing duplicates.

---

## State Management

`BookmarkApp` uses `useReducer` with a typed action/state machine pattern instead of scattered `useState` calls. This makes state transitions explicit and testable:

```
Actions: SET_BOOKMARKS | REALTIME_INSERT | REALTIME_DELETE |
         START_ADD | ADD_SUCCESS | ADD_ERROR |
         START_DELETE | DELETE_SUCCESS | DELETE_ERROR
```

This approach scales cleanly — adding features like "undo delete" or "edit bookmark" only requires new action types.

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- A Supabase project
- A Vercel account

### 1. Clone and install

```bash
git clone https://github.com/your-username/smart-bookmarks
cd smart-bookmarks
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run the contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Authentication → Providers → Google** and enable it:
   - Set your Google OAuth credentials (from [Google Cloud Console](https://console.cloud.google.com))
   - Add `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect URI in Google Cloud

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 5. Run tests

```bash
npm test
npm run test:coverage
```

### 6. Deploy to Vercel

```bash
npx vercel --prod
```

Set the same environment variables in your Vercel project settings.

**Important:** Add your Vercel production URL to Supabase:
- **Authentication → URL Configuration → Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

Also add the Vercel production URL to Google OAuth's "Authorized redirect URIs":
- `https://your-project.supabase.co/auth/v1/callback`

---

## Problems Encountered & Solutions

### 1. Session not persisting across page navigation (App Router)

**Problem:** In Next.js App Router, Server Components and Client Components have separate cookie contexts. The Supabase session wasn't being refreshed correctly on navigation.

**Solution:** Used `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-nextjs`) with separate `createBrowserClient` and `createServerClient` factories. Added `middleware.ts` that runs on every request to call `supabase.auth.getUser()`, which refreshes the session token in cookies if expired. The middleware also handles route protection (redirect unauthenticated users from `/dashboard` to `/`).

### 2. Duplicate bookmarks from optimistic updates + Realtime

**Problem:** Adding a bookmark would optimistically add it to state, then the Realtime INSERT event would fire and add it again — resulting in duplicates.

**Solution:** In the `REALTIME_INSERT` reducer case, check if the bookmark ID already exists before prepending. If it exists, return state unchanged. This makes the realtime event idempotent.

### 3. React Strict Mode double-invoking effects

**Problem:** In development with React 18 Strict Mode, `useEffect` runs twice. This caused two Realtime channel subscriptions, leading to double-fired events.

**Solution:** Stored the channel reference in `useRef` and properly cleaned it up in the `useEffect` cleanup function (`supabase.removeChannel(channel)`). This ensures only one subscription exists at a time.

### 4. Supabase Realtime filter syntax

**Problem:** Realtime `postgres_changes` filters use a specific syntax (`column=eq.value`) that differs from the JS client query builder.

**Solution:** Used the string filter format: `filter: \`user_id=eq.${user.id}\`` which Supabase Realtime accepts correctly.

### 5. OAuth redirect URL in production vs. development

**Problem:** Google OAuth redirect URI must be exact — `http://localhost:3000/auth/callback` works locally but fails in production.

**Solution:** Added the production Vercel URL to both Google Cloud Console and Supabase's allowed redirect URLs. In the callback handler, used `x-forwarded-host` header (set by Vercel's proxy) to reconstruct the correct origin URL for production redirects.

### 6. TypeScript strict mode with Next.js cookies API

**Problem:** Next.js 15's `cookies()` function returns a Promise, but older patterns used it synchronously.

**Solution:** Made the server Supabase client factory `async` and `await`-ed `cookies()` before passing to `createServerClient`.

---

## Future Improvements (if scaling)

- **Cursor-based pagination** — replace offset pagination with `WHERE id < $cursor ORDER BY id DESC LIMIT 50` for O(1) page fetches at any depth
- **Full-text search** — add `tsvector` column on `title || ' ' || url` with GIN index for fast bookmark search
- **Folders/Tags** — add a `tags` table with many-to-many join; index on `(user_id, tag_id)`
- **Import/Export** — support Netscape bookmark format for browser bookmark import
- **Link health checking** — background job to verify URLs are still live (Supabase Edge Functions + pg_cron)
- **Rate limiting** — add per-user INSERT rate limiting at the API layer (e.g., 100 bookmarks/hour)

---

## License

MIT
