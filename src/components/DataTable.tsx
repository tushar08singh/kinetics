"use client";

import { DataPoint } from "@/lib/kinetics";

type Props = {
  rows: DataPoint[];
  onChange: (rows: DataPoint[]) => void;
};

export default function DataTable({ rows, onChange }: Props) {
  function updateRow(index: number, field: "t" | "c", value: string) {
    const next = rows.map((r, i) =>
      i === index ? { ...r, [field]: value === "" ? NaN : Number(value) } : r
    );
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { t: NaN, c: NaN }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-x-3 px-1 pb-2 text-xs uppercase tracking-wider text-[var(--ink-soft)]">
        <span>#</span>
        <span>t (time)</span>
        <span>C (conc.)</span>
        <span></span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-x-3"
          >
            <span className="font-data text-sm text-[var(--ink-soft)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={Number.isNaN(row.t) ? "" : row.t}
              onChange={(e) => updateRow(i, "t", e.target.value)}
              placeholder="0.0"
              className="font-data w-full rounded-sm border border-[var(--grid-line-strong)] bg-white/60 px-2 py-1.5 text-sm text-[var(--ink)] focus:border-[var(--teal)]"
            />
            <input
              type="number"
              inputMode="decimal"
              value={Number.isNaN(row.c) ? "" : row.c}
              onChange={(e) => updateRow(i, "c", e.target.value)}
              placeholder="0.0"
              className="font-data w-full rounded-sm border border-[var(--grid-line-strong)] bg-white/60 px-2 py-1.5 text-sm text-[var(--ink)] focus:border-[var(--teal)]"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label={`Remove row ${i + 1}`}
              className="justify-self-center text-[var(--rust)] hover:opacity-70 disabled:opacity-20"
              disabled={rows.length <= 1}
            >
              &#10005;
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-3 rounded-sm border border-dashed border-[var(--grid-line-strong)] px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
      >
        + Add row
      </button>
    </div>
  );
}
