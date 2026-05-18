import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-24">
      <div className="flex flex-col gap-6 max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#787774]">
          Workplace Zakat Platform
        </p>
        <h1 className="text-4xl font-medium tracking-tight text-[#111111] leading-[1.1]">
          Seamless, verified corporate giving.
        </h1>
        <p className="text-lg leading-[1.6] text-[#787774] max-w-2xl">
          A dedicated platform for managing employee Zakat deductions. 
          HR handles the payroll integration natively, while our secure verification 
          system ensures every deduction is irrevocably logged and fully auditable by the employee.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/hr"
            className="inline-flex items-center justify-center rounded-md bg-[#111111] px-6 py-3 text-[13px] font-medium text-white transition-transform hover:scale-[0.98]"
          >
            Access HR Console
          </Link>
          <Link
            href="/employee?email=sara.elamrani@demo.local"
            className="inline-flex items-center justify-center rounded-md border border-minimal bg-white px-6 py-3 text-[13px] font-medium text-[#111111] transition-transform hover:scale-[0.98] hover:bg-[#F9F9F8]"
          >
            View Sample Receipt
          </Link>
        </div>
      </div>

      <section className="grid gap-6 sm:grid-cols-3 mt-8">
        {[
          { 
            title: "HR Administration", 
            body: "Easily enroll team members, configure monthly deductions, and finalize company-wide payroll periods in one click." 
          },
          { 
            title: "Employee Receipts", 
            body: "Staff members have a dedicated, read-only portal to look up their historical deductions and verify their giving records." 
          },
          { 
            title: "Cryptographic Security", 
            body: "Every finalized action generates a secure, permanent signature. This guarantees the integrity of all payroll data without exposing private employee details." 
          },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-minimal bg-white p-8">
            <h3 className="text-[14px] font-medium text-[#111111]">{c.title}</h3>
            <p className="mt-3 text-[13px] leading-[1.6] text-[#787774]">{c.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
