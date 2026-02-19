'use client';

import Image from 'next/image';

interface Props {
  user: {
    email: string;
    avatar_url: string | null;
    full_name: string;
  };
  onSignOut: () => void;
}

export default function Header({ user, onSignOut }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">Smart Bookmarks</span>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.full_name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-700 font-medium max-w-[160px] truncate">
              {user.full_name}
            </span>
          </div>

          <button
            onClick={onSignOut}
            className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
