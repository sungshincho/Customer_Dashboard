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

export interface PropertyField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export type NodeType = "entity" | "property" | "relation" | "other";

export interface GraphNode {
  id: string;
  name: string;
  label: string;
  color: string;
  properties: PropertyField[];
  val: number;
  nodeType?: NodeType; // 엔티티 / 속성 / 관계 레이어 구분용
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  color: string;
  properties: PropertyField[];
  directionality: string;
  weight: number;
}

export interface SchemaGraph3DProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode) => void;
  layoutType?: "force" | "radial" | "hierarchical" | "layered";
}

/** ===================== 공통 유틸 & 레이아웃 ===================== **/

/**
 * Normalizes node positions to fit within a target box size and centers them at origin
 */
function normalizeAndCenter(nodes: GraphNode[], targetSize: number) {
  if (!nodes.length) return;

  // Find bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  nodes.forEach((n) => {
    if (n.x !== undefined) {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
    }
    if (n.y !== undefined) {
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    }
    if (n.z !== undefined) {
      minZ = Math.min(minZ, n.z);
      maxZ = Math.max(maxZ, n.z);
    }
  });

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const rangeZ = maxZ - minZ || 1;
  const maxRange = Math.max(rangeX, rangeY, rangeZ);

  // Scale factor to fit within targetSize
  const scale = maxRange > 0 ? targetSize / maxRange : 1;

  // Center of current bounding box
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Normalize and center all nodes
  nodes.forEach((n) => {
    if (n.x !== undefined) n.x = (n.x - centerX) * scale;
    if (n.y !== undefined) n.y = (n.y - centerY) * scale;
    if (n.z !== undefined) n.z = (n.z - centerZ) * scale;
  });
}

function useForceSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  layoutType: "force" | "radial" | "hierarchical" | "layered",
) {
  const [simulatedNodes, setSimulatedNodes] = useState<GraphNode[]>([]);
  const [simulatedLinks, setSimulatedLinks] = useState<GraphLink[]>([]);

  useEffect(() => {
    if (!nodes.length) {
      setSimulatedNodes([]);
      setSimulatedLinks([]);
      return;
    }

    // 초기 분산은 그대로 두어도 됨 (원래 코드)
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

    /** ---- 레이어 레이아웃 (엔티티 / 속성 / 관계) ---- **/
    if (layoutType === "layered") {
      const typeOrder: NodeType[] = ["entity", "property", "relation", "other"];
      const activeTypes = typeOrder.filter((t) => nodesCopy.some((n) => (n.nodeType ?? "entity") === t));

      const xSpacing = 35;
      const ySpacing = 8;

      activeTypes.forEach((type, idx) => {
        const layerNodes = nodesCopy.filter((n) => (n.nodeType ?? "entity") === type);
        if (!layerNodes.length) return;

        const count = layerNodes.length;
        const mid = (count - 1) / 2;
        const xPos = (idx - (activeTypes.length - 1) / 2) * xSpacing;

        layerNodes.forEach((n, i) => {
          n.x = xPos;
          n.y = (i - mid) * ySpacing;
          n.z = (Math.random() - 0.5) * 12;
        });
      });

      // 🔹 레이어 레이아웃 결과를 항상 동일 크기로 맞춰줌
      normalizeAndCenter(nodesCopy, 110);

      setSimulatedNodes([...nodesCopy]);
      setSimulatedLinks([...linksCopy]);
      return;
    }

    /** ---- 방사형 레이아웃 ---- **/
    if (layoutType === "radial") {
      const angleStep = (2 * Math.PI) / nodesCopy.length;
      const radius = 60;
      nodesCopy.forEach((node, i) => {
        node.x = radius * Math.cos(i * angleStep);
        node.y = radius * Math.sin(i * angleStep);
        node.z = (Math.random() - 0.5) * 20;
      });

      normalizeAndCenter(nodesCopy, 110);

      setSimulatedNodes([...nodesCopy]);
      setSimulatedLinks([...linksCopy]);
      return;
    }

    /** ---- force / hierarchical 둘 다 D3 포스 사용 ---- **/
    const sim = forceSimulation(nodesCopy as any)
      .force(
        "link",
        forceLink(linksCopy as any)
          .id((d: any) => d.id)
          .distance(30) // 원래 35 → 살짝만 줄였음
          .strength(0.8),
      )
      .force("charge", forceManyBody().strength(layoutType === "hierarchical" ? -260 : -340))
      .force("center", forceCenter(0, 0))
      .force(
        "collision",
        forceCollide().radius((d: any) => Math.max(d.val / 4, 3)),
      );

    const TICKS = layoutType === "hierarchical" ? 200 : 260;
    for (let i = 0; i < TICKS; i++) sim.tick();
    sim.stop();

    // 깊이감은 적당히만
    nodesCopy.forEach((n, i) => {
      n.z = n.z ?? (Math.sin(i * 0.37) * 0.5 + (Math.random() - 0.5) * 0.5) * 40;
    });

    // 🔹 force/hierarchical 결과도 항상 같은 박스 크기로 축소 + 센터링
    normalizeAndCenter(nodesCopy, 110);

    setSimulatedNodes([...nodesCopy]);
    setSimulatedLinks([...linksCopy]);

    return () => {
      sim.stop();
    };
  }, [nodes, links, layoutType]);

  return { nodes: simulatedNodes, links: simulatedLinks };
}

/** ===================== 3D 요소들 ===================== **/

