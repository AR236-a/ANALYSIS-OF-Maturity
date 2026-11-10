import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Plus,
  Database,
  Activity,
  ShieldAlert,
  TrendingDown,
  Play,
  Pause,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  LiveTelemetryEvent,
  MATURITY_STAGE_METADATA,
  MaturityActivityItem,
  MaturityStageId,
  PrescriptivePolicyConfig,
  SimulationSummaryResult,
  generateRealTimeChurnTrajectory,
  generateRegionalChurnHeatmap,
} from '../utils/telcoxAnalytics.ts';
import { TELCOX_PDF_SUMMARY } from '../data/telcoxDataset.ts';
import { RegionalChurnHeatmapD3 } from './RegionalChurnHeatmapD3.tsx';

interface MaturityMatrixViewProps {
  activities: MaturityActivityItem[];
  onUpdateActivityStage: (id: string, newStage: MaturityStageId) => void;
  onAddActivity: (activity: MaturityActivityItem) => void;
  simulationSummary: SimulationSummaryResult;
  policy: PrescriptivePolicyConfig;
  onChangePolicy: (next: PrescriptivePolicyConfig) => void;
  liveEvents: LiveTelemetryEvent[];
  liveRiskDeltas: Record<number, number>;
  isStreaming: boolean;
  onToggleStream: () => void;
  isPolicyAutomated: boolean;
  onTogglePolicyAutomated: () => void;
  onNavigateTab: (tab: 'maturity' | 'realtime' | 'lab' | 'explorer') => void;
}

const STAGE_ORDER: MaturityStageId[] = [
  'descriptive',
  'diagnostic',
  'predictive',
  'prescriptive',
];

