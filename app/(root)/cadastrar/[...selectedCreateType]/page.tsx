import BillsToPayForm from '@/components/create/Bill/Pay/BillsToPayForm';
import BillsToReceive from '@/components/create/Bill/Receive/BillsToReceiveForm';
import ClientForm from '@/components/create/Client/ClientForm';
import EmployeeForm from '@/components/create/Employee/EmployeeForm';
import EmployeeHourForm from '@/components/create/Employee-Hour/EmployeeHourForm';
import EquipmentCostForm from '@/components/create/Equipment/Cost/EquipmentCostForm';
import EquipmentForm from '@/components/create/Equipment/EquipmentForm';
import MachineryCostForm from '@/components/create/Machinery/Cost/MachineryCostForm';
import MachineryForm from '@/components/create/Machinery/MachineryForm';
import ProjectForm from '@/components/create/Project/ProjectForm';
import SupplierForm from '@/components/create/Supplier/SupplierForm';
import TestSSE from '@/components/create/Tests/TestSSE';
import React from 'react'

const page = async ({ params }: { params: Promise<{ selectedCreateType: Array<string> }>}) => {
  const { selectedCreateType } = await params;
  console.log(selectedCreateType);
  
  let formComponent;

  switch (selectedCreateType[0]) {
    case 'cliente':
      formComponent = <ClientForm />;
      break;
    case 'projeto':
      formComponent = <ProjectForm />;
      break;
    case 'fornecedor':
      formComponent = <SupplierForm />;
      break;
    case 'funcionario':
      formComponent = <EmployeeForm />;
      break;
    case 'funcionario-horas':
      formComponent = <EmployeeHourForm />;
      break;
    case 'conta':
      switch (selectedCreateType[1]) {
        case 'conta-a-pagar':
          formComponent = <BillsToPayForm />;
          break;
        case 'conta-a-receber':
          formComponent = <BillsToReceive />;
          break;
        case 'equipamento':
          formComponent = <EquipmentCostForm />;
          break;
        case 'maquinario':
          formComponent = <MachineryCostForm />;
          break;
        default:
          formComponent = <div>Unknown Form</div>;
      }
      break;
    case 'equipamento':
      formComponent = <EquipmentForm />;
      break;
    case 'maquinario':
      formComponent = <MachineryForm />;
      break;

    case 'TestSSE':
      formComponent = <TestSSE />;
      break;
    default:
      formComponent = <div>Unknown Form</div>;
  }

  return (
    <div>
        <h1 className="text-3xl">
          {formComponent}
        </h1>
    </div>
  )
}

export default page