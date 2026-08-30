export type DataPoint = {
  t: number;
  c: number;
};

export type FitResult = {
  order: number;
  label: string;
  yLabel: string;
  xLabel: string;
  slope: number;
  intercept: number;
  r2: number;
  k: number;
  c0: number;
  points: { x: number; y: number }[]; // transformed points used for the fit
  line: { x: number; y: number }[]; // two endpoints of the best-fit line
  valid: boolean;
  error?: string;
};

function orderLabel(n: number): string {
  if (n === 0) return "Zero order";
  if (n === 1) return "First order";
  if (n === 2) return "Second order";
  if (n === 3) return "Third order";
  return `Order ${formatOrderNumber(n)}`;
}

function formatOrderNumber(n: number): string {
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded);
}

function formatExponent(e: number): string {
  const rounded = Math.round(e * 1000) / 1000;
  return rounded >= 0 ? String(rounded) : `\u2212${Math.abs(rounded)}`;
}

function yAxisLabel(n: number): string {
  if (n === 1) return "ln C";
  if (n === 0) return "C";
  const exp = 1 - n;
  return `C^(${formatExponent(exp)})`;
}

/**
 * Transform concentration C into the y-value that linearizes the
 * integrated rate law for order n:
 *   n = 1:      y = ln C            (special case, standard first-order law)
 *   n != 1:     y = C^(1-n)         (general nth-order integrated law)
 * Requires C > 0 for the transform to be mathematically valid
 * (needed for logs and for fractional/negative powers).
 */
function transform(n: number, c: number): number | null {
  if (!(c > 0)) return null;
  if (n === 1) return Math.log(c);
  return Math.pow(c, 1 - n);
}

function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }

  const slope = sxx !== 0 ? sxy / sxx : 0;
  const intercept = yMean - slope * xMean;
  const r2 = sxx !== 0 && syy !== 0 ? (sxy * sxy) / (sxx * syy) : 0;

  return { slope, intercept, r2 };
}

export function fitOrder(order: number, data: DataPoint[], labelOverride?: string): FitResult {
  const base: FitResult = {
    order,
    label: labelOverride ?? orderLabel(order),
    yLabel: yAxisLabel(order),
    xLabel: "t",
    slope: 0,
    intercept: 0,
    r2: 0,
    k: 0,
    c0: 0,
    points: [],
    line: [],
    valid: false,
  };

  const sorted = [...data].sort((a, b) => a.t - b.t);
  const points: { x: number; y: number }[] = [];

  for (const d of sorted) {
    const y = transform(order, d.c);
    if (y === null || !Number.isFinite(y)) continue;
    points.push({ x: d.t, y });
  }

  if (points.length < 2) {
    return {
      ...base,
      points,
      error: "Need at least 2 valid (positive C) points for this order.",
    };
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const { slope, intercept, r2 } = linearRegression(xs, ys);

  let k = 0;
  let c0 = 0;
  if (order === 1) {
    k = -slope;
    c0 = Math.exp(intercept);
  } else {
    // y = C^(1-n) = C0^(1-n) + (n-1) k t  =>  slope = (n-1)k
    k = slope / (order - 1);
    c0 = intercept > 0 ? Math.pow(intercept, 1 / (1 - order)) : NaN;
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const line = [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept },
  ];

  return {
    ...base,
    slope,
    intercept,
    r2,
    k,
    c0,
    points,
    line,
    valid: true,
  };
}

export function fitAllOrders(orders: number[], data: DataPoint[]): FitResult[] {
  return orders.map((o) => fitOrder(o, data));
}

export function bestFit(fits: FitResult[]): FitResult | null {
  const valid = fits.filter((f) => f.valid && Number.isFinite(f.r2));
  if (valid.length === 0) return null;
  return valid.reduce((best, f) => (f.r2 > best.r2 ? f : best), valid[0]);
}

export type OrderSearchResult = {
  order: number;
  r2: number;
} | null;

/**
 * Scans across a continuous range of reaction orders n and finds the one
 * whose linearized plot gives the highest R^2 (the straightest line).
 * Works in two phases: a coarse grid pass over [min, max], then several
 * rounds of refinement zooming in around the current best candidate.
 */
export function searchBestOrder(
  data: DataPoint[],
  min = -1,
  max = 4
): OrderSearchResult {
  function bestInRange(lo: number, hi: number, step: number) {
    let bestOrder = lo;
    let bestR2 = -Infinity;
    for (let n = lo; n <= hi + 1e-9; n += step) {
      const fit = fitOrder(n, data);
      if (fit.valid && Number.isFinite(fit.r2) && fit.r2 > bestR2) {
        bestR2 = fit.r2;
        bestOrder = n;
      }
    }
    return { order: bestOrder, r2: bestR2 };
  }

  let best = bestInRange(min, max, 0.05);
  if (best.r2 === -Infinity) return null;

  let span = 0.05;
  for (let pass = 0; pass < 4; pass++) {
    span = span / 10;
    const lo = Math.max(min, best.order - span * 10);
    const hi = Math.min(max, best.order + span * 10);
    const refined = bestInRange(lo, hi, span);
    if (refined.r2 >= best.r2) best = refined;
  }

  return { order: Math.round(best.order * 1000) / 1000, r2: best.r2 };
}
