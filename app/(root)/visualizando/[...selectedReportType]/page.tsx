import ClientForm from '@/components/view/Client/ClientForm';
import ProjectForm from '@/components/view/Project/ProjectForm';
import SupplierForm from '@/components/view/Supplier/SupplierForm';
import BillsToPayForm from '@/components/view/Bill/Pay/BillsToPayForm';
import BillsToRecieveForm from '@/components/view/Bill/Recieve/BillsToRecieveForm';
import React from 'react';
import EmployeeForm from '@/components/view/Employee/EmployeeForm';
import EmailInviteForm from '@/components/view/EmailInvite/EmailInviteForm';

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
        content = <EmployeeForm slug={selectedReportType[1]} />;
      } else {
        content = <div>Slug do funcionário não informado.</div>;
      }
      break;
    case 'conta':
      if (selectedReportType[1] === 'conta-a-pagar') {
        content = <BillsToPayForm slug={selectedReportType[2]} />;
        break;
      } else if (selectedReportType[1] === 'conta-a-receber') {
        content = <BillsToRecieveForm slug={selectedReportType[2]} />;
        break;
      } else {
        content = <div>Slug da conta não informado.</div>;
        break;
      }
    case 'convite':
      content = <EmailInviteForm slug={selectedReportType[1] || ""} />;
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