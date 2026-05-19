import { z } from 'zod';

// ─── Primitives ──────────────────────────────────────────────────────────────

/**
 * RCEM Clinical Syllabus code (e.g. RP2, ObC4, NeoC1, MHP1, EnvC10).
 * Pattern: <prefix> + (P|C) + (1–2 digits).
 * Prefixes enumerated from RCEM Curriculum 2021 v1.5 Clinical Syllabus
 * pp.59–68 (see content/sources/rcem-clinical-syllabus-codes.md).
 * Update this regex if RCEM publishes new system prefixes in future versions.
 */
const RCEM_PREFIXES = [
  // 3-letter
  'Env',
  'Neo',
  'Nep',
  'Neu',
  'Onc',
  'Opt',
  'Pal',
  'Res',
  // 2-letter
  'El',
  'En',
  'Ma',
  'MH',
  'Mu',
  'Ob',
  'Ph',
  'Sa',
  'Se',
  'Su',
  // 1-letter
  'A',
  'C',
  'D',
  'E',
  'G',
  'H',
  'I',
  'P',
  'R',
  'T',
  'U',
  'V',
  'X',
];

export const CurriculumCode = z
  .string()
  .regex(
    new RegExp(`^(?:${RCEM_PREFIXES.join('|')})[PC]\\d{1,2}$`),
    'must match an RCEM Clinical Syllabus code prefix',
  );

export const SloNumber = z.number().int().min(1).max(12);

export const DifficultyBand = z.enum(['CT1', 'CT2', 'ST3', 'ST4', 'ST5', 'ST6']);

export const TriageCategory = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const Sex = z.enum(['male', 'female', 'other', 'unknown']);

// ─── Citations ──────────────────────────────────────────────────────────────

const CitationBase = {
  ref: z.string().min(1),
  url: z.string().url().optional(),
  note: z.string().optional(),
};

export const Citation = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('nice'),
    id: z.string().regex(/^[A-Z]{1,3}\d{1,4}$/),
    ...CitationBase,
  }),
  z.object({ type: z.literal('nice_cks'), ...CitationBase }),
  z.object({ type: z.literal('rcem'), ...CitationBase }),
  z.object({ type: z.literal('resus_council_uk'), ...CitationBase }),
  z.object({ type: z.literal('bts_sign'), ...CitationBase }),
  z.object({ type: z.literal('rcog'), ...CitationBase }),
  z.object({ type: z.literal('bsped'), ...CitationBase }),
  z.object({ type: z.literal('jbds'), ...CitationBase }),
  z.object({ type: z.literal('toxbase'), ...CitationBase }),
  z.object({ type: z.literal('esc'), ...CitationBase }),
  z.object({ type: z.literal('renal_assoc'), ...CitationBase }),
  z.object({ type: z.literal('rcpch'), ...CitationBase }),
  z.object({ type: z.literal('rcp'), ...CitationBase }),
  z.object({ type: z.literal('nhs'), ...CitationBase }),
  z.object({ type: z.literal('legislation'), ...CitationBase }),
  z.object({
    type: z.literal('textbook'),
    page: z.string().optional(),
    chapter: z.string().optional(),
    ...CitationBase,
  }),
  z.object({ type: z.literal('trend_uk'), ...CitationBase }),
  z.object({ type: z.literal('other'), ...CitationBase }),
]);

// ─── Case state machine ─────────────────────────────────────────────────────

export const CaseState = z.enum([
  'unseen',
  'triaged',
  'stable',
  'deteriorating',
  'arrested',
  'discharged',
  'admitted',
  'deceased',
]);

export const TransitionTrigger = z.discriminatedUnion('on', [
  z.object({
    on: z.literal('elapsed_min'),
    min: z.number().nonnegative(),
    note: z.string().optional(),
  }),
  z.object({
    on: z.literal('action'),
    action_id: z.string(),
    note: z.string().optional(),
  }),
  z.object({
    on: z.literal('inaction_by'),
    min: z.number().nonnegative(),
    required_actions: z.array(z.string()),
    note: z.string().optional(),
  }),
  z.object({
    on: z.literal('finding'),
    finding_id: z.string(),
    note: z.string().optional(),
  }),
  z.object({
    on: z.literal('scheduled_event'),
    event_id: z.string(),
    note: z.string().optional(),
  }),
]);

