import {
  TELCOX_CUSTOMERS,
  TELCOX_PDF_SUMMARY,
  TelcoCustomerRecord,
} from '../data/telcoxDataset.ts';

export type MaturityStageId = 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive';

export interface MaturityActivityItem {
  id: string;
  title: string;
  stage: MaturityStageId;
  telcoxStatus: 'implemented' | 'partial' | 'missing';
  sourceTables: string[];
  pdfEvidence: string;
  analyticalMechanism: string;
  retentionImpact: string;
  maturityScoreContribution: number;
}

export interface PrescriptivePolicyConfig {
  maxHoldTimeSecThreshold: number;
  unresolvedCallTriggerCount: number;
  detractorNpsThreshold: number;
  networkLatencyAutoCreditMs: number;
  proactiveBillCreditUsd: number;
  enableCellToCustomerJoin: boolean;
  enableRealTimeTier2Routing: boolean;
  enableStorePosRetentionPrompt: boolean;
}

export interface CustomerRetentionAssessment {
  customer: TelcoCustomerRecord;
  predictiveRiskScore: number; // 0 to 100
  riskBand: 'critical' | 'elevated' | 'moderate' | 'low';
  primaryChurnDrivers: string[];
  prescribedAction: {
    actionCode: string;
    actionTitle: string;
    channel: 'Call Center' | 'Network Ops' | 'Retail POS' | 'Account Executive';
    estimatedCreditCostUsd: number;
    expectedChurnReductionPct: number;
    monthlyRevenueProtectedUsd: number;
    rationale: string;
  };
}

export interface SimulationSummaryResult {
  baselineChurnRatePct: number;
  projectedChurnRatePct: number;
  churnReductionDeltaPct: number;
  atRiskActiveCustomersCount: number;
  estimatedCustomersSaved: number;
  monthlyRevenueSavedUsd: number;
  annualRevenueSavedUsd: number;
  totalInterventionCostUsd: number;
  netAnnualRoiPct: number;
  maturityIndexScore: number; // 1.0 to 4.0 scale
}

export interface LiveTelemetryEvent {
  id: string;
  timestampIso: string;
  channel: 'call_center' | 'network_cell' | 'retail_store';
  customerId: number;
  customerSegment: 'consumer' | 'smallbiz';
  customerPlan: 'prepaid' | 'unlimited' | 'enterprise';
  monthlySpend: number;
  cellId?: string;
  storeId?: 'store_A' | 'store_B' | 'store_C';
  eventLabel: string;
  rawMetricSummary: string;
  previousRiskScore: number;
  updatedRiskScore: number;
  prescriptiveInterventionTriggered: string;
  automatedStatus: 'auto_dispatched' | 'queued_for_agent' | 'monitored';
  mrrProtectedUsd: number;
}

export const DEFAULT_PRESCRIPTIVE_POLICY: PrescriptivePolicyConfig = {
  maxHoldTimeSecThreshold: 325,
  unresolvedCallTriggerCount: 6,
  detractorNpsThreshold: 4,
  networkLatencyAutoCreditMs: 185,
  proactiveBillCreditUsd: 20,
  enableCellToCustomerJoin: true,
  enableRealTimeTier2Routing: true,
  enableStorePosRetentionPrompt: true,
};

export const MATURITY_STAGE_METADATA: Record<
  MaturityStageId,
  {
    levelNumber: number;
    name: string;
    coreQuestion: string;
    telcoxCurrentState: string;
    baselineCoveragePct: number;
    targetCoveragePct: number;
    summaryVerdict: string;
  }
> = {
  descriptive: {
    levelNumber: 1,
    name: 'Descriptive Analytics',
    coreQuestion: 'What happened across TelcoX channels?',
    telcoxCurrentState: 'Operational in static spreadsheets (90% coverage)',
    baselineCoveragePct: 90,
    targetCoveragePct: 100,
    summaryVerdict:
      'TelcoX logs raw historical counts across 4 tables (200 customers, 5,000 calls, 1,000 network events, 300 store visits) and tracks 6-month historical churn (31.0%), but suffers from 2,663 corrupted (##########) timestamp cells.',
  },
  diagnostic: {
    levelNumber: 2,
    name: 'Diagnostic Analytics',
    coreQuestion: 'Why did customers churn or complain?',
    telcoxCurrentState: 'Fragmented & manual post-mortem (55% coverage)',
    baselineCoveragePct: 55,
    targetCoveragePct: 100,
    summaryVerdict:
      'Analysts can manually cross-tabulate customer_id across Calls and Store Visits to see that churned users have lower NPS (3.87 vs 4.33) and shorter tenure (58.3 vs 65.8 mos), but Network Events (cell_id) have no foreign key to customer_id.',
  },
  predictive: {
    levelNumber: 3,
    name: 'Predictive Analytics',
    coreQuestion: 'Which active customers will churn next & when?',
    telcoxCurrentState: 'Missing in real-time operations (15% coverage)',
    baselineCoveragePct: 15,
    targetCoveragePct: 95,
    summaryVerdict:
      'TelcoX only records churn_6mo_flag (0 or 1) after cancellation. It lacks a live propensity model that scores the 138 currently retained accounts as call hold times, transfers, and cell outages accumulate.',
  },
  prescriptive: {
    levelNumber: 4,
    name: 'Prescriptive Analytics',
    coreQuestion: 'What automated action should we trigger right now?',
    telcoxCurrentState: 'Completely Missing — Critical Maturity Gap (0% coverage)',
    baselineCoveragePct: 0,
    targetCoveragePct: 95,
    summaryVerdict:
      'The missing maturity level. TelcoX has zero closed-loop Next-Best-Action (NBA) workflows to auto-route high-spend callers on hold, issue proactive SLA credits during cell latency spikes, or prompt store reps with retention offers.',
  },
};

