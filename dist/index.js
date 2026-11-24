function Y(o, t, i) {
  let s, e, n = 0, r = location.href;
  function a() {
    s !== void 0 && cancelAnimationFrame(s), clearTimeout(e), s = e = void 0;
  }
  function c() {
    a(), !(document.hidden || i.aborted) && (r = location.href, o(), performance.now() < n && (e = window.setTimeout(f, 64)));
  }
  function f() {
    s === void 0 && !document.hidden && !i.aborted && (s = requestAnimationFrame(c));
  }
  const h = { signal: i, capture: !0, passive: !0 };
  for (const v of [
    "resize",
    "orientationchange",
    "scroll",
    "popstate",
    "hashchange",
    "pageshow"
  ])
    window.addEventListener(v, f, h);
  window.visualViewport?.addEventListener("resize", f, h), window.visualViewport?.addEventListener("scroll", f, h), window.navigation?.addEventListener("currententrychange", f, h), document.addEventListener(
    "visibilitychange",
    () => {
      a(), n = 0, document.hidden ? t() : c();
    },
    h
  );
  function g(v) {
    v.target instanceof Element && v.target.closest("[data-dompet]") || ((v.type.endsWith("start") || v.type === "transitionrun") && (n = performance.now() + 1500), f());
  }
  for (const v of [
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
    document.addEventListener(v, g, h);
  const b = new MutationObserver((v) => {
    v.some(
      (m) => !(m.target instanceof Element && m.target.closest("[data-dompet]"))
    ) && f();
  });
  b.observe(document.documentElement, {
    subtree: !0,
    childList: !0,
    characterData: !0,
    attributes: !0
  });
  const w = new ResizeObserver(f);
  let l = /* @__PURE__ */ new Set();
  function u(v) {
    for (const m of l) v.has(m) || w.unobserve(m);
    for (const m of v) l.has(m) || w.observe(m);
    l = v;
  }
  return i.addEventListener(
    "abort",
    () => {
      a(), b.disconnect(), w.disconnect(), l.clear();
    },
    { once: !0 }
  ), {
    flush: c,
    track: u,
    checkRoute() {
      r !== location.href && f();
    }
  };
}
function V() {
  return document.querySelector("dialog:modal") ? !0 : Array.from(document.querySelectorAll('[aria-modal="true"]')).some(
    (o) => !o.closest('[hidden],[aria-hidden="true"]') && o.getClientRects().length > 0 && getComputedStyle(o).visibility === "visible"
  );
}
const k = 1 / 120, y = {
  width: 30,
  height: 22,
  speed: 180,
  gravity: 1200,
  jumpSpeed: 480,
  terminalSpeed: 800
};
function X(o) {
  return {
    x: Math.min(
      o.width / 2,
      Math.max(y.width / 2, o.width * 0.4)
    ),
    y: Math.min(o.height, y.height),
    vx: 0,
    vy: 0,
    support: null
  };
}
function D(o, t, i) {
  const s = Math.min(y.width, i) / 2;
  return o.intervals.some(
    ([e, n]) => Math.min(n, t + s) - Math.max(e, t - s) >= Math.min(4, s * 2) && n > e
  );
}
function H(o, t, i, s, e = y) {
  const { width: n, height: r } = s;
  if (!Number.isFinite(n) || !Number.isFinite(r) || n <= 0 || r <= 0)
    return { x: 0, y: 0, vx: 0, vy: 0, support: null };
  if (![o.x, o.y, o.vx, o.vy].every(Number.isFinite) || o.y > r || o.y < 0 || o.x < 0 || o.x > n)
    return X(s);
  const a = Math.min(n, y.width) / 2, c = o.x + t.direction * e.speed * k, f = (m) => Math.max(a, Math.min(n - a, m)), h = f(c), d = h === c ? t.direction * e.speed : 0, g = i.find(
    (m) => m.id === o.support && m.y === o.y && D(m, o.x, n)
  );
  if (g && !t.jump && D(g, h, n))
    return { x: h, y: g.y, vx: d, vy: 0, support: g.id };
  const b = g && t.jump ? -y.jumpSpeed : o.vy;
  let w = Math.min(
    y.terminalSpeed,
    b + e.gravity * k
  ), l = o.y + w * k, u;
  if (w > 0)
    for (const m of i) {
      if (m.y < o.y || m.y > l || m.y < Math.min(r, y.height) || m.y > r || u && m.y >= u.y)
        continue;
      const E = (m.y - o.y) / (l - o.y), j = f(o.x + (c - o.x) * E);
      D(m, j, n) && (m.y !== o.y || D(m, h, n)) && (u = m);
    }
  if (u)
    return {
      x: h,
      y: u.y,
      vx: d,
      vy: 0,
      support: D(u, h, n) ? u.id : null
    };
  const v = Math.min(r, y.height);
  return l < v && (l = v, w = 0), l > r ? X(s) : { x: h, y: l, vx: d, vy: w, support: null };
}
function Q(o, t, i, s) {
  if (!o.support) return o;
  const e = t.find((r) => r.id === o.support), n = i.find((r) => r.id === o.support);
  if (e && n && n.y >= Math.min(s.height, y.height)) {
    const r = Math.min(s.width, y.width) / 2, a = o.x + (n.originX ?? n.left) - (e.originX ?? e.left);
    if (a >= r && a <= s.width - r && D(n, a, s.width))
      return { ...o, x: a, y: n.y };
  }
  return { ...o, support: null, vy: 0 };
}
function G(o, t) {
  return o.length === t.length && o.every((i, s) => {
    const e = t[s];
    return i.id === e.id && i.y === e.y && i.intervals.length === e.intervals.length && i.intervals.every(
      ([n, r], a) => n === e.intervals[a][0] && r === e.intervals[a][1]
    );
  });
}
const U = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAAYCAYAAAAiYi5VAAAEZklEQVR42u1bO64UMRB8Z3oZARESNyDlHGSQQcBFIEfiBhyDCIlbLPLqeWU1/rvsmhlXSdbTzpudcrXb7p629+lJEARBEARBEARBEARBEARBEARBEARBEARBEARBEARB2Bdvnl/fEPeclV/QBNjaAbUAyP/kgxh+d09rP39/eZv9jvufu6dFS0sf0PyC8MScAGdbfNj6Zf+99V/FB909tz8/7q01AP79+vnmA6dt7n+12nv6gORX8rf5m2yPodgOiFp82Ppl/731j/aBbYNR/t4A/O3dq9vt5/tHi32eGYBR/L3+jwyAR6hAbBt8e5x/xgTocQDW5Efpl/331j8KpA0Y/H6RbrW//16O27VSkOjtA4p/xP+RCTC7AqEA3Gh89ARgZcBs/bL/3vpH5y7KBix+d919x7XR8U+1mvFv7QOKfzQAoypwZ/T/S5WfU9lfbGBnTIBWB0AGQKZ+2X9v/a3zM3wW0gYs/tHxd80HTjsW/lrNWyKTP6d/ZQmcUQEYmReo8js9AKeyP+9AoaN5h0I5YMkBVgRAhH7LGV5bwb+7/c+qv5gYZPQjbcDiR4y/v3bndYnUy1+fWM32v1n8KytAORuw/P/I+8/QBCB0qNDA4cD6bCocWIQD5hxg9QI8qv/xJhXor8kqZf+99eeCX04/Kgiw+XvH/3HtpXoRNld+ra1qHJF/dQUoVeFg+X9J/6r95xw/LAGwC5AdXO9osYwL6YDWwVgLMEO/7L+v/tLbTUo/0gZM/t7x93aP8d+DRaXuo/EzEmDLz/T/Gv0r9p9z/PAEwGZh1uAxo3vjsiYAcvFh6pf9pd8mAi360T7I4B8Zf9eeP364t0+/vt+b/7xi/ZvBvzoAWn6G/9dWYFbsP5fsD08A7CIUGj10uLCF2RJzAqAWH7Z+2X8v/TZr9s9u1T9ig1gfVvLHfKCHH3kehsFv/Z+RAMfm36r531KBmb3/3MMPSQDC7DccEN+s84X3oh2wdgL4+0cnP1u/7L+XfnvyOgx8obaZ+lN9WMVf8xa+E39vBQIVAGP8jPlf0o86AFtag0r80w6gperasX0yW7ZDbLj3LMAIfrZ+2X8f/Tb4hc9ZpX+kDzP9v8YHrszPCoCxebBq/sd8MacfdQA21ocS/8wE4L/X8FyWd9UAyNZ/FvvXnOK8qv7YgZmeAJizqT2Va9+OR/lLJ2DDN+IYnz20M2v8aw5wzeRv3b5Al6RXJ8CMBMQG4JL+WYcPbRKQ4p+RACQdMCUmVcJCTwDxc/hrnmv7eXb9uZ+DhFy5Po0uREz+VPCP7bvHrq0OwjOCz1H8vyYAXmX9aan+2DMLqP3nFt6ZB9CSGUnpN2rIwwni5/PXPDfWT+QCuFp/6jkt1YDh059E/pzt7eJfCghoH8j5Kfpg1K7+z+KPHUJLlX/tVgmq/G6rKTX86ANoVeUxxP3iPzZ/7XNZvLP6Mfqcs39/5BmsOTDLB3f0fyZ/6xmIFfO/xI/efxcEQRAEKmLVlqvw/wMbWRlA+DAfaAAAAABJRU5ErkJggg==", R = {
  width: 32,
  height: 24,
  anchorY: 23,
  size: 32,
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
class O {
  clip = "fall";
  facing = R.facing;
  elapsed = 0;
  update(t, i, s, e) {
    t.vx && (this.facing = t.vx < 0 ? -1 : 1);
    let n;
    t.support ? !i || this.clip === "land" && this.elapsed < R.clips.land.durations.reduce((r, a) => r + a, 0) ? n = "land" : t.vx ? n = "walk" : n = s === "sleep" ? "sleep" : "idle" : n = t.vy < 0 ? "jump" : "fall", n !== this.clip ? (this.clip = n, this.elapsed = 0) : this.elapsed += e;
  }
  get frame() {
    const t = R.clips[this.clip], i = t.durations.reduce((e, n) => e + n, 0);
    let s = t.loop ? this.elapsed % i : this.elapsed;
    for (let e = 0; e < t.durations.length - 1; e++) {
      if (s < t.durations[e]) return t.first + e;
      s -= t.durations[e];
    }
    return t.first + t.durations.length - 1;
  }
}
function K(o, t) {
  const i = new Image();
  let s = !1;
  return i.onload = () => {
    s = i.naturalWidth === 15 * R.width && i.naturalHeight === R.height, o(), s || t();
  }, i.onerror = () => {
    s = !1, o(), t();
  }, i.src = U, {
    draw(e, n, r, a, c) {
      const f = a / R.width;
      e.save(), e.translate(
        Math.round(r.x * c) / c,
        Math.round(r.y * c) / c
      ), e.scale(n.facing * f, f), e.imageSmoothingEnabled = !1, s ? e.drawImage(
        i,
        n.frame * R.width,
        0,
        R.width,
        R.height,
        -16,
        -23,
        R.width,
        R.height
      ) : (e.fillStyle = "#43323d", e.fillRect(-12, -16, 24, 16), e.fillRect(-10, -21, 5, 6), e.fillRect(5, -21, 5, 6), e.fillStyle = "#ffe5b5", e.fillRect(-5, -10, 3, 3), e.fillRect(5, -10, 3, 3)), e.restore();
    },
    dispose() {
      i.onload = null, i.onerror = null;
    }
  };
}
const C = { direction: 0, jump: !1 };
class J {
  constructor(t, i = Math.random) {
    this.graph = t, this.random = i;
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
  rest() {
    this.state = this.random() < 0.18 ? "sleep" : "idle", this.wait = Math.round(
      (this.state === "sleep" ? 260 : 45) + this.random() * 140
    );
  }
  fail(t) {
    const i = t.from.key + ">" + t.to.key, s = (this.failures.get(i) ?? 0) + 1;
    if (this.failures.set(i, s), this.blocked.add(t), s >= 2)
      for (const e of this.graph.edges(t.from))
        e.to === t.to && this.blocked.add(e);
    this.path = [], this.launched = 0, this.previousDistance = 1 / 0, this.state = "recover", this.wait = 45;
  }
  plan(t, i) {
    this.targets.length || (this.plans++, this.targets = this.graph.surfaces.filter((a) => a !== t).map((a) => ({
      s: a,
      rank: (this.visits.get(a.key) ?? 0) + this.random()
    })).sort((a, c) => a.rank - c.rank).slice(0, 8).map((a) => a.s));
    const s = { trials: 6 };
    for (; this.targets.length; ) {
      const a = this.graph.route(
        t,
        this.targets[0],
        this.blocked,
        s
      );
      if (a.length) {
        this.path = a, this.targets = [];
        return;
      }
      if (!s.trials) return;
      this.targets.shift();
    }
    const [e, n] = t.span, r = e + this.random() * (n - e);
    Math.abs(r - i.x) > 4 ? this.stroll = r : this.rest();
  }
  intent(t) {
    const i = this.graph.locate(t);
    let s = this.path[0];
    if (s && this.launched)
      if (i === s.to)
        this.visits.set(i.key, (this.visits.get(i.key) ?? 0) + 1), this.path.shift(), this.launched = 0, this.path.length || this.rest();
      else return t.support && i !== s.from || this.launched > s.ticks + 12 ? (this.fail(s), C) : (this.launched++, this.state = t.support ? "walk" : t.vy < 0 ? "jump" : "fall", { direction: s.direction, jump: !1 });
    if (!i)
      return this.state = t.vy < 0 ? "jump" : "fall", C;
    if (this.wait > 0)
      return this.wait--, (this.state === "fall" || this.state === "jump") && (this.state = "idle"), C;
    if (!this.path.length && this.stroll === void 0 && this.plan(i, t), s = this.path[0], !s && this.stroll === void 0) return C;
    if (s && s.from !== i)
      return this.fail(s), C;
    const e = s ? (s.takeoff[0] + s.takeoff[1]) / 2 : this.stroll, n = Math.abs(e - t.x);
    return n > this.graph.settings.speed * k / 2 + 1e-7 ? n >= this.previousDistance ? (s ? this.fail(s) : (this.stroll = void 0, this.rest()), this.previousDistance = 1 / 0, C) : (this.previousDistance = n, this.state = "walk", { direction: e > t.x ? 1 : -1, jump: !1 }) : (this.previousDistance = 1 / 0, s ? s.kind === "jump" && this.state !== "prepare-jump" ? (this.state = "prepare-jump", this.wait = 12, C) : (this.launched = 1, this.state = s.kind === "jump" ? "jump" : "walk", { direction: s.direction, jump: s.kind === "jump" }) : (this.stroll = void 0, this.rest(), C));
  }
}
class $ {
  constructor(t, i, s = y) {
    this.bounds = i, this.settings = s;
    const e = Math.min(y.width, i.width) / 2;
    for (const n of t) {
      if (n.y < Math.min(y.height, i.height) || n.y > i.height)
        continue;
      const r = Math.floor(
        (n.y - y.terminalSpeed * k) / 64
      ), a = Math.floor(n.y / 64);
      for (let f = r; f <= a; f++) {
        const h = this.rows.get(f) ?? [];
        h.push(n), this.rows.set(f, h);
      }
      const c = [];
      for (const [f, [h, d]] of n.intervals.entries()) {
        const g = [
          Math.max(h, e),
          Math.min(d, i.width - e)
        ];
        g[0] > g[1] || c.push({ platform: n, key: n.id + "/" + f, span: g });
      }
      this.surfaces.push(...c), this.byPlatform.set(n.id, c);
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
    let i, s = 1 / 0;
    for (const e of this.byPlatform.get(t.support) ?? []) {
      const n = Math.max(0, e.span[0] - t.x, t.x - e.span[1]);
      n < s && n <= y.width / 2 && (i = e, s = n);
    }
    return i;
  }
  edges(t, i) {
    const s = this.cache.get(t);
    if (s) return s;
    let e = this.jobs.get(t);
    for (e || (e = { trials: this.transitions(t), found: [] }, this.jobs.set(t, e)); !i || i.trials > 0; ) {
      i && i.trials--;
      const n = e.trials.next();
      if (n.done)
        return this.jobs.delete(t), this.cache.set(t, e.found), this.edgeCount += e.found.length, e.found;
      n.value && e.found.push(n.value);
    }
    return [];
  }
  *transitions(t) {
    const i = Math.min(
      1200,
      Math.ceil(
        (2 + (y.jumpSpeed + y.terminalSpeed) / this.settings.gravity + this.bounds.height / y.terminalSpeed) / k
      )
    ), [s, e] = t.span, n = Math.min(24, Math.max(1, Math.ceil((e - s) / 36)));
    for (let r = 0; r <= n; r++) {
      const a = s + (e - s) * r / n;
      for (const c of [-1, 0, 1])
        yield this.trace(t, a, c, !0, i), (r === 0 && c === -1 || r === n && c === 1) && (yield this.trace(t, a, c, !1, i));
    }
  }
  trace(t, i, s, e, n) {
    const r = this.settings.speed * k;
    let a = {
      x: i,
      y: t.platform.y,
      vx: 0,
      vy: 0,
      support: t.platform.id
    }, c = !1;
    for (let f = 1; f <= n; f++) {
      const h = a;
      if (a = H(
        a,
        { direction: s, jump: e && f === 1 },
        this.rows.get(Math.floor(a.y / 64)) ?? [],
        this.bounds,
        this.settings
      ), !a.support) {
        c = !0;
        continue;
      }
      const d = this.locate(a);
      if (d !== t) {
        if (!d) return;
        const g = e || c ? 0 : y.width / 2 - 4, b = Math.max(d.span[0] - g, a.x - r), w = Math.min(d.span[1] + g, a.x + r);
        return w < b ? void 0 : {
          from: t,
          to: d,
          kind: e ? "jump" : c ? "drop" : "walk",
          direction: s,
          ticks: f,
          takeoff: [i - r / 2, i + r / 2],
          landing: [b, w]
        };
      }
      if (c || h.x === a.x) return;
    }
  }
  route(t, i, s, e) {
    const n = /* @__PURE__ */ new Set([t]), r = /* @__PURE__ */ new Map([[t, 0]]), a = /* @__PURE__ */ new Map(), c = (h) => r.get(h) + Math.abs(h.platform.y - i.platform.y) / y.terminalSpeed;
    let f = 0;
    for (; n.size && (!e || e.trials > 0 && f++ < 24); ) {
      let h;
      for (const d of n)
        (!h || c(d) < c(h)) && (h = d);
      if (!h) break;
      if (h === i) {
        const d = [];
        for (let g = a.get(i); g; g = a.get(g.from)) d.push(g);
        return d.reverse();
      }
      n.delete(h);
      for (const d of this.edges(h, e)) {
        if (s.has(d)) continue;
        const g = a.get(h)?.landing ?? h.span, b = Math.abs(
          (g[0] + g[1] - d.takeoff[0] - d.takeoff[1]) / 2
        ) / this.settings.speed, w = r.get(h) + b + d.ticks * k;
        w >= (r.get(d.to) ?? 1 / 0) || (r.set(d.to, w), a.set(d.to, d), n.add(d.to));
      }
    }
    return [];
  }
}
function _(o, t, i, s) {
  let e, n, r = t() * Math.PI * 2, a = 0, c = 0;
  function f(h) {
    const d = c, g = n === void 0 ? 0 : Math.min(100, Math.max(0, h - n));
    r += Math.min(50, g) / 350, a += g / 1e3;
    const b = Math.min(8, Math.floor((a + 1e-12) / k));
    for (let w = 0; w < b; w++)
      if (s?.(), d !== c) return;
    a = Math.max(0, a - b * k) % k, n = h, i(r), e = o.request(f);
  }
  return {
    resume() {
      e === void 0 && (i(r), e = o.request(f));
    },
    resetTime() {
      n = void 0, a = 0;
    },
    pause() {
      c++, e !== void 0 && o.cancel(e), e = void 0, n = void 0, a = 0;
    }
  };
}
function N(o, [t, i]) {
  return o.flatMap(([s, e]) => {
    if (e <= t || s >= i) return [[s, e]];
    const n = [];
    return s < t && n.push([s, t]), e > i && n.push([i, e]), n;
  });
}
const Z = "button,input,textarea,select,fieldset,img,video,canvas,a[href]", tt = "div,main,form,ul,ol,li,nav,section,article,header,footer,aside,figure", et = "[data-dompet],[data-dompet-ignore],script,style,template,noscript,iframe,object,embed", it = 30;
function q(o) {
  return o !== "transparent" && !/^(?:rgba|hsla)\([^)]*,\s*0(?:\.0+)?\)$/.test(o) && !/\/\s*0(?:\.0+)?%?\)$/.test(o);
}
function st(o) {
  return q(o.backgroundColor) || o.backgroundImage !== "none" || parseFloat(o.borderTopWidth) > 0 && q(o.borderTopColor) || o.boxShadow !== "none";
}
function nt(o, t, i, s) {
  const e = /* @__PURE__ */ new Set(), n = Math.max(1, Math.min(12, Math.ceil(t / 150))), r = Math.max(1, Math.min(10, Math.ceil(i / 90)));
  function a(c) {
    c && e.size < 256 && c.matches(s) && e.add(c);
  }
  for (let c = 0; c < r; c++)
    for (let f = 0; f < n; f++) {
      let h = o.elementFromPoint(
        (f + 0.5) * t / n,
        (c + 0.5) * i / r
      );
      for (; h && h !== o.body && h !== o.documentElement; )
        a(h), a(h.previousElementSibling), a(h.nextElementSibling), h = h.parentElement;
    }
  return [...e].sort(
    (c, f) => c.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  );
}
class rt {
  ids = /* @__PURE__ */ new WeakMap();
  next = 1;
  minimum;
  include;
  exclude;
  zoneSelector;
  zones = [];
  roots = /* @__PURE__ */ new Set();
  constructor(t) {
    if (this.minimum = t.minPlatformWidth ?? it / 2, !Number.isFinite(this.minimum) || this.minimum <= 0)
      throw new RangeError("minPlatformWidth must be positive and finite");
    this.include = (t.include ?? []).join(","), this.zoneSelector = (t.exclusionZones ?? []).join(","), this.exclude = [
      et,
      ...t.exclude ?? [],
      ...t.exclusionZones ?? []
    ].join(",");
  }
  scan(t) {
    this.roots = /* @__PURE__ */ new Set([t.documentElement, t.body]), this.zones = this.zoneSelector ? Array.from(t.querySelectorAll(this.zoneSelector)).flatMap((l) => {
      this.roots.add(l);
      const u = l.getBoundingClientRect();
      return u.width && u.height && getComputedStyle(l).visibility === "visible" ? [u] : [];
    }) : [];
    const i = t.defaultView, s = t.documentElement.clientWidth, e = t.documentElement.clientHeight, n = [], r = {}, a = (l) => {
      r[l] = (r[l] ?? 0) + 1;
    }, c = /* @__PURE__ */ new Map(), f = (l) => {
      let u = c.get(l);
      return u || (u = i.getComputedStyle(l), c.set(l, u)), u;
    };
    t.documentElement.matches(this.exclude);
    const h = [Z, tt, this.include].filter(Boolean).join(","), d = t.body.querySelectorAll(h), g = d.length > 2048 ? nt(t, s, e, h) : d, b = /* @__PURE__ */ new Map();
    function w(l) {
      let u = b.get(l);
      return u || (u = l.getBoundingClientRect(), b.set(l, u)), u;
    }
    g.length < d.length && (r["outside shortlist"] = d.length - g.length);
    for (const l of Array.from(g)) {
      const u = w(l);
      if (u.bottom <= 0 || u.top >= e || u.right <= 0 || u.left >= s) {
        a("offscreen");
        continue;
      }
      if (n.length >= 128) {
        a("platform limit");
        continue;
      }
      if (l.closest(this.exclude)) {
        a("excluded");
        continue;
      }
      const v = f(l);
      if (!l.isConnected || !u.height || !u.width || v.visibility !== "visible") {
        a("hidden");
        continue;
      }
      if (!l.matches(Z) && !(this.include && l.matches(this.include)) && !st(v)) {
        a("unpainted");
        continue;
      }
      if (u.width >= s * 0.95 && u.height >= e * 0.85) {
        a("page-sized");
        continue;
      }
      const m = u.top;
      let E = Math.max(0, u.left), j = Math.min(s, u.right);
      if (m < 0 || m >= e || E >= j) {
        a("offscreen");
        continue;
      }
      const T = m + Math.min(0.5, u.height / 2, (e - m) / 2);
      let z = "";
      for (let p = l; p; p = p.parentElement) {
        const x = f(p);
        if (Number(x.opacity) === 0 || p !== l && x.contentVisibility === "hidden") {
          z = "hidden";
          break;
        }
        if (p === l || p === t.documentElement || x.overflowX === "visible" && x.overflowY === "visible")
          continue;
        this.roots.add(p);
        const B = w(p);
        if (x.overflowY !== "visible") {
          const L = B.top + p.clientTop;
          if (m < L || T >= L + p.clientHeight) {
            z = "clipped";
            break;
          }
        }
        if (x.overflowX !== "visible") {
          const L = B.left + p.clientLeft;
          E = Math.max(E, L), j = Math.min(j, L + p.clientWidth);
        }
      }
      if (z) {
        a(z);
        continue;
      }
      if (j - E < this.minimum) {
        a("too narrow");
        continue;
      }
      let M = [];
      const W = Math.min(
        d.length > 256 ? 3 : 64,
        Math.ceil((j - E) / Math.max(1, Math.min(8, this.minimum)))
      ), A = (j - E) / W;
      let S;
      for (let p = 0; p < W; p++) {
        const x = t.elementFromPoint(E + (p + 0.5) * A, T);
        x && l.contains(x) ? S ??= E + p * A : S !== void 0 && (M.push([S, E + p * A]), S = void 0);
      }
      if (S !== void 0 && M.push([S, j]), !M.length) {
        a("occluded");
        continue;
      }
      for (const p of this.zones)
        m >= p.top && m < p.bottom && (M = N(M, [p.left, p.right]));
      for (const p of n)
        if (Math.abs(p.y - m) <= 1)
          for (const x of p.intervals)
            M = N(M, x);
      if (M = M.filter(([p, x]) => x - p >= this.minimum), !M.length) {
        a("no usable interval");
        continue;
      }
      let P = this.ids.get(l);
      P || (P = "p" + this.next++, this.ids.set(l, P)), n.push({
        id: P,
        y: m,
        left: M[0][0],
        right: M[M.length - 1][1],
        originX: u.left,
        source: l,
        intervals: M
      });
    }
    return n.push({
      id: "floor",
      source: null,
      y: e,
      left: 0,
      right: s,
      intervals: [[0, s]]
    }), { platforms: n, candidates: d.length, rejected: r };
  }
}
function ot(o, t, i) {
  o.save(), o.font = "12px monospace", o.lineWidth = 2;
  for (const n of t.platforms) {
    const r = n.source ? n.y : n.y - 1;
    o.fillStyle = o.strokeStyle = "#ad205b";
    for (const [a, c] of n.intervals)
      o.beginPath(), o.moveTo(a, r), o.lineTo(c, r), o.stroke(), o.fillText(n.id, a + 2, r > 14 ? r - 3 : r + 13);
  }
  const s = [
    t.candidates + " candidates · " + t.platforms.length + " platforms (incl. floor)",
    `scan ${i.scanMs.toFixed(1)} ms · frame ${i.frameMs.toFixed(1)} ms`,
    `graph ${i.graphNodes} nodes / ${i.graphEdges} edges · ${i.replans} plans`,
    ...Object.entries(t.rejected).map(([n, r]) => n + " " + r)
  ], e = Math.max(...s.map((n) => o.measureText(n).width)) + 12;
  o.fillStyle = "#202821", o.fillRect(6, 16, e, s.length * 16 + 8), o.fillStyle = "white", s.forEach((n, r) => o.fillText(n, 12, 32 + r * 16)), o.restore();
}
const F = /* @__PURE__ */ new WeakMap();
class at {
  #c;
  get debugMetrics() {
    return this.#c ? { ...this.#c } : void 0;
  }
  #o;
  #f = new EventTarget();
  #y = "new";
  #M = !1;
  #d = !1;
  #k;
  #u;
  #a;
  #b;
  get state() {
    return this.#y;
  }
  on(t, i) {
    if (this.#g) return () => {
    };
    const s = (e) => i(e.detail);
    return this.#f.addEventListener(t, s), () => this.#f.removeEventListener(t, s);
  }
  #p(t, i) {
    this.#f.dispatchEvent(new CustomEvent(t, { detail: i }));
  }
  #j(t) {
    const i = this.#y;
    i !== t && (this.#y = t, this.#p("statechange", { previous: i, state: t }));
  }
  #t() {
    if (!this.#i || !this.#e) return;
    const t = this.#M || this.#h;
    t ? this.#e.style.setProperty("visibility", "hidden", "important") : this.#e.style.removeProperty("visibility"), t || this.#d || this.#w ? this.#i.pause() : this.#i.resume(), this.#j(
      t ? "hidden" : this.#w || this.#d ? "paused" : "running"
    );
  }
  hide() {
    this.#M = !0, this.#t();
  }
  show() {
    this.#M = !1, this.#t();
  }
  #e;
  #i;
  #m;
  #g = !1;
  #A;
  #s;
  #v;
  #x;
  #n = !1;
  #w = !1;
  #h = !1;
  debugExplore() {
    this.#s && (this.#n = !1, this.#r = { direction: 0, jump: !1 }, this.#l?.());
  }
  #l;
  #r = { direction: 0, jump: !1 };
  #E;
  debugMove(t) {
    this.#s && (this.#n = !0, this.#r.direction = t);
  }
  debugJump() {
    this.#s && (this.#n = !0, this.#r.jump = !0);
  }
  debugReset() {
    this.#s && (this.#n = !0, this.#E?.());
  }
  #R;
  get debugState() {
    return this.#s ? this.#R?.() : void 0;
  }
  #S;
  constructor(t = {}) {
    if (t.character !== void 0 && t.character !== "cat")
      throw new TypeError("character must be cat");
    for (const i of ["debug", "respectReducedMotion"])
      if (t[i] !== void 0 && typeof t[i] != "boolean")
        throw new TypeError(i + " must be boolean");
    for (const i of ["speed", "gravity"])
      if (t[i] !== void 0 && (!Number.isFinite(t[i]) || t[i] <= 0))
        throw new RangeError(i + " must be positive and finite");
    if (this.#u = {
      ...y,
      speed: y.speed * (t.speed ?? 1),
      gravity: t.gravity ?? y.gravity
    }, !Number.isFinite(this.#u.speed))
      throw new RangeError("speed exceeds supported range");
    if (this.#k = t.respectReducedMotion ?? !0, this.#a = t.zIndex ?? 2147483646, !Number.isInteger(this.#a) || this.#a < -2147483648 || this.#a > 2147483647)
      throw new RangeError("zIndex must be a signed 32-bit integer");
    this.#b = [];
    for (const i of ["include", "exclude", "exclusionZones"]) {
      const s = t[i];
      if (s !== void 0) {
        if (!Array.isArray(s) || s.some((e) => typeof e != "string" || !e.trim()))
          throw new TypeError(i + " must contain nonempty CSS selectors");
        this.#b.push(...s);
      }
    }
    if (this.#v = t.size ?? R.size, !Number.isFinite(this.#v) || this.#v <= 0)
      throw new RangeError("size must be positive and finite");
    this.#A = new rt(t), this.#s = t.debug ?? !1;
  }
  refresh() {
    this.#S?.();
  }
  start() {
    if (!(this.#e || this.#g))
      try {
        if (typeof document > "u" || !document.body)
          throw new Error("DOMPet.start requires a document body");
        if (F.has(document))
          throw new Error("A DOMPet is already active in this document");
        for (const t of this.#b) document.body.matches(t);
        this.#o = document, F.set(document, this), this.#z();
      } catch (t) {
        const i = t instanceof Error ? t : new Error(String(t));
        throw this.#o && this.#P(), this.#p("error", i), i;
      }
  }
  #z() {
    const t = document.createElement("div");
    t.dataset.dompet = "", t.setAttribute("aria-hidden", "true"), t.inert = !0, t.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;display:block!important;pointer-events:none!important", t.style.setProperty("z-index", String(this.#a), "important");
    const i = document.createElement("canvas");
    i.style.cssText = "display:block;width:100%;height:100%;pointer-events:none", t.attachShadow({ mode: "open" }).append(i);
    const s = i.getContext("2d");
    if (!s) throw new Error("DOMPet requires a 2D canvas");
    let e = { platforms: [], candidates: 0, rejected: {} };
    const n = this.#A, r = this.#c = this.#s ? {
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
    let a = 0, c = 0;
    document.body.append(t), this.#e = t;
    let f = 0, h = 0, d = 1;
    const g = this.#v;
    let b = new O();
    const w = () => ({ width: f, height: h });
    let l = X({ width: t.clientWidth, height: t.clientHeight }), u, v;
    const m = K(
      E,
      () => this.#p(
        "error",
        new Error("Cat sprite unavailable; drawing fallback")
      )
    );
    this.#x = m.dispose, this.#l = () => {
      u = new $(e.platforms, w(), this.#u), v = new J(u), r && (r.graphNodes = u.surfaces.length, r.graphEdges = 0);
    }, this.#R = () => ({
      ...l,
      behaviour: this.#n ? "manual" : v.state
    }), this.#E = () => {
      this.#r = { direction: 0, jump: !1 }, l = X(w()), b = new O(), E();
    };
    function E() {
      if (!s || document.hidden) return;
      const A = r ? performance.now() : 0;
      M.checkRoute(), s.clearRect(0, 0, f, h), r && ot(s, e, r);
      const S = l.x - g / 2, P = l.y - g * R.anchorY / R.width;
      n.zones.some(
        (p) => S < p.right && S + g > p.left && P < p.bottom && l.y > p.top
      ) || m.draw(s, b, l, g, d), r && (r.physicsMs = a, r.navigationMs = c, r.renderMs = performance.now() - A, r.frameMs = a + c + r.renderMs, a = 0, c = 0);
    }
    function j() {
      f === t.clientWidth && h === t.clientHeight && d === (window.devicePixelRatio || 1) || (f = t.clientWidth, h = t.clientHeight, d = window.devicePixelRatio || 1, i.width = Math.round(f * d), i.height = Math.round(h * d), s?.setTransform(d, 0, 0, d, 0, 0));
    }
    this.#m = new AbortController();
    const T = this.#m.signal, z = () => {
      this.#h = !0, this.#t();
    }, M = Y(
      () => {
        if (!document.body) return;
        if (t.isConnected || document.body.append(t), V()) {
          this.#h || z();
          return;
        }
        const A = r ? performance.now() : 0, S = this.#h;
        this.#h = !1;
        const P = f, p = h;
        j();
        const x = r ? performance.now() : 0, B = n.scan(document);
        r && (r.scanMs = performance.now() - x, r.platforms = B.platforms.length);
        const L = f !== P || h !== p || !G(e.platforms, B.platforms);
        l = Q(l, e.platforms, B.platforms, w()), e = B;
        for (const I of e.platforms)
          I.source && n.roots.add(I.source);
        M.track(n.roots), (L || !v) && this.#l?.(), E(), r && (r.refreshMs = performance.now() - A), S && this.#t();
      },
      z,
      T
    );
    this.#S = M.flush;
    function W() {
      window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`
      ).addEventListener(
        "change",
        () => {
          M.flush(), W();
        },
        { once: !0, signal: T }
      );
    }
    if (W(), this.#k) {
      const A = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.#d = A.matches, A.addEventListener(
        "change",
        () => {
          this.#d = A.matches, this.#t();
        },
        { signal: T }
      );
    }
    this.#l(), document.hidden ? z() : M.flush(), this.#i = _(
      {
        request: (A) => window.requestAnimationFrame(A),
        cancel: (A) => window.cancelAnimationFrame(A)
      },
      Math.random,
      E,
      () => {
        const A = r ? performance.now() : 0, S = v.plans, P = this.#n ? this.#r : v.intent(l), p = r ? performance.now() : 0;
        r && (c += p - A, r.replans += v.plans - S, r.graphEdges = u.edgeCount);
        const x = l.support !== null;
        l = H(l, P, e.platforms, w(), this.#u), b.update(
          l,
          x,
          this.#n ? "manual" : v.state,
          k * 1e3
        ), r && (a += performance.now() - p), this.#r.jump = !1, !x && l.support && this.#p("landing", {
          platformId: l.support,
          x: l.x,
          y: l.y
        });
      }
    ), this.#t();
  }
  pause() {
    this.#i && (this.#w = !0, this.#t());
  }
  resume() {
    this.#w = !1, this.#t();
  }
  #P() {
    this.#i?.pause(), this.#o && F.delete(this.#o), this.#o = void 0, this.#m?.abort(), this.#A.roots.clear(), this.#c = void 0, this.#x?.(), this.#x = void 0, this.#e?.remove(), this.#E = void 0, this.#R = void 0, this.#l = void 0, this.#S = void 0, this.#i = void 0, this.#m = void 0, this.#e = void 0;
  }
  destroy() {
    this.#g || (this.#g = !0, this.#P(), this.#j("destroyed"), this.#f = new EventTarget());
  }
}
export {
  at as DOMPet
};