export const StateTransition = z.object({
  from: CaseState,
  to: CaseState,
  trigger: TransitionTrigger,
});

// ─── History / Examination ──────────────────────────────────────────────────

export const HistorySource = z.enum([
  'patient',
  'family',
  'paramedic',
  'gp_letter',
  'triage_note',
  'nurse',
  'records',
]);

export const HistoryItem = z.object({
  id: z.string(),
  source: HistorySource,
  topic: z.string(),
  response: z.string(),
  /**
   * Asking this item explicitly *makes available* the listed history ids
   * regardless of their prereqs. Push-driven dialogue unlock — used when the
   * parent answer naturally opens a follow-up the player wouldn't otherwise
   * think to ask.
   */
  reveals: z.array(z.string()).optional(),
  /**
   * This item is only available once every listed history id has been
   * asked. Pull-driven dialogue gating — the natural way to author a
   * branching history tree.
   */
  prereq_history_ids: z.array(z.string()).optional(),
  /**
   * Short stage direction shown above the response, e.g. "Tom glances
   * toward the relatives' room" or "(through the nasal cannula)".
   * Author-optional; renders as italic flavour text.
   */
  npc_voice: z.string().optional(),
  /**
   * Differential diagnosis labels (exact match against
   * `case.differential[i].diagnosis`) that this finding clinically
   * supports. Used by the clue-board reasoning surface to show which
   * differentials the player's evidence points at. Optional — clues
   * without supports are listed but unweighted.
   */
  /**
   * Branching dialogue choices (M34). When set, the player picks ONE
   * option before the canonical `response` is revealed; the picked
   * branch's `response` is shown alongside it and may shift case
   * rapport via `rapport_delta`. Once a choice is made it's locked
   * for the encounter.
   *
   * Use for pivotal moments — disclosure of intent, prior MH, trauma —
   * where *how* the question is asked matters more than the answer.
   */
  branch_choices: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        response: z.string(),
        npc_voice: z.string().optional(),
        rapport_delta: z.number().int().min(-3).max(3).optional(),
      }),
    )
    .min(2)
    .optional(),
  /**
   * Minimum case rapport required to surface this history item (M38).
   * The item is hidden — like an unmet prereq — until `cs.rapport`
   * meets this floor. Use to author rewards for compassionate
   * questioning: the patient discloses something only once they
   * feel safe with you.
   *
   * Pair with prereq_history_ids to require the player to have
   * earned BOTH the rapport AND the conversational opening.
   */
  min_rapport: z.number().int().min(-3).max(3).optional(),
  supports: z.array(z.string()).optional(),
});

export const ExamSystem = z.enum([
  'general',
  'airway',
  'breathing',
  'circulation',
  'disability',
  'exposure',
  'abdomen',
  'neuro',
  'msk',
  'ent',
  'ophthal',
  'obstetric',
  'psych',
  'paeds_pat',
  'paeds_assessment_triangle',
  'secondary_survey',
]);

export const ExamFinding = z.object({
  name: z.string(),
  value: z.string().optional(),
  present: z.boolean().default(true),
  pertinent_negative: z.boolean().default(false),
  red_flag: z.boolean().default(false),
  /** Differentials this finding clinically supports — see HistoryItem.supports. */
  supports: z.array(z.string()).optional(),
});

/**
 * Discoverable examination manoeuvre (M40). When set, examining the
 * parent system reveals the base \`findings\` list; the manoeuvres
 * sit BELOW that list as additional clicks ('Log-roll', 'Pronator
 * drift', 'Cranial nerves IX–X', etc). Clicking a manoeuvre reveals
 * its findings as if they had been examined that way — the
 * difference between just-eyeballing the system and actually
 * performing the specific clinical technique.
 *
 * Authors should put red-flag-or-must-not-miss findings behind the
 * manoeuvre that would discover them — eg a contralateral pronator
 * drift behind 'Pronator drift', a posterior scalp laceration behind
 * 'Log-roll', etc. The point is to simulate the technique, not the
 * display.
 */
export const ExamManoeuvre = z.object({
  id: z.string(),
  label: z.string(),
  findings: z.array(ExamFinding),
});

export const ExamSystemFindings = z.object({
  system: ExamSystem,
  findings: z.array(ExamFinding),
  manoeuvres: z.array(ExamManoeuvre).optional(),
});

// ─── Investigations ─────────────────────────────────────────────────────────

