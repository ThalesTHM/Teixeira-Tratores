import React from 'react'

const SelectReportItem = async ({ params }: { params: Promise<{ selectedReportType: Array<string> }> }) => {
  const { selectedReportType } = await params
  
  return (
    <div>{selectedReportType.map((item: string, index: number) => item + " ")}</div>
  )
}

export default SelectReportItem