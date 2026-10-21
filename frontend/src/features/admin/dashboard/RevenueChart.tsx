import { formatPrice } from "@/lib/utils/format";

interface Point {
  date: string;
  revenue: number;
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD = 8;

/** Computes the SVG polyline points (exported for tests). */
export function chartPoints(data: Point[]): { x: number; y: number }[] {
  if (data.length === 0) return [];
  const max = Math.max(...data.map((p) => p.revenue), 1);
  const step = data.length > 1 ? (WIDTH - PAD * 2) / (data.length - 1) : 0;
  return data.map((p, i) => ({
    x: data.length > 1 ? PAD + i * step : WIDTH / 2,
    y: HEIGHT - PAD - (p.revenue / max) * (HEIGHT - PAD * 2),
  }));
}

/** Small inline SVG area chart in the template colours; no chart library. */
export function RevenueChart({ data, currency }: { data: Point[]; currency: string }) {
  const points = chartPoints(data);
  if (points.length === 0) return <div className="text-slate-500 py-10 text-center">No revenue in this period.</div>;
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${PAD},${HEIGHT - PAD} ${line} ${points[points.length - 1].x},${HEIGHT - PAD}`;
  const total = data.reduce((sum, p) => sum + p.revenue, 0);
  return (
    <figure>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label={`Revenue over the last ${data.length} days, ${formatPrice(total, currency)} in total`}>
        <polygon points={area} className="chart-area" />
        <polyline points={line} fill="none" strokeWidth={2} className="chart-line" />
        {points.map((p, i) => (
          <circle key={data[i].date} cx={p.x} cy={p.y} r={3} className="chart-dot">
            <title>{`${data[i].date}: ${formatPrice(data[i].revenue, currency)}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </figcaption>
    </figure>
  );
}
