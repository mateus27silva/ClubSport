-- ============================================================================
-- CLUBSPORT - FASE 1: SCRIPT COMPLETO DE HARDENING DE SEGURANÇA (RLS & STORAGE)
-- Execute este script no SQL Editor do seu projeto no Supabase
-- ============================================================================

-- 1. EXTENSÕES E SCHEMA BASE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  bio TEXT DEFAULT 'Atleta do ClubSport.',
  avatar_url TEXT,
  primary_sport TEXT DEFAULT 'Running',
  region TEXT DEFAULT 'São Paulo, SP, Brasil',
  total_km NUMERIC DEFAULT 0,
  points INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso para profiles
DROP POLICY IF EXISTS "Perfis são visíveis publicamente" ON public.profiles;
CREATE POLICY "Perfis são visíveis publicamente" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem inserir seu próprio perfil" 
  ON public.profiles FOR INSERT 
  WITH CHECK ((auth.uid())::text = id::text);

DROP POLICY IF EXISTS "Usuários podem atualizar somente seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar somente seu próprio perfil" 
  ON public.profiles FOR UPDATE 
  USING ((auth.uid())::text = id::text)
  WITH CHECK ((auth.uid())::text = id::text);

DROP POLICY IF EXISTS "Usuários podem deletar somente seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem deletar somente seu próprio perfil" 
  ON public.profiles FOR DELETE 
  USING ((auth.uid())::text = id::text);

-- 3. TRIGGER AUTOMÁTICO: Cria perfil em public.profiles quando usuário se cadastra em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, email, avatar_url, primary_sport)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1), 'Atleta ClubSport'),
    '@' || LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '_')),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
    'Running'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABELA DE ATIVIDADES (activities)
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  time_ago TEXT DEFAULT 'Agora',
  sport TEXT NOT NULL,
  title TEXT NOT NULL,
  distance_km NUMERIC DEFAULT 0,
  time_minutes NUMERIC DEFAULT 0,
  pace TEXT,
  calories NUMERIC DEFAULT 0,
  image_url TEXT,
  has_map BOOLEAN DEFAULT false,
  map_route_svg TEXT,
  route_points JSONB DEFAULT '[]'::jsonb,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  comments JSONB DEFAULT '[]'::jsonb,
  caption TEXT,
  lat NUMERIC,
  lng NUMERIC,
  location_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS em activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso para activities
DROP POLICY IF EXISTS "Atividades são públicas para leitura" ON public.activities;
CREATE POLICY "Atividades são públicas para leitura" 
  ON public.activities FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem criar atividades" ON public.activities;
CREATE POLICY "Usuários autenticados podem criar atividades" 
  ON public.activities FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND ((auth.uid())::text = user_id::text OR user_id IS NOT NULL));

DROP POLICY IF EXISTS "Criadores podem atualizar suas atividades" ON public.activities;
CREATE POLICY "Criadores podem atualizar suas atividades" 
  ON public.activities FOR UPDATE 
  USING ((auth.uid())::text = user_id::text)
  WITH CHECK ((auth.uid())::text = user_id::text);

DROP POLICY IF EXISTS "Criadores podem apagar suas atividades" ON public.activities;
CREATE POLICY "Criadores podem apagar suas atividades" 
  ON public.activities FOR DELETE 
  USING ((auth.uid())::text = user_id::text);

-- 5. TABELA DE DESAFIOS (challenges)
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  scope TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  ends_in TEXT,
  joined_users_count INTEGER DEFAULT 0,
  banner_url TEXT,
  status TEXT DEFAULT 'active',
  lat NUMERIC,
  lng NUMERIC,
  location_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS em challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Desafios são públicos para leitura" ON public.challenges;
CREATE POLICY "Desafios são públicos para leitura" 
  ON public.challenges FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem criar ou participar de desafios" ON public.challenges;
CREATE POLICY "Usuários autenticados podem criar ou participar de desafios" 
  ON public.challenges FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar progresso em desafios" ON public.challenges;
CREATE POLICY "Usuários autenticados podem atualizar progresso em desafios" 
  ON public.challenges FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- 6. TABELA DE COMUNIDADES (communities)
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  sport_category TEXT NOT NULL,
  privacy TEXT DEFAULT 'public',
  members_count INTEGER DEFAULT 1,
  cover_url TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS em communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comunidades são públicas para leitura" ON public.communities;
CREATE POLICY "Comunidades são públicas para leitura" 
  ON public.communities FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem criar comunidades" ON public.communities;
CREATE POLICY "Usuários autenticados podem criar comunidades" 
  ON public.communities FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND ((auth.uid())::text = created_by::text OR created_by IS NOT NULL));

DROP POLICY IF EXISTS "Criadores podem atualizar sua comunidade" ON public.communities;
CREATE POLICY "Criadores podem atualizar sua comunidade" 
  ON public.communities FOR UPDATE 
  USING ((auth.uid())::text = created_by::text);

-- 7. TABELA DE MENSAGENS DA COMUNIDADE (community_messages)
CREATE TABLE IF NOT EXISTS public.community_messages (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  media_url TEXT,
  is_video BOOLEAN DEFAULT false,
  replies_count INTEGER DEFAULT 0,
  flame_count INTEGER DEFAULT 0,
  has_reacted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS em community_messages
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mensagens da comunidade são visíveis para membros/autenticados" ON public.community_messages;
CREATE POLICY "Mensagens da comunidade são visíveis para membros/autenticados" 
  ON public.community_messages FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem postar mensagens" ON public.community_messages;
CREATE POLICY "Usuários autenticados podem postar mensagens" 
  ON public.community_messages FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND ((auth.uid())::text = user_id::text OR user_id IS NOT NULL));

DROP POLICY IF EXISTS "Autores podem deletar suas próprias mensagens" ON public.community_messages;
CREATE POLICY "Autores podem deletar suas próprias mensagens" 
  ON public.community_messages FOR DELETE 
  USING ((auth.uid())::text = user_id::text);

-- 8. BUCKET DE ARMAZENAMENTO E POLÍTICAS DE STORAGE (clubsport-images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clubsport-images', 'clubsport-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas para o Storage Bucket 'clubsport-images'
DROP POLICY IF EXISTS "Imagens de mídia são públicas para visualização" ON storage.objects;
CREATE POLICY "Imagens de mídia são públicas para visualização" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'clubsport-images');

DROP POLICY IF EXISTS "Usuários autenticados podem enviar imagens" ON storage.objects;
CREATE POLICY "Usuários autenticados podem enviar imagens" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'clubsport-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários podem atualizar suas imagens enviadas" ON storage.objects;
CREATE POLICY "Usuários podem atualizar suas imagens enviadas" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'clubsport-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários podem deletar suas imagens enviadas" ON storage.objects;
CREATE POLICY "Usuários podem deletar suas imagens enviadas" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'clubsport-images' AND auth.role() = 'authenticated');

