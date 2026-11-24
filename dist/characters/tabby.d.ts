export declare const tabby: {
    readonly width: 32;
    readonly height: 24;
    readonly anchorX: 16;
    readonly anchorY: 23;
    readonly size: 32;
    readonly facing: 1;
    readonly clips: {
        readonly idle: {
            readonly first: 0;
            readonly durations: readonly [950, 340, 95];
            readonly loop: true;
        };
        readonly walk: {
            readonly first: 3;
            readonly durations: readonly [90, 90, 90, 90];
            readonly loop: true;
        };
        readonly jump: {
            readonly first: 7;
            readonly durations: readonly [100, 160];
            readonly loop: false;
        };
        readonly fall: {
            readonly first: 9;
            readonly durations: readonly [120, 170];
            readonly loop: false;
        };
        readonly land: {
            readonly first: 11;
            readonly durations: readonly [60, 65];
            readonly loop: false;
        };
        readonly sleep: {
            readonly first: 13;
            readonly durations: readonly [850, 1050];
            readonly loop: true;
        };
    };
};
export type Clip = keyof typeof tabby.clips;
