import { useEffect } from "react";

export function useAutoPlayVideos(
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement>>,
  deps: any[] = []
) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    let activeVideo: HTMLVideoElement | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;

          if (entry.isIntersecting) {
            if (isMobile && activeVideo && activeVideo !== video) {
              activeVideo.pause();
            }
            video
              .play()
              .then(() => {
                if (isMobile) activeVideo = video;
              })
              .catch(() => {});
          } else {
            video.pause();
            if (activeVideo === video) activeVideo = null;
          }
        });
      },
      { threshold: isMobile ? 0.75 : 0.5 }
    );

    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.preload = isMobile ? "none" : "metadata";
        observer.observe(video);
      }
    });

    return () => observer.disconnect();
  }, deps);
}
