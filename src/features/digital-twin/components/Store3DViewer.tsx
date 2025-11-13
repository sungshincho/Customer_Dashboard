import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Grid } from '@react-three/drei';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';

interface Store3DViewerProps {
  height?: string;
  showControls?: boolean;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export function Store3DViewer({ height = "500px", showControls = true }: Store3DViewerProps) {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStoreModel();
  }, [user, selectedStore]);

  const loadStoreModel = async () => {
    if (!user || !selectedStore) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // List all files in the store's 3d-models folder
      const { data: files, error: listError } = await supabase.storage
        .from('3d-models')
        .list(`${user.id}/${selectedStore.id}/3d-models`);

      if (listError) throw listError;

      // Find the first GLB or GLTF file
      const modelFile = files?.find(file => 
        file.name.toLowerCase().endsWith('.glb') || 
        file.name.toLowerCase().endsWith('.gltf')
      );

      if (!modelFile) {
        setError('이 매장에 업로드된 3D 모델이 없습니다');
        setLoading(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('3d-models')
        .getPublicUrl(`${user.id}/${selectedStore.id}/3d-models/${modelFile.name}`);

      setModelUrl(publicUrl);
    } catch (err) {
      console.error('Error loading 3D model:', err);
      setError('3D 모델 로드 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStore) {
    return (
      <Card className="p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            매장을 선택하면 3D 모델이 표시됩니다
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-4 flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">3D 모델 로드 중...</p>
        </div>
      </Card>
    );
  }

  if (error || !modelUrl) {
    return (
      <Card className="p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || '3D 모델을 찾을 수 없습니다'}
            <br />
            <span className="text-xs mt-1 block">
              3D 데이터 설정 페이지에서 모델을 업로드하세요
            </span>
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" style={{ height }}>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        style={{ background: '#f8f9fa' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* 3D Model */}
          <Model url={modelUrl} />

          {/* Grid */}
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#3b82f6"
            fadeDistance={25}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />

          {/* Environment */}
          <Environment preset="city" />

          {/* Controls */}
          {showControls && (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={50}
            />
          )}
        </Suspense>
      </Canvas>
      
      {showControls && (
        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded text-xs text-muted-foreground">
          마우스로 회전 • 스크롤로 확대/축소
        </div>
      )}
    </Card>
  );
}