export const InvestigationCategory = z.enum([
  'bedside',
  'blood',
  'urine',
  'imaging',
  'ecg',
  'culture',
  'gas',
  'other',
]);

export const Investigation = z.object({
  id: z.string(),
  name: z.string(),
  category: InvestigationCategory,
  turnaround_min: z.number().nonnegative(),
  result_summary: z.string(),
  abnormal: z.boolean().default(false),
  sources: z.array(Citation).optional(),
  /** Differentials this result clinically supports — see HistoryItem.supports. */
  supports: z.array(z.string()).optional(),
  /**
   * Marks this investigation as part of the case's essential workup
   * (M36). When ANY ix in a case carries essential: true, the debrief
   * tallies essential-ordered vs extra-ordered and applies a soft
   * percent penalty (-2% per extra beyond a 2-investigation free
   * allowance, capped at -10%). Cases with no essential markers are
   * excluded from the workup metric entirely — backwards-compatible.
   */
  essential: z.boolean().default(false),
  /**
   * Optional link to a daily ECG bank entry (M31). When set, the
   * resulted ix surfaces an inline 'interpret the rhythm strip' prompt
   * before the paragraph result. Used to pair the case's clinical
   * narrative with the standalone ECG-interpretation skill.
   */
  ecg_challenge_id: z.string().optional(),
});

// ─── Differential & management ──────────────────────────────────────────────

export const DifferentialItem = z.object({
  diagnosis: z.string(),
  likelihood: z.enum(['top', 'must_not_miss', 'worth_considering', 'unlikely']),
  discriminator: z.string().describe('What investigation/finding rules this in or out.'),
});

export const ManagementCategory = z.enum([
  'drug',
  'fluid',
  'procedure',
  'monitoring',
  'referral',
  'disposition',
  'escalation',
  'safety_net',
  'observation',
  'communication',
]);

const DrugDose = z.object({
  amount: z.string().describe('e.g. "500 micrograms" or "10 mg/kg"'),
  route: z.enum(['IM', 'IV', 'SC', 'PO', 'PR', 'IN', 'NEB', 'IO', 'SL', 'topical', 'other']),
  frequency: z.string().describe('e.g. "STAT", "once", "every 5 min PRN"'),
  max_dose: z.string().optional(),
  paeds_dose: z.string().optional().describe('e.g. "10 micrograms/kg"'),
});

export const ResusLetter = z.enum(['A', 'B', 'C', 'D', 'E']);

export const ManagementAction = z.object({
  id: z.string(),
  category: ManagementCategory,
  name: z.string(),
  detail: z.string().optional(),
  drug: DrugDose.optional(),
  must_do: z.boolean().default(false).describe('If true, omitting penalises the debrief.'),
  must_not_do: z.boolean().default(false).describe('If true, doing it is an examiner trap.'),
  /** ABCDE bucket for the resus action wheel (M13). Optional. */
  resus_letter: ResusLetter.optional(),
  /**
   * This action must be preceded by every listed management id. Taking it
   * out-of-order is a sequence error — the kernel logs a danger entry,
   * records it as a per-case sequence error, and the debrief penalises
   * the score (M20). Distinct from `must_not_do`: the action itself
   * is correct, but only in the right order.
   */
  prereq_action_ids: z.array(z.string()).optional(),
  /**
   * Clinical-reasoning gate (M35). When set, this action only appears
   * on the management chart once the player has asked at least one of
   * the listed history items. Used to hide examiner-trap options
   * (must_not_do) until the player has heard the *cue* that would
   * make the trap tempting — simulating the cognitive trap rather
   * than just displaying it.
   */
  gated_by_history: z.array(z.string()).optional(),
  sources: z.array(Citation).optional(),
});

// ─── Vitals (M12) ───────────────────────────────────────────────────────────

export const VitalsValues = z.object({
  hr: z.number().int().nonnegative().optional(),
  rr: z.number().int().nonnegative().optional(),
  /** SpO2 % (room air unless `on_o2` true). */
  spo2: z.number().int().min(0).max(100).optional(),
  /** Patient is receiving supplemental oxygen — adds 2 to NEWS2. */
  on_o2: z.boolean().optional(),
  bp_sys: z.number().int().nonnegative().optional(),
  bp_dia: z.number().int().nonnegative().optional(),
  gcs: z.number().int().min(3).max(15).optional(),
  temp_c: z.number().optional(),
  /** Capillary blood glucose, mmol/L. */
  bm: z.number().optional(),
});

