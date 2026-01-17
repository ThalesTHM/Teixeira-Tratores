"use server";

import { ProjectsRepository, ActionsHistoryRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export type Project = {
  id?: string;
  name: string;
  expectedBudget: number;
  deadline: number;
  description: string;
  client: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: number;
};

export const viewProjects = async () => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Projetos',
      details: `Tentativa de visualizar projetos sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        authenticated: false
      }
    });

    return { success: false, error: "User not authenticated.", projects: [] };
  }
  try {
    const projectsRepository = new ProjectsRepository();
    const projects = await projectsRepository.findAll();

    await actionsHistoryRepository.create({
      action: 'Projetos Visualizados',
      details: `Projetos foram visualizados.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        projectsCount: projects.length
      }
    });

    return { success: true, error: "", projects };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Projetos',
      details: `Erro ao buscar projetos. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        error: error instanceof Error ? error.message : 'Error fetching projects'
      }
    });

    return { success: false, error: "Error fetching projects.", projects: [] };
  }
};

export const getProjectBySlug = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Projeto',
      details: `Tentativa de visualizar projeto sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        slug,
        authenticated: false
      }
    });

    return { success: false, error: "User not authenticated.", project: null };
  }
  try {
    const projectsRepository = new ProjectsRepository();
    const project = await projectsRepository.findBySlug(slug);
    if (!project) {
      await actionsHistoryRepository.create({
        action: 'Falha na Visualização de Projeto',
        details: `Tentativa de visualizar projeto não encontrado.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug
        }
      });

      return { success: false, error: "Project not found.", project: undefined };
    }
    console.log(project);

    await actionsHistoryRepository.create({
      action: 'Projeto Visualizado',
      details: `Projeto "${project.name}" foi visualizado.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        projectName: project.name
      }
    });
    
    return { success: true, error: "", project };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Projeto',
      details: `Erro ao buscar projeto. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: error instanceof Error ? error.message : 'Error fetching project'
      }
    });

    return { success: false, error: "Error fetching project.", project: null };
  }
};
