import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Html, Line } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as THREE from 'three';

/* ── camera fit — horizontal/isometric orientation ───────────────────────── */
function fitCamera(camera, controls, object) {
  const box      = new THREE.Box3().setFromObject(object);
  const center   = box.getCenter(new THREE.Vector3());
  const size     = box.getSize(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z);          // floor plan spread
  const fov      = camera.fov * (Math.PI / 180);
  const dist     = Math.abs(footprint / Math.sin(fov / 2)) * 0.65;

  // High Y → model appears horizontal like a real floor plan
  camera.position.set(center.x + dist * 0.7, center.y + dist * 0.55, center.z + dist * 0.7);
  camera.near = dist * 0.001;
  camera.far  = dist * 14;
  camera.updateProjectionMatrix();
  camera.lookAt(center);

  if (controls) {
    controls.target.copy(center);
    controls.minDistance = dist * 0.08;
    controls.maxDistance = dist * 4;
    controls.update();
  }
  return { center, size, dist };
}

/* ── coordinate axes + dimension lines ──────────────────────────────────── */
function CoordinateSystem({ info }) {
  if (!info) return null;
  const { center: c, size: s } = info;
  const pad = 0.8;
  const ox = c.x - s.x / 2 - pad * 0.3;
  const oy = c.y - s.y / 2;
  const oz = c.z + s.z / 2 + pad * 0.3;
  const ax = s.x * 0.5 + pad, ay = s.y * 0.5 + pad, az = s.z * 0.5 + pad;

  const lbl = (extra) => ({
    fontSize: '11px', fontWeight: 700, fontFamily: 'Consolas,monospace',
    padding: '2px 6px', borderRadius: '4px', pointerEvents: 'none',
    whiteSpace: 'nowrap', userSelect: 'none', ...extra,
  });
  const dim = {
    fontSize: '10px', fontWeight: 600, fontFamily: 'Consolas,monospace',
    padding: '2px 5px', borderRadius: '3px', pointerEvents: 'none',
    whiteSpace: 'nowrap', userSelect: 'none',
    background: 'rgba(6,14,31,.88)', border: '1px solid rgba(147,197,253,.2)', color: '#93c5fd',
  };

  return (
    <group>
      {/* Axes */}
      <Line points={[[ox,oy,oz],[ox+ax*2,oy,oz]]} color="#ef4444" lineWidth={2}/>
      <Html position={[ox+ax*2+0.4,oy,oz]} center><span style={lbl({background:'rgba(239,68,68,.15)',color:'#f87171',border:'1px solid rgba(239,68,68,.3)'})}> X</span></Html>

      <Line points={[[ox,oy,oz],[ox,oy+ay*2,oz]]} color="#22c55e" lineWidth={2}/>
      <Html position={[ox,oy+ay*2+0.4,oz]} center><span style={lbl({background:'rgba(34,197,94,.15)',color:'#4ade80',border:'1px solid rgba(34,197,94,.3)'})}> Y</span></Html>

      <Line points={[[ox,oy,oz],[ox,oy,oz-az*2]]} color="#3b82f6" lineWidth={2}/>
      <Html position={[ox,oy,oz-az*2-0.4]} center><span style={lbl({background:'rgba(59,130,246,.15)',color:'#60a5fa',border:'1px solid rgba(59,130,246,.3)'})}> Z</span></Html>

      <mesh position={[ox,oy,oz]}><sphereGeometry args={[0.12,8,8]}/><meshBasicMaterial color="#fff"/></mesh>

      {/* Width (X) */}
      <Line points={[[c.x-s.x/2,oy-0.5,c.z],[c.x+s.x/2,oy-0.5,c.z]]} color="#fbbf24" lineWidth={1.5} dashed dashSize={0.3} gapSize={0.15}/>
      <Line points={[[c.x-s.x/2,oy-0.3,c.z],[c.x-s.x/2,oy-0.7,c.z]]} color="#fbbf24" lineWidth={1.5}/>
      <Line points={[[c.x+s.x/2,oy-0.3,c.z],[c.x+s.x/2,oy-0.7,c.z]]} color="#fbbf24" lineWidth={1.5}/>
      <Html position={[c.x,oy-0.5,c.z]} center><span style={dim}>W: {s.x.toFixed(1)} m</span></Html>

      {/* Depth (Z) */}
      <Line points={[[c.x+s.x/2+0.5,oy,c.z-s.z/2],[c.x+s.x/2+0.5,oy,c.z+s.z/2]]} color="#fbbf24" lineWidth={1.5} dashed dashSize={0.3} gapSize={0.15}/>
      <Line points={[[c.x+s.x/2+0.3,oy,c.z-s.z/2],[c.x+s.x/2+0.7,oy,c.z-s.z/2]]} color="#fbbf24" lineWidth={1.5}/>
      <Line points={[[c.x+s.x/2+0.3,oy,c.z+s.z/2],[c.x+s.x/2+0.7,oy,c.z+s.z/2]]} color="#fbbf24" lineWidth={1.5}/>
      <Html position={[c.x+s.x/2+0.5,oy,c.z]} center><span style={dim}>D: {s.z.toFixed(1)} m</span></Html>

      {/* Height (Y) */}
      <Line points={[[c.x-s.x/2-0.5,c.y-s.y/2,c.z],[c.x-s.x/2-0.5,c.y+s.y/2,c.z]]} color="#fbbf24" lineWidth={1.5} dashed dashSize={0.3} gapSize={0.15}/>
      <Line points={[[c.x-s.x/2-0.3,c.y-s.y/2,c.z],[c.x-s.x/2-0.7,c.y-s.y/2,c.z]]} color="#fbbf24" lineWidth={1.5}/>
      <Line points={[[c.x-s.x/2-0.3,c.y+s.y/2,c.z],[c.x-s.x/2-0.7,c.y+s.y/2,c.z]]} color="#fbbf24" lineWidth={1.5}/>
      <Html position={[c.x-s.x/2-0.5,c.y,c.z]} center><span style={dim}>H: {s.y.toFixed(1)} m</span></Html>

      {/* Corner coords */}
      <Html position={[c.x-s.x/2,oy,c.z+s.z/2]} center>
        <span style={{...dim,fontSize:'9px',opacity:.7}}>({(c.x-s.x/2).toFixed(1)}, 0, {(c.z+s.z/2).toFixed(1)})</span>
      </Html>
      <Html position={[c.x+s.x/2,oy,c.z-s.z/2]} center>
        <span style={{...dim,fontSize:'9px',opacity:.7}}>({(c.x+s.x/2).toFixed(1)}, 0, {(c.z-s.z/2).toFixed(1)})</span>
      </Html>
    </group>
  );
}

