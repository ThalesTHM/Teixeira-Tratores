"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getEmployeeBySlug } from "@/lib/employee/view/actions";
import { editEmployee } from "@/lib/employee/edit/actions";
import { removeEmployee } from "@/lib/employee/remove/actions";
import { useActionState } from "react";
import { employeeFormSchema } from "@/lib/validation";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SelectInput } from "@/components/utils/SelectInput";

interface EmployeeFormProps {
  slug: string;
}

const employeeTypes = {
  admin: "Administrador",
  employee: "Funcionário",
  manager: "Gerente"
}

const roles = [
  { key: 'admin', value: 'Administrador' },
  { key: 'manager', value: 'Gerente' },
  { key: 'employee', value: 'Empregado' }
]

const EmployeeForm: React.FC<EmployeeFormProps> = ({ slug }) => {
  const [employee, setEmployee] = useState<any>(null);
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
        toast.error("Erro Ao Editar Funcionário");
        return prevState;
      }
    }
    if (!window.confirm("Tem Certeza Que Deseja Salvar As Alterações Deste Funcionário?")) {
      return prevState;
    }
    const res = await editEmployee(slug, formValues);
    if (!res.success) {
      const errorMsg = typeof res.error === "string"
        ? res.error
        : "Erro Ao Editar Funcionário";
      toast.error(errorMsg);
      return prevState;
    }
    toast.success("Funcionário Editado Com Sucesso!");
    setEmployee({ ...employee, ...formValues });
    setEditMode(false);
    return prevState;
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem Certeza Que Deseja Excluir Este Funcionário?")) {
      return;
    }
    const res = await removeEmployee(slug);
    if (!res.success) {
      toast.error(res.error || "Erro Ao Excluir Funcionário");
      return;
    }
    toast.success("Funcionário Excluído Com Sucesso!");
    router.push("/visualizar/funcionario");
  };

  const [formState, formAction, isPending] = useActionState(handleEdit, {
    error: "",
    status: "INITIAL"
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      const res = await getEmployeeBySlug(slug);
      if (res.success && res.employee) {
        setEmployee(res.employee);
        console.log("Fetched Employee:", res.employee);
        setError("");
      } else {
        setError(res.error || "Erro Ao Buscar Funcionário");
      }
      setLoading(false);
    };
    fetchEmployee();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="forms-error">{error || "Funcionário Não Encontrado."}</p>
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
                    defaultValue={employee.name}
                  />
                  {errors.name && errors.name.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p className="text-xl font-semibold">{employee.name}</p>
              )}
              {editMode ? (
                <>
                  <input
                    className="forms-input text-sm text-gray-500 mt-2"
                    name="email"
                    id="email"
                    defaultValue={employee.email as string}
                  />
                  {errors.email && errors.email.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500">E-mail: {employee.email}</p>
              )}
            </div>
            <div className="text-sm text-gray-700">
              {editMode ? (
                <>
                  <SelectInput
                    placeholder='Cargo do Funcionário'
                    name='role'
                    items={roles}
                    selectLabel='Cargos'
                    defaultValue={employee.role}
                  />
                  {errors.role && errors.role.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p>Cargo: {employeeTypes[employee.role as keyof typeof employeeTypes]}</p>
              )}
              {editMode ? (
                <>
                  <input
                    className="forms-input"
                    name="pnumber"
                    id="pnumber"
                    defaultValue={employee.pnumber}
                  />
                  {errors.pnumber && errors.pnumber.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p>Telefone: {employee.pnumber}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <div className="text-sm text-gray-700">
              {editMode ? (
                <>
                  <input
                    className="forms-input"
                    name="cpf"
                    id="cpf"
                    defaultValue={employee.cpf}
                  />
                  {errors.cpf && errors.cpf.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p>CPF: {employee.cpf}</p>
              )}
              {editMode ? (
                <>
                  <input
                    className="forms-input"
                    name="address"
                    id="address"
                    defaultValue={employee.address}
                  />
                  {errors.address && errors.address.map((error, i) => (
                    <div key={i}><p className="forms-error">{error}</p></div>
                  ))}
                </>
              ) : (
                <p>Endereço: {employee.address}</p>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Cadastrado em: {employee.createdAt ? new Date(employee.createdAt).toLocaleString() : "-"}
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

export default EmployeeForm;