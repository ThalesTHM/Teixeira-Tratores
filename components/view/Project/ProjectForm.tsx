"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjectBySlug } from "@/lib/project/view/actions";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { editProject } from "@/lib/project/edit/actions";
import { removeProject } from "@/lib/project/remove/actions";
import { useActionState } from "react";
import { projectFormSchema } from "@/lib/validation";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { viewClients } from "@/lib/client/view/actions";
import { SelectInput } from "@/components/utils/SelectInput";
import SelectSkeleton from "@/components/utils/SelectSkeleton";
import { getClientById } from "@/lib/client/view/actions";

interface Project {
  name: string;
  expectedBudget: number;
  deadline: number;
  description: string;
  client: string;
  createdAt: number;
}

type ProjectFormProps = {
  slug: string;
};

const ProjectForm: React.FC<ProjectFormProps> = ({ slug }) => {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientName, setClientName] = useState<string>("");
  const router = useRouter();

  const handleEdit = async (prevState: any, formData: FormData) => {
    setErrors({});
    const formValues = {
      name: formData.get("name"),
      expectedBudget: Number(formData.get("expectedBudget")),
      deadline: (new Date(formData.get('deadline') as string)).getTime(),
      description: formData.get("description"),
      client: formData.get("client"),
    };

    try {
      await projectFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as Record<string, string[]>);
        toast.error("Erro ao editar projeto");
        return prevState;
      }
    }
    if (!window.confirm("Tem certeza que deseja salvar as alterações deste projeto?")) {
      return prevState;
    }
    const res = await editProject(slug, formValues);
    if (!res.success) {
      toast.error(res.error || "Erro ao editar projeto");
      return prevState;
    }
    toast.success("Projeto editado com sucesso!");
    // Refetch the updated project from backend to ensure UI is up to date
    const updatedRes = await getProjectBySlug(slug);
    if (updatedRes.success && updatedRes.project) {
      setProject({
        name: updatedRes.project.name || "",
        expectedBudget:
          typeof updatedRes.project.expectedBudget === "number"
            ? updatedRes.project.expectedBudget
            : 0,
        deadline:
          typeof updatedRes.project.deadline === "number"
            ? updatedRes.project.deadline
            : 0,
        description: updatedRes.project.description || "",
        client: updatedRes.project.client || "",
        createdAt:
          typeof updatedRes.project.createdAt === "number"
            ? updatedRes.project.createdAt
            : 0,
      });
      // Update clientName after edit
      if (updatedRes.project.client) {
        const found = clients.find((c) => c.id === updatedRes.project.client);
        if (found && found.name) {
          setClientName(found.name);
        } else {
          const clientRes = await getClientById(updatedRes.project.client);
          if (clientRes.success && clientRes.client && typeof clientRes.client.name === "string") {
            setClientName(clientRes.client.name);
          } else {
            setClientName("");
          }
        }
      } else {
        setClientName("");
      }
    }
    setEditMode(false);
    return prevState;
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este projeto?")) {
      return;
    }
    const res = await removeProject(slug);
    if (!res.success) {
      toast.error(res.error || "Erro ao excluir projeto");
      return;
    }
    toast.success("Projeto excluído com sucesso!");
    router.push("/visualizar/projeto");
  };

  const [formState, formAction, isPending] = useActionState(handleEdit, {
    error: "",
    status: "INITIAL"
  });

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      const res = await getProjectBySlug(slug);
      if (res.success && res.project) {
        setProject({
          name: res.project.name || "",
          expectedBudget:
            typeof res.project.expectedBudget === "number"
              && res.project.expectedBudget || 0,
          deadline:
            typeof res.project.deadline === "number"
              ? res.project.deadline
              : 0,
          description: res.project.description || "",
          client: res.project.client || "",
          createdAt:
            typeof res.project.createdAt === "number"
              ? res.project.createdAt
              : 0,
        });
        setError("");
        // Fetch client name after project is set
        if (res.project.client) {
          // Try to get the client from the already loaded clients list first
          const found = clients.find((c) => c.id === res.project.client);
          if (found && found.name) {
            setClientName(found.name);
          } else {
            const clientRes = await getClientById(res.project.client);
            console.log("Client Response:", clientRes);
            
            if (clientRes.success && clientRes.client && typeof (clientRes.client as any).name === "string") {
              setClientName(String((clientRes.client as any).name));
            } else {
              setClientName("");
            }
          }
        } else {
          setClientName("");
        }
      } else {
        setError(res.error || "Project not found.");
        setProject(null);
        setClientName("");
      }
      setLoading(false);
    };
    const fetchClients = async () => {
      setClientsLoading(true);
      const res = await viewClients();
      if (res.success) {
        setClients(res.clients);
      }
      setClientsLoading(false);
    };
    fetchProject();
    fetchClients();
    // fetchClientName will be called in a separate effect below
  }, [slug]);

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (error) return <Card className="p-4 text-red-500">{error}</Card>;
  if (!project) return <Card className="p-4">Projeto não encontrado.</Card>;

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="p-4 mt-5 w-1/3 h-1/2">
        <Card className="p-4">
          <h2 className="text-lg font-bold mb-2">Detalhes do Projeto</h2>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="mb-2">
              <b>Nome:</b>{" "}
              {editMode ? (
                <input
                  className="forms-input"
                  name="name"
                  defaultValue={project.name}
                />
              ) : (
                project.name
              )}
              {errors.name && errors.name.map((error, i) => (
                <div key={i}><p className="forms-error">{error}</p></div>
              ))}
            </div>
            <div className="mb-2">
              <b>Orçamento Previsto:</b>{" "}
              {editMode ? (
                <input
                  className="forms-input"
                  name="expectedBudget"
                  type="number"
                  step="any"
                  defaultValue={project.expectedBudget}
                />
              ) : (
                project.expectedBudget?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              )}
              {errors.expectedBudget && errors.expectedBudget.map((error, i) => (
                <div key={i}><p className="forms-error">{error}</p></div>
              ))}
            </div>
            <div className="mb-2">
              <b>Prazo:</b>{" "}
              {editMode ? (
                <input
                  className="forms-input"
                  name="deadline"
                  type="date"
                  defaultValue={project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : ""}
                />
              ) : (
                project.deadline
                  ? new Date(project.deadline).toLocaleDateString()
                  : "-"
              )}
              {errors.deadline && errors.deadline.map((error, i) => (
                <div key={i}><p className="forms-error">{error}</p></div>
              ))}
            </div>
            <div className="mb-2">
              <b>Descrição:</b>{" "}
              {editMode ? (
                <textarea
                  className="forms-input"
                  name="description"
                  defaultValue={project.description}
                />
              ) : (
                project.description
              )}
              {errors.description && errors.description.map((error, i) => (
                <div key={i}><p className="forms-error">{error}</p></div>
              ))}
            </div>
            <div className="mb-2">
              <b>Cliente:</b>{" "}
              {editMode ? (
                clientsLoading ? (
                  <SelectSkeleton selectionText="Selecione o Cliente" />
                ) : (
                <SelectInput
                  name="client"
                  items={clients.map((c) => ({ key: c.id, value: c.name }))}
                  selectLabel="Clientes"
                  placeholder="Selecione o Cliente"
                  defaultValue={project.client}
                />
                )
              ) : (
                clientName || "-"
              )}
              {errors.client && errors.client.map((error, i) => (
                <div key={i}><p className="forms-error">{error}</p></div>
              ))}
            </div>
            <div className="mb-2 text-xs text-gray-400">
              Cadastrado em: {project.createdAt ? new Date(project.createdAt).toLocaleString() : "-"}
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
    </div>
  );
};

export default ProjectForm;