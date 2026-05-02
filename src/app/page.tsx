"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppMode, SearchResult } from "@/types";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import ListenButton from "@/components/ListenButton";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import ModeSelector from "@/components/ModeSelector";
import MovieCard from "@/components/MovieCard";
import UploadSection from "@/components/UploadSection";
import TypeSearch from "@/components/TypeSearch";
import MovieModal from "@/components/MovieModal";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("listen");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      setResults(data.results || []);
      setHasSearched(true);
    } catch {
      setSearchError("Failed to search. Please try again.");
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

  return (
    <main className="relative z-10 min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center pt-8 pb-2 px-4">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              SceneSnap
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-sm"
          >
            Identify any movie from a scene, quote, or clip
          </motion.p>
        </div>
      </header>

      {/* Mode Selector */}
      <div className="flex justify-center px-4 py-6">
        <ModeSelector mode={mode} onChange={handleModeChange} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <AnimatePresence mode="wait">
          {mode === "listen" && (
            <motion.div
              key="listen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6 w-full"
            >
              {!isSupported && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 max-w-md text-center">
                  <p className="text-yellow-400 text-sm">
                    Speech recognition is not supported in your browser. Please try Chrome or Edge, or use the &quot;Type&quot; mode instead.
                  </p>
                </div>
              )}

              <ListenButton
                isListening={isListening}
                onClick={handleListenToggle}
              />

              <TranscriptDisplay
                transcript={transcript}
                interimTranscript={interimTranscript}
                isListening={isListening}
              />

              {speechError && (
                <p className="text-red-400 text-sm text-center max-w-md">
                  {speechError}
                </p>
              )}
            </motion.div>
          )}

          {mode === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-xl mx-auto"
            >
              <UploadSection
                onTranscriptReady={identifyMovie}
                isSearching={isSearching}
              />
            </motion.div>
          )}

          {mode === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <TypeSearch onSearch={identifyMovie} isSearching={isSearching} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Status */}
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mt-8"
          >
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Identifying movie...</span>
          </motion.div>
        )}

        {searchError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mt-6"
          >
            {searchError}
          </motion.p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mt-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {results.length === 1 ? "Best Match" : `Top ${results.length} Matches`}
              </h2>
              <button
                onClick={() => {
                  setResults([]);
                  setHasSearched(false);
                  lastSearchedRef.current = "";
                }}
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Clear results
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {results.map((result, i) => (
                <MovieCard
                  key={result.movie.id}
                  result={result}
                  index={i}
                  onClick={setSelectedMovieId}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* No results */}
        {hasSearched && results.length === 0 && !isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 text-center"
          >
            <svg className="w-16 h-16 mx-auto text-gray-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-gray-400 font-medium">No movies found</p>
            <p className="text-gray-600 text-sm mt-1">
              Try a different quote or use the &quot;Type&quot; mode with a famous line
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-700 text-xs">
        Powered by TMDB. Movie data provided by The Movie Database.
      </footer>

      {/* Movie Detail Modal */}
      <MovieModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
    </main>
  );
}