export const Vitals = z.object({
  baseline: VitalsValues,
  deteriorating: VitalsValues.optional(),
  arrested: VitalsValues.optional(),
});

// ─── Demographics ───────────────────────────────────────────────────────────

export const Demographics = z.object({
  age_value: z.number().nonnegative(),
  age_unit: z.enum(['days', 'weeks', 'months', 'years']),
  sex: Sex,
  weight_kg: z.number().positive().optional(),
  gestation_weeks: z.number().nonnegative().optional(),
  pmh: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  social: z.string().optional(),
});

// ─── Case ───────────────────────────────────────────────────────────────────

export const CaseId = z
  .string()
  .regex(/^case_[a-z0-9_]+$/, 'case ids must look like case_<snake_case>');

export const Case = z.object({
  schema_version: z.literal(1),
  id: CaseId,
  title: z.string().min(1).describe('Internal title for content authors.'),
  chief_complaint: z.string().min(1).describe('Short player-facing label, e.g. "?Anaphylaxis".'),
  vignette: z.string().min(1).describe('Player-facing scene-set on arrival.'),
  topic_id: z.string().describe('References content/topic-map.yaml topic id.'),

  // Curriculum mapping
  curriculum_tags: z.array(CurriculumCode).nonempty(),
  slos: z.array(SloNumber).nonempty(),
  difficulty_band: DifficultyBand,
  paeds: z.boolean().default(false),

  // Patient
  demographics: Demographics,
  triage_category: TriageCategory,
  initial_state: CaseState,
  /** Optional baseline + per-state vital signs. If omitted, the encounter
   *  shows derived defaults based on state and age. Strongly recommended
   *  for SLO-3 / resus cases. */
  vitals: Vitals.optional(),
  /** When set, the encounter offers a "Resus Mode" ABCDE action wheel
   *  alongside the standard sections. SLO-3 / resus cases only. */
  resus_protocol: z
    .enum(['als_adult', 'apls_paeds', 'atls', 'choking_adult', 'choking_child'])
    .optional(),
  /** Where in the ED the patient sits — drives hub-view layout. */
  bay: z
    .enum(['resus', 'majors', 'minors', 'paeds', 'relatives', 'ambulatory', 'triage'])
    .optional(),

  // Clinical content (Kosoko-style template — see DECISIONS D-006)
  history: z.array(HistoryItem).default([]),
  examination: z.array(ExamSystemFindings).default([]),
  investigations: z.array(Investigation).default([]),
  differential: z.array(DifferentialItem).nonempty(),
  working_diagnosis: z.string().min(1),
  management: z.array(ManagementAction).nonempty(),

  // Outcomes
  disposition_options: z
    .array(
      z.object({
        label: z.string(),
        criteria: z.string(),
        appropriate: z.boolean(),
      }),
    )
    .nonempty(),

  // Simulation kernel hooks (used by Milestone 4)
  state_machine: z.object({
    states: z.array(CaseState).nonempty(),
    transitions: z.array(StateTransition),
  }),

  // Learning content
  pearls: z.array(z.string()).default([]),
  pitfalls: z.array(z.string()).default([]),

  // Authoritative citations for every clinical claim in the case
  sources: z.array(Citation).nonempty(),

  // Author metadata
  author_notes: z.string().optional(),
});

// ─── Scheduled events ───────────────────────────────────────────────────────

export const ScheduledEvent = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('results_back'),
    t_min: z.number().nonnegative(),
    case_id: CaseId,
    investigation_id: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('news2_escalation'),
    t_min: z.number().nonnegative(),
    case_id: CaseId,
    new_news2: z.number().int().min(0).max(20),
    if_no_action: z.boolean().default(true),
  }),
  z.object({
    id: z.string(),
    type: z.literal('new_arrival'),
    t_min: z.number().nonnegative(),
    case_id: CaseId,
  }),
  z.object({
    id: z.string(),
    type: z.literal('family_arrival'),
    t_min: z.number().nonnegative(),
    case_id: CaseId,
    npc: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('bed_manager_pressure'),
    t_min: z.number().nonnegative(),
    severity: z.enum(['gentle', 'firm', 'red_alert']),
  }),
  z.object({
    id: z.string(),
    type: z.literal('lab_callback'),
    t_min: z.number().nonnegative(),
    case_id: CaseId,
    investigation_id: z.string(),
    urgent_finding: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('deterioration_if_not_x_by_t'),
    t_min: z.number().nonnegative(),
    case_id: CaseId,
    required_action_ids: z.array(z.string()).nonempty(),
    new_state: CaseState,
  }),
  z.object({
    id: z.string(),
    type: z.literal('arc_reveal'),
    t_min: z.number().nonnegative(),
    arc_id: z.string(),
    reveal_id: z.string(),
  }),
]);

