import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  PerspectiveCamera,
  GizmoHelper,
  GizmoViewport,
  Line as DreiLine,
} from "@react-three/drei";
import * as THREE from "three";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";

interface PropertyField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface GraphNode {
  id: string;
  name: string;
  label: string;
  color: string;
  properties: PropertyField[];
  val: number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  color: string;
  properties: PropertyField[];
  directionality: string;
  weight: number;
}

interface SchemaGraph3DProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode) => void;
  layoutType?: "force" | "radial" | "hierarchical";
}

/** ===================== 공통 유틸 & 레이아웃 ===================== **/

// 포스 시뮬레이션 훅 – 한 번 러닝해서 최종 위치만 사용 (깜빡임 방지)
function useForceSimulation(nodes: GraphNode[], links: GraphLink[], layoutType: "force" | "radial" | "hierarchical") {
  const [simulatedNodes, setSimulatedNodes] = useState<GraphNode[]>([]);
  const [simulatedLinks, setSimulatedLinks] = useState<GraphLink[]>([]);

  useEffect(() => {
    if (!nodes.length) {
      setSimulatedNodes([]);
      setSimulatedLinks([]);
      return;
    }

    // 노드/링크 복사 (원본 뮤테이션 방지)
    const nodesCopy: GraphNode[] = nodes.map((n) => ({
      ...n,
      x: n.x ?? (Math.random() - 0.5) * 80,
      y: n.y ?? (Math.random() - 0.5) * 80,
      z: n.z ?? (Math.random() - 0.5) * 80,
    }));

    const linksCopy: GraphLink[] = links.map((l) => ({
      ...l,
      source:
        typeof l.source === "string"
          ? nodesCopy.find((n) => n.id === l.source)!
          : nodesCopy.find((n) => n.id === (l.source as GraphNode).id)!,
      target:
        typeof l.target === "string"
          ? nodesCopy.find((n) => n.id === l.target)!
          : nodesCopy.find((n) => n.id === (l.target as GraphNode).id)!,
    }));

    if (layoutType === "radial") {
      const angleStep = (2 * Math.PI) / nodesCopy.length;
      const radius = 60;
      nodesCopy.forEach((node, i) => {
        node.x = radius * Math.cos(i * angleStep);
        node.y = radius * Math.sin(i * angleStep);
        node.z = (Math.random() - 0.5) * 10;
      });
      setSimulatedNodes([...nodesCopy]);
      setSimulatedLinks([...linksCopy]);
      return;
    }

    // force / hierarchical 둘 다 D3 포스 사용
    const sim = forceSimulation(nodesCopy as any)
      .force(
        "link",
        forceLink(linksCopy as any)
          .id((d: any) => d.id)
          .distance(35)
          .strength(0.8),
      )
      .force("charge", forceManyBody().strength(layoutType === "hierarchical" ? -220 : -420))
      .force("center", forceCenter(0, 0))
      .force(
        "collision",
        forceCollide().radius((d: any) => Math.max(d.val / 4, 3)),
      );

    // 적당한 틱 수만큼 돌린 뒤 정지
    const TICKS = layoutType === "hierarchical" ? 180 : 240;
    for (let i = 0; i < TICKS; i++) sim.tick();
    sim.stop();

    // 약간의 3D 깊이감
    nodesCopy.forEach((n, i) => {
      n.z = n.z ?? (Math.sin(i * 0.37) * 0.5 + (Math.random() - 0.5) * 0.5) * 80; // -40~40 근사
    });

    setSimulatedNodes([...nodesCopy]);
    setSimulatedLinks([...linksCopy]);

    return () => {
      sim.stop();
    };
  }, [nodes, links, layoutType]);

  return { nodes: simulatedNodes, links: simulatedLinks };
}

/** ===================== 3D 요소들 ===================== **/

// 노드 3D – 글로우 / 코어 / 라벨 / hover dim 처리
function Node3D({
  node,
  focused,
  dimmed,
  onClick,
  onDrag,
}: {
  node: GraphNode;
  focused: boolean;
  dimmed: boolean;
  onClick: (node: GraphNode) => void;
  onDrag: (nodeId: string, x: number, y: number, z: number) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster, pointer } = useThree();

  const baseColor = useMemo(() => new THREE.Color(node.color || "#6ac8ff"), [node.color]);

  // val을 기반으로 노드 크기/밝기 결정
  const baseRadius = Math.max(node.val / 7, 1.2);
  const maxBoost = focused ? 1.5 : hovered ? 1.25 : 1;
  const radius = baseRadius * maxBoost;

  const connectionIntensity = Math.min(node.val / 40, 1); // 허브일수록 강함
  const baseOpacity = dimmed ? 0.5 : 1.0; // 더 선명하게

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();

    // 카메라 거리에 따라 이동 스케일 조정
    const distance = camera.position.distanceTo(meshRef.current?.position || new THREE.Vector3());
    const scale = distance / 100;

    // 마우스 이동량을 3D 공간으로 변환
    const dx = e.movementX * scale * 0.5;
    const dy = -e.movementY * scale * 0.5;

    const newX = (node.x || 0) + dx;
    const newY = (node.y || 0) + dy;
    const newZ = node.z || 0;

    onDrag(node.id, newX, newY, newZ);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.position.set(node.x || 0, node.y || 0, node.z || 0);

      // 드래그 중이 아닐 때만 펄스 애니메이션
      if (!isDragging) {
        const pulse = 1 + (0.04 + connectionIntensity * 0.08) * Math.sin(t * 2.0 + node.id.length);
        meshRef.current.scale.setScalar(pulse);
      }
    }

    if (glowRef.current) {
      glowRef.current.position.set(node.x || 0, node.y || 0, node.z || 0);
      const glowPulse = 1 + (0.06 + connectionIntensity * 0.12) * Math.sin(t * 2.5 + node.id.length * 1.37);
      glowRef.current.scale.setScalar(glowPulse * (focused ? 1.4 : 1.0));
    }

    if (coreRef.current) {
      coreRef.current.position.set(node.x || 0, node.y || 0, node.z || 0);
    }
  });

  return (
    <group>
      {/* 외곽 글로우 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 2.8, 24, 24]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={(hovered || focused ? 0.6 : 0.35) * (0.5 + connectionIntensity * 0.8)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 메인 구체 */}
      <mesh
        ref={meshRef}
        onClick={() => !isDragging && onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={(focused ? 2.5 : hovered ? 2.0 : 1.3) * (0.8 + connectionIntensity * 0.6)}
          metalness={0.7}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={baseOpacity}
        />
      </mesh>

      {/* 안쪽 코어 */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[radius * 0.55, 20, 20]} />
        <meshBasicMaterial color={baseColor} transparent opacity={dimmed ? 0.5 : 0.8} />
      </mesh>

      {/* 라벨: 항상 표시 */}
      <Text
        position={[node.x || 0, (node.y || 0) + radius + 3, (node.z || 0) + 0.1]}
        fontSize={1.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.4}
        outlineColor="#000000"
      >
        {node.label}
      </Text>

      {node.properties?.length > 0 && (
        <Text
          position={[node.x || 0, (node.y || 0) + radius + 5, (node.z || 0) + 0.1]}
          fontSize={1.2}
          color="#a8b5d1"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.3}
          outlineColor="#000000"
        >
          {node.properties.length} properties
        </Text>
      )}
    </group>
  );
}

