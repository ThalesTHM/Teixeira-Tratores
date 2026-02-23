"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import React, { useActionState, useState } from 'react';
import { z } from 'zod';
import { signupFormSchema } from '@/lib/auth/auth-validation';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createSession, createUser } from '@/lib/auth/actions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/firebase/firebase';

const Signup = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();
  const year = new Date().getFullYear();

  const handleSignup = async (prevState: any, formData: FormData) => {
    try{
      setErrors({});

      const formValues = {
        email: formData.get("email") as string,
        password: formData.get("password") as string
      };

      await signupFormSchema.parseAsync(formValues);

      const user = await createUser(
        {
          email: formData.get("email") as string,
          password: formData.get("password") as string
        }
      );
      
      if(!user.success){
        switch(user.error) {
          case "Email Invite Not Found":
            toast.error("Convite de E-mail Não Encontrado.");
            break;
          case "Email Already Registered":
            toast.error("E-mail Já Registrado.");
            break;
          case "Internal Server Error":
            toast.error("Erro Interno do Servidor.");
            break;
          default:
            toast.error("Erro ao Criar Sessão.");
        }
        
        return {
          ...prevState,
          error: user.error,
          status: "ERROR",
        };
      }
      const userToken = user.userToken as string;
      
      const userCredentials = await signInWithCustomToken(auth, userToken);

      const idToken = await userCredentials.user.getIdToken();
      const email = userCredentials.user.email as string;

      const resCreateSession = await createSession({ idToken });

      if(!resCreateSession.success){
        toast.error("Erro ao Criar a Sessão, Tente Novamente.");
        return {
          ...prevState,
          error: resCreateSession.error,
          status: "ERROR",
        };
      }

      toast.success("Cadastrado com Sucesso!");

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

        toast.error("Erro ao Cadastrar.");

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

  const [state, formAction, isPending] = useActionState(handleSignup, {
    error: "",
    status: "INITIAL",
  });

  return (
    <div className="main-auth-form-wrapper">
      <Card className="w-full max-w-[520px] md:max-w-[420px] lg:max-w-[380px] shadow-login border-0 bg-white dark:bg-card py-4">
        <CardHeader className="text-center px-6 pt-6 pb-0">
          <CardTitle className="text-xl font-extrabold mb-1">Criar conta</CardTitle>
          <p className="text-muted-foreground text-sm">Cadastre-se para acessar o sistema</p>
        </CardHeader>
        <CardContent className="px-6 pt-3 pb-4">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="forms-label">Email</label>
              <Input
                id="email"
                name="email"
                placeholder='seu@email.com'
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
                placeholder='Senha forte'
                type="password"
                className="forms-input mt-1"
                autoComplete="new-password"
              />
              {errors.password && (
                errors.password.map((error: string, i: number) => (
                  <p className="forms-error" key={i}>{error}</p>
                ))
              )}
            </div>

            <div>
              <Button 
                type='submit'
                className='forms-button'
                disabled={isPending}
              >
                {isPending ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center px-6 pb-4 pt-0">
          <span className="text-sm text-muted-foreground">Já tem uma conta? <Link href="/auth/login" className="text-primary hover:underline font-medium">Login</Link></span>
          <small className="text-xs text-muted-foreground mt-1">© {year} Teixeira Tratores™</small>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Signup