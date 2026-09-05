import {
  categoryLabels,
  categoryOrder,
  getModulesByCategory,
} from "@/lib/modules";
import { ModuleCard } from "@/components/modules/module-card";

export function ModuleGrid() {
  return (
    <div className="space-y-8">
      {categoryOrder.map((category) => {
        const items = getModulesByCategory(category);
        return (
          <section key={category} className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {categoryLabels[category]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((mod) => (
                <ModuleCard key={mod.id} module={mod} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
