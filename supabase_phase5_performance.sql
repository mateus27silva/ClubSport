-- ============================================================================
-- CLUBSPORT - FASE 5: ÍNDICES DE DESEMPENHO E OTIMIZAÇÃO NO SUPABASE
-- Execute este script no SQL Editor do seu projeto no Supabase
-- ============================================================================

-- 1. ÍNDICES PARA BUSCA E ORDENAÇÃO DE ATIVIDADES NO FEED
CREATE INDEX IF NOT EXISTS idx_activities_user_id 
  ON public.activities (user_id);

CREATE INDEX IF NOT EXISTS idx_activities_created_at 
  ON public.activities (created_at DESC);

-- 2. ÍNDICES DE INTERAÇÃO SOCIAL (CURTIDAS E COMENTÁRIOS)
CREATE INDEX IF NOT EXISTS idx_activity_likes_composite 
  ON public.activity_likes (activity_id, user_id);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity 
  ON public.activity_comments (activity_id, created_at ASC);

-- 3. ÍNDICES DE DESAFIOS E PARTICIPANTES
CREATE INDEX IF NOT EXISTS idx_challenges_status 
  ON public.challenges (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_composite 
  ON public.challenge_participants (challenge_id, user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_user 
  ON public.challenge_participants (user_id);

-- 4. ÍNDICES DE COMUNIDADES, MEMBROS E CHAT
CREATE INDEX IF NOT EXISTS idx_community_members_composite 
  ON public.community_members (community_id, user_id);

CREATE INDEX IF NOT EXISTS idx_community_members_user 
  ON public.community_members (user_id);

CREATE INDEX IF NOT EXISTS idx_community_messages_community 
  ON public.community_messages (community_id, created_at ASC);

-- 5. ATUALIZAR ESTATÍSTICAS DO QUERY PLANNER
ANALYZE public.profiles;
ANALYZE public.activities;
ANALYZE public.challenges;
ANALYZE public.communities;
ANALYZE public.community_messages;
ANALYZE public.activity_likes;
ANALYZE public.activity_comments;
ANALYZE public.challenge_participants;
ANALYZE public.community_members;
