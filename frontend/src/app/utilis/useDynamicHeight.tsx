import { useEffect, RefObject, useState } from "react";

type UseDynamicHeightOptions = {
    ref: RefObject<HTMLElement | null>;
    editMode?: boolean;
};

export function useDynamicHeight({ ref, editMode }: UseDynamicHeightOptions) {
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let mounted = true;
        let rafId: number | null = null;
        let polling = false;
        let lastMeasured = 0;
        let stableFrames = 0;
        const setMeasuredHeight = (h: number) => {
            const hh = Math.ceil(h);
            if (hh !== lastMeasured) {
                lastMeasured = hh;
                stableFrames = 0;
                setHeight(hh);
            } else {
                stableFrames++;
            }
        };
        const measureNow = () => {
            if (!mounted) return;
            setMeasuredHeight(el.getBoundingClientRect().height);
        };
        // Wait for images
        const imgs = Array.from(el.querySelectorAll("img"));
        let pending = imgs.length;

        const checkAndMeasure = () => {
            pending--;
            if (pending <= 0) {
                requestAnimationFrame(() => {
                    measureNow();
                    startShortPolling();
                });
            }
        };
        if (imgs.length > 0) {
            imgs.forEach((img) => {
                if ((img as HTMLImageElement).complete) {
                    checkAndMeasure();
                } else {
                    img.addEventListener("load", checkAndMeasure);
                    img.addEventListener("error", checkAndMeasure);
                }
            });
        } else {
            requestAnimationFrame(() => {
                measureNow();
                startShortPolling();
            });
        }

        // Resize observer
        const target = el.querySelector('[contenteditable="true"]') || el;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setMeasuredHeight(Math.ceil(entry.contentRect.height));
            }
        });
        ro.observe(target);

        // Mutation observer
        const mo = new MutationObserver(() => {
            measureNow();
            startShortPolling();
        });
        mo.observe(target, { childList: true, subtree: true, characterData: true });

        // Font load
        if ((document as any).fonts?.ready) {
            (document as any).fonts.ready.then(() => {
                measureNow();
                startShortPolling();
            });
        }

        function startShortPolling() {
            if (polling) return;
            polling = true;
            stableFrames = 0;

            const loop = () => {
                if (!mounted) return;
                measureNow();
                if (stableFrames >= 4) {
                    polling = false;
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                    return;
                }
                rafId = requestAnimationFrame(loop);
            };

            rafId = requestAnimationFrame(loop);
        }

        return () => {
            mounted = false;
            ro.disconnect();
            mo.disconnect();
            imgs.forEach((img) => {
                img.removeEventListener("load", checkAndMeasure);
                img.removeEventListener("error", checkAndMeasure);
            });
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [editMode, ref]);

    return height;
}
