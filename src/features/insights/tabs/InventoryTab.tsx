/**
 * InventoryTab.tsx
 *
 * 인사이트 허브 - 재고 탭
 * 3D Glassmorphism Design + Subtle Glow Charts + Dark Mode Support
 *
 * 주요 기능:
 * - 재고 현황 KPI 카드 (총 상품, 재고 부족, 과잉 재고, 정상 재고)
 * - 재고 상태 분포 도넛 차트
 * - 카테고리별 재고 현황 바 차트
 * - 재고 부족 경고 상품 목록
 * - 최근 입출고 내역
 * - 상세 재고 테이블
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { Glass3DCard, Icon3D, text3DStyles } from '@/components/ui/glass-card';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useInventoryMetricsData } from '../context/InsightDataContext';
import { useCountUp } from '@/hooks/useCountUp';

// 🔧 FIX: 다크모드 초기값 동기 설정 (깜빡임 방지)
const getInitialDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : text3DStyles.heroNumber,
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : text3DStyles.number,
  label: isDark ? {
    fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
    fontSize: '9px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : text3DStyles.label,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : text3DStyles.body,
});

interface TooltipData {
  x: number;
  y: number;
  title: string;
  value: string;
  subValue?: string;
}

const ChartTooltip = ({ data, isDark }: { data: TooltipData | null; isDark: boolean }) => {
  if (!data) return null;
  return (
    <div style={{
      position: 'absolute', left: data.x, top: data.y,
      transform: 'translate(-50%, -100%) translateY(-10px)',
      background: isDark
        ? 'linear-gradient(165deg, rgba(40,40,45,0.98) 0%, rgba(25,25,30,0.97) 100%)'
        : 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.97) 100%)',
      border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)',
      pointerEvents: 'none', zIndex: 50, minWidth: '120px',
    }}>
      <p style={{ color: isDark ? '#fff' : '#1a1a1a', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{data.title}</p>
      <p style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280', fontSize: '12px' }}>{data.value}</p>
      {data.subValue && <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af', fontSize: '11px', marginTop: '2px' }}>{data.subValue}</p>}
    </div>
  );
};

// 재고 상태 분포 도넛 차트
interface StockDistributionChartProps {
  data: { critical: number; low: number; normal: number; overstock: number };
  isDark: boolean;
}

const StockDistributionChart = ({ data, isDark }: StockDistributionChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 280, height: 240 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const anglesRef = useRef<Array<{ start: number; end: number; label: string; count: number; color: string }>>([]);
  const animationRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  const total = data.critical + data.low + data.normal + data.overstock;

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setDimensions({ width: Math.min(containerRef.current.offsetWidth, 300), height: 240 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (total === 0) return;
    setProgress(0);
    const start = performance.now();
    const animate = (t: number) => {
      const p = Math.min((t - start) / 800, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [data, total]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || total === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2, cy = height / 2;
    const or = Math.min(width, height) / 2 - 40;
    const ir = or * 0.55;

    const segments = [
      { label: '위험', count: data.critical, color: '#ef4444' },
      { label: '부족', count: data.low, color: '#f97316' },
      { label: '정상', count: data.normal, color: '#22c55e' },
      { label: '과잉', count: data.overstock, color: '#3b82f6' },
    ];

    let cur = -Math.PI / 2;
    const angles: typeof anglesRef.current = [];
    const maxA = Math.PI * 2 * progress;
    let acc = 0;

    segments.forEach((seg, i) => {
      if (seg.count === 0) return;
      const full = (seg.count / total) * Math.PI * 2;
      const rem = maxA - acc;
      if (rem <= 0) return;
      const slice = Math.min(full, rem);

      if (progress >= 1) angles.push({ start: cur, end: cur + full, ...seg });

      // Draw segment
      ctx.beginPath();
      ctx.arc(cx, cy, or, cur, cur + slice);
      ctx.arc(cx, cy, ir, cur + slice, cur, true);
      ctx.closePath();
      ctx.fillStyle = seg.color + (isDark ? 'cc' : 'bb');
      ctx.fill();

      // Separator line
      if (slice >= full - 0.01) {
        ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(cur + slice) * ir, cy + Math.sin(cur + slice) * ir);
        ctx.lineTo(cx + Math.cos(cur + slice) * or, cy + Math.sin(cur + slice) * or);
        ctx.stroke();
      }

      cur += full;
      acc += full;
    });
    anglesRef.current = angles;

    // Center text
    ctx.font = 'bold 20px system-ui';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(total * progress).toLocaleString(), cx, cy + 4);
    ctx.font = '500 10px system-ui';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    ctx.fillText('TOTAL ITEMS', cx, cy + 20);
  }, [data, isDark, dimensions, progress, total]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || total === 0) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const { width, height } = dimensions;
    const cx = width / 2, cy = height / 2;
    const or = Math.min(width, height) / 2 - 40, ir = or * 0.55;
    const dx = x - cx, dy = y - cy, dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= ir && dist <= or) {
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      const seg = anglesRef.current.find(a => angle >= a.start && angle < a.end);
      if (seg) {
        setTooltip({
          x, y,
          title: seg.label,
          value: `${seg.count.toLocaleString()}개`,
          subValue: `전체의 ${((seg.count / total) * 100).toFixed(1)}%`,
        });
        return;
      }
    }
    setTooltip(null);
  };

  if (total === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
        재고 데이터가 없습니다
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }}
          onMouseMove={onMove}
          onMouseLeave={() => setTooltip(null)}
        />
        <ChartTooltip data={tooltip} isDark={isDark} />
      </div>
      {/* Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px 20px',
        marginTop: '12px',
        fontSize: '12px',
      }}>
        {[
          { label: '위험', count: data.critical, color: '#ef4444' },
          { label: '부족', count: data.low, color: '#f97316' },
          { label: '정상', count: data.normal, color: '#22c55e' },
          { label: '과잉', count: data.overstock, color: '#3b82f6' },
        ].map(seg => (
          <span key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDark ? 'rgba(255,255,255,0.7)' : '#374151' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: seg.color }} />
            <span>{seg.label}</span>
            <span style={{ fontWeight: 600 }}>{seg.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// 카테고리별 재고 현황 바 차트
interface CategoryBarChartProps {
  data: Array<{ category: string; totalStock: number; lowStockItems: number; overstockItems: number }>;
  isDark: boolean;
}

const CategoryBarChart = ({ data, isDark }: CategoryBarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 280 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const barsRef = useRef<Array<{ x: number; y: number; width: number; height: number; data: CategoryBarChartProps['data'][0] }>>([]);
  const animationRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setDimensions({ width: containerRef.current.offsetWidth, height: 280 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    setProgress(0);
    const start = performance.now();
    const animate = (t: number) => {
      const p = Math.min((t - start) / 700, 1);
      setProgress(1 - Math.pow(1 - p, 4));
      if (p < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const cw = width - pad.left - pad.right;
    const ch = height - pad.top - pad.bottom;
    const baseY = height - pad.bottom;
    const max = Math.max(...data.map(d => d.totalStock)) * 1.1;
    const cnt = Math.min(data.length, 8);
    const bw = Math.min(50, (cw / cnt) * 0.6);
    const gap = cw / cnt;
    const bars: typeof barsRef.current = [];

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    for (let i = 0; i <= 4; i++) {
      const y = baseY - (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.font = '10px system-ui';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      ctx.fillText(Math.round((max / 4) * i).toLocaleString(), pad.left - 8, baseY - (ch / 4) * i + 3);
    }

    data.slice(0, cnt).forEach((item, idx) => {
      const x = pad.left + idx * gap + (gap - bw) / 2;
      const fh = (item.totalStock / max) * ch;
      const bh = fh * progress;
      const y = baseY - bh;
      bars.push({ x, y: baseY - fh, width: bw, height: fh, data: item });

      if (bh > 0) {
        // Bar gradient
        const grad = ctx.createLinearGradient(0, baseY, 0, y);
        if (isDark) {
          grad.addColorStop(0, 'rgba(255,255,255,0.1)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.3)');
          grad.addColorStop(1, 'rgba(255,255,255,0.6)');
        } else {
          grad.addColorStop(0, 'rgba(0,0,0,0.08)');
          grad.addColorStop(0.5, 'rgba(0,0,0,0.25)');
          grad.addColorStop(1, 'rgba(0,0,0,0.55)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, [4, 4, 0, 0]);
        ctx.fill();

        // Glow effect at top
        const gx = x + bw / 2, gy = y;
        const gc = isDark ? '255,255,255' : '0,0,0';
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 12);
        glow.addColorStop(0, `rgba(${gc},${0.5 * progress})`);
        glow.addColorStop(0.5, `rgba(${gc},${0.12 * progress})`);
        glow.addColorStop(1, `rgba(${gc},0)`);
        ctx.beginPath();
        ctx.arc(gx, gy, 12, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(255,255,255,${0.85 * progress})` : `rgba(0,0,0,${0.8 * progress})`;
        ctx.fill();
      }

      // X-axis labels
      ctx.font = '10px system-ui';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      ctx.textAlign = 'center';
      const label = item.category.length > 6 ? item.category.slice(0, 6) + '..' : item.category;
      ctx.fillText(label, x + bw / 2, baseY + 18);
    });
    barsRef.current = bars;
  }, [data, isDark, dimensions, progress]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const bar = barsRef.current.find(b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    setTooltip(bar ? {
      x, y,
      title: bar.data.category,
      value: `재고: ${bar.data.totalStock.toLocaleString()}개`,
      subValue: `부족: ${bar.data.lowStockItems} / 과잉: ${bar.data.overstockItems}`,
    } : null);
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
        카테고리 데이터가 없습니다
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={onMove}
        onMouseLeave={() => setTooltip(null)}
      />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// 상태 뱃지 컴포넌트
const StatusBadge = ({
  status,
  isDark,
}: {
  status: 'critical' | 'low' | 'normal' | 'overstock';
  isDark: boolean;
}) => {
  const config = {
    critical: { label: '위험', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    low: { label: '부족', bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
    normal: { label: '정상', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
    overstock: { label: '과잉', bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  };
  const c = config[status];
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    }}>
      {c.label}
    </span>
  );
};

// 긴급도 뱃지
const UrgencyBadge = ({
  urgency,
  isDark,
}: {
  urgency: 'critical' | 'high' | 'medium' | 'low';
  isDark: boolean;
}) => {
  const config = {
    critical: { label: '긴급', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    high: { label: '높음', bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
    medium: { label: '보통', bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
    low: { label: '낮음', bg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' },
  };
  const c = config[urgency];
  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    }}>
      {c.label}
    </span>
  );
};

// 이동 유형 아이콘
const MovementTypeIcon = ({ type, isDark }: { type: string; isDark: boolean }) => {
  const t = type.toLowerCase();
  if (t === 'purchase' || t === 'in' || t === '입고') {
    return <ArrowDownCircle className="h-4 w-4" style={{ color: '#22c55e' }} />;
  }
  if (t === 'sale' || t === 'out' || t === '출고') {
    return <ArrowUpCircle className="h-4 w-4" style={{ color: '#ef4444' }} />;
  }
  if (t === 'adjustment' || t === '조정') {
    return <RefreshCw className="h-4 w-4" style={{ color: '#3b82f6' }} />;
  }
  return <Package className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />;
};

export function InventoryTab() {
  const { data, isLoading, refetch, enableLoading } = useInventoryMetricsData();
  const [isDark, setIsDark] = useState(getInitialDarkMode);

  // 컴포넌트 마운트 시 데이터 로딩 활성화
  useEffect(() => {
    enableLoading();
  }, [enableLoading]);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  // KPI 카운트업 애니메이션
  const animatedTotalProducts = useCountUp(data?.totalProducts || 0, { duration: 1500, enabled: !isLoading });
  const animatedLowStock = useCountUp(data?.lowStockCount || 0, { duration: 1500, enabled: !isLoading });
  const animatedCriticalStock = useCountUp(data?.criticalStockCount || 0, { duration: 1500, enabled: !isLoading });
  const animatedOverstock = useCountUp(data?.overstockCount || 0, { duration: 1500, enabled: !isLoading });
  const animatedHealthyStock = useCountUp(data?.healthyStockCount || 0, { duration: 1500, enabled: !isLoading });
  const healthyRatio = data?.totalProducts ? (data.healthyStockCount / data.totalProducts) * 100 : 0;
  const animatedHealthyRatio = useCountUp(healthyRatio, { duration: 1500, decimals: 1, enabled: !isLoading });

  // 데이터가 없는 경우
  if (!data && !isLoading) {
    return (
      <div className="space-y-6">
        <Glass3DCard dark={isDark}>
          <div className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px', ...text3D.number }}>재고 데이터가 없습니다</h3>
            <p style={{ fontSize: '14px', ...text3D.body }}>
              ERP 시스템을 연동하거나 데이터 컨트롤타워에서 재고 데이터를 가져오세요.
            </p>
          </div>
        </Glass3DCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><Package className="h-5 w-5" style={{ color: iconColor }} /></Icon3D>
              <div><p style={text3D.label}>TOTAL ITEMS</p><p style={{ fontSize: '12px', ...text3D.body }}>총 상품 수</p></div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{animatedTotalProducts.toLocaleString()}개</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>관리 중인 SKU</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <AlertTriangle className="h-5 w-5" style={{ color: (data?.lowStockCount || 0) > 0 ? '#ef4444' : iconColor }} />
              </Icon3D>
              <div><p style={text3D.label}>LOW STOCK</p><p style={{ fontSize: '12px', ...text3D.body }}>재고 부족</p></div>
            </div>
            <p style={{
              fontSize: '28px',
              color: (data?.lowStockCount || 0) > 0 ? '#ef4444' : (isDark ? '#fff' : '#1a1a1f'),
              ...text3D.heroNumber
            }}>
              {animatedLowStock.toLocaleString()}개
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>
              위험 {animatedCriticalStock} / 부족 {animatedLowStock - animatedCriticalStock}
            </p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <TrendingUp className="h-5 w-5" style={{ color: (data?.overstockCount || 0) > 0 ? '#3b82f6' : iconColor }} />
              </Icon3D>
              <div><p style={text3D.label}>OVERSTOCK</p><p style={{ fontSize: '12px', ...text3D.body }}>과잉 재고</p></div>
            </div>
            <p style={{
              fontSize: '28px',
              color: (data?.overstockCount || 0) > 0 ? '#3b82f6' : (isDark ? '#fff' : '#1a1a1f'),
              ...text3D.heroNumber
            }}>
              {animatedOverstock.toLocaleString()}개
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>적정 재고 대비 150% 초과</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <CheckCircle2 className="h-5 w-5" style={{ color: '#22c55e' }} />
              </Icon3D>
              <div><p style={text3D.label}>HEALTHY</p><p style={{ fontSize: '12px', ...text3D.body }}>정상 재고</p></div>
            </div>
            <p style={{ fontSize: '28px', color: '#22c55e', ...text3D.heroNumber }}>
              {animatedHealthyStock.toLocaleString()}개
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>
              {animatedHealthyRatio.toFixed(1)}% 정상 비율
            </p>
          </div>
        </Glass3DCard>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>재고 상태 분포</h3>
            <p style={{ fontSize: '12px', marginBottom: '16px', ...text3D.body }}>전체 상품의 재고 상태별 분포</p>
            <StockDistributionChart
              data={data?.stockDistribution || { critical: 0, low: 0, normal: 0, overstock: 0 }}
              isDark={isDark}
            />
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>카테고리별 재고 현황</h3>
            <p style={{ fontSize: '12px', marginBottom: '16px', ...text3D.body }}>카테고리별 총 재고 수량</p>
            <CategoryBarChart data={data?.categoryBreakdown || []} isDark={isDark} />
          </div>
        </Glass3DCard>
      </div>

      {/* Risk Products & Recent Movements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 재고 부족 경고 */}
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5" style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '16px', ...text3D.number }}>재고 부족 경고</h3>
            </div>
            {data?.riskProducts && data.riskProducts.length > 0 ? (
              <div className="space-y-3">
                {data.riskProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f', fontSize: '13px' }} className="truncate">
                        {product.product_name}
                      </p>
                      <p style={{ fontSize: '11px', ...text3D.body }}>
                        현재 {product.current_stock}개 / 적정 {product.optimal_stock}개
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="text-right">
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                          {product.days_until_stockout > 0 ? `D-${product.days_until_stockout}` : '품절 임박'}
                        </p>
                      </div>
                      <UrgencyBadge urgency={product.urgency} isDark={isDark} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center" style={text3D.body}>
                재고 부족 상품이 없습니다
              </div>
            )}
          </div>
        </Glass3DCard>

        {/* 최근 입출고 내역 */}
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }} />
              <h3 style={{ fontSize: '16px', ...text3D.number }}>최근 입출고 내역</h3>
            </div>
            {data?.recentMovements && data.recentMovements.length > 0 ? (
              <div className="space-y-3">
                {data.recentMovements.slice(0, 5).map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <MovementTypeIcon type={movement.movement_type} isDark={isDark} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f', fontSize: '13px' }} className="truncate">
                        {movement.product_name}
                      </p>
                      <p style={{ fontSize: '11px', ...text3D.body }}>
                        {movement.movement_type} · {new Date(movement.moved_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: movement.quantity >= 0 ? '#22c55e' : '#ef4444',
                      }}>
                        {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                      </p>
                      {movement.new_stock !== null && (
                        <p style={{ fontSize: '11px', ...text3D.body }}>
                          잔여 {movement.new_stock}개
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center" style={text3D.body}>
                입출고 내역이 없습니다
              </div>
            )}
          </div>
        </Glass3DCard>
      </div>

      {/* Detailed Inventory Table */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', ...text3D.number }}>상세 재고 현황</h3>
          {data?.inventoryLevels && data.inventoryLevels.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                    <th className="text-left py-3 px-4" style={text3D.body}>상품명</th>
                    <th className="text-left py-3 px-4" style={text3D.body}>SKU</th>
                    <th className="text-left py-3 px-4" style={text3D.body}>카테고리</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>현재고</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>적정재고</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>최소재고</th>
                    <th className="text-center py-3 px-4" style={text3D.body}>상태</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>품절 예상</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventoryLevels.slice(0, 15).map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}
                    >
                      <td className="py-3 px-4" style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>
                        {item.product_name}
                      </td>
                      <td className="py-3 px-4" style={text3D.body}>{item.sku || '-'}</td>
                      <td className="py-3 px-4">
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          color: isDark ? 'rgba(255,255,255,0.8)' : '#6b7280',
                        }}>
                          {item.category || '기타'}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4" style={{
                        fontWeight: 600,
                        color: item.stock_status === 'critical' ? '#ef4444'
                          : item.stock_status === 'low' ? '#f97316'
                          : (isDark ? '#fff' : '#1a1a1f'),
                      }}>
                        {item.current_stock.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{item.optimal_stock.toLocaleString()}</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{item.minimum_stock.toLocaleString()}</td>
                      <td className="text-center py-3 px-4">
                        <StatusBadge status={item.stock_status} isDark={isDark} />
                      </td>
                      <td className="text-right py-3 px-4" style={{
                        color: item.days_until_stockout !== null && item.days_until_stockout <= 7 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280'),
                        fontWeight: item.days_until_stockout !== null && item.days_until_stockout <= 7 ? 600 : 400,
                      }}>
                        {item.days_until_stockout !== null ? `${item.days_until_stockout}일` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center" style={text3D.body}>재고 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>
    </div>
  );
}
