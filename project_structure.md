smart-bookmarks/
├── .env.example
├── .env.local.example
├── .gitignore
├── README.md
├── jest.config.js
├── jest.setup.js
├── middleware.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── __tests__/
│   ├── AddBookmarkForm.test.tsx
│   ├── BookmarkCard.test.tsx
│   ├── BookmarkList.test.tsx
│   └── bookmarks.test.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── api/bookmarks/route.ts
│   ├── auth/callback/route.ts
│   └── dashboard/page.tsx
├── components/
│   ├── AddBookmarkForm.tsx
│   ├── BookmarkApp.tsx
│   ├── BookmarkCard.tsx
│   ├── BookmarkList.tsx
│   ├── Header.tsx
│   └── LoginButton.tsx
├── lib/
│   ├── bookmarks.ts
│   └── supabase/
│       ├── client.ts
│       ├── middleware.ts
│       └── server.ts
├── supabase/migrations/
│   └── 001_initial_schema.sql
└── types/
    └── index.ts