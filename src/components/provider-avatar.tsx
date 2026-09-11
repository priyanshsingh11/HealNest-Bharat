import { CategoryIcon, KIND_TILE } from "@/components/category-meta";
import { categoryKind } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/formatters";
import type { ProviderProfile } from "@/types";

const SIZES = {
  sm: { box: "size-10 rounded-xl text-sm", badge: "-right-1 -bottom-1 size-5 border-2", icon: "size-3" },
  md: { box: "size-16 rounded-2xl text-lg", badge: "-right-1.5 -bottom-1.5 size-7 border-2", icon: "size-4" },
  lg: { box: "size-24 rounded-3xl text-3xl", badge: "-right-2 -bottom-2 size-10 border-4", icon: "size-5" },
};

/** The verified photo when there is one, otherwise initials on the category colour. The corner badge shows the profession. */
export function ProviderAvatar({
  provider,
  size = "md",
}: {
  provider: Pick<ProviderProfile, "name" | "category" | "photoUrl">;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  return (
    <div
      aria-hidden
      className={cn("relative grid shrink-0 place-items-center font-bold", s.box, !provider.photoUrl && KIND_TILE[categoryKind(provider.category)])}
    >
      {provider.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- small data-URL photo; next/image adds nothing here
        <img src={provider.photoUrl} alt="" className={cn("size-full object-cover", s.box)} />
      ) : (
        initials(provider.name)
      )}
      <span className={cn("absolute grid place-items-center rounded-full border-white bg-white", s.badge)}>
        <CategoryIcon category={provider.category} className={s.icon} />
      </span>
    </div>
  );
}
