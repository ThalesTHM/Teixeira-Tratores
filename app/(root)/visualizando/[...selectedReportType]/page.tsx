import ClientForm from '@/components/view/Client/ClientForm';
import ProjectForm from '@/components/view/Project/ProjectForm';
import SupplierForm from '@/components/view/Supplier/SupplierForm';
import React from 'react';

const page = async ({ params }: { params: Promise<{ selectedReportType: Array<string> }>}) => {
  const { selectedReportType } = await params;

  let content;

  switch (selectedReportType[0]) {
    case 'cliente':
      if (selectedReportType[1]) {
        content = <ClientForm slug={selectedReportType[1]} />;
      } else {
        content = <div>Slug do cliente não informado.</div>;
      }
      break;
    case 'projeto':
      if (selectedReportType[1]) {
        content = <ProjectForm slug={selectedReportType[1]} />;
      } else {
        content = <div>Slug do projeto não informado.</div>;
      }
      break;
    case 'fornecedor':
      if (selectedReportType[1]) {
        content = <SupplierForm slug={selectedReportType[1]} />;
      } else {
        content = <div>Slug do fornecedor não informado.</div>;
      }
      break;
    case 'funcionario':
      if (selectedReportType[1]) {
        const EmployeeForm = (await import('@/components/view/Employee/EmployeeForm')).default;
        content = <EmployeeForm slug={selectedReportType[1]} />;
      } else {
        content = <div>Slug do funcionário não informado.</div>;
      }
      break;
    default:
      content = <div>Tipo de visualização desconhecido.</div>;
  }

  return (
    <div className="w-full flex flex-col items-center justify-center mt-8">
      {content}
    </div>
  );
};

export default page;