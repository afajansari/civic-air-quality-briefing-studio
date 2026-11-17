'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Box, RotateCcw, Play, Pause, Eye, Wind, Layers, Droplets, Sun } from 'lucide-react';

interface Atmospheric3DChamberProps {
  aqi: number;
  pm25: number;
  pm10: number;
  cityName: string;
  stationName: string;
  simulatedReductionPct?: number;
  activeHour?: number;
  showHeader?: boolean;
  className?: string;
}

// Statutory Indian CPCB IS 5182 Color Standards for WebGL
function getCpcbColor(val: number): THREE.Color {
  if (val <= 50) return new THREE.Color(0x00b050); // Good (Emerald)
  if (val <= 100) return new THREE.Color(0x70ad47); // Satisfactory (Light Green)
  if (val <= 200) return new THREE.Color(0xeab308); // Moderate (Amber)
  if (val <= 300) return new THREE.Color(0xea580c); // Poor (CPCB Orange)
  if (val <= 400) return new THREE.Color(0xdc2626); // Very Poor (Red)
  return new THREE.Color(0x991b1b); // Severe (Crimson Maroon)
}

function getCpcbLabel(val: number): string {
  if (val <= 50) return 'Good';
  if (val <= 100) return 'Satisfactory';
  if (val <= 200) return 'Moderate';
  if (val <= 300) return 'Poor';
  if (val <= 400) return 'Very Poor';
  return 'Severe';
}

