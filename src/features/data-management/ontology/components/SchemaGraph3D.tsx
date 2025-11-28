import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { 
  OrbitControls, 
  Text, 
  PerspectiveCamera, 
  GizmoHelper, 
  GizmoViewport, 
  Line as DreiLine,
  Sphere
} from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
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

// 3D 노드 컴포넌트 (고품질 발광 효과)
function Node3D({ 
  node, 
  onClick 
}: { 
  node: GraphNode; 
  onClick: (node: GraphNode) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
      meshRef.current.position.x = node.x;
      meshRef.current.position.y = node.y;
      meshRef.current.position.z = node.z;
      
      // 미묘한 펄스 애니메이션
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + node.id.length) * 0.05;
      meshRef.current.scale.setScalar(pulse);
    }
    
    if (glowRef.current && node.x !== undefined) {
      glowRef.current.position.x = node.x;
      glowRef.current.position.y = node.y || 0;
      glowRef.current.position.z = node.z || 0;
      
      // 글로우 펄스
      const glowPulse = 1 + Math.sin(state.clock.elapsedTime * 3 + node.id.length) * 0.1;
      glowRef.current.scale.setScalar(glowPulse);
    }
  });

  const radius = node.val / 6;
  const color = new THREE.Color(node.color);
  
  // 연결 수에 따라 밝기 조정
  const connectionIntensity = Math.min(node.val / 40, 1);

  return (
    <group>
      {/* 외부 글로우 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 2.5, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={hovered ? 0.3 : 0.15 * connectionIntensity}
          depthWrite={false}
        />
      </mesh>
      
      {/* 메인 노드 */}
      <mesh
        ref={meshRef}
        onClick={() => onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.5 : 0.8}
          metalness={0.6}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {/* 내부 코어 */}
      <mesh position={[node.x || 0, node.y || 0, node.z || 0]}>
        <sphereGeometry args={[radius * 0.6, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* 노드 라벨 - 호버 시에만 표시 */}
      {hovered && (
        <>
          <Text
            position={[node.x || 0, (node.y || 0) + radius + 3, node.z || 0]}
            fontSize={1.8}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.15}
            outlineColor="#000000"
            fontWeight="bold"
          >
            {node.label}
          </Text>
          
          {/* 속성 개수 표시 */}
          {node.properties.length > 0 && (
            <Text
              position={[node.x || 0, (node.y || 0) + radius + 5, node.z || 0]}
              fontSize={1.2}
              color="#aaaaaa"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {node.properties.length} properties
            </Text>
          )}
        </>
      )}
    </group>
  );
}

// 3D 링크 컴포넌트 (그라데이션 효과)
function Link3D({ link }: { link: GraphLink }) {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;
  
  const points = useMemo(() => [
    [source.x || 0, source.y || 0, source.z || 0] as [number, number, number],
    [target.x || 0, target.y || 0, target.z || 0] as [number, number, number],
  ], [source.x, source.y, source.z, target.x, target.y, target.z]);

  const intensity = Math.min(link.weight, 1.0);

  // 가중치에 따른 색상 변화 (청록색~초록색 그라데이션)
  const sourceColor = useMemo(() => {
    const hue = 180 + (intensity * 40); // 180 (cyan) ~ 220 (cyan-green)
    return new THREE.Color().setHSL(hue / 360, 0.8, 0.5 + intensity * 0.2);
  }, [intensity]);
  
  const targetColor = useMemo(() => {
    const hue = 120 + (intensity * 60); // 120 (green) ~ 180 (cyan)
    return new THREE.Color().setHSL(hue / 360, 0.7, 0.4 + intensity * 0.2);
  }, [intensity]);

  const lineWidth = 0.5 + (link.weight * 2);
  const opacity = 0.4 + intensity * 0.4;

  return (
    <group>
      {/* 메인 라인 */}
      <DreiLine
        points={points}
        color={sourceColor}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
      />
      
      {/* 글로우 효과 라인 */}
      <DreiLine
        points={points}
        color={targetColor}
        lineWidth={lineWidth * 2}
        transparent
        opacity={opacity * 0.3}
      />
      
      {/* 방향 화살표 - 더 작고 미묘하게 */}
      {link.directionality === 'bidirectional' && (
        <>
          <mesh position={[target.x || 0, target.y || 0, target.z || 0]}>
            <coneGeometry args={[0.3, 1, 6]} />
            <meshBasicMaterial color={targetColor} transparent opacity={opacity} />
          </mesh>
          <mesh position={[source.x || 0, source.y || 0, source.z || 0]}>
            <coneGeometry args={[0.3, 1, 6]} />
            <meshBasicMaterial color={sourceColor} transparent opacity={opacity} />
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
      {/* 다크 배경 */}
      <color attach="background" args={['#0a0a0f']} />
      <fog attach="fog" args={['#0a0a0f', 50, 300]} />
      
      {/* 고급 조명 설정 */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#4080ff" />
      <pointLight position={[50, 50, 50]} intensity={0.5} color="#00ffaa" />
      <pointLight position={[-50, -50, -50]} intensity={0.5} color="#ff00aa" />
      <spotLight 
        position={[0, 100, 0]} 
        intensity={0.8} 
        angle={0.5} 
        penumbra={1}
        color="#ffffff"
        castShadow
      />

      {/* 링크 렌더링 (노드보다 먼저) */}
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

      {/* 미묘한 그리드 (선택적) */}
      <gridHelper args={[300, 30, "#1a1a2e", "#0f0f1a"]} position={[0, -50, 0]} />
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
    <div style={{ width: "100%", height: "600px", background: "#0a0a0f" }}>
      <Canvas shadows gl={{ antialias: true, alpha: false }}>
        <PerspectiveCamera makeDefault position={[0, 0, 150]} fov={75} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.08}
          minDistance={30}
          maxDistance={400}
          maxPolarAngle={Math.PI}
          autoRotate
          autoRotateSpeed={0.3}
        />
        
        <Scene 
          nodes={nodes} 
          links={links} 
          onNodeClick={onNodeClick}
          layoutType={layoutType}
        />

        {/* 후처리 효과 - Bloom으로 발광 효과 */}
        <EffectComposer>
          <Bloom 
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            height={300}
            opacity={1}
          />
          <DepthOfField 
            focusDistance={0.02}
            focalLength={0.05}
            bokehScale={3}
          />
        </EffectComposer>

        {/* Gizmo (축 표시) */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport 
            axisColors={['#ff4444', '#44ff44', '#4444ff']} 
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
