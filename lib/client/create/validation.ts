"server only";

import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().min(1, { message: "Nome Deve Ter No Mínimo 1 Caracteres." }),
  cpf: z.string().min(14, { message: "CPF Deve Ter No Mínimo 14 Caracteres." })
    .max(14, { message: "CPF Deve Ter No Máximo 14 Caracteres." })
    .refine((val) => {
      const cpf = String(val).replace(/\D/g, '');
      if (cpf.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(cpf)) return false;

      function checkDigit(str: string, factor: number) {
        let sum = 0;
        for (let i = 0; i < str.length; i++) {
          sum += parseInt(str[i], 10) * (factor - i);
        }
        const remainder = (sum * 10) % 11;
        return remainder === 10 ? 0 : remainder;
      }

      const digit1 = checkDigit(cpf.slice(0, 9), 10);
      if (digit1 !== parseInt(cpf[9], 10)) return false;

      const digit2 = checkDigit(cpf.slice(0, 10), 11);
      return digit2 === parseInt(cpf[10], 10);
    }, { message: "CPF Inválido." }),
  address: z.string().min(1, { message: "Endereço Deve Ter No Mínimo 1 Caracteres." }),
  pnumber: z.string().min(14, { message: "Número De Telefone Deve Ter No Mínimo 14 Caracteres." })
})