export const INITIAL_MATURITY_ACTIVITIES: MaturityActivityItem[] = [
  {
    id: 'act-desc-1',
    title: '6-Month Cohort Churn & Revenue Baseline Reporting',
    stage: 'descriptive',
    telcoxStatus: 'implemented',
    sourceTables: ['Customers (200 rows)'],
    pdfEvidence:
      '62 of 200 customers flagged with churn_6mo_flag = 1 (31.0% churn rate), representing $9,926.99/mo in lost MRR out of $32,122.67 total MRR.',
    analyticalMechanism:
      'Static aggregation of monthly_spend, tenure_months, segment (consumer vs smallbiz), plan_type, and nps_score.',
    retentionImpact:
      'Quantifies the historical revenue bleed ($119.1K ARR lost) but provides zero advance warning before an account cancels.',
    maturityScoreContribution: 0.45,
  },
  {
    id: 'act-desc-2',
    title: 'Call Center Volume, Hold Time & First-Call Resolution Logs',
    stage: 'descriptive',
    telcoxStatus: 'implemented',
    sourceTables: ['Call Center Interactions (5,000 rows)'],
    pdfEvidence:
      '5,000 calls logged across agents 500–519: 79.72% resolved (1,014 unresolved), 301.3s avg hold time, 939.5s avg duration across billing (1,264), upgrade (1,269), network (1,252), and device (1,215).',
    analyticalMechanism:
      'Tabulates call_reason_tag, resolved_flag, hold_time_sec, and transfer_count per interaction.',
    retentionImpact:
      'Surfaces operational workload metrics, though 2,121 timestamps (42.4%) are corrupted as ########## in the spreadsheet export.',
    maturityScoreContribution: 0.45,
  },
  {
    id: 'act-desc-3',
    title: 'Cell Tower QoS Incident & Retail Store Foot-Traffic Tallies',
    stage: 'descriptive',
    telcoxStatus: 'implemented',
    sourceTables: ['Network Events (1,000 rows)', 'Store Visits (300 rows)'],
    pdfEvidence:
      '1,000 cell events across cell_200–cell_219 (9.73% avg packet loss, 174.4ms avg latency) and 300 store visits across store_A/B/C ($74,684.97 purchase value).',
    analyticalMechanism:
      'Counts network anomalies (packet_loss, latency_spike, throughput_drop) and retail visits by issue_type.',
    retentionImpact:
      'Tracks infrastructure and retail volume in silos without connecting cell tower degradation to specific subscribers.',
    maturityScoreContribution: 0.35,
  },
  {
    id: 'act-diag-1',
    title: 'NPS Detractor & Low-Tenure Churn Root-Cause Correlation',
    stage: 'diagnostic',
    telcoxStatus: 'implemented',
    sourceTables: ['Customers (200 rows)'],
    pdfEvidence:
      'Churned subscribers average 3.87 NPS and 58.3 months tenure vs. 4.33 NPS and 65.8 months tenure for retained subscribers; detractors (NPS 0–4) exhibit significantly higher churn.',
    analyticalMechanism:
      'Cross-tabulates churn_6mo_flag against nps_score brackets, tenure_months cohorts, and plan_type.',
    retentionImpact:
      'Confirms that customer dissatisfaction (low NPS) and early-to-mid lifecycle friction are primary drivers of historical exits.',
    maturityScoreContribution: 0.3,
  },
  {
    id: 'act-diag-2',
    title: 'Unresolved Support Calls, Hold Time & Multi-Transfer Friction Analysis',
    stage: 'diagnostic',
    telcoxStatus: 'partial',
    sourceTables: ['Customers (200 rows)', 'Call Center Interactions (5,000 rows)'],
    pdfEvidence:
      'Joining customer_id across Customers and Calls reveals subscribers average 25 calls and ~5 unresolved interactions; repeated transfers (transfer_count = 2) and >300s holds compound dissatisfaction.',
    analyticalMechanism:
      'Relational join on customer_id evaluating resolved_flag = 0 and hold_time_sec against churn_6mo_flag.',
    retentionImpact:
      'Diagnoses why customers leave after call center friction, but insights arrive only in backward-looking case reviews.',
    maturityScoreContribution: 0.25,
  },
  {
    id: 'act-diag-3',
    title: 'Data Schema Silo & Timestamp Corruption Root-Cause Audit',
    stage: 'diagnostic',
    telcoxStatus: 'partial',
    sourceTables: ['All 4 TelcoX Tables (6,500 total records)'],
    pdfEvidence:
      '42.4% of Call timestamps (2,121), 41.9% of Network timestamps (419), and 41.0% of Store timestamps (123) are corrupted as ##########, and Network Events (cell_id) lack a customer_id foreign key.',
    analyticalMechanism:
      'Data engineering audit of schema joinability and temporal sequence integrity across channels.',
    retentionImpact:
      'Explains why TelcoX cannot currently perform time-series event sequencing (e.g., Network Outage -> Call -> Store Visit -> Churn).',
    maturityScoreContribution: 0.2,
  },
  {
    id: 'act-pred-1',
    title: 'Real-Time Subscriber Churn Propensity Scoring (0–100%)',
    stage: 'predictive',
    telcoxStatus: 'missing',
    sourceTables: ['Customers', 'Call Center', 'Store Visits', 'Network Events'],
    pdfEvidence:
      '138 active customers currently have churn_6mo_flag = 0, yet 44 of them have NPS <= 3 and multiple unresolved calls—putting $7,140+/mo of active MRR at immediate unflagged risk.',
    analyticalMechanism:
      'Multivariate hazard scoring combining live NPS, unresolved call ratio, avg hold time, transfer count, tenure, and cell latency.',
    retentionImpact:
      'Shifts TelcoX from lagging post-mortem flags (churn_6mo_flag) to leading 30-day churn probability alerts for every active account.',
    maturityScoreContribution: 0.9,
  },
  {
    id: 'act-pred-2',
    title: 'Cell-to-Subscriber QoS Churn Contagion Forecasting',
    stage: 'predictive',
    telcoxStatus: 'missing',
    sourceTables: ['Network Events (cell_200–cell_219)', 'Customers'],
    pdfEvidence:
      'Towers like cell_204 and cell_211 experience recurring latency spikes (>180ms) and packet loss (>10%) that precede network support calls.',
    analyticalMechanism:
      'Geospatial/home-cell mapping linking cell_id telemetry streams to assigned subscriber IDs to predict complaint spikes.',
    retentionImpact:
      'Predicts localized churn waves 48–72 hours before affected customers call support or visit a retail store.',
    maturityScoreContribution: 0.5,
  },
  {
    id: 'act-presc-1',
    title: 'Automated Real-Time Call Center Next-Best-Action (NBA) & Tier-2 Routing',
    stage: 'prescriptive',
    telcoxStatus: 'missing',
    sourceTables: ['Call Center Interactions (Live Stream)', 'Customers'],
    pdfEvidence:
      'High-value enterprise/unlimited callers with unresolved issues currently endure >300s hold times and 1–2 transfers with no automated intervention.',
    analyticalMechanism:
      'Real-time decision engine that intercepts live calls when hold_time_sec > threshold or unresolved_calls >= 4, bypassing queues to Tier-2 Retention.',
    retentionImpact:
      'Directly prevents acute call-induced churn during the moment of friction, cutting unresolved escalations by up to 62%.',
    maturityScoreContribution: 0.35,
  },
  {
    id: 'act-presc-2',
    title: 'Proactive Network Outage SLA Micro-Credits & SMS Resolution',
    stage: 'prescriptive',
    telcoxStatus: 'missing',
    sourceTables: ['Network Events (Live Stream)', 'Customers'],
    pdfEvidence:
      '1,252 support calls (25.0% of all calls) are tagged "network"; customers currently have to call in and wait on hold to report packet loss or latency spikes.',
    analyticalMechanism:
      'Automated prescriptive rule: when cell_id avg_latency_ms > threshold, auto-apply a $20 SLA bill credit and notify affected subscribers.',
    retentionImpact:
      'Eliminates inbound network complaint calls and converts service degradation into a trust-building retention touchpoint.',
    maturityScoreContribution: 0.35,
  },
  {
    id: 'act-presc-3',
    title: 'Retail Store POS Retention Offer & Plan Optimization Prompt',
    stage: 'prescriptive',
    telcoxStatus: 'missing',
    sourceTables: ['Store Visits (store_A, store_B, store_C)', 'Customers'],
    pdfEvidence:
      '151 of 300 store visits (50.3%) are for "support" (83) or "billing" (68) rather than new purchases, representing walk-in cancellation risk.',
    analyticalMechanism:
      'Pushes real-time Next-Best-Offer (device upgrade subsidy or billing waiver) to store_A/B/C POS terminals when an at-risk customer checks in.',
    retentionImpact:
      'Turns walk-in support/billing complaints at retail stores into 12-month contract renewals.',
    maturityScoreContribution: 0.3,
  },
];

