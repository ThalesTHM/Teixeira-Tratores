import { z } from 'zod';

export const signupFormSchema = z.object({
    email: z.string().min(6, { message: "Email Deve Ter No Mínimo 6 Caracteres." }).email("Endereço De E-mail Inválido."),
    password: z.string().min(8, { message: "Senha Deve Ter No Mínimo 8 Caracteres." })
      .refine((val) => /[A-Z]/.test(val), {
        message: "A Senha Deve Conter Pelo Menos Uma Letra Maiúscula.",
      })
      .refine((val) => /\d/.test(val), {
        message: "A Senha Deve Conter Pelo Menos Um Número.",
      })
      .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
        message: "A Senha Deve Conter Pelo Menos Um Caractere Especial.",
      })
});

export const loginFormSchema = z.object({
  email: z.string().min(6, { message: "Email Deve Ter No Mínimo 6 Caracteres." }).email("Endereço De E-mail Inválido."),
  password: z.string().min(8, { message: "Senha Deve Ter No Mínimo 8 Caracteres." })
});

export const clientFormSchema = z.object({
  name: z.string().min(1, { message: "Nome Deve Ter No Mínimo 1 Caractere." }),
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
  address: z.string().min(1, { message: "Endereço Deve Ter No Mínimo 1 Caractere." }),
  pnumber: z.string().min(16, { message: "Número De Telefone Deve Ter No Mínimo 16 Caracteres." })
});

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
});

export const billsToPayFormSchema = z.object({
  name: z.string().min(1, { message: "Nome deve ter no mínimo 1 Caractere." }),
  price: z.number({ message: "Valor da Conta Inválido." }).min(0.01, { message: "O Valor da Conta Deve Ser no Mínimo 1 Centavo." }),
  expireDate: z.number({ message: "Data Inválida." }).positive({ message: "Data Inválida." }),
  paymentMethod: z.string()
    .min(1, { message: "O Método de Pagamento Deve Ter no Mínimo 1 Caractere." })
    .refine((val: string) => {
      const paymentMethods = ["PIX", "CC", "CB", "DIN"];
      
      return paymentMethods.includes(val);
    }, { message: "Método de Pagamento Inválido."}),
  paymentStatus: z.string()
    .refine((val) => {
      const paymentStatus = ["P", "PEN"];

      return paymentStatus.includes(val);
    }, { message: "Status de Pagamento Inválido." }),
  haveSupplier: z.boolean(),
  supplier: z.string({ message: "Fornecedor Inválido." })
    .nullable()
    .optional(),
  description: z.string()
    .min(20, { message: "Descrição Deve Ter no Mínimo 20 Caracteres." })
})
.superRefine((data, ctx) => {
  if(data.haveSupplier && !data.supplier){
    ctx.addIssue({
      path: ['supplier'],
      code: z.ZodIssueCode.custom,
      message: 'Não Há Nenhum Fornecedor Selecionado'
    });
  }
})

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

export const projectFormSchema = z.object({
  name: z.string().min(1, { message: "O Nome do Projeto Deve Ter no Mínimo 1 Caracter." }),
  expectedBudget: z.number({ message: "Orçamento Inválido" }).min(0.01, { message: "Orçamento Previsto Deve Ser no Mínimo 1 Centavo" }),
  deadline: z.number({ message: "Prazo Inválido" }).positive({ message: "Data Inválida" }),
  description: z.string().min(20, { message: "Descrição Deve Ter no Mínimo 20 Caracteres." }),
  client: z.string({ message: "Cliente Inválido" })
})

export const employeeFormSchema = z.object({
  name: z.string().min(1, { message: "Nome Deve Ter No Mínimo 1 Caractere." }),
  email: z.string().min(6, { message: "Email Deve Ter No Mínimo 6 Caracteres." }).email("Endereço De E-mail Inválido."),
  position: z.string().min(1, { message: "Cargo Deve Ter No Mínimo 1 Caractere." })
  .refine((val) => {
    const positions = ["manager", "admin", "employee"];
    return positions.includes(val);
  }, { message: "Cargo Inválido." }),
  pnumber: z.string().min(16, { message: "Número De Telefone Deve Ter No Mínimo 16 Caracteres." }),
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
  address: z.string().min(1, { message: "Endereço Deve Ter No Mínimo 1 Caractere." })
})