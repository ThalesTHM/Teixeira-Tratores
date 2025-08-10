"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useActionState, useState } from 'react';
import { z } from 'zod';
import { passwordRecoveryFormSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { changePassword } from '@/lib/auth';
import Link from 'next/link';

const PasswordUpdate = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

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
    <div className="main-auth-form-container !h-screen">
      <div className="auth-form-container">
        <form action={formAction}>
          <div>
            <label htmlFor="code">Código</label>
            <Input
              id="code"
              name="code"
              placeholder="Código de recuperação"
              required
            />
            {errors.code &&
              errors.code.map((error: string, i: number) => (
                <div key={i}>
                  <p className="auth-form-error">{error}</p>
                  <br />
                </div>
              ))}
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              name="email"
              placeholder="SeuEmail@site.com"
              required
              type="email"
            />
            {errors.email &&
              errors.email.map((error: string, i: number) => (
                <div key={i}>
                  <p className="auth-form-error">{error}</p>
                  <br />
                </div>
              ))}
          </div>
          <div>
            <label htmlFor="newPassword">Nova Senha</label>
            <Input
              id="newPassword"
              name="newPassword"
              placeholder="Nova senha"
              required
              type="password"
            />
            {errors.newPassword &&
              errors.newPassword.map((error: string, i: number) => (
                <div key={i}>
                  <p className="auth-form-error">{error}</p>
                  <br />
                </div>
              ))}
          </div>
          <div>
            <label htmlFor="newPasswordConfirmation">Confirme a Nova Senha</label>
            <Input
              id="newPasswordConfirmation"
              name="newPasswordConfirmation"
              placeholder="Confirme a nova senha"
              required
              type="password"
            />
            {errors.newPasswordConfirmation &&
              errors.newPasswordConfirmation.map((error: string, i: number) => (
                <div key={i}>
                  <p className="auth-form-error">{error}</p>
                  <br />
                </div>
              ))}
          </div>
          <Button
            type="submit"
            className="auth-form-submit-button"
            disabled={isPending}
          >
            {isPending ? 'Atualizando...' : 'Atualizar Senha'}
          </Button>

          <div className="flex justify-center items-center w-full">
            <Link href='/auth/login' className="w-full text-center">
              <span className="text-xs text-blue-500 hover:underline">Já atualizou a senha? Logar</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordUpdate;
