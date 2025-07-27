"use client";

import React, { useEffect, useState } from "react";
import { viewBillsToReceive } from "@/lib/bill/recieve/view/actions";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BillsToRecieveList: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      const res = await viewBillsToReceive();
      if (res.success) {
        setBills(res.bills ?? []);
        setError("");
      } else {
        setError(res.error || "Erro ao buscar contas a receber.");
      }
      setLoading(false);
    };
    fetchBills();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-10">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-10">
        <Card className="p-4 text-red-500">{error}</Card>
      </div>
    );
  }

  if (!bills.length) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-10">
        <Card className="p-4">Nenhuma conta a receber encontrada.</Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <h2 className="text-lg font-bold mb-4">Contas a Receber</h2>
      <div className="flex flex-col gap-4">
        {bills.map((bill) => (
          <Link key={bill.id} href={`/visualizando/conta/conta-a-receber/${bill.slug}`} className="no-underline">
            <Card className="p-4 flex flex-row items-center gap-2 cursor-pointer hover:bg-gray-50 transition">
              <div className="flex-1">
                <b>{bill.name}</b>
              </div>
              <div className="text-xs text-gray-400 ml-4 whitespace-nowrap">
                {bill.createdAt ? new Date(bill.createdAt).toLocaleString() : "-"}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BillsToRecieveList;
