import React from 'react'
import ClientList from '@/components/list/client/clientList'
import SupplierList from '@/components/list/supplier/supplierList'
import ProjectList from '@/components/list/project/projectList'

const SelectReportItem = async ({ params }: { params: Promise<{ selectedReportType: Array<string> }> }) => {
  const { selectedReportType } = await params

  let listComponent

  switch (selectedReportType[0]) {
    case 'cliente':
      listComponent = <ClientList />
      break
    case 'fornecedor':
      listComponent = <SupplierList />
      break
    case 'projeto':
      listComponent = <ProjectList />
      break
    // Add other cases for different list components as you create them
    default:
      listComponent = <div>Tipo de relatório desconhecido.</div>
  }

  return (
    <div className="w-full flex flex-col items-center justify-center mt-8">
      {listComponent}
    </div>
  )
}

export default SelectReportItem