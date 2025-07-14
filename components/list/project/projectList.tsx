"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { viewProjects } from "@/lib/project/view/actions";
import Link from "next/link";

const ProjectList = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const res = await viewProjects();
      if (res.success) {
        setProjects(res.projects);
        setError("");
      } else {
        setError(res.error || "Error fetching projects");
      }
      setLoading(false);
    };
    fetchProjects();
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
        <p className="forms-error">Erro Ao Buscar Projetos</p>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="text-lg text-gray-500">Nenhum Projeto Encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
      {projects.map((project) => {
        const key = project.slug || project.id || project.name || Math.random().toString(36);
        return (
          <Link
            key={key}
            href={`/visualizando/projeto/${project.slug}`}
            className="no-underline"
          >
            <Card className="p-4 flex flex-row items-center justify-between shadow-md hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-lg font-medium">{project.name}</span>
              <span className="text-xs text-gray-400">
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleString()
                  : "-"}
              </span>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default ProjectList;