// 노드 3D – 글로우 / 코어 / 라벨 / 클릭&드래그
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
  const { camera } = useThree();

  const baseColor = useMemo(() => new THREE.Color(node.color || "#6ac8ff"), [node.color]);

  // val을 기반으로 노드 크기/밝기 결정
  const baseRadius = Math.max(node.val / 7, 1.2);
  const maxBoost = focused ? 1.5 : hovered ? 1.25 : 1;
  const radius = baseRadius * maxBoost;

  const connectionIntensity = Math.min(node.val / 40, 1); // 허브일수록 강함
  const baseOpacity = dimmed ? 0.5 : 1.0;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();

    if (!meshRef.current) return;
    const distance = camera.position.distanceTo(meshRef.current.position);
    const scale = distance / 100;

    const dx = e.movementX * scale * 0.5;
    const dy = -e.movementY * scale * 0.5;

    const newX = (node.x || 0) + dx;
    const newY = (node.y || 0) + dy;
    const newZ = node.z || 0;

    onDrag(node.id, newX, newY, newZ);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
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

      {/* 라벨 – 항상 표시 */}
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
    const baseHue = 190 + (link.weight || 0.4) * 40;
    return new THREE.Color().setHSL(baseHue / 360, 0.8, 0.6);
  }, [link.weight]);

  const width = 0.5 + intensity * 2.0;
  const opacity = (dimmed ? 0.4 : 0.75) * (isNeighborLink ? 1.2 : 1.0);

  const midPoint = useMemo(
    () =>
      [
        (source.x || 0) * 0.5 + (target.x || 0) * 0.5,
        (source.y || 0) * 0.5 + (target.y || 0) * 0.5,
        (source.z || 0) * 0.5 + (target.z || 0) * 0.5,
      ] as [number, number, number],
    [source.x, source.y, source.z, target.x, target.y, target.z],
  );

  return (
    <group>
      <DreiLine points={points} color={color} lineWidth={width} transparent opacity={opacity} />

      {/* 관계 라벨 */}
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

      {/* 방향 화살표 */}
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

// 배경 파티클 – 전체 네뷸라 느낌 (배경색은 투명)
function BackgroundParticles({ count = 800 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 120 * Math.pow(Math.random(), 0.7);
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

/** 레이어 패널 (엔티티 / 속성 / 관계) **/
function LayerPanels({ nodes }: { nodes: GraphNode[] }) {
  const layers = useMemo(() => {
    const groups = new Map<NodeType, GraphNode[]>();

    nodes.forEach((n) => {
      const type = n.nodeType ?? "entity";
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(n);
    });

    const entries: {
      type: NodeType;
      x: number;
      minY: number;
      maxY: number;
      color: string;
      label: string;
    }[] = [];

    const labelByType: Record<NodeType, string> = {
      entity: "Entities",
      property: "Properties",
      relation: "Relations",
      other: "Other",
    };

    const colorByType: Record<NodeType, string> = {
      entity: "#3b82f6",
      property: "#22c55e",
      relation: "#eab308",
      other: "#a855f7",
    };

    (["entity", "property", "relation", "other"] as NodeType[]).forEach((type) => {
      const group = groups.get(type);
      if (!group || !group.length) return;

      const xs = group.map((n) => n.x ?? 0);
      const ys = group.map((n) => n.y ?? 0);
      const x = xs.reduce((a, b) => a + b, 0) / xs.length;
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      entries.push({
        type,
        x,
        minY,
        maxY,
        color: colorByType[type],
        label: labelByType[type],
      });
    });

    return entries;
  }, [nodes]);

  return (
    <>
      {layers.map((layer) => {
        const height = (layer.maxY - layer.minY || 40) + 30;
        const centerY = (layer.maxY + layer.minY) / 2;
        const width = 35;

        return (
          <group key={layer.type}>
            {/* 반투명 패널 */}
            <mesh position={[layer.x, centerY, -5]}>
              <planeGeometry args={[width, height]} />
              <meshBasicMaterial color={layer.color} transparent opacity={0.08} />
            </mesh>

            {/* 레이어 라벨 */}
            <Text
              position={[layer.x, layer.maxY + 10, -4.9]}
              fontSize={2.2}
              color={layer.color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.4}
              outlineColor="#000000"
            >
              {layer.label}
            </Text>
          </group>
        );
      })}
    </>
  );
}

/** ===================== Scene & 메인 컴포넌트 ===================== **/

function Scene({ nodes, links, onNodeClick, layoutType }: SchemaGraph3DProps) {
  const { camera } = useThree();

  const { nodes: simNodes, links: simLinks } = useForceSimulation(nodes, links, layoutType);

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [draggedNodes, setDraggedNodes] = useState<Map<string, { x: number; y: number; z: number }>>(new Map());

  useEffect(() => {
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

  // 드래그된 위치 반영
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
      {/* 투명 캔버스 + 조명 */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[40, 40, 80]} intensity={1.0} color="#d0ffff" />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#7fe8ff" />
      <pointLight position={[-60, -40, -60]} intensity={0.5} color="#2050ff" />

      {/* 네뷸라 파티클 */}
      <BackgroundParticles count={900} />

      {/* 레이어 패널 (layered 모드일 때) */}
      {layoutType === "layered" && <LayerPanels nodes={displayNodes} />}

      {/* 링크 → 노드 순으로 렌더 */}
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
        const dimmed = !!focusedId && !isFocused && !isNeighbor;

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
        // 배경색 없음 → 상위 레이아웃 배경이 그대로 비침
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true, // 투명 캔버스
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
