-- ============================================================================
-- CLUBSPORT - FASE 3: TABELAS DE INTERAÇÃO SOCIAL E POLÍTICAS RLS NO SUPABASE
-- Execute este script no SQL Editor do seu projeto no Supabase
-- ============================================================================

-- 1. TABELA DE CURTIDAS EM ATIVIDADES (activity_likes)
CREATE TABLE IF NOT EXISTS public.activity_likes (
  id TEXT PRIMARY KEY DEFAULT ('like_' || md5(random()::text || clock_timestamp()::text)),
  activity_id TEXT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_activity_user_like UNIQUE (activity_id, user_id)
);

ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Curtidas são visíveis publicamente" ON public.activity_likes;
CREATE POLICY "Curtidas são visíveis publicamente" 
  ON public.activity_likes FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem curtir" ON public.activity_likes;
CREATE POLICY "Usuários autenticados podem curtir" 
  ON public.activity_likes FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND ((auth.uid())::text = user_id::text OR user_id IS NOT NULL));

DROP POLICY IF EXISTS "Usuários podem remover própria curtida" ON public.activity_likes;
CREATE POLICY "Usuários podem remover própria curtida" 
  ON public.activity_likes FOR DELETE 
  USING ((auth.uid())::text = user_id::text);

-- 2. TABELA DE COMENTÁRIOS EM ATIVIDADES (activity_comments)
CREATE TABLE IF NOT EXISTS public.activity_comments (
  id TEXT PRIMARY KEY DEFAULT ('comment_' || md5(random()::text || clock_timestamp()::text)),
  activity_id TEXT NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comentários são visíveis publicamente" ON public.activity_comments;
CREATE POLICY "Comentários são visíveis publicamente" 
  ON public.activity_comments FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem comentar" ON public.activity_comments;
CREATE POLICY "Usuários autenticados podem comentar" 
  ON public.activity_comments FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND ((auth.uid())::text = user_id::text OR user_id IS NOT NULL));

DROP POLICY IF EXISTS "Usuários podem apagar seus comentários" ON public.activity_comments;
CREATE POLICY "Usuários podem apagar seus comentários" 
  ON public.activity_comments FOR DELETE 
  USING ((auth.uid())::text = user_id::text);

-- 3. TABELA DE PARTICIPANTES DE DESAFIOS (challenge_participants)
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id TEXT PRIMARY KEY DEFAULT ('part_' || md5(random()::text || clock_timestamp()::text)),
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_challenge_participant UNIQUE (challenge_id, user_id)
);

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inscrições em desafios são visíveis publicamente" ON public.challenge_participants;
CREATE POLICY "Inscrições em desafios são visíveis publicamente" 
  ON public.challenge_participants FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários podem entrar em desafios" ON public.challenge_participants;
CREATE POLICY "Usuários podem entrar em desafios" 
  ON public.challenge_participants FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND ((auth.uid())::text = user_id::text OR user_id IS NOT NULL));

DROP POLICY IF EXISTS "Usuários podem sair de desafios" ON public.challenge_participants;
CREATE POLICY "Usuários podem sair de desafios" 
  ON public.challenge_participants FOR DELETE 
  USING ((auth.uid())::text = user_id::text);

-- 4. TABELA DE MEMBROS DA COMUNIDADE (community_members)
CREATE TABLE IF NOT EXISTS public.community_members (
  id TEXT PRIMARY KEY DEFAULT ('member_' || md5(random()::text || clock_timestamp()::text)),
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_community_member UNIQUE (community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Membros da comunidade são visíveis publicamente" ON public.community_members;
CREATE POLICY "Membros da comunidade são visíveis publicamente" 
  ON public.community_members FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários podem entrar na comunidade" ON public.community_members;
CREATE POLICY "Usuários podem entrar na comunidade" 
  ON public.community_members FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND ((auth.uid())::text = user_id::text OR user_id IS NOT NULL));

DROP POLICY IF EXISTS "Usuários podem sair da comunidade" ON public.community_members;
CREATE POLICY "Usuários podem sair da comunidade" 
  ON public.community_members FOR DELETE 
  USING ((auth.uid())::text = user_id::text);
