"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { viewBillsToPay } from "@/lib/bill/pay/view/actions";

const BillsToPayList = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const res = await viewBillsToPay();
        if (res.success && Array.isArray(res.data)) {
          setBills(res.data);
          setError("");
        } else if (res.success && res.data === null) {
          setBills([]);
          setError("");
        } else {
          setError(res.error || "Erro Ao Buscar Contas A Pagar");
        }
      } catch (err) {
        setError("Erro Ao Buscar Contas A Pagar");
      }
      setLoading(false);
    };
    fetchBills();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="forms-error">{error}</p>
      </div>
    );
  }

  if (!bills.length) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="text-lg text-gray-500">Nenhuma Conta A Pagar Encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
      {bills.map((bill) => {
        const key = bill.slug || bill.id || bill.name || Math.random().toString(36);
        return (
          <Link
            key={key}
            href={`/visualizando/conta/conta-a-pagar/${bill.slug}`}
            className="no-underline"
          >
            <Card className="p-4 flex flex-row items-center justify-between shadow-md hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-lg font-medium">{bill.name}</span>
              <span className="text-xs text-gray-400">
                {bill.createdAt
                  ? new Date(bill.createdAt).toLocaleString()
                  : "-"}
              </span>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default BillsToPayList;
