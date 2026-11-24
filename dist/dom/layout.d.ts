export declare function observeLayout(refresh: () => void, visibility: () => void, signal: AbortSignal): {
    flush: () => void;
    track: (elements: Set<Element>) => void;
    checkRoute(): void;
};
export declare function modalOpen(): boolean;
