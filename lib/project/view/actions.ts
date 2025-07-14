"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";

export const viewProjects = async () => {
  const session = await getUserFromSession();
  if (!session) {
    return { success: false, error: "User not authenticated.", projects: [] };
  }
  try {
    const projectsCollection = adminFirestore.collection("projects");
    const snapshot = await projectsCollection.get();
    const projects = snapshot.docs.map((doc) => doc.data());
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
      return { success: false, error: "Project not found.", project: null };
    }
    return { success: true, error: "", project: snapshot.docs[0].data() };
  } catch (error) {
    return { success: false, error: "Error fetching project.", project: null };
  }
};
