"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import React, { useActionState, useState } from 'react';
import { z } from 'zod';
import { emailRecoverFormSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { requestPasswordRecovery } from '@/lib/password-recovery/actions';
import Link from 'next/link';

const PasswordRecovery = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const year = new Date().getFullYear();

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
    <div className="main-auth-form-wrapper">
      <Card className="w-full max-w-[520px] md:max-w-[420px] lg:max-w-[380px] shadow-login border-0 bg-white dark:bg-card py-4">
        <CardHeader className="text-center px-6 pt-6 pb-0">
          <CardTitle className="text-xl font-extrabold mb-1">Recuperar conta</CardTitle>
          <p className="text-muted-foreground text-sm">Digite seu e-mail para solicitar recuperação</p>
        </CardHeader>
        <CardContent className="px-6 pt-3 pb-4">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="forms-label">Email</label>
              <Input
                id="email"
                name="email"
                placeholder="seu@email.com"
                required
                className="forms-input mt-1"
                autoComplete="email"
              />
              {errors.email && (
                errors.email.map((error: string, i: number) => (
                  <p className="forms-error" key={i}>{error}</p>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <Link href='/auth/password-update' className="text-sm text-primary hover:underline font-medium">Já tem um código? Atualizar senha</Link>
            </div>

            <div>
              <Button
                type='submit'
                className='forms-button'
                disabled={isPending}
              >
                {isPending ? 'Enviando...' : 'Recuperar Senha'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center px-6 pb-4 pt-0">
          <span className="text-sm text-muted-foreground">Voltar para <Link href="/auth/login" className="text-primary hover:underline font-medium">Login</Link></span>
          <small className="text-xs text-muted-foreground mt-1">© {year} Teixeira Tratores™</small>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PasswordRecovery;