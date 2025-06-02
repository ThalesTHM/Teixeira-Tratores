"server only";

import { z } from 'zod';

export const billsToRecieveFormSchema = z.object({
  price: z.number({ message: "Valor da Conta Inválido." }).min(0.01, { message: "O Valor da Conta Deve Ser no Mínimo 1 Centavo." }),
  expireDate: z.number({ message: "Data Inválida." }).positive({ message: "Data Inválida." }),
  paymentMethod: z.string()
    .refine((val: string) => {
      const paymentMethods = ["PIX", "CC", "CB", "DIN"];
      
      return paymentMethods.includes(val);
    }, { message: "Método de Pagamento Inválido."}),
  paymentStatus: z.string()
    .refine((val) => {
      const paymentStatus = ["P", "PEN"];

      return paymentStatus.includes(val);
    }, { message: "Status de Pagamento Inválido." }),
  project: z.string().nonempty({ message: "Projeto Inválido." })
})