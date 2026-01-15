-- ============================================================================
-- 20260115100002_seed_2026_holidays.sql
-- 2026년 한국 공휴일/이벤트 데이터 시드
-- ============================================================================

-- 기존 2026년 데이터 정리 (중복 방지)
DELETE FROM holidays_events
WHERE date >= '2026-01-01' AND date <= '2026-12-31';

-- 2026년 한국 공휴일 삽입
INSERT INTO holidays_events (id, user_id, org_id, store_id, date, event_name, event_type, impact_level, description, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM organizations LIMIT 1),
  NULL,
  date,
  event_name,
  event_type,
  impact_level,
  description,
  NOW()
FROM (VALUES
  -- 1월
  ('2026-01-01'::date, '신정', 'public_holiday', 'high', '새해 첫날'),
  ('2026-01-16'::date, '설날 연휴', 'public_holiday', 'very_high', '음력 설날 전날'),
  ('2026-01-17'::date, '설날', 'public_holiday', 'very_high', '음력 1월 1일'),
  ('2026-01-18'::date, '설날 연휴', 'public_holiday', 'very_high', '음력 설날 다음날'),
  ('2026-01-19'::date, '대체공휴일(설날)', 'public_holiday', 'high', '설날 대체공휴일'),

  -- 2월
  ('2026-02-14'::date, '발렌타인데이', 'commercial_event', 'medium', '연인들의 날'),

  -- 3월
  ('2026-03-01'::date, '삼일절', 'public_holiday', 'high', '3.1 독립운동 기념일'),
  ('2026-03-02'::date, '대체공휴일(삼일절)', 'public_holiday', 'medium', '삼일절 대체공휴일'),
  ('2026-03-14'::date, '화이트데이', 'commercial_event', 'medium', '사탕 선물의 날'),

  -- 4월
  ('2026-04-05'::date, '식목일', 'memorial_day', 'low', '나무 심는 날'),

  -- 5월
  ('2026-05-01'::date, '근로자의 날', 'public_holiday', 'high', '노동절'),
  ('2026-05-05'::date, '어린이날', 'public_holiday', 'very_high', '어린이날'),
  ('2026-05-08'::date, '어버이날', 'memorial_day', 'medium', '부모님께 감사하는 날'),
  ('2026-05-15'::date, '스승의 날', 'memorial_day', 'low', '선생님께 감사하는 날'),
  ('2026-05-24'::date, '부처님오신날', 'public_holiday', 'high', '음력 4월 8일'),
  ('2026-05-25'::date, '대체공휴일(부처님오신날)', 'public_holiday', 'medium', '부처님오신날 대체공휴일'),

  -- 6월
  ('2026-06-06'::date, '현충일', 'public_holiday', 'high', '순국선열 추모일'),

  -- 7월
  ('2026-07-17'::date, '제헌절', 'memorial_day', 'low', '헌법 제정 기념일'),

  -- 8월
  ('2026-08-15'::date, '광복절', 'public_holiday', 'high', '일제로부터의 해방 기념일'),

  -- 9월
  ('2026-09-24'::date, '추석 연휴', 'public_holiday', 'very_high', '추석 전날'),
  ('2026-09-25'::date, '추석', 'public_holiday', 'very_high', '음력 8월 15일'),
  ('2026-09-26'::date, '추석 연휴', 'public_holiday', 'very_high', '추석 다음날'),

  -- 10월
  ('2026-10-03'::date, '개천절', 'public_holiday', 'high', '단군 건국 기념일'),
  ('2026-10-09'::date, '한글날', 'public_holiday', 'high', '한글 창제 기념일'),
  ('2026-10-31'::date, '할로윈', 'commercial_event', 'medium', '할로윈 데이'),

  -- 11월
  ('2026-11-11'::date, '빼빼로데이', 'commercial_event', 'high', '빼빼로 선물의 날'),

  -- 12월
  ('2026-12-24'::date, '크리스마스 이브', 'commercial_event', 'high', '크리스마스 전날'),
  ('2026-12-25'::date, '크리스마스', 'public_holiday', 'very_high', '예수 탄생 기념일'),
  ('2026-12-31'::date, '연말', 'commercial_event', 'high', '한 해의 마지막 날')
) AS holidays(date, event_name, event_type, impact_level, description);

-- 삽입된 레코드 수 확인
DO $$
DECLARE
  total_count integer;
  upcoming_count integer;
BEGIN
  SELECT COUNT(*) INTO total_count FROM holidays_events WHERE date >= '2026-01-01' AND date <= '2026-12-31';
  SELECT COUNT(*) INTO upcoming_count FROM holidays_events WHERE date >= CURRENT_DATE;

  RAISE NOTICE '2026년 공휴일/이벤트 데이터 삽입 완료: 총 %건, 예정 %건', total_count, upcoming_count;
END $$;
