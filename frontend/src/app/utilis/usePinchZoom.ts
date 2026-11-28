import { useEffect, useRef, useState } from "react";

export function usePinchZoom(
  setPosition: (pos: { x: number; y: number }) => void,
  position: { x: number; y: number },
  editMode: boolean,
  zoom: number,
  setZoom: (z: number) => void
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const distanceRef = useRef<number | null>(null);
  const lastZoomRef = useRef(zoom);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startTouchRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // ✅ Keep refs always in sync
  const zoomRef = useRef(zoom);
  const positionRef = useRef(position);
  const setPositionRef = useRef(setPosition);
  const setZoomRef = useRef(setZoom);
  useEffect(() => {
    zoomRef.current = zoom;
    positionRef.current = position;
  }, [zoom, position]);

  useEffect(() => {
    setPositionRef.current = setPosition;
    setZoomRef.current = setZoom;
  }, [setPosition, setZoom]);

  const getDistance = (touches: readonly React.Touch[]) => {
    if (touches.length < 2) return 0;
    const [a, b] = [touches[0], touches[1]];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const clampPosition = (x: number, y: number, zoom: number) => {
    const container = ref.current;
    if (!container) return { x, y };

    const rect = container.getBoundingClientRect();
    const imgWidth = rect.width * zoom;
    const imgHeight = rect.height * zoom;
    const baseAllowance = 30;
    const maxX = Math.max(baseAllowance, (imgWidth - rect.width) / 2);
    const maxY = Math.max(baseAllowance, (imgHeight - rect.height) / 2);

    return {
      x: Math.min(Math.max(x, -maxX), maxX),
      y: Math.min(Math.max(y, -maxY), maxY),
    };
  };

  // No-op React handlers retained for API compatibility (real logic uses native listeners below).
  const onTouchStart = (_e: React.TouchEvent<HTMLDivElement>) => {};
  const onTouchMove = (_e: React.TouchEvent<HTMLDivElement>) => {};
  const onTouchEnd = () => {};

  // --- Native (non-passive) touch listeners so preventDefault works ---
  useEffect(() => {
    if (!editMode || !ref.current) return;
    const el = ref.current;
    // Tag the element so page-level handlers can identify a poster pinch-zoom
    // region (product image, logo, etc.) regardless of which frame is rendered.
    el.setAttribute("data-pinch-zoom", "1");

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        distanceRef.current = getDistance(Array.from(e.touches) as unknown as readonly React.Touch[]);
        lastZoomRef.current = zoomRef.current;
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        startTouchRef.current = { x: touch.clientX, y: touch.clientY };
        startPosRef.current = positionRef.current;
        isDraggingRef.current = true;
        setIsDragging(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && distanceRef.current) {
        e.preventDefault();
        const newDistance = getDistance(Array.from(e.touches) as unknown as readonly React.Touch[]);
        const scaleChange = newDistance / distanceRef.current;
        const newZoom = Math.min(Math.max(lastZoomRef.current * scaleChange, 0.2), 3);
        setZoomRef.current(newZoom);
        setPositionRef.current(clampPosition(positionRef.current.x, positionRef.current.y, newZoom));
      } else if (e.touches.length === 1 && isDraggingRef.current) {
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - startTouchRef.current.x;
        const dy = touch.clientY - startTouchRef.current.y;
        const newPos = {
          x: startPosRef.current.x + dx,
          y: startPosRef.current.y + dy,
        };
        setPositionRef.current(clampPosition(newPos.x, newPos.y, zoomRef.current));
      }
    };

    const handleTouchEnd = () => {
      distanceRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);
    el.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
      el.removeAttribute("data-pinch-zoom");
    };
  }, [editMode]);

  // --- Mouse drag for desktop ---
  useEffect(() => {
    if (!editMode || !ref.current) return;
    const el = ref.current;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      setIsDragging(true);
      startTouchRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = positionRef.current;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startTouchRef.current.x;
      const dy = e.clientY - startTouchRef.current.y;
      setPositionRef.current(clampPosition(startPosRef.current.x + dx, startPosRef.current.y + dy, zoomRef.current));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editMode]);

  // --- Wheel zoom ---
  useEffect(() => {
    if (!editMode || !ref.current) return;
    const el = ref.current;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newZoom = Math.min(Math.max(zoomRef.current + (e.deltaY < 0 ? 0.05 : -0.05), 0.2), 3);
      setZoomRef.current(newZoom);
      setPositionRef.current(clampPosition(positionRef.current.x, positionRef.current.y, newZoom));
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [editMode]);

  return { ref, onTouchStart, onTouchMove, onTouchEnd, isDragging };
}
