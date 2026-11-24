// Import the supplied indexed, Y-up, +Z-forward GLB and keep its original UVs.
import { readFile } from "node:fs/promises";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  MeshStandardMaterial,
  SkinnedMesh,
  Skeleton,
  MathUtils,
} from "three";
const source = new URL(
  "../downloaded assets/task_8ad993e0-d0ab-47e8-a41b-cf2dfc5eb9df_model (1).glb",
  import.meta.url,
);
function unpack(bytes) {
  const end = 20 + bytes.readUInt32LE(12);
  return {
    json: JSON.parse(bytes.subarray(20, end)),
    bin: bytes.subarray(end + 8),
  };
}
export async function bindTabby(rig) {
  const { json, bin } = unpack(await readFile(source));
  const primitive = json.meshes[0].primitives[0];
  function view(index) {
    const v = json.bufferViews[index];
    return bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength);
  }
  function array(index, Type, width) {
    const a = json.accessors[index],
      data = view(a.bufferView);
    return new Type(
      data.buffer,
      data.byteOffset + (a.byteOffset ?? 0),
      a.count * width,
    );
  }
  const xyz = array(primitive.attributes.POSITION, Float32Array, 3),
    uv = array(primitive.attributes.TEXCOORD_0, Float32Array, 2);
  const points = [],
    indices = [],
    weights = [],
    bones = [];
  rig.root.traverse((n) => {
    if (n.isBone) bones.push(n);
  });
  const smooth = MathUtils.smoothstep;
  for (let i = 0; i < xyz.length; i += 3) {
    const x = (xyz[i + 2] - 0.09) * 2.7,
      y = (xyz[i + 1] + 0.31062) * 2.7,
      z = xyz[i] * 2.7;
    points.push(x, y, z);
    const influences = new Map();
    function add(bone, weight) {
      if (weight > 0)
        influences.set(bone, (influences.get(bone) ?? 0) + weight);
    }
    const tail = 1 - smooth(x, -1.04, -0.91);
    const tailIndex = MathUtils.clamp((-0.94 - x) / 0.104, 0, 6);
    const t = Math.floor(tailIndex),
      f = tailIndex - t;
    add(rig.tail[t], tail * (1 - f));
    add(rig.tail[Math.min(6, t + 1)], tail * f);
    const leg = rig.legs.find(
      (l) => l.front === x > 0.18 && l.side === (z > 0.0 ? 1 : -1),
    );
    const limb = (1 - tail) * (1 - smooth(y, 0.49, 0.94));
    const upper = smooth(y, 0.29, 0.57),
      paw = 1 - smooth(y, 0.085, 0.205);
    add(leg.hip, limb * upper);
    add(leg.knee, limb * (1 - upper) * (1 - paw));
    add(leg.ankle, limb * (1 - upper) * paw);
    const torso = 1 - tail - limb,
      head = smooth(x + 0.55 * (y - 1), 0.49, 0.82);
    const ear = smooth(y, 1.4, 1.58),
      chest = smooth(x, -0.22, 0.37);
    add(rig.ears[z > 0 ? 1 : 0], torso * head * ear);
    add(rig.head, torso * head * (1 - ear));
    add(rig.chest, torso * (1 - head) * chest);
    add(rig.spine, torso * (1 - head) * (1 - chest));
    const top = [...influences].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const total = top.reduce((s, v) => s + v[1], 0);
    for (let j = 0; j < 4; j++) {
      indices.push(top[j] ? bones.indexOf(top[j][0]) : 0);
      weights.push(top[j] ? top[j][1] / total : 0);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(points, 3));
  const faces = Array.from(array(primitive.indices, Uint32Array, 1));
  for (let i = 0; i < faces.length; i += 3)
    [faces[i + 1], faces[i + 2]] = [faces[i + 2], faces[i + 1]];
  g.setIndex(faces);
  g.computeVertexNormals();
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setAttribute("skinIndex", new Uint16BufferAttribute(indices, 4));
  g.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4));
  const mesh = new SkinnedMesh(
    g,
    new MeshStandardMaterial({ roughness: 1, metalness: 0 }),
  );
  mesh.name = "TexturedTabby";
  rig.root.add(mesh);
  mesh.bind(new Skeleton(bones));
  return view(json.images[0].bufferView);
}
// Preserve the encoded PNG byte-for-byte without browser canvas re-encoding.
export function embedCoat(asset, png) {
  const { json, bin } = unpack(Buffer.from(asset));
  const offset = bin.length;
  json.images = [
    { mimeType: "image/png", bufferView: json.bufferViews.length },
  ];
  json.bufferViews.push({
    buffer: 0,
    byteOffset: offset,
    byteLength: png.length,
  });
  json.textures = [{ source: 0 }];
  json.materials[0].pbrMetallicRoughness.baseColorTexture = { index: 0 };
  json.buffers[0].byteLength = offset + png.length;
  const metadata = Buffer.from(JSON.stringify(json)),
    align = (n) => Math.ceil(n / 4) * 4;
  const j = align(metadata.length),
    b = align(offset + png.length),
    out = Buffer.alloc(28 + j + b);
  out.write("glTF");
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(j, 12);
  out.write("JSON", 16);
  out.fill(32, 20, 20 + j);
  metadata.copy(out, 20);
  out.writeUInt32LE(b, 20 + j);
  out.write("BIN\0", 24 + j);
  bin.copy(out, 28 + j);
  png.copy(out, 28 + j + offset);
  return out;
}