/**
 * Computes a deterministic 0-100 predictive churn risk score and prescribed Next-Best-Action
 * for a single TelcoX customer record under a given prescriptive policy configuration.
 */
export function evaluateCustomerRetentionProfile(
  customer: TelcoCustomerRecord,
  policy: PrescriptivePolicyConfig = DEFAULT_PRESCRIPTIVE_POLICY,
  liveRiskDelta = 0
): CustomerRetentionAssessment {
  const drivers: string[] = [];

  // 1. NPS contribution (0 to 34 pts)
  const npsComponent = Math.round(((9 - customer.nps_score) / 9) * 34);
  if (customer.nps_score <= policy.detractorNpsThreshold) {
    drivers.push(`Detractor NPS (${customer.nps_score}/9)`);
  }

  // 2. Unresolved calls contribution (0 to 24 pts)
  const unresolvedRatio =
    customer.total_calls > 0 ? customer.unresolved_calls / customer.total_calls : 0;
  const unresolvedComponent = Math.min(
    24,
    Math.round(customer.unresolved_calls * 2.8 + unresolvedRatio * 20)
  );
  if (customer.unresolved_calls >= policy.unresolvedCallTriggerCount) {
    drivers.push(`${customer.unresolved_calls} unresolved calls`);
  }

  // 3. Call Hold Time & Transfers contribution (0 to 18 pts)
  const holdComponent = Math.min(12, Math.max(0, Math.round((customer.avg_hold_sec - 180) / 18)));
  const transferComponent = Math.min(6, Math.round(customer.total_transfers / 6));
  if (customer.avg_hold_sec >= policy.maxHoldTimeSecThreshold) {
    drivers.push(`High avg hold (${customer.avg_hold_sec}s)`);
  }

  // 4. Tenure contribution (0 to 14 pts - lower tenure = higher risk)
  const tenureComponent = Math.max(0, Math.round(((120 - customer.tenure_months) / 120) * 14));
  if (customer.tenure_months <= 24) {
    drivers.push(`Early tenure (${customer.tenure_months} mos)`);
  }

  // 5. Historical churn flag & channel mix (0 to 10 pts)
  const historyBoost = customer.churn_6mo_flag === 1 ? 8 : 0;
  if (customer.network_calls >= 7) {
    drivers.push(`Repeated network calls (${customer.network_calls})`);
  }
  if (customer.billing_calls >= 7) {
    drivers.push(`Billing friction (${customer.billing_calls} calls)`);
  }

  const rawScore =
    npsComponent +
    unresolvedComponent +
    holdComponent +
    transferComponent +
    tenureComponent +
    historyBoost +
    liveRiskDelta;

  const predictiveRiskScore = Math.max(5, Math.min(99, rawScore));

  let riskBand: CustomerRetentionAssessment['riskBand'] = 'low';
  if (predictiveRiskScore >= 72) {
    riskBand = 'critical';
  } else if (predictiveRiskScore >= 54) {
    riskBand = 'elevated';
  } else if (predictiveRiskScore >= 36) {
    riskBand = 'moderate';
  }

  if (drivers.length === 0) {
    drivers.push('Baseline lifecycle monitoring');
  }

  // Prescriptive Next-Best-Action selection based on dominant driver and policy
  let actionCode = 'NBA-MONITOR';
  let actionTitle = 'Automated Lifecycle Pulse Check';
  let channel: CustomerRetentionAssessment['prescribedAction']['channel'] = 'Account Executive';
  let estimatedCreditCostUsd = 0;
  let expectedChurnReductionPct = 8;
  let rationale = 'Account within nominal operational thresholds; continue passive telemetry.';

  if (
    policy.enableStorePosRetentionPrompt &&
    customer.store_visits >= 2 &&
    customer.nps_score <= policy.detractorNpsThreshold
  ) {
    actionCode = 'NBA-POS-UPGRADE';
    actionTitle = 'In-Store POS Device/Plan Loyalty Subsidy';
    channel = 'Retail POS';
    estimatedCreditCostUsd = Math.round(policy.proactiveBillCreditUsd * 1.25);
    expectedChurnReductionPct = 42;
    rationale = `Detractor (NPS ${customer.nps_score}) with ${customer.store_visits} retail store visits. Trigger POS loyalty subsidy on next walk-in check-in.`;
  } else if (
    policy.enableCellToCustomerJoin &&
    customer.network_calls >= 7 &&
    predictiveRiskScore >= 40
  ) {
    actionCode = 'NBA-NET-SLA';
    actionTitle = `Proactive ${customer.assigned_cell_id} QoS SLA Credit & Priority Routing`;
    channel = 'Network Ops';
    estimatedCreditCostUsd = policy.proactiveBillCreditUsd;
    expectedChurnReductionPct = 40;
    rationale = `Linked ${customer.assigned_cell_id} telemetry to subscriber account (${customer.network_calls} network calls). Auto-issue $${policy.proactiveBillCreditUsd} SLA credit before next billing cycle.`;
  } else if (
    policy.enableRealTimeTier2Routing &&
    (customer.unresolved_calls >= policy.unresolvedCallTriggerCount ||
      customer.avg_hold_sec >= policy.maxHoldTimeSecThreshold)
  ) {
    actionCode = 'NBA-TIER2-RESCUE';
    actionTitle = 'Zero-Hold Tier-2 Retention Escalation + Fee Waiver';
    channel = 'Call Center';
    estimatedCreditCostUsd = policy.proactiveBillCreditUsd;
    expectedChurnReductionPct = 45;
    rationale = `Customer has ${customer.unresolved_calls} unresolved calls and ${customer.avg_hold_sec}s avg hold time. Bypass standard IVR queue to Tier-2 specialist with instant $${policy.proactiveBillCreditUsd} credit authority.`;
  } else if (customer.nps_score <= policy.detractorNpsThreshold || predictiveRiskScore >= 45) {
    actionCode = 'NBA-EXEC-OUTREACH';
    actionTitle = 'Proactive Detractor Executive Callback & Plan Audit';
    channel = 'Account Executive';
    estimatedCreditCostUsd = Math.round(policy.proactiveBillCreditUsd * 0.75);
    expectedChurnReductionPct = 32;
    rationale = `Low NPS score (${customer.nps_score}/9) on $${customer.monthly_spend.toFixed(2)}/mo ${customer.plan_type} plan requires proactive bill right-sizing.`;
  }

  const monthlyRevenueProtectedUsd = Number(
    ((customer.monthly_spend * (predictiveRiskScore / 100) * expectedChurnReductionPct) / 100).toFixed(2)
  );

  return {
    customer,
    predictiveRiskScore,
    riskBand,
    primaryChurnDrivers: drivers,
    prescribedAction: {
      actionCode,
      actionTitle,
      channel,
      estimatedCreditCostUsd,
      expectedChurnReductionPct,
      monthlyRevenueProtectedUsd,
      rationale,
    },
  };
}

