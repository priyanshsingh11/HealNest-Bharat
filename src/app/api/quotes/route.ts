import { handle, LIMITS, readJson } from "@/lib/api";
import { getRepository } from "@/lib/db";
import { buildQuote } from "@/lib/services/quotes";
import { quoteRequestSchema } from "@/lib/validations";

/** POST /api/quotes — authoritative itemized quote. Nothing is charged or reserved. */
export async function POST(request: Request) {
  return handle(request, LIMITS.read, async () => {
    const input = quoteRequestSchema.parse(await readJson(request));
    const quote = await buildQuote(getRepository(), input);
    return { quote };
  });
}
