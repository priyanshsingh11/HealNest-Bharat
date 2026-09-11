import { NextResponse } from "next/server";
import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { submitReview } from "@/lib/services/reviews";
import { reviewSchema } from "@/lib/validations";

type Context = { params: Promise<{ bookingId: string }> };

/** POST — customer reviews their own completed visit (once): stars, aspect ratings, recommendation and a comment. */
export async function POST(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const { bookingId } = await params;
    const input = reviewSchema.parse(await readJson(request));
    const review = await submitReview(getRepository(), await getSession(), bookingId, input);
    return NextResponse.json({ review }, { status: 201 });
  });
}
