import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html, PerspectiveCamera, Environment, GizmoHelper, GizmoViewport, Line as DreiLine } from "@react-three/drei";
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

// 3D 노드 컴포넌트
function Node3D({ 
  node, 
  onClick 
}: { 
  node: GraphNode; 
  onClick: (node: GraphNode) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
      meshRef.current.position.x = node.x;
      meshRef.current.position.y = node.y;
      meshRef.current.position.z = node.z;
    }
  });

  const radius = node.val / 8;
  const scale = hovered ? 1.2 : 1;

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={() => onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={scale}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial 
          color={node.color} 
          emissive={node.color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* 노드 라벨 */}
      <Text
        position={[node.x || 0, (node.y || 0) + radius + 2, node.z || 0]}
        fontSize={1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        {node.label}
      </Text>
      
      {/* 속성 개수 표시 */}
      {node.properties.length > 0 && (
        <Text
          position={[node.x || 0, (node.y || 0) + radius + 3.5, node.z || 0]}
          fontSize={1}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          {node.properties.length} props
        </Text>
      )}
      
      {/* 호버 시 인터랙션 표시 */}
      {hovered && (
        <mesh position={[node.x || 0, node.y || 0, node.z || 0]}>
          <sphereGeometry args={[radius * 1.3, 32, 32]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}

// 3D 링크 컴포넌트
function Link3D({ link }: { link: GraphLink }) {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;
  
  const points = useMemo(() => [
    [source.x || 0, source.y || 0, source.z || 0] as [number, number, number],
    [target.x || 0, target.y || 0, target.z || 0] as [number, number, number],
  ], [source.x, source.y, source.z, target.x, target.y, target.z]);

  const intensity = Math.min(link.weight, 1.0);

  // 가중치에 따른 색상 (HSL)
  const hue = 239;
  const saturation = 84;
  const lightness = 70 - intensity * 20;
  const opacity = 0.5 + intensity * 0.5;
  const color = useMemo(() => new THREE.Color().setHSL(hue / 360, saturation / 100, lightness / 100), [intensity]);
  const lineWidth = 1 + (link.weight * 3);

  return (
    <group>
      <DreiLine
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
      />
      
      {/* 링크 라벨 */}
      <Text
        position={[
          ((source.x || 0) + (target.x || 0)) / 2,
          ((source.y || 0) + (target.y || 0)) / 2,
          ((source.z || 0) + (target.z || 0)) / 2,
        ]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor={color}
      >
        {`${link.label} [${link.weight.toFixed(1)}]`}
      </Text>

      {/* 방향 화살표 (양방향일 경우) */}
      {link.directionality === 'bidirectional' && (
        <>
          <mesh position={[target.x || 0, target.y || 0, target.z || 0]}>
            <coneGeometry args={[0.5, 1.5, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh position={[source.x || 0, source.y || 0, source.z || 0]}>
            <coneGeometry args={[0.5, 1.5, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </>
      )}
    </group>
  );
}

// 포스 시뮬레이션 훅
function useForceSimulation(
  nodes: GraphNode[], 
  links: GraphLink[], 
  layoutType: "force" | "radial" | "hierarchical"
) {
  const [simulatedNodes, setSimulatedNodes] = useState<GraphNode[]>([]);
  const [simulatedLinks, setSimulatedLinks] = useState<GraphLink[]>([]);

  useEffect(() => {
    if (nodes.length === 0) return;

    // 노드 복사 (뮤테이션 방지)
    const nodesCopy = nodes.map(n => ({ 
      ...n, 
      x: n.x || Math.random() * 100 - 50,
      y: n.y || Math.random() * 100 - 50,
      z: n.z || Math.random() * 100 - 50,
    }));

    // 링크 복사
    const linksCopy = links.map(l => ({
      ...l,
      source: nodesCopy.find(n => n.id === (typeof l.source === 'string' ? l.source : l.source.id))!,
      target: nodesCopy.find(n => n.id === (typeof l.target === 'string' ? l.target : l.target.id))!,
    }));

    // 레이아웃 타입에 따른 시뮬레이션 설정
    let simulation;
    
    if (layoutType === "radial") {
      // 방사형 레이아웃
      const angleStep = (2 * Math.PI) / nodesCopy.length;
      const radius = 50;
      nodesCopy.forEach((node, i) => {
        node.x = radius * Math.cos(i * angleStep);
        node.y = radius * Math.sin(i * angleStep);
        node.z = 0;
      });
      setSimulatedNodes(nodesCopy);
      setSimulatedLinks(linksCopy);
      return;
    } else if (layoutType === "hierarchical") {
      // 계층형 레이아웃
      simulation = forceSimulation(nodesCopy as any)
        .force("link", forceLink(linksCopy as any).id((d: any) => d.id).distance(30))
        .force("charge", forceManyBody().strength(-200))
        .force("center", forceCenter(0, 0))
        .force("collision", forceCollide().radius((d: any) => d.val / 4));
    } else {
      // Force 레이아웃 (3D)
      simulation = forceSimulation(nodesCopy as any)
        .force("link", forceLink(linksCopy as any).id((d: any) => d.id).distance(40))
        .force("charge", forceManyBody().strength(-400))
        .force("center", forceCenter(0, 0))
        .force("collision", forceCollide().radius((d: any) => d.val / 4));
    }

    // 시뮬레이션 실행
    simulation.on("tick", () => {
      setSimulatedNodes([...nodesCopy]);
      setSimulatedLinks([...linksCopy]);
    });

    // 약간의 틱 후 자동 정지
    simulation.tick(100);
    simulation.stop();

    return () => {
      simulation.stop();
    };
  }, [nodes, links, layoutType]);

  return { nodes: simulatedNodes, links: simulatedLinks };
}

// 메인 Scene 컴포넌트
function Scene({ 
  nodes, 
  links, 
  onNodeClick, 
  layoutType 
}: SchemaGraph3DProps) {
  const { camera } = useThree();
  const { nodes: simulatedNodes, links: simulatedLinks } = useForceSimulation(nodes, links, layoutType);

  useEffect(() => {
    // 카메라 초기 위치
    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <spotLight position={[0, 50, 0]} intensity={0.5} angle={0.3} penumbra={1} />

      {/* 링크 렌더링 */}
      {simulatedLinks.map((link, i) => (
        <Link3D key={`link-${i}`} link={link} />
      ))}

      {/* 노드 렌더링 */}
      {simulatedNodes.map((node) => (
        <Node3D 
          key={node.id} 
          node={node} 
          onClick={onNodeClick || (() => {})} 
        />
      ))}

      {/* 그리드 헬퍼 */}
      <gridHelper args={[200, 20, "#444444", "#222222"]} />
      
      {/* 축 헬퍼 */}
      <axesHelper args={[50]} />
    </>
  );
}

// 메인 3D 그래프 컴포넌트
export function SchemaGraph3D({ 
  nodes, 
  links, 
  onNodeClick,
  layoutType = "force"
}: SchemaGraph3DProps) {
  return (
    <div style={{ width: "100%", height: "600px", background: "hsl(var(--background))" }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 150]} fov={60} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={50}
          maxDistance={300}
          maxPolarAngle={Math.PI}
        />
        <Environment preset="city" />
        
        <Scene 
          nodes={nodes} 
          links={links} 
          onNodeClick={onNodeClick}
          layoutType={layoutType}
        />

        {/* Gizmo (축 표시) */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport 
            axisColors={['#ff0000', '#00ff00', '#0000ff']} 
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
