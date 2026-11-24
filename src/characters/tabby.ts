export const tabby = {
  width: 32,
  height: 24,
  anchorX: 16,
  anchorY: 23,
  size: 32,
  facing: 1,
  clips: {
    idle: { first: 0, durations: [950, 340, 95], loop: true },
    walk: { first: 3, durations: [90, 90, 90, 90], loop: true },
    jump: { first: 7, durations: [100, 160], loop: false },
    fall: { first: 9, durations: [120, 170], loop: false },
    land: { first: 11, durations: [60, 65], loop: false },
    sleep: { first: 13, durations: [850, 1050], loop: true },
  },
} as const;
export type Clip = keyof typeof tabby.clips;
