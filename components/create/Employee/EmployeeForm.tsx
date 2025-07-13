"use client";

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaskedInput } from '@/components/utils/MaskedInput'
import { SelectInput } from '@/components/utils/SelectInput'
import { createEmployee } from '@/lib/employee/create/actions';
import { employeeFormSchema } from '@/lib/validation';
import React, { useActionState } from 'react'
import { toast } from 'sonner';
import { z } from 'zod';

const positions = [
  { key: 'admin', value: 'Administrador' },
  { key: 'manager', value: 'Gerente' },
  { key: 'employee', value: 'Empregado' }
]
const EmployeeForm = () => {
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});

  const handleSubmit = async (prevState: any, formData: FormData) => {
    setErrors({});

    const formValues = {
      name: formData.get('name'),
      email: formData.get('email'),
      position: formData.get('position'),
      pnumber: formData.get('pnumber'),
      cpf: formData.get('cpf'),
      address: formData.get('address')
    }

    console.log(formValues);
    console.log(formValues.pnumber);
    
    try {
      await employeeFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        
        setErrors(fieldErrors as unknown as Record<string, string[]>);

        toast.error("Erro ao Cadastrar o Funcionário");

        return {
          ...prevState,
          error: fieldErrors,
          status: "ERROR"
        }
      }
    }

    const res = await createEmployee(formData);
    console.log(res);

    if (!res.success) {
      toast.error("Erro ao Cadastrar o Funcionário");

      return {
        ...prevState,
        error: res.error,
        status: "ERROR"
      }
    }

    toast.success("Funcionário Cadastrado com Sucesso!");

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
      <div className="p-5 w-1/3 h-1/2 mt-5">
        <form className='flex flex-col gap-5' action={formAction}>
          <div>
            <Label htmlFor="name" className='forms-label'>Nome</Label>
            <Input
              type="text"
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
            <Label htmlFor="email" className='forms-label'>E-mail</Label>
            <Input
              type="email"
              name="email"
              placeholder='email@email.com ➡️ Esse é o E-mail do Cadastro'
              id="email"
              className='forms-input'
            />
            {errors.email && (
              errors.email.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>

          <div>
            <Label htmlFor="position" className='forms-label'>Cargo</Label>
            <SelectInput
              placeholder='Cargo do Funcionário'
              name='position'
              items={positions}
              selectLabel='Cargos'
            />
            {errors.position && (
              errors.position.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>

          <div>
            <Label htmlFor="pnumber" className='forms-label'>Número de Telefone</Label>
            <MaskedInput
              mask='(00) 0 0000-0000'
              placeholder='(12) 3 4567-8910'
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
            <Label htmlFor="cpf" className='forms-label'>CPF</Label>
            <MaskedInput
              mask='000.000.000-00'
              placeholder='123.456.789-01'
              name='cpf'
              id='cpf'
              className='forms-input'
            />
            {errors.cpf && (
              errors.cpf.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p> 
                </div>
              ))
            )}
          </div>

          <div>
            <Label htmlFor="address" className='forms-label'>Endereço</Label>
            <Input
              type="text"
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

          <Button type="submit" className='forms-button'>Cadastrar</Button>
        </form>
      </div>
    </div>
  )
}

export default EmployeeForm