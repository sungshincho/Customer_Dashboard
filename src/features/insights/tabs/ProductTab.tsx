/**
 * ProductTab.tsx
 *
 * 인사이트 허브 - 상품 탭
 * 3D Glassmorphism Design + Subtle Glow Charts + Dark Mode Support
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { Glass3DCard, Icon3D, text3DStyles } from '@/components/ui/glass-card';
import { Package, DollarSign, AlertTriangle, Award, Info } from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useInsightMetrics } from '../hooks/useInsightMetrics';
import { formatCurrency } from '../components';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useAuth } from '@/hooks/useAuth';

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

// 글로우 가로 바 차트
interface HorizontalBarChartProps {
  data: Array<{ name: string; revenue: number }>;
  isDark: boolean;
}

const GlowHorizontalBarChart = ({ data, isDark }: HorizontalBarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const barsRef = useRef<Array<{ x: number; y: number; width: number; height: number; data: { name: string; revenue: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setDimensions({ width: containerRef.current.offsetWidth, height: 300 });
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
    
    const pad = { top: 10, right: 20, bottom: 10, left: 120 };
    const cw = width - pad.left - pad.right;
    const cnt = Math.min(data.length, 10);
    const bh = 18;
    const gap = (height - pad.top - pad.bottom) / cnt;
    const max = Math.max(...data.map(d => d.revenue));
    const bars: typeof barsRef.current = [];
    
    for (let i = 0; i <= 4; i++) {
      const x = pad.left + (cw / 4) * i;
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, height - pad.bottom);
      ctx.stroke();
    }
    
    data.slice(0, 10).forEach((item, idx) => {
      const y = pad.top + idx * gap + (gap - bh) / 2;
      const fw = (item.revenue / max) * cw;
      const bw = fw * progress;
      bars.push({ x: pad.left, y, width: fw, height: bh, data: item });
      
      ctx.font = '500 11px system-ui';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name, pad.left - 10, y + bh / 2 + 4);
      
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
      ctx.beginPath();
      ctx.roundRect(pad.left, y, cw, bh, 3);
      ctx.fill();
      
      if (bw > 0) {
        const grad = ctx.createLinearGradient(pad.left, 0, pad.left + bw, 0);
        if (isDark) {
          grad.addColorStop(0, 'rgba(255,255,255,0.08)');
          grad.addColorStop(0.7, 'rgba(255,255,255,0.25)');
          grad.addColorStop(1, 'rgba(255,255,255,0.55)');
        } else {
          grad.addColorStop(0, 'rgba(0,0,0,0.06)');
          grad.addColorStop(0.7, 'rgba(0,0,0,0.22)');
          grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(pad.left, y, bw, bh, 3);
        ctx.fill();
        
        const gx = pad.left + bw, gy = y + bh / 2;
        const gc = isDark ? '255,255,255' : '0,0,0';
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, 8);
        glow.addColorStop(0, `rgba(${gc},${0.3 * progress})`);
        glow.addColorStop(0.5, `rgba(${gc},${0.08 * progress})`);
        glow.addColorStop(1, `rgba(${gc},0)`);
        ctx.beginPath();
        ctx.arc(gx, gy, 10, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(gx, gy, 2, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(255,255,255,${0.9 * progress})` : `rgba(0,0,0,${0.8 * progress})`;
        ctx.fill();
      }
    });
    barsRef.current = bars;
  }, [data, isDark, dimensions, progress]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const bar = barsRef.current.find(b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    setTooltip(bar ? { x, y, title: bar.data.name, value: `매출: ${formatCurrency(bar.data.revenue)}` } : null);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }} onMouseMove={onMove} onMouseLeave={() => setTooltip(null)} />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// 글로우 도넛 차트
interface DonutChartProps {
  data: Array<{ name: string; revenue: number }>;
  isDark: boolean;
}

const GlowDonutChart = ({ data, isDark }: DonutChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 250 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const anglesRef = useRef<Array<{ start: number; end: number; data: { name: string; revenue: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setDimensions({ width: Math.min(containerRef.current.offsetWidth, 350), height: 250 });
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
      const p = Math.min((t - start) / 800, 1);
      setProgress(1 - Math.pow(1 - p, 3));
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
    
    const cx = width / 2, cy = height / 2;
    const or = Math.min(width, height) / 2 - 45;
    const ir = or * 0.55;
    const total = data.reduce((s, d) => s + d.revenue, 0);
    
    let cur = -Math.PI / 2;
    const angles: typeof anglesRef.current = [];
    const maxA = Math.PI * 2 * progress;
    let acc = 0;
    
    const getColor = (i: number, o: number) => {
      const b = isDark ? [0.85, 0.6, 0.4, 0.25, 0.15, 0.1][i] || 0.3 : [0.9, 0.65, 0.45, 0.3, 0.2, 0.12][i] || 0.3;
      return isDark ? `rgba(255,255,255,${o * b})` : `rgba(0,0,0,${o * b})`;
    };
    
    data.forEach((seg, i) => {
      const full = (seg.revenue / total) * Math.PI * 2;
      const rem = maxA - acc;
      if (rem <= 0) return;
      const slice = Math.min(full, rem);
      const mid = cur + full / 2;
      
      if (progress >= 1) angles.push({ start: cur, end: cur + full, data: seg });
      
      const grad = ctx.createRadialGradient(cx, cy, ir, cx, cy, or);
      grad.addColorStop(0, getColor(i, 0.3));
      grad.addColorStop(0.6, getColor(i, 0.55));
      grad.addColorStop(1, getColor(i, 0.85));
      
      ctx.beginPath();
      ctx.arc(cx, cy, or, cur, cur + slice);
      ctx.arc(cx, cy, ir, cur + slice, cur, true);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      
      if (slice >= full - 0.01) {
        ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(cur + slice) * ir, cy + Math.sin(cur + slice) * ir);
        ctx.lineTo(cx + Math.cos(cur + slice) * or, cy + Math.sin(cur + slice) * or);
        ctx.stroke();
      }
      
      if (progress >= 1) {
        const lr = or + 22;
        const lx = cx + Math.cos(mid) * lr, ly = cy + Math.sin(mid) * lr;
        const pct = ((seg.revenue / total) * 100).toFixed(0);
        ctx.font = '600 10px system-ui';
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
        ctx.textAlign = mid > Math.PI / 2 && mid < Math.PI * 1.5 ? 'right' : 'left';
        ctx.fillText(`${seg.name.length > 6 ? seg.name.slice(0, 6) + '..' : seg.name} ${pct}%`, lx, ly);
      }
      
      cur += full;
      acc += full;
    });
    anglesRef.current = angles;
    
    ctx.font = 'bold 14px system-ui';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(formatCurrency(Math.round(total * progress)), cx, cy + 2);
    ctx.font = '500 8px system-ui';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
    ctx.fillText('TOTAL', cx, cy + 16);
  }, [data, isDark, dimensions, progress]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !data.length) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const { width, height } = dimensions;
    const cx = width / 2, cy = height / 2;
    const or = Math.min(width, height) / 2 - 45, ir = or * 0.55;
    const dx = x - cx, dy = y - cy, dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist >= ir && dist <= or) {
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      const total = data.reduce((s, d) => s + d.revenue, 0);
      const seg = anglesRef.current.find(a => angle >= a.start && angle < a.end);
      if (seg) {
        setTooltip({ x, y, title: seg.data.name, value: formatCurrency(seg.data.revenue), subValue: `전체의 ${((seg.data.revenue / total) * 100).toFixed(1)}%` });
        return;
      }
    }
    setTooltip(null);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }} onMouseMove={onMove} onMouseLeave={() => setTooltip(null)} />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// 글로우 세로 바 차트
interface VerticalBarChartProps {
  data: Array<{ name: string; quantity: number }>;
  isDark: boolean;
}

const GlowVerticalBarChart = ({ data, isDark }: VerticalBarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 350, height: 250 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const barsRef = useRef<Array<{ x: number; y: number; width: number; height: number; data: { name: string; quantity: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setDimensions({ width: containerRef.current.offsetWidth, height: 250 });
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
    
    const pad = { top: 20, right: 20, bottom: 40, left: 50 };
    const cw = width - pad.left - pad.right;
    const ch = height - pad.top - pad.bottom;
    const baseY = height - pad.bottom;
    const max = Math.max(...data.map(d => d.quantity)) * 1.1;
    const bw = Math.min(40, (cw / data.length) * 0.6);
    const gap = cw / data.length;
    const bars: typeof barsRef.current = [];
    
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    for (let i = 0; i <= 4; i++) {
      const y = baseY - (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    }
    
    ctx.font = '10px system-ui';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      ctx.fillText(Math.round((max / 4) * i).toLocaleString(), pad.left - 8, baseY - (ch / 4) * i + 3);
    }
    
    data.forEach((item, idx) => {
      const x = pad.left + idx * gap + (gap - bw) / 2;
      const fh = (item.quantity / max) * ch;
      const bh = fh * progress;
      const y = baseY - bh;
      bars.push({ x, y: baseY - fh, width: bw, height: fh, data: item });
      
      if (bh > 0) {
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
      
      ctx.font = '10px system-ui';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText(item.name.length > 5 ? item.name.slice(0, 5) + '..' : item.name, x + bw / 2, baseY + 18);
    });
    barsRef.current = bars;
  }, [data, isDark, dimensions, progress]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const bar = barsRef.current.find(b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    setTooltip(bar ? { x, y, title: bar.data.name, value: `판매량: ${bar.data.quantity.toLocaleString()}개` } : null);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }} onMouseMove={onMove} onMouseLeave={() => setTooltip(null)} />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

export function ProductTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { orgId } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useInsightMetrics();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  const { data: productData } = useQuery({
    queryKey: ['product-performance', selectedStore?.id, dateRange, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];
      const { data: perfData, error } = await supabase
        .from('product_performance_agg')
        .select('product_id, units_sold, revenue, stock_level')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);
      if (error || !perfData?.length) return [];
      
      const map = new Map<string, { quantity: number; revenue: number; stock: number }>();
      perfData.forEach(d => {
        const e = map.get(d.product_id) || { quantity: 0, revenue: 0, stock: 0 };
        map.set(d.product_id, { quantity: e.quantity + (d.units_sold || 0), revenue: e.revenue + (d.revenue || 0), stock: d.stock_level ?? e.stock });
      });
      
      const ids = [...map.keys()];
      const { data: info } = await supabase.from('products').select('id, product_name, category').in('id', ids) as { data: Array<{ id: string; product_name: string; category: string | null }> | null };
      const nameMap = new Map((info || []).map(p => [p.id, { name: p.product_name, category: p.category || '기타' }]));
      
      return [...map.entries()].map(([id, d]) => {
        const i = nameMap.get(id) || { name: id.slice(0, 8), category: '기타' };
        return { id, name: i.name, category: i.category, ...d };
      }).sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!selectedStore?.id && !!orgId,
  });

  const categoryData = useMemo(() => {
    if (!productData?.length) return [];
    const map = new Map<string, { revenue: number; quantity: number }>();
    productData.forEach(p => {
      const e = map.get(p.category) || { revenue: 0, quantity: 0 };
      map.set(p.category, { revenue: e.revenue + p.revenue, quantity: e.quantity + p.quantity });
    });
    return [...map.entries()].map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue);
  }, [productData]);

  const summary = useMemo(() => {
    const totalRevenue = productData?.reduce((s, p) => s + p.revenue, 0) || 0;
    const totalQuantity = productData?.reduce((s, p) => s + p.quantity, 0) || 0;
    const topProduct = productData?.[0];
    const lowStockCount = productData?.filter(p => p.stock > 0 && p.stock < 10).length || 0;
    return { totalRevenue, totalQuantity, topProduct, lowStockCount };
  }, [productData]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><DollarSign className="h-5 w-5" style={{ color: iconColor }} /></Icon3D>
              <div><p style={text3D.label}>REVENUE</p><p style={{ fontSize: '12px', ...text3D.body }}>총 매출</p></div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{formatCurrency(metrics?.revenue || summary.totalRevenue)}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>분석 기간 총 매출</p>
          </div>
        </Glass3DCard>
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><Package className="h-5 w-5" style={{ color: iconColor }} /></Icon3D>
              <div><p style={text3D.label}>UNITS SOLD</p><p style={{ fontSize: '12px', ...text3D.body }}>총 판매량</p></div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{summary.totalQuantity.toLocaleString()}개</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>분석 기간 총 판매</p>
          </div>
        </Glass3DCard>
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><Award className="h-5 w-5" style={{ color: iconColor }} /></Icon3D>
              <div><p style={text3D.label}>BESTSELLER</p><p style={{ fontSize: '12px', ...text3D.body }}>베스트셀러</p></div>
            </div>
            <p style={{ fontSize: '24px', ...text3D.heroNumber }} className="truncate">{summary.topProduct?.name || '-'}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{formatCurrency(summary.topProduct?.revenue || 0)}</p>
          </div>
        </Glass3DCard>
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}><AlertTriangle className="h-5 w-5" style={{ color: summary.lowStockCount > 0 ? '#ef4444' : iconColor }} /></Icon3D>
              <div><p style={text3D.label}>LOW STOCK</p><p style={{ fontSize: '12px', ...text3D.body }}>재고 부족</p></div>
            </div>
            <p style={{ fontSize: '28px', color: summary.lowStockCount > 0 ? '#ef4444' : (isDark ? '#fff' : '#1a1a1f'), ...text3D.heroNumber }}>{summary.lowStockCount}개</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>재고 10개 미만 상품</p>
          </div>
        </Glass3DCard>
      </div>

      {metrics?.atv && metrics.atv > 0 && (
        <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
          <p style={{ fontSize: '13px', ...text3D.body }}>
            <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>평균 객단가 (ATV):</span>{' '}
            {formatCurrency(metrics.atv)} = Revenue {formatCurrency(metrics.revenue || 0)} / Transactions {metrics.transactions.toLocaleString()}건
          </p>
        </div>
      )}

      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>상품별 매출 TOP 10</h3>
          <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>매출 기준 상위 10개 상품</p>
          {productData && productData.length > 0 ? (
            <GlowHorizontalBarChart data={productData.slice(0, 10)} isDark={isDark} />
          ) : (
            <div className="h-[300px] flex items-center justify-center" style={text3D.body}>상품 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>카테고리별 매출 분포</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>카테고리별 매출 비율</p>
            {categoryData && categoryData.length > 0 ? (
              <GlowDonutChart data={categoryData} isDark={isDark} />
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>카테고리 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>카테고리별 판매량</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>카테고리별 판매 수량</p>
            {categoryData && categoryData.length > 0 ? (
              <GlowVerticalBarChart data={categoryData} isDark={isDark} />
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>카테고리 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>
      </div>

      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', ...text3D.number }}>상품별 상세 성과</h3>
          {productData && productData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                    <th className="text-left py-3 px-4" style={text3D.body}>상품</th>
                    <th className="text-left py-3 px-4" style={text3D.body}>카테고리</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>매출</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>판매량</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>재고</th>
                  </tr>
                </thead>
                <tbody>
                  {productData.slice(0, 10).map((p) => (
                    <tr key={p.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="py-3 px-4" style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{p.name}</td>
                      <td className="py-3 px-4">
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(255,255,255,0.8)' : '#6b7280' }}>{p.category}</span>
                      </td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{formatCurrency(p.revenue)}</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{p.quantity.toLocaleString()}개</td>
                      <td className="text-right py-3 px-4">
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: p.stock < 10 ? 'rgba(239,68,68,0.15)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'), color: p.stock < 10 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.7)' : '#6b7280') }}>{p.stock}개</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center" style={text3D.body}>해당 기간에 상품 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>
    </div>
  );
}
