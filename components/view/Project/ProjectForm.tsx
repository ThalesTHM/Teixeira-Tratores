"use client";

import { Card } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { editProject } from "@/lib/project/edit/actions";
import { removeProject } from "@/lib/project/remove/actions";
import { useActionState } from "react";
import { projectFormSchema } from "@/lib/validation";
import { getClientById } from "@/lib/client/view/actions";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SelectInput } from "@/components/utils/SelectInput";
import SelectSkeleton from "@/components/utils/SelectSkeleton";

interface Client {
  id: string;
  name: string;
  [key: string]: any;
}

interface Project {
  name: string;
  expectedBudget: number;
  deadline: number;
  description: string;
  client: string;
  createdAt: Date;
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
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientName, setClientName] = useState<string>("");
  const router = useRouter();

  const [formState, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
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
    setEditMode(false);
    return res;
  }, {
    error: "",
    status: "INITIAL"
  });

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

    useEffect(() => {
    setLoading(true);
    setClientsLoading(true);

    const projectEventSource = new EventSource(`/api/entities/projeto/${slug}`);
    const clientsEventSource = new EventSource('/api/entities/cliente');

    projectEventSource.onmessage = async (event: MessageEvent) => {
      if (!event.data || event.data === 'null') {
        setProject(null);
        setError('Project not found.');
        setClientName("");
        setLoading(false);
        return;
      }

      try {
        const data = JSON.parse(event.data);
        
        // If we have a client ID, fetch the client name immediately
        if (data.client) {
          const clientResult = await getClientById(data.client);
          console.log(clientResult);
          console.log(data.client);
          
          if (clientResult.success && clientResult.client) {
            
            setClientName(clientResult.client.name);
          } else {
            setClientName("");
          }
        } else {
          setClientName("");
        }
        
        setProject({
          name: data.name || "",
          expectedBudget: typeof data.expectedBudget === "number" ? data.expectedBudget : 0,
          deadline: typeof data.deadline === "number" ? data.deadline : 0,
          description: data.description || "",
          client: data.client,
          createdAt: typeof data.createdAt === "object" ? data.createdAt : new Date(),
        });

        setError("");
        setLoading(false);
      } catch (e) {
        console.error('Error processing project data:', e);
        setError("Erro ao processar dados do projeto");
        setProject(null);
        setLoading(false);
      }
    };

    // Handle clients for dropdown only
    clientsEventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          setClients(data);
        }
        setClientsLoading(false);
      } catch (e) {
        console.error('Error processing clients data:', e);
        setClientsLoading(false);
      }
    };

    projectEventSource.onerror = () => {
      setError("Erro na conexão com dados do projeto");
      setLoading(false);
    };

    clientsEventSource.onerror = () => {
      setClientsLoading(false);
    };

    // Cleanup function
    return () => {
      projectEventSource.close();
      clientsEventSource.close();
    };
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card className="p-4">
          <div className="text-red-500">{error}</div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card className="p-4">
          <div>Carregando...</div>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card className="p-4">
          <div>Projeto não encontrado.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="space-y-4">
        <Card className="p-4">
          <form action={formAction}>
            <div className="mb-2">
              <b>Nome:</b>{" "}
              {editMode ? (
                <input
                  className="forms-input"
                  name="name"
                  type="text"
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
              <b>Orçamento Esperado:</b>{" "}
              {editMode ? (
                <input
                  className="forms-input"
                  name="expectedBudget"
                  type="number"
                  defaultValue={project.expectedBudget}
                />
              ) : (
                project.expectedBudget.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
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
                project.description || "Nenhuma descrição fornecida"
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
                <span className={project.client ? "" : "text-gray-500 italic"}>
                  {clientName || "Nenhum cliente selecionado"}
                </span>
              )}
              {errors.client && errors.client.map((error, i) => (
                <div key={i}><p className="forms-error">{error}</p></div>
              ))}
            </div>
            <div className="mb-2 text-xs text-gray-400">
              Cadastrado em: {project.createdAt ? project.createdAt.toLocaleString() : "-"}
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