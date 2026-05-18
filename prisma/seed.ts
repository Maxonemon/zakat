import { appendAuditBlock } from "../src/lib/audit-chain";
import { prisma } from "../src/lib/db";

const DEMO_PAYROLL_LABEL = "Demo period · May 2026";

const employeeSeeds = [
  {
    name: "Sara El Amrani",
    email: "sara.elamrani@demo.local",
    department: "Finance",
    monthlyAmount: 25,
  },
  {
    name: "Youssef Haddad",
    email: "youssef.haddad@demo.local",
    department: "Engineering",
    monthlyAmount: 40,
  },
  {
    name: "Layla Mansour",
    email: "layla.mansour@demo.local",
    department: "People & Culture",
    monthlyAmount: 35,
  },
] as const;

export const main = async () => {
  for (const e of employeeSeeds) {
    await prisma.employee.upsert({
      where: { email: e.email },
      create: {
        name: e.name,
        email: e.email,
        department: e.department,
      },
      update: { name: e.name, department: e.department },
    });
  }

  const existingDemo = await prisma.payrollRun.findFirst({
    where: { label: DEMO_PAYROLL_LABEL },
  });
  if (existingDemo) return;

  for (const e of employeeSeeds) {
    const employee = await prisma.employee.findUniqueOrThrow({
      where: { email: e.email },
    });
    await prisma.enrollment.updateMany({
      where: { employeeId: employee.id },
      data: { active: false },
    });
    await prisma.enrollment.create({
      data: {
        employeeId: employee.id,
        monthlyAmount: e.monthlyAmount,
        active: true,
      },
    });
    await appendAuditBlock({
      type: "ENROLLMENT_CREATED",
      employeeId: employee.id,
      monthlyAmount: e.monthlyAmount,
    });
  }

  const run = await prisma.payrollRun.create({
    data: { label: DEMO_PAYROLL_LABEL, status: "DRAFT" },
  });

  await appendAuditBlock({
    type: "PAYROLL_RUN_CREATED",
    payrollRunId: run.id,
    label: DEMO_PAYROLL_LABEL,
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { active: true },
  });

  for (const enr of enrollments) {
    await prisma.deduction.upsert({
      where: {
        payrollRunId_employeeId: {
          payrollRunId: run.id,
          employeeId: enr.employeeId,
        },
      },
      create: {
        payrollRunId: run.id,
        employeeId: enr.employeeId,
        amount: enr.monthlyAmount,
      },
      update: { amount: enr.monthlyAmount },
    });
  }

  await appendAuditBlock({
    type: "DEDUCTIONS_GENERATED",
    payrollRunId: run.id,
    employeeCount: enrollments.length,
  });

  const finalized = await prisma.payrollRun.update({
    where: { id: run.id },
    data: { status: "FINALIZED", finalizedAt: new Date() },
    include: { deductions: true },
  });

  const total = finalized.deductions.reduce((s, d) => s + d.amount, 0);

  await appendAuditBlock({
    type: "PAYROLL_RUN_FINALIZED",
    payrollRunId: run.id,
    label: DEMO_PAYROLL_LABEL,
    total,
    lines: finalized.deductions.length,
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
