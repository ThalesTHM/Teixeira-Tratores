"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";

export type Project = {
  id?: string;
  name: string;
  expectedBudget: number;
  deadline: number;
  description: string;
  client: string;
  slug: string;
  createdAt?: number;
  updatedAt?: number;
};

export const viewProjects = async () => {
  const session = await getUserFromSession();
  if (!session) {
    return { success: false, error: "User not authenticated.", projects: [] };
  }
  try {
    const projectsCollection = adminFirestore.collection("projects");
    const snapshot = await projectsCollection.get();
    const projects: Project[] = snapshot.docs.map((doc) => doc.data() as Project);
    return { success: true, error: "", projects };
  } catch (error) {
    return { success: false, error: "Error fetching projects.", projects: [] };
  }
};

export const getProjectBySlug = async (slug: string) => {
  const session = await getUserFromSession();
  if (!session) {
    return { success: false, error: "User not authenticated.", project: null };
  }
  try {
    const projectsCollection = adminFirestore.collection("projects");
    const snapshot = await projectsCollection.where("slug", "==", slug).limit(1).get();
    if (snapshot.empty) {
      return { success: false, error: "Project not found.", project: undefined };
    }
    const project = snapshot.docs[0].data() as Project;
    console.log(project);
    
    return { success: true, error: "", project };
  } catch (error) {
    return { success: false, error: "Error fetching project.", project: null };
  }
};
