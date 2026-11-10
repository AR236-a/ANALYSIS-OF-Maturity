import React, { useMemo, useState } from 'react';
import {
  Search,
  FileText,
  ExternalLink,
  UserCheck,
  AlertOctagon,
  Phone,
  Store,
  Radio,
} from 'lucide-react';
import {
  CustomerRetentionAssessment,
  PrescriptivePolicyConfig,
  evaluateCustomerRetentionProfile,
} from '../utils/telcoxAnalytics.ts';
import {
  TELCOX_CALL_SAMPLES,
  TELCOX_CUSTOMERS,
  TELCOX_NETWORK_SAMPLES,
  TELCOX_STORE_SAMPLES,
} from '../data/telcoxDataset.ts';

interface CustomerExplorerViewProps {
  policy: PrescriptivePolicyConfig;
  liveRiskDeltas: Record<number, number>;
  selectedCustomerId: number;
  onSelectCustomerId: (id: number) => void;
  dispatchedActionsByCustomer: Record<number, string>;
  onDispatchManualAction: (customerId: number, actionTitle: string) => void;
}

const PDF_ASSET_URL =
  '/assets/aistudio/Case_Study_1-_DIAI_framework_-_TelcoX_Case_Study_Data_f25f4082.pdf';

export const CustomerExplorerView: React.FC<CustomerExplorerViewProps> = ({
  policy,
  liveRiskDeltas,
  selectedCustomerId,
  onSelectCustomerId,
  dispatchedActionsByCustomer,
  onDispatchManualAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'consumer' | 'smallbiz'>('all');
  const [riskBandFilter, setRiskBandFilter] = useState<
    'all' | 'critical' | 'elevated' | 'moderate' | 'low'
  >('all');
  const [churnFlagFilter, setChurnFlagFilter] = useState<'all' | 'active_only' | 'churned_only'>(
    'all'
  );
  const [rawSampleTab, setRawSampleTab] = useState<'calls' | 'network' | 'stores' | 'pdf'>('calls');

  const allAssessments: CustomerRetentionAssessment[] = useMemo(() => {
    return TELCOX_CUSTOMERS.map((c) =>
      evaluateCustomerRetentionProfile(c, policy, liveRiskDeltas[c.customer_id] || 0)
    );
  }, [policy, liveRiskDeltas]);

  const filteredAssessments = useMemo(() => {
    return allAssessments.filter((item) => {
      const c = item.customer;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(c.customer_id).includes(q) ||
        c.phone_number.includes(q) ||
        c.plan_type.toLowerCase().includes(q) ||
        item.prescribedAction.actionTitle.toLowerCase().includes(q);

      const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter;
      const matchesRisk = riskBandFilter === 'all' || item.riskBand === riskBandFilter;
      const matchesChurn =
        churnFlagFilter === 'all' ||
        (churnFlagFilter === 'active_only' && c.churn_6mo_flag === 0) ||
        (churnFlagFilter === 'churned_only' && c.churn_6mo_flag === 1);

      return matchesSearch && matchesSegment && matchesRisk && matchesChurn;
    });
  }, [allAssessments, searchQuery, segmentFilter, riskBandFilter, churnFlagFilter]);

  const selectedAssessment =
    allAssessments.find((a) => a.customer.customer_id === selectedCustomerId) ||
    allAssessments[0];

  return (
    <div className="space-y-6">
      {/* Header & Source PDF Verification Bar */}
      <section className="bg-slate-900/90 border border-slate-800 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
            Ground-Truth Dataset Explorer · 200 Subscribers · 6,500 Total Records
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            TelcoX Customer 360° Propensity & Prescriptive Action Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            Inspect every subscriber (<code className="text-sky-300">1001–1200</code>) extracted
            from the TelcoX Case Study PDF, joined with their call center interactions, retail store
            visits, assigned cell tower, real-time predictive risk score, and prescribed retention offer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRawSampleTab('pdf')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            Embed 272-Page Case Study PDF
          </button>
          <a
            href={PDF_ASSET_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 inline-flex items-center gap-1.5"
          >
            Open Raw PDF
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* Selected Customer 360° Diagnostic & Prescriptive Inspector */}
      {selectedAssessment && (
        <section className="bg-slate-900/80 border border-sky-500/40 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono uppercase text-sky-400">
                Selected Subscriber 360° Diagnostic & Prescriptive Profile
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <h2 className="text-xl font-bold font-mono text-white">
                  Customer #{selectedAssessment.customer.customer_id}
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  Phone: {selectedAssessment.customer.phone_number} · Segment:{' '}
                  {selectedAssessment.customer.segment.toUpperCase()} · Plan:{' '}
                  {selectedAssessment.customer.plan_type.toUpperCase()} · Home Tower:{' '}
                  {selectedAssessment.customer.assigned_cell_id}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {dispatchedActionsByCustomer[selectedAssessment.customer.customer_id] ? (
                <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  Dispatched:{' '}
                  {dispatchedActionsByCustomer[selectedAssessment.customer.customer_id]}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onDispatchManualAction(
                      selectedAssessment.customer.customer_id,
                      selectedAssessment.prescribedAction.actionTitle
                    )
                  }
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Trigger Prescriptive Action Now
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className="p-3.5 bg-slate-950 border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-slate-400">
                1. Descriptive Account Profile
              </div>
              <div className="mt-1.5 text-sm font-mono tabular-nums text-white font-semibold">
                ${selectedAssessment.customer.monthly_spend.toFixed(2)}/mo · Tenure{' '}
                {selectedAssessment.customer.tenure_months} mos
              </div>
              <div className="mt-1 text-xs font-mono text-slate-400">
                NPS Score: {selectedAssessment.customer.nps_score}/9 · 6-Mo PDF Flag:{' '}
                {selectedAssessment.customer.churn_6mo_flag === 1 ? 'CHURNED (1)' : 'RETAINED (0)'}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-amber-400">
                2. Multi-Channel Diagnostic Logs
              </div>
              <div className="mt-1.5 text-sm font-mono tabular-nums text-white font-semibold">
                {selectedAssessment.customer.total_calls} Calls ({selectedAssessment.customer.unresolved_calls}{' '}
                Unresolved)
              </div>
              <div className="mt-1 text-xs font-mono text-slate-400">
                Avg Hold: {selectedAssessment.customer.avg_hold_sec}s · Transfers:{' '}
                {selectedAssessment.customer.total_transfers} · Store Visits:{' '}
                {selectedAssessment.customer.store_visits} ($
                {selectedAssessment.customer.store_purchase_value.toFixed(0)})
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-rose-400">
                3. Predictive Risk Score
              </div>
              <div className="mt-1.5 text-lg font-mono tabular-nums font-bold text-rose-400">
                {selectedAssessment.predictiveRiskScore}% ({selectedAssessment.riskBand.toUpperCase()})
              </div>
              <div className="mt-1 text-xs font-mono text-slate-400">
                Drivers: {selectedAssessment.primaryChurnDrivers.join(' · ')}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-emerald-500/40">
              <div className="text-[11px] font-mono uppercase text-emerald-400">
                4. Prescribed Next-Best-Action
              </div>
              <div className="mt-1 text-xs font-semibold text-white">
                {selectedAssessment.prescribedAction.actionTitle}
              </div>
              <div className="mt-1 text-[11px] font-mono text-slate-300">
                Channel: {selectedAssessment.prescribedAction.channel} · Credit: $
                {selectedAssessment.prescribedAction.estimatedCreditCostUsd} · Protects $
                {selectedAssessment.prescribedAction.monthlyRevenueProtectedUsd}/mo
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search & Filter Controls + 200-Customer Data Grid */}
      <section className="bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer ID (1001–1200), phone, plan, or prescribed action..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Segment Filter */}
            <div className="inline-flex border border-slate-700 bg-slate-950 p-0.5">
              {(['all', 'consumer', 'smallbiz'] as const).map((seg) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setSegmentFilter(seg)}
                  className={`px-2.5 py-1 text-xs font-mono uppercase cursor-pointer ${
                    segmentFilter === seg
                      ? 'bg-sky-500/20 text-sky-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>

            {/* Risk Band Filter */}
            <div className="inline-flex border border-slate-700 bg-slate-950 p-0.5">
              {(['all', 'critical', 'elevated', 'moderate', 'low'] as const).map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setRiskBandFilter(band)}
                  className={`px-2.5 py-1 text-xs font-mono uppercase cursor-pointer ${
                    riskBandFilter === band
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {band}
                </button>
              ))}
            </div>

            {/* Churn Flag Filter */}
            <div className="inline-flex border border-slate-700 bg-slate-950 p-0.5">
              {(
                [
                  { id: 'all', label: 'All (200)' },
                  { id: 'active_only', label: 'Active (138)' },
                  { id: 'churned_only', label: 'Churned (62)' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setChurnFlagFilter(f.id)}
                  className={`px-2.5 py-1 text-xs font-mono cursor-pointer ${
                    churnFlagFilter === f.id
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* High-Density Customer Table (Showing up to 50 rows with count indicator) */}
        <div className="text-xs font-mono text-slate-400 flex justify-between items-center">
          <span>
            Showing {Math.min(50, filteredAssessments.length)} of {filteredAssessments.length}{' '}
            matching subscribers
          </span>
          <span>Click any row to inspect 360° profile above</span>
        </div>

        {filteredAssessments.length === 0 ? (
          <div className="p-8 text-center border border-slate-800 bg-slate-950 space-y-2">
            <AlertOctagon className="w-6 h-6 text-amber-400 mx-auto" />
            <div className="text-sm font-semibold text-white">
              No TelcoX Subscribers Match Current Filters
            </div>
            <p className="text-xs text-slate-400">
              Reset the search query or risk band filters to view all 200 customer records.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSegmentFilter('all');
                setRiskBandFilter('all');
                setChurnFlagFilter('all');
              }}
              className="mt-2 px-3 py-1.5 bg-sky-500 text-slate-950 font-mono text-xs font-semibold uppercase cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 z-10">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Segment · Plan</th>
                  <th className="py-2.5 px-3 text-right">Monthly Spend</th>
                  <th className="py-2.5 px-3 text-right">Tenure</th>
                  <th className="py-2.5 px-3 text-right">NPS</th>
                  <th className="py-2.5 px-3 text-right">Calls (Unres)</th>
                  <th className="py-2.5 px-3 text-right">Avg Hold</th>
                  <th className="py-2.5 px-3 text-right">PDF Churn</th>
                  <th className="py-2.5 px-3 text-right">Live Risk</th>
                  <th className="py-2.5 px-3">Prescribed Next-Best-Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs font-mono tabular-nums">
                {filteredAssessments.slice(0, 50).map((item) => {
                  const c = item.customer;
                  const isSelected = c.customer_id === selectedCustomerId;
                  const riskColor =
                    item.riskBand === 'critical'
                      ? 'text-rose-400 font-bold'
                      : item.riskBand === 'elevated'
                        ? 'text-amber-400 font-bold'
                        : item.riskBand === 'moderate'
                          ? 'text-sky-400'
                          : 'text-emerald-400';

                  return (
                    <tr
                      key={c.customer_id}
                      onClick={() => onSelectCustomerId(c.customer_id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-500/15' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-white">#{c.customer_id}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {c.segment} · {c.plan_type}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200">
                        ${c.monthly_spend.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {c.tenure_months}m
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right ${
                          c.nps_score <= 3 ? 'text-rose-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {c.nps_score}/9
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {c.total_calls} ({c.unresolved_calls})
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {c.avg_hold_sec}s
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right ${
                          c.churn_6mo_flag === 1 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {c.churn_6mo_flag === 1 ? '1 (Churned)' : '0 (Active)'}
                      </td>
                      <td className={`py-2.5 px-3 text-right ${riskColor}`}>
                        {item.predictiveRiskScore}%
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-200 truncate max-w-xs">
                        {item.prescribedAction.actionTitle}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Raw Multi-Table Sample Logs & Embedded PDF Viewer */}
      <section className="bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
              Raw TelcoX PDF Table Samples (Including ########## Corrupted Timestamps)
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Source Tables 2, 3, 4 & Embedded PDF Document
            </h3>
          </div>

          <div className="inline-flex border border-slate-700 bg-slate-950 p-0.5">
            <button
              type="button"
              onClick={() => setRawSampleTab('calls')}
              className={`px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer ${
                rawSampleTab === 'calls'
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              Calls (20001+)
            </button>
            <button
              type="button"
              onClick={() => setRawSampleTab('network')}
              className={`px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer ${
                rawSampleTab === 'network'
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Network (30001+)
            </button>
            <button
              type="button"
              onClick={() => setRawSampleTab('stores')}
              className={`px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer ${
                rawSampleTab === 'stores'
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Stores (40001+)
            </button>
            <button
              type="button"
              onClick={() => setRawSampleTab('pdf')}
              className={`px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer ${
                rawSampleTab === 'pdf'
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Source PDF Viewer
            </button>
          </div>
        </div>

        {rawSampleTab === 'calls' && (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="py-2 pr-3">call_id</th>
                  <th className="py-2 px-3">customer_id</th>
                  <th className="py-2 px-3">call_timestamp</th>
                  <th className="py-2 px-3 text-right">duration_sec</th>
                  <th className="py-2 px-3">reason_tag</th>
                  <th className="py-2 px-3 text-right">agent_id</th>
                  <th className="py-2 px-3 text-right">resolved_flag</th>
                  <th className="py-2 px-3 text-right">hold_time_sec</th>
                  <th className="py-2 pl-3 text-right">transfer_count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {TELCOX_CALL_SAMPLES.slice(0, 20).map((c) => (
                  <tr key={c.call_id} className="hover:bg-slate-800/30">
                    <td className="py-2 pr-3 text-white">{c.call_id}</td>
                    <td className="py-2 px-3 text-sky-400">#{c.customer_id}</td>
                    <td
                      className={`py-2 px-3 ${
                        c.call_timestamp.includes('#') ? 'text-amber-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {c.call_timestamp}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">{c.call_duration_sec}s</td>
                    <td className="py-2 px-3 text-slate-200">{c.call_reason_tag}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{c.agent_id}</td>
                    <td
                      className={`py-2 px-3 text-right ${
                        c.resolved_flag === 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'
                      }`}
                    >
                      {c.resolved_flag}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">{c.hold_time_sec}s</td>
                    <td className="py-2 pl-3 text-right text-slate-300">{c.transfer_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rawSampleTab === 'network' && (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="py-2 pr-3">event_id</th>
                  <th className="py-2 px-3">cell_id</th>
                  <th className="py-2 px-3">event_timestamp</th>
                  <th className="py-2 px-3">event_type</th>
                  <th className="py-2 px-3 text-right">loss_percentage</th>
                  <th className="py-2 pl-3 text-right">avg_latency_ms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {TELCOX_NETWORK_SAMPLES.slice(0, 20).map((e) => (
                  <tr key={e.event_id} className="hover:bg-slate-800/30">
                    <td className="py-2 pr-3 text-white">{e.event_id}</td>
                    <td className="py-2 px-3 text-sky-400">{e.cell_id}</td>
                    <td
                      className={`py-2 px-3 ${
                        e.event_timestamp.includes('#') ? 'text-amber-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {e.event_timestamp}
                    </td>
                    <td className="py-2 px-3 text-slate-200">{e.event_type}</td>
                    <td className="py-2 px-3 text-right text-amber-400">{e.loss_percentage}%</td>
                    <td className="py-2 pl-3 text-right text-rose-400">{e.avg_latency_ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rawSampleTab === 'stores' && (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead className="border-b border-slate-800 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="py-2 pr-3">visit_id</th>
                  <th className="py-2 px-3">customer_id</th>
                  <th className="py-2 px-3">store_id</th>
                  <th className="py-2 px-3">visit_timestamp</th>
                  <th className="py-2 px-3 text-right">visit_duration_min</th>
                  <th className="py-2 px-3">issue_type</th>
                  <th className="py-2 pl-3 text-right">purchase_value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {TELCOX_STORE_SAMPLES.slice(0, 20).map((v) => (
                  <tr key={v.visit_id} className="hover:bg-slate-800/30">
                    <td className="py-2 pr-3 text-white">{v.visit_id}</td>
                    <td className="py-2 px-3 text-sky-400">#{v.customer_id}</td>
                    <td className="py-2 px-3 text-slate-200">{v.store_id}</td>
                    <td
                      className={`py-2 px-3 ${
                        v.visit_timestamp.includes('#') ? 'text-amber-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {v.visit_timestamp}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">{v.visit_duration_min}m</td>
                    <td className="py-2 px-3 text-slate-200">{v.issue_type}</td>
                    <td className="py-2 pl-3 text-right text-emerald-400">
                      ${v.purchase_value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rawSampleTab === 'pdf' && (
          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400">
              Embedded Case Study PDF: <code>{PDF_ASSET_URL}</code>
            </div>
            <iframe
              title="TelcoX Case Study Data PDF"
              src={PDF_ASSET_URL}
              className="w-full h-[500px] border border-slate-700 bg-slate-950"
            />
          </div>
        )}
      </section>
    </div>
  );
};
