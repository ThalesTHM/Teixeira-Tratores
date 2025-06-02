"server only";

import { z } from 'zod';

export const supplierFormSchema = z.object({
  name: z.string().min(1, { message: "Nome Deve Ter No Mínimo 1 Caractere." }),
  cnpj: z.string().min(18, { message: "CNPJ Deve Ter No Mínimo 18 Caracteres." })
    .max(18, { message: "CNPJ Deve Ter No Máximo 18 Caracteres." })
    .refine((val) => {
      const format = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
      if (!format.test(val)) return false;

      const digits = val.replace(/\D/g, "");
      if (digits.length !== 14) return false;

      function calculateDigit(digs: string, weights: number[]): string {
        let total = 0;
        for (let i = 0; i < digs.length; i++) {
          total += parseInt(digs[i], 10) * weights[i];
        }
        const remainder = total % 11;
        return remainder < 2 ? "0" : String(11 - remainder);
      }

      const weightsFirst = [5,4,3,2,9,8,7,6,5,4,3,2];
      const weightsSecond = [6, ...weightsFirst];

      const base = digits.slice(0, 12);
      const dv1 = calculateDigit(base, weightsFirst);
      const dv2 = calculateDigit(base + dv1, weightsSecond);

      return digits.slice(-2) === dv1 + dv2;
    }, "CPNJ inválido."),
  address: z.string().min(1, { message: "Endereço Deve Ter No Mínimo 1 Caractere." }),
  pnumber: z.string().min(16, { message: "Número De Telefone Deve Ter No Mínimo 16 Caracteres." }),
  description: z.string().min(20, { message: "Descrição Deve Ter No Mínimo 20 Caracteres." })
})