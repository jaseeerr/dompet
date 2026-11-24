export interface Scheduler {
    request(callback: FrameRequestCallback): number;
    cancel(id: number): void;
}
export declare function playback(clock: Scheduler, random: () => number, draw: (phase: number) => void, update?: () => void): {
    resume(): void;
    resetTime(): void;
    pause(): void;
};
