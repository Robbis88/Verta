import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteExpense } from "./actions";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Expense = {
  id: string;
  property_id: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  cleaning: "Rengjøring",
  maintenance: "Vedlikehold",
  supplies: "Forbruksvarer",
  utilities: "Strøm / kommunale",
  insurance: "Forsikring",
  fee: "Gebyr",
  other: "Annet",
};

export default async function UtgifterPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireUser();
  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const year = Number(yearParam) || currentYear;
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const supabase = await createClient();
  const { data: props } = await supabase
    .from("properties")
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));

  const { data: expData } = await supabase
    .from("expenses")
    .select("id,property_id,category,amount,expense_date,description")
    .gte("expense_date", `${year}-01-01`)
    .lt("expense_date", `${year + 1}-01-01`)
    .order("expense_date", { ascending: false });
  const expenses = (expData ?? []) as Expense[];
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Utgifter</h1>
          <p className="text-sm text-muted-foreground">
            Registrer fradragsberettigede utgifter — de trekkes automatisk inn i
            skatterapporten.
          </p>
        </div>
        <div className="flex gap-2">
          {years.map((y) => (
            <Button key={y} asChild variant={y === year ? "default" : "outline"} size="sm">
              <Link href={`/dashboard/utgifter?year=${y}`}>{y}</Link>
            </Button>
          ))}
        </div>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Legg til en eiendom først.{" "}
            <Link href="/dashboard/properties/new" className="underline">
              Legg til eiendom
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ny utgift</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseForm properties={properties} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Utgifter {year} · {formatNok(total)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ingen utgifter registrert for {year}.
                </p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {expenses.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <span className="w-24 text-muted-foreground">
                        {e.expense_date}
                      </span>
                      <span className="flex-1">
                        {CATEGORY_LABEL[e.category] ?? e.category}
                        {e.description ? ` · ${e.description}` : ""}
                        <span className="text-muted-foreground">
                          {" "}
                          ({nameById.get(e.property_id) ?? "—"})
                        </span>
                      </span>
                      <span className="w-24 text-right font-medium">
                        {formatNok(Number(e.amount))}
                      </span>
                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={e.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Slett
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
