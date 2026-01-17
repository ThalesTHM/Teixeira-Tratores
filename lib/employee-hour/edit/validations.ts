import { z } from "zod";

export const EmployeeHourFormSchema = z.object({
    date: z.date({ required_error: "Date is required" }),
    totalTime: z.string().min(1, { message: "Total time is required" }),
    project: z.string().min(1, { message: "Project is required" }),
    description: z.string().min(1, { message: "Description is required" }),
});