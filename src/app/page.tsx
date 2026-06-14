"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppMode, SearchResult } from "@/types";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useWatchlist } from "@/hooks/useWatchlist";
import ListenButton from "@/components/ListenButton";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import ModeSelector from "@/components/ModeSelector";
import MovieCard from "@/components/MovieCard";
import UploadSection from "@/components/UploadSection";
import LinkSection from "@/components/LinkSection";
import TypeSearch from "@/components/TypeSearch";
import MovieModal from "@/components/MovieModal";
import WatchlistPanel from "@/components/WatchlistPanel";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("listen");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { items: watchlistItems } = useWatchlist();

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchedRef = useRef<string>("");

  const identifyMovie = useCallback(async (text: string) => {
    if (!text || text.trim().length < 3) return;
    if (text.trim() === lastSearchedRef.current) return;

    lastSearchedRef.current = text.trim();
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setResults(data.results || []);
      setHasSearched(true);
    } catch {
      setSearchError("Something went wrong. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isListening && transcript && transcript.trim().length > 5) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        identifyMovie(transcript);
      }, 500);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [isListening, transcript, identifyMovie]);

  const handleListenToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      setResults([]);
      setHasSearched(false);
      setSearchError(null);
      lastSearchedRef.current = "";
      resetTranscript();
      startListening();
    }
  };

  const handleModeChange = (newMode: AppMode) => {
    if (isListening) stopListening();
    setMode(newMode);
    setResults([]);
    setHasSearched(false);
    setSearchError(null);
    lastSearchedRef.current = "";
    resetTranscript();
  };

  const modeCopy: Record<AppMode, { kicker: string; line: string }> = {
    listen: { kicker: "Hold it up", line: "Let the room do the talking." },
    upload: { kicker: "Drop a clip", line: "We'll listen to it for you." },
    link: { kicker: "Paste a link", line: "From the feed, straight to the title." },
    type: { kicker: "Type a line", line: "However you half-remember it." },
  };

  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-ink text-paper font-serif text-lg leading-none pb-0.5">
              R
            </span>
            <span className="font-serif text-xl tracking-tight text-ink">Reel</span>
          </div>

          <button
            onClick={() => setWatchlistOpen(true)}
            className="group flex items-center gap-2 text-ink/80 hover:text-accent transition-colors"
          >
            <span className="label">Watchlist</span>
            <span
              className={`grid place-items-center min-w-6 h-6 px-1.5 rounded-full text-xs font-medium ${
                watchlistItems.length > 0
                  ? "bg-accent text-white"
                  : "bg-paper-dim text-soft border border-line"
              }`}
            >
              {watchlistItems.length}
            </span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-14 pb-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-end">
          <div>
            <p className="label text-accent mb-5">An almanac for half-remembered films</p>
            <h1 className="font-serif text-ink leading-[0.95] tracking-tight text-5xl sm:text-6xl lg:text-7xl">
              Name the
              <br />
              <span className="italic">scene.</span>
            </h1>
          </div>
          <p className="text-soft text-base sm:text-lg leading-relaxed max-w-md lg:pb-3">
            You saw a clip. A line stuck. Speak it, drop the file, paste the link, or
            simply type what you remember — and Reel finds the film it came from.
          </p>
        </div>
      </section>

      {/* Mode selector */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <ModeSelector mode={mode} onChange={handleModeChange} />
      </section>

      {/* Input panel */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
        <div className="grid lg:grid-cols-[0.42fr_0.58fr] gap-8 lg:gap-12 items-start">
          {/* Left: mode copy */}
          <div className="lg:sticky lg:top-10">
            <p className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
              {modeCopy[mode].kicker}
            </p>
            <p className="text-soft mt-2 max-w-xs">{modeCopy[mode].line}</p>
          </div>

          {/* Right: the active input */}
          <div className="min-h-56">
            <AnimatePresence mode="wait">
              {mode === "listen" && (
                <motion.div
                  key="listen"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="flex flex-col items-center gap-7"
                >
                  {!isSupported && (
                    <div className="w-full rounded-lg border border-accent/30 bg-accent-soft/60 px-4 py-3">
                      <p className="text-accent-deep text-sm">
                        Live listening needs Chrome or Edge. Try the Upload, Link, or Type
                        modes instead.
                      </p>
                    </div>
                  )}
                  <ListenButton isListening={isListening} onClick={handleListenToggle} />
                  <TranscriptDisplay
                    transcript={transcript}
                    interimTranscript={interimTranscript}
                    isListening={isListening}
                  />
                  {speechError && (
                    <p className="text-accent text-sm text-center max-w-md">{speechError}</p>
                  )}
                </motion.div>
              )}

              {mode === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <UploadSection onTranscriptReady={identifyMovie} isSearching={isSearching} />
                </motion.div>
              )}

              {mode === "link" && (
                <motion.div
                  key="link"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <LinkSection onTranscriptReady={identifyMovie} isSearching={isSearching} />
                </motion.div>
              )}

              {mode === "type" && (
                <motion.div
                  key="type"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <TypeSearch onSearch={identifyMovie} isSearching={isSearching} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-20">
        {isSearching && (
          <div className="flex items-center gap-3 border-t border-line pt-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="label text-soft">Searching the reels</span>
          </div>
        )}

        {searchError && !isSearching && (
          <p className="text-accent text-sm border-t border-line pt-6">{searchError}</p>
        )}

        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-t border-line pt-7"
          >
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-serif text-2xl sm:text-3xl text-ink">
                {results.length === 1 ? "Your match" : "Likely matches"}
              </h2>
              <button
                onClick={() => {
                  setResults([]);
                  setHasSearched(false);
                  lastSearchedRef.current = "";
                }}
                className="label text-soft hover:text-accent transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9">
              {results.map((result, i) => (
                <MovieCard
                  key={result.movie.id}
                  result={result}
                  index={i}
                  rank={i + 1}
                  onClick={setSelectedResult}
                />
              ))}
            </div>
          </motion.div>
        )}

        {hasSearched && results.length === 0 && !isSearching && (
          <div className="border-t border-line pt-12 text-center">
            <p className="font-serif text-3xl text-ink">No film found.</p>
            <p className="text-soft text-sm mt-2 max-w-sm mx-auto">
              The line may not be in the index yet. Try a longer or more distinctive
              piece of dialogue.
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="label text-soft">Reel — find the film</p>
          <p className="text-xs text-soft">
            Dialogue via OpenSubtitles · Metadata by TMDB
          </p>
        </div>
      </footer>

      <WatchlistPanel
        open={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        onSelect={(id) => {
          setSelectedResult(null);
          setSelectedMovieId(id);
          setWatchlistOpen(false);
        }}
      />

      <MovieModal
        movieId={selectedResult?.movie.id ?? selectedMovieId}
        fallback={selectedResult}
        onClose={() => {
          setSelectedResult(null);
          setSelectedMovieId(null);
        }}
      />
    </main>
  );
}
