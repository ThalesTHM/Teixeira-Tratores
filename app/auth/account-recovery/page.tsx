"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useActionState, useState } from 'react';
import { z } from 'zod';
import { emailRecoverFormSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { requestPasswordRecovery } from '@/lib/auth';
import Link from 'next/link';

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
    <div className='min-h-screen flex items-center justify-center bg-slate-50'>
      <div className='auth-form-container !p-0 h-[420px] min-h-[420px]'>
        <form action={formAction} className="flex flex-col h-full w-full">
          <div className="flex flex-col justify-center h-1/2 w-full items-center p-2">
            <div className="w-full flex flex-col gap-2">
              <label htmlFor="email" className="text-left w-full">Email</label>
              <Input
                id="email"
                name="email"
                placeholder='SeuEmail@site.com'
                required
              />
              {errors.email && (
                errors.email.map((error: string, i: number) => (
                  <div key={i} className="w-full text-center">
                    <p className="auth-form-error" key={i}>{error}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 w-full mt-8 auth-form-bottom !p-0 !px-0 !py-0">
            <Button
              type='submit'
              className='auth-form-submit-button w-full'
              disabled={isPending}
            >
              {isPending ? 'Enviando...' : 'Recuperar Senha'}
            </Button>
            <div className="flex justify-center items-center w-full mt-10">
              <Link href='/auth/password-update' className="w-full text-center">
                <span className="text-xs text-blue-500 hover:underline">Já tem um código? Atualizar senha</span>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordRecovery;