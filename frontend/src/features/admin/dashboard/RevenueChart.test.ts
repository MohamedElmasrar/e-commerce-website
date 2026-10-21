import { describe, expect, it } from "vitest";
import { chartPoints } from "./RevenueChart";

describe("chartPoints", () => {
  it("returns nothing for no data and handles a single point", () => {
    expect(chartPoints([])).toEqual([]);
    expect(chartPoints([{ date: "d", revenue: 5 }])).toHaveLength(1);
  });
  it("puts the highest revenue at the top and zero at the bottom", () => {
    const [a, b] = chartPoints([
      { date: "1", revenue: 0 },
      { date: "2", revenue: 100 },
    ]);
    expect(b.y).toBeLessThan(a.y);
    expect(b.x).toBeGreaterThan(a.x);
  });
});
