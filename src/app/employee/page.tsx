import Link from "next/link";

import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";

type PageProps = {
  searchParams?: Promise<{ email?: string }> | { email?: string };
};

const EmployeePage = async ({ searchParams }: PageProps) => {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const email = sp?.email?.trim().toLowerCase();

  const employee = email
    ? await prisma.employee.findFirst({
        where: { email },
        include: {
          deductions: {
            where: { payrollRun: { status: "FINALIZED" } },
            orderBy: { payrollRun: { finalizedAt: "desc" } },
            include: { payrollRun: true },
          },
        },
      })
    : null;

  const total =
    employee?.deductions.reduce((sum, row) => sum + row.amount, 0) ?? 0;

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-10 px-6 py-12">
      <header>
        <h1 className="text-3xl font-medium tracking-tight text-[#111111]">Verified Receipts</h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-[#787774]">
          Look up your historically verified corporate giving records securely logged by your employer.
        </p>
      </header>

      <form className="rounded-xl border border-minimal bg-white p-6" method="get">
        <label className="text-[12px] font-medium text-[#111111]">
          Work Email
          <input
            name="email"
            type="email"
            defaultValue={email ?? ""}
            placeholder="name@demo.local"
            className="mt-1.5 w-full rounded-md border border-minimal bg-[#FBFBFA] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111111]"
          />
        </label>
        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-[#111111] px-4 py-2.5 text-[13px] font-medium text-white transition-transform hover:scale-[0.98]"
        >
          View Records
        </button>
        <p className="mt-4 text-[12px] text-[#787774]">
          Demo emails:{" "}
          <Link className="font-medium text-[#111111] underline decoration-[#EAEAEA] underline-offset-4 hover:decoration-[#111111]" href="?email=sara.elamrani@demo.local">
            sara.elamrani@demo.local
          </Link>
          ,{" "}
          <Link className="font-medium text-[#111111] underline decoration-[#EAEAEA] underline-offset-4 hover:decoration-[#111111]" href="?email=youssef.haddad@demo.local">
            youssef.haddad@demo.local
          </Link>
          , or{" "}
          <Link className="font-medium text-[#111111] underline decoration-[#EAEAEA] underline-offset-4 hover:decoration-[#111111]" href="?email=layla.mansour@demo.local">
            layla.mansour@demo.local
          </Link>
          .
        </p>
      </form>

      {email && !employee ? (
        <p className="rounded-md border border-minimal bg-muted-pastel-red px-4 py-3 text-[13px]">
          No records found for this email address.
        </p>
      ) : null}

      {employee ? (
        <section className="rounded-xl border border-minimal bg-white p-6">
          <div>
            <h2 className="text-[18px] font-medium text-[#111111]">{employee.name}</h2>
            <p className="text-[13px] text-[#787774] mt-1">
              {employee.department} · {employee.email}
            </p>
          </div>

          <div className="mt-8 border-t border-minimal pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#787774]">Securely Logged Contributions</p>
            {employee.deductions.length === 0 ? (
              <p className="mt-4 text-[13px] text-[#787774]">
                No verified records found yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-[#EAEAEA]">
                {employee.deductions.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-3.5">
                    <div>
                      <p className="text-[13px] font-medium text-[#111111]">{row.payrollRun.label}</p>
                      <p className="text-[12px] text-[#787774] mt-0.5">
                        Verified on{" "}
                        {row.payrollRun.finalizedAt
                          ? new Date(row.payrollRun.finalizedAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <p className="font-mono text-[13px] text-[#111111]">{formatMoney(row.amount)}</p>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 pt-4 pb-2 text-[13px] font-semibold text-[#111111]">
                  <span>Total Contribution</span>
                  <span className="font-mono">{formatMoney(total)}</span>
                </li>
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default EmployeePage;
