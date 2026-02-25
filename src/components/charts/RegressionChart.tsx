import { useMemo } from 'react';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { C, CHART_COLORS } from '../../lib/constants';
import { ols } from '../../lib/analytics';

interface ReturnPoint {
  date: string;
  ret: number;
}

interface RegressionChartProps {
  moexReturns: ReturnPoint[];
  brentReturns: ReturnPoint[];
}

interface ScatterPoint {
  x: number;
  y: number;
}

export default function RegressionChart({ moexReturns, brentReturns }: RegressionChartProps) {
  const { points, regression, xDomain } = useMemo(() => {
    // Match by month key
    const brentMap = new Map(
      brentReturns.map(d => [d.date.substring(0, 7), d.ret]),
    );

    const matched: ScatterPoint[] = [];
    for (const m of moexReturns) {
      const key = m.date.substring(0, 7);
      const bRet = brentMap.get(key);
      if (bRet !== undefined) {
        matched.push({ x: bRet * 100, y: m.ret * 100 });
      }
    }

    const xArr = matched.map(p => p.x);
    const yArr = matched.map(p => p.y);
    const reg = ols(xArr, yArr);

    const xMin = Math.min(...xArr);
    const xMax = Math.max(...xArr);

    return {
      points: matched,
      regression: reg,
      xDomain: [xMin, xMax] as [number, number],
    };
  }, [moexReturns, brentReturns]);

  if (points.length < 5) return <div className="skeleton h-64 w-full" />;

  // Compute regression line endpoints for visual display
  const lineData = regression
    ? [
        { x: xDomain[0], y: regression.alpha + regression.beta * xDomain[0] },
        { x: xDomain[1], y: regression.alpha + regression.beta * xDomain[1] },
      ]
    : [];

  return (
    <div className="relative">
      {/* OLS annotation */}
      {regression && (
        <div className="absolute top-2 right-2 z-10 bg-bg-card/90 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono">
          <div className="text-muted mb-1">OLS регрессия</div>
          <div>
            <span className="text-muted">&alpha; = </span>
            <span className="text-white">{regression.alpha.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-muted">&beta; = </span>
            <span className="text-white">{regression.beta.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-muted">R&sup2; = </span>
            <span style={{ color: C.gold }}>{regression.r2.toFixed(3)}</span>
          </div>
          <div className="text-muted mt-1" style={{ fontSize: 9 }}>
            n = {points.length} мес.
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            type="number"
            dataKey="x"
            name="Brent (%)"
            tick={{ fontSize: 10, fill: C.muted }}
            tickFormatter={(v: number) => v.toFixed(0) + '%'}
            label={{
              value: 'Доходность Brent, %',
              position: 'insideBottom',
              offset: -5,
              style: { fontSize: 10, fill: C.muted },
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="MOEX (%)"
            tick={{ fontSize: 10, fill: C.muted }}
            tickFormatter={(v: number) => v.toFixed(0) + '%'}
            label={{
              value: 'Доходность MOEX, %',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 10, fill: C.muted },
            }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0]?.payload as ScatterPoint | undefined;
              if (!p) return null;
              return (
                <div className="bg-bg-card border border-gray-600 rounded-lg p-3 text-xs shadow-xl">
                  <div>
                    <span className="text-muted">Brent: </span>
                    <span className="text-white font-mono">
                      {(p.x >= 0 ? '+' : '') + p.x.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">MOEX: </span>
                    <span className="text-white font-mono">
                      {(p.y >= 0 ? '+' : '') + p.y.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <ReferenceLine x={0} stroke={C.muted} strokeOpacity={0.4} />
          <ReferenceLine y={0} stroke={C.muted} strokeOpacity={0.4} />

          {/* Scatter dots */}
          <Scatter
            name="Месячные доходности"
            data={points}
            fill={CHART_COLORS[1]}
            fillOpacity={0.6}
            isAnimationActive={false}
          />

          {/* Regression line as a second scatter with lineType */}
          {lineData.length === 2 && (
            <Scatter
              name="Регрессия"
              data={lineData}
              fill="none"
              line={{ stroke: C.gold, strokeWidth: 2 }}
              lineType="joint"
              shape={() => null}
              isAnimationActive={false}
              legendType="line"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