// ─── Arc ────────────────────────────────────────────────────────────────────

export const ArcId = z
  .string()
  .regex(/^arc_[a-z0-9_]+$/, 'arc ids must look like arc_<snake_case>');

export const ArcType = z.enum([
  'family_relation',
  'shared_incident',
  'hidden_identity',
  'frequent_flyer_new_pathology',
  'recurring_npc',
  'safeguarding',
  'environmental_shared_source',
  'other',
]);

export const ArcRevealTrigger = z.discriminatedUnion('on', [
  z.object({
    id: z.string(),
    on: z.literal('clock_time'),
    t_min: z.number().nonnegative(),
  }),
  z.object({
    id: z.string(),
    on: z.literal('action'),
    action_id: z.string(),
    in_case_id: CaseId,
  }),
  z.object({
    id: z.string(),
    on: z.literal('history_asked'),
    history_id: z.string(),
    in_case_id: CaseId,
  }),
  z.object({
    id: z.string(),
    on: z.literal('examined'),
    system: z.string(),
    in_case_id: CaseId,
  }),
  z.object({
    id: z.string(),
    on: z.literal('finding'),
    finding_id: z.string(),
    in_case_id: CaseId,
  }),
  z.object({
    id: z.string(),
    on: z.literal('investigation_back'),
    investigation_id: z.string(),
    in_case_id: CaseId,
  }),
]);

export const ArcEffect = z.object({
  on_case_id: CaseId,
  unlocks_history_id: z.string().optional(),
  unlocks_finding_id: z.string().optional(),
  changes_state_to: CaseState.optional(),
  note: z.string().optional(),
});

export const Arc = z.object({
  schema_version: z.literal(1),
  id: ArcId,
  type: ArcType,
  title: z.string().min(1),
  internal_summary: z.string().min(1).describe('Author-facing only; never shown to player.'),
  cases: z.array(CaseId).min(2),
  reveals: z.array(ArcRevealTrigger).nonempty(),
  effects: z.array(ArcEffect).default([]),
});

// ─── Episode ────────────────────────────────────────────────────────────────

export const EpisodeId = z
  .string()
  .regex(/^ep_[a-z0-9_]+$/, 'episode ids must look like ep_<snake_case>');

export const Episode = z.object({
  schema_version: z.literal(1),
  id: EpisodeId,
  title: z.string().min(1),
  learning_objectives: z.array(z.string()).nonempty(),
  curriculum_tags: z.array(CurriculumCode).nonempty(),
  difficulty_band: DifficultyBand,
  shift_duration_min: z.number().int().positive().default(20),
  focus_cases: z.array(CaseId).min(1).max(3),
  ambient_cases: z.array(CaseId).max(4).default([]),
  scheduled_events: z.array(ScheduledEvent).default([]),
  arcs: z.array(ArcId).default([]),
  author_notes: z.string().optional(),
});

// ─── Inferred types (re-exported for code that consumes the schemas) ────────

export type CaseT = z.infer<typeof Case>;
export type EpisodeT = z.infer<typeof Episode>;
export type VitalsValuesT = z.infer<typeof VitalsValues>;
export type VitalsT = z.infer<typeof Vitals>;
export type ArcT = z.infer<typeof Arc>;
export type ScheduledEventT = z.infer<typeof ScheduledEvent>;
export type CitationT = z.infer<typeof Citation>;
export type CaseStateT = z.infer<typeof CaseState>;
export type TransitionTriggerT = z.infer<typeof TransitionTrigger>;
export type ArcRevealTriggerT = z.infer<typeof ArcRevealTrigger>;
export type ArcEffectT = z.infer<typeof ArcEffect>;
export type BayT = 'resus' | 'majors' | 'minors' | 'paeds' | 'relatives' | 'ambulatory' | 'triage';
