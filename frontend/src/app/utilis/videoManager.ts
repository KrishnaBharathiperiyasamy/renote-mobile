// src/app/utilis/videoManager.ts
let currentVideo: HTMLVideoElement | null = null;

export const playVideoExclusive = (video: HTMLVideoElement) => {
  if (currentVideo && currentVideo !== video) {
    currentVideo.pause();
  }
  currentVideo = video;
  video.play().catch(() => {});
};

export const pauseCurrentVideo = () => {
  if (currentVideo) {
    currentVideo.pause();
    currentVideo = null;
  }
};
