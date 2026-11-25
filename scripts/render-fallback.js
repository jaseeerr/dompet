// Run in the journal's Vite module environment. Each frame has the same ground anchor.
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { humanAnimator, humanHeight } from "../src/rendering/human.js";
import url from "../src/characters/tabby.glb?url";
import humanUrl from "../downloaded assets/dompet-human.glb?url";
import spiderUrl from "../downloaded assets/spiderman/dompet-spiderman.glb?url";
export async function renderFallback(human = false) {
  const { scene: cat, animations } = await new GLTFLoader().loadAsync(
    human === "spiderman" ? spiderUrl : human ? humanUrl : url,
  );
  const stage = new T.Scene(),
    camera = new T.OrthographicCamera(-1.64, 1.64, 2.3575, -0.1025, 0.1, 20);
  if (human) {
    camera.top = 2.15767;
    camera.bottom = -camera.top / 23;
    camera.right = ((camera.top - camera.bottom) * 2) / 3;
    camera.left = -camera.right;
    camera.updateProjectionMatrix();
  }
  camera.position.z = 8;
  cat.rotation.y = human ? 0.92 : -0.32;
  stage.add(cat, new T.HemisphereLight(0xfff6df, 0xb1a598, 2));
  const key = new T.DirectionalLight(0xffe6c2, 2.5);
  key.position.set(3, 5, 4);
  stage.add(key);
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(192, 144);
  const canvas = document.createElement("canvas");
  canvas.width = 15 * 192;
  canvas.height = 144;
  const ctx = canvas.getContext("2d"),
    mixer = new T.AnimationMixer(cat);
  if (human === "spiderman") {
    // Rows: idle, walk, turn, takeoff, flight, land, blink, web shoot, web pull.
    const cols = 24;
    canvas.width = cols * 192;
    canvas.height = 9 * 144;
    const group = new T.Group();
    group.add(cat);
    cat.rotation.y = 0;
    stage.add(group);
    for (let row = 0; row < 9; row++) {
      const animator = humanAnimator(cat, animations);
      for (let col = 0; col < cols; col++) {
        const cycle = col / cols,
          t = col / (cols - 1);
        const phase = row === 2 ? t : 0;
        const state = {
          clock: row === 6 ? t * 240 : 1000 + cycle * 3600,
          heading: phase * phase * (3 - 2 * phase),
          facing: row === 2 ? -1 : 1,
          turnProgress: row === 2 ? t : 1,
          landingTime: row === 5 ? t * 1.02 : Infinity,
          distance: (cycle * 0.82 * 112) / humanHeight,
          clip: row === 4 ? "fall" : "idle",
          anticipation: row === 3 ? t : 0,
          elapsed: 0,
          web:
            row === 7
              ? { clip: "WebShoot", time: t * 0.4 }
              : row === 8
                ? { clip: "WebPull", time: cycle * 0.6 }
                : undefined,
        };
        animator.draw(
          group,
          {
            support: row === 4 ? null : "floor",
            vx: row === 1 ? 42 : 0,
            vy: row === 4 ? -480 + 960 * t : 0,
          },
          state,
          112,
        );
        renderer.render(stage, camera);
        ctx.drawImage(renderer.domElement, col * 192, row * 144);
      }
      animator.dispose();
    }
    renderer.dispose();
    return canvas.toDataURL("image/webp", 0.88).split(",")[1];
  }
  let frame = 0;
  for (const [name, times] of human
    ? [
        ["Idle", [0, 0.8, 1.6]],
        ["Walk", [0, 0.25, 0.5, 0.75]],
        ["JumpTakeoff", [0.28, 0.46]],
        ["Airborne", [0, 0.2]],
        ["Land", [0.15, 0.4]],
        ["Idle", [0.4, 1.4]],
      ]
    : Object.entries({
        idle: [0, 0.4, 0.8],
        walk: [0, 0.25, 0.5, 0.75],
        jump: [0.2, 0.75],
        fall: [0.25, 0.85],
        land: [0.3, 0.65],
        sleep: [0.87, 0.98],
      })) {
    mixer.stopAllAction();
    mixer.clipAction(T.AnimationClip.findByName(animations, name)).play();
    for (const time of times) {
      mixer.setTime(time);
      renderer.render(stage, camera);
      ctx.drawImage(renderer.domElement, frame++ * 192, 0);
    }
  }
  renderer.dispose();
  return canvas.toDataURL("image/webp", 0.92).split(",")[1];
}
