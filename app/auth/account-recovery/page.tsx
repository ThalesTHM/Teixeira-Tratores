"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useActionState, useState } from 'react';
import { z } from 'zod';
import { emailRecoverFormSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { requestPasswordRecovery } from '@/lib/auth'; // Assume this is your Next.js 15 action

const PasswordRecovery = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleRecovery = async (prevState: any, formData: FormData) => {
    try {
      setErrors({});

      const formValues = {
        email: formData.get("email") as string,
      };

      try {
        await emailRecoverFormSchema.parseAsync(formValues);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.flatten().fieldErrors;
          setErrors(fieldErrors as unknown as Record<string, string[]>);

          toast.error("Erro ao solicitar recuperação.");

          return { ...prevState, error: "Validation failed", status: "ERROR" };
        }
      }

      const result = await requestPasswordRecovery({ email: formValues.email });

      console.log(result);

      if (!result.success) {
        if(result.error == "Password recovery request already exists for this email.") {
          toast.error("Já existe uma solicitação de recuperação de senha para este e-mail.");
          
          return {
            ...prevState,
            error: result.error,
            status: "ERROR",
          };
        }

        toast.error(result.error || "Erro ao solicitar recuperação de senha.");
        return {
          ...prevState,
          error: result.error,
          status: "ERROR",
        };
      }

      toast.success("Solicitação de recuperação enviada! Verifique Com o Administrador o Código Para Resetar a Sua Senha.");

      return {
        ...prevState,
        error: "",
        status: "SUCCESS",
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as unknown as Record<string, string[]>);
        toast.error("Erro ao solicitar recuperação.");
        return { ...prevState, error: "Validation failed", status: "ERROR" };
      }
    }

    toast.error("Um erro não esperado ocorreu.");
    return {
      ...prevState,
      error: "An unexpected error has occurred",
      status: "ERROR",
    };
  };

  const [state, formAction, isPending] = useActionState(handleRecovery, {
    error: "",
    status: "INITIAL",
  });

  return (
    <div className='main-auth-form-container'>
      <div className='auth-form-container'>
        <form action={formAction}>
          <div>
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              name="email"
              placeholder='SeuEmail@site.com'
              required
            />
            {errors.email && (
              errors.email.map((error: string, i: number) => (
                <>
                  <div key={i}>
                    <p className="auth-form-error" key={i}>{error}</p>
                    <br />
                  </div>
                </>
              ))
            )
            }
          </div>

          <Button
            type='submit'
            className='auth-form-submit-button'
            disabled={isPending}
          >
            {isPending ? 'Enviando...' : 'Recuperar Senha'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordRecovery;