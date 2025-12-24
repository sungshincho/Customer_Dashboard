/**
 * useEnvironmentModels.ts
 *
 * Storage의 environment 폴더에서 GLB 모델을 로드
 * - 레이어 UI에 표시되지 않음
 * - 렌더씬(조명/포스트프로세싱) 영향 없이 baked 텍스처로 표시
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnvironmentModel {
  url: string;
  name: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isBaked?: boolean;
}

interface UseEnvironmentModelsOptions {
  userId?: string;
  storeId?: string;
  enabled?: boolean;
}

export function useEnvironmentModels({
  userId,
  storeId,
  enabled = true,
}: UseEnvironmentModelsOptions) {
  const [models, setModels] = useState<EnvironmentModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId || !storeId) {
      setModels([]);
      return;
    }

    const loadEnvironmentModels = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // environment 폴더의 파일 목록 조회
        const basePath = `${userId}/${storeId}/environment`;

        const { data: files, error: listError } = await supabase.storage
          .from('3d-models')
          .list(basePath, {
            sortBy: { column: 'name', order: 'asc' },
          });

        if (listError) {
          // 폴더가 없으면 빈 배열 반환 (정상 케이스)
          if (listError.message.includes('not found')) {
            setModels([]);
            return;
          }
          throw listError;
        }

        if (!files || files.length === 0) {
          setModels([]);
          return;
        }

        // GLB/GLTF 파일만 필터링
        const glbFiles = files.filter(
          (f) => f.name.endsWith('.glb') || f.name.endsWith('.gltf')
        );

        // Public URL 생성
        const environmentModels: EnvironmentModel[] = glbFiles.map((file) => {
          const filePath = `${basePath}/${file.name}`;
          const {
            data: { publicUrl },
          } = supabase.storage.from('3d-models').getPublicUrl(filePath);

          return {
            url: publicUrl,
            name: file.name.replace(/\.(glb|gltf)$/i, ''),
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            isBaked: true,
          };
        });

        setModels(environmentModels);
      } catch (err: any) {
        console.error('Failed to load environment models:', err);
        setError(err.message);
        setModels([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEnvironmentModels();
  }, [userId, storeId, enabled]);

  return { models, isLoading, error };
}
