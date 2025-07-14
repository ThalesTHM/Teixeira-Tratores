import React from 'react'
import ClientList from '@/components/list/client/clientList'

const SelectReportItem = async ({ params }: { params: Promise<{ selectedReportType: Array<string> }> }) => {
  const { selectedReportType } = await params

  let listComponent

  switch (selectedReportType[0]) {
    case 'cliente':
      listComponent = <ClientList />
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