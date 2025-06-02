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
import { auth, db } from '@/firebase/firebase';
import { ref, onValue, off } from 'firebase/database';
import SelectSkeleton from '@/components/utils/SelectSkeleton';
import { createBillToRecieve } from '@/lib/bill/recieve/actions';

type Supplier = {
  id: string;
  createdAt: number;
  name: string;
}

const BillsToRecieveForm = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [projects, setProjects] = useState<Supplier[]>();
  const [loadingError, setLoadingError] = useState<boolean>();

  const paymentMethods = [
    {
      key: 'PIX',
      value: 'PIX'
    },
    {
      key: 'CC',
      value: 'Cartão de Crédito'
    },
    {
      key: 'CB',
      value: 'Cartão de Débito'
    },
    {
      key: 'DIN',
      value: 'Dinheiro'
    },
  ]

  const paymentStatus = [
    {
      key: 'P',
      value: 'Pago'
    },
    {
      key: 'PEN',
      value: 'Pendente'
    }
  ]

  useEffect(() => {
    setIsLoaded(false)
    const projectsRef = ref(db, 'projects');

    const unsubscribe = onValue(projectsRef, (snapshot) => {

      const data = snapshot.val() as
      | Record<string, { name: string; createdAt: number }>
      | null;

      if(data){
        const projectsArray: Supplier[] = Object.entries(data).map(
        ([id, raw]) => ({
          id,
          name: raw.name,
          createdAt: raw.createdAt
        }))

        setProjects(projectsArray);
      } else {
        setProjects([]);
      }
      
      setLoadingError(false);
      setIsLoaded(true);
    }, (databaseError) => {
      console.error("Error fetching projects:", databaseError);
      toast.error("Erro no Banco de Dados.");
      setLoadingError(true);
      setProjects([]);
      setIsLoaded(false);
    })

    return () => {
      console.log("Detaching Realtime Database listener for /projects");
      unsubscribe();
    }
  }, [])
  

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
                        .sort((a, b) => a.createdAt - b.createdAt)
                        .map((s) => ({
                          key: s.id,
                          value: s.name
                        }))
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