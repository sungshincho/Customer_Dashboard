/**
 * 카테고리별 성과 테이블 컴포넌트
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryPerformance } from '../types/roi.types';
import { getModuleConfig, TREND_ICONS } from '../utils/moduleConfig';
import { cn } from '@/lib/utils';

interface CategoryPerformanceTableProps {
  data: {
    '2d': CategoryPerformance[];
    '3d': CategoryPerformance[];
  };
  isLoading: boolean;
}

const formatCurrency = (value: number): string => {
  if (value === 0) return '-';
  if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000000) return `₩${(value / 10000000).toFixed(1)}천만`;
  if (value >= 1000000) return `+₩${(value / 1000000).toFixed(0)}M`;
  return `+₩${value.toLocaleString()}`;
};

const formatPercent = (value: number): string => {
  if (value === 0) return '-';
  return `${value.toFixed(0)}%`;
};

const CategoryTable: React.FC<{
  title: string;
  data: CategoryPerformance[];
  isLoading: boolean;
}> = ({ title, data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white/60 mb-3">{title}</h4>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-4 w-12 bg-white/10" />
            <Skeleton className="h-4 w-12 bg-white/10" />
            <Skeleton className="h-4 w-16 bg-white/10" />
            <Skeleton className="h-4 w-16 bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-white/60 mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-2 text-white/50 font-medium">유형</th>
              <th className="text-center py-2 px-2 text-white/50 font-medium">적용</th>
              <th className="text-center py-2 px-2 text-white/50 font-medium">성공</th>
              <th className="text-center py-2 px-2 text-white/50 font-medium">평균ROI</th>
              <th className="text-right py-2 px-2 text-white/50 font-medium">총 효과</th>
              <th className="text-center py-2 px-2 text-white/50 font-medium">트렌드</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const config = getModuleConfig(item.sourceModule);
              const hasData = item.appliedCount > 0;

              return (
                <tr
                  key={item.sourceModule}
                  className={cn(
                    'border-b border-white/5 transition-colors',
                    hasData ? 'hover:bg-white/5' : 'opacity-50'
                  )}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center text-sm',
                          config.bgColor
                        )}
                      >
                        {config.icon}
                      </span>
                      <span className="text-white font-medium">{config.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-white/80">
                    {hasData ? `${item.appliedCount}건` : '-'}
                  </td>
                  <td className="py-3 px-2 text-center text-white/80">
                    {hasData ? `${item.successCount}건` : '-'}
                  </td>
                  <td
                    className={cn(
                      'py-3 px-2 text-center font-medium',
                      item.averageRoi >= 200
                        ? 'text-green-400'
                        : item.averageRoi >= 100
                          ? 'text-yellow-400'
                          : item.averageRoi > 0
                            ? 'text-red-400'
                            : 'text-white/40'
                    )}
                  >
                    {formatPercent(item.averageRoi)}
                  </td>
                  <td
                    className={cn(
                      'py-3 px-2 text-right font-medium',
                      item.totalImpact > 0 ? 'text-green-400' : 'text-white/40'
                    )}
                  >
                    {formatCurrency(item.totalImpact)}
                  </td>
                  <td className="py-3 px-2 text-center text-lg">
                    {hasData ? TREND_ICONS[item.trend] : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CategoryPerformanceTable: React.FC<CategoryPerformanceTableProps> = ({
  data,
  isLoading,
}) => {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          📊 카테고리별 성과
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <CategoryTable
          title="2D 시뮬레이션 (인사이트 허브)"
          data={data['2d']}
          isLoading={isLoading}
        />
        <div className="border-t border-white/10" />
        <CategoryTable
          title="3D 시뮬레이션 (디지털트윈 스튜디오)"
          data={data['3d']}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
};

export default CategoryPerformanceTable;