export const MaturityMatrixView: React.FC<MaturityMatrixViewProps> = ({
  activities,
  onUpdateActivityStage,
  onAddActivity,
  simulationSummary,
  policy,
  onChangePolicy,
  liveEvents,
  liveRiskDeltas,
  isStreaming,
  onToggleStream,
  isPolicyAutomated,
  onTogglePolicyAutomated,
  onNavigateTab,
}) => {
  const [selectedStageFilter, setSelectedStageFilter] = useState<MaturityStageId | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'all' | 'implemented' | 'partial' | 'missing'
  >('all');
  const [comparisonMode, setComparisonMode] = useState<'baseline' | 'target'>('baseline');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStage, setNewStage] = useState<MaturityStageId>('prescriptive');
  const [newImpact, setNewImpact] = useState('');

  const filteredActivities = activities.filter((item) => {
    const matchesStage = selectedStageFilter === 'all' || item.stage === selectedStageFilter;
    const matchesStatus =
      selectedStatusFilter === 'all' || item.telcoxStatus === selectedStatusFilter;
    return matchesStage && matchesStatus;
  });

  // Real-time and automatic churn trajectory series driven by active policy and streaming telemetry
  const trajectoryData = useMemo(
    () => generateRealTimeChurnTrajectory(policy, liveEvents),
    [policy, liveEvents]
  );

  // Regional spatial churn heatmap cells driven by active policy and real-time telemetry deltas
  const regionalHeatmapCells = useMemo(
    () => generateRegionalChurnHeatmap(policy, liveRiskDeltas),
    [policy, liveRiskDeltas]
  );

  const terminalPoint = trajectoryData[trajectoryData.length - 1];
  const latestEventTime = liveEvents[0]?.timestampIso.slice(11, 19) || 'LIVE';

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddActivity({
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      stage: newStage,
      telcoxStatus: newStage === 'prescriptive' || newStage === 'predictive' ? 'missing' : 'partial',
      sourceTables: ['Customers', 'Call Center Interactions', 'Network Events'],
      pdfEvidence:
        'Custom analytical initiative mapped to TelcoX multi-channel customer records.',
      analyticalMechanism:
        'Cross-channel event correlation and automated retention rule evaluation.',
      retentionImpact:
        newImpact.trim() ||
        'Reduces voluntary churn by proactively resolving service and billing friction.',
      maturityScoreContribution: 0.25,
    });
    setNewTitle('');
    setNewImpact('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Executive Answer Banner for Question 12 */}
      <section className="bg-slate-900/90 border border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2 max-w-4xl">
            <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
              Part A · Question 12 Executive Assessment · DIAI Framework Case Study
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              TelcoX Analytics Maturity Classification & Missing Level Diagnosis
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Based on the audit of all <span className="font-mono text-white">6,500</span> records
              across the four TelcoX dataset tables (<span className="font-mono text-slate-200">200</span>{' '}
              Customers, <span className="font-mono text-slate-200">5,000</span> Call Center
              Interactions, <span className="font-mono text-slate-200">1,000</span> Network Events,
              and <span className="font-mono text-slate-200">300</span> Store Visits), TelcoX operates at{' '}
              <span className="font-mono text-amber-400 font-semibold">Maturity Level 1.8 / 4.0</span>.
              While <strong>Descriptive</strong> reporting is established and <strong>Diagnostic</strong>{' '}
              correlations are partially achievable via manual joins,{' '}
              <strong className="text-rose-400">
                Level 4 Prescriptive Analytics (and Operational Real-Time Level 3 Predictive Scoring)
              </strong>{' '}
              is the critical missing maturity level.
            </p>
          </div>

          {/* State Toggle: Baseline vs Real-Time Target */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Architecture Comparison Mode
            </div>
            <div className="inline-flex border border-slate-700 bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => setComparisonMode('baseline')}
                className={`px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                  comparisonMode === 'baseline'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Current State (1.8 / 4.0)
              </button>
              <button
                type="button"
                onClick={() => setComparisonMode('target')}
                className={`px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                  comparisonMode === 'target'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Real-Time Target (4.0 / 4.0)
              </button>
            </div>
          </div>
        </div>

        {/* Top-Level Ground-Truth KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-5">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              6-Mo Historical Churn
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-rose-400">
              {TELCOX_PDF_SUMMARY.overallChurnRatePct.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              {TELCOX_PDF_SUMMARY.churnedCustomers} / {TELCOX_PDF_SUMMARY.totalCustomers} accounts
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              MRR Lost to Churn
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-rose-400">
              ${TELCOX_PDF_SUMMARY.churnedMonthlyRevenue.toLocaleString()}/mo
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              $119,124 annualized bleed
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Unresolved Support Calls
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-amber-400">
              {TELCOX_PDF_SUMMARY.unresolvedCalls.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              20.28% of 5,000 calls
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Corrupted Timestamps
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-amber-400">
              2,663
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              ########## export overflow
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Projected Churn (Lv 4)
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-emerald-400">
              {terminalPoint.activePrescriptiveChurnPct.toFixed(1)}%
            </div>
            <div className="text-xs text-emerald-400/80 font-mono tabular-nums">
              -{(TELCOX_PDF_SUMMARY.overallChurnRatePct - terminalPoint.activePrescriptiveChurnPct).toFixed(1)}% reduction ({simulationSummary.estimatedCustomersSaved} saved)
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Prescriptive ARR Saved
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-sky-400">
              ${simulationSummary.annualRevenueSavedUsd.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums">
              ${simulationSummary.monthlyRevenueSavedUsd.toLocaleString()}/mo retained
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Analytics Maturity Progression Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAGE_ORDER.map((stageId) => {
          const meta = MATURITY_STAGE_METADATA[stageId];
          const stageCount = activities.filter((a) => a.stage === stageId).length;
          const coverage =
            comparisonMode === 'baseline' ? meta.baselineCoveragePct : meta.targetCoveragePct;

          const statusColor =
            meta.baselineCoveragePct >= 80
              ? 'text-emerald-400'
              : meta.baselineCoveragePct >= 40
                ? 'text-amber-400'
                : 'text-rose-400';

          const barColor =
            comparisonMode === 'target'
              ? 'bg-emerald-500'
              : meta.baselineCoveragePct >= 80
                ? 'bg-emerald-500'
                : meta.baselineCoveragePct >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-500';

          return (
            <div
              key={stageId}
              className={`bg-slate-900/80 border p-5 flex flex-col justify-between transition-colors ${
                stageId === 'prescriptive'
                  ? 'border-rose-500/60 bg-rose-950/10'
                  : stageId === 'predictive'
                    ? 'border-amber-500/40'
                    : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>LEVEL 0{meta.levelNumber}</span>
                  <span className="tabular-nums">{stageCount} ACTIVITIES</span>
                </div>

                <h2 className="mt-2 text-lg font-bold text-white flex items-center justify-between">
                  <span>{meta.name}</span>
                  {stageId === 'prescriptive' && (
                    <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400">
                      MISSING LEVEL
                    </span>
                  )}
                </h2>

                <div className="mt-1 text-xs font-mono text-sky-400">{meta.coreQuestion}</div>

                {/* Maturity Coverage Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      {comparisonMode === 'baseline' ? 'TelcoX Baseline' : 'Real-Time Target'}
                    </span>
                    <span className={`font-bold tabular-nums ${comparisonMode === 'target' ? 'text-emerald-400' : statusColor}`}>
                      {coverage}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.max(4, coverage)}%` }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-300 leading-relaxed">
                  {meta.summaryVerdict}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className={statusColor}>{meta.telcoxCurrentState}</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStageFilter(selectedStageFilter === stageId ? 'all' : stageId)
                  }
                  className="text-sky-400 hover:text-sky-300 underline underline-offset-4 cursor-pointer"
                >
                  {selectedStageFilter === stageId ? 'Show All' : 'Filter Stage'}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Recharts Real-Time & Automatic Projected Churn Rate Reduction Line Chart */}
      <section className="bg-slate-900/85 border border-slate-800 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span>
                Real-Time & Automatic Churn Rate Reduction Trajectory · Active Policy Curve
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              Projected 6-Month Churn Rate Reduction Over Time (31.0% Baseline →{' '}
              {terminalPoint.activePrescriptiveChurnPct.toFixed(1)}% Active Prescriptive)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Automatically recalculates as real-time telemetry events stream in ({liveEvents.length}{' '}
              events processed · Latest sync {latestEventTime} UTC) and responds immediately to
              changes in the active Prescriptive Policy configuration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleStream}
              className={`px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isStreaming
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Auto-Sync Active ({liveEvents.length} Evts)
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Resume Auto-Sync
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('lab')}
              className="px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-xs font-mono text-sky-300 cursor-pointer"
            >
              Full Policy Lab →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Recharts LineChart */}
          <div className="lg:col-span-8 bg-slate-950/90 border border-slate-800 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-mono">
              <span className="text-slate-400">
                TIMELINE: 6-MONTH ROLLING HORIZON (M-2 AUDIT TO M+6 FULL MATURITY)
              </span>
              <span className="text-emerald-400 tabular-nums font-semibold">
                Net Delta: -
                {(
                  TELCOX_PDF_SUMMARY.overallChurnRatePct -
                  terminalPoint.activePrescriptiveChurnPct
                ).toFixed(2)}
                % Churn Rate
              </span>
            </div>

            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trajectoryData}
                  margin={{ top: 12, right: 20, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="periodLabel"
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    domain={[10, 35]}
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: '#f8fafc',
                    }}
                    formatter={(value, name) => [
                      `${Number(value ?? 0).toFixed(2)}%`,
                      String(name ?? ''),
                    ]}
                    labelFormatter={(label, payload) => {
                      const pt = payload?.[0]?.payload;
                      return pt
                        ? `${pt.milestoneDescription} · Sync ${pt.timestampTag} UTC · Saved $${pt.cumulativeMrrSavedUsd}/mo`
                        : String(label);
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono, monospace',
                      paddingTop: '8px',
                    }}
                  />
                  <ReferenceLine
                    y={31.0}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{
                      value: 'PDF Baseline (31.0%)',
                      position: 'insideTopRight',
                      fill: '#fb7185',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="staticBaselineChurnPct"
                    name="Lv 1.8 Static Baseline (No NBA)"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: '#f43f5e' }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictiveOnlyChurnPct"
                    name="Lv 3.0 Predictive Alerting Only"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b' }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="activePrescriptiveChurnPct"
                    name="Lv 4.0 Active Prescriptive Policy (Real-Time)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', stroke: '#022c22', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#34d399' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right 4 Columns: Live Policy Levers Driving the Chart */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 p-4 space-y-4">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
                  Active Prescriptive Policy Levers
                </div>
                <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                  {isPolicyAutomated
                    ? 'AUTOMATED CLOSED-LOOP CALIBRATION: ACTIVE'
                    : 'MANUAL CALIBRATION MODE'}
                </div>
              </div>
              <button
                type="button"
                onClick={onTogglePolicyAutomated}
                className={`px-2 py-1 text-[10px] font-mono uppercase border cursor-pointer ${
                  isPolicyAutomated
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                {isPolicyAutomated ? 'Auto: ON' : 'Auto: OFF'}
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.enableRealTimeTier2Routing}
                  onChange={(e) =>
                    onChangePolicy({
                      ...policy,
                      enableRealTimeTier2Routing: e.target.checked,
                    })
                  }
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold text-white">
                    Tier-2 Call Center Auto-Routing (&gt;{policy.maxHoldTimeSecThreshold}s)
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Intercepts unresolved callers before abandonment
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.enableCellToCustomerJoin}
                  onChange={(e) =>
                    onChangePolicy({
                      ...policy,
                      enableCellToCustomerJoin: e.target.checked,
                    })
                  }
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold text-white">
                    Cell Tower SLA Auto-Credit (cell_200–cell_219)
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Links cell_id to customer_id on &gt;{policy.networkLatencyAutoCreditMs}ms spikes
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.enableStorePosRetentionPrompt}
                  onChange={(e) =>
                    onChangePolicy({
                      ...policy,
                      enableStorePosRetentionPrompt: e.target.checked,
                    })
                  }
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="font-semibold text-white">
                    Retail POS Loyalty Prompt (store_A / B / C)
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Converts store support/billing walk-ins into renewals
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <label htmlFor="matrix-hold-slider" className="text-slate-300">
                    Max Hold Threshold {isPolicyAutomated ? '(Auto-Tuned)' : ''}
                  </label>
                  <span className="text-sky-400 tabular-nums">
                    {policy.maxHoldTimeSecThreshold}s
                  </span>
                </div>
                <input
                  id="matrix-hold-slider"
                  type="range"
                  min={180}
                  max={420}
                  step={10}
                  value={policy.maxHoldTimeSecThreshold}
                  onChange={(e) =>
                    onChangePolicy({
                      ...policy,
                      maxHoldTimeSecThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <label htmlFor="matrix-credit-slider" className="text-slate-300">
                    Auto SLA Credit Authority {isPolicyAutomated ? '(Auto-Tuned)' : ''}
                  </label>
                  <span className="text-emerald-400 tabular-nums">
                    ${policy.proactiveBillCreditUsd} USD
                  </span>
                </div>
                <input
                  id="matrix-credit-slider"
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={policy.proactiveBillCreditUsd}
                  onChange={(e) =>
                    onChangePolicy({
                      ...policy,
                      proactiveBillCreditUsd: Number(e.target.value),
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">M+6 TARGET CHURN</div>
                <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">
                  {terminalPoint.activePrescriptiveChurnPct.toFixed(2)}%
                </div>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">SAVED MRR AT M+6</div>
                <div className="text-sm font-bold text-sky-400 tabular-nums mt-0.5">
                  ${terminalPoint.cumulativeMrrSavedUsd.toLocaleString()}/mo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D3 Regional Spatial Churn Risk Heatmap */}
      <RegionalChurnHeatmapD3
        cells={regionalHeatmapCells}
        isPolicyAutomated={isPolicyAutomated}
        onTogglePolicyAutomated={onTogglePolicyAutomated}
      />

      {/* Deep-Dive Panel: The Missing Maturity Level & How Implementing It Improves Retention */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-rose-400">
                Diagnosis of Missing Maturity Level
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Why TelcoX Is Stuck at Level 1.8 & How Level 3–4 Real-Time Analytics Fixes Churn
              </h3>
            </div>
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800">
              <div className="font-mono text-xs uppercase text-amber-400 font-semibold">
                1. The Lagging Indicator Trap (Descriptive/Diagnostic Only)
              </div>
              <p className="mt-1 text-xs text-slate-300">
                In the TelcoX PDF dataset, <code className="text-sky-300">churn_6mo_flag</code> is a
                binary post-mortem flag (<code className="text-slate-200">0</code> or{' '}
                <code className="text-slate-200">1</code>) recorded <em>after</em> 62 customers already
                terminated service ($9,926.99/mo lost). Meanwhile, among the <strong>138 active customers</strong>{' '}
                currently marked <code className="text-emerald-300">churn_6mo_flag = 0</code>,{' '}
                <strong>44 accounts</strong> have Detractor NPS scores (<code className="text-rose-300">0–3</code>)
                and 5+ unresolved support calls—yet TelcoX has no real-time Predictive score flagging them.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800">
              <div className="font-mono text-xs uppercase text-rose-400 font-semibold">
                2. Broken Cross-Channel Lineage & Timestamp Corruption
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Two structural data engineering defects block Predictive & Prescriptive maturity:{' '}
                <strong>(a) Unlinked Network Topology</strong>: the 1,000 events in{' '}
                <code className="text-sky-300">Network Events</code> only log{' '}
                <code className="text-slate-200">cell_id</code> (<code className="text-slate-200">cell_200–cell_219</code>)
                with no foreign key to <code className="text-slate-200">customer_id</code>, preventing
                TelcoX from knowing which subscribers suffered 250ms+ latency spikes; and{' '}
                <strong>(b) Temporal Blindness</strong>: <code className="text-amber-300">2,121</code> call
                timestamps (42.4%), <code className="text-amber-300">419</code> network timestamps (41.9%),
                and <code className="text-amber-300">123</code> store timestamps (41.0%) are corrupted as{' '}
                <code className="text-amber-300">##########</code>, breaking sequential journey modeling.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800">
              <div className="font-mono text-xs uppercase text-emerald-400 font-semibold">
                3. How Implementing Real-Time Prescriptive Analytics Improves Retention
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Upgrading to <strong>Level 4 Prescriptive Analytics</strong> closes the loop between
                live event detection and automated retention action across all three channels:
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300 font-mono">
                <li>
                  · <strong className="text-white">Call Center NBA Routing:</strong> Auto-escalate callers
                  with <span className="text-sky-300">&gt;{policy.maxHoldTimeSecThreshold}s hold time</span> or{' '}
                  <span className="text-sky-300">{policy.unresolvedCallTriggerCount}+ unresolved calls</span> directly to Tier-2 Retention
                  with instant ${policy.proactiveBillCreditUsd} fee-waiver authority.
                </li>
                <li>
                  · <strong className="text-white">Proactive Network SLA Credits:</strong> Join{' '}
                  <span className="text-sky-300">cell_id</span> to subscriber accounts and auto-issue
                  SLA bill credits when tower latency exceeds <span className="text-sky-300">{policy.networkLatencyAutoCreditMs}ms</span>,
                  eliminating 25% of inbound network complaint calls.
                </li>
                <li>
                  · <strong className="text-white">Retail Store POS Prompts:</strong> Trigger device
                  upgrade subsidies at <span className="text-sky-300">store_A / B / C</span> terminals
                  when a low-NPS subscriber checks in for billing or support issues.
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('realtime')}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs font-mono uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              Launch Real-Time Telemetry Stream
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('lab')}
              className="px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
            >
              Configure Prescriptive Rules & ROI
            </button>
          </div>
        </div>

        {/* Right Column: Schema & Data Hygiene Audit Table from the 272-Page PDF */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
                  TelcoX PDF Schema & Hygiene Audit
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Multi-Table Readiness Breakdown
                </h3>
              </div>
              <Database className="w-5 h-5 text-sky-400 shrink-0" />
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-2 pr-2">PDF Table</th>
                    <th className="py-2 px-2 text-right">Rows</th>
                    <th className="py-2 px-2 text-right">Corrupted TS</th>
                    <th className="py-2 pl-2">Maturity Bottleneck</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  <tr>
                    <td className="py-3 pr-2 font-semibold text-white">
                      1. Customers
                      <div className="text-[11px] font-mono text-slate-400">Pages 1–11</div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-200">
                      200
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-400">
                      0 (0.0%)
                    </td>
                    <td className="py-3 pl-2 text-slate-300">
                      Lagging <code className="text-rose-300">churn_6mo_flag</code> only; no live risk score
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-semibold text-white">
                      2. Call Center
                      <div className="text-[11px] font-mono text-slate-400">Pages 12–240</div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-200">
                      5,000
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-amber-400">
                      2,121 (42.4%)
                    </td>
                    <td className="py-3 pl-2 text-slate-300">
                      1,014 unresolved calls; no auto Tier-2 routing on high hold time
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-semibold text-white">
                      3. Network Events
                      <div className="text-[11px] font-mono text-slate-400">Pages 241–264</div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-200">
                      1,000
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-amber-400">
                      419 (41.9%)
                    </td>
                    <td className="py-3 pl-2 text-slate-300">
                      Missing <code className="text-amber-300">customer_id</code> join to{' '}
                      <code className="text-sky-300">cell_id</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-semibold text-white">
                      4. Store Visits
                      <div className="text-[11px] font-mono text-slate-400">Pages 265–272</div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-200">
                      300
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-amber-400">
                      123 (41.0%)
                    </td>
                    <td className="py-3 pl-2 text-slate-300">
                      50.3% visits are support/billing; no POS retention prompt
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mechanism-to-Outcome Chain Summary Box */}
          <div className="mt-5 p-4 bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
              DIAI Framework Mechanism-to-Outcome Chain
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 border border-slate-800 bg-slate-900/60">
                <div className="text-slate-400 text-[10px]">1. DATA & INSIGHT</div>
                <div className="text-white mt-0.5">Unify 4 tables + fix ########## timestamps</div>
              </div>
              <div className="p-2.5 border border-slate-800 bg-slate-900/60">
                <div className="text-sky-400 text-[10px]">2. PREDICTIVE + NBA</div>
                <div className="text-white mt-0.5">Score live churn risk & auto-trigger SLA/Tier-2</div>
              </div>
              <div className="p-2.5 border border-slate-800 bg-slate-900/60">
                <div className="text-emerald-400 text-[10px]">3. RETENTION IMPACT</div>
                <div className="text-white mt-0.5">
                  Save {simulationSummary.estimatedCustomersSaved} accounts (${simulationSummary.annualRevenueSavedUsd.toLocaleString()}/yr)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Classification Table of All TelcoX Findings & Analytical Activities */}
      <section className="bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
              Complete Question 12 Classification Matrix
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              TelcoX Findings & Analytical Activities by Maturity Level ({filteredActivities.length} of{' '}
              {activities.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Filter Buttons */}
            <div className="inline-flex border border-slate-700 bg-slate-950 p-0.5">
              {(['all', 'descriptive', 'diagnostic', 'predictive', 'prescriptive'] as const).map(
                (stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setSelectedStageFilter(stage)}
                    className={`px-2.5 py-1 text-xs font-mono uppercase transition-colors cursor-pointer ${
                      selectedStageFilter === stage
                        ? 'bg-sky-500/20 text-sky-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {stage}
                  </button>
                )
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="inline-flex border border-slate-700 bg-slate-950 p-0.5">
              {(['all', 'implemented', 'partial', 'missing'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-mono uppercase transition-colors cursor-pointer ${
                    selectedStatusFilter === st
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Activity
            </button>
          </div>
        </div>

        {/* Optional Inline Form to Add & Classify a Custom TelcoX Activity */}
        {showAddForm && (
          <form
            onSubmit={handleCreateActivity}
            className="p-4 bg-slate-950 border border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
          >
            <div className="md:col-span-4">
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Analytical Activity / Finding Title
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Automated SMS Survey After Store Support Visit"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Maturity Stage
              </label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value as MaturityStageId)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              >
                <option value="descriptive">1. Descriptive</option>
                <option value="diagnostic">2. Diagnostic</option>
                <option value="predictive">3. Predictive</option>
                <option value="prescriptive">4. Prescriptive</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Dataset Evidence & Retention Impact
              </label>
              <input
                type="text"
                value={newImpact}
                onChange={(e) => setNewImpact(e.target.value)}
                placeholder="e.g., Targets 83 support store visits to prevent 30-day churn"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono text-xs font-semibold uppercase cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1.5 border border-slate-700 text-slate-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Activities Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-2.5 pr-3">Maturity Level</th>
                <th className="py-2.5 px-3">Analytical Activity & Dataset Source</th>
                <th className="py-2.5 px-3">TelcoX Case Study Finding (PDF Evidence)</th>
                <th className="py-2.5 px-3">Customer Retention Impact</th>
                <th className="py-2.5 pl-3 text-right">TelcoX Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredActivities.map((item) => {
                const statusIcon =
                  item.telcoxStatus === 'implemented' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />
                  ) : item.telcoxStatus === 'partial' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline mr-1" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 inline mr-1" />
                  );

                const statusTextClass =
                  item.telcoxStatus === 'implemented'
                    ? 'text-emerald-400'
                    : item.telcoxStatus === 'partial'
                      ? 'text-amber-400'
                      : 'text-rose-400';

                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pr-3 align-top whitespace-nowrap">
                      <select
                        aria-label={`Change maturity stage for ${item.title}`}
                        value={item.stage}
                        onChange={(e) =>
                          onUpdateActivityStage(item.id, e.target.value as MaturityStageId)
                        }
                        className="bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-mono uppercase text-sky-300 focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        <option value="descriptive">Lv 1 · Descriptive</option>
                        <option value="diagnostic">Lv 2 · Diagnostic</option>
                        <option value="predictive">Lv 3 · Predictive</option>
                        <option value="prescriptive">Lv 4 · Prescriptive</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-3 align-top max-w-xs">
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-[11px] font-mono text-slate-400">
                        {item.sourceTables.join(' · ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 align-top max-w-md text-slate-300 leading-relaxed">
                      {item.pdfEvidence}
                    </td>
                    <td className="py-3.5 px-3 align-top max-w-sm text-slate-300 leading-relaxed">
                      {item.retentionImpact}
                    </td>
                    <td className="py-3.5 pl-3 align-top text-right whitespace-nowrap font-mono uppercase text-[11px]">
                      <span className={statusTextClass}>
                        {statusIcon}
                        {item.telcoxStatus === 'implemented'
                          ? 'Present in PDF'
                          : item.telcoxStatus === 'partial'
                            ? 'Partial / Manual'
                            : 'Missing at TelcoX'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
