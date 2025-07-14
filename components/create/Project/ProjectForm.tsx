"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaskedInput } from '@/components/utils/MaskedInput';
import { SelectInput } from '@/components/utils/SelectInput';
import SelectSkeleton from '@/components/utils/SelectSkeleton';
import { db, firebase } from '@/firebase/firebase';
import { createClient } from '@/lib/client/create/actions';
import { createProject } from '@/lib/project/create/actions';
import { clientFormSchema,  projectFormSchema } from '@/lib/validation';
import { viewClients } from '@/lib/client/view/actions';
import { Switch } from '@radix-ui/react-switch';
import { onValue, ref } from 'firebase/database';
import React, { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner';
import { set, z } from 'zod';

type Client = {
  id: string;
  createdAt: number;
  name: string;
}

const ProjectForm = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingError, setLoadingError] = useState<boolean>();

  useEffect(() => {
    setIsLoaded(false);
    const fetchClients = async () => {
      const res = await viewClients();
      if (res.success) {
        const validClients = (res.clients as any[]).filter(c => c.id && c.name && c.createdAt);
        setClients(validClients);
        setLoadingError(false);
      } else {
        setClients([]);
        setLoadingError(true);
      }
      setIsLoaded(true);
    };
    fetchClients();
  }, [])

  const handleSubmit = async (prevState: any, formData: FormData) => {
    setErrors({});
    const formValues = {
      name: formData.get('name'),
      expectedBudget: Number(formData.get('expectedBudget')),
      deadline: (new Date(formData.get('deadline') as string)).getTime(),
      description: formData.get('description'),
      client: formData.get('client')
    }

    try{
      await projectFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        console.log(fieldErrors);
        
        setErrors(fieldErrors as unknown as Record<string, string[]>);

        toast.error("Erro ao Cadastrar o Projeto");

        return{
          ...prevState,
          error: "Invalid Input",
          status: "ERROR"  
        }
      }
    }

    const res = await createProject(formData);

    if(!res.success){
      toast.error("Erro ao Cadastrar o Projeto");

      console.log(res.error);
     
      return{
        ...prevState,
        error: res.error,
        status: "ERROR"  
      }
    } 
    
    toast.success("Projeto Cadastrado com Sucesso!")

    return {
      ...prevState,
      error: "",
      status: "SUCCESS"
    }
  }

  const [_state, formAction, isPending] = useActionState(handleSubmit, {
    error: "",
    status: "INITIAL",
  })

  return (
    <div className='flex items-center justify-center h-full w-full'>
      <div className='p-4 mt-5 w-1/3 h-1/2'>
        <form action={formAction} className='flex flex-col gap-5'>
          <div>
            <Label htmlFor="name" className='forms-label'>Nome</Label>
            <Input
              placeholder='Nome do Projeto'
              name='name'
              id='name'
              className='forms-input'
            />
            {errors.name && (
              errors.name.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p>
                </div>
              ))
            )}
          </div>
          
          <div>
            <Label htmlFor="expectedBudget" className='forms-label'>Orçamento Previsto</Label>
            <Input
              placeholder='1234,56'
              name='expectedBudget'
              id='expectedBudget'
              className='forms-input'
              type='number'
              step='any'
            />
            {errors.expectedBudget && (
              errors.expectedBudget.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>

          <div>
            <Label htmlFor="deadline" className='forms-label'>Prazo</Label>
            <Input
              name='deadline'
              id='deadline'
              className="
                forms-input
                relative        
                pr-10 
                [&::-webkit-calendar-picker-indicator]:absolute
                [&::-webkit-calendar-picker-indicator]:right-2
                [&::-webkit-calendar-picker-indicator]:top-1/2
                [&::-webkit-calendar-picker-indicator]:-translate-y-1/2
                [&::-webkit-calendar-picker-indicator]:p-2
              "
              type='date'
              defaultValue={
                (new Date())
                .toISOString()
                .split("T")[0]
              }
            />
            {errors.deadline && (
              errors.deadline.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>
          
          <div>
            <Label htmlFor="description" className='forms-label'>Descrição</Label>
            <Textarea
              placeholder='Descrição do Projeto'
              name='description'
              className='forms-input'
            />
            {errors.description && (
              errors.description.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>
          
          <div className='flex flex-col gap-5'>
            <Label htmlFor='client' className='forms-label'>Cliente</Label> 
            {
              (isLoaded) ? (
              <div className='mt-[-10px]'>
                <SelectInput 
                  name="client"
                  items={
                    clients
                  ? clients
                      .slice()
                      .sort((a, b) => a.createdAt - b.createdAt)
                      .map((s) => ({
                        key: s.id,
                        value: s.name
                      }))
                  : []
                  }
                  selectLabel='Clientes'
                  placeholder='Selecione o Cliente'
                />
                {errors.client && (
                  errors.client.map((error: string, i: number) => (
                    <div key={i}>
                      <p className="forms-error" key={i}>{error}</p> 
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className='mt-[-10px]'>
                <SelectSkeleton
                  selectionText='Selecione o Cliente'
                />
              </div>
            )
          }
          </div>

          <div className="flex justify-center w-full">
            <Button type='submit' className='forms-button' disabled={isPending || !isLoaded}>
              {isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectForm