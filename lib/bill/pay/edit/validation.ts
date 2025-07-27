"server only";

import { z } from 'zod';

export const billsToPayFormSchema = z.object({
  name: z.string().min(1, { message: "Nome deve ter no mínimo 1 Caractere." }),
  price: z.number({ message: "Valor da Conta Inválido." }).min(0.01, { message: "O Valor da Conta Deve Ser no Mínimo 1 centavo" }),
  expireDate: z.number({ message: "Data Inválida." }).positive({ message: "Data Inválida." }),
  paymentMethod: z.string()
    .min(1, { message: "O Método de Pagamento Deve Ter no Mínimo 1 Caractere." })
    .refine((val: string) => {
      const paymentMethods = ["PIX", "CC", "CB", "DIN", "BOL", "TRF"];
      
      return paymentMethods.includes(val);
    }, { message: "Método de Pagamento Inválido."}),
  paymentStatus: z.string()
    .min(1, { message: "O Status do Pagamento Deve Ter no Mínimo 1 Caractere." })
    .max(3, { message: "O Status do Pagamento Deve ter no Máximo 3 Caracteres." })
    .refine((val) => {
      const paymentStatus = ["P", "PEN", "ATR"];

      return paymentStatus.includes(val);
    }, { message: "Status de Pagamento Inválido." }),
  supplier: z.string({ message: "Fornecedor Inválido." })
    .nullable()
    .optional(),
  description: z.string()
    .min(20, { message: "Descrição Deve Ter no Mínimo 20 Caracteres." })
})