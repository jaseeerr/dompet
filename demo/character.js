import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { humanHeight } from "../src/rendering/human.js";
import url from "../downloaded assets/spiderman/dompet-spiderman.glb?url";
const canvas = document.querySelector("canvas"),
  renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
const scene = new T.Scene(),
  camera = new T.OrthographicCamera(-2, 2, 2, -2, 0.1, 100);
camera.position.set(0, 1, 8);
camera.lookAt(0, 1.08, 0);
const { scene: cat, animations } = await new GLTFLoader().loadAsync(url);
const pivot = new T.Group();
pivot.add(cat);
scene.add(pivot, new T.HemisphereLight(0xfff5de, 0xaaa39c, 2));
const light = new T.DirectionalLight(0xffefd1, 2.5);
light.position.set(3, 5, 4);
scene.add(light);
const mixer = new T.AnimationMixer(cat),
  clips = document.querySelector("#clip");
for (const clip of animations) clips.add(new Option(clip.name, clip.name));
clips.onchange = () => {
  mixer.stopAllAction();
  mixer.clipAction(T.AnimationClip.findByName(animations, clips.value)).play();
};
clips.onchange();
const scale = document.querySelector("#scale"),
  surface = document.querySelector("#surface"),
  seek = document.querySelector("#seek"),
  rate = document.querySelector("#rate");
surface.onchange = () => {
  canvas.style.background = surface.value;
};
seek.oninput = () => {
  rate.value = "0";
  mixer.setTime(
    Number(seek.value) *
      T.AnimationClip.findByName(animations, clips.value).duration,
  );
};
let previous, previousScale;
renderer.setAnimationLoop((time) => {
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (
    canvas.width !== w ||
    canvas.height !== h ||
    previousScale !== scale.value
  ) {
    renderer.setSize(w, h, false);
    previousScale = scale.value;
    const half = scale.value
      ? (h * humanHeight) / (2 * Number(scale.value))
      : 1.3;
    camera.left = (-half * w) / h;
    camera.right = -camera.left;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
  }
  pivot.rotation.y =
    (Number(document.querySelector("#angle").value) * Math.PI) / 180;
  mixer.update(
    Math.min(0.1, (time - (previous ?? time)) / 1000) *
      Number(document.querySelector("#rate").value),
  );
  previous = time;
  renderer.render(scene, camera);
});
