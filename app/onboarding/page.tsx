import { createOnboardingProperty } from "./actions";
import { PropertyForm } from "@/components/properties/property-form";

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Steg 1 av 2</p>
        <h1 className="text-2xl font-semibold">Legg til din første eiendom</h1>
      </div>
      <PropertyForm
        action={createOnboardingProperty}
        submitLabel="Neste: velg plan"
      />
    </div>
  );
}
