import React from 'react'

const page = async ({ params }: { params: Promise<{ selectedReportType: Array<string> }>}) => {
  const { selectedReportType } = await params
  
  return (
    <div>{selectedReportType.map((item: string, i: number) => item + " ")}</div>
  )
}

export default page