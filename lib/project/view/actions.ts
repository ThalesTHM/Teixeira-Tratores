"use server";

import { ProjectsRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";

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
    return { success: false, error: "User not authenticated.", projects: [] };
  }
  try {
    const projectsRepository = new ProjectsRepository();
    const projects = await projectsRepository.findAll();
    return { success: true, error: "", projects };
  } catch (error) {
    return { success: false, error: "Error fetching projects.", projects: [] };
  }
};

export const getProjectBySlug = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    return { success: false, error: "User not authenticated.", project: null };
  }
  try {
    const projectsRepository = new ProjectsRepository();
    const project = await projectsRepository.findBySlug(slug);
    if (!project) {
      return { success: false, error: "Project not found.", project: undefined };
    }
    console.log(project);
    
    return { success: true, error: "", project };
  } catch (error) {
    return { success: false, error: "Error fetching project.", project: null };
  }
};