/* ── room labels (shown flat on the floor plane) ────────────────────────── */
function RoomLabels({ rooms }) {
  if (!rooms?.length) return null;
  const SCALE = 0.05; // must match SCALE_M_PER_PX in Python
  return (
    <group>
      {rooms.map(r => {
        // compute centre in 3D space (same coordinate system as OBJ)
        const cx = (r.x + (r.width_m  / SCALE) / 2) * SCALE;
        const cz = (r.y + (r.height_m / SCALE) / 2) * SCALE;
        return (
          <Html key={r.id} position={[cx, 0.5, cz]} center distanceFactor={18}>
            <div style={{
              background: 'rgba(7,16,31,.82)',
              border: '1px solid rgba(96,165,250,.35)',
              borderRadius: '6px',
              padding: '3px 8px',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#93c5fd', lineHeight: 1.3 }}>
                {r.label}
              </p>
              <p style={{ fontSize: '9px', color: '#4b6a9a', lineHeight: 1.2 }}>
                {r.area_m2} m²
              </p>
            </div>
          </Html>
        );
      })}
    </group>
  );
}
/* ── camera controller ───────────────────────────────────────────────────── */
function CameraController({ target, viewKey, onReady, onInfo }) {
  const { camera, controls } = useThree();
  const infoRef  = useRef(null);
  const prevView = useRef(null);

  useEffect(() => {
    if (!target) return;
    const info = fitCamera(camera, controls, target);
    infoRef.current = info;
    onInfo?.(info);
    onReady?.();
  }, [target]);

  useEffect(() => {
    if (!infoRef.current || !controls || viewKey === prevView.current) return;
    prevView.current = viewKey;
    const { center: c, dist: d } = infoRef.current;
    const positions = {
      perspective: new THREE.Vector3(c.x + d*0.7, c.y + d*0.55, c.z + d*0.7),
      top:         new THREE.Vector3(c.x,          c.y + d*1.6,  c.z + 0.001),
      front:       new THREE.Vector3(c.x,          c.y + d*0.25, c.z + d*1.2),
      side:        new THREE.Vector3(c.x + d*1.2,  c.y + d*0.25, c.z),
    };
    camera.position.copy(positions[viewKey] || positions.perspective);
    camera.lookAt(c);
    controls.target.copy(c);
    controls.update();
  }, [viewKey]);

  return null;
}

/* ── model with render modes ─────────────────────────────────────────────── */
function FloorModel({ objUrl, onLoaded, renderMode }) {
  const mtlUrl  = objUrl.replace(/\.obj$/i, '.mtl');
  let materials = null;
  try { materials = useLoader(MTLLoader, mtlUrl); } catch {}

  const obj = useLoader(OBJLoader, objUrl, (loader) => {
    if (materials) { materials.preload(); loader.setMaterials(materials); }
  });

  // Convert OBJ from Z-up to Three.js Y-up, then centre the loaded geometry at ground level.
  useEffect(() => {
    if (!obj) return;
    obj.rotation.set(-Math.PI / 2, 0, 0);
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const c   = box.getCenter(new THREE.Vector3());
    obj.position.set(-c.x, -box.min.y, -c.z);
    obj.updateMatrixWorld(true);
    onLoaded?.(obj);
  }, [obj]);

  useEffect(() => {
    if (!obj) return;
    obj.traverse((child) => {
      if (!child.isMesh) return;
      if (renderMode === 'wireframe') {
        child.material = new THREE.MeshBasicMaterial({ color: '#60a5fa', wireframe: true });
        child.castShadow = child.receiveShadow = false;
      } else if (renderMode === 'xray') {
        child.material = new THREE.MeshStandardMaterial({
          color: '#93c5fd', transparent: true, opacity: 0.20,
          roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false,
        });
        child.castShadow = child.receiveShadow = false;
      } else {
        if (child.material?.name && materials) {
          child.material.roughness   = 0.5;
          child.material.metalness   = 0.06;
          child.material.side        = THREE.DoubleSide;
          child.material.transparent = false;
          child.material.opacity     = 1;
          child.material.wireframe   = false;
          child.material.needsUpdate = true;
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: '#3b82f6', roughness: 0.5, metalness: 0.06, side: THREE.DoubleSide,
          });
        }
        child.castShadow = child.receiveShadow = true;
      }
    });
  }, [obj, renderMode]);

  return <primitive object={obj} />;
}

/* ── scene ───────────────────────────────────────────────────────────────── */
function Scene({ objUrl, viewKey, onReady, autoRotate, showAxes, showDims, renderMode, onInfo, rooms }) {
  const [model,     setModel]     = useState(null);
  const [sceneInfo, setSceneInfo] = useState(null);

  const handleInfo = useCallback((info) => { setSceneInfo(info); onInfo?.(info); }, [onInfo]);

  return (
    <>
      <color attach="background" args={['#07101f']} />
      <fog attach="fog" args={['#07101f', 90, 300]} />

      <ambientLight intensity={0.32} color="#b8ccff" />
      <directionalLight position={[30,55,30]} intensity={2.0} color="#fff8f0" castShadow
        shadow-mapSize={[2048,2048]} shadow-camera-near={0.5} shadow-camera-far={300}
        shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70}
        shadow-bias={-0.0004} />
      <directionalLight position={[-30,35,-20]} intensity={0.55} color="#4070ff" />
      <directionalLight position={[0,12,-45]}   intensity={0.28} color="#90b8ff" />
      <hemisphereLight args={['#e6f2ff','#07101f',0.35]} />
      <spotLight position={[24, 55, 16]} angle={0.22} intensity={2.2} penumbra={0.45} color="#f6f3ea" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0005} />
      <spotLight position={[-26, 38, -12]} angle={0.28} intensity={0.8} penumbra={0.55} color="#7ea8ff" />
      <Environment preset="studio" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[280, 280]} />
        <meshStandardMaterial color="#091124" roughness={0.95} metalness={0.05} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.35, 8.4, 64]} />
        <meshStandardMaterial color="#1f3a68" opacity={0.24} transparent />
      </mesh>

      <Grid position={[0,-0.08,0]} args={[320,320]}
        cellSize={1} cellThickness={0.18} cellColor="#0d1a33"
        sectionSize={8} sectionThickness={0.65} sectionColor="#1a3b67"
        fadeDistance={110} fadeStrength={1.6} infiniteGrid />

      {renderMode === 'solid' && (
        <ContactShadows position={[0,-0.07,0]} opacity={0.55} scale={150} blur={2.8} far={12} color="#0a1830" />
      )}

      <Suspense fallback={null}>
        <FloorModel objUrl={objUrl} onLoaded={setModel} renderMode={renderMode} />
        {model && (
          <>
            <CameraController target={model} viewKey={viewKey} onReady={onReady} onInfo={handleInfo} />
            {(showAxes || showDims) && sceneInfo && <CoordinateSystem info={sceneInfo} />}
            <RoomLabels rooms={rooms} />
          </>
        )}
      </Suspense>

      <OrbitControls makeDefault enablePan enableZoom enableRotate
        autoRotate={autoRotate} autoRotateSpeed={0.4}
        dampingFactor={0.07} enableDamping />
    </>
  );
}

