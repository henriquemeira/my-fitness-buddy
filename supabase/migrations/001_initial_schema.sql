-- ============================================
-- Schema inicial para app de treino
-- FASE 1
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELAS
-- ============================================

-- Profiles de usuário
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  experience TEXT CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
  objectives TEXT[],
  available_days INTEGER[],
  session_time INTEGER, -- minutos
  sports TEXT[],
  notes TEXT,
  limitations TEXT[],
  like_exercises UUID[],
  dislike_exercises UUID[],
  available_equipment UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Equipamentos
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercícios
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  alt_name TEXT,
  description TEXT,
  instructions TEXT,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[],
  movement_pattern TEXT NOT NULL,
  is_unilateral BOOLEAN DEFAULT FALSE,
  is_compound BOOLEAN DEFAULT TRUE,
  is_bodyweight BOOLEAN DEFAULT FALSE,
  load_unit TEXT DEFAULT 'kg' CHECK (load_unit IN ('kg', 'lb', 'bodyweight', 'time', 'distance')),
  has_distance BOOLEAN DEFAULT FALSE,
  has_time BOOLEAN DEFAULT FALSE,
  notes TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relacionamento exercício-equipamento (muitos para muitos)
CREATE TABLE exercise_equipment (
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, equipment_id)
);

-- Templates de treino
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  duration INTEGER, -- minutos estimados
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blocos de exercícios dentro de um template
CREATE TABLE workout_template_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL DEFAULT 'normal' CHECK (block_type IN ('normal', 'superset', 'biset', 'triset', 'circuit', 'giant_set')),
  order_index INTEGER NOT NULL,
  rest_seconds INTEGER,
  notes TEXT
);

-- Exercícios dentro de um template
CREATE TABLE workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES workout_template_blocks(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps_min INTEGER,
  reps_max INTEGER,
  target_rir INTEGER,
  rest_seconds INTEGER,
  weight_suggest DECIMAL(6,2),
  notes TEXT,
  is_optional BOOLEAN DEFAULT FALSE
);

-- Sessões de treino (histórico)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- minutos
  notes TEXT,
  skipped_exercises UUID[],
  overall_rate INTEGER CHECK (overall_rate BETWEEN 1 AND 5),
  fatigue INTEGER CHECK (fatigue BETWEEN 1 AND 5),
  pain TEXT CHECK (pain IN ('none', 'mild', 'moderate', 'severe')),
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercícios executados em uma sessão
CREATE TABLE workout_session_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Séries registradas
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_exercise_id UUID NOT NULL REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight DECIMAL(6,2),
  reps INTEGER,
  rir INTEGER CHECK (rir BETWEEN 0 AND 4),
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  duration_sec INTEGER,
  distance DECIMAL(6,2),
  is_completed BOOLEAN DEFAULT FALSE,
  pain_flag BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recordes pessoais
CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight DECIMAL(6,2) NOT NULL,
  reps INTEGER NOT NULL,
  estimated_1rm DECIMAL(6,2),
  set_id UUID REFERENCES workout_sets(id) ON DELETE SET NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_workout_templates_user_id ON workout_templates(user_id);
CREATE INDEX idx_workout_templates_user_id_active ON workout_templates(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_workout_template_blocks_template_id ON workout_template_blocks(template_id);
CREATE INDEX idx_workout_template_exercises_template_id ON workout_template_exercises(template_id);
CREATE INDEX idx_workout_template_exercises_exercise_id ON workout_template_exercises(exercise_id);
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(started_at DESC);
CREATE INDEX idx_workout_session_exercises_session_id ON workout_session_exercises(session_id);
CREATE INDEX idx_workout_sets_session_exercise_id ON workout_sets(session_exercise_id);
CREATE INDEX idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
CREATE INDEX idx_exercises_primary_muscle ON exercises(primary_muscle);
CREATE INDEX idx_exercises_movement_pattern ON exercises(movement_pattern);
CREATE INDEX idx_exercises_is_active ON exercises(is_active);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir insert pelo trigger (sem restrição)
CREATE POLICY "Allow insert for new users" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Equipment (público para leitura)
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view equipment" ON equipment
  FOR SELECT USING (true);

-- Exercises (público para leitura)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises" ON exercises
  FOR SELECT USING (true);

-- Exercise Equipment (público)
ALTER TABLE exercise_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise equipment" ON exercise_equipment
  FOR SELECT USING (true);

-- Workout Templates
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON workout_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON workout_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON workout_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON workout_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Template Blocks
ALTER TABLE workout_template_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own template blocks" ON workout_template_blocks
  FOR ALL USING (
    template_id IN (
      SELECT id FROM workout_templates WHERE user_id = auth.uid()
    )
  );

-- Workout Template Exercises
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own template exercises" ON workout_template_exercises
  FOR ALL USING (
    template_id IN (
      SELECT id FROM workout_templates WHERE user_id = auth.uid()
    )
  );

-- Workout Sessions
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Session Exercises
ALTER TABLE workout_session_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own session exercises" ON workout_session_exercises
  FOR ALL USING (
    session_id IN (
      SELECT id FROM workout_sessions WHERE user_id = auth.uid()
    )
  );

-- Workout Sets
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sets" ON workout_sets
  FOR ALL USING (
    session_exercise_id IN (
      SELECT wse.id FROM workout_session_exercises wse
      JOIN workout_sessions ws ON wse.session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  );

-- Personal Records
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records" ON personal_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON personal_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON personal_records
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
