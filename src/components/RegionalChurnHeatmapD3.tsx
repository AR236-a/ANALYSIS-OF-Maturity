import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MapPin, Cpu, ShieldCheck, Radio } from 'lucide-react';
import { RegionalHeatmapCell } from '../utils/telcoxAnalytics.ts';

interface RegionalChurnHeatmapD3Props {
  cells: RegionalHeatmapCell[];
  isPolicyAutomated: boolean;
  onTogglePolicyAutomated: () => void;
}

type HeatmapMetricMode = 'mitigated' | 'baseline' | 'delta';

export const RegionalChurnHeatmapD3: React.FC<RegionalChurnHeatmapD3Props> = ({
  cells,
  isPolicyAutomated,
  onTogglePolicyAutomated,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [metricMode, setMetricMode] = useState<HeatmapMetricMode>('mitigated');
  const [selectedTowerId, setSelectedTowerId] = useState<string>('cell_204');

  const selectedCell =
    cells.find((c) => c.cellTowerId === selectedTowerId) || cells[0];

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || cells.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = 680;
    const height = 320;
    const margin = { top: 38, right: 16, bottom: 24, left: 126 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const regions = Array.from(new Set(cells.map((c) => c.regionName)));
    const sectors = Array.from(new Set(cells.map((c) => c.sectorLabel)));

    const xScale = d3
      .scaleBand<string>()
      .domain(sectors)
      .range([0, innerWidth])
      .padding(0.08);

    const yScale = d3
      .scaleBand<string>()
      .domain(regions)
      .range([0, innerHeight])
      .padding(0.1);

    // Color scale tailored to dark slate dashboard
    const riskColorScale = d3
      .scaleSequential<string>()
      .domain(metricMode === 'baseline' ? [34, 68] : [20, 48])
      .interpolator(
        d3.interpolateRgbBasis(['#065f46', '#0284c7', '#d97706', '#e11d48'])
      );

    const deltaColorScale = d3
      .scaleSequential<string>()
      .domain([4, 28])
      .interpolator(d3.interpolateRgbBasis(['#1e293b', '#0284c7', '#10b981']));

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Column headers (Sectors)
    g.selectAll('.sector-label')
      .data(sectors)
      .enter()
      .append('text')
      .attr('class', 'sector-label')
      .attr('x', (d) => (xScale(d) || 0) + xScale.bandwidth() / 2)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10.5px')
      .text((d) => d.toUpperCase());

    // Row headers (Regions)
    g.selectAll('.region-label')
      .data(regions)
      .enter()
      .append('text')
      .attr('class', 'region-label')
      .attr('x', -12)
      .attr('y', (d) => (yScale(d) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('fill', '#e2e8f0')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text((d) => d);

    // Cell groups
    const cellGroups = g
      .selectAll('.heatmap-cell')
      .data(cells)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell')
      .attr(
        'transform',
        (d) => `translate(${xScale(d.sectorLabel) || 0},${yScale(d.regionName) || 0})`
      )
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedTowerId(d.cellTowerId);
      });

    // Cell background rectangles
    cellGroups
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 2)
      .attr('fill', (d) => {
        if (metricMode === 'delta') {
          return deltaColorScale(d.riskReductionDeltaPct);
        }
        const val =
          metricMode === 'baseline' ? d.baselineRiskPct : d.activeMitigatedRiskPct;
        return riskColorScale(val);
      })
      .attr('stroke', (d) =>
        d.cellTowerId === selectedTowerId ? '#38bdf8' : '#0f172a'
      )
      .attr('stroke-width', (d) => (d.cellTowerId === selectedTowerId ? 2.5 : 1));

    // Tower ID top-left label inside cell
    cellGroups
      .append('text')
      .attr('x', 8)
      .attr('y', 15)
      .attr('fill', '#cbd5e1')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9.5px')
      .text((d) => `${d.cellTowerId} · ${d.storeZone}`);

    // Primary risk value inside cell
    cellGroups
      .append('text')
      .attr('x', xScale.bandwidth() - 8)
      .attr('y', 34)
      .attr('text-anchor', 'end')
      .attr('fill', '#ffffff')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '13.5px')
      .attr('font-weight', '700')
      .text((d) => {
        if (metricMode === 'delta') {
          return `-${d.riskReductionDeltaPct.toFixed(1)}%`;
        }
        const val =
          metricMode === 'baseline' ? d.baselineRiskPct : d.activeMitigatedRiskPct;
        return `${val.toFixed(1)}%`;
      });

    // Sub-metric latency / mitigated delta bottom-left inside cell
    cellGroups
      .append('text')
      .attr('x', 8)
      .attr('y', 35)
      .attr('fill', '#f1f5f9')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9.5px')
      .text((d) => `${d.avgLatencyMs.toFixed(0)}ms`);
  }, [cells, metricMode, selectedTowerId]);

  const avgBaselineRisk =
    cells.reduce((acc, c) => acc + c.baselineRiskPct, 0) / (cells.length || 1);
  const avgMitigatedRisk =
    cells.reduce((acc, c) => acc + c.activeMitigatedRiskPct, 0) / (cells.length || 1);

  return (
    <section className="bg-slate-900/85 border border-slate-800 p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-sky-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>
              D3 Spatial Churn Risk Heatmap · 5 Regions × 4 Sectors (20 Cell Towers cell_200–cell_219)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
            Regional Churn Risk & Automated Prescriptive Policy Mitigation Map
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Resolves TelcoX’s missing <code className="text-sky-300">cell_id → customer_id</code>{' '}
            spatial join across all 200 subscribers and 1,000 network events. Click any regional
            sector cell to inspect tower telemetry and automated prescriptive interventions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Automated Policy Levers Toggle */}
          <button
            type="button"
            onClick={onTogglePolicyAutomated}
            className={`px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isPolicyAutomated
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            {isPolicyAutomated
              ? 'Automated Policy Levers: ON'
              : 'Automated Policy Levers: OFF'}
          </button>

          {/* Heatmap View Mode Selector */}
          <div className="inline-flex border border-slate-700 bg-slate-950 p-0.5">
            <button
              type="button"
              onClick={() => setMetricMode('mitigated')}
              className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                metricMode === 'mitigated'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lv 4 Mitigated ({avgMitigatedRisk.toFixed(1)}%)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('baseline')}
              className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                metricMode === 'baseline'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lv 1.8 Baseline ({avgBaselineRisk.toFixed(1)}%)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('delta')}
              className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                metricMode === 'delta'
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Risk Delta (-{(avgBaselineRisk - avgMitigatedRisk).toFixed(1)}%)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: D3 SVG Heatmap */}
        <div className="lg:col-span-8 bg-slate-950/90 border border-slate-800 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs font-mono">
            <span className="text-slate-400 uppercase">
              D3 SPATIAL MATRIX: CELL TOWER LATENCY (MS) & CHURN PROPENSITY (%)
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-400">■ Low Risk (&lt;30%)</span>
              <span className="text-sky-400">■ Moderate (30–45%)</span>
              <span className="text-amber-400">■ Elevated (45–58%)</span>
              <span className="text-rose-400">■ Critical (&gt;58%)</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              ref={svgRef}
              role="img"
              aria-label="D3 Regional Customer Churn Risk Heatmap across 5 regions and 4 sectors"
              className="w-full h-auto min-w-[540px]"
            />
          </div>
        </div>

        {/* Right 4 Columns: Selected Region & Cell Tower Diagnostic Inspector */}
        {selectedCell && (
          <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 p-4 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-sky-400">
                  Spatial Cell Diagnostic · {selectedCell.cellTowerId}
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedCell.regionName} · {selectedCell.sectorLabel}
                </h3>
              </div>
              <Radio className="w-4 h-4 text-sky-400 shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-2.5 bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">BASELINE CHURN RISK</div>
                <div className="text-base font-bold text-rose-400 tabular-nums mt-0.5">
                  {selectedCell.baselineRiskPct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedCell.historicalChurnedCount}/{selectedCell.subscriberCount} PDF churned
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">LV 4 MITIGATED RISK</div>
                <div className="text-base font-bold text-emerald-400 tabular-nums mt-0.5">
                  {selectedCell.activeMitigatedRiskPct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-emerald-400/90">
                  -{selectedCell.riskReductionDeltaPct.toFixed(1)}% risk reduction
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">TOWER TELEMETRY</div>
                <div className="text-sm font-bold text-amber-400 tabular-nums mt-0.5">
                  {selectedCell.avgLatencyMs.toFixed(1)} ms
                </div>
                <div className="text-[11px] text-slate-400">
                  Loss: {selectedCell.avgPacketLossPct.toFixed(2)}%
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">RETAIL POS ZONE</div>
                <div className="text-sm font-bold text-white tabular-nums mt-0.5">
                  {selectedCell.storeZone}
                </div>
                <div className="text-[11px] text-sky-400">
                  Saved ${selectedCell.mrrProtectedUsd.toFixed(0)}/mo
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="text-[10px] font-mono uppercase text-slate-400">
                Dominant Spatial Churn Driver
              </div>
              <div className="font-mono text-slate-200">{selectedCell.dominantDriver}</div>
            </div>

            <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 space-y-1.5 text-xs">
              <div className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Automated Prescriptive Lever Deployed</span>
              </div>
              <div className="font-semibold text-white">
                {selectedCell.automatedLeverDeployed}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
