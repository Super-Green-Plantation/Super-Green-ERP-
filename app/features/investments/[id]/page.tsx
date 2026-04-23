"use client";

import { getInvestmentById } from "@/app/features/investments/actions";
import { useParams, notFound } from "next/navigation";
import CreateInvestmentForm from "../create/page";
import { useEffect, useState } from "react";
import Loading from "@/app/components/Status/Loading";

// Mirror the shape returned by getInvestmentById
type InvestmentDetail = NonNullable<Awaited<ReturnType<typeof getInvestmentById>>>;

export default function EditInvestmentPage() {
  const params = useParams();
  const id = Number(params.id);

  const [inv, setInv] = useState<InvestmentDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getInvestmentById(id).then(data => {
      if (!data) setNotFound(true);
      else setInv(data);
    });
  }, [id]); // ← dependency array, runs once per id

  if (notFound) return <div className="p-8 text-sm text-muted-foreground">Investment not found.</div>;
  if (!inv) return <Loading />;

  return (
    <div className="p-4 md:p-8">
      <CreateInvestmentForm
        investmentId={inv.id}
        lockedClient={inv.client}
        initialData={{
          planId: inv.planId ?? undefined,
          amount: inv.amount,
          investmentDate: new Date(inv.investmentDate).toISOString().slice(0, 10),
          investmentRate: inv.investmentRate ?? undefined,
          beneficiary: inv.beneficiary ?? undefined,
          nominee: inv.nominee ?? undefined,
        }}
      />
    </div>
  );
}