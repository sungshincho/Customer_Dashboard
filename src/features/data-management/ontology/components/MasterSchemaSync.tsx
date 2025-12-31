/**
 * MasterSchemaSync.tsx
 * 온톨로지 스키마 현황 컴포넌트
 * 3D Glassmorphism + Monochrome Design
 */

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Database, User, Layers } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ============================================================================
// 3D 스타일 시스템
// ============================================================================
const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.04em',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  number: isDark ? {
    fontWeight: 700, letterSpacing: '-0.03em', color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 700, letterSpacing: '-0.03em', color: '#0a0a0c',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158',
  } as React.CSSProperties,
});

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px' }}>
    <div style={{
      borderRadius: '20px', padding: '1.5px',
      background: dark
        ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02)',
    }}>
      <div style={{
        background: dark
          ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
        backdropFilter: 'blur(80px) saturate(200%)', borderRadius: '19px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: dark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10 }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 20, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.2)'
      : '0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,1)',
  }}>
    {children}
  </div>
);

const StatCard = ({ icon: IconComponent, label, entityCount, relationCount, highlight = false, loading = false, dark = false }: {
  icon: React.ElementType;
  label: string;
  entityCount: number;
  relationCount: number;
  highlight?: boolean;
  loading?: boolean;
  dark?: boolean;
}) => {
  const text3D = getText3D(dark);
  const iconColor = dark ? 'rgba(255,255,255,0.7)' : '#374151';

  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      border: highlight
        ? (dark ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(0,0,0,0.15)')
        : (dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)'),
      background: highlight
        ? (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')
        : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Icon3D size={20} dark={dark}>
          <IconComponent className="w-3 h-3" style={{ color: iconColor }} />
        </Icon3D>
        <span style={{ fontSize: '12px', ...text3D.body }}>{label}</span>
      </div>
      <div style={{ fontSize: '24px', marginBottom: '4px', ...text3D.heroNumber }}>
        {loading ? '...' : entityCount}
        <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '6px', ...text3D.body }}>엔티티</span>
      </div>
      <div style={{ fontSize: '18px', ...text3D.number }}>
        {loading ? '...' : relationCount}
        <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '6px', ...text3D.body }}>관계</span>
      </div>
    </div>
  );
};

// 이름 기준 중복 제거 (사용자 타입 우선)
function deduplicateByName<T extends { name: string; user_id: string | null }>(items: T[]): T[] {
  const byName = new Map<string, T>();
  for (const item of items) {
    const existing = byName.get(item.name);
    if (!existing || (item.user_id !== null && existing.user_id === null)) {
      byName.set(item.name, item);
    }
  }
  return Array.from(byName.values());
}

export const MasterSchemaSync = () => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  // 마스터 스키마 정보 조회 (org_id IS NULL AND user_id IS NULL)
  const { data: masterSchema, isLoading: masterLoading } = useQuery({
    queryKey: ['master-schema-info'],
    queryFn: async () => {
      const [entitiesResult, relationsResult] = await Promise.all([
        supabase
          .from('ontology_entity_types')
          .select('id', { count: 'exact', head: true })
          .is('org_id', null)
          .is('user_id', null),
        supabase
          .from('ontology_relation_types')
          .select('id', { count: 'exact', head: true })
          .is('org_id', null)
          .is('user_id', null)
      ]);

      return {
        entityCount: entitiesResult.count || 0,
        relationCount: relationsResult.count || 0
      };
    }
  });

  // 현재 사용자의 커스텀 스키마 정보 조회 (user_id = 현재 사용자)
  const { data: userSchema, isLoading: userLoading } = useQuery({
    queryKey: ['user-custom-schema-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return { entityCount: 0, relationCount: 0 };

      const [entitiesResult, relationsResult] = await Promise.all([
        supabase
          .from('ontology_entity_types')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('ontology_relation_types')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      return {
        entityCount: entitiesResult.count || 0,
        relationCount: relationsResult.count || 0
      };
    },
    enabled: !!user?.id
  });

  // 실제 사용 가능한 스키마 (중복 제거 후)
  const { data: effectiveSchema, isLoading: effectiveLoading } = useQuery({
    queryKey: ['effective-schema-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return { entityCount: 0, relationCount: 0 };

      const [entitiesResult, relationsResult] = await Promise.all([
        supabase
          .from('ontology_entity_types')
          .select('name, user_id')
          .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.id}`),
        supabase
          .from('ontology_relation_types')
          .select('name, user_id')
          .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.id}`)
      ]);

      const deduplicatedEntities = deduplicateByName(entitiesResult.data || []);
      const deduplicatedRelations = deduplicateByName(relationsResult.data || []);

      return {
        entityCount: deduplicatedEntities.length,
        relationCount: deduplicatedRelations.length
      };
    },
    enabled: !!user?.id
  });

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Icon3D size={24} dark={isDark}>
              <Database className="w-3.5 h-3.5" style={{ color: iconColor }} />
            </Icon3D>
            <h3 style={{ fontSize: '16px', margin: 0, ...text3D.heroNumber }}>온톨로지 스키마 현황</h3>
          </div>
          <p style={{ fontSize: '12px', margin: '4px 0 0 0', ...text3D.body }}>
            마스터 스키마는 모든 사용자가 공유하며, 커스텀 타입을 추가할 수 있습니다
          </p>
        </div>

        {/* Alert */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px',
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
          borderRadius: '12px', marginBottom: '20px',
        }}>
          <Icon3D size={20} dark={isDark}>
            <CheckCircle className="w-3 h-3" style={{ color: iconColor }} />
          </Icon3D>
          <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5, ...text3D.body }}>
            <strong style={{ color: isDark ? '#fff' : '#1a1a1f' }}>자동 적용:</strong> 마스터 스키마(161개 엔티티, 110개 관계)는 모든 사용자에게 자동으로 제공됩니다. 별도의 동기화 없이 바로 사용할 수 있습니다.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <StatCard
            icon={Layers}
            label="마스터 스키마 (v1.0)"
            entityCount={masterSchema?.entityCount || 0}
            relationCount={masterSchema?.relationCount || 0}
            loading={masterLoading}
            dark={isDark}
          />
          <StatCard
            icon={User}
            label="내 커스텀 타입"
            entityCount={userSchema?.entityCount || 0}
            relationCount={userSchema?.relationCount || 0}
            loading={userLoading}
            dark={isDark}
          />
          <StatCard
            icon={CheckCircle}
            label="실제 사용 가능"
            entityCount={effectiveSchema?.entityCount || 0}
            relationCount={effectiveSchema?.relationCount || 0}
            loading={effectiveLoading}
            highlight={true}
            dark={isDark}
          />
        </div>

        {/* Footer Note */}
        <div style={{
          padding: '12px 14px',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderRadius: '10px', fontSize: '11px', lineHeight: 1.6, ...text3D.body,
        }}>
          <strong style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}>참고:</strong> 동일한 이름의 타입이 있으면 내 커스텀 타입이 우선 적용됩니다 (중복 제거됨). 마스터 스키마는 읽기 전용이며, 필요시 커스텀 타입을 추가하여 확장할 수 있습니다.
        </div>
      </div>
    </GlassCard>
  );
};

export default MasterSchemaSync;
