"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getBillsToPayBySlug } from '@/lib/bill/pay/view/actions';
import { editBillToPay } from '@/lib/bill/pay/edit/actions';
import { removeBillToPay } from '@/lib/bill/pay/remove/actions';
import { useActionState } from 'react';
import { billsToPayFormSchema } from '@/lib/bill/pay/create/validation';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SelectInput } from '@/components/utils/SelectInput';

import { viewSuppliers, getSupplierById } from '@/lib/supplier/view/actions';

interface BillsToPayFormProps {
  slug: string;
}

const paymentMethodOptions = [
  { key: 'PIX', value: 'PIX' },
  { key: 'CC', value: 'Cartão de Crédito' },
  { key: 'CB', value: 'Cartão de Débito' },
  { key: 'DIN', value: 'Dinheiro' },
  { key: 'BOL', value: 'Boleto' },
  { key: 'TRF', value: 'Transferência' },
];
const paymentStatusOptions = [
  { key: 'P', value: 'Pago' },
  { key: 'PEN', value: 'Pendente' },
  { key: 'ATR', value: 'Atrasado' },
];

const BillsToPayForm: React.FC<BillsToPayFormProps> = ({ slug }) => {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [supplierName, setSupplierName] = useState('');
  const [suppliers, setSuppliers] = useState<{ key: string, value: string }[]>([]);
  const [previousSupplier, setPreviousSupplier] = useState<string | null>(null);
  const router = useRouter();

  const handleEdit = async (prevState: any, formData: FormData) => {
    setErrors({});
    const previousSupplierValue = bill?.supplier;
    const formValues = {
      name: formData.get('name'),
      price: Number(formData.get('price')),
      expireDate: (new Date(formData.get('expireDate') as string)).getTime(),
      paymentMethod: formData.get('paymentMethod'),
      paymentStatus: formData.get('paymentStatus'),
      supplier: formData.get('supplier'),
      description: formData.get('description'),
    };
    try {
      await billsToPayFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as Record<string, string[]>);
        // Reset supplier to previous value after validation error
        setBill({ ...bill, supplier: previousSupplierValue ?? '' });
        if (previousSupplierValue) {
          const supplierRes = await getSupplierById(previousSupplierValue);
          if (supplierRes.success && supplierRes.supplier?.name) setSupplierName(supplierRes.supplier.name);
          else setSupplierName('');
        } else {
          setSupplierName('');
        }
        toast.error('Erro Ao Editar Conta A Pagar');
        return prevState;
      }
    }
    if (!window.confirm('Tem Certeza Que Deseja Salvar As Alterações Desta Conta A Pagar?')) {
      // Clear errors when cancelling
      setErrors({});
      setBill({ ...bill, supplier: previousSupplierValue ?? '' });
      if (previousSupplierValue) {
        const supplierRes = await getSupplierById(previousSupplierValue);
        if (supplierRes.success && supplierRes.supplier?.name) setSupplierName(supplierRes.supplier.name);
        else setSupplierName('');
      } else {
        setSupplierName('');
      }
      return prevState;
    }
    const res = await editBillToPay(slug, formValues);
    if (!res.success) {
      toast.error(res.error || 'Erro Ao Editar Conta A Pagar');
      return prevState;
    }
    toast.success('Conta A Pagar Editada Com Sucesso!');
    setBill({ ...bill, ...formValues });
    // Update supplier name after edit
    if (formValues.supplier) {
      const supplierRes = await getSupplierById(formValues.supplier as string);
      if (supplierRes.success && supplierRes.supplier?.name) setSupplierName(supplierRes.supplier.name);
      else setSupplierName('');
    } else {
      setSupplierName('');
    }
    setEditMode(false);
    setErrors({}); // Clear errors after successful edit
    return prevState;
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem Certeza Que Deseja Excluir Esta Conta A Pagar?')) {
      return;
    }
    const res = await removeBillToPay(slug);
    if (!res.success) {
      toast.error(res.error || 'Erro Ao Excluir Conta A Pagar');
      return;
    }
    toast.success('Conta A Pagar Excluída Com Sucesso!');
    router.push('/visualizar/conta/conta-a-pagar');
  };

  const [formState, formAction, isPending] = useActionState(handleEdit, {
    error: '',
    status: 'INITIAL',
  });

  useEffect(() => {
    const fetchBillAndSuppliers = async () => {
      setLoading(true);
      // Fetch bill
      const res = await getBillsToPayBySlug(slug);
      if (res.success && res.bill) {
        setBill(res.bill);
        setError('');
        // Fetch supplier name
        if (res.bill.supplier) {
          const supplierRes = await getSupplierById(res.bill.supplier);
          if (supplierRes.success && supplierRes.supplier?.name) setSupplierName(supplierRes.supplier.name);
          console.log(supplierRes);
        }
      } else {
        setError(res.error || 'Erro Ao Buscar Conta A Pagar');
      }
      // Fetch suppliers
      const suppliersRes = await viewSuppliers();
      if (suppliersRes.success && Array.isArray(suppliersRes.suppliers)) {
        setSuppliers(suppliersRes.suppliers.map(s => ({ key: s.id, value: s.name })));
      } else {
        setSuppliers([]);
      }
      setLoading(false);
    };
    fetchBillAndSuppliers();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="forms-error">{error || 'Conta A Pagar Não Encontrada.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
      <Card className="p-6 flex flex-col gap-4 shadow-lg">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {editMode ? (
              <>
                <input
                  className="forms-input text-xl font-semibold mb-2"
                  name="name"
                  defaultValue={bill.name}
                />
                {errors.name && errors.name.map((error, i) => (
                  <div key={i}><p className="forms-error">{error}</p></div>
                ))}
                <input
                  className="forms-input text-sm text-gray-500 mb-2"
                  name="price"
                  type="number"
                  defaultValue={bill.price}
                />
                {errors.price && errors.price.map((error, i) => (
                  <div key={i}><p className="forms-error">{error}</p></div>
                ))}
                <input
                  className="forms-input mb-2"
                  name="expireDate"
                  type="date"
                  defaultValue={bill.expireDate ? new Date(bill.expireDate).toISOString().split('T')[0] : ''}
                />
                {errors.expireDate && errors.expireDate.map((error, i) => (
                  <div key={i}><p className="forms-error">{error}</p></div>
                ))}
                <SelectInput
                  name="paymentMethod"
                  items={paymentMethodOptions}
                  selectLabel="Método de Pagamento"
                  placeholder="Selecione o Método"
                  defaultValue={bill.paymentMethod}
                />
                {errors.paymentMethod && errors.paymentMethod.map((error, i) => (
                  <div key={i}><p className="forms-error">{error}</p></div>
                ))}
                <SelectInput
                  name="paymentStatus"
                  items={paymentStatusOptions}
                  selectLabel="Status"
                  placeholder="Selecione o Status"
                  defaultValue={bill.paymentStatus}
                />
                {errors.paymentStatus && errors.paymentStatus.map((error, i) => (
                  <div key={i}><p className="forms-error">{error}</p></div>
                ))}
                <SelectInput
                  name="supplier"
                  items={suppliers}
                  selectLabel="Fornecedor"
                  placeholder="Selecione o Fornecedor"
                  defaultValue={bill.supplier ?? ''}
                />
                {errors.supplier && errors.supplier.map((error, i) => (
                  <div key={i}><p className="forms-error">{error}</p></div>
                ))}
              </>
            ) : (
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-xl font-semibold">{bill.name}</p>
                  <p className="text-sm text-gray-500">Valor: {bill.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="flex-1">
                  <p>Vencimento: {bill.expireDate ? new Date(bill.expireDate).toLocaleDateString() : '-'}</p>
                  <p>Método de Pagamento: {
                    paymentMethodOptions.find(opt => opt.key === bill.paymentMethod)?.value || bill.paymentMethod
                  }</p>
                  <p>Status: {
                    paymentStatusOptions.find(opt => opt.key === bill.paymentStatus)?.value || bill.paymentStatus
                  }</p>
                  <p>Fornecedor: {
                    bill.supplier
                      ? supplierName
                        ? supplierName
                        : 'Fornecedor Desconhecido'
                      : <p>Não Há</p>
                  }</p>
                </div>
              </div>
            )}
          </div>
          <div>
            <b>Descrição:</b>{' '}
            {editMode ? (
              <>
                <textarea
                  className="forms-input mt-1"
                  name="description"
                  defaultValue={bill.description || ''}
                />
                {errors.description && errors.description.map((error, i) => (
                  <div key={i}><p className="forms-error">{error}</p></div>
                ))}
              </>
            ) : (
              <span>{bill.description || '-'}</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Cadastrado em: {bill.createdAt ? new Date(bill.createdAt).toLocaleString() : '-'}
          </div>
          <div className="flex gap-2 mt-4">
            {editMode ? (
              <>
                <Button variant="outline" type="button" onClick={() => { setEditMode(false); setErrors({}); }}>
                  Cancelar
                </Button>
                <Button variant="default" type="submit" disabled={isPending}>
                  {isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <Button variant="outline" type="button" onClick={() => { setEditMode(true); setErrors({}); }}>
                Editar
              </Button>
            )}
            <Button variant="destructive" type="button" onClick={handleDelete}>Excluir</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default BillsToPayForm;