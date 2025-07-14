"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getSupplierBySlug } from "@/lib/supplier/view/actions";
import { editSupplier } from "@/lib/supplier/edit/actions";
import { removeSupplier } from "@/lib/supplier/remove/actions";
import { useActionState } from "react";
import { supplierFormSchema } from "@/lib/supplier/create/validation";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SupplierFormProps {
  slug: string;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ slug }) => {
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const handleEdit = async (prevState: any, formData: FormData) => {
    setErrors({});
    const formValues = {
      name: formData.get("name"),
      cnpj: formData.get("cnpj"),
      address: formData.get("address"),
      pnumber: formData.get("pnumber"),
      description: formData.get("description"),
    };
    try {
      await supplierFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        console.log("Validation Errors:", fieldErrors);
        setErrors(fieldErrors as Record<string, string[]>);
        toast.error("Erro ao editar fornecedor");
        return prevState;
      }
    }
    if (!window.confirm("Tem certeza que deseja salvar as alterações deste fornecedor?")) {
      return prevState;
    }
    const res = await editSupplier(slug, formValues);
    if (!res.success) {
      console.log("Edit Supplier Error:", res.error);
      toast.error(res.error || "Erro ao editar fornecedor");
      return prevState;
    }
    toast.success("Fornecedor editado com sucesso!");
    setSupplier({ ...supplier, ...formValues });
    setEditMode(false);
    return prevState;
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
      return;
    }
    const res = await removeSupplier(slug);
    if (!res.success) {
      toast.error(res.error || "Erro ao excluir fornecedor");
      return;
    }
    toast.success("Fornecedor excluído com sucesso!");
    router.push("/visualizar/fornecedor");
  };

  const [formState, formAction, isPending] = useActionState(handleEdit, {
    error: "",
    status: "INITIAL"
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      setLoading(true);
      const res = await getSupplierBySlug(slug);
      if (res.success && res.supplier) {
        setSupplier(res.supplier);
        setError("");
      } else {
        setError(res.error || "Erro ao buscar fornecedor");
      }
      setLoading(false);
    };
    fetchSupplier();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="forms-error">{error || "Fornecedor não encontrado."}</p>
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
                    defaultValue={supplier.name}
                  />
                  {errors.name && errors.name.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p className="text-xl font-semibold">{supplier.name}</p>
              )}
              {editMode ? (
                <>
                  <input
                    className="forms-input text-sm text-gray-500 mt-2"
                    name="cnpj"
                    id="cnpj"
                    defaultValue={supplier.cnpj as string}
                  />
                  {errors.cnpj && errors.cnpj.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500">CNPJ: {supplier.cnpj}</p>
              )}
            </div>
            <div className="text-sm text-gray-700">
              {editMode ? (
                <>
                  <input
                    className="forms-input mb-2"
                    name="address"
                    defaultValue={supplier.address}
                  />
                  {errors.address && errors.address.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p>Endereço: {supplier.address}</p>
              )}
              {editMode ? (
                <>
                  <input
                    className="forms-input"
                    name="pnumber"
                    id="pnumber"
                    defaultValue={supplier.pnumber}
                  />
                  {errors.pnumber && errors.pnumber.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p>Telefone: {supplier.pnumber}</p>
              )}
            </div>
          </div>
          {/* Description field */}
          <div>
            <b>Descrição:</b>{' '}
            {editMode ? (
              <>
                <textarea
                  className="forms-input mt-1"
                  name="description"
                  defaultValue={supplier.description || ''}
                />
                {errors.description && errors.description.map((error, i) => (
                  <div key={i}><p className="forms-error">{error}</p></div>
                ))}
              </>
            ) : (
              <span>{supplier.description || '-'}</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Cadastrado em: {supplier.createdAt ? new Date(supplier.createdAt).toLocaleString() : "-"}
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

export default SupplierForm;