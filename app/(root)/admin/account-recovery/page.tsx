"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { allowPasswordRecovery, denyPasswordRecoveryRequest } from "@/lib/auth";

interface RecoveryRequest {
  id: string;
  email: string;
  createdAt: number;
}

const denyRequest = async (id: string) => {
  await denyPasswordRecoveryRequest(id);
};

export default function AdminAccountRecoveryPage() {
  const [pendingRequests, setPendingRequests] = useState<RecoveryRequest[]>([]);
  const [allowedRecoveries, setAllowedRecoveries] = useState<any[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [allowedCodes, setAllowedCodes] = useState<Record<string, string>>({});
  const [_, startTransition] = useTransition();

  useEffect(() => {
    const eventSource = new EventSource("/api/password-recovery-requests");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setPendingRequests(Array.isArray(data.pendingRequests) ? data.pendingRequests : []);
        setAllowedRecoveries(Array.isArray(data.allowedRecoveries) ? data.allowedRecoveries : []);
      } catch (e) {}
    };
    eventSource.onerror = () => {
      eventSource.close();
    };
    return () => {
      eventSource.close();
    };
  }, []);

  const handleAllow = async (email: string, id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const result = await allowPasswordRecovery(email);
      if (result?.success) {
        setAllowedCodes((prev) => ({ ...prev, [id]: result.code ?? "Código não disponível" }));
      } else {
        setAllowedCodes((prev) => ({ ...prev, [id]: `Erro: ${result?.error || "Erro ao permitir recuperação."}` }));
      }
      setPendingId(null);
    });
  };

  const handleDeny = async (id: string) => {
    setPendingId(id);
    await denyRequest(id);
    setAllowedCodes((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setPendingId(null);
  };

  const handleCancelAllowed = async (email: string) => {
    setPendingId(email);
    await denyRequest(email); // reuse deny logic, but pass email
    setPendingId(null);
  };

  return (
    <div className="main-auth-form-container pt-20 justify-start min-h-full">
      <Card className="w-full max-w-xl p-6 space-y-4 shadow-lg mx-auto overflow-x-visible">
        <h2 className="text-2xl font-bold mb-4 select-none">Solicitações de Recuperação de Senha</h2>
        {pendingRequests.length === 0 && allowedRecoveries.length === 0 ? (
          <p className="text-muted-foreground select-none">Nenhuma solicitação pendente ou permitida.</p>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <>
                <h3 className="font-semibold text-lg select-none">Pendentes</h3>
                <ul className="space-y-2">
                  {pendingRequests.map((req) => (
                    <li key={req.id} className="flex items-center justify-between border rounded p-3 bg-card max-w-full overflow-x-auto">
                      <span className="font-mono text-sm truncate max-w-[180px] select-none">{req.email}</span>
                      <div className="flex gap-2 items-center flex-shrink-0">
                        {allowedCodes[req.id] && (
                          <span className="text-green-700 font-semibold select-all">
                            {allowedCodes[req.id].startsWith('Erro:') ? (
                              <span className="text-red-600">{allowedCodes[req.id]}</span>
                            ) : (
                              <>Código: {allowedCodes[req.id]}</>
                            )}
                          </span>
                        )}
                        <Button
                          className="bg-primary text-primary-foreground border border-primary hover:bg-primary/90"
                          disabled={pendingId === req.id}
                          onClick={() => handleAllow(req.email, req.id)}
                        >
                          Permitir
                        </Button>
                        <Button
                          className="bg-zinc-400 text-zinc-900 border border-zinc-300 hover:bg-zinc-500 hover:text-white focus:ring-2 focus:ring-zinc-400"
                          disabled={pendingId === req.id}
                          onClick={() => handleDeny(req.id)}
                        >
                          Negar
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {allowedRecoveries.length > 0 && (
              <>
                <h3 className="font-semibold text-lg mt-6 select-none">Permitidas</h3>
                <ul className="space-y-2">
                  {allowedRecoveries.map((rec) => (
                    <li key={rec.id} className="flex items-center justify-between border rounded p-3 bg-green-50 max-w-full overflow-x-auto">
                      <span className="font-mono text-sm truncate max-w-[180px] select-none">{rec.email}</span>
                      <span className="text-green-700 font-semibold select-all">Código: {rec.code}</span>
                      <Button
                        className="bg-red-500 text-white border border-red-600 hover:bg-red-600 focus:ring-2 focus:ring-red-400 ml-2"
                        onClick={() => handleCancelAllowed(rec.email)}
                      >
                        Cancelar
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
