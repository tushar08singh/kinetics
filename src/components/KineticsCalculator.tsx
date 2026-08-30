"use client";

import { useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import FitCard from "@/components/FitCard";
import { DataPoint, fitAllOrders, fitOrder, bestFit, searchBestOrder } from "@/lib/kinetics";

const SAMPLE: DataPoint[] = [
  { t: 0, c: 1.0 },
  { t: 10, c: 0.741 },
  { t: 20, c: 0.549 },
  { t: 30, c: 0.407 },
  { t: 40, c: 0.301 },
  { t: 50, c: 0.223 },
];

const REFERENCE_ORDERS = [0, 1, 2, 3];

function fmtK(n: number) {
  if (!Number.isFinite(n)) return "\u2014";
  if (Math.abs(n) !== 0 && (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e5)) {
    return n.toExponential(3);
  }
  return n.toFixed(5);
}

export default function KineticsCalculator() {
  const [rows, setRows] = useState<DataPoint[]>(SAMPLE);

  const validRows = useMemo(
    () => rows.filter((r) => Number.isFinite(r.t) && Number.isFinite(r.c)),
    [rows]
  );

  const referenceFits = useMemo(
    () => fitAllOrders(REFERENCE_ORDERS, validRows),
    [validRows]
  );

  const autoSearch = useMemo(() => searchBestOrder(validRows), [validRows]);

  const autoFit = useMemo(() => {
    if (!autoSearch) return null;
    return fitOrder(
      autoSearch.order,
      validRows,
      `Best-fit order (n \u2248 ${autoSearch.order})`
    );
  }, [autoSearch, validRows]);

  const allFits = useMemo(
    () => (autoFit ? [...referenceFits, autoFit] : referenceFits),
    [referenceFits, autoFit]
  );

  const best = useMemo(() => bestFit(allFits), [allFits]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
      <header className="border-b border-[var(--grid-line-strong)] pb-6">
        <p className="font-data text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
          Kinetics Lab Notebook
        </p>
        <h1 className="font-display mt-1 text-4xl italic font-semibold md:text-5xl">
          Order &amp; Rate Constant Finder
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
          Enter your time / concentration readings below. Zero, first, second, and
          third order are shown for reference, and the app automatically scans every
          order from &minus;1 to 4 to find whichever one gives the straightest line
          (highest R&sup2;) &mdash; including fractional orders like 1.5 or 0.5.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <section className="rounded-sm border border-[var(--grid-line-strong)] bg-[var(--card-bg)] p-5 shadow-[3px_4px_0_var(--grid-line-strong)] lg:sticky lg:top-8 lg:self-start">
          <h2 className="font-display text-xl font-semibold">Entry 01 &mdash; Data</h2>
          <p className="mb-4 mt-1 text-sm text-[var(--ink-soft)]">
            Add as many (t, C) readings as you have. Rows with an empty field are ignored.
          </p>
          <DataTable rows={rows} onChange={setRows} />
        </section>

        <section className="flex flex-col gap-5">
          <div className="rounded-sm border border-[var(--grid-line-strong)] bg-[var(--card-bg)] px-5 py-4 shadow-[3px_4px_0_var(--grid-line-strong)]">
            {best ? (
              <p className="font-display text-lg">
                Best fit: <span className="font-semibold">{best.label}</span>{" "}
                <span className="font-data text-sm text-[var(--ink-soft)]">
                  (R&sup2; = {best.r2.toFixed(5)})
                </span>{" "}
                &mdash; k = <span className="font-data font-semibold">{fmtK(best.k)}</span>,
                C&#8320; = <span className="font-data font-semibold">{fmtK(best.c0)}</span>
              </p>
            ) : (
              <p className="text-[var(--ink-soft)]">
                Add at least two valid data points to see the fits.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {allFits.map((fit, i) => (
              <FitCard key={i} fit={fit} isBest={best === fit} />
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-[var(--grid-line-strong)] pt-4 text-xs text-[var(--ink-soft)]">
        First order: ln C vs t, slope = &minus;k. Every other order n: C^(1&minus;n) vs t,
        slope = (n&minus;1)k. A point needs C &gt; 0 to be used in a given order&apos;s fit.
        The auto-search tests orders across &minus;1 to 4 in shrinking steps to home in on
        the value of n with the highest R&sup2;.
      </footer>
    </div>
  );
}
