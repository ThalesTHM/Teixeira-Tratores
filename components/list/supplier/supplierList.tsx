"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { viewSuppliers } from "@/lib/supplier/view/actions";
import Link from "next/link";

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      const res = await viewSuppliers();
      if (res.success) {
        setSuppliers(res.suppliers);
        setError("");
      } else {
        setError(res.error || "Error fetching suppliers");
      }
      setLoading(false);
    };
    fetchSuppliers();
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
        <p className="forms-error">Erro Ao Buscar Fornecedores</p>
      </div>
    );
  }

  if (!suppliers.length) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="text-lg text-gray-500">Nenhum Fornecedor Encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
      {suppliers.map((supplier) => (
        <Link
          key={supplier.id}
          href={`/visualizando/fornecedor/${supplier.slug}`}
          className="no-underline"
        >
          <Card className="p-4 flex flex-row items-center justify-between shadow-md hover:bg-gray-100 transition-colors cursor-pointer">
            <span className="text-lg font-medium">{supplier.name}</span>
            <span className="text-xs text-gray-400">
              {supplier.createdAt ? new Date(supplier.createdAt).toLocaleString() : "-"}
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default SupplierList;
