"use client";

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { MiniPlayerBar } from "./MiniPlayerBar";

export interface Track {
  src: string;
  title: string;
  cover?: string;
}

interface AudioPlayerContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  playTrack: (track: Track) => void;
  loadTrack: (track: Track) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export const useAudioPlayer = (): AudioPlayerContextValue => {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, _setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const persisted = localStorage.getItem("player-volume");
    return persisted ? Number(persisted) : 1;
  });
  
  const [playbackRate, _setPlaybackRate] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const persisted = localStorage.getItem("player-playback-rate");
    return persisted ? Number(persisted) : 1;
  });

  // Update audio element volume and playback rate when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  const setVolume = useCallback((v: number) => {
    _setVolume(v);
    if (typeof window !== "undefined") localStorage.setItem("player-volume", String(v));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    _setPlaybackRate(rate);
    if (typeof window !== "undefined") localStorage.setItem("player-playback-rate", String(rate));
  }, []);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const loadTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  // Effect to load / play track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      if (audio.src !== currentTrack.src) {
        audio.src = currentTrack.src;
      }
      if (isPlaying) {
        audio.play().catch(() => null);
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  // Sync events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const value: AudioPlayerContextValue = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    playTrack,
    loadTrack,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} hidden />
      {/* Mini player always present */}
      <MiniPlayerBar />
    </AudioPlayerContext.Provider>
  );
}; 