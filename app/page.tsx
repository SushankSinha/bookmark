import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginButton from '@/components/LoginButton';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo / Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Smart Bookmarks
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Your private bookmark manager. Save links, stay organized, access anywhere — in real-time.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { icon: '🔒', label: 'Private', desc: 'Only you see your bookmarks' },
            { icon: '⚡', label: 'Real-time', desc: 'Syncs instantly across tabs' },
            { icon: '🌐', label: 'Anywhere', desc: 'Access from any device' },
          ].map((f) => (
            <div key={f.label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="font-semibold text-gray-800">{f.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Login */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-5">
            Sign in with your Google account to get started — no password needed.
          </p>
          <LoginButton />
        </div>

        <p className="text-xs text-gray-400">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </main>
  );
}
