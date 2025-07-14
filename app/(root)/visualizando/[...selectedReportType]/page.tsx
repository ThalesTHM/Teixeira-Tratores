import ClientForm from '@/components/view/Client/ClientForm';
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
    // Add more cases for other types as needed
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