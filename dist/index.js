function _(o, t, s) {
  let i, e, n = 0, r = location.href;
  function h() {
    i !== void 0 && cancelAnimationFrame(i), clearTimeout(e), i = e = void 0;
  }
  function l() {
    h(), !(document.hidden || s.aborted) && (r = location.href, o(), performance.now() < n && (e = window.setTimeout(c, 64)));
  }
  function c() {
    i === void 0 && !document.hidden && !s.aborted && (i = requestAnimationFrame(l));
  }
  const f = { signal: s, capture: !0, passive: !0 };
  for (const d of [
    "resize",
    "orientationchange",
    "scroll",
    "popstate",
    "hashchange",
    "pageshow"
  ])
    window.addEventListener(d, c, f);
  window.visualViewport?.addEventListener("resize", c, f), window.visualViewport?.addEventListener("scroll", c, f), window.navigation?.addEventListener("currententrychange", c, f), document.addEventListener(
    "visibilitychange",
    () => {
      h(), n = 0, document.hidden ? t() : l();
    },
    f
  );
  function g(d) {
    d.target instanceof Element && d.target.closest("[data-dompet]") || ((d.type.endsWith("start") || d.type === "transitionrun") && (n = performance.now() + 1500), c());
  }
  for (const d of [
    "transitionrun",
    "transitionstart",
    "transitionend",
    "transitioncancel",
    "animationstart",
    "animationend",
    "animationcancel",
    "toggle",
    "load"
  ])
    document.addEventListener(d, g, f);
  const v = new MutationObserver((d) => {
    d.some(
      (a) => !(a.target instanceof Element && a.target.closest("[data-dompet]"))
    ) && c();
  });
  v.observe(document.documentElement, {
    subtree: !0,
    childList: !0,
    characterData: !0,
    attributes: !0
  });
  const p = new ResizeObserver(c);
  let M = /* @__PURE__ */ new Set();
  function x(d) {
    for (const a of M) d.has(a) || p.unobserve(a);
    for (const a of d) M.has(a) || p.observe(a);
    M = d;
  }
  return s.addEventListener(
    "abort",
    () => {
      h(), v.disconnect(), p.disconnect(), M.clear();
    },
    { once: !0 }
  ), {
    flush: l,
    track: x,
    checkRoute() {
      r !== location.href && c();
    }
  };
}
function tt() {
  return document.querySelector("dialog:modal") ? !0 : Array.from(document.querySelectorAll('[aria-modal="true"]')).some(
    (o) => !o.closest('[hidden],[aria-hidden="true"]') && o.getClientRects().length > 0 && getComputedStyle(o).visibility === "visible"
  );
}
const j = 1 / 120, R = {
  width: 30,
  fullFootprint: !1,
  height: 22,
  speed: 180,
  gravity: 1200,
  jumpSpeed: 480,
  terminalSpeed: 800
};
function V(o, t = R) {
  return {
    x: Math.min(
      o.width / 2,
      Math.max(t.width / 2, o.width * 0.4)
    ),
    y: Math.min(o.height, t.height),
    vx: 0,
    vy: 0,
    support: null
  };
}
function H(o, t, s, i = R) {
  const e = Math.min(i.width, s) / 2;
  return o.intervals.some(
    ([n, r]) => Math.min(r, t + e) - Math.max(n, t - e) >= (i.fullFootprint ? e * 2 - 1e-7 : Math.min(4, e * 2)) && r > n
  );
}
function $(o, t, s, i, e = R) {
  const { width: n, height: r } = i;
  if (!Number.isFinite(n) || !Number.isFinite(r) || n <= 0 || r <= 0)
    return { x: 0, y: 0, vx: 0, vy: 0, support: null };
  if (![o.x, o.y, o.vx, o.vy].every(Number.isFinite) || o.y > r || o.y < 0 || o.x < 0 || o.x > n)
    return V(i, e);
  const h = Math.min(n, e.width) / 2, l = o.x + t.direction * e.speed * j, c = (a) => Math.max(h, Math.min(n - h, a)), f = c(l), u = f === l ? t.direction * e.speed : 0, g = s.find(
    (a) => a.id === o.support && a.y === o.y && H(a, o.x, n, e)
  );
  if (g && !t.jump && H(g, f, n, e))
    return { x: f, y: g.y, vx: u, vy: 0, support: g.id };
  const v = g && t.jump ? -R.jumpSpeed : o.vy;
  let p = Math.min(
    R.terminalSpeed,
    v + e.gravity * j
  ), M = o.y + p * j, x;
  if (p > 0)
    for (const a of s) {
      if (a.y < o.y || a.y > M || a.y < Math.min(r, e.height) || a.y > r || x && a.y >= x.y)
        continue;
      const L = (a.y - o.y) / (M - o.y), y = c(o.x + (l - o.x) * L);
      H(a, y, n, e) && (a.y !== o.y || H(a, f, n, e)) && (x = a);
    }
  if (x)
    return {
      x: f,
      y: x.y,
      vx: u,
      vy: 0,
      support: H(x, f, n, e) ? x.id : null
    };
  const d = Math.min(r, e.height);
  return M < d && (M = d, p = 0), M > r ? V(i, e) : { x: f, y: M, vx: u, vy: p, support: null };
}
function et(o, t, s, i, e = R) {
  if (!o.support) return o;
  const n = t.find((h) => h.id === o.support), r = s.find((h) => h.id === o.support);
  if (n && r && r.y >= Math.min(i.height, e.height)) {
    const h = Math.min(i.width, e.width) / 2, l = o.x + (r.originX ?? r.left) - (n.originX ?? n.left);
    if (l >= h && l <= i.width - h && H(r, l, i.width, e))
      return { ...o, x: l, y: r.y };
  }
  return { ...o, support: null, vy: 0 };
}
function it(o, t) {
  return o.length === t.length && o.every((s, i) => {
    const e = t[i];
    return s.id === e.id && s.y === e.y && s.intervals.length === e.intervals.length && s.intervals.every(
      ([n, r], h) => n === e.intervals[h][0] && r === e.intervals[h][1]
    );
  });
}
const st = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAAYCAYAAAAiYi5VAAAEZklEQVR42u1bO64UMRB8Z3oZARESNyDlHGSQQcBFIEfiBhyDCIlbLPLqeWU1/rvsmhlXSdbTzpudcrXb7p629+lJEARBEARBEARBEARBEARBEARBEARBEARBEARBEARB2Bdvnl/fEPeclV/QBNjaAbUAyP/kgxh+d09rP39/eZv9jvufu6dFS0sf0PyC8MScAGdbfNj6Zf+99V/FB909tz8/7q01AP79+vnmA6dt7n+12nv6gORX8rf5m2yPodgOiFp82Ppl/731j/aBbYNR/t4A/O3dq9vt5/tHi32eGYBR/L3+jwyAR6hAbBt8e5x/xgTocQDW5Efpl/331j8KpA0Y/H6RbrW//16O27VSkOjtA4p/xP+RCTC7AqEA3Gh89ARgZcBs/bL/3vpH5y7KBix+d919x7XR8U+1mvFv7QOKfzQAoypwZ/T/S5WfU9lfbGBnTIBWB0AGQKZ+2X9v/a3zM3wW0gYs/tHxd80HTjsW/lrNWyKTP6d/ZQmcUQEYmReo8js9AKeyP+9AoaN5h0I5YMkBVgRAhH7LGV5bwb+7/c+qv5gYZPQjbcDiR4y/v3bndYnUy1+fWM32v1n8KytAORuw/P/I+8/QBCB0qNDA4cD6bCocWIQD5hxg9QI8qv/xJhXor8kqZf+99eeCX04/Kgiw+XvH/3HtpXoRNld+ra1qHJF/dQUoVeFg+X9J/6r95xw/LAGwC5AdXO9osYwL6YDWwVgLMEO/7L+v/tLbTUo/0gZM/t7x93aP8d+DRaXuo/EzEmDLz/T/Gv0r9p9z/PAEwGZh1uAxo3vjsiYAcvFh6pf9pd8mAi360T7I4B8Zf9eeP364t0+/vt+b/7xi/ZvBvzoAWn6G/9dWYFbsP5fsD08A7CIUGj10uLCF2RJzAqAWH7Z+2X8v/TZr9s9u1T9ig1gfVvLHfKCHH3kehsFv/Z+RAMfm36r531KBmb3/3MMPSQDC7DccEN+s84X3oh2wdgL4+0cnP1u/7L+XfnvyOgx8obaZ+lN9WMVf8xa+E39vBQIVAGP8jPlf0o86AFtag0r80w6gperasX0yW7ZDbLj3LMAIfrZ+2X8f/Tb4hc9ZpX+kDzP9v8YHrszPCoCxebBq/sd8MacfdQA21ocS/8wE4L/X8FyWd9UAyNZ/FvvXnOK8qv7YgZmeAJizqT2Va9+OR/lLJ2DDN+IYnz20M2v8aw5wzeRv3b5Al6RXJ8CMBMQG4JL+WYcPbRKQ4p+RACQdMCUmVcJCTwDxc/hrnmv7eXb9uZ+DhFy5Po0uREz+VPCP7bvHrq0OwjOCz1H8vyYAXmX9aan+2DMLqP3nFt6ZB9CSGUnpN2rIwwni5/PXPDfWT+QCuFp/6jkt1YDh059E/pzt7eJfCghoH8j5Kfpg1K7+z+KPHUJLlX/tVgmq/G6rKTX86ANoVeUxxP3iPzZ/7XNZvLP6Mfqcs39/5BmsOTDLB3f0fyZ/6xmIFfO/xI/efxcEQRAEKmLVlqvw/wMbWRlA+DAfaAAAAABJRU5ErkJggg==", S = {
  width: 32,
  height: 24,
  anchorY: 23,
  facing: 1,
  clips: {
    idle: { first: 0, durations: [950, 340, 95], loop: !0 },
    walk: { first: 3, durations: [90, 90, 90, 90], loop: !0 },
    jump: { first: 7, durations: [100, 160], loop: !1 },
    fall: { first: 9, durations: [120, 170], loop: !1 },
    land: { first: 11, durations: [60, 65], loop: !1 },
    sleep: { first: 13, durations: [850, 1050], loop: !0 }
  }
};
class U {
  clip = "fall";
  facing = S.facing;
  elapsed = 0;
  distance = 0;
  clock = 0;
  heading = 0;
  sleep = 0;
  anticipation = 0;
  impact = 0;
  descent = 0;
  gaze = 0;
  update(t, s, i, e, n = 0) {
    t.vx && (this.facing = t.vx < 0 ? -1 : 1), this.clock += e, this.gaze += (n - this.gaze) * Math.min(1, e / 110), this.anticipation += ((i === "prepare-jump" ? 1 : 0) - this.anticipation) * Math.min(1, e / 55), t.support ? s || (this.impact = Math.min(1, this.descent / 520)) : this.descent = Math.max(0, t.vy), this.sleep += ((t.support && i === "sleep" ? 1 : 0) - this.sleep) * Math.min(1, e / 170), t.support && (this.distance += Math.abs(t.vx) * e / 1e3);
    const r = this.facing === 1 ? 0 : 1;
    this.heading += Math.sign(r - this.heading) * Math.min(Math.abs(r - this.heading), e / 180);
    let h;
    t.support ? !s || this.clip === "land" && this.elapsed < S.clips.land.durations.reduce((l, c) => l + c, 0) ? h = "land" : t.vx ? h = "walk" : h = i === "sleep" ? "sleep" : "idle" : h = t.vy < 0 ? "jump" : "fall", h !== this.clip ? (this.clip = h, this.elapsed = 0) : this.elapsed += e;
  }
  get frame() {
    const t = S.clips[this.clip], s = t.durations.reduce((e, n) => e + n, 0);
    let i = t.loop ? this.elapsed % s : this.elapsed;
    for (let e = 0; e < t.durations.length - 1; e++) {
      if (i < t.durations[e]) return t.first + e;
      i -= t.durations[e];
    }
    return t.first + t.durations.length - 1;
  }
}
function nt(o, t) {
  const s = new Image();
  let i = !1;
  return s.onload = () => {
    i = s.naturalWidth === 15 * S.width && s.naturalHeight === S.height, o(), i || t();
  }, s.onerror = () => {
    i = !1, o(), t();
  }, s.src = st, {
    draw(e, n, r, h, l) {
      const c = h / S.width;
      e.save(), e.translate(
        Math.round(r.x * l) / l,
        Math.round(r.y * l) / l
      ), e.scale(n.facing * c, c), e.imageSmoothingEnabled = !1, i ? e.drawImage(
        s,
        n.frame * S.width,
        0,
        S.width,
        S.height,
        -16,
        -23,
        S.width,
        S.height
      ) : (e.fillStyle = "#43323d", e.fillRect(-12, -16, 24, 16), e.fillRect(-10, -21, 5, 6), e.fillRect(5, -21, 5, 6), e.fillStyle = "#ffe5b5", e.fillRect(-5, -10, 3, 3), e.fillRect(5, -10, 3, 3)), e.restore();
    },
    dispose() {
      s.onload = null, s.onerror = null;
    }
  };
}
const O = { direction: 0, jump: !1 };
class rt {
  constructor(t, s = Math.random) {
    this.graph = t, this.random = s;
  }
  graph;
  random;
  plans = 0;
  targets = [];
  state = "idle";
  wait = 180;
  path = [];
  launched = 0;
  previousDistance = 1 / 0;
  stroll;
  visits = /* @__PURE__ */ new Map();
  failures = /* @__PURE__ */ new Map();
  blocked = /* @__PURE__ */ new Set();
  lookPitch(t) {
    const s = this.path[0];
    if (!s || !t.support) return 0;
    const i = Math.abs((s.landing[0] + s.landing[1]) / 2 - t.x);
    return Math.max(
      -0.22,
      Math.min(0.22, Math.atan2(t.y - s.to.platform.y, Math.max(1, i)))
    );
  }
  rest() {
    this.state = this.random() < 0.18 ? "sleep" : "idle", this.wait = Math.round(
      (this.state === "sleep" ? 260 : 45) + this.random() * 140
    );
  }
  fail(t) {
    const s = t.from.key + ">" + t.to.key, i = (this.failures.get(s) ?? 0) + 1;
    if (this.failures.set(s, i), this.blocked.add(t), i >= 2)
      for (const e of this.graph.edges(t.from))
        e.to === t.to && this.blocked.add(e);
    this.path = [], this.launched = 0, this.previousDistance = 1 / 0, this.state = "recover", this.wait = 45;
  }
  plan(t, s) {
    this.targets.length || (this.plans++, this.targets = this.graph.surfaces.filter((h) => h !== t).map((h) => ({
      s: h,
      rank: (this.visits.get(h.key) ?? 0) + this.random()
    })).sort((h, l) => h.rank - l.rank).slice(0, 8).map((h) => h.s));
    const i = { trials: 6 };
    for (; this.targets.length; ) {
      const h = this.graph.route(
        t,
        this.targets[0],
        this.blocked,
        i
      );
      if (h.length) {
        this.path = h, this.targets = [];
        return;
      }
      if (!i.trials) return;
      this.targets.shift();
    }
    const [e, n] = t.span, r = e + this.random() * (n - e);
    Math.abs(r - s.x) > 4 ? this.stroll = r : this.rest();
  }
  intent(t) {
    const s = this.graph.locate(t);
    let i = this.path[0];
    if (i && this.launched)
      if (s === i.to)
        this.visits.set(s.key, (this.visits.get(s.key) ?? 0) + 1), this.path.shift(), this.launched = 0, this.path.length || this.rest();
      else return t.support && s !== i.from || this.launched > i.ticks + 12 ? (this.fail(i), O) : (this.launched++, this.state = t.support ? "walk" : t.vy < 0 ? "jump" : "fall", { direction: i.direction, jump: !1 });
    if (!s)
      return this.state = t.vy < 0 ? "jump" : "fall", O;
    if (this.wait > 0)
      return this.wait--, (this.state === "fall" || this.state === "jump") && (this.state = "idle"), O;
    if (!this.path.length && this.stroll === void 0 && this.plan(s, t), i = this.path[0], !i && this.stroll === void 0) return O;
    if (i && i.from !== s)
      return this.fail(i), O;
    const e = i ? (i.takeoff[0] + i.takeoff[1]) / 2 : this.stroll, n = Math.abs(e - t.x);
    return n > this.graph.settings.speed * j / 2 + 1e-7 ? n >= this.previousDistance ? (i ? this.fail(i) : (this.stroll = void 0, this.rest()), this.previousDistance = 1 / 0, O) : (this.previousDistance = n, this.state = "walk", { direction: e > t.x ? 1 : -1, jump: !1 }) : (this.previousDistance = 1 / 0, i ? i.kind === "jump" && this.state !== "prepare-jump" ? (this.state = "prepare-jump", this.wait = 12, O) : (this.launched = 1, this.state = i.kind === "jump" ? "jump" : "walk", { direction: i.direction, jump: i.kind === "jump" }) : (this.stroll = void 0, this.rest(), O));
  }
}
class ot {
  constructor(t, s, i = R) {
    this.bounds = s, this.settings = i;
    const e = Math.min(this.settings.width, s.width) / 2;
    for (const n of t) {
      if (n.y < Math.min(this.settings.height, s.height) || n.y > s.height)
        continue;
      const r = Math.floor(
        (n.y - R.terminalSpeed * j) / 64
      ), h = Math.floor(n.y / 64);
      for (let c = r; c <= h; c++) {
        const f = this.rows.get(c) ?? [];
        f.push(n), this.rows.set(c, f);
      }
      const l = [];
      for (const [c, [f, u]] of n.intervals.entries()) {
        const g = [
          Math.max(f + (i.fullFootprint ? e : 0), e),
          Math.min(
            u - (i.fullFootprint ? e : 0),
            s.width - e
          )
        ];
        g[0] > g[1] || l.push({ platform: n, key: n.id + "/" + c, span: g });
      }
      this.surfaces.push(...l), this.byPlatform.set(n.id, l);
    }
  }
  bounds;
  settings;
  edgeCount = 0;
  rows = /* @__PURE__ */ new Map();
  jobs = /* @__PURE__ */ new Map();
  surfaces = [];
  byPlatform = /* @__PURE__ */ new Map();
  cache = /* @__PURE__ */ new Map();
  locate(t) {
    if (!t.support) return;
    let s, i = 1 / 0;
    for (const e of this.byPlatform.get(t.support) ?? []) {
      const n = Math.max(0, e.span[0] - t.x, t.x - e.span[1]);
      n < i && n <= this.settings.width / 2 && (s = e, i = n);
    }
    return s;
  }
  edges(t, s) {
    const i = this.cache.get(t);
    if (i) return i;
    let e = this.jobs.get(t);
    for (e || (e = { trials: this.transitions(t), found: [] }, this.jobs.set(t, e)); !s || s.trials > 0; ) {
      s && s.trials--;
      const n = e.trials.next();
      if (n.done)
        return this.jobs.delete(t), this.cache.set(t, e.found), this.edgeCount += e.found.length, e.found;
      n.value && e.found.push(n.value);
    }
    return [];
  }
  *transitions(t) {
    const s = Math.min(
      1200,
      Math.ceil(
        (2 + (R.jumpSpeed + R.terminalSpeed) / this.settings.gravity + this.bounds.height / R.terminalSpeed) / j
      )
    ), [i, e] = t.span, n = Math.min(24, Math.max(1, Math.ceil((e - i) / 36)));
    for (let r = 0; r <= n; r++) {
      const h = i + (e - i) * r / n;
      for (const l of [-1, 0, 1])
        yield this.trace(t, h, l, !0, s), (r === 0 && l === -1 || r === n && l === 1) && (yield this.trace(t, h, l, !1, s));
    }
  }
  trace(t, s, i, e, n) {
    const r = this.settings.speed * j;
    let h = {
      x: s,
      y: t.platform.y,
      vx: 0,
      vy: 0,
      support: t.platform.id
    }, l = !1;
    for (let c = 1; c <= n; c++) {
      const f = h;
      if (h = $(
        h,
        { direction: i, jump: e && c === 1 },
        this.rows.get(Math.floor(h.y / 64)) ?? [],
        this.bounds,
        this.settings
      ), !h.support) {
        l = !0;
        continue;
      }
      const u = this.locate(h);
      if (u !== t) {
        if (!u) return;
        const g = e || l || this.settings.fullFootprint ? 0 : this.settings.width / 2 - 4, v = Math.max(u.span[0] - g, h.x - r), p = Math.min(u.span[1] + g, h.x + r);
        return p < v ? void 0 : {
          from: t,
          to: u,
          kind: e ? "jump" : l ? "drop" : "walk",
          direction: i,
          ticks: c,
          takeoff: [s - r / 2, s + r / 2],
          landing: [v, p]
        };
      }
      if (l || f.x === h.x) return;
    }
  }
  route(t, s, i, e) {
    const n = /* @__PURE__ */ new Set([t]), r = /* @__PURE__ */ new Map([[t, 0]]), h = /* @__PURE__ */ new Map(), l = (f) => r.get(f) + Math.abs(f.platform.y - s.platform.y) / R.terminalSpeed;
    let c = 0;
    for (; n.size && (!e || e.trials > 0 && c++ < 24); ) {
      let f;
      for (const u of n)
        (!f || l(u) < l(f)) && (f = u);
      if (!f) break;
      if (f === s) {
        const u = [];
        for (let g = h.get(s); g; g = h.get(g.from)) u.push(g);
        return u.reverse();
      }
      n.delete(f);
      for (const u of this.edges(f, e)) {
        if (i.has(u)) continue;
        const g = h.get(f)?.landing ?? f.span, v = Math.abs(
          (g[0] + g[1] - u.takeoff[0] - u.takeoff[1]) / 2
        ) / this.settings.speed, p = r.get(f) + v + u.ticks * j;
        p >= (r.get(u.to) ?? 1 / 0) || (r.set(u.to, p), h.set(u.to, u), n.add(u.to));
      }
    }
    return [];
  }
}
function at(o, t, s, i) {
  let e, n, r = t() * Math.PI * 2, h = 0, l = 0;
  function c(f) {
    const u = l, g = n === void 0 ? 0 : Math.min(100, Math.max(0, f - n));
    r += Math.min(50, g) / 350, h += g / 1e3;
    const v = Math.min(8, Math.floor((h + 1e-12) / j));
    for (let p = 0; p < v; p++)
      if (i?.(), u !== l) return;
    h = Math.max(0, h - v * j) % j, n = f, s(r), e = o.request(c);
  }
  return {
    resume() {
      e === void 0 && (s(r), e = o.request(c));
    },
    resetTime() {
      n = void 0, h = 0;
    },
    pause() {
      l++, e !== void 0 && o.cancel(e), e = void 0, n = void 0, h = 0;
    }
  };
}
function G(o, [t, s]) {
  return o.flatMap(([i, e]) => {
    if (e <= t || i >= s) return [[i, e]];
    const n = [];
    return i < t && n.push([i, t]), e > s && n.push([s, e]), n;
  });
}
const K = "button,input,textarea,select,fieldset,img,video,canvas,a[href]", ht = "div,main,form,ul,ol,li,nav,section,article,header,footer,aside,figure", lt = "[data-dompet],[data-dompet-ignore],script,style,template,noscript,iframe,object,embed", ct = 30;
function J(o) {
  return o !== "transparent" && !/^(?:rgba|hsla)\([^)]*,\s*0(?:\.0+)?\)$/.test(o) && !/\/\s*0(?:\.0+)?%?\)$/.test(o);
}
function ft(o) {
  return J(o.backgroundColor) || o.backgroundImage !== "none" || parseFloat(o.borderTopWidth) > 0 && J(o.borderTopColor) || o.boxShadow !== "none";
}
function dt(o, t, s, i) {
  const e = /* @__PURE__ */ new Set(), n = Math.max(1, Math.min(12, Math.ceil(t / 150))), r = Math.max(1, Math.min(10, Math.ceil(s / 90)));
  function h(l) {
    l && e.size < 256 && l.matches(i) && e.add(l);
  }
  for (let l = 0; l < r; l++)
    for (let c = 0; c < n; c++) {
      let f = o.elementFromPoint(
        (c + 0.5) * t / n,
        (l + 0.5) * s / r
      );
      for (; f && f !== o.body && f !== o.documentElement; )
        h(f), h(f.previousElementSibling), h(f.nextElementSibling), f = f.parentElement;
    }
  return [...e].sort(
    (l, c) => l.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  );
}
class ut {
  ids = /* @__PURE__ */ new WeakMap();
  next = 1;
  minimum;
  include;
  exclude;
  zoneSelector;
  zones = [];
  roots = /* @__PURE__ */ new Set();
  constructor(t) {
    if (this.minimum = t.minPlatformWidth ?? ct / 2, !Number.isFinite(this.minimum) || this.minimum <= 0)
      throw new RangeError("minPlatformWidth must be positive and finite");
    this.include = (t.include ?? []).join(","), this.zoneSelector = (t.exclusionZones ?? []).join(","), this.exclude = [
      lt,
      ...t.exclude ?? [],
      ...t.exclusionZones ?? []
    ].join(",");
  }
  scan(t, s = 0) {
    const i = Math.max(this.minimum, s);
    this.roots = /* @__PURE__ */ new Set([t.documentElement, t.body]), this.zones = this.zoneSelector ? Array.from(t.querySelectorAll(this.zoneSelector)).flatMap((d) => {
      this.roots.add(d);
      const a = d.getBoundingClientRect();
      return a.width && a.height && getComputedStyle(d).visibility === "visible" ? [a] : [];
    }) : [];
    const e = t.defaultView, n = t.documentElement.clientWidth, r = t.documentElement.clientHeight, h = [], l = {}, c = (d) => {
      l[d] = (l[d] ?? 0) + 1;
    }, f = /* @__PURE__ */ new Map(), u = (d) => {
      let a = f.get(d);
      return a || (a = e.getComputedStyle(d), f.set(d, a)), a;
    };
    t.documentElement.matches(this.exclude);
    const g = [K, ht, this.include].filter(Boolean).join(","), v = t.body.querySelectorAll(g), p = v.length > 2048 ? dt(t, n, r, g) : v, M = /* @__PURE__ */ new Map();
    function x(d) {
      let a = M.get(d);
      return a || (a = d.getBoundingClientRect(), M.set(d, a)), a;
    }
    p.length < v.length && (l["outside shortlist"] = v.length - p.length);
    for (const d of Array.from(p)) {
      const a = x(d);
      if (a.bottom <= 0 || a.top >= r || a.right <= 0 || a.left >= n) {
        c("offscreen");
        continue;
      }
      if (h.length >= 128) {
        c("platform limit");
        continue;
      }
      if (d.closest(this.exclude)) {
        c("excluded");
        continue;
      }
      const L = u(d);
      if (!d.isConnected || !a.height || !a.width || L.visibility !== "visible") {
        c("hidden");
        continue;
      }
      if (!d.matches(K) && !(this.include && d.matches(this.include)) && !ft(L)) {
        c("unpainted");
        continue;
      }
      if (a.width >= n * 0.95 && a.height >= r * 0.85) {
        c("page-sized");
        continue;
      }
      const y = a.top;
      let P = Math.max(0, a.left), z = Math.min(n, a.right);
      if (y < 0 || y >= r || P >= z) {
        c("offscreen");
        continue;
      }
      const C = y + Math.min(0.5, a.height / 2, (r - y) / 2);
      let T = "";
      for (let m = d; m; m = m.parentElement) {
        const b = u(m);
        if (Number(b.opacity) === 0 || m !== d && b.contentVisibility === "hidden") {
          T = "hidden";
          break;
        }
        if (m === d || m === t.documentElement || b.overflowX === "visible" && b.overflowY === "visible")
          continue;
        this.roots.add(m);
        const Y = x(m);
        if (b.overflowY !== "visible") {
          const w = Y.top + m.clientTop;
          if (y < w || C >= w + m.clientHeight) {
            T = "clipped";
            break;
          }
        }
        if (b.overflowX !== "visible") {
          const w = Y.left + m.clientLeft;
          P = Math.max(P, w), z = Math.min(z, w + m.clientWidth);
        }
      }
      if (T) {
        c(T);
        continue;
      }
      if (z - P < i) {
        c("too narrow");
        continue;
      }
      let A = [];
      const D = Math.min(
        v.length > 256 ? 3 : 64,
        Math.ceil((z - P) / Math.max(1, Math.min(8, this.minimum)))
      ), B = (z - P) / D;
      let W;
      for (let m = 0; m < D; m++) {
        const b = t.elementFromPoint(P + (m + 0.5) * B, C);
        b && d.contains(b) ? W ??= P + m * B : W !== void 0 && (A.push([W, P + m * B]), W = void 0);
      }
      if (W !== void 0 && A.push([W, z]), !A.length) {
        c("occluded");
        continue;
      }
      for (const m of this.zones)
        y >= m.top && y < m.bottom && (A = G(A, [m.left, m.right]));
      for (const m of h)
        if (Math.abs(m.y - y) <= 1)
          for (const b of m.intervals)
            A = G(A, b);
      if (A = A.filter(([m, b]) => b - m >= i), !A.length) {
        c("no usable interval");
        continue;
      }
      let X = this.ids.get(d);
      X || (X = "p" + this.next++, this.ids.set(d, X)), h.push({
        id: X,
        y,
        left: A[0][0],
        right: A[A.length - 1][1],
        originX: a.left,
        source: d,
        intervals: A
      });
    }
    return h.push({
      id: "floor",
      source: null,
      y: r,
      left: 0,
      right: n,
      intervals: [[0, n]]
    }), { platforms: h, candidates: v.length, rejected: l };
  }
}
function pt(o, t, s) {
  o.save(), o.font = "12px monospace", o.lineWidth = 2;
  for (const n of t.platforms) {
    const r = n.source ? n.y : n.y - 1;
    o.fillStyle = o.strokeStyle = "#ad205b";
    for (const [h, l] of n.intervals)
      o.beginPath(), o.moveTo(h, r), o.lineTo(l, r), o.stroke(), o.fillText(n.id, h + 2, r > 14 ? r - 3 : r + 13);
  }
  const i = [
    t.candidates + " candidates · " + t.platforms.length + " platforms (incl. floor)",
    `scan ${s.scanMs.toFixed(1)} ms · frame ${s.frameMs.toFixed(1)} ms`,
    `graph ${s.graphNodes} nodes / ${s.graphEdges} edges · ${s.replans} plans`,
    ...Object.entries(t.rejected).map(([n, r]) => n + " " + r)
  ], e = Math.max(...i.map((n) => o.measureText(n).width)) + 12;
  o.fillStyle = "#202821", o.fillRect(6, 16, e, i.length * 16 + 8), o.fillStyle = "white", i.forEach((n, r) => o.fillText(n, 12, 32 + r * 16)), o.restore();
}
const Q = /* @__PURE__ */ new WeakMap();
class mt {
  #d;
  get debugMetrics() {
    return this.#d ? { ...this.#d } : void 0;
  }
  #o;
  #u = new EventTarget();
  #M = "new";
  #b = !1;
  #p = !1;
  #P;
  #a;
  #h;
  #x;
  get state() {
    return this.#M;
  }
  on(t, s) {
    if (this.#v) return () => {
    };
    const i = (e) => s(e.detail);
    return this.#u.addEventListener(t, i), () => this.#u.removeEventListener(t, i);
  }
  #m(t, s) {
    this.#u.dispatchEvent(new CustomEvent(t, { detail: s }));
  }
  #j(t) {
    const s = this.#M;
    s !== t && (this.#M = t, this.#m("statechange", { previous: s, state: t }));
  }
  #t() {
    if (!this.#s || !this.#i) return;
    const t = this.#b || this.#c;
    t ? this.#i.style.setProperty("visibility", "hidden", "important") : this.#i.style.removeProperty("visibility"), t || this.#p || this.#y ? this.#s.pause() : this.#s.resume(), this.#j(
      t ? "hidden" : this.#y || this.#p ? "paused" : "running"
    );
  }
  hide() {
    this.#b = !0, this.#t();
  }
  show() {
    this.#b = !1, this.#t();
  }
  #i;
  #s;
  #g;
  #v = !1;
  #A;
  #n;
  #w;
  #l;
  #E;
  #e = !1;
  #y = !1;
  #c = !1;
  debugExplore() {
    this.#n && (this.#e = !1, this.#r = { direction: 0, jump: !1 }, this.#f?.());
  }
  #f;
  #r = { direction: 0, jump: !1 };
  #R;
  debugMove(t) {
    this.#n && (this.#e = !0, this.#r.direction = t);
  }
  debugJump() {
    this.#n && (this.#e = !0, this.#r.jump = !0);
  }
  debugReset() {
    this.#n && (this.#e = !0, this.#R?.());
  }
  #k;
  get debugState() {
    return this.#n ? this.#k?.() : void 0;
  }
  #S;
  constructor(t = {}) {
    if (t.character !== void 0 && t.character !== "cat")
      throw new TypeError("character must be cat");
    for (const s of ["debug", "respectReducedMotion"])
      if (t[s] !== void 0 && typeof t[s] != "boolean")
        throw new TypeError(s + " must be boolean");
    for (const s of ["speed", "gravity"])
      if (t[s] !== void 0 && (!Number.isFinite(t[s]) || t[s] <= 0))
        throw new RangeError(s + " must be positive and finite");
    if (this.#a = {
      ...R,
      speed: R.speed * (t.speed ?? 1),
      gravity: t.gravity ?? R.gravity
    }, !Number.isFinite(this.#a.speed))
      throw new RangeError("speed exceeds supported range");
    if (this.#P = t.respectReducedMotion ?? !0, this.#h = t.zIndex ?? 2147483646, !Number.isInteger(this.#h) || this.#h < -2147483648 || this.#h > 2147483647)
      throw new RangeError("zIndex must be a signed 32-bit integer");
    this.#x = [];
    for (const s of ["include", "exclude", "exclusionZones"]) {
      const i = t[s];
      if (i !== void 0) {
        if (!Array.isArray(i) || i.some((e) => typeof e != "string" || !e.trim()))
          throw new TypeError(s + " must contain nonempty CSS selectors");
        this.#x.push(...i);
      }
    }
    if (this.#w = t.renderer ?? "auto", !["auto", "sprite", "webgl"].includes(this.#w))
      throw new TypeError("Invalid renderer");
    if (this.#l = t.size, this.#l !== void 0 && (!Number.isFinite(this.#l) || this.#l <= 0))
      throw new RangeError("size must be positive and finite");
    this.#A = new ut(t), this.#n = t.debug ?? !1;
  }
  refresh() {
    this.#S?.();
  }
  start() {
    if (!(this.#i || this.#v))
      try {
        if (typeof document > "u" || !document.body)
          throw new Error("DOMPet.start requires a document body");
        if (Q.has(document))
          throw new Error("A DOMPet is already active in this document");
        for (const t of this.#x) document.body.matches(t);
        this.#o = document, Q.set(document, this), this.#C();
      } catch (t) {
        const s = t instanceof Error ? t : new Error(String(t));
        throw this.#o && this.#z(), this.#m("error", s), s;
      }
  }
  #C() {
    const t = document.createElement("div");
    t.dataset.dompet = "", t.setAttribute("aria-hidden", "true"), t.inert = !0, t.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;display:block!important;pointer-events:none!important", t.style.setProperty("z-index", String(this.#h), "important");
    const s = document.createElement("canvas");
    s.style.cssText = "display:block;width:100%;height:100%;pointer-events:none", t.attachShadow({ mode: "open" }).append(s);
    const i = s.getContext("2d");
    if (!i) throw new Error("DOMPet requires a 2D canvas");
    let e = { platforms: [], candidates: 0, rejected: {} };
    const n = this.#A, r = this.#d = this.#n ? {
      scanMs: 0,
      refreshMs: 0,
      frameMs: 0,
      renderMs: 0,
      physicsMs: 0,
      navigationMs: 0,
      platforms: 0,
      graphNodes: 0,
      graphEdges: 0,
      replans: 0
    } : void 0;
    let h = 0, l = 0;
    document.body.append(t), this.#i = t;
    let c = 0, f = 0, u = 1;
    const g = this.#l, v = this.#a;
    let p = g ?? 112, M = new U();
    const x = () => ({ width: c, height: f });
    let d = !0, a = V({ width: t.clientWidth, height: t.clientHeight }), L, y;
    const P = nt(
      B,
      () => this.#m(
        "error",
        new Error("Cat sprite unavailable; drawing fallback")
      )
    ), z = new AbortController();
    let C, T = !1;
    const A = () => {
      C?.dispose(), C = void 0, t.dataset.renderer = "sprite", B();
    };
    t.dataset.renderer = this.#w === "sprite" ? "sprite" : "loading", this.#w !== "sprite" && import("./chunks/scene-C1PpzIyK.js").then(async ({ scene: w }) => {
      if (T) return;
      const F = await w(
        t.shadowRoot,
        A,
        z.signal
      );
      if (T) {
        F.dispose();
        return;
      }
      C = F, t.dataset.renderer = "webgl", B();
    }).catch(() => {
      T || A();
    }), this.#E = () => {
      T = !0, z.abort(), C?.dispose(), P.dispose();
    }, this.#f = () => {
      L = new ot(e.platforms, x(), this.#a), y = new rt(L), r && (r.graphNodes = L.surfaces.length, r.graphEdges = 0);
    }, this.#k = () => ({
      ...a,
      behaviour: this.#e ? "manual" : y.state
    }), this.#R = () => {
      this.#r = { direction: 0, jump: !1 }, a = V(x(), v), M = new U(), B();
    };
    let D;
    function B() {
      if (!i || document.hidden) return;
      const w = r ? performance.now() : 0;
      b.checkRoute(), r ? i.clearRect(0, 0, c, f) : D && i.clearRect(...D), D = void 0, r && pt(i, e, r);
      const F = a.x - p / 2, Z = a.y - p * S.anchorY / S.width, I = !n.zones.some(
        (E) => F < E.right && F + p > E.left && Z < E.bottom && a.y > E.top
      );
      if (C && I) {
        const E = e.platforms.filter(
          (k) => k.y >= a.y && k.y - a.y < p * 0.7 && k.intervals.some(([N, q]) => a.x >= N && a.x <= q)
        ).sort((k, N) => k.y - N.y)[0];
        if (E) {
          const k = E.intervals.find(
            ([N, q]) => a.x >= N && a.x <= q
          );
          D = [a.x - p * 0.22 - 2, E.y - 4, p * 0.44 + 4, 8], i.save(), i.beginPath(), i.rect(k[0], E.y - 2, k[1] - k[0], 5), i.clip(), i.fillStyle = `rgba(45,32,28,${0.23 * Math.max(0, 1 - (E.y - a.y) / (p * 0.7))})`, i.beginPath(), i.ellipse(a.x, E.y, p * 0.22, 2, 0, 0, Math.PI * 2), i.fill(), i.restore();
        }
      }
      C ? C.draw(
        a,
        M,
        p,
        u,
        I,
        r ? i : void 0
      ) : I && (P.draw(i, M, a, p, u), D = [F - 2, Z - 2, p + 4, p + 4]), r && (r.physicsMs = h, r.navigationMs = l, r.renderMs = performance.now() - w, r.frameMs = h + l + r.renderMs, h = 0, l = 0);
    }
    function W() {
      c === t.clientWidth && f === t.clientHeight && u === (window.devicePixelRatio || 1) || (c = t.clientWidth, f = t.clientHeight, u = window.devicePixelRatio || 1, p = Math.min(c, f, g ?? (c <= 600 ? 88 : 112)), v.fullFootprint = !0, v.width = p * 0.43, v.height = p * 0.56, d && (a = V(x(), v), d = !1), s.width = Math.round(c * u), s.height = Math.round(f * u), i?.setTransform(u, 0, 0, u, 0, 0));
    }
    this.#g = new AbortController();
    const X = this.#g.signal, m = () => {
      this.#c = !0, this.#t();
    }, b = _(
      () => {
        if (!document.body) return;
        if (t.isConnected || document.body.append(t), tt()) {
          this.#c || m();
          return;
        }
        const w = r ? performance.now() : 0, F = this.#c;
        this.#c = !1;
        const Z = c, I = f;
        W();
        const E = r ? performance.now() : 0, k = n.scan(document, v.width);
        r && (r.scanMs = performance.now() - E, r.platforms = k.platforms.length);
        const N = c !== Z || f !== I || !it(e.platforms, k.platforms);
        a = et(a, e.platforms, k.platforms, x(), v), e = k;
        for (const q of e.platforms)
          q.source && n.roots.add(q.source);
        b.track(n.roots), (N || !y) && this.#f?.(), B(), r && (r.refreshMs = performance.now() - w), F && this.#t();
      },
      m,
      X
    );
    this.#S = b.flush;
    function Y() {
      window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`
      ).addEventListener(
        "change",
        () => {
          b.flush(), Y();
        },
        { once: !0, signal: X }
      );
    }
    if (Y(), this.#P) {
      const w = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.#p = w.matches, w.addEventListener(
        "change",
        () => {
          this.#p = w.matches, this.#t();
        },
        { signal: X }
      );
    }
    this.#f(), document.hidden ? m() : b.flush(), this.#s = at(
      {
        request: (w) => window.requestAnimationFrame(w),
        cancel: (w) => window.cancelAnimationFrame(w)
      },
      Math.random,
      B,
      () => {
        const w = r ? performance.now() : 0, F = y.plans, Z = this.#e ? this.#r : y.intent(a), I = r ? performance.now() : 0;
        r && (l += I - w, r.replans += y.plans - F, r.graphEdges = L.edgeCount);
        const E = a.support !== null;
        a = $(a, Z, e.platforms, x(), this.#a), M.update(
          a,
          E,
          this.#e ? "manual" : y.state,
          j * 1e3,
          this.#e ? 0 : y.lookPitch(a)
        ), r && (h += performance.now() - I), this.#r.jump = !1, !E && a.support && this.#m("landing", {
          platformId: a.support,
          x: a.x,
          y: a.y
        });
      }
    ), this.#t();
  }
  pause() {
    this.#s && (this.#y = !0, this.#t());
  }
  resume() {
    this.#y = !1, this.#t();
  }
  #z() {
    this.#s?.pause(), this.#o && Q.delete(this.#o), this.#o = void 0, this.#g?.abort(), this.#A.roots.clear(), this.#d = void 0, this.#E?.(), this.#E = void 0, this.#i?.remove(), this.#R = void 0, this.#k = void 0, this.#f = void 0, this.#S = void 0, this.#s = void 0, this.#g = void 0, this.#i = void 0;
  }
  destroy() {
    this.#v || (this.#v = !0, this.#z(), this.#j("destroyed"), this.#u = new EventTarget());
  }
}
export {
  mt as DOMPet
};
