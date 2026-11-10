import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PRESCRIPTIVE_POLICY,
  INITIAL_MATURITY_ACTIVITIES,
  MATURITY_STAGE_METADATA,
  computeAutomatedPolicyLevers,
  createLiveTelemetryEvent,
  evaluateCustomerRetentionProfile,
  generateRealTimeChurnTrajectory,
  generateRegionalChurnHeatmap,
  simulatePrescriptiveImpact,
} from './telcoxAnalytics.ts';
import { TELCOX_CUSTOMERS, TELCOX_PDF_SUMMARY } from '../data/telcoxDataset.ts';

describe('TelcoX Analytics Maturity & Real-Time Retention Pure Logic', () => {
  it('generates a 20-cell regional spatial churn heatmap and automates prescriptive policy levers', () => {
    const cells = generateRegionalChurnHeatmap(DEFAULT_PRESCRIPTIVE_POLICY, {});
    assert.equal(cells.length, 20);
    const totalSubscribersMapped = cells.reduce((sum, c) => sum + c.subscriberCount, 0);
    assert.equal(totalSubscribersMapped, 200);

    for (const cell of cells) {
      assert.ok(cell.activeMitigatedRiskPct <= cell.baselineRiskPct);
      assert.ok(cell.automatedLeverDeployed.length > 0);
    }

    const autoPolicy = computeAutomatedPolicyLevers([], 2);
    assert.equal(autoPolicy.enableCellToCustomerJoin, true);
    assert.equal(autoPolicy.enableRealTimeTier2Routing, true);
    assert.equal(autoPolicy.enableStorePosRetentionPrompt, true);
    assert.ok(autoPolicy.maxHoldTimeSecThreshold >= 220 && autoPolicy.maxHoldTimeSecThreshold <= 320);
  });

  it('generates a real-time churn reduction trajectory over time that responds to active prescriptive policy and live events', () => {
    const fullTrajectory = generateRealTimeChurnTrajectory(DEFAULT_PRESCRIPTIVE_POLICY, []);
    assert.equal(fullTrajectory.length, 10);
    const firstPoint = fullTrajectory[0];
    const lastPoint = fullTrajectory[fullTrajectory.length - 1];

    assert.ok(lastPoint.activePrescriptiveChurnPct < firstPoint.activePrescriptiveChurnPct);
    assert.ok(lastPoint.activePrescriptiveChurnPct < lastPoint.predictiveOnlyChurnPct);
    assert.ok(lastPoint.predictiveOnlyChurnPct < lastPoint.staticBaselineChurnPct);

    // Verify policy sensitivity
    const passivePolicyTrajectory = generateRealTimeChurnTrajectory(
      {
        ...DEFAULT_PRESCRIPTIVE_POLICY,
        enableCellToCustomerJoin: false,
        enableRealTimeTier2Routing: false,
        enableStorePosRetentionPrompt: false,
      },
      []
    );
    const passiveLast = passivePolicyTrajectory[passivePolicyTrajectory.length - 1];
    assert.ok(lastPoint.activePrescriptiveChurnPct < passiveLast.activePrescriptiveChurnPct);
  });
  it('verifies exact ground-truth PDF dataset counts and data hygiene metrics', () => {
    assert.equal(TELCOX_CUSTOMERS.length, 200);
    assert.equal(TELCOX_PDF_SUMMARY.totalCustomers, 200);
    assert.equal(TELCOX_PDF_SUMMARY.churnedCustomers, 62);
    assert.equal(TELCOX_PDF_SUMMARY.retainedCustomers, 138);
    assert.equal(TELCOX_PDF_SUMMARY.overallChurnRatePct, 31.0);
    assert.equal(TELCOX_PDF_SUMMARY.totalCalls, 5000);
    assert.equal(TELCOX_PDF_SUMMARY.totalNetworkEvents, 1000);
    assert.equal(TELCOX_PDF_SUMMARY.totalStoreVisits, 300);
    assert.ok(TELCOX_PDF_SUMMARY.corruptedCallTimestamps > 2000);
  });

  it('classifies TelcoX analytical activities across all 4 maturity levels and identifies Prescriptive as missing', () => {
    const stages = Object.keys(MATURITY_STAGE_METADATA);
    assert.deepEqual(stages, ['descriptive', 'diagnostic', 'predictive', 'prescriptive']);
    assert.equal(MATURITY_STAGE_METADATA.prescriptive.baselineCoveragePct, 0);

    const prescriptiveActivities = INITIAL_MATURITY_ACTIVITIES.filter(
      (a) => a.stage === 'prescriptive'
    );
    assert.ok(prescriptiveActivities.length >= 3);
    for (const act of prescriptiveActivities) {
      assert.equal(act.telcoxStatus, 'missing');
    }
  });

  it('evaluates predictive churn risk score and assigns a targeted Next-Best-Action for high-friction customers', () => {
    // Customer 1001: NPS 0, 19 calls
    const customer1001 = TELCOX_CUSTOMERS.find((c) => c.customer_id === 1001)!;
    const profile = evaluateCustomerRetentionProfile(customer1001, DEFAULT_PRESCRIPTIVE_POLICY);

    assert.ok(profile.predictiveRiskScore >= 50 && profile.predictiveRiskScore <= 99);
    assert.ok(profile.primaryChurnDrivers.some((d) => d.includes('Detractor NPS')));
    assert.ok(profile.prescribedAction.monthlyRevenueProtectedUsd > 0);
  });

  it('simulates organization-wide retention impact and shows higher churn reduction when all prescriptive levers are active', () => {
    const fullPolicyResult = simulatePrescriptiveImpact(
      TELCOX_CUSTOMERS,
      DEFAULT_PRESCRIPTIVE_POLICY
    );
    const disabledLeversResult = simulatePrescriptiveImpact(TELCOX_CUSTOMERS, {
      ...DEFAULT_PRESCRIPTIVE_POLICY,
      enableCellToCustomerJoin: false,
      enableRealTimeTier2Routing: false,
      enableStorePosRetentionPrompt: false,
    });

    assert.equal(fullPolicyResult.baselineChurnRatePct, 31.0);
    assert.ok(fullPolicyResult.projectedChurnRatePct < fullPolicyResult.baselineChurnRatePct);
    assert.ok(
      fullPolicyResult.estimatedCustomersSaved > disabledLeversResult.estimatedCustomersSaved
    );
    assert.ok(fullPolicyResult.annualRevenueSavedUsd > disabledLeversResult.annualRevenueSavedUsd);
    assert.equal(fullPolicyResult.maturityIndexScore, 4.0);
    assert.equal(disabledLeversResult.maturityIndexScore, 1.8);
  });

  it('processes real-time telemetry events across Call Center, Network Tower, and Store POS channels', () => {
    const sampleCustomer = TELCOX_CUSTOMERS[0];
    const callEvent = createLiveTelemetryEvent(
      sampleCustomer,
      'call_center',
      1,
      DEFAULT_PRESCRIPTIVE_POLICY,
      0
    );
    assert.equal(callEvent.event.customerId, sampleCustomer.customer_id);
    assert.equal(callEvent.event.channel, 'call_center');
    assert.ok(callEvent.event.prescriptiveInterventionTriggered.length > 0);

    const netEvent = createLiveTelemetryEvent(
      sampleCustomer,
      'network_cell',
      2,
      DEFAULT_PRESCRIPTIVE_POLICY,
      callEvent.nextRiskDelta
    );
    assert.equal(netEvent.event.cellId, sampleCustomer.assigned_cell_id);
  });
});
