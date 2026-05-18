import { verifyAuditChain } from "@/lib/audit-chain";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";

import {
  createEnrollment,
  createPayrollRun,
  generateDeductions,
  setEnrollmentActive,
} from "../actions";
import FinalizeButton from "@/components/FinalizeButton";

export const dynamic = "force-dynamic";

const HRPage = async () => {
  const [employees, enrollments, payrollRuns, auditBlocks, chain] = await Promise.all([
    prisma.employee.findMany({ orderBy: { name: "asc" } }),
    prisma.enrollment.findMany({
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    }),
    prisma.payrollRun.findMany({
      orderBy: { createdAt: "desc" },
      include: { deductions: { include: { employee: true } } },
    }),
    prisma.auditBlock.findMany({ orderBy: { index: "desc" }, take: 12 }),
    verifyAuditChain(),
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <header>
        <h1 className="text-3xl font-medium tracking-tight text-[#111111]">HR Dashboard</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-[#787774]">
          Manage team enrollments and finalize payroll periods. 
          All finalized records are cryptographically secured and automatically verified by the system.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wide uppercase ${
              chain.ok ? "bg-muted-pastel-green" : "bg-muted-pastel-red"
            }`}
          >
            {chain.ok ? `Data Verified Securely · ${chain.count} Logs` : `Verification Error at Log #${chain.at}`}
          </span>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-minimal bg-white p-6">
          <h2 className="text-[14px] font-medium text-[#111111]">New Enrollment</h2>
          <p className="mt-1 text-[12px] text-[#787774]">Sets up an active deduction plan for an employee.</p>
          {employees.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#787774]">
              No employees in the directory. Run <kbd className="rounded border border-minimal bg-[#F7F6F3] px-1 font-mono text-[11px]">npm run db:seed</kbd> after{" "}
              <kbd className="rounded border border-minimal bg-[#F7F6F3] px-1 font-mono text-[11px]">npm run db:push</kbd>.
            </p>
          ) : (
            <form action={createEnrollment} className="mt-4 flex flex-col gap-4">
              <label className="text-[12px] font-medium text-[#111111]">
                Team Member
                <select
                  name="employeeId"
                  required
                  className="mt-1.5 w-full rounded-md border border-minimal bg-white px-3 py-2.5 text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                  defaultValue={employees[0]?.id}
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} · {e.department}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] font-medium text-[#111111]">
                Monthly Deduction
                <input
                  name="monthlyAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  defaultValue={25}
                  className="mt-1.5 w-full rounded-md border border-minimal bg-white px-3 py-2.5 text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                  required
                />
              </label>
              <button
                type="submit"
                className="mt-2 inline-flex justify-center rounded-md bg-[#111111] px-4 py-2.5 text-[13px] font-medium text-white transition-transform hover:scale-[0.98]"
              >
                Save Enrollment
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-minimal pt-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#787774]">Active Enrollments</h3>
            <ul className="mt-4 space-y-3">
              {enrollments.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 rounded-lg border border-minimal bg-[#FBFBFA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-[13px] font-medium text-[#111111]">{row.employee.name}</p>
                    <p className="text-[12px] text-[#787774] mt-0.5">
                      {formatMoney(row.monthlyAmount)} / month · {row.active ? "Active" : "Paused"}
                    </p>
                  </div>
                  <form action={setEnrollmentActive} className="flex gap-2">
                    <input type="hidden" name="enrollmentId" value={row.id} />
                    <input type="hidden" name="active" value={row.active ? "false" : "true"} />
                    <button
                      type="submit"
                      className="rounded-md border border-minimal bg-white px-3 py-1.5 text-[11px] font-medium text-[#111111] hover:bg-[#FBFBFA] transition-colors"
                    >
                      {row.active ? "Pause" : "Resume"}
                    </button>
                  </form>
                </li>
              ))}
              {enrollments.length === 0 ? (
                <li className="text-[12px] text-[#787774]">No enrollments found.</li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-minimal bg-white p-6">
          <h2 className="text-[14px] font-medium text-[#111111]">Payroll Periods</h2>
          <form action={createPayrollRun} className="mt-4 flex flex-col gap-4">
            <label className="text-[12px] font-medium text-[#111111]">
              Period Label
              <input
                name="label"
                placeholder="e.g. May 2026"
                className="mt-1.5 w-full rounded-md border border-minimal bg-white px-3 py-2.5 text-[13px] text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
                required
              />
            </label>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-minimal bg-white px-4 py-2.5 text-[13px] font-medium text-[#111111] transition-transform hover:scale-[0.98] hover:bg-[#FBFBFA]"
            >
              Draft New Period
            </button>
          </form>

          <ul className="mt-8 space-y-4">
            {payrollRuns.map((run) => {
              const total = run.deductions.reduce((s, d) => s + d.amount, 0);
              const isDraft = run.status === "DRAFT";
              return (
                <li key={run.id} className="rounded-lg border border-minimal bg-[#FBFBFA] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-medium text-[#111111]">{run.label}</p>
                      <p className="text-[12px] text-[#787774] mt-0.5">
                        {run.status} · {run.deductions.length} logs · {formatMoney(total)}
                      </p>
                    </div>
                    {isDraft ? (
                      <div className="flex flex-wrap gap-2">
                        <form action={generateDeductions}>
                          <input type="hidden" name="payrollRunId" value={run.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-minimal bg-white px-3 py-1.5 text-[11px] font-medium text-[#111111] hover:bg-[#FBFBFA]"
                          >
                            Sync Team
                          </button>
                        </form>
                        <FinalizeButton 
                          payrollRunId={run.id} 
                          disabled={run.deductions.length === 0} 
                        />
                      </div>
                    ) : (
                      <span className="rounded-full bg-muted-pastel-blue px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                        Verified
                      </span>
                    )}
                  </div>
                  {run.deductions.length > 0 ? (
                    <ul className="mt-4 space-y-1.5 border-t border-minimal pt-4 text-[12px] text-[#787774]">
                      {run.deductions.map((d) => (
                        <li key={d.id} className="flex justify-between gap-2">
                          <span>{d.employee.name}</span>
                          <span className="font-mono text-[#111111]">{formatMoney(d.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
            {payrollRuns.length === 0 ? (
              <li className="text-[12px] text-[#787774]">No payroll runs drafted.</li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-minimal bg-white p-6">
        <h2 className="text-[14px] font-medium text-[#111111]">System Activity Log</h2>
        <p className="mt-1 text-[12px] text-[#787774]">
          Cryptographic signatures verifying the state of the HR platform.
        </p>
        <div className="mt-5 space-y-3 font-mono text-[11px] text-[#787774]">
          {auditBlocks.map((b) => (
            <div key={b.id} className="rounded-md border border-minimal bg-[#FBFBFA] p-4">
              <div className="flex flex-wrap justify-between gap-2 text-[10px] uppercase tracking-widest text-[#787774]">
                <span>Log #{b.index}</span>
                <span>{new Date(b.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-3 break-all text-[#111111]">
                <span className="text-[#787774]">prev_sig</span> {b.prevHash.slice(0, 18)}…
              </p>
              <p className="break-all text-[#111111]">
                <span className="text-[#787774]">data_sig</span> {b.hash.slice(0, 18)}…
              </p>
            </div>
          ))}
          {auditBlocks.length === 0 ? <p className="text-[12px] text-[#787774]">No logs recorded.</p> : null}
        </div>
      </section>
    </main>
  );
};

export default HRPage;
