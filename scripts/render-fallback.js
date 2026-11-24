// Run in the journal's Vite module environment. Each frame has the same ground anchor.
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import url from "../src/characters/tabby.glb?url";
export async function renderFallback() {
  const { scene: cat, animations } = await new GLTFLoader().loadAsync(url);
  const stage = new T.Scene(),
    camera = new T.OrthographicCamera(-1.64, 1.64, 2.3575, -0.1025, 0.1, 20);
  camera.position.z = 8;
  cat.rotation.y = -0.32;
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
  let frame = 0;
  for (const [name, times] of Object.entries({
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
