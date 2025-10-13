"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";
import { SelectInput } from "@/components/utils/SelectInput";
import { employeeFormSchema } from "@/lib/validation";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { editEmailInvite } from "@/lib/email-invite/edit/actions";
import { removeEmailInvite } from "@/lib/email-invite/remove/actions";

interface EmailInvite {
  name: string;
  email: string;
  role: string;
  pnumber: string;
  cpf: string;
  address: string;
  used: boolean;
  createdAt: Date;
  slug: string;
}

interface InviteFormProps {
  slug: string;
}

const roleTypes = {
  admin: "Administrador",
  manager: "Gerente",
  employee: "Funcionário"
}

const EmailInviteForm: React.FC<InviteFormProps> = ({ slug }) => {
  const [invite, setInvite] = useState<EmailInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();

  const handleEdit = async (prevState: any, formData: FormData) => {
    setErrors({});
    const formValues = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      pnumber: formData.get("pnumber"),
      cpf: formData.get("cpf"),
      address: formData.get("address"),
    };

    try {
      await employeeFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as Record<string, string[]>);
        toast.error("Erro ao editar convite");
        return prevState;
      }
    }

    if (!window.confirm("Tem certeza que deseja salvar as alterações deste convite?")) {
      return prevState;
    }

    const res = await editEmailInvite(slug, formValues);
    if (!res.success) {
      toast.error(typeof res.error === "string" ? res.error : "Erro ao editar convite");
      return prevState;
    }

    toast.success("Convite editado com sucesso!");
    setEditMode(false);
    return res;
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este convite?")) {
      return;
    }
    const res = await removeEmailInvite(slug);
    if (!res.success) {
      toast.error(res.error || "Erro ao excluir convite");
      return;
    }
    toast.success("Convite excluído com sucesso!");
    router.push("/visualizar/email-convites");
  };

  const [formState, formAction, isPending] = useActionState(handleEdit, {
    error: "",
    status: "INITIAL"
  });

  useEffect(() => {
    setLoading(true);

    const inviteEventSource = new EventSource(`/api/entities/convite/${slug}`);

    inviteEventSource.onmessage = async (event: MessageEvent) => {
      if (!event.data || event.data === 'null') {
        setInvite(null);
        setError('Convite não encontrado.');
        setLoading(false);
        return;
      }

      try {
        const data = JSON.parse(event.data);
        setInvite({
          name: data.name || "",
          email: data.email || "",
          role: data.role || "",
          pnumber: data.pnumber || "",
          cpf: data.cpf || "",
          address: data.address || "",
          used: data.used || false,
          createdAt: typeof data.createdAt === "object" ? data.createdAt : new Date(),
          slug: data.slug || "",
        });
        setError("");
        setLoading(false);
      } catch (e) {
        console.error('Error processing invite data:', e);
        setError("Erro ao processar dados do convite");
        setInvite(null);
        setLoading(false);
      }
    };

    inviteEventSource.onerror = () => {
      setError("Erro na conexão com dados do convite");
      setLoading(false);
    };

    return () => {
      inviteEventSource.close();
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card className="p-4">
          <div>Carregando...</div>
        </Card>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card className="p-4">
          <div className="text-red-500">{error || "Convite não encontrado."}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card className="p-6">
        <form action={formAction}>
          <div className="space-y-4">
            <div>
              <b>Nome:</b>{" "}
              {editMode ? (
                <>
                  <input
                    className="forms-input"
                    name="name"
                    type="text"
                    defaultValue={invite.name}
                  />
                  {errors.name && errors.name.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                invite.name
              )}
            </div>

            <div>
              <b>Email:</b>{" "}
              {editMode ? (
                <>
                  <input
                    className="forms-input"
                    name="email"
                    type="email"
                    defaultValue={invite.email}
                  />
                  {errors.email && errors.email.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                invite.email
              )}
            </div>

            <div>
              <b>Cargo:</b>{" "}
              {editMode ? (
                <>
                  <SelectInput
                    name="role"
                    items={[
                      { key: 'admin', value: 'Administrador' },
                      { key: 'manager', value: 'Gerente' },
                      { key: 'employee', value: 'Funcionário' }
                    ]}
                    selectLabel="Cargo"
                    placeholder="Selecione o Cargo"
                    defaultValue={invite.role}
                  />
                  {errors.role && errors.role.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                roleTypes[invite.role as keyof typeof roleTypes]
              )}
            </div>

            <div>
              <b>Telefone:</b>{" "}
              {editMode ? (
                <>
                  <input
                    className="forms-input"
                    name="pnumber"
                    type="text"
                    defaultValue={invite.pnumber}
                  />
                  {errors.pnumber && errors.pnumber.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                invite.pnumber
              )}
            </div>

            <div>
              <b>CPF:</b>{" "}
              {editMode ? (
                <>
                  <input
                    className="forms-input"
                    name="cpf"
                    type="text"
                    defaultValue={invite.cpf}
                  />
                  {errors.cpf && errors.cpf.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                invite.cpf
              )}
            </div>

            <div>
              <b>Endereço:</b>{" "}
              {editMode ? (
                <>
                  <input
                    className="forms-input"
                    name="address"
                    type="text"
                    defaultValue={invite.address}
                  />
                  {errors.address && errors.address.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                invite.address
              )}
            </div>

            <div>
              <b>Status:</b>{" "}
              <span className="text-yellow-600">
                Pendente
              </span>
            </div>

            <div className="text-xs text-gray-400">
              <div>Cadastrado em: {invite.createdAt ? invite.createdAt.toLocaleString() : "-"}</div>
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
              <Button variant="destructive" type="button" onClick={handleDelete}>
                Excluir
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EmailInviteForm;