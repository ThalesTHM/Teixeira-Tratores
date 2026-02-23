"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import React, { useActionState, useState } from 'react';
import { z } from 'zod';
import { passwordRecoveryFormSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { changePassword } from '@/lib/password-recovery/actions';
import Link from 'next/link';

const PasswordUpdate = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const year = new Date().getFullYear();

  const handlePasswordUpdate = async (prevState: any, formData: FormData) => {
    setErrors({});
    const formValues = {
      code: formData.get('code') as string,
      email: formData.get('email') as string,
      newPassword: formData.get('newPassword') as string,
      newPasswordConfirmation: formData.get('newPasswordConfirmation') as string,
    };

    try {
      await passwordRecoveryFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as unknown as Record<string, string[]>);
        toast.error('Erro ao atualizar a senha.');
        return { ...prevState, error: 'Validation failed', status: 'ERROR' };
      }
    }

    const result = await changePassword(formValues);

    if (!result.success) {
      if (typeof result.error === 'object') {
        setErrors(result.error as Record<string, string[]>);
        toast.error('Erro ao atualizar a senha.');
      } else {
        toast.error(result.error || 'Erro ao atualizar a senha.');
      }
      return { ...prevState, error: result.error, status: 'ERROR' };
    }

    toast.success('Senha atualizada com sucesso!');
    return { ...prevState, error: '', status: 'SUCCESS' };
  };

  const [state, formAction, isPending] = useActionState(handlePasswordUpdate, {
    error: '',
    status: 'INITIAL',
  });

  return (
    <div className="main-auth-form-wrapper">
      <Card className="w-full max-w-[520px] md:max-w-[420px] lg:max-w-[380px] shadow-login border-0 bg-white dark:bg-card py-4">
        <CardHeader className="text-center px-6 pt-6 pb-0">
          <CardTitle className="text-xl font-extrabold mb-1">Atualizar senha</CardTitle>
          <p className="text-muted-foreground text-sm">Use o código recebido para definir uma nova senha</p>
        </CardHeader>
        <CardContent className="px-6 pt-3 pb-4">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="code" className="forms-label">Código</label>
              <Input
                id="code"
                name="code"
                placeholder="Código de recuperação"
                required
                className="forms-input mt-1"
              />
              {errors.code && (
                errors.code.map((error: string, i: number) => (
                  <p className="forms-error" key={i}>{error}</p>
                ))
              )}
            </div>

            <div>
              <label htmlFor="email" className="forms-label">Email</label>
              <Input
                id="email"
                name="email"
                placeholder="seu@email.com"
                required
                type="email"
                className="forms-input mt-1"
              />
              {errors.email && (
                errors.email.map((error: string, i: number) => (
                  <p className="forms-error" key={i}>{error}</p>
                ))
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="forms-label">Nova Senha</label>
              <Input
                id="newPassword"
                name="newPassword"
                placeholder="Nova senha"
                required
                type="password"
                className="forms-input mt-1"
              />
              {errors.newPassword && (
                errors.newPassword.map((error: string, i: number) => (
                  <p className="forms-error" key={i}>{error}</p>
                ))
              )}
            </div>

            <div>
              <label htmlFor="newPasswordConfirmation" className="forms-label">Confirme a Nova Senha</label>
              <Input
                id="newPasswordConfirmation"
                name="newPasswordConfirmation"
                placeholder="Confirme a nova senha"
                required
                type="password"
                className="forms-input mt-1"
              />
              {errors.newPasswordConfirmation && (
                errors.newPasswordConfirmation.map((error: string, i: number) => (
                  <p className="forms-error" key={i}>{error}</p>
                ))
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="forms-button"
                disabled={isPending}
              >
                {isPending ? 'Atualizando...' : 'Atualizar Senha'}
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

export default PasswordUpdate;
