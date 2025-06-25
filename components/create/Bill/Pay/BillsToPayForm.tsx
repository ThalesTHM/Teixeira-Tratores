"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SelectInput } from '@/components/utils/SelectInput';
import { createSupplier } from '@/lib/supplier/create/actions';
import { billsToPayFormSchema, supplierFormSchema } from '@/lib/validation';
import React, { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner';
import { z } from 'zod';
import { db } from '@/firebase/firebase';
import { ref, onValue, off } from 'firebase/database';
import { createBillToPay } from '@/lib/bill/pay/create/actions';
import SelectSkeleton from '@/components/utils/SelectSkeleton';

type Supplier = {
  id: string;
  createdAt: number;
  name: string;
}

const BillsToPayForm = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [haveSupplier, setHaveSupplier] = useState<boolean>(false);

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>();
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
    setIsLoaded(false);

    const suppliersRef = ref(db, 'suppliers');

    const unsubscribe = onValue(suppliersRef, (snapshot) => {
      const data = snapshot.val() as
      | Record<string, { name: string; createdAt: number }>
      | null;

      console.log("In real time data: ", data);
      
      if(data){
        const suppliersArray: Supplier[] = Object.entries(data).map(
        ([id, raw]) => ({
          id,
          name: raw.name,
          createdAt: raw.createdAt
        }))

        setSuppliers(suppliersArray);
      } else {
        console.log("No suppliers found.");
        setSuppliers([]);
      }
      
      setLoadingError(false);
      setIsLoaded(true);
    }, (databaseError) => {
      console.error("Error fetching suppliers:", databaseError);
      toast.error("Erro no Banco de Dados.");
      setLoadingError(true);
      setSuppliers([]);
      setIsLoaded(false);
    })

    return () => {
      console.log("Detaching Realtime Database listener for /suppliers");
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
      haveSupplier: Boolean(formData.get('haveSupplier')),
      supplier: formData.get('supplier'),
      description: formData.get('description')
    }
    
    try{
      await billsToPayFormSchema.parseAsync(formValues);
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
    
    const res = await createBillToPay(formData);

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
            <Label htmlFor="name" className='forms-label'>Nome</Label>
            <Input
              placeholder='Ex: Peças'
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

          <div className='flex flex-row gap-5'>
            <Label htmlFor='haveSupplier' className='forms-label'>Fornecedor</Label> 
            <Switch 
              className='mt-1'
              name='haveSupplier'
              onCheckedChange={(check) => setHaveSupplier(check)}
            />
          </div>

          {
            haveSupplier && (
              (isLoaded) ? (
              <div>
                <SelectInput 
                  name="supplier"
                  items={
                    suppliers
                  ? suppliers
                      .slice()                                   
                      .sort((a, b) => a.createdAt - b.createdAt)
                      .map((s) => ({
                        key: s.id,
                        value: s.name
                      }))
                  : []
                  }
                  selectLabel='Fornecedores'
                  placeholder='Selecione o Fornecedor'
                />
                {errors.supplier && (
                  errors.supplier.map((error: string, i: number) => (
                    <div key={i}>
                      <p className="forms-error" key={i}>{error}</p> 
                    </div>
                  ))
                )}
              </div>
            ) : (
              <SelectSkeleton
                selectionText='Selecione o Fornecedor'
              />
            )
            )
          }


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

export default BillsToPayForm