"use client";

import { useT } from "@/lib/i18n";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Props = {
  elevMin: number;
  elevMax: number;
  elevMean: number;
  slopeMean: number;
};

/** Tinte ipsometriche: mare → pianura → collina → crinale. */
function elevColor(t: number, out: THREE.Color) {
  const stops: Array<[number, string]> = [
    [0, "#1f6f8b"],
    [0.08, "#3d9aad"],
    [0.18, "#7cbc6e"],
    [0.35, "#a8c96a"],
    [0.55, "#c4a574"],
    [0.75, "#9a7b5a"],
    [0.9, "#8a8680"],
    [1, "#f2f0ea"],
  ];
  let i = 0;
  while (i < stops.length - 1 && t > stops[i + 1][0]) i += 1;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const span = Math.max(b[0] - a[0], 1e-6);
  out.set(a[1]).lerp(new THREE.Color(b[1]), (t - a[0]) / span);
  return out;
}

/**
 * Rilievo 3D stilizzato basato su morfologia CNR-IRPI (non DEM reale).
 * Interattivo: orbit/zoom; colori per quota.
 */
export default function Terrain3D({
  elevMin,
  elevMax,
  elevMean,
  slopeMean,
}: Props) {
  const t = useT();
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 640;
    const height = 380;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeaf2f8);
    scene.fog = new THREE.Fog(0xeaf2f8, 90, 220);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 500);
    camera.position.set(55, 42, 68);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 35;
    controls.maxDistance = 140;
    controls.target.set(0, 4, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    const stopAuto = () => {
      controls.autoRotate = false;
    };
    controls.addEventListener("start", stopAuto);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfff5e6, 1.05);
    sun.position.set(45, 70, 25);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb8d4ff, 0.35);
    fill.position.set(-30, 20, -40);
    scene.add(fill);

    // San Vincenzo: costa a Ovest, rilievi a Est — estensione E-O leggermente allungata
    const sizeX = 96;
    const sizeZ = 72;
    const segments = 128;
    const geometry = new THREE.PlaneGeometry(sizeX, sizeZ, segments, segments);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();
    const range = Math.max(elevMax - elevMin, 1);
    const meanNorm = (elevMean - elevMin) / range;
    const roughness = Math.min(Math.max(slopeMean / 25, 0.2), 1.35);
    const heightScale = 14 + roughness * 10;

    // Altezze stilizzate: costa Ovest bassa, colline Est (max ~647 m)
    const heights: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const nx = x / (sizeX / 2); // -1..1
      const nz = y / (sizeZ / 2);
      const coastal = Math.max(0, (nx + 1) * 0.5); // 0 ovest → 1 est
      const ridge =
        Math.pow(Math.max(0, nx - 0.05), 1.35) * 0.85 +
        Math.sin((nx + 1) * Math.PI * 1.4) * Math.cos(nz * Math.PI * 1.1) * 0.22;
      const detail =
        Math.sin(nx * 9 + nz * 6) * 0.045 * roughness +
        Math.sin(nx * 17 - nz * 11) * 0.02 * roughness;
      const valley = -Math.exp(-Math.pow((nz + 0.15) / 0.45, 2)) * 0.08 * coastal;
      const hNorm = THREE.MathUtils.clamp(
        coastal * 0.35 + ridge + detail + valley + meanNorm * 0.12,
        0,
        1.15,
      );
      const h = hNorm * heightScale;
      heights.push(h);
      pos.setZ(i, h);

      const t = THREE.MathUtils.clamp(h / (heightScale * 1.05), 0, 1);
      elevColor(t, color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      metalness: 0.04,
      roughness: 0.88,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);

    // Mare a quota 0, solo sul lato occidentale
    const seaGeo = new THREE.PlaneGeometry(sizeX * 0.42, sizeZ * 1.05, 1, 1);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x2f7ea8,
      transparent: true,
      opacity: 0.72,
      metalness: 0.2,
      roughness: 0.35,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-sizeX * 0.32, 0.15, 0);
    scene.add(sea);

    // Contorno sottile
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 28),
      new THREE.LineBasicMaterial({ color: 0x2c3e50, transparent: true, opacity: 0.12 }),
    );
    edges.rotation.x = -Math.PI / 2;
    scene.add(edges);

    // Freccia Nord (asse -Z della scena dopo rotazione = Nord stilizzato verso alto mappa)
    const northGroup = new THREE.Group();
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(sizeX * 0.38, 0.5, sizeZ * 0.38),
      10,
      0x17324d,
      2.5,
      1.8,
    );
    northGroup.add(arrow);
    scene.add(northGroup);

    let raf = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth || width;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.removeEventListener("start", stopAuto);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      seaGeo.dispose();
      seaMat.dispose();
      edges.geometry.dispose();
      (edges.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [elevMin, elevMax, elevMean, slopeMean]);

  return (
    <div>
      <div
        ref={mountRef}
        className="h-[380px] w-full cursor-grab overflow-hidden rounded-md active:cursor-grabbing"
        title={t("Trascina per ruotare · scroll per zoom")}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div
          className="h-2.5 min-w-[180px] flex-1 rounded-full"
          style={{
            background:
              "linear-gradient(90deg,#1f6f8b 0%,#7cbc6e 22%,#a8c96a 40%,#c4a574 60%,#9a7b5a 78%,#f2f0ea 100%)",
          }}
          aria-hidden
        />
        <div className="flex w-full justify-between text-[11px] text-[#5b6f82] sm:w-auto sm:min-w-[220px] sm:gap-6">
          <span>{elevMin} m</span>
          <span>media {elevMean} m</span>
          <span>{elevMax} m</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-[#5b6f82]">
        Visualizzazione stilizzata (non DEM): costa a Ovest, rilievi a Est.
        Pendenza media {slopeMean}°. Trascina per ruotare, scroll per zoom
        (N = freccia scura).
      </p>
    </div>
  );
}
