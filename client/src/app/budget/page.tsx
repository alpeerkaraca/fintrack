import { Suspense } from "react";
import BudgetEntryClient from "@/components/budget/BudgetEntryClient";

export default function BudgetPage() {
  return (
    <Suspense fallback={<div>Loading budget...</div>}>
      <BudgetEntryClient />
    </Suspense>
  );
}
