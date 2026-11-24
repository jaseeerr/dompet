/// <reference types="vite/client" />
import { DOMPet } from "../src";
import { drawRoom } from "./room";
drawRoom(document.querySelector<HTMLCanvasElement>("#room")!);
const debug = document.querySelector<HTMLInputElement>("#debug")!;
const size = document.querySelector<HTMLSelectElement>("#size")!;
const speed = document.querySelector<HTMLSelectElement>("#speed")!;
debug.checked = new URLSearchParams(location.search).has("debug");
const renderer = document.querySelector<HTMLSelectElement>("#renderer")!;
let paused = false;
let pet: DOMPet;
function configure() {
  pet?.destroy();
  document.querySelector<HTMLFieldSetElement>("#physics")!.hidden =
    !debug.checked;
  document.querySelector<HTMLOutputElement>("#motion")!.value = "";
  pet = new DOMPet({
    debug: debug.checked,
    renderer: renderer.value === "sprite" ? "sprite" : "auto",
    size: size.value ? Number(size.value) : undefined,
    speed: Number(speed.value),
  });
  pet.start();
  if (paused) pet.pause();
}
configure();
for (const control of [size, speed, debug, renderer])
  control.onchange = configure;
const bind = (id: string, handler: () => void) => {
  document.querySelector<HTMLButtonElement>(id)!.onclick = handler;
};
bind("#left", () => pet.debugMove(-1));
bind("#right", () => pet.debugMove(1));
bind("#stop", () => pet.debugMove(0));
bind("#explore", () => pet.debugExplore());
bind("#jump", () => pet.debugJump());
bind("#reset", () => pet.debugReset());
bind("#inspect", () => {
  const state = pet.debugState;
  if (state)
    document.querySelector<HTMLOutputElement>("#motion")!.value =
      `Feet (${state.x.toFixed(1)}, ${state.y.toFixed(1)}) · Velocity (${state.vx.toFixed(1)}, ${state.vy.toFixed(1)}) · Support ${state.support ?? "airborne"} · Behaviour ${state.behaviour}`;
});
const toggle = document.querySelector<HTMLButtonElement>("#toggle")!;
toggle.onclick = () => {
  paused = !paused;
  if (paused) pet.pause();
  else pet.resume();
  toggle.textContent = paused ? "Resume pet" : "Pause pet";
};
const grid = document.querySelector(".grid")!;
document.querySelector<HTMLButtonElement>("#add")!.onclick = () => {
  const card = document.createElement("article");
  const title = document.createElement("h3");
  title.textContent = "Perch " + (grid.children.length + 1);
  const note = document.createElement("p");
  note.textContent = "A new lookout for the next round of observations.";
  card.append(title, note);
  grid.append(card);
};
const notes = document.querySelector("ul")!;
function addNote(value: string) {
  const item = document.createElement("li");
  item.textContent = value;
  notes.prepend(item);
}
for (const note of [
  "Morning light",
  "Warm sill",
  "Open window",
  "Quiet shelf",
  "Garden view",
  "Evening shade",
])
  addNote(note);
document.querySelector("form")!.onsubmit = (e) => {
  e.preventDefault();
  const input = document.querySelector<HTMLInputElement>(
    "input[name=observation]",
  )!;
  addNote(input.value);
  input.value = "";
};
document.querySelector<HTMLButtonElement>("#refresh")!.onclick = () =>
  pet.refresh();
if (import.meta.hot) import.meta.hot.dispose(() => pet.destroy());
