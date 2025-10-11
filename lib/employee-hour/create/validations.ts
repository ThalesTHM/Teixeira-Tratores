import { z } from "zod";

export const EmployeeHourFormSchema = z.object({
    date: z.string().min(1, { message: "Data é obrigatória" }),
    startingHour: z.string().min(1, { message: "Hora de início é obrigatória" }),
    totalTime: z.string().min(1, { message: "Tempo total é obrigatório" }),
    project: z.string().min(1, { message: "Projeto é obrigatório" }),
    description: z.string().min(1, { message: "Descrição é obrigatória" }),
});