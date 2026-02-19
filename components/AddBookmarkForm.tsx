'use client';

import { useState, useRef, useCallback, FormEvent } from 'react';

interface Props {
  onAdd: (url: string, title: string) => Promise<void>;
  isAdding: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function AddBookmarkForm({ onAdd, isAdding, error, onClearError }: Props) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const urlRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      await onAdd(url, title);
      // On success (no error set by parent), clear fields
      setUrl('');
      setTitle('');
      urlRef.current?.focus();
    },
    [url, title, onAdd]
  );

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (error) onClearError();
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (error) onClearError();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Add a Bookmark
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="url" className="block text-xs font-medium text-gray-600 mb-1">
            URL
          </label>
          <input
            ref={urlRef}
            id="url"
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com"
            required
            disabled={isAdding}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
            aria-describedby={error ? 'add-error' : undefined}
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-xs font-medium text-gray-600 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="My favorite article"
            required
            maxLength={500}
            disabled={isAdding}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        {error && (
          <p id="add-error" className="text-sm text-red-600 flex items-center gap-1.5" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isAdding || !url.trim() || !title.trim()}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAdding ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save Bookmark'
          )}
        </button>
      </form>
    </div>
  );
}
