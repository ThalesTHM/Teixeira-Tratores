"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaskedInput } from '@/components/utils/MaskedInput';
import { createClient } from '@/lib/client/create/actions';
import { createSupplier } from '@/lib/supplier/create/actions';
import { supplierFormSchema } from '@/lib/validation';
import React, { useActionState, useState } from 'react'
import { toast } from 'sonner';
import { set, z } from 'zod';

const SupplierForm = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [description, setDescription] = useState("")

  const handleSubmit = async (prevState: any, formData: FormData) => {
    setErrors({});
    const formValues = {
      name: formData.get('name'),
      cnpj: formData.get('cnpj'),
      address: formData.get('address'),
      pnumber: formData.get('pnumber'),
      description: formData.get('description')
    }

    
    try{
      await supplierFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        
        setErrors(fieldErrors as unknown as Record<string, string[]>);

        console.log(fieldErrors);
        

        toast.error("Erro ao Cadastrar o Fornecedor")

        return {
          ...prevState,
          error: fieldErrors,
          status: "ERROR"
        }
      }
    }

    const res = await createSupplier(formData);

    if(!res.success){
     toast.error("Erro ao Cadastrar o Fornecedor");
     console.log(res.error);

      return{
        ...prevState,
        error: res.error,
        status: "ERROR"  
      }
    } 
    
    toast.success("Fornecedor Cadastrado com Sucesso!")
    
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
              placeholder='Nome'
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
            <Label htmlFor="cnpj" className='forms-label'>CNPJ</Label>
            <MaskedInput
              mask="00.000.000/0000-00"
              placeholder='12.345.678/9101-11'
              name='cnpj'
              id='cnpj'
              className='forms-input'
            />
            {errors.cnpj && (
              errors.cnpj.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>
          
          <div>
            <Label htmlFor="address" className='forms-label'>Endereço</Label>
            <Input
              placeholder='Rua Exemplo, 123'
              name='address'
              id='address'
              className='forms-input'
            />
            {errors.address && (
              errors.address.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>
          
          <div>
            <Label htmlFor="pnumber" className='forms-label'>Telefone</Label>
            <MaskedInput
              mask="(00) 0 0000-0000"
              placeholder='(12) 3 4567-8901'
              name='pnumber'
              id='pnumber'
              className='forms-input'
            />
            {errors.pnumber && (
              errors.pnumber.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>

          <div>
            <Label htmlFor="description" className='forms-label'>Descrição</Label>
            <Textarea
              placeholder='Descrição do fornecedor'
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
            <Button type='submit' className='forms-button' disabled={isPending}>
              {isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SupplierForm