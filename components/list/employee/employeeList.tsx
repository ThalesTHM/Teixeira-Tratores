"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { viewEmployees } from "@/lib/employee/view/actions";
import Link from "next/link";

const EmployeeList = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      const res = await viewEmployees();
      if (res.success) {
        setEmployees(Array.isArray(res.employees) ? res.employees : []);
        setError("");
      } else {
        setError(res.error || "Erro Ao Buscar Funcionários");
      }
      setLoading(false);
    };
    fetchEmployees();
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
        <p className="forms-error">Erro Ao Buscar Funcionários</p>
      </div>
    );
  }

  if (!employees.length) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="text-lg text-gray-500">Nenhum Funcionário Encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
      {employees.map((employee) => {
        const key = employee.slug || employee.id || employee.email || Math.random().toString(36);
        return (
          <Link
            key={key}
            href={`/visualizando/funcionario/${employee.slug}`}
            className="no-underline"
          >
            <Card className="p-4 flex flex-row items-center justify-between shadow-md hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-lg font-medium">{employee.name}</span>
              <span className="text-xs text-gray-400">
                {employee.createdAt
                  ? new Date(employee.createdAt).toLocaleString()
                  : "-"}
              </span>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default EmployeeList;