/**
 * Simulates the organization-wide retention and financial impact of upgrading TelcoX
 * from its baseline Maturity (Level 1.8: Descriptive/Partial Diagnostic) to Level 4.0
 * (Real-Time Predictive + Prescriptive Analytics) under the given policy configuration.
 */
export function simulatePrescriptiveImpact(
  customers: TelcoCustomerRecord[] = TELCOX_CUSTOMERS,
  policy: PrescriptivePolicyConfig = DEFAULT_PRESCRIPTIVE_POLICY
): SimulationSummaryResult {
  const assessments = customers.map((c) => evaluateCustomerRetentionProfile(c, policy));

  const baselineChurnRatePct = TELCOX_PDF_SUMMARY.overallChurnRatePct; // 31.0%

  // Active customers or total cohort at risk
  const highRiskAssessments = assessments.filter(
    (a) => a.predictiveRiskScore >= 50 || a.customer.churn_6mo_flag === 1
  );

  let totalMonthlySaved = 0;
  let totalInterventionCost = 0;
  let weightedChurnReductionSum = 0;

  for (const item of highRiskAssessments) {
    totalMonthlySaved += item.prescribedAction.monthlyRevenueProtectedUsd;
    totalInterventionCost += item.prescribedAction.estimatedCreditCostUsd;
    weightedChurnReductionSum += item.prescribedAction.expectedChurnReductionPct / 100;
  }

  const avgPolicyEffectiveness =
    highRiskAssessments.length > 0 ? weightedChurnReductionSum / highRiskAssessments.length : 0;

  // Calculate enabled prescriptive levers multiplier
  const enabledLeversCount =
    (policy.enableCellToCustomerJoin ? 1 : 0) +
    (policy.enableRealTimeTier2Routing ? 1 : 0) +
    (policy.enableStorePosRetentionPrompt ? 1 : 0);

  const leverFactor = 0.35 + (enabledLeversCount / 3) * 0.65;

  const estimatedCustomersSaved = Math.max(
    1,
    Math.min(
      TELCOX_PDF_SUMMARY.churnedCustomers,
      Math.round(TELCOX_PDF_SUMMARY.churnedCustomers * avgPolicyEffectiveness * leverFactor * 1.15)
    )
  );

  const projectedChurnedCustomers = Math.max(
    8,
    TELCOX_PDF_SUMMARY.churnedCustomers - estimatedCustomersSaved
  );
  const projectedChurnRatePct = Number(
    ((projectedChurnedCustomers / customers.length) * 100).toFixed(1)
  );
  const churnReductionDeltaPct = Number((baselineChurnRatePct - projectedChurnRatePct).toFixed(1));

  const monthlyRevenueSavedUsd = Number((totalMonthlySaved * leverFactor).toFixed(2));
  const annualRevenueSavedUsd = Number((monthlyRevenueSavedUsd * 12).toFixed(2));
  const totalInterventionCostUsd = Number((totalInterventionCost * 2).toFixed(2)); // 6-mo campaign cost
  const netAnnualRoiPct =
    totalInterventionCostUsd > 0
      ? Math.round(
          ((annualRevenueSavedUsd - totalInterventionCostUsd) / totalInterventionCostUsd) * 100
        )
      : 0;

  // Maturity score: 1.8 baseline + up to 2.2 from predictive & prescriptive capabilities
  const maturityIndexScore = Number((1.8 + (enabledLeversCount / 3) * 2.2).toFixed(2));

  return {
    baselineChurnRatePct,
    projectedChurnRatePct,
    churnReductionDeltaPct,
    atRiskActiveCustomersCount: highRiskAssessments.filter((a) => a.customer.churn_6mo_flag === 0)
      .length,
    estimatedCustomersSaved,
    monthlyRevenueSavedUsd,
    annualRevenueSavedUsd,
    totalInterventionCostUsd,
    netAnnualRoiPct,
    maturityIndexScore,
  };
}

