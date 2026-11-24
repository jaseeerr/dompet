// Editable character master. +X is forward, +Y is up, Z separates the limbs.
import * as T from "three";
export function buildCat() {
  const root = new T.Group();
  const sphere = new T.SphereGeometry(1, 16, 12);
  const earGeometry = new T.ConeGeometry(1, 1, 3);
  const palette = {
    fur: 0xae8060,
    dark: 0x573c30,
    cream: 0xead6b4,
    eye: 0x9db66a,
    black: 0x221e1c,
    pink: 0xc88e82,
  };
  const materials = Object.fromEntries(
    Object.entries(palette).map(([name, color]) => [
      name,
      new T.MeshStandardMaterial({ color, roughness: 0.88 }),
    ]),
  );
  function joint(parent, name, x, y, z) {
    const g = new T.Bone();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  }
  function form(parent, name, color, x, y, z, a, b, c, geometry = sphere) {
    const m = new T.Mesh(geometry, materials[color]);
    m.name = name;
    m.position.set(x, y, z);
    m.scale.set(a, b, c);
    parent.add(m);
    return m;
  }
  const spine = joint(root, "spine", 0, 0.77, 0);
  const torsoGeo = new T.SphereGeometry(1, 64, 40);
  torsoGeo.scale(0.82, 0.38, 0.31);
  torsoGeo.translate(0.04, 0.03, 0);
  const weights = [],
    indices = [],
    colors = [];
  const positions = torsoGeo.attributes.position;
  const warm = new T.Color(0xb08a69),
    stripe = new T.Color(0x624936),
    belly = new T.Color(0xe0c5a0);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i);
    const w = T.MathUtils.smoothstep(x, -0.45, 0.45);
    indices.push(0, 1, 0, 0);
    weights.push(1 - w, w, 0, 0);
    const band = T.MathUtils.smoothstep(
      Math.cos(x * 34 + y * 3 + Math.abs(z) * 4),
      0.55,
      0.94,
    );
    const shade = warm
      .clone()
      .lerp(stripe, band * T.MathUtils.smoothstep(y, -0.18, 0.17))
      .lerp(belly, T.MathUtils.smoothstep(-y, 0.05, 0.35));
    colors.push(shade.r, shade.g, shade.b);
  }
  torsoGeo.setAttribute("skinIndex", new T.Uint16BufferAttribute(indices, 4));
  torsoGeo.setAttribute("skinWeight", new T.Float32BufferAttribute(weights, 4));
  torsoGeo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  const pelt = new T.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
  });
  const body = new T.SkinnedMesh(torsoGeo, pelt);
  body.name = "ribcage";
  spine.add(body);
  const pelvis = new T.Bone(),
    chest = new T.Bone();
  pelvis.name = "pelvis";
  chest.name = "chest";
  body.add(pelvis);
  pelvis.add(chest);
  chest.position.x = 0.18;
  root.updateMatrixWorld(true);
  body.bind(new T.Skeleton([pelvis, chest]));
  form(spine, "haunch", "fur", -0.52, 0, 0, 0.39, 0.41, 0.32);
  form(spine, "bib", "cream", 0.51, 0.13, 0, 0.29, 0.41, 0.26);

  const head = joint(spine, "neck", 0.64, 0.39, 0);
  head.rotation.y = -0.38;
  form(head, "skull", "fur", 0.09, 0.06, 0, 0.33, 0.31, 0.31);
  const eyes = [],
    ears = [];
  for (const side of [-1, 1]) {
    const z = side;
    const hinge = joint(head, "earHinge" + z, 0.01, 0.24, 0.19 * z);
    ears.push(hinge);
    const ear = form(
      hinge,
      "ear" + z,
      "fur",
      0,
      0.15,
      0,
      0.16,
      0.34,
      0.13,
      earGeometry,
    );
    ear.rotation.z = 0.12;
    form(
      hinge,
      "innerEar" + z,
      "pink",
      0.064,
      0.16,
      0,
      0.095,
      0.24,
      0.083,
      earGeometry,
    );
    const brow = form(
      head,
      "brow" + z,
      "dark",
      0.255,
      0.194,
      0.191 * z,
      0.09,
      0.018,
      0.035,
    );
    brow.rotation.x = -z * 0.28;
    form(
      head,
      "cheekStripe" + z,
      "dark",
      0.16,
      0.01,
      0.276 * z,
      0.101,
      0.017,
      0.023,
    );
    form(
      head,
      "foreheadStripe" + z,
      "dark",
      0.18,
      0.333,
      0.072 * z,
      0.084,
      0.017,
      0.015,
    );
    const eye = joint(head, "eyelid" + z, 0.295, 0.126, 0.195 * z);
    eyes.push(eye);
    form(eye, "iris" + z, "eye", 0, 0, 0, 0.068, 0.064, 0.063);
    form(eye, "pupil" + z, "black", 0.046, 0, 0.038 * z, 0.018, 0.047, 0.018);
    form(
      head,
      "muzzle" + z,
      "cream",
      0.35,
      -0.052,
      0.09 * z,
      0.145,
      0.103,
      0.118,
    );
    for (let i = 0; i < 3; i++) {
      const w = form(
        head,
        "whisker" + z + i,
        "cream",
        0.375,
        -0.06 + i * 0.025,
        (0.23 + i * 0.018) * z,
        0.004,
        0.005,
        0.14,
      );
      w.rotation.y = 0.4 * z;
      w.rotation.x = (i - 1) * 0.16;
    }
  }
  form(head, "nose", "pink", 0.467, 0.018, 0, 0.052, 0.045, 0.068);
  const legs = [];
  for (const front of [false, true])
    for (const side of [-1, 1]) {
      const id = (front ? "fore" : "hind") + (side === 1 ? "Near" : "Far");
      const hip = joint(root, id, front ? 0.51 : -0.53, 0.76, side * 0.19);
      const bend = front ? -0.075 : 0.14;
      const knee = joint(hip, id + "Knee", bend, -0.35, 0);
      const ankle = joint(knee, id + "Ankle", -bend, -0.32, 0);
      form(ankle, id + "Paw", "cream", 0.044, -0.014, 0, 0.128, 0.076, 0.09);
      joint(ankle, id + "Contact", 0.044, -0.09, 0);
      legs.push({ hip, knee, ankle, front, side });
    }
  let parent = spine;
  const tail = [];
  for (let i = 0; i < 7; i++) {
    const segment = joint(
      parent,
      "tail" + i,
      i ? -0.162 : -0.77,
      i ? 0 : 0.07,
      0,
    );
    segment.rotation.z = i === 0 ? -0.55 : i < 4 ? -0.19 : 0.25;
    tail.push(segment);
    parent = segment;
  }
  // A weighted tube bridges each moving joint. Shared vertices keep the silhouette
  // continuous through a bend and preserve the taper from thigh to ankle.
  const tubes = [];
  function skinTube(name, bones, tip, radii, tailCoat) {
    root.updateMatrixWorld(true);
    const points = bones.map((b) =>
      root.worldToLocal(b.getWorldPosition(new T.Vector3())),
    );
    points.push(root.worldToLocal(bones.at(-1).localToWorld(tip.clone())));
    const positions = [],
      colors = [],
      weights = [],
      indices = [],
      triangles = [];
    const rings = (points.length - 1) * 6,
      sides = 12;
    for (let r = 0; r <= rings; r++) {
      const t = r / 6,
        i = Math.min(points.length - 2, Math.floor(t)),
        f = t - i;
      const center = points[i].clone().lerp(points[i + 1], f);
      const direction = points[i + 1].clone().sub(points[i]).normalize();
      const tangent = new T.Vector3(0, 0, 1).cross(direction).normalize();
      const normal = direction.clone().cross(tangent);
      const radius = T.MathUtils.lerp(radii[i], radii[i + 1], f);
      const color = new T.Color(0xb68c6c).lerp(
        new T.Color(0x715442),
        tailCoat
          ? 0.65 * T.MathUtils.smoothstep(Math.cos(t * 5), 0, 0.85)
          : 0.12 * Math.cos(t * 6) + 0.12,
      );
      for (let j = 0; j < sides; j++) {
        const angle = (j * 2 * Math.PI) / sides;
        const v = center
          .clone()
          .addScaledVector(tangent, radius * Math.cos(angle))
          .addScaledVector(normal, 0.86 * radius * Math.sin(angle));
        positions.push(...v.toArray());
        colors.push(...color.toArray());
        indices.push(i, Math.min(i + 1, bones.length - 1), 0, 0);
        weights.push(1 - f, f, 0, 0);
        if (r < rings) {
          const a = r * sides + j,
            b = r * sides + ((j + 1) % sides);
          triangles.push(a, b, a + sides, b, b + sides, a + sides);
        }
      }
    }
    const g = new T.BufferGeometry();
    g.setIndex(triangles);
    for (const [key, values] of [
      ["position", positions],
      ["color", colors],
    ])
      g.setAttribute(key, new T.Float32BufferAttribute(values, 3));
    g.setAttribute("skinIndex", new T.Uint16BufferAttribute(indices, 4));
    g.setAttribute("skinWeight", new T.Float32BufferAttribute(weights, 4));
    g.computeVertexNormals();
    const mesh = new T.SkinnedMesh(g, pelt);
    mesh.name = name;
    root.add(mesh);
    mesh.bind(new T.Skeleton(bones));
    tubes.push(mesh);
  }
  for (const leg of legs) {
    skinTube(
      leg.hip.name + "Limb",
      [leg.hip, leg.knee, leg.ankle],
      new T.Vector3(0.05, -0.035, 0),
      [leg.front ? 0.115 : 0.2, leg.front ? 0.077 : 0.102, 0.061, 0.035],
      false,
    );
  }
  skinTube(
    "ringedTail",
    tail,
    new T.Vector3(-0.16, 0, 0),
    [0.105, 0.1, 0.095, 0.09, 0.081, 0.073, 0.061, 0.012],
    true,
  );
  return {
    root,
    spine,
    chest,
    head,
    eyes,
    ears,
    legs,
    tail,
    dispose() {
      tubes.forEach((m) => {
        m.geometry.dispose();
        m.skeleton.dispose();
      });
      torsoGeo.dispose();
      pelt.dispose();
      body.skeleton.dispose();
      sphere.dispose();
      earGeometry.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    },
  };
}
