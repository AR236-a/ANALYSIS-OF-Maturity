import React from 'react';
import {
  Play,
  Pause,
  Zap,
  PhoneCall,
  Radio,
  Store,
  ShieldCheck,
  RotateCcw,
  ArrowUpRight,
} from 'lucide-react';
import {
  LiveTelemetryEvent,
  PrescriptivePolicyConfig,
} from '../utils/telcoxAnalytics.ts';

interface RealTimeTelemetryViewProps {
  isStreaming: boolean;
  onToggleStream: () => void;
  streamIntervalMs: number;
  onChangeIntervalMs: (ms: number) => void;
  events: LiveTelemetryEvent[];
  onInjectManualEvent: (channel: LiveTelemetryEvent['channel']) => void;
  onResetStream: () => void;
  policy: PrescriptivePolicyConfig;
  onSelectCustomerForInspection: (customerId: number) => void;
}

export const RealTimeTelemetryView: React.FC<RealTimeTelemetryViewProps> = ({
  isStreaming,
  onToggleStream,
  streamIntervalMs,
  onChangeIntervalMs,
  events,
  onInjectManualEvent,
  onResetStream,
  policy,
  onSelectCustomerForInspection,
}) => {
  const autoDispatchedCount = events.filter(
    (e) => e.automatedStatus === 'auto_dispatched'
  ).length;
  const totalLiveMrrProtected = events.reduce((acc, e) => acc + e.mrrProtectedUsd, 0);
  const callEventsCount = events.filter((e) => e.channel === 'call_center').length;
  const netEventsCount = events.filter((e) => e.channel === 'network_cell').length;
  const storeEventsCount = events.filter((e) => e.channel === 'retail_store').length;

  const latestEvent = events[0];

  return (
    <div className="space-y-6">
      {/* Real-Time Control Header */}
      <section className="bg-slate-900/90 border border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Operationalizing Level 3 Predictive & Level 4 Prescriptive Analytics in Real Time
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Live Multi-Channel Telemetry & Automated Next-Best-Action Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Unlike TelcoX’s static spreadsheet export—where churn is only discovered 6 months later
              and timestamps overflow as <code className="text-amber-300">##########</code>—this real-time
              stream ingests live Call Center, Cell Tower, and Retail POS events, recalculates subscriber
              churn risk in milliseconds, and dispatches automated retention actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleStream}
              className={`px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer ${
                isStreaming
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Live Stream
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Start Live Stream
                </>
              )}
            </button>

            <div className="inline-flex border border-slate-700 bg-slate-950 p-0.5">
              {[1500, 2800, 4500].map((ms) => (
                <button
                  key={ms}
                  type="button"
                  onClick={() => onChangeIntervalMs(ms)}
                  className={`px-2.5 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                    streamIntervalMs === ms
                      ? 'bg-sky-500/20 text-sky-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {(ms / 1000).toFixed(1)}s
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onResetStream}
              className="px-3 py-2 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Manual Event Injection Bar + Live Stream Counters */}
        <div className="pt-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 mr-1">
              Inject Live Event:
            </span>
            <button
              type="button"
              onClick={() => onInjectManualEvent('call_center')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-sky-300 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              + Call Hold Spike (&gt;{policy.maxHoldTimeSecThreshold}s)
            </button>
            <button
              type="button"
              onClick={() => onInjectManualEvent('network_cell')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-amber-300 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              + Cell Tower Latency Spike (&gt;{policy.networkLatencyAutoCreditMs}ms)
            </button>
            <button
              type="button"
              onClick={() => onInjectManualEvent('retail_store')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              + Store POS Billing Check-In
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right font-mono">
            <div>
              <div className="text-[10px] uppercase text-slate-400">Events Ingested</div>
              <div className="text-base font-bold tabular-nums text-white">{events.length}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">Channel Split</div>
              <div className="text-xs font-bold tabular-nums text-slate-300 mt-0.5">
                {callEventsCount}C · {netEventsCount}N · {storeEventsCount}S
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">Auto-Dispatched NBA</div>
              <div className="text-base font-bold tabular-nums text-emerald-400">
                {autoDispatchedCount}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">Session MRR Protected</div>
              <div className="text-base font-bold tabular-nums text-sky-400">
                ${totalLiveMrrProtected.toFixed(2)}/mo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Event Closed-Loop Pipeline Inspector */}
      {latestEvent && (
        <section className="bg-slate-900/80 border border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-3 border-b border-slate-800">
            <span>REAL-TIME CLOSED-LOOP EXECUTION PIPELINE (LATEST EVENT)</span>
            <span className="tabular-nums text-sky-400">{latestEvent.timestampIso}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className="p-3.5 bg-slate-950 border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-slate-400">
                Lv 1 · Descriptive Ingestion
              </div>
              <div className="mt-1 text-sm font-semibold text-white">{latestEvent.eventLabel}</div>
              <div className="mt-1 text-xs font-mono text-slate-300">
                Customer #{latestEvent.customerId} · {latestEvent.customerSegment} ·{' '}
                {latestEvent.customerPlan}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-sky-400">
                Lv 2 · Diagnostic Context
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {latestEvent.rawMetricSummary}
              </div>
              <div className="mt-1 text-xs font-mono text-slate-300">
                Spend: ${latestEvent.monthlySpend.toFixed(2)}/mo
                {latestEvent.cellId ? ` · Joined ${latestEvent.cellId}` : ''}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-amber-400">
                Lv 3 · Predictive Hazard Update
              </div>
              <div className="mt-1 text-sm font-semibold font-mono tabular-nums text-white">
                Risk Score: {latestEvent.previousRiskScore}% → {latestEvent.updatedRiskScore}%
              </div>
              <div className="mt-1 text-xs font-mono text-slate-300">
                {latestEvent.automatedStatus === 'auto_dispatched'
                  ? 'Immediate intervention mitigated -14% risk'
                  : 'Dynamic propensity re-scored in real time'}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-emerald-500/40">
              <div className="text-[11px] font-mono uppercase text-emerald-400 flex items-center justify-between">
                <span>Lv 4 · Prescriptive Action</span>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {latestEvent.prescriptiveInterventionTriggered}
              </div>
              <div className="mt-1 text-xs font-mono tabular-nums text-emerald-400">
                Protected ${latestEvent.mrrProtectedUsd.toFixed(2)}/mo MRR
              </div>
            </div>
          </div>
        </section>
      )}

      {/* High-Density Real-Time Telemetry Ledger */}
      <section className="bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
              Live Multi-Channel Event Ledger
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Streaming Customer Interactions & Automated Prescriptive Interventions
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Click any Customer ID to inspect full 360° profile
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-2.5 pr-3">ISO Timestamp</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Telemetry Signal & Diagnostic Context</th>
                <th className="py-2.5 px-3 text-right">Risk Score</th>
                <th className="py-2.5 px-3">Prescriptive Next-Best-Action (Lv 4)</th>
                <th className="py-2.5 pl-3 text-right">MRR Protected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {events.map((evt) => {
                const channelLabel =
                  evt.channel === 'call_center'
                    ? 'CALL CENTER'
                    : evt.channel === 'network_cell'
                      ? 'CELL TOWER'
                      : 'RETAIL POS';

                const channelColor =
                  evt.channel === 'call_center'
                    ? 'text-sky-400'
                    : evt.channel === 'network_cell'
                      ? 'text-amber-400'
                      : 'text-emerald-400';

                return (
                  <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      {evt.timestampIso.slice(11, 19)} UTC
                    </td>
                    <td className={`py-3 px-3 font-mono text-[11px] whitespace-nowrap ${channelColor}`}>
                      {channelLabel}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectCustomerForInspection(evt.customerId)}
                        className="font-mono font-semibold text-white hover:text-sky-400 inline-flex items-center gap-1 cursor-pointer"
                      >
                        #{evt.customerId}
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </button>
                      <div className="text-[11px] font-mono text-slate-400">
                        {evt.customerSegment} · ${evt.monthlySpend.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-100">{evt.eventLabel}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {evt.rawMetricSummary}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <span className="text-slate-400">{evt.previousRiskScore}%</span>
                      <span className="mx-1 text-slate-500">→</span>
                      <span
                        className={
                          evt.updatedRiskScore >= 65
                            ? 'text-rose-400 font-bold'
                            : evt.updatedRiskScore >= 45
                              ? 'text-amber-400 font-bold'
                              : 'text-emerald-400 font-bold'
                        }
                      >
                        {evt.updatedRiskScore}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{evt.prescriptiveInterventionTriggered}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 uppercase">
                        Status: {evt.automatedStatus.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular-nums font-semibold text-emerald-400 whitespace-nowrap">
                      +${evt.mrrProtectedUsd.toFixed(2)}/mo
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
