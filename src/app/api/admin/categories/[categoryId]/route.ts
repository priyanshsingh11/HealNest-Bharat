import { handle, LIMITS, readJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { updateCategory } from "@/lib/services/admin";
import { categorySchema, categoryUpdateSchema } from "@/lib/validations";

type Context = { params: Promise<{ categoryId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  return handle(request, LIMITS.write, async () => {
    const categoryId = categorySchema.parse((await params).categoryId);
    const patch = categoryUpdateSchema.parse(await readJson(request));
    const category = await updateCategory(getRepository(), await getSession(), categoryId, patch);
    return { category };
  });
}
