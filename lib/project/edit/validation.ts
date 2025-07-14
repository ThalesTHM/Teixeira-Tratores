"server only";

import { z } from 'zod'

export const projectFormSchema = z.object({
  name: z.string().min(1, { message: "O Nome do Projeto Deve Ter no Mínimo 1 Caracter." }),
  expectedBudget: z.number({ message: "Orçamento Inválido" }).min(0.01, { message: "Orçamento Previsto Deve Ser no Mínimo 1 Centavo" }),
  deadline: z.number({ message: "Prazo Inválido" }).positive({ message: "Data Inválida" }),
  description: z.string().min(20, { message: "Descrição Deve Ter no Mínimo 20 Caracteres." }),
  client: z.string({ message: "Cliente Inválido" }).min(1, { message: "Cliente é obrigatório" })
})