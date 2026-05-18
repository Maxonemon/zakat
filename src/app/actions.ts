"use server";

import { revalidatePath } from "next/cache";

import { appendAuditBlock } from "@/lib/audit-chain";
import { prisma } from "@/lib/db";

export const createEnrollment = async (formData: FormData) => {
  const employeeId = String(formData.get("employeeId") ?? "");
  const monthlyAmount = Number(formData.get("monthlyAmount"));
  if (!employeeId || Number.isNaN(monthlyAmount) || monthlyAmount <= 0) return;

  await prisma.enrollment.updateMany({
    where: { employeeId },
    data: { active: false },
  });

  await prisma.enrollment.create({
    data: { employeeId, monthlyAmount, active: true },
  });

  await appendAuditBlock({
    type: "ENROLLMENT_CREATED",
    employeeId,
    monthlyAmount,
  });

  revalidatePath("/hr");
};

export const setEnrollmentActive = async (formData: FormData) => {
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!enrollmentId) return;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { active },
  });

  await appendAuditBlock({
    type: "ENROLLMENT_TOGGLED",
    enrollmentId,
    active,
  });

  revalidatePath("/hr");
};

export const createPayrollRun = async (formData: FormData) => {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;

  const run = await prisma.payrollRun.create({
    data: { label, status: "DRAFT" },
  });

  await appendAuditBlock({
    type: "PAYROLL_RUN_CREATED",
    payrollRunId: run.id,
    label,
  });

  revalidatePath("/hr");
};

export const generateDeductions = async (formData: FormData) => {
  const payrollRunId = String(formData.get("payrollRunId") ?? "");
  if (!payrollRunId) return;

  const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
  if (!run || run.status !== "DRAFT") return;

  const enrollments = await prisma.enrollment.findMany({
    where: { active: true },
    include: { employee: true },
  });

  for (const e of enrollments) {
    await prisma.deduction.upsert({
      where: {
        payrollRunId_employeeId: { payrollRunId, employeeId: e.employeeId },
      },
      create: {
        payrollRunId,
        employeeId: e.employeeId,
        amount: e.monthlyAmount,
      },
      update: { amount: e.monthlyAmount },
    });
  }

  await appendAuditBlock({
    type: "DEDUCTIONS_GENERATED",
    payrollRunId,
    employeeCount: enrollments.length,
  });

  revalidatePath("/hr");
};

export const finalizePayrollRun = async (formData: FormData) => {
  const payrollRunId = String(formData.get("payrollRunId") ?? "");
  if (!payrollRunId) return;

  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: { deductions: true },
  });
  if (!run || run.status !== "DRAFT") return;

  const total = run.deductions.reduce((s, d) => s + d.amount, 0);

  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: { status: "FINALIZED", finalizedAt: new Date() },
  });

  await appendAuditBlock({
    type: "PAYROLL_RUN_FINALIZED",
    payrollRunId,
    label: run.label,
    total,
    lines: run.deductions.length,
  });

  revalidatePath("/hr");
  revalidatePath("/employee");
};
