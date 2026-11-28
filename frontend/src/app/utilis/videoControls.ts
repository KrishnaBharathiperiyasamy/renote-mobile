import { useEffect, useRef, useState } from "react";
import { playVideoExclusive } from "./videoManager";

export const isVideoUrl = (url?: string, type?: string) => {
  if (!url) return false;
  if (type === "video" || type?.startsWith("video/")) return true;
  const cleanUrl = url.split("?")[0].toLowerCase();
  const ext = cleanUrl.split(".").pop() || "";
  if (["mp4", "webm", "mov", "m4v", "ogv", "3gp"].includes(ext)) return true;
  return cleanUrl.includes(".mp4") || cleanUrl.includes(".webm") || cleanUrl.includes(".mov");
};

export const useVideoControls = (videoUrl?: string, type?: string) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const initialMuteApplied = useRef(false);
  const isVideoFile = (url: string, type?: string) => isVideoUrl(url, type);
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      playVideoExclusive(video);
      setIsPlaying(true);
      setUserPaused(false);
    } else {
      video.pause();
      setIsPlaying(false);
      setUserPaused(true);
    }
  };
  const handleVideoTap = () => {
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoFile(videoUrl || "", type)) return;

    // Only force mute on first mount (needed for autoplay policy)
    if (!initialMuteApplied.current) {
      video.muted = true;
      initialMuteApplied.current = true;
    }

    const playIfVisible = () => {
      const rect = video.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0 && !userPaused) {
        playVideoExclusive(video);
        setIsPlaying(true);
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!userPaused) {
            playVideoExclusive(video);
            setIsPlaying(true);
          }
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(video);

    // 🔹 retry a few times to ensure first video autoplay
    const retries = [0, 100, 200]; // in ms
    retries.forEach((delay) =>
      setTimeout(() => {
        if (!isPlaying) playIfVisible();
      }, delay)
    );
    return () => observer.disconnect();
  }, [videoUrl, type, userPaused]);
  return { videoRef, isPlaying, togglePlayPause, isVideoFile, showControls, handleVideoTap };
};
