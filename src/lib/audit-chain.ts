import { createHash } from "node:crypto";

import { prisma } from "@/lib/db";

const GENESIS_PREV = "0".repeat(64);

type AuditPayload = Record<string, unknown>;

export const hashPayload = (prevHash: string, payload: AuditPayload) => {
  const body = JSON.stringify({ prevHash, payload });
  return createHash("sha256").update(body).digest("hex");
};

export const appendAuditBlock = async (payload: AuditPayload) => {
  const last = await prisma.auditBlock.findFirst({
    orderBy: { index: "desc" },
  });
  const nextIndex = last ? last.index + 1 : 0;
  const prevHash = last?.hash ?? GENESIS_PREV;
  const hash = hashPayload(prevHash, payload);

  return prisma.auditBlock.create({
    data: {
      index: nextIndex,
      prevHash,
      hash,
      payload: JSON.stringify(payload),
    },
  });
};

export const verifyAuditChain = async () => {
  const blocks = await prisma.auditBlock.findMany({ orderBy: { index: "asc" } });
  let prevHash = GENESIS_PREV;
  for (const block of blocks) {
    if (block.prevHash !== prevHash) return { ok: false as const, at: block.index };
    const parsed = JSON.parse(block.payload) as AuditPayload;
    const expected = hashPayload(block.prevHash, parsed);
    if (expected !== block.hash) return { ok: false as const, at: block.index };
    prevHash = block.hash;
  }
  return { ok: true as const, count: blocks.length };
};
