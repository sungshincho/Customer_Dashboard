/**
 * CustomerTab.tsx
 *
 * 인사이트 허브 - 고객 탭
 * 3D Glassmorphism Design + Subtle Glow Charts + Dark Mode Support
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Glass3DCard, Icon3D, text3DStyles } from '@/components/ui/glass-card';
import {
  Users,
  UserCheck,
  UserPlus,
  Heart,
  Info,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { formatCurrency } from '../components';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useAuth } from '@/hooks/useAuth';
import { useInsightMetrics } from '../hooks/useInsightMetrics';

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
        minWidth: '100px',
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
// 글로우 도넛 차트 (Canvas + Tooltip)
// ============================================================================
interface DonutChartProps {
  data: Array<{ name: string; count: number }>;
  isDark: boolean;
}

const GlowDonutChart = ({ data, isDark }: DonutChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 280 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const segmentAnglesRef = useRef<Array<{ startAngle: number; endAngle: number; data: { name: string; count: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width: Math.min(width, 400), height: 280 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 애니메이션 시작
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 800; // 0.8초
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
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
    const outerRadius = Math.min(width, height) / 2 - 50;
    const innerRadius = outerRadius * 0.52;
    const rawTotal = data.reduce((sum, d) => sum + d.count, 0);
    // total이 0이면 차트를 그리지 않음
    const total = rawTotal > 0 ? rawTotal : 1;

    ctx.clearRect(0, 0, width, height);

    // 데이터가 없으면 빈 차트만 표시
    if (rawTotal === 0) {
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('0', centerX, centerY + 2);
      ctx.font = '500 9px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
      ctx.fillText('TOTAL', centerX, centerY + 18);
      return;
    }
    
    let currentAngle = -Math.PI / 2;
    const angles: Array<{ startAngle: number; endAngle: number; data: { name: string; count: number } }> = [];
    
    const getColor = (idx: number, opacity: number) => {
      if (isDark) {
        const brightness = [0.8, 0.55, 0.35, 0.18][idx] || 0.4;
        return `rgba(255, 255, 255, ${opacity * brightness})`;
      } else {
        const darkness = [0.85, 0.6, 0.4, 0.2][idx] || 0.4;
        return `rgba(0, 0, 0, ${opacity * darkness})`;
      }
    };
    
    // 애니메이션: 전체 각도를 progress에 따라 제한
    const maxAngle = Math.PI * 2 * animationProgress;
    let accumulatedAngle = 0;
    
    data.forEach((segment, idx) => {
      const fullSliceAngle = (segment.count / total) * Math.PI * 2;
      const remainingAngle = maxAngle - accumulatedAngle;
      if (remainingAngle <= 0) return;
      
      const sliceAngle = Math.min(fullSliceAngle, remainingAngle);
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = currentAngle + fullSliceAngle / 2;
      
      if (animationProgress >= 1) {
        angles.push({ startAngle, endAngle: currentAngle + fullSliceAngle, data: segment });
      }
      
      // 세그먼트 그라데이션
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
      gradient.addColorStop(0, getColor(idx, 0.3));
      gradient.addColorStop(0.6, getColor(idx, 0.55));
      gradient.addColorStop(1, getColor(idx, 0.8));
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 구분선 (완료된 세그먼트만)
      if (sliceAngle >= fullSliceAngle - 0.01) {
        ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(currentAngle + sliceAngle) * innerRadius,
          centerY + Math.sin(currentAngle + sliceAngle) * innerRadius
        );
        ctx.lineTo(
          centerX + Math.cos(currentAngle + sliceAngle) * outerRadius,
          centerY + Math.sin(currentAngle + sliceAngle) * outerRadius
        );
        ctx.stroke();
      }
      
      // 라벨 (애니메이션 완료 후)
      if (animationProgress >= 1) {
        const labelRadius = outerRadius + 28;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;
        const percent = ((segment.count / total) * 100).toFixed(0);
        
        ctx.font = '600 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
        ctx.fillText(`${segment.name} ${percent}%`, labelX, labelY);
      }
      
      currentAngle += fullSliceAngle;
      accumulatedAngle += fullSliceAngle;
    });
    
    segmentAnglesRef.current = angles;
    
    // 중심 텍스트 (애니메이션 중에도 표시, 숫자는 카운트업)
    const displayTotal = Math.round(total * animationProgress);
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(displayTotal.toLocaleString(), centerX, centerY + 2);
    ctx.font = '500 9px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
    ctx.fillText('TOTAL', centerX, centerY + 18);
    
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
    const outerRadius = Math.min(width, height) / 2 - 50;
    const innerRadius = outerRadius * 0.52;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance >= innerRadius && distance <= outerRadius) {
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      
      const total = data.reduce((sum, d) => sum + d.count, 0);
      const segment = segmentAnglesRef.current.find(s => angle >= s.startAngle && angle < s.endAngle);
      
      if (segment) {
        const percent = ((segment.data.count / total) * 100).toFixed(1);
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          title: segment.data.name,
          value: `${segment.data.count.toLocaleString()}명`,
          subValue: `전체의 ${percent}%`,
        });
        return;
      }
    }
    setTooltip(null);
  };

  const handleMouseLeave = () => setTooltip(null);
  
  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// ============================================================================
// 글로우 바 차트 (Canvas + Tooltip)
// ============================================================================
interface BarChartProps {
  data: Array<{ name: string; avgValue: number }>;
  isDark: boolean;
}

const GlowBarChart = ({ data, isDark }: BarChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 280 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const barsRef = useRef<Array<{ x: number; y: number; width: number; height: number; data: { name: string; avgValue: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width, height: 280 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 애니메이션 시작
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 600; // 0.6초
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
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
    
    const padding = { top: 15, right: 70, bottom: 15, left: 75 };
    const chartWidth = width - padding.left - padding.right;
    const barHeight = 20;
    const gap = Math.min(50, (height - padding.top - padding.bottom) / data.length);
    const rawMaxValue = Math.max(...data.map(d => d.avgValue));
    // maxValue가 0이면 1로 설정하여 division by zero 방지
    const maxValue = rawMaxValue > 0 ? rawMaxValue : 1;
    
    const bars: Array<{ x: number; y: number; width: number; height: number; data: { name: string; avgValue: number } }> = [];
    
    // 그리드
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (chartWidth / 4) * i;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }
    
    data.forEach((item, idx) => {
      const y = padding.top + idx * gap + 10;
      const fullBarWidth = (item.avgValue / maxValue) * chartWidth;
      // 애니메이션: 바 너비를 progress에 따라 증가
      const barWidth = fullBarWidth * animationProgress;
      
      bars.push({ x: padding.left, y, width: fullBarWidth, height: barHeight, data: item });
      
      // 라벨
      ctx.font = '500 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(item.name, padding.left - 12, y + barHeight / 2 + 4);
      
      // 바 배경
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
      ctx.beginPath();
      ctx.roundRect(padding.left, y, chartWidth, barHeight, 3);
      ctx.fill();
      
      // 바 그라데이션
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
        
        // 끝 포인트 (은은한 글로우)
        const rawGlowX = padding.left + barWidth;
        const rawGlowY = y + barHeight / 2;
        // 안전한 좌표 값 확보
        const glowX = Number.isFinite(rawGlowX) ? rawGlowX : padding.left;
        const glowY = Number.isFinite(rawGlowY) ? rawGlowY : padding.top;
        const glowColor = isDark ? '255, 255, 255' : '0, 0, 0';

        const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 10);
        glow.addColorStop(0, `rgba(${glowColor}, ${0.6 * animationProgress})`);
        glow.addColorStop(0.5, `rgba(${glowColor}, ${0.15 * animationProgress})`);
        glow.addColorStop(1, `rgba(${glowColor}, 0)`);
        ctx.beginPath();
        ctx.arc(glowX, glowY, 10, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        // 중심 점
        ctx.beginPath();
        ctx.arc(glowX, glowY, 3, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(255,255,255,${0.9 * animationProgress})` : `rgba(0,0,0,${0.8 * animationProgress})`;
        ctx.fill();
      }
      
      // 값 표시 (애니메이션 완료 후 또는 페이드인)
      const valueOpacity = animationProgress;
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${0.6 * valueOpacity})` : `rgba(0, 0, 0, ${0.6 * valueOpacity})`;
      ctx.textAlign = 'left';
      ctx.fillText(`₩${(item.avgValue / 10000).toFixed(0)}만`, width - padding.right + 12, y + barHeight / 2 + 4);
    });
    
    barsRef.current = bars;
    
  }, [data, isDark, dimensions, animationProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const bar = barsRef.current.find(b => 
      x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height
    );
    
    if (bar) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        title: bar.data.name,
        value: `평균 구매액: ₩${bar.data.avgValue.toLocaleString()}`,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => setTooltip(null);
  
  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// ============================================================================
// 글로우 영역 차트 (산맥 스타일 + Tooltip)
// ============================================================================
interface AreaChartProps {
  data: Array<{ date: string; newVisitors: number; returningVisitors: number }>;
  isDark: boolean;
}

// 안전한 숫자 값 반환 헬퍼 함수
const safeNumber = (val: number, fallback = 0): number =>
  Number.isFinite(val) ? val : fallback;

const GlowAreaChart = ({ data, isDark }: AreaChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 320 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const pointsRef = useRef<Array<{ x: number; yTotal: number; data: { date: string; newVisitors: number; returningVisitors: number } }>>([]);
  const animationRef = useRef<number>(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width, height: 320 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 애니메이션 시작
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 1000; // 1초
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
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
    
    const padding = { top: 30, right: 20, bottom: 55, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const baseY = height - padding.bottom;
    
    const rawMaxValue = Math.max(...data.map(d => d.newVisitors + d.returningVisitors));
    // maxValue가 0이면 1로 설정하여 division by zero 방지
    const maxValue = rawMaxValue > 0 ? rawMaxValue * 1.15 : 1;

    // 애니메이션: Y 값을 baseY에서 시작해서 실제 값으로 이동
    const points = data.map((d, i) => {
      const targetYNew = baseY - (d.newVisitors / maxValue) * chartHeight;
      const targetYTotal = baseY - ((d.newVisitors + d.returningVisitors) / maxValue) * chartHeight;
      // data.length가 1일 때 division by zero 방지
      const xRatio = data.length > 1 ? i / (data.length - 1) : 0.5;
      return {
        x: safeNumber(padding.left + xRatio * chartWidth, padding.left),
        yNew: safeNumber(baseY - (baseY - targetYNew) * animationProgress, baseY),
        yTotal: safeNumber(baseY - (baseY - targetYTotal) * animationProgress, baseY),
        data: d,
      };
    });
    
    pointsRef.current = points;
    
    // 세로 그리드
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    points.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(p.x, padding.top);
      ctx.lineTo(p.x, baseY);
      ctx.stroke();
    });
    
    // Y축 라벨
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue / 4) * i);
      const y = baseY - (chartHeight / 4) * i;
      ctx.fillText(value.toString(), padding.left - 8, y + 3);
    }
    
    const primaryColor = isDark ? '255, 255, 255' : '0, 0, 0';
    
    // 신규 방문자 영역
    const newGradient = ctx.createLinearGradient(0, padding.top, 0, baseY);
    newGradient.addColorStop(0, `rgba(${primaryColor}, ${0.2 * animationProgress})`);
    newGradient.addColorStop(0.6, `rgba(${primaryColor}, ${0.08 * animationProgress})`);
    newGradient.addColorStop(1, `rgba(${primaryColor}, 0.01)`);
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, baseY);
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.lineTo(p.x, p.yNew);
      } else {
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpx, prev.yNew, cpx, p.yNew, p.x, p.yNew);
      }
    });
    ctx.lineTo(points[points.length - 1].x, baseY);
    ctx.closePath();
    ctx.fillStyle = newGradient;
    ctx.fill();
    
    // 재방문자 영역
    const returnGradient = ctx.createLinearGradient(0, padding.top, 0, baseY);
    returnGradient.addColorStop(0, `rgba(${primaryColor}, ${0.45 * animationProgress})`);
    returnGradient.addColorStop(0.5, `rgba(${primaryColor}, ${0.2 * animationProgress})`);
    returnGradient.addColorStop(1, `rgba(${primaryColor}, 0.02)`);
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].yNew);
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.lineTo(p.x, p.yTotal);
      } else {
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpx, prev.yTotal, cpx, p.yTotal, p.x, p.yTotal);
      }
    });
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      if (i === points.length - 1) {
        ctx.lineTo(p.x, p.yNew);
      } else {
        const next = points[i + 1];
        const cpx = (p.x + next.x) / 2;
        ctx.bezierCurveTo(cpx, next.yNew, cpx, p.yNew, p.x, p.yNew);
      }
    }
    ctx.closePath();
    ctx.fillStyle = returnGradient;
    ctx.fill();
    
    // 반사 효과 (약하게) - 애니메이션 완료 후
    if (animationProgress > 0.5) {
      const reflectionOpacity = (animationProgress - 0.5) * 2;
      const reflectionGradient = ctx.createLinearGradient(0, baseY, 0, baseY + 25);
      reflectionGradient.addColorStop(0, `rgba(${primaryColor}, ${0.06 * reflectionOpacity})`);
      reflectionGradient.addColorStop(1, `rgba(${primaryColor}, 0)`);
      
      ctx.save();
      ctx.translate(0, baseY * 2);
      ctx.scale(1, -0.15);
      ctx.beginPath();
      ctx.moveTo(points[0].x, baseY);
      points.forEach((p, i) => {
        if (i === 0) {
          ctx.lineTo(p.x, p.yTotal);
        } else {
          const prev = points[i - 1];
          const cpx = (prev.x + p.x) / 2;
          ctx.bezierCurveTo(cpx, prev.yTotal, cpx, p.yTotal, p.x, p.yTotal);
        }
      });
      ctx.lineTo(points[points.length - 1].x, baseY);
      ctx.closePath();
      ctx.fillStyle = reflectionGradient;
      ctx.fill();
      ctx.restore();
    }
    
    // 상단 라인 (글로우 약하게)
    ctx.shadowColor = `rgba(${primaryColor}, ${0.3 * animationProgress})`;
    ctx.shadowBlur = 4;
    ctx.strokeStyle = `rgba(${primaryColor}, ${0.7 * animationProgress})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.yTotal);
      } else {
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpx, prev.yTotal, cpx, p.yTotal, p.x, p.yTotal);
      }
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // 포인트 (작게)
    points.forEach((p) => {
      // 안전한 좌표 값 확보
      const px = safeNumber(p.x, padding.left);
      const py = safeNumber(p.yTotal, baseY);

      // 작은 글로우
      const glow = ctx.createRadialGradient(px, py, 0, px, py, 8);
      glow.addColorStop(0, `rgba(${primaryColor}, ${0.5 * animationProgress})`);
      glow.addColorStop(0.5, `rgba(${primaryColor}, ${0.1 * animationProgress})`);
      glow.addColorStop(1, `rgba(${primaryColor}, 0)`);
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // 중심 점
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? `rgba(255,255,255,${0.85 * animationProgress})` : `rgba(0,0,0,${0.8 * animationProgress})`;
      ctx.fill();
    });
    
    // X축 라벨
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = `rgba(${primaryColor}, 0.4)`;
    ctx.textAlign = 'center';
    
    // 라벨 간격 조정 (데이터가 많으면 일부만 표시)
    const labelInterval = data.length > 10 ? Math.ceil(data.length / 10) : 1;
    data.forEach((d, i) => {
      if (i % labelInterval === 0 || i === data.length - 1) {
        // data.length가 1일 때 division by zero 방지
        const xRatio = data.length > 1 ? i / (data.length - 1) : 0.5;
        const x = safeNumber(padding.left + xRatio * chartWidth, padding.left);
        ctx.fillText(d.date, x, baseY + 22);
      }
    });
    
  }, [data, isDark, dimensions, animationProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 가장 가까운 포인트 찾기
    let closestPoint = null;
    let minDistance = Infinity;
    
    pointsRef.current.forEach(p => {
      const distance = Math.abs(p.x - mouseX);
      if (distance < minDistance && distance < 30) {
        minDistance = distance;
        closestPoint = p;
      }
    });
    
    if (closestPoint) {
      const total = closestPoint.data.newVisitors + closestPoint.data.returningVisitors;
      setTooltip({
        x: closestPoint.x,
        y: closestPoint.yTotal,
        title: closestPoint.data.date,
        value: `총 방문: ${total.toLocaleString()}명`,
        subValue: `신규 ${closestPoint.data.newVisitors.toLocaleString()} / 재방문 ${closestPoint.data.returningVisitors.toLocaleString()}`,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => setTooltip(null);
  
  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: dimensions.width, height: dimensions.height, cursor: tooltip ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <ChartTooltip data={tooltip} isDark={isDark} />
    </div>
  );
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function CustomerTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { user, orgId } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useInsightMetrics();
  const [isDark, setIsDark] = useState(false);

  // 다크모드 감지
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

  // 고객 세그먼트 데이터
  const { data: segmentData } = useQuery({
    queryKey: ['customer-segments-agg', selectedStore?.id, dateRange, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('customer_segments_agg')
        .select('segment_name, customer_count, total_revenue, avg_transaction_value, visit_frequency')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (error) return [];

      const segmentMap = new Map<string, { count: number; value: number; frequency: number; records: number }>();
      (data || []).forEach((d) => {
        const existing = segmentMap.get(d.segment_name) || { count: 0, value: 0, frequency: 0, records: 0 };
        segmentMap.set(d.segment_name, {
          count: existing.count + (d.customer_count || 0),
          value: existing.value + (d.avg_transaction_value || 0),
          frequency: existing.frequency + (d.visit_frequency || 0),
          records: existing.records + 1,
        });
      });

      return Array.from(segmentMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        avgValue: Math.round(data.value / Math.max(data.records, 1)),
        frequency: (data.frequency / Math.max(data.records, 1)).toFixed(1),
      })).sort((a, b) => b.count - a.count);
    },
    enabled: !!selectedStore?.id && !!orgId,
  });

  // 재방문 추이 데이터
  const { data: returnData } = useQuery({
    queryKey: ['return-visits', selectedStore?.id, dateRange, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data, error } = await supabase
        .from('daily_kpis_agg')
        .select('date, total_visitors, returning_visitors')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      if (error) return [];

      return (data || []).map((d) => ({
        date: new Date(d.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }).replace('.', '/').replace('.', ''),
        totalVisitors: d.total_visitors || 0,
        newVisitors: (d.total_visitors || 0) - (d.returning_visitors || 0),
        returningVisitors: d.returning_visitors || 0,
        returnRate: d.total_visitors ? ((d.returning_visitors || 0) / d.total_visitors * 100).toFixed(1) : '0',
      }));
    },
    enabled: !!selectedStore?.id && !!orgId,
  });

  const summary = useMemo(() => {
    const totalVisitors = returnData?.reduce((sum, d) => sum + d.totalVisitors, 0) || 0;
    const totalReturning = returnData?.reduce((sum, d) => sum + d.returningVisitors, 0) || 0;
    const avgReturnRate = totalVisitors > 0 ? (totalReturning / totalVisitors) * 100 : 0;
    const totalCustomers = segmentData?.reduce((sum, s) => sum + s.count, 0) || 0;
    const topSegment = segmentData?.[0];
    const loyalCustomers = segmentData?.find(s =>
      s.name.toLowerCase().includes('vip') || s.name.includes('충성') || s.name.toLowerCase().includes('loyal')
    )?.count || 0;

    return { totalVisitors, totalCustomers, avgReturnRate, topSegment, loyalCustomers };
  }, [segmentData, returnData]);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <Users className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>UNIQUE VISITORS</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>순 방문객</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>
              {metricsLoading ? '-' : (metrics?.uniqueVisitors ?? 0).toLocaleString()}명
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>기간 내 고유 방문자</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <UserCheck className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>REPEAT RATE</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>재방문율</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>
              {metricsLoading ? '-' : (metrics?.repeatRate ?? summary.avgReturnRate).toFixed(1)}%
            </p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>기간 평균</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <UserPlus className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>TOP SEGMENT</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>주요 세그먼트</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{summary.topSegment?.name || '-'}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{summary.topSegment?.count.toLocaleString() || 0}명</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <Heart className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>LOYAL CUSTOMERS</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>충성 고객</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{summary.loyalCustomers.toLocaleString()}명</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>VIP/충성 세그먼트</p>
          </div>
        </Glass3DCard>
      </div>

      {/* 방문 빈도 안내 */}
      {metrics?.visitFrequency && metrics.visitFrequency > 1 && (
        <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
          <p style={{ fontSize: '13px', ...text3D.body }}>
            <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>평균 방문 빈도 {metrics.visitFrequency.toFixed(1)}회:</span>{' '}
            Footfall {metrics.footfall.toLocaleString()} / Unique Visitors {metrics.uniqueVisitors.toLocaleString()}
          </p>
        </div>
      )}

      {/* 고객 세그먼트 분포 + 세그먼트별 평균 구매액 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>고객 세그먼트 분포</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>세그먼트별 고객 수</p>
            {segmentData && segmentData.length > 0 ? (
              <GlowDonutChart data={segmentData} isDark={isDark} />
            ) : (
              <div className="h-[280px] flex items-center justify-center" style={text3D.body}>세그먼트 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>세그먼트별 평균 구매액</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>고객 세그먼트별 평균 구매 금액</p>
            {segmentData && segmentData.length > 0 ? (
              <GlowBarChart data={segmentData} isDark={isDark} />
            ) : (
              <div className="h-[280px] flex items-center justify-center" style={text3D.body}>세그먼트 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>
      </div>

      {/* 재방문 추이 */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>재방문 추이</h3>
              <p style={{ fontSize: '12px', ...text3D.body }}>신규 vs 재방문 고객 추이</p>
            </div>
            <div className="flex gap-5">
              <div className="flex items-center gap-2">
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                }} />
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>신규</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                }} />
                <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>재방문</span>
              </div>
            </div>
          </div>
          {returnData && returnData.length > 0 && returnData.some(d => d.totalVisitors > 0) ? (
            <GlowAreaChart data={returnData} isDark={isDark} />
          ) : (
            <div className="h-[320px] flex items-center justify-center" style={text3D.body}>해당 기간에 방문 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>

      {/* 세그먼트 상세 테이블 */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', ...text3D.number }}>세그먼트 상세 분석</h3>
          {segmentData && segmentData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                    <th className="text-left py-3 px-4" style={text3D.body}>세그먼트</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>고객 수</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>평균 구매액</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>방문 빈도</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentData?.map((segment) => (
                    <tr key={segment.name} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="py-3 px-4">
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          color: isDark ? '#fff' : '#1a1a1f',
                        }}>
                          {segment.name}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{segment.count.toLocaleString()}명</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>₩{segment.avgValue.toLocaleString()}</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{segment.frequency}회/월</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center" style={text3D.body}>해당 기간에 세그먼트 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>
    </div>
  );
}
