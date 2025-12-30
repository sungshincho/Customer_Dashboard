/**
 * ProductTab.tsx
 *
 * 인사이트 허브 - 상품 탭
 * 3D Glassmorphism Design + Subtle Glow Charts + Dark Mode Support
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Glass3DCard, Icon3D, text3DStyles } from '@/components/ui/glass-card';
import {
  Package,
  DollarSign,
  AlertTriangle,
  Award,
  Info,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useInsightMetrics } from '../hooks/useInsightMetrics';
import { formatCurrency } from '../components';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useAuth } from '@/hooks/useAuth';

// 3D Text 스타일 (다크모드 지원)
const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : text3DStyles.heroNumber,
  number: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : text3DStyles.number,
  label: isDark ? {
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontSize: '9px',
    color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : text3DStyles.label,
  body: isDark ? {
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : text3DStyles.body,
});

// ============================================================================
// 툴팁 컴포넌트
// ============================================================================
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
    <div
      style={{
        position: 'absolute',
        left: data.x,
        top: data.y,
        transform: 'translate(-50%, -100%) translateY(-10px)',
        background: isDark
          ? 'linear-gradient(165deg, rgba(40,40,45,0.98) 0%, rgba(25,25,30,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.97) 100%)',
        border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: isDark
          ? '0 8px 24px rgba(0,0,0,0.4)'
          : '0 8px 24px rgba(0,0,0,0.1)',
        pointerEvents: 'none',
        zIndex: 50,
        minWidth: '120px',
      }}
    >
      <p style={{
        color: isDark ? '#fff' : '#1a1a1a',
        fontWeight: 600,
        fontSize: '13px',
        marginBottom: '4px',
      }}>
        {data.title}
      </p>
      <p style={{
        color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280',
        fontSize: '12px',
      }}>
        {data.value}
      </p>
      {data.subValue && (
        <p style={{
          color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af',
          fontSize: '11px',
          marginTop: '2px',
        }}>
          {data.subValue}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// 글로우 가로 바 차트 (상품별 매출 TOP 10)
// ============================================================================
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
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width, height: 300 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 700;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setAnimationProgress(eased);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
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
    
    const padding = { top: 10, right: 20, bottom: 10, left: 120 };
    const chartWidth = width - padding.left - padding.right;
    const itemCount = Math.min(data.length, 10);
    const barHeight = 18;
    const gap = (height - padding.top - padding.bottom) / itemCount;
    const maxValue = Math.max(...data.map(d => d.revenue));
    const bars: Array<{ x: number; y: number; width: number; height: number; data: { name: string; revenue: number } }> = [];
    
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (chartWidth / 4) * i;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }
    
    data.slice(0, 10).forEach((item, idx) => {
      const y = padding.top + idx * gap + (gap - barHeight) / 2;
      const fullBarWidth = (item.revenue / maxValue) * chartWidth;
      const barWidth = fullBarWidth * animationProgress;
      bars.push({ x: padding.left, y, width: fullBarWidth, height: barHeight, data: item });
      
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
      ctx.textAlign = 'right';
      const displayName = item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name;
      ctx.fillText(displayName, padding.left - 10, y + barHeight / 2 + 4);
      
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
      ctx.beginPath();
      ctx.roundRect(padding.left, y, chartWidth, barHeight, 3);
      ctx.fill();
      
      if (barWidth > 0) {
        const barGradient = ctx.createLinearGradient(padding.left, 0, padding.left + barWidth, 0);
        if (isDark) {
          barGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
          barGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
          barGradient.addColorStop(1, 'rgba(255, 255, 255, 0.55)');
        } else {
          barGradient.addColorStop(0, 'rgba(0, 0, 0, 0.06)');
          barGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.22)');
          barGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        }
        ctx.fillStyle = barGradient;
        ctx.beginPath();
        ctx.roundRect(padding.left, y, barWidth, barHeight, 3);
        ctx.fill();
        
        const glowX = padding.left + barWidth;
        const glowY = y + barHeight / 2;
        const glowColor = isDark ? '255, 255, 255' : '0, 0, 0';
        const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 10);
        glow.addColorStop(0, \`rgba(\${glowColor}, \${0.6 * animationProgress})\`);
        glow.addColorStop(0.5, \`rgba(\${glowColor}, \${0.15 * animationProgress})\`);
        glow.addColorStop(1, \`rgba(\${glowColor}, 0)\`);
        ctx.beginPath();
        ctx.arc(glowX, glowY, 10, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(glowX, glowY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? \`rgba(255,255,255,\${0.9 * animationProgress})\` : \`rgba(0,0,0,\${0.8 * animationProgress})\`;
        ctx.fill();
      }
    });
    barsRef.current = bars;
  }, [data, isDark, dimensions, animationProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bar = barsRef.current.find(b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    if (bar) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title: bar.data.name, value: \`매출: \${formatCurrency(bar.data.revenue)}\` });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => setTooltip(null);
  
  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// ============================================================================
// 글로우 도넛 차트 (카테고리별 매출 분포)
// ============================================================================
interface DonutChartProps {
  data: Array<{ name: string; revenue: number }>;
  isDark: boolean;
}

const GlowDonutChart = ({ data, isDark }: DonutChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 250 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const segmentAnglesRef = useRef<Array<{ startAngle: number; endAngle: number; data: { name: string; revenue: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width: Math.min(width, 350), height: 250 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 800;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
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
    
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 45;
    const innerRadius = outerRadius * 0.55;
    const total = data.reduce((sum, d) => sum + d.revenue, 0);
    ctx.clearRect(0, 0, width, height);
    
    let currentAngle = -Math.PI / 2;
    const angles: Array<{ startAngle: number; endAngle: number; data: { name: string; revenue: number } }> = [];
    
    const getColor = (idx: number, opacity: number) => {
      if (isDark) {
        const brightness = [0.85, 0.6, 0.4, 0.25, 0.15, 0.1][idx] || 0.3;
        return \`rgba(255, 255, 255, \${opacity * brightness})\`;
      } else {
        const darkness = [0.9, 0.65, 0.45, 0.3, 0.2, 0.12][idx] || 0.3;
        return \`rgba(0, 0, 0, \${opacity * darkness})\`;
      }
    };
    
    const maxAngle = Math.PI * 2 * animationProgress;
    let accumulatedAngle = 0;
    
    data.forEach((segment, idx) => {
      const fullSliceAngle = (segment.revenue / total) * Math.PI * 2;
      const remainingAngle = maxAngle - accumulatedAngle;
      if (remainingAngle <= 0) return;
      
      const sliceAngle = Math.min(fullSliceAngle, remainingAngle);
      const startAngle = currentAngle;
      const midAngle = currentAngle + fullSliceAngle / 2;
      
      if (animationProgress >= 1) {
        angles.push({ startAngle, endAngle: currentAngle + fullSliceAngle, data: segment });
      }
      
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
      gradient.addColorStop(0, getColor(idx, 0.3));
      gradient.addColorStop(0.6, getColor(idx, 0.55));
      gradient.addColorStop(1, getColor(idx, 0.85));
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      
      if (sliceAngle >= fullSliceAngle - 0.01) {
        ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(currentAngle + sliceAngle) * innerRadius, centerY + Math.sin(currentAngle + sliceAngle) * innerRadius);
        ctx.lineTo(centerX + Math.cos(currentAngle + sliceAngle) * outerRadius, centerY + Math.sin(currentAngle + sliceAngle) * outerRadius);
        ctx.stroke();
      }
      
      if (animationProgress >= 1) {
        const labelRadius = outerRadius + 22;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;
        const percent = ((segment.revenue / total) * 100).toFixed(0);
        ctx.font = '600 10px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.75)';
        ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
        const displayName = segment.name.length > 6 ? segment.name.substring(0, 6) + '..' : segment.name;
        ctx.fillText(\`\${displayName} \${percent}%\`, labelX, labelY);
      }
      
      currentAngle += fullSliceAngle;
      accumulatedAngle += fullSliceAngle;
    });
    
    segmentAnglesRef.current = angles;
    
    const displayTotal = Math.round(total * animationProgress);
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(formatCurrency(displayTotal), centerX, centerY + 2);
    ctx.font = '500 8px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
    ctx.fillText('TOTAL', centerX, centerY + 16);
  }, [data, isDark, dimensions, animationProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 45;
    const innerRadius = outerRadius * 0.55;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance >= innerRadius && distance <= outerRadius) {
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      const total = data.reduce((sum, d) => sum + d.revenue, 0);
      const segment = segmentAnglesRef.current.find(s => angle >= s.startAngle && angle < s.endAngle);
      if (segment) {
        const percent = ((segment.data.revenue / total) * 100).toFixed(1);
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title: segment.data.name, value: formatCurrency(segment.data.revenue), subValue: \`전체의 \${percent}%\` });
        return;
      }
    }
    setTooltip(null);
  };

  const handleMouseLeave = () => setTooltip(null);
  
  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// ============================================================================
// 글로우 세로 바 차트 (카테고리별 판매량)
// ============================================================================
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
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width, height: 250 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 700;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setAnimationProgress(eased);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
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
    
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const baseY = height - padding.bottom;
    const maxValue = Math.max(...data.map(d => d.quantity)) * 1.1;
    const barWidth = Math.min(40, (chartWidth / data.length) * 0.6);
    const gap = chartWidth / data.length;
    const bars: Array<{ x: number; y: number; width: number; height: number; data: { name: string; quantity: number } }> = [];
    
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = baseY - (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue / 4) * i);
      const y = baseY - (chartHeight / 4) * i;
      ctx.fillText(value.toLocaleString(), padding.left - 8, y + 3);
    }
    
    data.forEach((item, idx) => {
      const x = padding.left + idx * gap + (gap - barWidth) / 2;
      const fullBarHeight = (item.quantity / maxValue) * chartHeight;
      const barHeight = fullBarHeight * animationProgress;
      const y = baseY - barHeight;
      bars.push({ x, y: baseY - fullBarHeight, width: barWidth, height: fullBarHeight, data: item });
      
      if (barHeight > 0) {
        const barGradient = ctx.createLinearGradient(0, baseY, 0, y);
        if (isDark) {
          barGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
          barGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
          barGradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
        } else {
          barGradient.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
          barGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
          barGradient.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        }
        ctx.fillStyle = barGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();
        
        const glowX = x + barWidth / 2;
        const glowY = y;
        const glowColor = isDark ? '255, 255, 255' : '0, 0, 0';
        const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 12);
        glow.addColorStop(0, \`rgba(\${glowColor}, \${0.5 * animationProgress})\`);
        glow.addColorStop(0.5, \`rgba(\${glowColor}, \${0.12 * animationProgress})\`);
        glow.addColorStop(1, \`rgba(\${glowColor}, 0)\`);
        ctx.beginPath();
        ctx.arc(glowX, glowY, 12, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(glowX, glowY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? \`rgba(255,255,255,\${0.85 * animationProgress})\` : \`rgba(0,0,0,\${0.8 * animationProgress})\`;
        ctx.fill();
      }
      
      ctx.font = '10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
      ctx.textAlign = 'center';
      const displayName = item.name.length > 5 ? item.name.substring(0, 5) + '..' : item.name;
      ctx.fillText(displayName, x + barWidth / 2, baseY + 18);
    });
    barsRef.current = bars;
  }, [data, isDark, dimensions, animationProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bar = barsRef.current.find(b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    if (bar) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, title: bar.data.name, value: \`판매량: \${bar.data.quantity.toLocaleString()}개\` });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => setTooltip(null);
  
  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function ProductTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { user, orgId } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useInsightMetrics();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  const { data: productData } = useQuery({
    queryKey: ['product-performance', selectedStore?.id, dateRange, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];
      const { data: perfData, error: perfError } = await supabase
        .from('product_performance_agg')
        .select('product_id, units_sold, revenue, stock_level')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);
      if (perfError || !perfData || perfData.length === 0) return [];
      const productMap = new Map<string, { quantity: number; revenue: number; stock: number }>();
      perfData.forEach((d) => {
        const existing = productMap.get(d.product_id) || { quantity: 0, revenue: 0, stock: 0 };
        productMap.set(d.product_id, {
          quantity: existing.quantity + (d.units_sold || 0),
          revenue: existing.revenue + (d.revenue || 0),
          stock: d.stock_level ?? existing.stock,
        });
      });
      const productIds = [...productMap.keys()];
      const { data: productsInfo } = await supabase
        .from('products')
        .select('id, product_name, category')
        .in('id', productIds) as { data: Array<{ id: string; product_name: string; category: string | null }> | null };
      const productNameMap = new Map((productsInfo || []).map((p) => [p.id, { name: p.product_name, category: p.category || '기타' }]));
      return Array.from(productMap.entries())
        .map(([id, data]) => {
          const info = productNameMap.get(id) || { name: id.substring(0, 8), category: '기타' };
          return { id, name: info.name, category: info.category, ...data };
        })
        .sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!selectedStore?.id && !!orgId,
  });

  const categoryData = useMemo(() => {
    if (!productData || productData.length === 0) return [];
    const categoryMap = new Map<string, { revenue: number; quantity: number }>();
    productData.forEach((p) => {
      const existing = categoryMap.get(p.category) || { revenue: 0, quantity: 0 };
      categoryMap.set(p.category, { revenue: existing.revenue + p.revenue, quantity: existing.quantity + p.quantity });
    });
    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, revenue: data.revenue, quantity: data.quantity }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [productData]);

  const summary = useMemo(() => {
    const totalRevenue = productData?.reduce((sum, p) => sum + p.revenue, 0) || 0;
    const totalQuantity = productData?.reduce((sum, p) => sum + p.quantity, 0) || 0;
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
        <div className={\`p-3 rounded-lg flex items-start gap-2 \${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}\`}>
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
                  {productData?.slice(0, 10).map((product) => (
                    <tr key={product.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="py-3 px-4" style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{product.name}</td>
                      <td className="py-3 px-4">
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(255,255,255,0.8)' : '#6b7280' }}>{product.category}</span>
                      </td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{formatCurrency(product.revenue)}</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{product.quantity.toLocaleString()}개</td>
                      <td className="text-right py-3 px-4">
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: product.stock < 10 ? 'rgba(239,68,68,0.15)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'), color: product.stock < 10 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.7)' : '#6b7280') }}>{product.stock}개</span>
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
