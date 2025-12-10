/**
 * DraggablePanel.tsx
 *
 * 드래그 가능한 플로팅 패널 컴포넌트
 * - 드래그 앤 드롭으로 자유롭게 이동
 * - 접기/펼치기 토글
 * - 닫기 버튼 (선택적)
 * - 화면 경계 제한
 */

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { GripVertical, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

interface DraggablePanelProps {
  id: string;
  title: string;
  icon?: ReactNode;
  defaultPosition?: Position;
  /** 오른쪽 끝에서의 오프셋 (픽셀) - 설정 시 left 대신 right 기준으로 배치 */
  rightOffset?: number;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  closable?: boolean;
  onClose?: () => void;
  width?: string;
  children: ReactNode;
  className?: string;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  title,
  icon,
  defaultPosition = { x: 16, y: 16 },
  rightOffset,
  defaultCollapsed = false,
  collapsible = true,
  closable = false,
  onClose,
  width = 'w-64',
  children,
  className,
}) => {
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  // 초기 위치 계산 (컴포넌트 마운트 시)
  useEffect(() => {
    if (position !== null) return;

    // 부모 컨테이너 찾기
    const container = panelRef.current?.closest('.relative') as HTMLElement;
    containerRef.current = container;

    const containerRect = container?.getBoundingClientRect();
    const containerWidth = containerRect?.width || window.innerWidth;

    if (rightOffset !== undefined) {
      // rightOffset이 설정된 경우 오른쪽에서부터 계산
      setPosition({ x: containerWidth - rightOffset, y: defaultPosition.y });
    } else {
      setPosition(defaultPosition);
    }
  }, [defaultPosition, rightOffset, position]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panelRef.current || position === null) return;

    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      const containerRect = container?.getBoundingClientRect();
      const maxX = containerRect ? containerRect.width - 100 : window.innerWidth - 100;
      const maxY = containerRect ? containerRect.height - 50 : window.innerHeight - 50;

      const newX = Math.max(0, Math.min(maxX, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(maxY, e.clientY - dragOffset.current.y));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position]);

  // 위치가 아직 계산되지 않은 경우 렌더링하지 않음
  if (position === null) {
    return <div ref={panelRef} className="hidden" />;
  }

  return (
    <div
      ref={panelRef}
      data-panel-id={id}
      className={cn(
        'absolute z-20 pointer-events-auto',
        width,
        isDragging ? 'cursor-grabbing select-none' : '',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
      }}
    >
      <div className={cn(
        'bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-xl',
        isDragging && 'ring-2 ring-primary/50'
      )}>
        {/* 헤더 (드래그 핸들) */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing select-none border-b border-white/10 bg-white/5"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-4 h-4 text-white/40 flex-shrink-0" />
          {icon && <span className="text-white/60 flex-shrink-0">{icon}</span>}
          <span className="flex-1 text-sm font-medium text-white truncate">
            {title}
          </span>

          <div className="flex items-center gap-1">
            {collapsible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-white/60" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-white/60" />
                )}
              </button>
            )}

            {closable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
                className="p-1 hover:bg-red-500/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-white/60 hover:text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* 컨텐츠 */}
        <div
          className={cn(
            'transition-all duration-200 ease-in-out overflow-hidden',
            isCollapsed ? 'max-h-0' : 'max-h-[500px]'
          )}
        >
          <div className="p-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggablePanel;
