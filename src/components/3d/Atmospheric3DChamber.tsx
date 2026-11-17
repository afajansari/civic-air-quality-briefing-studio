import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Box, RotateCcw, Play, Pause, Eye, Wind, Layers } from 'lucide-react';

interface Atmospheric3DChamberProps {
  aqi: number;
  pm25: number;
  pm10: number;
  cityName: string;
  stationName: string;
  simulatedReductionPct?: number;
  activeHour?: number;
  className?: string;
}

export function Atmospheric3DChamber({
  aqi,
  pm25,
  pm10,
  cityName,
  stationName,
  simulatedReductionPct = 0,
  activeHour,
  className = '',
}: Atmospheric3DChamberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [showInversion, setShowInversion] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [effectiveAqi, setEffectiveAqi] = useState(aqi);

  // Animation & Three.js references
  const animFrameRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const inversionRef = useRef<THREE.Mesh | null>(null);
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ x: 0.35, y: 0.5 });
  const zoomRef = useRef(35);

  // Calculate effective simulated AQI
  useEffect(() => {
    const reduced = Math.max(25, Math.round(aqi * (1 - simulatedReductionPct / 100)));
    setEffectiveAqi(reduced);
  }, [aqi, simulatedReductionPct]);

  // Determine CPCB category color for 3D particles
  const getCategoryColor = useCallback((val: number): THREE.Color => {
    if (val <= 50) return new THREE.Color(0x10b981); // Good (Emerald)
    if (val <= 100) return new THREE.Color(0x14b8a6); // Satisfactory (Teal)
    if (val <= 200) return new THREE.Color(0xf59e0b); // Moderate (Amber)
    if (val <= 300) return new THREE.Color(0xf97316); // Poor (Orange)
    if (val <= 400) return new THREE.Color(0xef4444); // Very Poor (Red)
    return new THREE.Color(0xa855f7); // Severe (Purple)
  }, []);

  const getCategoryLabel = (val: number): string => {
    if (val <= 50) return 'Good';
    if (val <= 100) return 'Satisfactory';
    if (val <= 200) return 'Moderate';
    if (val <= 300) return 'Poor';
    if (val <= 400) return 'Very Poor';
    return 'Severe';
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 340;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617); // Dark Slate background
    scene.fog = new THREE.FogExp2(0x020617, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 18, zoomRef.current);
    camera.lookAt(0, 4, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // 4. Ground Grid & Stylized Urban City Blocks
    const gridHelper = new THREE.GridHelper(40, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Urban City Geometry (Stylized buildings)
    const buildingGroup = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2,
      wireframe: false,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x334155 });

    // Seeded procedural buildings
    for (let x = -14; x <= 14; x += 4) {
      for (let z = -14; z <= 14; z += 4) {
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue; // Center open for station sensor
        const heightMultiplier = Math.sin(x * 0.5) * Math.cos(z * 0.5) + 1.2;
        const bHeight = Math.max(1.5, Math.abs(heightMultiplier) * 4);
        const geo = new THREE.BoxGeometry(2.4, bHeight, 2.4);
        const building = new THREE.Mesh(geo, buildingMat);
        building.position.set(x, bHeight / 2, z);
        buildingGroup.add(building);

        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, edgeMat);
        line.position.copy(building.position);
        buildingGroup.add(line);
      }
    }

    // Central CAAQMS Sensor Beacon Tower
    const beaconGeo = new THREE.CylinderGeometry(0.4, 0.6, 6, 8);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 3, 0);
    buildingGroup.add(beacon);

    scene.add(buildingGroup);

    // 5. Thermal Inversion Ceiling Layer (Translucent disc clamping smog)
    const inversionGeo = new THREE.CylinderGeometry(20, 20, 0.4, 32);
    const inversionMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
    });
    const inversionMesh = new THREE.Mesh(inversionGeo, inversionMat);
    inversionMesh.position.set(0, 11, 0);
    inversionRef.current = inversionMesh;
    scene.add(inversionMesh);

    // 6. Volumetric Particulate Point Cloud (PM2.5 & PM10)
    const particleCount = Math.min(5000, Math.max(1000, effectiveAqi * 12));
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velocityArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 36;
      posArray[i + 1] = Math.random() * 12; // Height clamped below inversion ceiling
      posArray[i + 2] = (Math.random() - 0.5) * 36;

      // Drift velocities
      velocityArray[i] = (Math.random() - 0.5) * 0.04;
      velocityArray[i + 1] = (Math.random() - 0.5) * 0.02;
      velocityArray[i + 2] = (Math.random() - 0.5) * 0.04;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particleColor = getCategoryColor(effectiveAqi);
    const particleMat = new THREE.PointsMaterial({
      color: particleColor,
      size: effectiveAqi > 200 ? 0.45 : 0.28,
      transparent: true,
      opacity: effectiveAqi > 300 ? 0.85 : 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    particlesRef.current = particles;
    scene.add(particles);

    // 7. Interactive Mouse / Touch Drag Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const deltaX = e.clientX - mousePosRef.current.x;
      const deltaY = e.clientY - mousePosRef.current.y;
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      cameraRotationRef.current.y += deltaX * 0.008;
      cameraRotationRef.current.x = Math.max(
        0.1,
        Math.min(1.2, cameraRotationRef.current.x + deltaY * 0.008)
      );
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.max(18, Math.min(60, zoomRef.current + e.deltaY * 0.03));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight || 340;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // 8. Render Loop
    let angle = cameraRotationRef.current.y;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (isRotating && !isMouseDownRef.current) {
        angle += 0.003;
        cameraRotationRef.current.y = angle;
      }

      // Smooth Orbit Camera
      const dist = zoomRef.current;
      const pitch = cameraRotationRef.current.x;
      const yaw = cameraRotationRef.current.y;

      camera.position.x = Math.sin(yaw) * Math.cos(pitch) * dist;
      camera.position.y = Math.sin(pitch) * dist + 4;
      camera.position.z = Math.cos(yaw) * Math.cos(pitch) * dist;
      camera.lookAt(0, 4, 0);

      // Animate Particles
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocityArray[i] + (showWind ? 0.02 : 0);
          positions[i + 1] += velocityArray[i + 1];
          positions[i + 2] += velocityArray[i + 2];

          // Boundary wrap
          if (positions[i] > 18) positions[i] = -18;
          if (positions[i] < -18) positions[i] = 18;
          if (positions[i + 1] > (showInversion ? 10.8 : 16)) positions[i + 1] = 0.5;
          if (positions[i + 1] < 0.2) positions[i + 1] = 10;
          if (positions[i + 2] > 18) positions[i + 2] = -18;
          if (positions[i + 2] < -18) positions[i + 2] = 18;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Rotate Inversion layer slightly
      if (inversionRef.current) {
        inversionRef.current.rotation.y += 0.001;
        inversionRef.current.visible = showInversion;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      } else {
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      buildingMat.dispose();
      edgeMat.dispose();
      beaconMat.dispose();
      inversionMat.dispose();
      particleMat.dispose();
    };
  }, [effectiveAqi, isRotating, showInversion, showWind, getCategoryColor]);

  // Reset Camera View
  const handleResetCamera = () => {
    cameraRotationRef.current = { x: 0.35, y: 0.5 };
    zoomRef.current = 35;
  };

  const aqiCategory = getCategoryLabel(effectiveAqi);

  return (
    <Card className={`border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col ${className}`}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3 border-b border-border/50">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold tracking-wide">
              3D Atmospheric Micro-Climate & Particulate Chamber
            </CardTitle>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono font-bold ${
                effectiveAqi <= 100
                  ? 'border-emerald-500/40 text-emerald-400'
                  : effectiveAqi <= 200
                  ? 'border-amber-500/40 text-amber-400'
                  : effectiveAqi <= 300
                  ? 'border-orange-500/40 text-orange-400'
                  : effectiveAqi <= 400
                  ? 'border-rose-500/40 text-rose-400'
                  : 'border-purple-500/40 text-purple-400'
              }`}
            >
              Simulated AQI: {effectiveAqi} • {aqiCategory}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {stationName || `${cityName} Grid`} • Interactive WebGL aerosol suspension, wind vectors & thermal inversion simulation
          </CardDescription>
        </div>

        {/* 3D Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsRotating((prev) => !prev)}
            className="h-7 px-2 text-xs gap-1 border-border bg-background hover:bg-accent"
            title={isRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
          >
            {isRotating ? <Pause className="size-3" /> : <Play className="size-3" />}
            <span className="hidden md:inline">{isRotating ? 'Pause' : 'Rotate'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowInversion((prev) => !prev)}
            className={`h-7 px-2 text-xs gap-1 border-border ${
              showInversion ? 'bg-accent text-accent-foreground' : 'bg-background'
            }`}
            title="Toggle nocturnal thermal inversion boundary layer"
          >
            <Layers className="size-3" />
            <span className="hidden md:inline">Inversion</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowWind((prev) => !prev)}
            className={`h-7 px-2 text-xs gap-1 border-border ${
              showWind ? 'bg-accent text-accent-foreground' : 'bg-background'
            }`}
            title="Toggle ambient wind vector dispersion"
          >
            <Wind className="size-3" />
            <span className="hidden md:inline">Wind</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetCamera}
            className="h-7 px-2 text-xs gap-1 border-border bg-background hover:bg-accent"
            title="Reset 3D camera orientation"
          >
            <RotateCcw className="size-3" />
            <span className="hidden md:inline">Reset</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Three.js Canvas Container */}
        <div
          ref={containerRef}
          className="w-full h-72 sm:h-80 cursor-grab active:cursor-grabbing bg-slate-950"
          style={{ touchAction: 'none' }}
        />

        {/* Overlay HUD Badges */}
        <div className="absolute bottom-2 left-3 flex flex-wrap items-center gap-2 pointer-events-none text-[10px] font-mono">
          <span className="bg-background/80 backdrop-blur-md px-2 py-0.5 rounded border border-border/60 text-muted-foreground">
            Drag: Rotate • Wheel: Zoom
          </span>
          <span className="bg-background/80 backdrop-blur-md px-2 py-0.5 rounded border border-border/60 text-foreground">
            PM2.5: {pm25} µg/m³ • PM10: {pm10} µg/m³
          </span>
          {simulatedReductionPct > 0 && (
            <span className="bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded border border-primary/40 text-primary font-bold">
              -{simulatedReductionPct}% Emission Policy Active
            </span>
          )}
        </div>

        <div className="absolute top-2 right-3 pointer-events-none text-[10px] font-mono bg-background/80 backdrop-blur-md px-2 py-0.5 rounded border border-border/60 text-muted-foreground flex items-center gap-1">
          <Eye className="size-3 text-primary" />
          <span>60 FPS WebGL</span>
        </div>
      </CardContent>
    </Card>
  );
}
