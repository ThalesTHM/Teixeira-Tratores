"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getClientBySlug } from "@/lib/client/view/actions";
import { editClient } from "@/lib/client/edit/actions";
import { removeClient } from "@/lib/client/remove/actions";
import { useActionState } from "react";
import { clientFormSchema } from "@/lib/validation";
import { z } from "zod";
import { toast } from "sonner";
import { MaskedInput } from "@/components/utils/MaskedInput";
import { useRouter } from "next/navigation";

interface ClientFormProps {
  slug: string;
}

const ClientForm: React.FC<ClientFormProps> = ({ slug }) => {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const handleEdit = async (prevState: any, formData: FormData) => {
    setErrors({});
    
    const formValues = {
      name: formData.get("name"),
      cpf: formData.get("cpf"),
      address: formData.get("address"),
      pnumber: formData.get("pnumber")
    };

    try {
      await clientFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as Record<string, string[]>);
        toast.error("Erro ao editar cliente");
        return prevState;
      }
    }

    if (!window.confirm("Tem certeza que deseja salvar as alterações deste cliente?")) {
      return prevState;
    }

    const res = await editClient(slug, formValues);
    if (!res.success) {
      toast.error(res.error || "Erro ao editar cliente");
      return prevState;
    }
    toast.success("Cliente editado com sucesso!");
    setClient({
      ...client,
      name: formValues.name,
      cpf: formValues.cpf,
      address: formValues.address,
      pnumber: formValues.pnumber
    });
    setEditMode(false);
    return prevState;
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este cliente?")) {
      return;
    }
    const res = await removeClient(slug);
    if (!res.success) {
      toast.error(res.error || "Erro ao excluir cliente");
      return;
    }
    toast.success("Cliente excluído com sucesso!");
    router.push("/visualizar/cliente");
  };

  const [formState, formAction, isPending] = useActionState(handleEdit, {
    error: "",
    status: "INITIAL"
  });

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      const res = await getClientBySlug(slug);
      if (res.success && res.client) {
        setClient(res.client);
        setError("");
      } else {
        setError(res.error || "Erro ao buscar cliente");
      }
      setLoading(false);
    };
    fetchClient();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="forms-error">{error || "Cliente não encontrado."}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
      <Card className="p-6 flex flex-col gap-4 shadow-lg">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div>
              {editMode ? (
                <>
                  <input
                    className="forms-input text-xl font-semibold"
                    name="name"
                    defaultValue={client.name}
                  />
                  {errors.name && errors.name.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p className="text-xl font-semibold">{client.name}</p>
              )}
              {editMode ? (
                <>
                  <MaskedInput
                    mask="000.000.000-00"
                    className="forms-input text-sm text-gray-500 mt-2"
                    name="cpf"
                    id="cpf"
                    defaultValue={client.cpf as string}
                  />
                  {errors.cpf && errors.cpf.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500">CPF: {client.cpf}</p>
              )}
            </div>
            <div className="text-sm text-gray-700">
              {editMode ? (
                <>
                  <input
                    className="forms-input mb-2"
                    name="address"
                    defaultValue={client.address}
                  />
                  {errors.address && errors.address.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p>Endereço: {client.address}</p>
              )}
              {editMode ? (
                <>
                  <MaskedInput
                    mask="(00) 0 0000-0000"
                    className="forms-input"
                    name="pnumber"
                    id="pnumber"
                    defaultValue={client.pnumber}
                  />
                  {errors.pnumber && errors.pnumber.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p>Telefone: {client.pnumber}</p>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Cadastrado em: {client.createdAt ? new Date(client.createdAt).toLocaleString() : "-"}
          </div>
          <div className="flex gap-2 mt-4">
            {editMode ? (
              <>
                <Button variant="outline" type="button" onClick={() => setEditMode(false)}>
                  Cancelar
                </Button>
                <Button variant="default" type="submit" disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </>
            ) : (
              <Button variant="outline" type="button" onClick={() => setEditMode(true)}>
                Editar
              </Button>
            )}
            <Button variant="destructive" type="button" onClick={handleDelete}>Excluir</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ClientForm;