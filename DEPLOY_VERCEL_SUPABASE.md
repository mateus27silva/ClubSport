# 🚀 Guia de Deploy Vercel & Supabase - ClubSport

Este repositório está 100% configurado e pronto para deploy na **Vercel** integrado ao **Supabase**.

---

## 🛠️ Passo 1: Configurar Variáveis de Ambiente no Supabase & Vercel

No painel da Vercel (**Project Settings -> Environment Variables**), adicione as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://[SEU_PROJETO].supabase.co
VITE_SUPABASE_ANON_KEY=[SUA_CHAVE_ANON_PUBLIC]
```

> 📌 Para obter estas chaves, acesse **Supabase Dashboard -> Project Settings -> API**.

---

## 🗄️ Passo 2: Executar o Script SQL no Supabase

Se ainda não executou a estrutura de tabelas, vá em **Supabase Dashboard -> SQL Editor** e rode o script SQL contido em `schema_supabase.sql` ou abaixo:

```sql
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  primary_sport TEXT DEFAULT 'Running',
  region TEXT DEFAULT 'São Paulo, SP, Brasil',
  total_km NUMERIC(10, 2) DEFAULT 0,
  activities_count INT DEFAULT 0,
  points INT DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Atividades do Feed
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  time_ago TEXT DEFAULT 'Agora',
  sport TEXT DEFAULT 'Running',
  title TEXT NOT NULL,
  distance_km NUMERIC(6, 2) NOT NULL,
  time_minutes INT NOT NULL,
  pace TEXT,
  calories INT,
  image_url TEXT,
  has_map BOOLEAN DEFAULT FALSE,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  caption TEXT,
  location_name TEXT,
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Desafios Esportivos
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Distance',
  target_value NUMERIC(10, 2) NOT NULL,
  current_value NUMERIC(10, 2) DEFAULT 0,
  participants_count INT DEFAULT 1,
  icon_name TEXT DEFAULT 'Trophy',
  badge_color TEXT DEFAULT 'amber',
  status TEXT DEFAULT 'active',
  ends_in TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Comunidades
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  sport_category TEXT,
  privacy TEXT DEFAULT 'public',
  members_count INT DEFAULT 1,
  cover_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Mensagens do Chat da Comunidade
CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  flame_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público para Leitura e Inserção Resiliente
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Read Activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Public Read Challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Public Read Communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Public Read Messages" ON public.community_messages FOR SELECT USING (true);

CREATE POLICY "Allow All Insert Profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Insert Activities" ON public.activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Insert Challenges" ON public.challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Insert Communities" ON public.communities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Insert Messages" ON public.community_messages FOR INSERT WITH CHECK (true);
```

---

## ⚡ Passo 3: Deploy via Vercel CLI ou GitHub

### Opção A: Vercel CLI
```bash
npx vercel
```

### Opção B: Importar Repositório no Painel da Vercel
1. Conecte sua conta do GitHub/GitLab na Vercel.
2. Selecione o repositório `ClubSport`.
3. Escolha o preset **Vite**.
4. Clique em **Deploy**! 🚀
