"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SelectInput } from '@/components/utils/SelectInput';
import { billsToRecieveFormSchema, projectFormSchema } from '@/lib/validation';
import React, { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner';
import { z } from 'zod';
import { viewProjects } from '@/lib/project/view/actions';
import SelectSkeleton from '@/components/utils/SelectSkeleton';
import { createBillToRecieve } from '@/lib/bill/recieve/create/actions';

type Project = {
  slug: string;
  name: string;
  createdAt?: number;
}

const paymentMethods = [
  { key: 'PIX', value: 'PIX' },
  { key: 'CC', value: 'Cartão de Crédito' },
  { key: 'CB', value: 'Cartão de Débito' },
  { key: 'DIN', value: 'Dinheiro' },
  { key: 'BOL', value: 'Boleto' },
  { key: 'TRF', value: 'Transferência' },
];

const paymentStatus = [
  { key: 'P', value: 'Pago' },
  { key: 'PEN', value: 'Pendente' },
  { key: 'ATR', value: 'Atrasado' },
];

const BillsToRecieveForm = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>();
  const [loadingError, setLoadingError] = useState<boolean>();

  useEffect(() => {
    setIsLoaded(false);
    async function fetchProjects() {
      const res = await viewProjects();
      console.log(res.projects);
      if (res.success && Array.isArray(res.projects)) {
                setProjects(res.projects.map((p) => ({
                  slug: p.slug,
                  name: p.name,
                  createdAt: p.createdAt
                })));
        setLoadingError(false);
      } else {
        setProjects([]);
        setLoadingError(true);
        toast.error(res.error || "Erro ao buscar projetos.");
      }
      setIsLoaded(true);
    }
    fetchProjects();
  }, []);
  

  const handleSubmit = async (prevState: any, formData: FormData) => {
    setErrors({});

    const formValues = {
      name: formData.get('name'),
      price: Number(formData.get('price')),
      expireDate: (new Date(formData.get('expireDate') as string)).getTime(),
      paymentMethod: formData.get('paymentMethod'),
      paymentStatus: formData.get('paymentStatus'),
      project: formData.get('project')
    }
    
    try{
      await billsToRecieveFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        
        setErrors(fieldErrors as unknown as Record<string, string[]>);

        toast.error("Erro ao Cadastrar a Conta")

        return {
          ...prevState,
          error: fieldErrors,
          status: "ERROR"
        }
      }
    }
    
    const res = await createBillToRecieve(formData);

    if(!res.success){
     toast.error("Erro ao Cadastrar a Conta");
     console.log(res.error);

      return{
        ...prevState,
        error: res.error,
        status: "ERROR"  
      }
    } 
    
    toast.success("Conta Cadastrada com Sucesso!")
    
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
            <Label htmlFor="name" className="forms-label">Nome da Conta</Label>
            <Input
              placeholder="Ex: Primeira Parcela do Projeto X"
              name="name"
              id="name"
              className="forms-input"
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
            <Label className='forms-label' htmlFor='project'>Projeto</Label>
            {
              (isLoaded) ? (
                <div>
                  <SelectInput 
                    name="project"
                    items={
                      projects
                    ? projects
                        .slice()
                        .sort((a, b) => a.createdAt! - b.createdAt!)
                        .map((p) => {
                          console.log('Project option:', p.slug, p.name);
                          return {
                            key: p.slug,
                            value: p.name
                          };
                        })
                    : []
                    }
                    selectLabel='Projetos'
                    placeholder='Selecione o Projeto'
                  />
                  {errors.project && (
                    errors.project.map((error: string, i: number) => (
                      <div key={i}>
                        <p className="forms-error" key={i}>{error}</p> 
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className='mt-2'>
                  <SelectSkeleton
                    selectionText='Selecione o Projeto'
                  />
                </div>
              )
            }
          </div>

          <div>
            <Label htmlFor="price" className='forms-label'>Valor</Label>
            <Input
              placeholder='20,50'
              name='price'
              id='price'
              type='number'
              step='any'
              className='forms-input'
            />
            {errors.price && (
              errors.price.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>
          
          <div>
            <Label htmlFor="expireDate" className='forms-label'>Data de Vencimento</Label>
            <Input
              name='expireDate'
              id='expireDate'
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
            {errors.expireDate && (
              errors.expireDate.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>
          
          <div>
            <Label htmlFor="paymentMethod" className='forms-label'>Forma de Pagamento</Label>
            <SelectInput 
              name="paymentMethod"
              items={paymentMethods}
              selectLabel='Formas de Pagamento'
              placeholder='Selecione a Forma de Pagamento'
            />
            {errors.paymentMethod && (
              errors.paymentMethod.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>

          <div>
            <Label htmlFor="paymentStatus" className='forms-label'>Status do Pagamento</Label>
            <SelectInput 
              name="paymentStatus"
              items={paymentStatus}
              selectLabel='Status do Pagamento'
              placeholder='Selecione o Status do Pagamento'
            />
            {errors.paymentStatus && (
              errors.paymentStatus.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>

          <div>
            <Label htmlFor="description" className='forms-label'>Descrição</Label>
            <Textarea
              placeholder='Descrição da Conta'
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

export default BillsToRecieveForm