// 링크 3D – 허브 주변이 밝고 두껍게 보이도록
function Link3D({ link, dimmed, isNeighborLink }: { link: GraphLink; dimmed: boolean; isNeighborLink: boolean }) {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;

  const points = useMemo(
    () => [
      [source.x || 0, source.y || 0, source.z || 0] as [number, number, number],
      [target.x || 0, target.y || 0, target.z || 0] as [number, number, number],
    ],
    [source.x, source.y, source.z, target.x, target.y, target.z],
  );

  const weightNorm = Math.min(link.weight ?? 0.7, 2);
  const intensity = (isNeighborLink ? 1.0 : 0.6) * (0.6 + 0.4 * (weightNorm / 2));

  const color = useMemo(() => {
    // weight / 방향성에 따라 청록~연두 계열 - 더 밝게
    const baseHue = 190 + (link.weight || 0.4) * 40;
    return new THREE.Color().setHSL(baseHue / 360, 0.8, 0.6);
  }, [link.weight]);

  const width = 0.5 + intensity * 2.0;
  const opacity = (dimmed ? 0.4 : 0.75) * (isNeighborLink ? 1.2 : 1.0); // 항상 선명하게

  const midPoint = useMemo(
    () => [
      (source.x || 0) * 0.5 + (target.x || 0) * 0.5,
      (source.y || 0) * 0.5 + (target.y || 0) * 0.5,
      (source.z || 0) * 0.5 + (target.z || 0) * 0.5,
    ] as [number, number, number],
    [source.x, source.y, source.z, target.x, target.y, target.z],
  );

  return (
    <group>
      <DreiLine points={points} color={color} lineWidth={width} transparent opacity={opacity} />

      {/* 관계 라벨 - 항상 표시 */}
      <Text
        position={midPoint}
        fontSize={1.0}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.3}
        outlineColor="#000000"
      >
        {link.label}
      </Text>

      {/* 단방향/양방향 표시용 작은 화살표 */}
      {link.directionality !== "undirected" && (
        <mesh
          position={[
            (source.x || 0) * 0.6 + (target.x || 0) * 0.4,
            (source.y || 0) * 0.6 + (target.y || 0) * 0.4,
            (source.z || 0) * 0.6 + (target.z || 0) * 0.4,
          ]}
        >
          <coneGeometry args={[0.6, 1.6, 8]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * 1.2} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}

// 배경 파티클 – 전체 네뷸라 느낌을 강화
function BackgroundParticles({ count = 800 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 120 * Math.pow(Math.random(), 0.7); // 중심에 더 밀집
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.03;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.6} sizeAttenuation color="#5f7fb0" transparent opacity={0.25} depthWrite={false} />
    </points>
  );
}

/** ===================== Scene & 메인 컴포넌트 ===================== **/

function Scene({ nodes, links, onNodeClick, layoutType }: SchemaGraph3DProps) {
  const { camera } = useThree();

  const { nodes: simNodes, links: simLinks } = useForceSimulation(nodes, links, layoutType);

  // hover / focus 상태 관리
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [draggedNodes, setDraggedNodes] = useState<Map<string, { x: number; y: number; z: number }>>(new Map());

  useEffect(() => {
    // 카메라 초기 위치
    camera.position.set(0, 0, 160);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // 인접 노드/링크 계산
  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    simLinks.forEach((l) => {
      const s = (l.source as GraphNode).id;
      const t = (l.target as GraphNode).id;
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s)!.add(t);
      map.get(t)!.add(s);
    });
    return map;
  }, [simLinks]);

  const handleNodeClick = (n: GraphNode) => {
    setFocusedId((prev) => (prev === n.id ? null : n.id));
    onNodeClick?.(n);
  };

  const handleNodeDrag = (nodeId: string, x: number, y: number, z: number) => {
    setDraggedNodes((prev) => {
      const newMap = new Map(prev);
      newMap.set(nodeId, { x, y, z });
      return newMap;
    });
  };

  // 드래그된 위치를 반영한 노드 목록
  const displayNodes = useMemo(() => {
    return simNodes.map((node) => {
      const dragged = draggedNodes.get(node.id);
      if (dragged) {
        return { ...node, x: dragged.x, y: dragged.y, z: dragged.z };
      }
      return node;
    });
  }, [simNodes, draggedNodes]);

  return (
    <>
      {/* 조명 – 중심부는 살짝 밝게, 주변은 어둡게 */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[40, 40, 80]} intensity={1.0} color="#d0ffff" />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#7fe8ff" />
      <pointLight position={[-60, -40, -60]} intensity={0.5} color="#2050ff" />

      {/* 네뷸라 파티클 */}
      <BackgroundParticles count={900} />

      {/* 링크 → 노드 순서로 렌더 */}
      {simLinks.map((link, i) => {
        const s = (link.source as GraphNode).id;
        const t = (link.target as GraphNode).id;

        const isNeighborLink = !focusedId || s === focusedId || t === focusedId;
        const dimmed = !!focusedId && !isNeighborLink;

        return <Link3D key={`link-${i}-${s}-${t}`} link={link} dimmed={dimmed} isNeighborLink={isNeighborLink} />;
      })}

      {displayNodes.map((node) => {
        const isFocused = focusedId === node.id;
        const neighbors = neighborMap.get(focusedId || "") ?? new Set();
        const isNeighbor = neighbors.has(node.id);
        const dimmed = !!focusedId && !isFocused && !isNeighbor; // 초점 밖은 살짝 어둡게

        return (
          <Node3D
            key={node.id}
            node={node}
            focused={isFocused}
            dimmed={dimmed}
            onClick={handleNodeClick}
            onDrag={handleNodeDrag}
          />
        );
      })}
    </>
  );
}

export function SchemaGraph3D({ nodes, links, onNodeClick, layoutType = "force" }: SchemaGraph3DProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "650px",
        borderRadius: "0.75rem",
        overflow: "hidden",
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 160]} fov={70} />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={60}
          maxDistance={320}
          autoRotate
          autoRotateSpeed={0.35}
        />

        <Scene nodes={nodes} links={links} onNodeClick={onNodeClick} layoutType={layoutType} />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={["#ff5555", "#55ff99", "#5599ff"]} labelColor="#ffffff" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
