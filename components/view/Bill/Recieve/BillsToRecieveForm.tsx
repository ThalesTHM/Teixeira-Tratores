"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getBillToReceiveBySlug } from '@/lib/bill/recieve/view/actions';
import { editBillToReceive } from '@/lib/bill/recieve/edit/actions';
import { removeBillToReceive } from '@/lib/bill/recieve/remove/actions';
import { useActionState } from 'react';
import { billsToRecieveFormSchema } from '@/lib/bill/recieve/create/validation';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SelectInput } from '@/components/utils/SelectInput';
import { viewProjects, getProjectBySlug } from '@/lib/project/view/actions';

interface BillsToRecieveFormProps {
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

const BillsToRecieveForm = ({ slug }: BillsToRecieveFormProps): React.ReactElement => {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState<{ key: string, value: string }[]>([]);
  const router = useRouter();

  const handleEdit = async (prevState: any, formData: FormData) => {
    setErrors({});
    const previousProjectValue = bill?.project;
    const formValues = {
      name: formData.get('name'),
      price: Number(formData.get('price')),
      expireDate: (new Date(formData.get('expireDate') as string)).getTime(),
      paymentMethod: formData.get('paymentMethod'),
      paymentStatus: formData.get('paymentStatus'),
      project: formData.get('project'),
      description: formData.get('description'),
    };
    try {
      await billsToRecieveFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setErrors(fieldErrors as Record<string, string[]>);
        // Reset project to previous value after validation error
        setBill({ ...bill, project: previousProjectValue ?? '' });
        if (previousProjectValue) {
          const projectRes = await getProjectBySlug(previousProjectValue);
          if (projectRes.success && projectRes.project?.name) setProjectName(projectRes.project.name);
          else setProjectName('');
        } else {
          setProjectName('');
        }
        toast.error('Erro ao editar conta a receber');
        return prevState;
      }
    }
    if (!window.confirm('Tem certeza que deseja salvar as alterações desta conta a receber?')) {
      setErrors({});
      setBill({ ...bill, project: previousProjectValue ?? '' });
      if (previousProjectValue) {
        const projectRes = await getProjectBySlug(previousProjectValue);
        if (projectRes.success && projectRes.project?.name) setProjectName(projectRes.project.name);
        else setProjectName('');
      } else {
        setProjectName('');
      }
      return prevState;
    }
    const res = await editBillToReceive(slug, formValues);
    if (!res.success) {
      toast.error(res.error || 'Erro ao editar conta a receber');
      return prevState;
    }
    toast.success('Conta a receber editada com sucesso!');
    setBill({ ...bill, ...formValues });
    // Update project name after edit
    if (formValues.project) {
      const projectRes = await getProjectBySlug(formValues.project as string);
      if (projectRes.success && projectRes.project?.name) setProjectName(projectRes.project.name);
      else setProjectName('');
    } else {
      setProjectName('');
    }
    setEditMode(false);
    setErrors({});
    return prevState;
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta a receber?')) {
      return;
    }
    const res = await removeBillToReceive(slug);
    if (!res.success) {
      toast.error(res.error || 'Erro ao excluir conta a receber');
      return;
    }
    toast.success('Conta a receber excluída com sucesso!');
    router.push('/visualizar/conta/conta-a-receber');
  };

  const [formState, formAction, isPending] = useActionState(handleEdit, {
    error: '',
    status: 'INITIAL',
  });

  useEffect(() => {
    setLoading(true);

    // Subscribe to bill updates
    const billEventSource = new EventSource(`/api/entities/conta/conta-a-receber/${slug}`);
    billEventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) {
          setBill(data);
          setError('');
          // Fetch project name if bill has a project
          if (data.project) {
            const projectRes = await getProjectBySlug(data.project);
            if (projectRes?.project?.name) {
              setProjectName(projectRes.project.name);
            }
          }
          setLoading(false); // Only set loading to false after we have the data
        } else {
          setError('Erro ao buscar conta a receber');
          setLoading(false);
        }
      } catch (e) {
        console.error('Error processing bill data:', e);
        setError('Erro ao processar dados da conta');
        setLoading(false);
      }
    };

    // Subscribe to projects list updates
    const projectsEventSource = new EventSource('/api/entities/projeto');
    projectsEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) {
          setProjects(data.map((p: { slug: string; name: string }) => ({ 
            key: p.slug, 
            value: p.name || '' 
          })));
        } else {
          setProjects([]);
        }
      } catch (e) {
        console.error('Error processing projects data:', e);
      }
    };

    // Error handling for both connections
    billEventSource.onerror = () => {
      console.error("SSE connection error for bill");
      setError('Erro na conexão com o servidor');
      setLoading(false);
      billEventSource.close();
    };

    projectsEventSource.onerror = () => {
      console.error("SSE connection error for projects");
      projectsEventSource.close();
    };

    // Cleanup function
    return () => {
      billEventSource.close();
      projectsEventSource.close();
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="forms-error">{error}</p>
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
                  name="project"
                  items={projects}
                  selectLabel="Projeto"
                  placeholder="Selecione o Projeto"
                  defaultValue={bill.project ?? ''}
                />
                {errors.project && errors.project.map((error, i) => (
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
                  <p>Projeto: {
                    bill.project
                      ? projectName
                        ? projectName
                        : 'Projeto Desconhecido'
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

export default BillsToRecieveForm;