/**
 * Generates a realistic real-time telemetry event grounded in actual TelcoX customers,
 * updates their predictive churn risk score, and triggers an automated prescriptive action.
 */
export function createLiveTelemetryEvent(
  customer: TelcoCustomerRecord,
  channel: LiveTelemetryEvent['channel'],
  sequenceIndex: number,
  policy: PrescriptivePolicyConfig = DEFAULT_PRESCRIPTIVE_POLICY,
  currentRiskDelta = 0
): { event: LiveTelemetryEvent; nextRiskDelta: number } {
  const beforeProfile = evaluateCustomerRetentionProfile(customer, policy, currentRiskDelta);

  let riskIncrease = 0;
  let eventLabel = '';
  let rawMetricSummary = '';
  let cellId: string | undefined;
  let storeId: 'store_A' | 'store_B' | 'store_C' | undefined;

  if (channel === 'call_center') {
    const holdSec = 295 + ((sequenceIndex * 37) % 240);
    const reason = (['billing', 'network', 'device', 'upgrade'] as const)[sequenceIndex % 4];
    const agentId = 500 + (sequenceIndex % 20);
    riskIncrease = holdSec > policy.maxHoldTimeSecThreshold ? 9 : 4;
    eventLabel = `Live Call #${25001 + sequenceIndex} · ${reason.toUpperCase()} Escalation`;
    rawMetricSummary = `Agent ${agentId} · Hold ${holdSec}s · Transfer #${(sequenceIndex % 2) + 1} · Unresolved Queue`;
  } else if (channel === 'network_cell') {
    cellId = customer.assigned_cell_id;
    const latencyMs = 192 + ((sequenceIndex * 29) % 145);
    const lossPct = Number((8.4 + ((sequenceIndex * 3.1) % 11.2)).toFixed(1));
    riskIncrease = latencyMs > policy.networkLatencyAutoCreditMs ? 8 : 3;
    eventLabel = `Tower ${cellId} · Latency Spike & Packet Loss`;
    rawMetricSummary = `Event #${31001 + sequenceIndex} · Latency ${latencyMs}ms · Loss ${lossPct}%`;
  } else {
    storeId = (['store_A', 'store_B', 'store_C'] as const)[sequenceIndex % 3];
    const issue = (['billing', 'support', 'device', 'plan_change'] as const)[sequenceIndex % 4];
    const waitMin = 18 + ((sequenceIndex * 11) % 35);
    riskIncrease = issue === 'billing' || issue === 'support' ? 7 : 2;
    eventLabel = `Retail Check-In (${storeId}) · ${issue.replace('_', ' ').toUpperCase()}`;
    rawMetricSummary = `Visit #${40301 + sequenceIndex} · Duration ${waitMin}m · NPS ${customer.nps_score}/9`;
  }

  const nextRiskDelta = Math.min(28, currentRiskDelta + riskIncrease);
  const afterProfile = evaluateCustomerRetentionProfile(customer, policy, nextRiskDelta);

  const automatedStatus: LiveTelemetryEvent['automatedStatus'] =
    afterProfile.predictiveRiskScore >= 60
      ? 'auto_dispatched'
      : afterProfile.predictiveRiskScore >= 42
        ? 'queued_for_agent'
        : 'monitored';

  // If auto_dispatched, prescriptive intervention mitigates risk delta
  const mitigatedRiskScore =
    automatedStatus === 'auto_dispatched'
      ? Math.max(18, afterProfile.predictiveRiskScore - 14)
      : afterProfile.predictiveRiskScore;

  return {
    nextRiskDelta:
      automatedStatus === 'auto_dispatched' ? Math.max(0, nextRiskDelta - 10) : nextRiskDelta,
    event: {
      id: `evt-${Date.now()}-${sequenceIndex}`,
      timestampIso: new Date().toISOString(),
      channel,
      customerId: customer.customer_id,
      customerSegment: customer.segment,
      customerPlan: customer.plan_type,
      monthlySpend: customer.monthly_spend,
      cellId,
      storeId,
      eventLabel,
      rawMetricSummary,
      previousRiskScore: beforeProfile.predictiveRiskScore,
      updatedRiskScore: mitigatedRiskScore,
      prescriptiveInterventionTriggered: afterProfile.prescribedAction.actionTitle,
      automatedStatus,
      mrrProtectedUsd: afterProfile.prescribedAction.monthlyRevenueProtectedUsd,
    },
  };
}

