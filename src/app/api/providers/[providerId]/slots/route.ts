import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { addSlots } from "@/lib/services/admin";
import { slotCreateSchema } from "@/lib/validations";

type Context = { params: Promise<{ providerId: string }> };

/** POST — provider opens the same time window on one or more days of their own calendar. */
export async function POST(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { providerId } = await params;
    const input = slotCreateSchema.parse(await readJson(request));
    const slots = await addSlots(getRepository(), await getSession(), providerId, input);
    return NextResponse.json({ slots }, { status: 201 });
  });
}
