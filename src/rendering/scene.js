import * as T from "three";

import { pose, standingWidth } from "./pose.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import devAsset from "../characters/tabby.glb?url";
import humanAsset from "../../downloaded assets/dompet-human.glb?url";
import { humanAnimator, humanHeight } from "./human.js";
function catAnimator(root) {
  const node = (name) => root.getObjectByName(name);
  const legs = [];
  for (const front of [false, true])
    for (const side of [-1, 1]) {
      const id = (front ? "fore" : "hind") + (side === 1 ? "Near" : "Far");
      legs.push({
        hip: node(id),
        knee: node(id + "Knee"),
        ankle: node(id + "Ankle"),
        front,
        side,
      });
    }
  const rig = {
    root,
    chest: node("chest"),
    spine: node("spine"),
    head: node("neck"),
    ears: [node("earHinge-1"), node("earHinge1")],
    eyes: [node("eyelid-1"), node("eyelid1")],
    legs,
    tail: Array.from({ length: 7 }, (_, i) => node("tail" + i)),
  };
  const contacts = legs.map((leg) => node(leg.hip.name + "Contact"));
  return {
    contacts,
    draw: (group, body, anim, size) => pose(rig, group, body, anim, size),
  };
}
export async function scene(host, lost, signal, character) {
  const human = character === "human";
  const url = import.meta.env.DEV
    ? human
      ? humanAsset
      : devAsset
    : human
      ? new URL("../assets/dompet-human.glb", import.meta.url).href
      : new URL("../assets/tabby.glb", import.meta.url).href;
  const response = await fetch(url, { signal });
  if (!response.ok) throw Error("Tabby asset unavailable");
  const { scene: root, animations } = await new GLTFLoader().parseAsync(
    await response.arrayBuffer(),
    "",
  );
  const geometries = new Set(),
    materials = new Set(),
    skeletons = new Set();
  root.traverse((node) => {
    if (node.skeleton) skeletons.add(node.skeleton);
    if (node.isMesh) {
      geometries.add(node.geometry);
      materials.add(node.material);
    }
  });
  const disposeAsset = () => {
    skeletons.forEach((s) => s.dispose());
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => {
      m.map?.source.data?.close?.();
      m.map?.dispose();
      m.dispose();
    });
  };
  if (signal.aborted) {
    disposeAsset();
    throw new Error("Disposed");
  }
  const avatar = human ? humanAnimator(root, animations) : catAnimator(root);
  const marker = new T.Vector3();
  const canvas = document.createElement("canvas");
  let gl;
  try {
    gl = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (error) {
    disposeAsset();
    throw error;
  }
  canvas.style.cssText = "position:absolute;pointer-events:none;top:0;left:0";
  host.append(canvas);
  canvas.addEventListener("webglcontextlost", lost);
  const stage = new T.Scene();
  const camera = new T.OrthographicCamera(-2, 2, 2, -2, 0.1, 20);
  camera.position.z = 8;
  const cat = new T.Group();
  stage.add(cat, new T.HemisphereLight(0xfff6df, 0xb1a598, 2));
  const key = new T.DirectionalLight(0xffe6c2, 2.5);
  key.position.set(3, 5, 4);
  stage.add(key);
  cat.add(root);
  let previousSize = 0;
  return {
    draw(body, animation, size, ratio, visible, debug) {
      canvas.hidden = !visible;
      if (!visible) return;
      const px = (size * 4) / (human ? humanHeight : standingWidth);
      if (
        previousSize !== px ||
        gl.getPixelRatio() !==
          Math.min(window.innerWidth <= 600 ? 1.5 : 2, ratio)
      ) {
        previousSize = px;
        gl.setPixelRatio(Math.min(window.innerWidth <= 600 ? 1.5 : 2, ratio));
        gl.setSize(px, px);
      }
      canvas.style.transform =
        "translate(" + (body.x - px / 2) + "px," + (body.y - px * 0.8) + "px)";
      camera.top = 3.2;
      camera.bottom = -0.8;
      camera.updateProjectionMatrix();
      avatar.draw(cat, body, animation, size);
      gl.render(stage, camera);
      if (debug) {
        debug.save();
        debug.strokeStyle = "#347678";
        debug.strokeRect(
          body.x - size * (human ? 0.13 : 0.215),
          body.y - size * (human ? 1 : 0.56),
          size * (human ? 0.26 : 0.43),
          size * (human ? 1 : 0.56),
        );
        debug.fillStyle = "#086867";
        for (const point of avatar.contacts ?? []) {
          point.getWorldPosition(marker).project(camera);
          debug.fillRect(
            body.x + (marker.x * px) / 2 - 1,
            body.y - px * 0.8 + ((1 - marker.y) * px) / 2 - 1,
            2,
            2,
          );
        }
        debug.restore();
      }
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", lost);
      avatar.dispose?.();
      disposeAsset();
      gl.dispose();
      gl.forceContextLoss();
      canvas.remove();
    },
  };
}