/* ── loading overlay ─────────────────────────────────────────────────────── */
function LoadingOverlay({ visible }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', background: '#07101f', zIndex: 10 }}>
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-2xl" style={{ border: '1px solid rgba(37,99,235,.3)' }} />
        <div className="absolute inset-2 rounded-xl animate-pulse" style={{ border: '1px solid rgba(59,130,246,.4)' }} />
        <div className="absolute inset-4 rounded-lg" style={{ border: '1px solid rgba(96,165,250,.5)', animation: 'spin 3s linear infinite' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full animate-ping" style={{ background: '#60a5fa' }} />
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <p style={{ color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>Building 3D Model</p>
        <p style={{ color: '#1e3a5f', fontSize: '0.72rem', fontFamily: 'Consolas,monospace' }}>Extruding walls · Applying materials</p>
      </div>
    </div>
  );
}

/* ── toolbar button ──────────────────────────────────────────────────────── */
const TBtn = ({ active, onClick, children, title }) => (
  <button onClick={onClick} title={title}
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
    style={{
      background: active ? 'rgba(37,99,235,.92)' : 'rgba(7,16,31,.84)',
      color: active ? 'white' : '#93c5fd',
      border: `1px solid ${active ? '#3b82f6' : 'rgba(30,58,95,.8)'}`,
      backdropFilter: 'blur(10px)',
    }}>
    {children}
  </button>
);

/* ── compass ─────────────────────────────────────────────────────────────── */
const Compass = () => (
  <div style={{
    position:'absolute', bottom:56, right:16, width:52, height:52,
    background:'rgba(7,16,31,.88)', border:'1px solid rgba(30,58,95,.8)',
    borderRadius:'50%', backdropFilter:'blur(10px)',
    display:'flex', alignItems:'center', justifyContent:'center',
  }}>
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(30,58,95,.8)" strokeWidth="1"/>
      <polygon points="18,4 21,18 18,16 15,18" fill="#ef4444" opacity=".9"/>
      <polygon points="18,32 21,18 18,20 15,18" fill="rgba(147,197,253,.5)"/>
      <text x="18" y="3"  textAnchor="middle" fill="#f87171" fontSize="5" fontWeight="700" fontFamily="monospace">N</text>
      <text x="18" y="35" textAnchor="middle" fill="#93c5fd" fontSize="5" fontWeight="700" fontFamily="monospace">S</text>
      <text x="2"  y="19" textAnchor="middle" fill="#93c5fd" fontSize="5" fontWeight="700" fontFamily="monospace">W</text>
      <text x="34" y="19" textAnchor="middle" fill="#93c5fd" fontSize="5" fontWeight="700" fontFamily="monospace">E</text>
      <circle cx="18" cy="18" r="2" fill="white" opacity=".6"/>
    </svg>
  </div>
);

/* ── render mode icons ───────────────────────────────────────────────────── */
const RENDER_MODES = [
  { key: 'solid',     label: 'Solid',     icon: '◼' },
  { key: 'wireframe', label: 'Wire',      icon: '⬡' },
  { key: 'xray',      label: 'X-Ray',     icon: '◻' },
];

const VIEWS = {
  perspective: { label: '3D',    icon: '⬡' },
  top:         { label: 'Top',   icon: '⊙' },
  front:       { label: 'Front', icon: '▭' },
  side:        { label: 'Side',  icon: '▯' },
};

/* ── main component ──────────────────────────────────────────────────────── */
export default function ThreeDViewer({ isLoading, previewUrl, canvasRef, rooms }) {
  const [view,        setView]        = useState('perspective');
  const [renderMode,  setRenderMode]  = useState('solid');
  const [modelReady,  setModelReady]  = useState(false);
  const [autoRotate,  setAutoRotate]  = useState(false);
  const [showAxes,    setShowAxes]    = useState(true);
  const [showDims,    setShowDims]    = useState(true);
  const [sceneInfo,   setSceneInfo]   = useState(null);

  const handleReady = useCallback(() => setTimeout(() => setModelReady(true), 400), []);

  useEffect(() => {
    setModelReady(false);
    setView('perspective');
    setRenderMode('solid');
    setSceneInfo(null);
  }, [previewUrl]);

  const isOBJ = previewUrl?.endsWith('.obj');

  return (
    <div className="relative w-full overflow-hidden"
      style={{ height: 540, borderRadius: 'var(--radius-xl)', background: '#07101f' }}>

      <LoadingOverlay visible={isLoading || (isOBJ && !modelReady)} />

      {isOBJ && (
        <Canvas shadows
          gl={{ antialias: true, preserveDrawingBuffer: true,
                toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15,
                outputColorSpace: THREE.SRGBColorSpace }}
          camera={{ fov: 42, near: 0.1, far: 1000 }}
          ref={canvasRef}
          style={{ opacity: modelReady ? 1 : 0, transition: 'opacity .8s ease' }}>
          <Scene objUrl={previewUrl} viewKey={view} onReady={handleReady}
            autoRotate={autoRotate} showAxes={showAxes} showDims={showDims}
            renderMode={renderMode} onInfo={setSceneInfo} rooms={rooms} />
        </Canvas>
      )}

      {!isOBJ && previewUrl && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '1.5rem', background: '#07101f' }}>
          <img
            src={previewUrl}
            alt="Floor plan"
            draggable="false"
            decoding="async"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '1rem',
              background: '#020817',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.35)',
              imageRendering: 'auto',
            }}
          />
        </div>
      )}

      {!isLoading && !previewUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ border: '1px solid rgba(30,58,95,.8)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#1e3a5f' }}>Upload a floor plan to generate a 3D model</p>
        </div>
      )}

      {isOBJ && modelReady && (
        <>
          {/* Top-left: view presets */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {Object.entries(VIEWS).map(([key, { label, icon }]) => (
              <TBtn key={key} active={view === key} onClick={() => setView(key)} title={`${label} view`}>
                <span style={{ fontSize: '0.65rem' }}>{icon}</span>{label}
              </TBtn>
            ))}
          </div>

          {/* Second row left: render modes */}
          <div className="absolute flex gap-1.5" style={{ top: 44, left: 12 }}>
            {RENDER_MODES.map(({ key, label, icon }) => (
              <TBtn key={key} active={renderMode === key} onClick={() => setRenderMode(key)} title={`${label} mode`}>
                <span style={{ fontSize: '0.65rem' }}>{icon}</span>{label}
              </TBtn>
            ))}
          </div>

          {/* Top-right: toggles */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <TBtn active={showAxes} onClick={() => setShowAxes(v => !v)} title="Toggle axes">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <line x1="1" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="10" x2="1"  y2="1"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="10" x2="5"  y2="6"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Axes
            </TBtn>
            <TBtn active={showDims} onClick={() => setShowDims(v => !v)} title="Toggle dimensions">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="3"   x2="1"  y2="8"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="10" y1="3"  x2="10" y2="8"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Dims
            </TBtn>
            <TBtn active={autoRotate} onClick={() => setAutoRotate(v => !v)} title="Toggle auto-rotation">
              {autoRotate ? '⏸' : '▶'} Auto
            </TBtn>
          </div>

          {/* Bottom-left: legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(7,16,31,.88)', border: '1px solid rgba(30,58,95,.8)', backdropFilter: 'blur(10px)', maxWidth: 380 }}>
            {[['#2d6be4','Outer wall'],['#8cb8f7','Inner wall'],['#dbeafe','Floor'],
              ['#ef4444','X'],['#22c55e','Y'],['#3b82f6','Z'],['#fbbf24','Dims']].map(([col, lbl]) => (
              <div key={lbl} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: col }} />
                <span style={{ fontSize: '0.65rem', color: '#93c5fd' }}>{lbl}</span>
              </div>
            ))}
          </div>

          {/* Bottom-right: controls hint */}
          <div className="absolute flex gap-3 px-3 py-2 rounded-xl"
            style={{ bottom: 12, right: 76, background: 'rgba(7,16,31,.88)', border: '1px solid rgba(30,58,95,.8)', backdropFilter: 'blur(10px)' }}>
            {[['Drag','Rotate'],['Scroll','Zoom'],['R-drag','Pan']].map(([k, a]) => (
              <div key={k} className="flex items-center gap-1">
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6' }}>{k}</span>
                <span style={{ fontSize: '0.65rem', color: '#2d4a7a' }}>{a}</span>
              </div>
            ))}
          </div>

          {/* Compass */}
          <Compass />

          {/* Dimensions readout */}
          {showDims && sceneInfo && (
            <div className="absolute px-3 py-2 rounded-xl"
              style={{ top: 80, left: 12, background: 'rgba(7,16,31,.88)', border: '1px solid rgba(30,58,95,.8)', backdropFilter: 'blur(10px)' }}>
              <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1e3a5f', marginBottom: 4 }}>Bounding Box</p>
              {[['W', sceneInfo.size.x],['D', sceneInfo.size.z],['H', sceneInfo.size.y]].map(([l, v]) => (
                <div key={l} className="flex items-center gap-2">
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24', width: 12 }}>{l}</span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'Consolas,monospace', color: '#93c5fd' }}>{v.toFixed(2)} m</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
