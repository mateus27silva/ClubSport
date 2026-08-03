-- ============================================================================
-- CLUBSPORT - SUPABASE POSTGRESQL SCHEMA & REALTIME CONFIGURATION
-- Execute este script no SQL Editor do seu projeto Supabase:
-- Project: wpjmgvtnfazixxbrkspa.supabase.co
-- ============================================================================

-- 1. TABELA DE PERFIS DE USUÁRIOS (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  primary_sport TEXT DEFAULT 'Running',
  region TEXT DEFAULT 'São Paulo, SP, Brasil',
  total_km NUMERIC DEFAULT 0,
  activities_count INT DEFAULT 0,
  points INT DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE ATIVIDADES / TREINOS (activities)
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  time_ago TEXT DEFAULT 'Agora',
  sport TEXT NOT NULL,
  title TEXT NOT NULL,
  distance_km NUMERIC DEFAULT 0,
  time_minutes INT DEFAULT 0,
  duration_sec INT DEFAULT 0,
  pace TEXT,
  calories INT DEFAULT 0,
  image_url TEXT,
  has_map BOOLEAN DEFAULT FALSE,
  map_route_svg TEXT,
  route_points JSONB DEFAULT '[]'::jsonb,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  comments JSONB DEFAULT '[]'::jsonb,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lat NUMERIC,
  lng NUMERIC,
  location_name TEXT
);

-- 3. TABELA DE DESAFIOS (challenges)
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  scope TEXT DEFAULT 'global',
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'km',
  ends_in TEXT,
  joined_users_count INT DEFAULT 1,
  banner_url TEXT,
  status TEXT DEFAULT 'active',
  lat NUMERIC,
  lng NUMERIC,
  location_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE COMUNIDADES (communities)
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT DEFAULT 'São Paulo, SP, Brasil',
  sport_category TEXT DEFAULT 'Running',
  privacy TEXT DEFAULT 'public',
  members_count INT DEFAULT 1,
  cover_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE MENSAGENS DE COMUNIDADE (community_messages)
CREATE TABLE IF NOT EXISTS public.community_messages (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_avatar TEXT,
  text TEXT NOT NULL,
  media_url TEXT,
  is_video BOOLEAN DEFAULT FALSE,
  replies_count INT DEFAULT 0,
  flame_count INT DEFAULT 0,
  has_reacted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE NOTIFICAÇÕES (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  timestamp TEXT DEFAULT 'Agora',
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO PÚBLICO
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Criar Políticas de permissão livre (Leitura e Escrita Públicas para o App)
DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
CREATE POLICY "Public access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access activities" ON public.activities;
CREATE POLICY "Public access activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access challenges" ON public.challenges;
CREATE POLICY "Public access challenges" ON public.challenges FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access communities" ON public.communities;
CREATE POLICY "Public access communities" ON public.communities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access community_messages" ON public.community_messages;
CREATE POLICY "Public access community_messages" ON public.community_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access notifications" ON public.notifications;
CREATE POLICY "Public access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- HABILITAR SUPABASE REALTIME REPLICATION NAS TABELAS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'challenges'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'communities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'community_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
  END IF;
END $$;
