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
    if (text.trim().length > 2) onSearch(text.trim());
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
    <div className="w-full space-y-7">
      <form onSubmit={handleSubmit}>
        <div className="border border-line-strong bg-card focus-within:border-accent transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="“Well, nobody's perfect.”"
            className="w-full bg-transparent p-5 font-serif text-xl text-ink placeholder:text-soft/60 focus:outline-none resize-none"
            rows={4}
          />
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <span className="label text-soft">Any line, any film</span>
            <button
              type="submit"
              disabled={text.trim().length < 3 || isSearching}
              className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSearching ? "Searching…" : "Find the film"}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      <div>
        <p className="label text-soft mb-3">Or try one of these</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              onClick={() => {
                setText(example);
                onSearch(example);
              }}
              disabled={isSearching}
              className="px-3 py-1.5 rounded-full border border-line text-soft text-xs hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
