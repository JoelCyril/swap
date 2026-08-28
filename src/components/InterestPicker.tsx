import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateMyProfile } from "@/lib/profile.functions";
import { CATEGORIES, type ItemCategory } from "@/lib/db-types";
import { toast } from "sonner";
import {
  Armchair,
  BookOpen,
  ChevronRight,
  Dumbbell,
  Gamepad2,
  Gem,
  Laptop,
  Shirt,
  Sparkles,
  TentTree,
} from "lucide-react";

const CATEGORY_META: Record<ItemCategory, { icon: typeof Laptop; description: string }> = {
  Electronics: { icon: Laptop, description: "Phones, laptops, gadgets" },
  "Household Items": { icon: Armchair, description: "Furniture, kitchen, decor" },
  Clothing: { icon: Shirt, description: "Fashion, shoes, accessories" },
  Outdoors: { icon: TentTree, description: "Camping, garden, bikes" },
  Accessories: { icon: Gem, description: "Bags, jewellery, watches" },
  Books: { icon: BookOpen, description: "Books, comics, magazines" },
  Toys: { icon: Gamepad2, description: "Kids toys, games, hobbies" },
  Sports: { icon: Dumbbell, description: "Gym gear, sport equipment" },
};

interface Props {
  onDone: (interests: ItemCategory[]) => void;
  onSkip?: () => void;
  isNewUser?: boolean;
  storageKey?: string;
}

export function InterestPicker({ onDone, onSkip, isNewUser = false, storageKey }: Props) {
  const [selected, setSelected] = useState<Set<ItemCategory>>(new Set());
  const updateProfile = useServerFn(updateMyProfile);

  const saveMut = useMutation({
    mutationFn: async (interests: ItemCategory[]) => {
      try {
        await updateProfile({ data: { interests } });
      } catch (error) {
        localStorage.setItem("swap_interests", JSON.stringify(interests));
        if (!String(error).toLowerCase().includes("interests")) throw error;
      }
      if (storageKey) localStorage.setItem(storageKey, "done");
      localStorage.setItem("swap_interests_prompted", "true");
    },
    onSuccess: (_, interests) => onDone(interests),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save interests"),
  });

  function toggle(cat: ItemCategory) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleSkip() {
    if (storageKey) localStorage.setItem(storageKey, "done");
    localStorage.setItem("swap_interests_prompted", "true");
    onSkip?.();
    onDone([]);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start sm:justify-center overflow-y-auto bg-background/95 p-4 py-8 sm:py-12 backdrop-blur-md animate-in fade-in duration-200">
      <div className="my-auto w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            {isNewUser ? "Welcome to SWAP!" : "What are you into?"}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground sm:text-base">
            {isNewUser
              ? "Pick the categories you care about and we will personalize your browse feed."
              : "Choose a few interests and we will show the most relevant listings first."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const isOn = selected.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(cat)}
                className={`relative flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border-2 p-4 text-center transition duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                  isOn
                    ? "border-primary bg-primary/10 shadow-glow ring-2 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {isOn && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12" aria-hidden>
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className={`block text-xs font-black ${isOn ? "text-primary" : "text-foreground"}`}>
                    {cat}
                  </span>
                  <span className="mt-1 block text-[10px] leading-tight text-muted-foreground">
                    {meta.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {selected.size === 0
            ? "Select at least one category to personalize your feed"
            : `${selected.size} categor${selected.size === 1 ? "y" : "ies"} selected`}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => saveMut.mutate(Array.from(selected))}
            disabled={selected.size === 0 || saveMut.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3.5 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          >
            {saveMut.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <ChevronRight className="h-4 w-4" />
                {isNewUser ? "Go to Browse" : "Save My Interests"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="text-center text-xs text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
          >
            Skip for now, show me everything
          </button>
        </div>
      </div>
    </div>
  );
}

