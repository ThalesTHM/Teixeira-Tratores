"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useActionState, useEffect, useState } from 'react';
import { z } from 'zod';
import { loginFormSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/firebase';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { createSession } from '@/lib/auth';
import { useSearchParams } from 'next/navigation';

const Login = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
  const [hasMounted, setHasMounted] = useState(false);

  const router = useRouter();

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
        toast.error("Erro ao Criar a Sessão, Tente Novamente.");
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
                  <br/>
                </div>
              </>
            )
            ))}
          </div>

          <div className='mt-5'>
            <label htmlFor="password">Senha</label>
            <Input
              id="password"
              name="password"
              placeholder='senha'
              type="password"
            />
            {errors.password && (
              errors.password.map((error: string, i: number) => (
                <>
                  <div key={i}>
                    <p className="auth-form-error" key={i}>{error}</p> 
                    <br/>
                  </div>
                </>
            )
            ))}
          </div>

          <Button 
            type='submit'
            className='auth-form-submit-button'
            disabled={isPending}
          >
            {isPending ? 'Logando...' : 'Logar'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Login;