export interface ChurnTrajectoryPoint {
  periodLabel: string;
  milestoneDescription: string;
  timestampTag: string;
  staticBaselineChurnPct: number;
  predictiveOnlyChurnPct: number;
  activePrescriptiveChurnPct: number;
  cumulativeAccountsSaved: number;
  cumulativeMrrSavedUsd: number;
  liveInterventionsCount: number;
}

/**
 * Generates a 10-point time-series trajectory showing historical & projected churn rate
 * reduction over time based on the active PrescriptivePolicyConfig and real-time stream state.
 */
export function generateRealTimeChurnTrajectory(
  policy: PrescriptivePolicyConfig = DEFAULT_PRESCRIPTIVE_POLICY,
  liveEvents: LiveTelemetryEvent[] = []
): ChurnTrajectoryPoint[] {
  const sim = simulatePrescriptiveImpact(TELCOX_CUSTOMERS, policy);
  const startChurn = TELCOX_PDF_SUMMARY.overallChurnRatePct; // 31.0%
  const targetChurn = sim.projectedChurnRatePct;
  const totalDelta = startChurn - targetChurn;

  const autoDispatchedCount = liveEvents.filter(
    (e) => e.automatedStatus === 'auto_dispatched'
  ).length;
  const liveStreamBonus = Math.min(1.8, Number((autoDispatchedCount * 0.08).toFixed(2)));

  const horizons = [
    { label: 'M-2', milestone: 'M-2 · Static PDF Audit', progress: 0.0, baselineCreep: -0.6 },
    { label: 'M-1', milestone: 'M-1 · Pre-Intervention', progress: 0.0, baselineCreep: -0.3 },
    { label: 'M0', milestone: 'M0 · Stream Go-Live', progress: 0.08, baselineCreep: 0.0 },
    { label: 'Wk+2', milestone: 'Wk+2 · Schema & TS Fix', progress: 0.24, baselineCreep: 0.2 },
    { label: 'M+1', milestone: 'M+1 · Tier-2 Call Routing', progress: 0.42, baselineCreep: 0.4 },
    { label: 'M+2', milestone: 'M+2 · Cell SLA Credits', progress: 0.6, baselineCreep: 0.6 },
    { label: 'M+3', milestone: 'M+3 · Store POS Prompts', progress: 0.75, baselineCreep: 0.8 },
    { label: 'M+4', milestone: 'M+4 · Closed-Loop NBA', progress: 0.86, baselineCreep: 1.0 },
    { label: 'M+5', milestone: 'M+5 · Policy Calibration', progress: 0.94, baselineCreep: 1.2 },
    { label: 'M+6', milestone: 'M+6 · Target Maturity', progress: 1.0, baselineCreep: 1.4 },
  ];

  const now = new Date();

  return horizons.map((h, idx) => {
    const staticBaselineChurnPct = Number((startChurn + h.baselineCreep).toFixed(2));
    // Level 3 Predictive-only achieves ~38% of full prescriptive reduction
    const predictiveOnlyChurnPct = Number(
      (startChurn - totalDelta * 0.38 * h.progress).toFixed(2)
    );

    const activeReduction =
      totalDelta * h.progress + (h.progress > 0 ? liveStreamBonus * h.progress : 0);
    const activePrescriptiveChurnPct = Number(
      Math.max(6.5, startChurn - activeReduction).toFixed(2)
    );

    const cumulativeAccountsSaved = Math.round(sim.estimatedCustomersSaved * h.progress);
    const cumulativeMrrSavedUsd = Number(
      (sim.monthlyRevenueSavedUsd * h.progress + autoDispatchedCount * 6.5 * h.progress).toFixed(2)
    );

    const tickTime = new Date(now.getTime() - (horizons.length - 1 - idx) * 2800);
    const timestampTag = tickTime.toISOString().slice(11, 19);

    return {
      periodLabel: h.label,
      milestoneDescription: h.milestone,
      timestampTag,
      staticBaselineChurnPct,
      predictiveOnlyChurnPct,
      activePrescriptiveChurnPct,
      cumulativeAccountsSaved,
      cumulativeMrrSavedUsd,
      liveInterventionsCount: Math.round(autoDispatchedCount * h.progress),
    };
  });
}

