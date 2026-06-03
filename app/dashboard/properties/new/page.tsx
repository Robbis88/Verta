import { createProperty } from "../actions";
import { PropertyForm } from "@/components/properties/property-form";

export default function NewPropertyPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Ny eiendom</h1>
      <PropertyForm action={createProperty} submitLabel="Opprett eiendom" />
    </div>
  );
}
