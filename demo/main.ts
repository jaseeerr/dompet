/// <reference types="vite/client" />
import { DOMPet } from "../src";
const debug = new URLSearchParams(location.search).has("debug");
const pet = new DOMPet({ debug });
if (debug) {
  document.querySelector<HTMLFieldSetElement>("#physics")!.hidden = false;
  const bind = (id: string, handler: () => void) => {
    document.querySelector<HTMLButtonElement>(id)!.onclick = handler;
  };
  bind("#left", () => pet.debugMove(-1));
  bind("#right", () => pet.debugMove(1));
  bind("#stop", () => pet.debugMove(0));
  bind("#jump", () => pet.debugJump());
  bind("#reset", () => pet.debugReset());
  bind("#inspect", () => {
    const state = pet.debugState;
    if (state)
      document.querySelector<HTMLOutputElement>("#motion")!.value =
        `Feet (${state.x.toFixed(1)}, ${state.y.toFixed(1)}) · Velocity (${state.vx.toFixed(1)}, ${state.vy.toFixed(1)}) · Support ${state.support ?? "airborne"}`;
  });
}
pet.start();
const toggle = document.querySelector<HTMLButtonElement>("#toggle")!;
let paused = false;
toggle.onclick = () => {
  paused = !paused;
  if (paused) pet.pause();
  else pet.resume();
  toggle.textContent = paused ? "Resume pet" : "Pause pet";
};
const grid = document.querySelector(".grid")!;
document.querySelector<HTMLButtonElement>("#add")!.onclick = () => {
  const card = document.createElement("article");
  card.textContent = "Perch " + (grid.children.length + 1);
  grid.append(card);
  pet.refresh();
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
  const input = document.querySelector("input")!;
  addNote(input.value);
  input.value = "";
};
document.querySelector<HTMLButtonElement>("#refresh")!.onclick = () =>
  pet.refresh();
if (import.meta.hot) import.meta.hot.dispose(() => pet.destroy());