export interface RegionalHeatmapCell {
  regionId: string;
  regionName: string;
  sectorId: string;
  sectorLabel: string;
  cellTowerId: string;
  storeZone: 'store_A' | 'store_B' | 'store_C';
  subscriberCount: number;
  historicalChurnedCount: number;
  avgLatencyMs: number;
  avgPacketLossPct: number;
  baselineRiskPct: number;
  activeMitigatedRiskPct: number;
  riskReductionDeltaPct: number;
  mrrAtRiskUsd: number;
  mrrProtectedUsd: number;
  dominantDriver: string;
  automatedLeverDeployed: string;
}

const REGION_DEFINITIONS = [
  { id: 'reg-north', name: 'North Metro', store: 'store_A' as const, towerOffset: 0 },
  { id: 'reg-east', name: 'East Corridor', store: 'store_B' as const, towerOffset: 4 },
  { id: 'reg-central', name: 'Central Core', store: 'store_C' as const, towerOffset: 8 },
  { id: 'reg-west', name: 'West Industrial', store: 'store_A' as const, towerOffset: 12 },
  { id: 'reg-south', name: 'South Suburban', store: 'store_B' as const, towerOffset: 16 },
];

const SECTOR_DEFINITIONS = [
  { id: 'sec-1', label: 'Prepaid Consumer' },
  { id: 'sec-2', label: 'Unlimited Consumer' },
  { id: 'sec-3', label: 'SmallBiz Mobility' },
  { id: 'sec-4', label: 'Enterprise Core' },
];

/**
 * Generates a 20-cell (5 Regions x 4 Sectors) spatial churn risk heatmap grounded in
 * the 20 TelcoX cell towers (cell_200..cell_219) and 200 customers, reflecting real-time
 * telemetry deltas and active prescriptive policy mitigation.
 */
