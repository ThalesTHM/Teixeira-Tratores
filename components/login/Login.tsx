"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import React, { useActionState, useEffect, useState } from 'react';
import { z } from 'zod';
import { loginFormSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/firebase';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { createSession } from '@/lib/auth/actions';
import { useSearchParams } from 'next/navigation';

const Login = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
  const [hasMounted, setHasMounted] = useState(false);

  const router = useRouter();

  const year = new Date().getFullYear();

  const params = useSearchParams();
  const redirected = params.get('redirected');

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  useEffect(() => {
    if (!hasMounted) return;

    if (redirected) {
      toast.error('Você precisa estar logado para acessar essa página.');
      router.replace('/auth/login');
    }
  }, [hasMounted, redirected]);

  const handleLogin = async (prevState: any, formData: FormData) => {
    try{
      setErrors({});

      const formValues = {
        email: formData.get("email") as string,
        password: formData.get("password") as string
      };

      await loginFormSchema.parseAsync(formValues);

      const user = await signInWithEmailAndPassword(formValues.email, formValues.password);
        
      const idToken = (await user?.user.getIdToken()) as string;

      const resCreateSession = await createSession({ idToken });

      if(!resCreateSession.success){
        toast.error("Senha ou Login Incorretos, Tente Novamente.");
        return {
          ...prevState,
          error: resCreateSession.error,
          status: "ERROR",
        };
      }

      toast.success("Logado com Sucesso!");

      router.push("/");

      return {
        ...prevState,
        error: "",
        status: "SUCCESS",
      };
    } catch (error){
      if(error instanceof z.ZodError){
        const fieldErrors = error.flatten().fieldErrors;
        
        setErrors(fieldErrors as unknown as Record<string, string[]>);

        toast.error("Erro ao Logar, Verifique o Formulário para Erros de Escrita.");

        return { ...prevState, error: "Validation failed", status: "ERROR" };
      }

      if(error instanceof FirebaseError){
        toast.error("Erro ao Logar, Verifique o seu E-mail ou Senha.");

        return { ...prevState, error: "Validation failed", status: "ERROR" };
      }
    }

    toast.error("Um erro não esperado ocorreu.");

    return {
      ...prevState,
      error: "An unexpected error has occurred",
      status: "ERROR",
    };
  }

  const [state, formAction, isPending] = useActionState(handleLogin, {
    error: "",
    status: "INITIAL",
  });

  return (
    <div className="main-auth-form-wrapper">
      <Card style={{ width: '100%', maxWidth: '380px', minWidth: '320px' }} className="w-full shadow-login border-0 bg-white dark:bg-card py-4">
        <CardHeader className="text-center px-5 pt-3 pb-0">
          <CardTitle className="text-lg font-extrabold mb-0">Bem-vindo de volta</CardTitle>
          <p className="text-muted-foreground text-xs mt-1">Entre para acessar sua conta</p>
        </CardHeader>
        <CardContent className="px-6 pt-2 pb-4">
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
            <div>
              <label htmlFor="password" className="forms-label">Senha</label>
              <Input
                id="password"
                name="password"
                placeholder="Sua senha"
                type="password"
                className="forms-input mt-1"
                autoComplete="current-password"
              />
              {errors.password && (
                errors.password.map((error: string, i: number) => (
                  <p className="forms-error" key={i}>{error}</p>
                ))
              )}
            </div>
            <div className="flex items-center justify-between">
              <div />
              <Link href="/auth/account-recovery" className="text-sm text-primary hover:underline font-medium">Esqueceu sua senha?</Link>
            </div>
            <div>
              <Button
                type="submit"
                className="forms-button"
                disabled={isPending}
              >
                {isPending ? 'Logando...' : 'Logar'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center px-6 pb-4 pt-0">
          <span className="text-sm text-muted-foreground">Não tem uma conta? <Link href="/auth/signup" className="text-primary hover:underline font-medium">Cadastre-se</Link></span>
          <small className="text-xs text-muted-foreground mt-1">© {year} Teixeira Tratores™</small>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Login;