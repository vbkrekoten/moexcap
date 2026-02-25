import { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import Section from '../components/ui/Section';
import ChartTooltip from '../components/ui/ChartTooltip';
import GDPChart from '../components/charts/GDPChart';
import CPIChart from '../components/charts/CPIChart';
import KeyRateChart from '../components/charts/KeyRateChart';
import CurrencyChart from '../components/charts/CurrencyChart';
import BrentChart from '../components/charts/BrentChart';
import Timeline from '../components/sections/Timeline';
import { useDashboardData } from '../hooks/useDashboardData';
import { C } from '../lib/constants';
import { monthlyDownsample, tickInterval } from '../lib/analytics';

export default function MacroPage() {
  const { data, loading } = useDashboardData();

  // Macro overlay: monthly MOEX YoY% vs key rate (last 5 years)
  const overlay = useMemo(() => {
    if (data.stock.length < 252) return [];

    const pts = data.stock.map(d => ({ date: d.trade_date, close: d.close }));
    const monthly = monthlyDownsample(pts);

    // Build month -> rate mapping via step interpolation
    const rates = data.keyRates;

    return monthly.slice(-60).map((m, _i, arr) => {
      const month = m.date.substring(0, 7);
      // YoY: find price 12 months earlier
      const idx = arr.indexOf(m);
      const yoyIdx = idx >= 12 ? idx - 12 : -1;
      const yoy = yoyIdx >= 0 ? ((m.close / arr[yoyIdx].close - 1) * 100) : null;

      // Key rate at this month
      let rate = rates[0]?.rate ?? 0;
      for (const kr of rates) {
        if (kr.effective_date <= m.date) rate = kr.rate;
        else break;
      }

      return {
        date: month,
        moexYoY: yoy != null ? Number(yoy.toFixed(1)) : null,
        rate,
      };
    });
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Section title="ВВП РОССИИ" source="World Bank">
          {loading ? <div className="skeleton h-56 w-full" /> : <GDPChart data={data.worldBank} />}
        </Section>
        <Section title="ИНФЛЯЦИЯ (CPI)" source="World Bank">
          {loading ? <div className="skeleton h-56 w-full" /> : <CPIChart data={data.worldBank} />}
        </Section>
        <Section title="КЛЮЧЕВАЯ СТАВКА ЦБ" source="ЦБ РФ">
          {loading ? <div className="skeleton h-56 w-full" /> : <KeyRateChart data={data.keyRates} />}
        </Section>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="USD/RUB" source="MOEX ISS">
          {loading ? <div className="skeleton h-56 w-full" /> : <CurrencyChart data={data.currency} />}
        </Section>
        <Section title="BRENT" source="MOEX ISS">
          {loading ? <div className="skeleton h-56 w-full" /> : <BrentChart data={data.brent} />}
        </Section>
      </div>

      {/* Macro Overlay */}
      <Section title="MOEX YOY% VS КЛЮЧЕВАЯ СТАВКА">
        {loading || overlay.length === 0 ? (
          <div className="skeleton h-72 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={overlay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: C.muted }}
                interval={tickInterval(overlay, 12)}
              />
              <YAxis
                yAxisId="yoy"
                tick={{ fontSize: 10, fill: C.muted }}
                tickFormatter={(v: number) => v + '%'}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                tick={{ fontSize: 10, fill: C.muted }}
                tickFormatter={(v: number) => v + '%'}
              />
              <Tooltip content={<ChartTooltip format={(v: number) => v.toFixed(1) + '%'} />} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
              <Line
                yAxisId="yoy"
                type="monotone"
                dataKey="moexYoY"
                name="MOEX YoY%"
                stroke={C.gold}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
              <Area
                yAxisId="rate"
                type="stepAfter"
                dataKey="rate"
                name="Ставка ЦБ"
                stroke={C.orange}
                fill={C.orange}
                fillOpacity={0.15}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Section>

      <Section title="ХРОНОЛОГИЯ СОБЫТИЙ">
        <Timeline />
      </Section>
    </div>
  );
}
