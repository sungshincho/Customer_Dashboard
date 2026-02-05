/**
 * UIAction 실행 훅
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFilterStore } from '@/store/dateFilterStore';

interface UIAction {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

export function useActionDispatcher() {
  const navigate = useNavigate();
  const { setPreset, setCustomRange } = useDateFilterStore();

  const dispatchAction = useCallback(async (action: UIAction): Promise<void> => {
    switch (action.type) {
      case 'navigate':
        // 페이지 이동 (탭 파라미터 포함 가능)
        navigate(action.target);
        break;

      case 'set_date_range':
        // 날짜 필터 변경
        if (action.preset) {
          setPreset(action.preset);
        } else if (action.startDate && action.endDate) {
          setCustomRange(action.startDate, action.endDate);
        }
        break;

      case 'open_dialog':
        // TODO: Phase 3에서 구현
        console.log('[ActionDispatcher] open_dialog:', action.dialogId);
        break;

      case 'run_simulation':
      case 'run_optimization':
        // TODO: Phase 3-C에서 구현
        console.log('[ActionDispatcher] execution action:', action.type);
        break;

      default:
        console.warn('[ActionDispatcher] Unknown action type:', action.type);
    }
  }, [navigate, setPreset, setCustomRange]);

  const dispatchActions = useCallback(async (actions: UIAction[]): Promise<void> => {
    for (const action of actions) {
      await dispatchAction(action);
      // 액션 간 약간의 딜레이 (애니메이션 등을 위해)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, [dispatchAction]);

  return { dispatchAction, dispatchActions };
}
