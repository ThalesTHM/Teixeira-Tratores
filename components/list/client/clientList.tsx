"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { viewClients } from "@/lib/client/view/actions";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const ClientList = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      const res = await viewClients();
      if (res.success) {
        setClients(res.clients);
        setError("");
      } else {
        setError(res.error || "Erro ao buscar clientes");
      }
      setLoading(false);
    };
    fetchClients();
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

  if (!clients.length) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="text-lg text-gray-500">Nenhum cliente encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
      {clients.map((client) => (
        <Link
          key={client.id}
          href={`/visualizando/cliente/${client.slug}`}
          className="no-underline"
        >
          <Card className="p-4 flex flex-row items-center justify-between shadow-md hover:bg-gray-100 transition-colors cursor-pointer">
            <span className="text-lg font-medium">{client.name}</span>
            <span className="text-xs text-gray-400">
              {client.createdAt ? new Date(client.createdAt).toLocaleString() : "-"}
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default ClientList;
