# Arquitetura da Aplicação de Treinos

## Visão Geral

Aplicação web/mobile-first para acompanhamento de treinos de musculação, força, condicionamento e treinos com/sem equipamentos.

## Stack Tecnológica

- **Frontend**: Next.js 14+ (App Router) + TypeScript + React
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Estilização**: TailwindCSS + componentes customizados
- **Estado**: React Query + Zustand
- **Formulários**: React Hook Form + Zod

## Arquitetura de Dados

### Modelo de Dados (FASE 1)

```
┌─────────────────┐     ┌─────────────────┐
│    profiles    │     │   equipment     │
├─────────────────┤     ├─────────────────┤
│ id (UUID)      │     │ id (UUID)       │
│ user_id (FK)   │     │ name            │
│ name           │     │ name_en         │
│ birth_date     │     │ category        │
│ gender         │     │ created_at      │
│ weight         │     └─────────────────┘
│ height         │
│ experience     │     ┌─────────────────┐
│ objectives     │     │    exercises    │
│ available_days │     ├─────────────────┤
│ session_time   │     │ id (UUID)       │
│ sports         │     │ name            │
│ notes          │     │ alt_name        │
│ limitations    │     │ description     │
│ like_exercises │     │ instructions    │
│ dislike_ex     │     │ primary_muscle  │
│ equipment_ids  │     │ secondary_muscles│
│ created_at     │     │ movement_pattern│
│ updated_at     │     │ is_unilateral   │
└─────────────────┘     │ is_compound     │
                       │ is_bodyweight   │
┌─────────────────┐     │ load_unit       │
│ exercise_equip  │     │ has_distance    │
├─────────────────┤     │ has_time        │
│ exercise_id (FK)│     │ notes           │
│ equipment_id(FK)│     │ tags            │
└─────────────────┘     │ is_active       │
                       │ created_at      │
┌─────────────────┐     │ updated_at     │
│ workout_templ.  │     └─────────────────┘
├─────────────────┤
│ id (UUID)      │
│ user_id (FK)   │     ┌─────────────────┐
│ name           │     │ exercise_equi   │
│ description    │     ├─────────────────┤
│ objective      │     │ exercise_id (FK)│
│ duration       │     │ equipment_id(FK)│
│ is_active      │     └─────────────────┘
│ created_at     │
│ updated_at     │     ┌─────────────────┐
└─────────────────┘     │ workout_templ.  │
                      │ _blocks          │
┌─────────────────┐    ├─────────────────┤
│ workout_templ. │    │ id (UUID)       │
│ _exercises     │    │ template_id(FK) │
├─────────────────┤    │ block_type      │ (normal, superset, biset, triset, circuit, giant_set)
│ id (UUID)      │    │ order_index     │
│ template_id(FK)│    │ rest_seconds    │
│ block_id (FK)  │    │ notes           │
│ exercise_id(FK)│    └─────────────────┘
│ order_index    │
│ sets           │     ┌─────────────────┐
│ reps_min       │     │ workout_templ. │
│ reps_max       │     │ _exercises      │
│ target_rir     │     ├─────────────────┤
│ rest_seconds   │     │ id (UUID)       │
│ weight_suggest │    │ template_id(FK) │
│ notes          │    │ block_id (FK)   │
│ is_optional   │    │ exercise_id(FK) │
└─────────────────┘    │ order_index     │
                      │ sets            │
┌─────────────────┐    │ reps_min        │
│ workout_sess.  │    │ reps_max        │
├─────────────────┤    │ target_rir      │
│ id (UUID)      │    │ rest_seconds    │
│ user_id (FK)   │    │ weight_suggest  │
│ template_id(FK)│    │ is_optional    │
│ started_at     │    │ notes           │
│ ended_at       │    └─────────────────┘
│ duration       │
│ notes          │     ┌─────────────────┐
│ skipped_exer.  │     │ workout_sess.  │
│ overall_rate   │     │ _exercises     │
│ fatigue        │     ├─────────────────┤
│ pain           │     │ id (UUID)      │
│ mood           │     │ session_id (FK)│
│ created_at     │     │ exercise_id(FK)│
└─────────────────┘     │ order_index    │
                      │ notes          │
┌─────────────────┐    │ created_at     │
│ workout_sets    │    └─────────────────┘
├─────────────────┤
│ id (UUID)      │
│ session_ex_id(FK)│   ┌─────────────────┐
│ set_number     │     │ personal_records│
│ weight         │     ├─────────────────┤
│ reps           │     │ id (UUID)      │
│ rir             │     │ user_id (FK)   │
│ rpe             │     │ exercise_id(FK)│
│ duration_sec   │     │ weight         │
│ distance       │     │ reps           │
│ is_completed   │     │ estimated_1rm   │
│ pain_flag      │     │ set_id (FK)    │
│ notes          │     │ achieved_at    │
│ created_at     │     │ created_at     │
└─────────────────┘     └─────────────────┘
```

## Camadas de Segurança

### Row Level Security (RLS)

Todas as tabelas com dados de usuários devem ter RLS habilitado:

```sql
-- Exemplo para profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Similar para todas as tabelas de usuário
```

## Estrutura de Pastas

```
/app
  /auth
    /login
    /register
  /(main)
    /today
    /workouts
    /history
    /evolution
    /coach
    /profile
    /exercises
    /equipment
  /api
    /auth
    /workouts
    /exercises
/components
  /ui (componentes base)
  /forms
  /workout
  /charts
/lib
  /supabase (cliente, tipos)
  /hooks
  /utils
  /ai (AIContextBuilder, AIProvider)
/stores (Zustand)
/types
```

## Navegação Mobile

```
┌─────────────────────────┐
│       [App Bar]         │
├─────────────────────────┤
│                         │
│      [Conteúdo]         │
│                         │
├─────────────────────────┤
│ Hoje │ Treinos │ Hist. │
│ Evolu.│ Coach  │ Perfil│
└─────────────────────────┘
```

## Fases de Implementação

### FASE 1 (Atual)
1. Autenticação (email/senha, magic link)
2. Banco de dados com migrations
3. Perfil do usuário
4. Biblioteca de exercícios
5. Equipamentos
6. Templates de treino
7. Execução de treino
8. Registro de séries
9. Histórico
10. Dashboard "Hoje"

### FASE 2
- Progressão automática
- Gráficos de evolução
- Calendário
- Atividades externas
- Feedback e dor

### FASE 3
- Camada AIProvider
- Chat com Coach IA
- AIContextBuilder
- Memória persistente
- Recomendações

## Princípios Arquiteturais

1. **PostgreSQL como fonte da verdade** - Todos os dados persistidos no banco
2. **IA agnóstico** - Provider separável (OpenAI, Claude, Gemini, etc)
3. **Histórico imutável** - Sessões nunca são sobrescritas
4. **RLS em tudo** - Segurança em nível de banco
5. **Mobile-first** - Interface otimizada para celular
6. **Performance** - Query builders, índices, cache
