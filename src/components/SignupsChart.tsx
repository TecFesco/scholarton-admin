import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarOff, Table2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartTheme } from "@/hooks/useChartTheme";
import { toDate, toDayKey } from "@/Utils/format";
import type { Student } from "@/Types";

interface SignupsChartProps {
  students: Student[] | undefined;
  loading?: boolean;
  days?: number;
}

interface DayBucket {
  key: string;
  label: string;
  signups: number;
}

function buildBuckets(students: Student[], days: number): DayBucket[] {
  const counts = new Map<string, number>();

  for (const student of students) {
    const created = toDate(student.created_at);
    if (!created) continue;
    const key = toDayKey(created);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Walk backwards from today so every day in the window renders, including
  // the zero days — a gap in a time series should read as "none", not as
  // "missing".
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets: DayBucket[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const key = toDayKey(date);
    buckets.push({
      key,
      label: date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      signups: counts.get(key) ?? 0,
    });
  }

  return buckets;
}

function ChartTooltip({
  active,
  payload,
  label,
  surface,
  border,
  foreground,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  surface: string;
  border: string;
  foreground: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-lg"
      style={{ backgroundColor: surface, borderColor: border, color: foreground }}
    >
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">
        {value} {value === 1 ? "signup" : "signups"}
      </p>
    </div>
  );
}

export function SignupsChart({
  students,
  loading,
  days = 30,
}: SignupsChartProps) {
  const colors = useChartTheme();
  const [view, setView] = useState<"chart" | "table">("chart");

  const buckets = useMemo(
    () => buildBuckets(students ?? [], days),
    [students, days]
  );

  const total = buckets.reduce((sum, bucket) => sum + bucket.signups, 0);

  // The API never stamps created_at on student documents (see README, "Known
  // API gaps"), so an all-zero series is the expected state today rather than
  // a genuine "nobody signed up". Say which it is instead of drawing a flat
  // chart that reads as real data.
  const hasTimestamps = (students ?? []).some((s) => toDate(s.created_at));

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Student signups</h3>
          <p className="text-sm text-muted-foreground">
            New students per day over the last {days} days
            {hasTimestamps && ` · ${total} total`}
          </p>
        </div>

        {hasTimestamps && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "chart" ? "table" : "chart")}
          >
            {view === "chart" ? (
              <>
                <Table2 className="mr-2 h-4 w-4" />
                Table
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Chart
              </>
            )}
          </Button>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-[320px] w-full" />
      ) : !hasTimestamps ? (
        <div className="flex h-[320px] flex-col items-center justify-center gap-3 text-center">
          <CalendarOff className="h-10 w-10 text-muted-foreground/60" />
          <div className="max-w-sm">
            <p className="font-medium">No signup dates recorded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Student records have no <code>created_at</code> field, so daily
              signups cannot be plotted. The API needs to stamp it on creation —
              see “Known API gaps” in the README.
            </p>
          </div>
        </div>
      ) : view === "table" ? (
        /* pr-4 keeps the Signups column clear of the overlaying scrollbar —
           without it the count sits under the thumb on Windows. */
        <div className="max-h-[320px] overflow-auto pr-4">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left">
                <th className="py-2 font-medium text-muted-foreground">Date</th>
                <th className="py-2 text-right font-medium text-muted-foreground">
                  Signups
                </th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <tr key={bucket.key} className="border-b border-border/50">
                  <td className="py-2">{bucket.label}</td>
                  <td className="py-2 text-right tabular-nums">
                    {bucket.signups}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // 320px covers the plot *and* the x-axis band, so the card never grows
        // an inner scrollbar just to reach the tick labels.
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={buckets}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={colors.grid}
                strokeWidth={1}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                minTickGap={24}
                tick={{ fill: colors.axis, fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={44}
                tick={{
                  fill: colors.axis,
                  fontSize: 11,
                  style: { fontVariantNumeric: "tabular-nums" },
                }}
              />
              <Tooltip
                cursor={{ fill: colors.grid, fillOpacity: 0.35 }}
                content={
                  <ChartTooltip
                    surface={colors.surface}
                    border={colors.border}
                    foreground={colors.foreground}
                  />
                }
              />
              <Bar
                dataKey="signups"
                name="Signups"
                fill={colors.series}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
