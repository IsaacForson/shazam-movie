"use client";

import { useState } from "react";

interface TypeSearchProps {
  onSearch: (text: string) => void;
  isSearching: boolean;
}

export default function TypeSearch({ onSearch, isSearching }: TypeSearchProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length > 2) {
      onSearch(text.trim());
    }
  };

  const examples = [
    "I'm gonna make him an offer he can't refuse",
    "Why so serious",
    "May the force be with you",
    "You shall not pass",
    "I see dead people",
    "Life is like a box of chocolates",
  ];

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a movie quote or dialogue you remember..."
            className="w-full bg-gray-900/60 border border-gray-700 rounded-xl p-4 pr-12 text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 resize-none backdrop-blur-sm"
            rows={4}
          />
          <button
            type="submit"
            disabled={text.trim().length < 3 || isSearching}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors"
          >
            {isSearching ? (
              <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>
      </form>

      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
          Try a famous quote
        </p>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              onClick={() => {
                setText(example);
                onSearch(example);
              }}
              disabled={isSearching}
              className="px-3 py-1.5 rounded-full bg-gray-800/60 border border-gray-700/50 text-gray-400 text-xs hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-purple-300 transition-all disabled:opacity-50"
            >
              &ldquo;{example}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
