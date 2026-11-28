export type AspectRatioKey = "1:1" | "3:4" | "4:5" | "A4";

export interface AspectRatioConfig {
    label: string;
    subtitle: string;
    w: number;
    h: number;
    desktopW: number;
    desktopH: number;
    ratio: number; // h / w
    recommended?: boolean;
    use: string;
}

export const POSTER_ASPECT_RATIOS: Record<AspectRatioKey, AspectRatioConfig> = {
    "1:1": {
        label: "1:1",
        subtitle: "Square",
        w: 1,
        h: 1,
        desktopW: 550,
        desktopH: 550,
        ratio: 1,
        use: "Instagram Post",
    },
    "3:4": {
        label: "3:4",
        subtitle: "Classic",
        w: 3,
        h: 4,
        desktopW: 550,
        desktopH: 733,
        ratio: 4 / 3,
        recommended: true,
        use: "Pinterest / Print",
    },
    "4:5": {
        label: "4:5",
        subtitle: "Portrait",
        w: 4,
        h: 5,
        desktopW: 550,
        desktopH: 688,
        ratio: 5 / 4,
        recommended: true,
        use: "Instagram / Facebook",
    },
    "A4": {
        label: "A4",
        subtitle: "Print",
        w: 210,
        h: 297,
        desktopW: 550,
        desktopH: 778,
        ratio: 297 / 210,
        use: "Print / PDF",
    },
};

export const DEFAULT_ASPECT_RATIO: AspectRatioKey = "3:4";