export function generateRegionalChurnHeatmap(
  policy: PrescriptivePolicyConfig = DEFAULT_PRESCRIPTIVE_POLICY,
  liveRiskDeltas: Record<number, number> = {}
): RegionalHeatmapCell[] {
  const cells: RegionalHeatmapCell[] = [];

  for (let rIdx = 0; rIdx < REGION_DEFINITIONS.length; rIdx++) {
    const reg = REGION_DEFINITIONS[rIdx];
    for (let sIdx = 0; sIdx < SECTOR_DEFINITIONS.length; sIdx++) {
      const sec = SECTOR_DEFINITIONS[sIdx];
      const towerIndex = reg.towerOffset + sIdx; // 0 to 19
      const cellTowerId = `cell_${200 + towerIndex}`;

      const assignedCustomers = TELCOX_CUSTOMERS.filter(
        (c) => c.assigned_cell_id === cellTowerId
      );

      // Compute baseline (passive policy) vs active policy assessments
      const passivePolicy: PrescriptivePolicyConfig = {
        ...policy,
        enableCellToCustomerJoin: false,
        enableRealTimeTier2Routing: false,
        enableStorePosRetentionPrompt: false,
        maxHoldTimeSecThreshold: 420,
        unresolvedCallTriggerCount: 9,
        detractorNpsThreshold: 1,
        proactiveBillCreditUsd: 10,
      };

      let baselineRiskSum = 0;
      let activeRiskSum = 0;
      let mrrAtRisk = 0;
      let mrrProtected = 0;
      let totalHold = 0;
      let totalNetworkCalls = 0;
      let totalStoreVisits = 0;

      for (const cust of assignedCustomers) {
        const delta = liveRiskDeltas[cust.customer_id] || 0;
        const baseProfile = evaluateCustomerRetentionProfile(cust, passivePolicy, delta);
        const activeProfile = evaluateCustomerRetentionProfile(cust, policy, delta);

        // Apply active prescriptive mitigation factor
        const enabledLevers =
          (policy.enableCellToCustomerJoin ? 1 : 0) +
          (policy.enableRealTimeTier2Routing ? 1 : 0) +
          (policy.enableStorePosRetentionPrompt ? 1 : 0);

        const creditFactor = (policy.proactiveBillCreditUsd - 10) / 40; // 0 to 1
        const holdFactor = (420 - policy.maxHoldTimeSecThreshold) / 240; // 0 to 1
        const mitigationPct =
          (enabledLevers / 3) * 0.28 + creditFactor * 0.08 + holdFactor * 0.08;

        const mitigatedCustomerRisk = Math.max(
          12,
          Math.round(activeProfile.predictiveRiskScore * (1 - mitigationPct))
        );

        baselineRiskSum += baseProfile.predictiveRiskScore;
        activeRiskSum += mitigatedCustomerRisk;
        mrrAtRisk += cust.monthly_spend * (baseProfile.predictiveRiskScore / 100);
        mrrProtected += activeProfile.prescribedAction.monthlyRevenueProtectedUsd;
        totalHold += cust.avg_hold_sec;
        totalNetworkCalls += cust.network_calls;
        totalStoreVisits += cust.store_visits;
      }

      const count = assignedCustomers.length || 1;
      const empiricalChurnPct =
        (assignedCustomers.filter((c) => c.churn_6mo_flag === 1).length / count) * 100;
      const avgLatencyMs = Number(
        (152 + ((towerIndex * 19) % 68) + totalNetworkCalls * 0.25).toFixed(1)
      );
      const avgPacketLossPct = Number((6.4 + ((towerIndex * 2.3) % 7.2)).toFixed(2));
      const latencyPenalty = Math.max(0, (avgLatencyMs - 165) * 0.22);

      const rawBaseline =
        (baselineRiskSum / count) * 0.55 + empiricalChurnPct * 0.35 + latencyPenalty;
      const baselineRiskPct = Number(Math.min(76, Math.max(26, rawBaseline)).toFixed(1));

      const rawMitigated =
        (activeRiskSum / count) * 0.55 + empiricalChurnPct * 0.22 + latencyPenalty * 0.4;
      const activeMitigatedRiskPct = Number(
        Math.min(baselineRiskPct - 4, Math.max(14, rawMitigated)).toFixed(1)
      );
      const riskReductionDeltaPct = Number(
        Math.max(0, baselineRiskPct - activeMitigatedRiskPct).toFixed(1)
      );

      const avgHoldSec = Math.round(totalHold / count);

      let dominantDriver = `Avg Hold ${avgHoldSec}s · ${totalNetworkCalls} Net Calls`;
      let automatedLeverDeployed = 'Lifecycle Pulse Monitoring';

      if (avgLatencyMs >= policy.networkLatencyAutoCreditMs && policy.enableCellToCustomerJoin) {
        dominantDriver = `Tower Latency ${avgLatencyMs}ms · Loss ${avgPacketLossPct}%`;
        automatedLeverDeployed = `Auto $${policy.proactiveBillCreditUsd} Cell SLA Credit (${cellTowerId})`;
      } else if (avgHoldSec >= policy.maxHoldTimeSecThreshold && policy.enableRealTimeTier2Routing) {
        dominantDriver = `Queue Hold ${avgHoldSec}s · Unresolved Friction`;
        automatedLeverDeployed = `Zero-Hold Tier-2 Routing (<${policy.maxHoldTimeSecThreshold}s)`;
      } else if (totalStoreVisits >= 12 && policy.enableStorePosRetentionPrompt) {
        dominantDriver = `${totalStoreVisits} Walk-In Visits at ${reg.store}`;
        automatedLeverDeployed = `Retail POS Upgrade Subsidy (${reg.store})`;
      } else if (baselineRiskPct >= 48) {
        dominantDriver = `Detractor NPS & Billing Escalations`;
        automatedLeverDeployed = `Executive Account Audit ($${policy.proactiveBillCreditUsd} Credit)`;
      }

      cells.push({
        regionId: reg.id,
        regionName: reg.name,
        sectorId: sec.id,
        sectorLabel: sec.label,
        cellTowerId,
        storeZone: reg.store,
        subscriberCount: assignedCustomers.length,
        historicalChurnedCount: assignedCustomers.filter((c) => c.churn_6mo_flag === 1).length,
        avgLatencyMs,
        avgPacketLossPct,
        baselineRiskPct,
        activeMitigatedRiskPct,
        riskReductionDeltaPct,
        mrrAtRiskUsd: Number(mrrAtRisk.toFixed(2)),
        mrrProtectedUsd: Number(mrrProtected.toFixed(2)),
        dominantDriver,
        automatedLeverDeployed,
      });
    }
  }

  return cells;
}

/**
 * Automatically computes an adaptive PrescriptivePolicyConfig in real time as live
 * telemetry events arrive, tightening call hold thresholds and boosting SLA credits
 * when high-severity network or call center spikes occur.
 */
export function computeAutomatedPolicyLevers(
  liveEvents: LiveTelemetryEvent[],
  stepIndex: number
): PrescriptivePolicyConfig {
  const recentEvents = liveEvents.slice(0, 8);
  const callSpikes = recentEvents.filter((e) => e.channel === 'call_center').length;
  const netSpikes = recentEvents.filter((e) => e.channel === 'network_cell').length;

  // Dynamically oscillate / adapt thresholds within optimal prescriptive bounds
  const dynamicHoldThreshold = Math.max(
    220,
    Math.min(320, 300 - callSpikes * 10 - ((stepIndex % 3) * 10))
  );
  const dynamicCredit = Math.max(
    20,
    Math.min(40, 20 + netSpikes * 5 + ((stepIndex % 2) * 5))
  );
  const dynamicUnresolvedTrigger = callSpikes >= 3 ? 4 : 5;

  return {
    maxHoldTimeSecThreshold: dynamicHoldThreshold,
    unresolvedCallTriggerCount: dynamicUnresolvedTrigger,
    detractorNpsThreshold: 4,
    networkLatencyAutoCreditMs: netSpikes >= 3 ? 175 : 185,
    proactiveBillCreditUsd: dynamicCredit,
    enableCellToCustomerJoin: true,
    enableRealTimeTier2Routing: true,
    enableStorePosRetentionPrompt: true,
  };
}


