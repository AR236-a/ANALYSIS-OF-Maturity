import React, { useMemo } from 'react';
import {
  Sliders,
  TrendingDown,
  DollarSign,
  Users,
  RotateCcw,
  BarChart3,
  Radio,
} from 'lucide-react';
import {
  DEFAULT_PRESCRIPTIVE_POLICY,
  PrescriptivePolicyConfig,
  SimulationSummaryResult,
} from '../utils/telcoxAnalytics.ts';
import {
  TELCOX_CELL_TOWERS,
  TELCOX_CUSTOMERS,
  TELCOX_PDF_SUMMARY,
} from '../data/telcoxDataset.ts';

interface PrescriptiveLabViewProps {
  policy: PrescriptivePolicyConfig;
  onChangePolicy: (next: PrescriptivePolicyConfig) => void;
  simulationSummary: SimulationSummaryResult;
}

export const PrescriptiveLabView: React.FC<PrescriptiveLabViewProps> = ({
  policy,
  onChangePolicy,
  simulationSummary,
}) => {
  // Compute real Diagnostic cohort breakdowns from TELCOX_CUSTOMERS
  const cohortDiagnostics = useMemo(() => {
    const npsGroups = [
      { label: 'Detractors (NPS 0–3)', min: 0, max: 3 },
      { label: 'Passives (NPS 4–6)', min: 4, max: 6 },
      { label: 'Promoters (NPS 7–9)', min: 7, max: 9 },
    ].map((g) => {
      const subset = TELCOX_CUSTOMERS.filter(
        (c) => c.nps_score >= g.min && c.nps_score <= g.max
      );
      const churned = subset.filter((c) => c.churn_6mo_flag === 1).length;
      const rate = subset.length > 0 ? (churned / subset.length) * 100 : 0;
      return { ...g, total: subset.length, churned, rate };
    });

    const planGroups = (['prepaid', 'unlimited', 'enterprise'] as const).map((plan) => {
      const subset = TELCOX_CUSTOMERS.filter((c) => c.plan_type === plan);
      const churned = subset.filter((c) => c.churn_6mo_flag === 1).length;
      const avgSpend =
        subset.reduce((acc, c) => acc + c.monthly_spend, 0) / (subset.length || 1);
      return {
        plan,
        total: subset.length,
        churned,
        rate: subset.length > 0 ? (churned / subset.length) * 100 : 0,
        avgSpend,
      };
    });

    const topDegradedTowers = [...TELCOX_CELL_TOWERS]
      .sort((a, b) => b.avg_latency_ms - a.avg_latency_ms)
      .slice(0, 6);

    return { npsGroups, planGroups, topDegradedTowers };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Simulation Outcome Strip */}
      <section className="bg-slate-900/90 border border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
              Descriptive · Diagnostic · Predictive · Prescriptive Simulator
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Prescriptive Retention Policy Lab & Cohort Diagnostics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Tune real-time intervention thresholds below to simulate how upgrading TelcoX from
              static Level 1–2 spreadsheets to automated Level 4 Prescriptive Next-Best-Actions
              reduces 6-month churn and protects recurring revenue.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onChangePolicy(DEFAULT_PRESCRIPTIVE_POLICY)}
            className="px-3.5 py-2 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-mono inline-flex items-center gap-1.5 self-start lg:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Optimal Policy
          </button>
        </div>

        {/* 5 Simulation Output Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-5">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Churn Rate Trajectory
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-emerald-400">
              {simulationSummary.baselineChurnRatePct.toFixed(1)}% →{' '}
              {simulationSummary.projectedChurnRatePct.toFixed(1)}%
            </div>
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              -{simulationSummary.churnReductionDeltaPct.toFixed(1)} pts churn reduction
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Retained Accounts
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-white">
              +{simulationSummary.estimatedCustomersSaved} saved
            </div>
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              of {TELCOX_PDF_SUMMARY.churnedCustomers} historical churners
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Monthly Revenue Saved
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-sky-400">
              ${simulationSummary.monthlyRevenueSavedUsd.toLocaleString()}/mo
            </div>
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              of ${TELCOX_PDF_SUMMARY.churnedMonthlyRevenue.toLocaleString()}/mo at risk
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Annualized ARR Saved
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-emerald-400">
              ${simulationSummary.annualRevenueSavedUsd.toLocaleString()}/yr
            </div>
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              Credit budget: ${simulationSummary.totalInterventionCostUsd.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Target Maturity Index
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-amber-400">
              {simulationSummary.maturityIndexScore.toFixed(2)} / 4.00
            </div>
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              Net Program ROI: +{simulationSummary.netAnnualRoiPct}%
            </div>
          </div>
        </div>
      </section>

      {/* Main Split: Prescriptive Policy Controls (Left) + Diagnostic Cohort Evidence (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Prescriptive Policy Levers */}
        <section className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
                Level 4 Prescriptive Engine Rules
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Automated Retention Triggers
              </h2>
            </div>
            <Sliders className="w-5 h-5 text-sky-400" />
          </div>

          {/* Slider 1: Hold Time Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <label htmlFor="hold-slider" className="text-slate-300">
                Call Hold Time Tier-2 Escalation Threshold
              </label>
              <span className="text-sky-400 font-bold tabular-nums">
                {policy.maxHoldTimeSecThreshold} sec
              </span>
            </div>
            <input
              id="hold-slider"
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
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>180s (Aggressive)</span>
              <span>PDF Avg: 301.3s</span>
              <span>420s (Passive)</span>
            </div>
          </div>

          {/* Slider 2: Unresolved Calls Trigger */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <label htmlFor="unresolved-slider" className="text-slate-300">
                Unresolved Call Count Rescue Trigger
              </label>
              <span className="text-sky-400 font-bold tabular-nums">
                {policy.unresolvedCallTriggerCount} calls
              </span>
            </div>
            <input
              id="unresolved-slider"
              type="range"
              min={2}
              max={9}
              step={1}
              value={policy.unresolvedCallTriggerCount}
              onChange={(e) =>
                onChangePolicy({
                  ...policy,
                  unresolvedCallTriggerCount: Number(e.target.value),
                })
              }
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>2 unresolved</span>
              <span>PDF Avg: 5.1/cust</span>
              <span>9 unresolved</span>
            </div>
          </div>

          {/* Slider 3: Detractor NPS Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <label htmlFor="nps-slider" className="text-slate-300">
                Detractor NPS Score Outreach Cutoff
              </label>
              <span className="text-sky-400 font-bold tabular-nums">
                NPS ≤ {policy.detractorNpsThreshold}
              </span>
            </div>
            <input
              id="nps-slider"
              type="range"
              min={1}
              max={6}
              step={1}
              value={policy.detractorNpsThreshold}
              onChange={(e) =>
                onChangePolicy({
                  ...policy,
                  detractorNpsThreshold: Number(e.target.value),
                })
              }
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>NPS ≤ 1</span>
              <span>Churned Avg: 3.87</span>
              <span>NPS ≤ 6</span>
            </div>
          </div>

          {/* Slider 4: Proactive SLA Bill Credit */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <label htmlFor="credit-slider" className="text-slate-300">
                Automated SLA / Retention Credit Authority
              </label>
              <span className="text-emerald-400 font-bold tabular-nums">
                ${policy.proactiveBillCreditUsd} USD
              </span>
            </div>
            <input
              id="credit-slider"
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
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>$10 credit</span>
              <span>Avg Spend: $160.61</span>
              <span>$50 credit</span>
            </div>
          </div>

          {/* Architectural Capability Checkboxes */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Closed-Loop Automation Capabilities
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.enableCellToCustomerJoin}
                onChange={(e) =>
                  onChangePolicy({
                    ...policy,
                    enableCellToCustomerJoin: e.target.checked,
                  })
                }
                className="mt-1 accent-sky-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-white">
                  Join Network Events (cell_id) to Customer IDs + Auto SLA Credit
                </div>
                <div className="text-slate-400">
                  Fixes missing foreign key in Table 3; auto-credits subscribers on towers with &gt;
                  {policy.networkLatencyAutoCreditMs}ms latency.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.enableRealTimeTier2Routing}
                onChange={(e) =>
                  onChangePolicy({
                    ...policy,
                    enableRealTimeTier2Routing: e.target.checked,
                  })
                }
                className="mt-1 accent-sky-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-white">
                  Real-Time Call Center Tier-2 Retention Queue Bypass
                </div>
                <div className="text-slate-400">
                  Intercepts high-LTV callers exceeding hold or transfer thresholds before hang-up.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.enableStorePosRetentionPrompt}
                onChange={(e) =>
                  onChangePolicy({
                    ...policy,
                    enableStorePosRetentionPrompt: e.target.checked,
                  })
                }
                className="mt-1 accent-sky-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-white">
                  Retail Store POS Next-Best-Offer Prompt (store_A / B / C)
                </div>
                <div className="text-slate-400">
                  Presents targeted plan/device subsidies during the 151 support & billing walk-ins.
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Right: Descriptive & Diagnostic Ground-Truth Breakdowns from PDF */}
        <section className="lg:col-span-7 space-y-6">
          {/* Diagnostic Breakdown 1: Churn by NPS & Plan Type */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-amber-400">
                  Level 1 Descriptive & Level 2 Diagnostic Findings (200 Customers, 5,000 Calls)
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Empirical Churn Drivers Across NPS, Plan Type & Support Channels
                </h2>
              </div>
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NPS Cohort Churn Bars */}
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase text-slate-400">
                  6-Month Churn Rate by NPS Cohort
                </div>
                {cohortDiagnostics.npsGroups.map((g) => (
                  <div key={g.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200">{g.label}</span>
                      <span className="tabular-nums text-rose-400 font-semibold">
                        {g.rate.toFixed(1)}% ({g.churned}/{g.total})
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${Math.min(100, g.rate * 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Plan Cohort Churn Bars */}
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase text-slate-400">
                  Churn Rate & Avg Spend by Plan Type
                </div>
                {cohortDiagnostics.planGroups.map((p) => (
                  <div key={p.plan} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200 uppercase">
                        {p.plan} (${p.avgSpend.toFixed(0)}/mo)
                      </span>
                      <span className="tabular-nums text-sky-400 font-semibold">
                        {p.rate.toFixed(1)}% ({p.churned}/{p.total})
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${Math.min(100, p.rate * 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call Center & Store Visit Diagnostic Summary Strip */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">CALL REASONS (5,000)</div>
                <div className="text-white mt-1 tabular-nums">
                  Upgr: {TELCOX_PDF_SUMMARY.callsByReason.upgrade} · Bill:{' '}
                  {TELCOX_PDF_SUMMARY.callsByReason.billing}
                </div>
                <div className="text-slate-400 tabular-nums">
                  Net: {TELCOX_PDF_SUMMARY.callsByReason.network} · Dev:{' '}
                  {TELCOX_PDF_SUMMARY.callsByReason.device}
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">CALL FRICTION</div>
                <div className="text-amber-400 font-bold mt-1 tabular-nums">
                  301.3s Avg Hold
                </div>
                <div className="text-slate-400 tabular-nums">
                  79.72% FCR (1,014 open)
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">STORE VISITS (300)</div>
                <div className="text-white mt-1 tabular-nums">
                  Plan: {TELCOX_PDF_SUMMARY.storeByIssue.plan_change} · Supp:{' '}
                  {TELCOX_PDF_SUMMARY.storeByIssue.support}
                </div>
                <div className="text-slate-400 tabular-nums">
                  Bill: {TELCOX_PDF_SUMMARY.storeByIssue.billing} · Dev:{' '}
                  {TELCOX_PDF_SUMMARY.storeByIssue.device}
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">RETAIL REVENUE</div>
                <div className="text-emerald-400 font-bold mt-1 tabular-nums">
                  ${TELCOX_PDF_SUMMARY.totalStorePurchaseValue.toLocaleString()}
                </div>
                <div className="text-slate-400 tabular-nums">
                  Across store_A / B / C
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Breakdown 2: Top Degraded Cell Towers from Table 3 (1,000 Network Events) */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
                  Table 3 Network Events Telemetry (1,000 Events across cell_200–cell_219)
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Highest-Latency Cell Towers Requiring Prescriptive SLA Automation
                </h3>
              </div>
              <Radio className="w-5 h-5 text-sky-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-2 pr-3">Cell Tower ID</th>
                    <th className="py-2 px-3 text-right">Total Events</th>
                    <th className="py-2 px-3 text-right">Packet Loss / Latency / Drop</th>
                    <th className="py-2 px-3 text-right">Avg Packet Loss</th>
                    <th className="py-2 px-3 text-right">Avg Latency</th>
                    <th className="py-2 pl-3 text-right">Corrupted TS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs font-mono tabular-nums">
                  {cohortDiagnostics.topDegradedTowers.map((tower) => (
                    <tr key={tower.cell_id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 pr-3 font-semibold text-white">{tower.cell_id}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {tower.total_events}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {tower.packet_loss_events} / {tower.latency_spike_events} /{' '}
                        {tower.throughput_drop_events}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-400">
                        {tower.avg_loss_pct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">
                        {tower.avg_latency_ms.toFixed(1)} ms
                      </td>
                      <td className="py-2.5 pl-3 text-right text-slate-400">
                        {tower.corrupted_timestamps}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
