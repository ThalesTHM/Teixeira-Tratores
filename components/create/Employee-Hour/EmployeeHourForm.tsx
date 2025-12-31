"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SelectInput } from '@/components/utils/SelectInput';
import SelectSkeleton from '@/components/utils/SelectSkeleton';
//import { createEmployeeHour } from '@/lib/employee-hour/create/actions';
import { employeeHourFormSchema } from '@/lib/validation';
import React, { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner';
import { z } from 'zod';

type Project = {
  id: string;
  createdAt: number;
  name: string;
  slug: string;
}

const EmployeeHourForm = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingError, setLoadingError] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length >= 1) {
      // Limit first digit of hours (0-2)
      if (parseInt(value[0]) > 2) {
        value = '2' + value.slice(1);
      }
    }
    
    if (value.length >= 2) {
      // If first digit is 2, second digit can only be 0-3 (for 20-23)
      if (value[0] === '2' && parseInt(value[1]) > 3) {
        value = value[0] + '3' + value.slice(2);
      }
      // If first digit is 0 or 1, second digit can be 0-9
    }
    
    if (value.length >= 3) {
      // Limit first digit of minutes (0-5)
      if (parseInt(value[2]) > 5) {
        value = value.slice(0, 2) + '5' + value.slice(3);
      }
      value = value.slice(0, 2) + ':' + value.slice(2, 4);
    }
    
    // Limit to maximum 4 digits (HHMM)
    if (value.replace(':', '').length > 4) {
      return;
    }
    
    event.target.value = value;
  };

  useEffect(() => {
    setIsLoaded(false);
    
    // Subscribe to projects list updates
    const projectsEventSource = new EventSource('/api/entities/projeto');
    projectsEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) {
          const validProjects = data.filter((p: any) => p.name && p.createdAt);
          setProjects(validProjects);
          setLoadingError(false);
        } else {
          setProjects([]);
          setLoadingError(true);
        }
        setIsLoaded(true);
      } catch (e) {
        console.error('Error processing projects data:', e);
        setProjects([]);
        setLoadingError(true);
        setIsLoaded(true);
      }
    };

    // Error handling for connection
    projectsEventSource.onerror = () => {
      console.error("SSE connection error for projects");
      setLoadingError(true);
      setIsLoaded(true);
      projectsEventSource.close();
    };

    // Cleanup function
    return () => {
      projectsEventSource.close();
    };
  }, [])

  const handleSubmit = async (prevState: any, formData: FormData) => {
    setErrors({});
    
    const formValues = {
      date: formData.get('date') as string,
      startingHour: formData.get('startingHour') as string,
      totalTime: formData.get('totalTime') as string,
      project: formData.get('project') as string,
      description: formData.get('description') as string,
    }

    try{
      await employeeHourFormSchema.parseAsync(formValues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        console.log(fieldErrors);
        
        setErrors(fieldErrors as unknown as Record<string, string[]>);
        setImagePreview(null); // Clear image preview on validation error

        toast.error("Erro ao Registrar as Horas");

        return{
          ...prevState,
          error: "Invalid Input",
          status: "ERROR"  
        }
      }
    }

    const res = {success: "", error: ""}//await createEmployeeHour(formData);

    if(!res.success){
      toast.error("Erro ao Registrar as Horas");
      setImagePreview(null); // Clear image preview on submission error

      console.log(res.error);
     
      return{
        ...prevState,
        error: res.error,
        status: "ERROR"  
      }
    } 
    
    toast.success("Horas Registradas com Sucesso!")

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
            <Label htmlFor="date" className='forms-label'>Data</Label>
            <Input
              name='date'
              id='date'
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
            {errors.date && (
              errors.date.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p>
                </div>
              ))
            )}
          </div>

          <div>
            <Label htmlFor="startingHour" className='forms-label'>Hora de Início</Label>
            <Input
              placeholder='HH:MM (Ex: 08:00)'
              name='startingHour'
              id='startingHour'
              className='forms-input'
              pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
              title="Digite a hora no formato HH:MM (ex: 08:00)"
              maxLength={5}
              onChange={handleTimeChange}
            />
            {errors.startingHour && (
              errors.startingHour.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p>
                </div>
              ))
            )}
          </div>
          
          <div>
            <Label htmlFor="totalTime" className='forms-label'>Tempo Total</Label>
            <Input
              placeholder='HH:MM (Ex: 08:30)'
              name='totalTime'
              id='totalTime'
              className='forms-input'
              pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
              title="Digite o tempo no formato HH:MM (ex: 08:30)"
              maxLength={5}
              onChange={handleTimeChange}
            />
            {errors.totalTime && (
              errors.totalTime.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p>
                </div>
              ))
            )}
          </div>

          <div className='flex flex-col gap-5'>
            <Label htmlFor='project' className='forms-label'>Projeto</Label> 
            {
              (isLoaded) ? (
              <div className='mt-[-10px]'>
                <SelectInput 
                  name="project"
                  items={
                    projects
                  ? projects
                      .slice()
                      .sort((a, b) => a.createdAt - b.createdAt)
                      .map((p) => ({
                        key: p.name,
                        value: p.name
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
              <div className='mt-[-10px]'>
                <SelectSkeleton
                  selectionText='Selecione o Projeto'
                />
              </div>
            )
          }
          </div>
          
          <div>
            <Label htmlFor="description" className='forms-label'>Descrição</Label>
            <Textarea
              placeholder='Descrição das atividades realizadas'
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

          <div>
            <Label htmlFor="hourMeter" className='forms-label'>Horímetro</Label>
            <Input
              name='hourMeter'
              id='hourMeter'
              className='forms-input'
              type='file'
              accept='image/*'
              onChange={handleImageChange}
            />
            {errors.hourMeter && (
              errors.hourMeter.map((error: string, i: number) => (
                <div key={i}>
                  <p className="forms-error" key={i}>{error}</p>
                </div>
              ))
            )}
            
            {imagePreview && (
              <div className="mt-4">
                <Label className='forms-label'>Preview da Imagem:</Label>
                <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                  <img 
                    src={imagePreview} 
                    alt="Preview do horímetro" 
                    className="max-w-full h-auto max-h-64 rounded object-contain mx-auto block"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center w-full">
            <Button type='submit' className='forms-button' disabled={isPending || !isLoaded}>
              {isPending ? "Registrando..." : "Registrar Horas"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EmployeeHourForm
