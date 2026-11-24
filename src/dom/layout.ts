// Batch DOM reads into one refresh per rendering frame, including while physics is paused.
export function observeLayout(
  refresh: () => void,
  visibility: () => void,
  signal: AbortSignal,
) {
  let pending: number | undefined,
    timer: number | undefined,
    motionUntil = 0;
  let url = location.href;
  function cancel() {
    if (pending !== undefined) cancelAnimationFrame(pending);
    clearTimeout(timer);
    pending = timer = undefined;
  }
  function flush() {
    cancel();
    if (document.hidden || signal.aborted) return;
    url = location.href;
    refresh();
    if (performance.now() < motionUntil)
      timer = window.setTimeout(invalidate, 64);
  }
  function invalidate() {
    if (pending === undefined && !document.hidden && !signal.aborted)
      pending = requestAnimationFrame(flush);
  }
  const options = { signal, capture: true, passive: true };
  for (const name of [
    "resize",
    "orientationchange",
    "scroll",
    "popstate",
    "hashchange",
    "pageshow",
  ])
    window.addEventListener(name, invalidate, options);
  window.visualViewport?.addEventListener("resize", invalidate, options);
  window.visualViewport?.addEventListener("scroll", invalidate, options);
  const navigation = (window as Window & { navigation?: EventTarget })
    .navigation;
  navigation?.addEventListener("currententrychange", invalidate, options);
  document.addEventListener(
    "visibilitychange",
    () => {
      cancel();
      motionUntil = 0;
      if (document.hidden) visibility();
      else flush();
    },
    options,
  );
  function motion(event: Event) {
    if (
      event.target instanceof Element &&
      event.target.closest("[data-dompet]")
    )
      return;
    if (event.type.endsWith("start") || event.type === "transitionrun")
      motionUntil = performance.now() + 1500;
    invalidate();
  }
  for (const name of [
    "transitionrun",
    "transitionstart",
    "transitionend",
    "transitioncancel",
    "animationstart",
    "animationend",
    "animationcancel",
    "toggle",
    "load",
  ])
    document.addEventListener(name, motion, options);
  const mutations = new MutationObserver((records) => {
    if (
      records.some(
        (r) =>
          !(r.target instanceof Element && r.target.closest("[data-dompet]")),
      )
    )
      invalidate();
  });
  mutations.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });
  const resized = new ResizeObserver(invalidate);
  let observed = new Set<Element>();
  function track(elements: Set<Element>) {
    for (const el of observed) if (!elements.has(el)) resized.unobserve(el);
    for (const el of elements) if (!observed.has(el)) resized.observe(el);
    observed = elements;
  }
  signal.addEventListener(
    "abort",
    () => {
      cancel();
      mutations.disconnect();
      resized.disconnect();
      observed.clear();
    },
    { once: true },
  );
  return {
    flush,
    track,
    checkRoute() {
      if (url !== location.href) invalidate();
    },
  };
}

export function modalOpen() {
  if (document.querySelector("dialog:modal")) return true;
  return Array.from(document.querySelectorAll('[aria-modal="true"]')).some(
    (el) =>
      !el.closest('[hidden],[aria-hidden="true"]') &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility === "visible",
  );
}
