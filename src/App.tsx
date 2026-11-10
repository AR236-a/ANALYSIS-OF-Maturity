import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Layers,
  Sliders,
  Users,
  Radio,
  FileCheck2,
  X,
} from 'lucide-react';
import {
  DEFAULT_PRESCRIPTIVE_POLICY,
  INITIAL_MATURITY_ACTIVITIES,
  LiveTelemetryEvent,
  MaturityActivityItem,
  MaturityStageId,
  PrescriptivePolicyConfig,
  computeAutomatedPolicyLevers,
  createLiveTelemetryEvent,
  simulatePrescriptiveImpact,
} from './utils/telcoxAnalytics.ts';
import { TELCOX_CUSTOMERS, TELCOX_PDF_SUMMARY } from './data/telcoxDataset.ts';
import { MaturityMatrixView } from './components/MaturityMatrixView.tsx';
import { RealTimeTelemetryView } from './components/RealTimeTelemetryView.tsx';
import { PrescriptiveLabView } from './components/PrescriptiveLabView.tsx';
import { CustomerExplorerView } from './components/CustomerExplorerView.tsx';

type ActiveTab = 'maturity' | 'realtime' | 'lab' | 'explorer';

function buildInitialSeedEvents(policy: PrescriptivePolicyConfig): LiveTelemetryEvent[] {
  const channels: LiveTelemetryEvent['channel'][] = [
    'call_center',
    'network_cell',
    'retail_store',
    'call_center',
    'network_cell',
    'retail_store',
  ];
  return channels.map((ch, idx) => {
    const cust = TELCOX_CUSTOMERS[idx * 7];
    const { event } = createLiveTelemetryEvent(cust, ch, idx + 1, policy, 6);
    return event;
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('maturity');
  const [activities, setActivities] = useState<MaturityActivityItem[]>(
    INITIAL_MATURITY_ACTIVITIES
  );
  const [policy, setPolicy] = useState<PrescriptivePolicyConfig>(
    DEFAULT_PRESCRIPTIVE_POLICY
  );
  const [isPolicyAutomated, setIsPolicyAutomated] = useState<boolean>(true);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamIntervalMs, setStreamIntervalMs] = useState<number>(2800);
  const [events, setEvents] = useState<LiveTelemetryEvent[]>(() =>
    buildInitialSeedEvents(DEFAULT_PRESCRIPTIVE_POLICY)
  );
  const [liveRiskDeltas, setLiveRiskDeltas] = useState<Record<number, number>>({});
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(1001);
  const [dispatchedActionsByCustomer, setDispatchedActionsByCustomer] = useState<
    Record<number, string>
  >({});
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const sequenceCounterRef = useRef<number>(10);

  const simulationSummary = useMemo(
    () => simulatePrescriptiveImpact(TELCOX_CUSTOMERS, policy),
    [policy]
  );

  const ingestNextEvent = (forcedChannel?: LiveTelemetryEvent['channel']) => {
    sequenceCounterRef.current += 1;
    const seq = sequenceCounterRef.current;
    const custIndex = (seq * 13) % TELCOX_CUSTOMERS.length;
    const targetCustomer = TELCOX_CUSTOMERS[custIndex];
    const channels: LiveTelemetryEvent['channel'][] = [
      'call_center',
      'network_cell',
      'retail_store',
    ];
    const channel = forcedChannel || channels[seq % 3];

    setLiveRiskDeltas((prevDeltas) => {
      const currentDelta = prevDeltas[targetCustomer.customer_id] || 0;
      const { event, nextRiskDelta } = createLiveTelemetryEvent(
        targetCustomer,
        channel,
        seq,
        policy,
        currentDelta
      );
      setEvents((prevEvents) => {
        const nextEvents = [event, ...prevEvents.slice(0, 39)];
        if (isPolicyAutomated) {
          setPolicy(computeAutomatedPolicyLevers(nextEvents, seq));
        }
        return nextEvents;
      });
      return {
        ...prevDeltas,
        [targetCustomer.customer_id]: nextRiskDelta,
      };
    });
  };

  useEffect(() => {
    if (!isStreaming) return;
    const timer = window.setInterval(() => {
      ingestNextEvent();
    }, streamIntervalMs);
    return () => window.clearInterval(timer);
  }, [isStreaming, streamIntervalMs, policy, isPolicyAutomated]);

  const handleUpdateActivityStage = (id: string, newStage: MaturityStageId) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, stage: newStage } : a))
    );
  };

  const handleAddActivity = (newActivity: MaturityActivityItem) => {
    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleResetStream = () => {
    sequenceCounterRef.current = 10;
    setLiveRiskDeltas({});
    setEvents(buildInitialSeedEvents(policy));
  };

  const handleSelectCustomerFromTelemetry = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setActiveTab('explorer');
  };

  const handleDispatchManualAction = (customerId: number, actionTitle: string) => {
    setDispatchedActionsByCustomer((prev) => ({
      ...prev,
      [customerId]: actionTitle,
    }));
    setLiveRiskDeltas((prev) => ({
      ...prev,
      [customerId]: Math.max(-18, (prev[customerId] || 0) - 15),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract: Brand Wordmark | 4 Single-Line Nav Links | 1 Primary CTA */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Brand Wordmark & Case Context */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-sky-500 text-slate-950 font-mono font-bold text-sm flex items-center justify-center">
                TX
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
                  TelcoX Retention Intelligence
                </div>
                <div className="text-[11px] font-mono text-slate-400 hidden sm:block whitespace-nowrap">
                  Part A · Q12 Analytics Maturity Assessment · Real-Time Engine
                </div>
              </div>
            </div>

            {/* Mobile Primary CTA Button */}
            <div className="flex lg:hidden items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Q12 Brief
              </button>
            </div>
          </div>

          {/* Center: 4 Concise Single-Line Navigation Links */}
          <nav
            aria-label="Primary Workspace Views"
            className="grid grid-cols-2 sm:flex sm:items-center gap-1 border-t border-slate-800/80 pt-1.5 lg:border-t-0 lg:pt-0"
          >
            <button
              type="button"
              onClick={() => setActiveTab('maturity')}
              className={`px-3 py-2 text-xs font-mono whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'maturity'
                  ? 'border-sky-400 text-white font-semibold bg-slate-900/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Maturity Matrix
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('realtime')}
              className={`px-3 py-2 text-xs font-mono whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'realtime'
                  ? 'border-emerald-400 text-white font-semibold bg-slate-900/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Real-Time Stream ({events.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lab')}
              className={`px-3 py-2 text-xs font-mono whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'lab'
                  ? 'border-amber-400 text-white font-semibold bg-slate-900/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Prescriptive Lab
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className={`px-3 py-2 text-xs font-mono whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'explorer'
                  ? 'border-sky-400 text-white font-semibold bg-slate-900/70'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              Customer & PDF Explorer
            </button>
          </nav>

          {/* Right: Desktop Primary CTA Button */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Q12 Executive Brief
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'maturity' && (
          <MaturityMatrixView
            activities={activities}
            onUpdateActivityStage={handleUpdateActivityStage}
            onAddActivity={handleAddActivity}
            simulationSummary={simulationSummary}
            policy={policy}
            onChangePolicy={setPolicy}
            liveEvents={events}
            liveRiskDeltas={liveRiskDeltas}
            isStreaming={isStreaming}
            onToggleStream={() => setIsStreaming(!isStreaming)}
            isPolicyAutomated={isPolicyAutomated}
            onTogglePolicyAutomated={() => setIsPolicyAutomated(!isPolicyAutomated)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'realtime' && (
          <RealTimeTelemetryView
            isStreaming={isStreaming}
            onToggleStream={() => setIsStreaming(!isStreaming)}
            streamIntervalMs={streamIntervalMs}
            onChangeIntervalMs={setStreamIntervalMs}
            events={events}
            onInjectManualEvent={(channel) => ingestNextEvent(channel)}
            onResetStream={handleResetStream}
            policy={policy}
            onSelectCustomerForInspection={handleSelectCustomerFromTelemetry}
          />
        )}

        {activeTab === 'lab' && (
          <PrescriptiveLabView
            policy={policy}
            onChangePolicy={setPolicy}
            simulationSummary={simulationSummary}
          />
        )}

        {activeTab === 'explorer' && (
          <CustomerExplorerView
            policy={policy}
            liveRiskDeltas={liveRiskDeltas}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomerId={setSelectedCustomerId}
            dispatchedActionsByCustomer={dispatchedActionsByCustomer}
            onDispatchManualAction={handleDispatchManualAction}
          />
        )}
      </main>

      {/* Question 12 Structured Executive Brief Modal */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="q12-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 max-w-3xl w-full max-h-[88vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-sky-400">
                  Part A: TelcoX (Customer Experience & Churn) · Deliverable 12
                </div>
                <h2 id="q12-modal-title" className="text-xl font-bold text-white mt-1">
                  Structured Analytics Maturity Assessment & Retention Blueprint
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close Executive Brief"
                onClick={() => setShowReportModal(false)}
                className="p-1.5 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-950 border border-slate-800">
                <div className="font-mono text-xs uppercase text-sky-400 font-semibold">
                  1. Classification of TelcoX Findings & Analytical Activities
                </div>
                <ul className="mt-2 space-y-2 text-xs">
                  <li>
                    <strong className="text-white">Level 1 — Descriptive Analytics (Implemented, 90%):</strong>{' '}
                    Historical reporting across 4 tables: <span className="font-mono">31.0%</span> 6-month
                    churn rate (<span className="font-mono">62/200</span> customers,{' '}
                    <span className="font-mono">$9,926.99/mo</span> lost MRR),{' '}
                    <span className="font-mono">5,000</span> call center interactions (<span className="font-mono">79.72%</span>{' '}
                    resolved, <span className="font-mono">301.3s</span> avg hold),{' '}
                    <span className="font-mono">1,000</span> cell network events (<span className="font-mono">9.73%</span>{' '}
                    avg loss, <span className="font-mono">174.4ms</span> latency), and{' '}
                    <span className="font-mono">300</span> retail store visits (<span className="font-mono">$74,684.97</span>{' '}
                    revenue).
                  </li>
                  <li>
                    <strong className="text-white">Level 2 — Diagnostic Analytics (Partial / Manual, 55%):</strong>{' '}
                    Cross-referencing <code className="text-sky-300">customer_id</code> shows churned
                    subscribers have lower NPS (<span className="font-mono">3.87</span> vs.{' '}
                    <span className="font-mono">4.33</span>) and shorter tenure (<span className="font-mono">58.3</span>{' '}
                    vs. <span className="font-mono">65.8</span> mos), and that unresolved support calls
                    (<span className="font-mono">1,014</span> total) and store billing/support visits
                    (<span className="font-mono">151/300</span>) correlate with churn. However, diagnostic
                    depth is severely impaired by <span className="font-mono">2,663</span> corrupted{' '}
                    <code className="text-amber-300">##########</code> timestamps and the missing foreign
                    key between <code className="text-sky-300">cell_id</code> and{' '}
                    <code className="text-sky-300">customer_id</code>.
                  </li>
                  <li>
                    <strong className="text-white">Level 3 — Predictive Analytics (Missing in Real-Time Operations, 15%):</strong>{' '}
                    TelcoX only tracks <code className="text-rose-300">churn_6mo_flag</code> after departure.
                    It lacks a live churn propensity model scoring the <span className="font-mono">138</span>{' '}
                    active accounts (of which <span className="font-mono">44</span> are high-risk detractors).
                  </li>
                  <li>
                    <strong className="text-white">Level 4 — Prescriptive Analytics (Completely Missing, 0%):</strong>{' '}
                    No automated Next-Best-Action (NBA) workflows exist to intervene during live calls,
                    network outages, or retail store walk-ins.
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-950 border border-emerald-500/40">
                <div className="font-mono text-xs uppercase text-emerald-400 font-semibold">
                  2. How Implementing the Missing Maturity Level Improves Customer Retention
                </div>
                <p className="mt-1.5 text-xs">
                  Deploying <strong>Real-Time Predictive & Prescriptive Analytics (Levels 3 & 4)</strong>{' '}
                  transforms TelcoX from passive post-mortem accounting to closed-loop retention:
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-2.5 bg-slate-900 border border-slate-800">
                    <div className="text-sky-400">Projected Churn Rate</div>
                    <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                      {TELCOX_PDF_SUMMARY.overallChurnRatePct.toFixed(1)}% →{' '}
                      {simulationSummary.projectedChurnRatePct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800">
                    <div className="text-emerald-400">Subscribers Saved</div>
                    <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                      +{simulationSummary.estimatedCustomersSaved} of 62 Accounts
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800">
                    <div className="text-amber-400">Protected Annual ARR</div>
                    <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                      ${simulationSummary.annualRevenueSavedUsd.toLocaleString()}/yr
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono text-xs font-semibold uppercase cursor-pointer"
              >
                Close Brief
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