export function Atmospheric3DChamber({
  aqi,
  pm25,
  pm10,
  cityName,
  stationName,
  simulatedReductionPct = 0,
  activeHour = 12,
  showHeader = false,
  className = '',
}: Atmospheric3DChamberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [showInversion, setShowInversion] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [showHumidity, setShowHumidity] = useState(false);
  const [effectiveAqi, setEffectiveAqi] = useState(aqi);

  // Animation & Three.js references
  const animFrameRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pm25ParticlesRef = useRef<THREE.Points | null>(null);
  const pm10ParticlesRef = useRef<THREE.Points | null>(null);
  const inversionRef = useRef<THREE.Mesh | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Interactive camera interaction refs
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ x: 0.35, y: 0.6 });
  const zoomRef = useRef(36);

  // Calculate effective simulated AQI
  useEffect(() => {
    const reduced = Math.max(25, Math.round(aqi * (1 - simulatedReductionPct / 100)));
    setEffectiveAqi(reduced);
  }, [aqi, simulatedReductionPct]);

  // Optical Atmospheric Visibility (Koschmieder extinction law):
  // High AQI (>400) drops visibility below 300m, clear air (AQI <50) reaches ~15km
  const visibilityEstimate = useMemo(() => {
    if (effectiveAqi <= 50) return { distance: '> 15 km', rating: 'Clear Horizon', density: 0.003 };
    if (effectiveAqi <= 100) return { distance: '10 - 15 km', rating: 'Good Horizon', density: 0.007 };
    if (effectiveAqi <= 200) return { distance: '3 - 6 km', rating: 'Moderate Haze', density: 0.016 };
    if (effectiveAqi <= 300) return { distance: '1.2 - 2.5 km', rating: 'Dense Smog', density: 0.032 };
    if (effectiveAqi <= 400) return { distance: '500 - 1000 m', rating: 'Very Dense Smog', density: 0.052 };
    return { distance: '< 300 m', rating: 'Severe Blind Smog', density: 0.076 };
  }, [effectiveAqi]);

  // Atmospheric solar transmission % (Mie scattering attenuation)
  const solarTransmissionPct = useMemo(() => {
    return Math.max(12, Math.round(100 - (effectiveAqi / 500) * 85));
  }, [effectiveAqi]);

  // Thermal inversion height: drops during cold nocturnal hours (20:00 - 07:00), rises in daytime
  const inversionCeilingY = useMemo(() => {
    if (activeHour >= 11 && activeHour <= 16) return 13.5; // Afternoon vertical convection
    if (activeHour >= 8 && activeHour <= 10) return 9.5; // Morning breakup
    if (activeHour >= 17 && activeHour <= 19) return 10.0; // Sunset compression
    return 6.5; // Cold nocturnal boundary layer (severe trapping)
  }, [activeHour]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 360;

    // 1. Scene & Atmosphere Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Background color: Technical Obsidian Cleanroom `#090a0c`
    const baseColorHex = 0x090a0c;
    scene.background = new THREE.Color(baseColorHex);

    // Dynamic Fog with physical optical density
    const fogDensity = showHumidity
      ? visibilityEstimate.density * 1.45
      : visibilityEstimate.density;

    // Fog color shifts from cool obsidian in clean air to particulate-stained crimson-gray in severe smog
    const fogColor = new THREE.Color(baseColorHex);
    if (effectiveAqi > 200) {
      const smogTint = effectiveAqi > 400 ? new THREE.Color(0x281212) : new THREE.Color(0x221812);
      fogColor.lerp(smogTint, Math.min(0.85, (effectiveAqi - 200) / 300));
    }
    if (showHumidity) {
      fogColor.lerp(new THREE.Color(0x1a212d), 0.35); // Cool moisture scattering
    }
    scene.fog = new THREE.FogExp2(fogColor.getHex(), fogDensity);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 18, zoomRef.current);
    camera.lookAt(0, 4, 0);

    // 3. WebGL Renderer with High-DPI & Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting & Solar Mie Scattering
    const ambientLight = new THREE.AmbientLight(0xffffff, effectiveAqi > 300 ? 0.45 : 0.7);
    scene.add(ambientLight);

    // Directional Sun Light: shifts from bright gold-white to diffuse crimson/amber in severe smog
    const sunColor = new THREE.Color(0xfff7ed);
    if (effectiveAqi > 200) {
      const sunsetSmogColor = effectiveAqi > 350 ? new THREE.Color(0xdc2626) : new THREE.Color(0xea580c);
      sunColor.lerp(sunsetSmogColor, (effectiveAqi - 200) / 300);
    }
    const sunIntensity = Math.max(0.35, 1.4 * (solarTransmissionPct / 100));
    const sunLight = new THREE.DirectionalLight(sunColor.getHex(), sunIntensity);
    sunLight.position.set(24, 32, -28);
    sunLightRef.current = sunLight;
    scene.add(sunLight);

    // Visible Solar Disc in Horizon Skybox (simulating filtered sun struggling through smog)
    const sunGeo = new THREE.SphereGeometry(2.2, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({
      color: sunColor,
      transparent: true,
      opacity: effectiveAqi > 300 ? 0.65 : 0.95,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(24, 32, -28);
    sunMeshRef.current = sunMesh;
    scene.add(sunMesh);

    // 5. Urban Topography Ground & Street Canyons (Precision Matte Architecture)
    const gridHelper = new THREE.GridHelper(44, 22, 0x232730, 0x111317);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const buildingGroup = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x14171f,
      roughness: 0.85,
      metalness: 0.15,
    });
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x262b36,
      transparent: true,
      opacity: 0.7,
    });

    // Procedural urban block array
    for (let x = -16; x <= 16; x += 4) {
      for (let z = -16; z <= 16; z += 4) {
        if (Math.abs(x) < 2.5 && Math.abs(z) < 2.5) continue; // Sensor plaza clearance
        const bSeed = Math.sin(x * 0.45) * Math.cos(z * 0.45) + 1.25;
        const bHeight = Math.max(1.8, Math.abs(bSeed) * 4.2);
        const geo = new THREE.BoxGeometry(2.5, bHeight, 2.5);
        const building = new THREE.Mesh(geo, buildingMat);
        building.position.set(x, bHeight / 2, z);
        buildingGroup.add(building);

        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, edgeMat);
        line.position.copy(building.position);
        buildingGroup.add(line);
      }
    }

    // Central Official CAAQMS Monitoring Station Mast
    const mastGeo = new THREE.CylinderGeometry(0.3, 0.5, 6.5, 12);
    const mastColor = getCpcbColor(effectiveAqi);
    const mastMat = new THREE.MeshStandardMaterial({
      color: mastColor,
      emissive: mastColor,
      emissiveIntensity: 0.5,
      metalness: 0.4,
      roughness: 0.3,
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 3.25, 0);
    buildingGroup.add(mast);

    // Sensor intake head
    const intakeGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const intakeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.8,
    });
    const intake = new THREE.Mesh(intakeGeo, intakeMat);
    intake.position.set(0, 6.6, 0);
    buildingGroup.add(intake);

    scene.add(buildingGroup);

    // 6. Nocturnal Thermal Inversion Boundary Layer (Physically Clamps Particulates)
    const inversionGeo = new THREE.CylinderGeometry(24, 24, 0.35, 36);
    const inversionMat = new THREE.MeshBasicMaterial({
      color: 0xea580c,
      transparent: true,
      opacity: effectiveAqi > 200 ? 0.22 : 0.12,
      wireframe: true,
    });
    const inversionMesh = new THREE.Mesh(inversionGeo, inversionMat);
    inversionMesh.position.set(0, inversionCeilingY, 0);
    inversionRef.current = inversionMesh;
    scene.add(inversionMesh);

    // 7. Layer A: Fine PM2.5 Micro-Aerosol Point Cloud (Brownian suspension & wind drift)
    const pm25Count = Math.min(4200, Math.max(1200, effectiveAqi * 10));
    const pm25Geo = new THREE.BufferGeometry();
    const pm25Pos = new Float32Array(pm25Count * 3);
    const pm25Vel = new Float32Array(pm25Count * 3);

    for (let i = 0; i < pm25Count * 3; i += 3) {
      pm25Pos[i] = (Math.random() - 0.5) * 40;
      pm25Pos[i + 1] = Math.random() * (showInversion ? inversionCeilingY : 16);
      pm25Pos[i + 2] = (Math.random() - 0.5) * 40;

      // Brownian micro-drift velocities
      pm25Vel[i] = (Math.random() - 0.5) * 0.035;
      pm25Vel[i + 1] = (Math.random() - 0.5) * 0.02;
      pm25Vel[i + 2] = (Math.random() - 0.5) * 0.035;
    }

    pm25Geo.setAttribute('position', new THREE.BufferAttribute(pm25Pos, 3));

    const pm25Mat = new THREE.PointsMaterial({
      color: mastColor,
      size: effectiveAqi > 250 ? 0.38 : 0.24,
      transparent: true,
      opacity: effectiveAqi > 300 ? 0.8 : 0.55,
      blending: THREE.AdditiveBlending,
    });

    const pm25Points = new THREE.Points(pm25Geo, pm25Mat);
    pm25ParticlesRef.current = pm25Points;
    scene.add(pm25Points);

    // 8. Layer B: Coarse PM10 Dust & Fly-Ash Particulates (Street-level sedimentation & tumbling)
    const pm10Count = Math.min(1800, Math.max(500, Math.round(effectiveAqi * 4)));
    const pm10Geo = new THREE.BufferGeometry();
    const pm10Pos = new Float32Array(pm10Count * 3);
    const pm10Vel = new Float32Array(pm10Count * 3);

    for (let i = 0; i < pm10Count * 3; i += 3) {
      pm10Pos[i] = (Math.random() - 0.5) * 38;
      // Coarse dust concentrates near ground level (0.2m to 5.5m)
      pm10Pos[i + 1] = Math.random() * 5.5 + 0.2;
      pm10Pos[i + 2] = (Math.random() - 0.5) * 38;

      // Gravitational tumbling velocities
      pm10Vel[i] = (Math.random() - 0.5) * 0.05;
      pm10Vel[i + 1] = -Math.random() * 0.015 - 0.005; // Negative settling velocity
      pm10Vel[i + 2] = (Math.random() - 0.5) * 0.05;
    }

    pm10Geo.setAttribute('position', new THREE.BufferAttribute(pm10Pos, 3));

    const pm10Mat = new THREE.PointsMaterial({
      color: effectiveAqi > 200 ? 0xd97706 : 0x94a3b8, // Amber dust vs gray dust
      size: 0.62, // Distinctly larger than PM2.5
      transparent: true,
      opacity: 0.75,
      blending: THREE.NormalBlending, // Physical non-glowing grit
    });

    const pm10Points = new THREE.Points(pm10Geo, pm10Mat);
    pm10ParticlesRef.current = pm10Points;
    scene.add(pm10Points);

    // 9. Interactive Drag / Orbit Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const deltaX = e.clientX - mousePosRef.current.x;
      const deltaY = e.clientY - mousePosRef.current.y;
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      cameraRotationRef.current.y += deltaX * 0.007;
      cameraRotationRef.current.x = Math.max(
        0.1,
        Math.min(1.25, cameraRotationRef.current.x + deltaY * 0.007)
      );
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.max(16, Math.min(65, zoomRef.current + e.deltaY * 0.03));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Window Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight || 360;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // 10. 60 FPS Render & Physics Loop
    let angle = cameraRotationRef.current.y;
    let clockTime = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      clockTime += 0.016;

      if (isRotating && !isMouseDownRef.current) {
        angle += 0.0025;
        cameraRotationRef.current.y = angle;
      }

      // Smooth Orbit Camera
      const dist = zoomRef.current;
      const pitch = cameraRotationRef.current.x;
      const yaw = cameraRotationRef.current.y;

      camera.position.x = Math.sin(yaw) * Math.cos(pitch) * dist;
      camera.position.y = Math.sin(pitch) * dist + 4.5;
      camera.position.z = Math.cos(yaw) * Math.cos(pitch) * dist;
      camera.lookAt(0, 4.0, 0);

      const windDrift = showWind ? 0.035 : 0.004;

      // A. Animate Fine PM2.5 Micro-Aerosols (Brownian flutter + wind shear)
      if (pm25ParticlesRef.current) {
        const positions = pm25ParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const maxCeiling = showInversion ? inversionCeilingY : 15.5;

        for (let i = 0; i < positions.length; i += 3) {
          // Continuous Brownian micro-vibration
          positions[i] += pm25Vel[i] + windDrift + Math.sin(clockTime * 2 + i) * 0.005;
          positions[i + 1] += pm25Vel[i + 1] + Math.cos(clockTime * 1.5 + i) * 0.003;
          positions[i + 2] += pm25Vel[i + 2] + Math.sin(clockTime * 1.8 + i) * 0.004;

          // Boundary wrap
          if (positions[i] > 20) positions[i] = -20;
          if (positions[i] < -20) positions[i] = 20;
          if (positions[i + 1] > maxCeiling) positions[i + 1] = 0.6;
          if (positions[i + 1] < 0.4) positions[i + 1] = maxCeiling * 0.95;
          if (positions[i + 2] > 20) positions[i + 2] = -20;
          if (positions[i + 2] < -20) positions[i + 2] = 20;
        }
        pm25ParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // B. Animate Coarse PM10 Dust (Sedimentation & street-level turbulence)
      if (pm10ParticlesRef.current) {
        const positions = pm10ParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += pm10Vel[i] + windDrift * 0.8;
          positions[i + 1] += pm10Vel[i + 1]; // Falling due to gravity
          positions[i + 2] += pm10Vel[i + 2];

          // Dust settles to ground and recirculates in urban eddies
          if (positions[i + 1] < 0.25) {
            positions[i + 1] = Math.random() * 5.0 + 0.5;
            positions[i] = (Math.random() - 0.5) * 36;
          }
          if (positions[i] > 19) positions[i] = -19;
          if (positions[i] < -19) positions[i] = 19;
          if (positions[i + 2] > 19) positions[i + 2] = -19;
          if (positions[i + 2] < -19) positions[i + 2] = 19;
        }
        pm10ParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Rotate Inversion Boundary Layer
      if (inversionRef.current) {
        inversionRef.current.rotation.y += 0.0008;
        inversionRef.current.position.y = inversionCeilingY;
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
      mastMat.dispose();
      intakeMat.dispose();
      inversionMat.dispose();
      pm25Mat.dispose();
      pm10Mat.dispose();
      sunMat.dispose();
    };
  }, [
    effectiveAqi,
    isRotating,
    showInversion,
    showWind,
    showHumidity,
    inversionCeilingY,
    visibilityEstimate,
    solarTransmissionPct,
  ]);

  const handleResetCamera = useCallback(() => {
    cameraRotationRef.current = { x: 0.35, y: 0.6 };
    zoomRef.current = 36;
  }, []);

  const aqiCategory = getCpcbLabel(effectiveAqi);

  const renderControls = (
    <div className="flex items-center gap-1 p-1 rounded-lg subtle-glass shadow-lg z-10">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsRotating((prev) => !prev)}
        className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
        title={isRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
      >
        {isRotating ? <Pause className="size-3" /> : <Play className="size-3" />}
        <span className="hidden sm:inline">{isRotating ? 'Pause' : 'Rotate'}</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowInversion((prev) => !prev)}
        className={`h-6 px-2 text-[10px] gap-1 ${
          showInversion ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Toggle nocturnal thermal inversion capping layer"
      >
        <Layers className="size-3" />
        <span className="hidden sm:inline">Inversion ({inversionCeilingY * 40}m)</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowWind((prev) => !prev)}
        className={`h-6 px-2 text-[10px] gap-1 ${
          showWind ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Toggle ambient wind shear dispersion"
      >
        <Wind className="size-3" />
        <span className="hidden sm:inline">Wind</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowHumidity((prev) => !prev)}
        className={`h-6 px-2 text-[10px] gap-1 ${
          showHumidity ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Toggle high humidity / radiation fog condensation"
      >
        <Droplets className="size-3" />
        <span className="hidden sm:inline">Fog/Mist</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleResetCamera}
        className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
        title="Reset 3D camera orientation"
      >
        <RotateCcw className="size-3" />
        <span className="hidden sm:inline">Reset</span>
      </Button>
    </div>
  );

  if (!showHeader) {
    return (
      <div className={`relative w-full h-[380px] sm:h-[440px] bg-[#090a0c] overflow-hidden ${className}`}>
        {/* Three.js Canvas Container */}
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing bg-[#090a0c]"
          style={{ touchAction: 'none' }}
        />

        {/* Floating 3D Action Controls (Bottom Right - Above Scrubber, Zero Collision) */}
        <div className="absolute bottom-2.5 right-3 z-10 hidden sm:block">
          {renderControls}
        </div>

        {/* Atmospheric Telemetry Badges (Bottom Left) */}
        <div className="absolute bottom-2.5 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none text-[10px] font-mono z-10">
          <span className="subtle-glass px-2 py-0.5 rounded text-muted-foreground">
            Drag: Rotate • Wheel: Zoom
          </span>
          <span className="subtle-glass px-2 py-0.5 rounded text-foreground font-bold tabular-nums">
            Visibility: {visibilityEstimate.distance} ({visibilityEstimate.rating})
          </span>
          <span className="subtle-glass px-2 py-0.5 rounded text-muted-foreground tabular-nums">
            PM2.5: {pm25} µg/m³ • PM10: {pm10} µg/m³
          </span>
          {simulatedReductionPct > 0 && (
            <span className="bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded border border-primary/40 text-primary font-bold">
              -{simulatedReductionPct}% Attenuation
            </span>
          )}
        </div>

        {/* Solar Transmission & WebGL Frame Indicator (Top Center - Zero Collision) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none text-[10px] font-mono subtle-glass px-2.5 py-0.5 rounded-full text-muted-foreground items-center gap-2 z-10 hidden lg:flex">
          <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
            <Sun className="size-3" />
            <span>Solar: {solarTransmissionPct}%</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="size-3 text-primary" />
            <span>60 FPS WebGL</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Standalone 3D Header & Atmospheric Controls */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3 border-b border-border/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-sm font-semibold tracking-wide">
              3D Atmospheric Smog, Dust & Inversion Chamber
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-bold border-border text-foreground"
            >
              Simulated AQI: {effectiveAqi} • {aqiCategory}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {stationName || `${cityName} Grid`} • Koschmieder optical visibility extinction, dual particulate physics & solar scattering
          </CardDescription>
        </div>

        {renderControls}
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Three.js Canvas Container */}
        <div
          ref={containerRef}
          className="w-full h-72 sm:h-80 cursor-grab active:cursor-grabbing bg-[#090a0c]"
          style={{ touchAction: 'none' }}
        />

        {/* Atmospheric Telemetry Badges (Swiss Cleanroom Style) */}
        <div className="absolute bottom-2 left-3 flex flex-wrap items-center gap-2 pointer-events-none text-[10px] font-mono z-10">
          <span className="subtle-glass px-2 py-0.5 rounded text-muted-foreground">
            Drag: Rotate • Wheel: Zoom
          </span>
          <span className="subtle-glass px-2 py-0.5 rounded text-foreground font-bold tabular-nums">
            Visibility: {visibilityEstimate.distance} ({visibilityEstimate.rating})
          </span>
          <span className="subtle-glass px-2 py-0.5 rounded text-muted-foreground tabular-nums">
            PM2.5: {pm25} µg/m³ • PM10: {pm10} µg/m³
          </span>
          {simulatedReductionPct > 0 && (
            <span className="bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded border border-primary/40 text-primary font-bold">
              -{simulatedReductionPct}% Policy Attenuation
            </span>
          )}
        </div>

        {/* Solar Transmission & WebGL Frame Indicator */}
        <div className="absolute top-2 right-3 pointer-events-none text-[10px] font-mono subtle-glass px-2 py-0.5 rounded text-muted-foreground flex items-center gap-2 z-10">
          <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
            <Sun className="size-3" />
            <span>Solar: {solarTransmissionPct}%</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="size-3 text-primary" />
            <span>60 FPS WebGL</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}