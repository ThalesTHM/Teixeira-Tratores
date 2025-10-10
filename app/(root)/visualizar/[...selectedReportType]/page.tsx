"use client"

import React, { use, useEffect, useState } from 'react'
import GenericList from '@/components/list/genericList'

const SelectReportItem = ({ params }: { params: Promise<{ selectedReportType: string[] }> }) => {
  const { selectedReportType } = use(params);
  const [items, setItems] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [unknownForm, setUnknownForm] = useState<string | undefined>();

  useEffect(() => {
    setLoading(true);

    const eventSource = new EventSource("/api/entities/" + selectedReportType[0] + (selectedReportType[1] ? "/" + selectedReportType[1] : "") + "/");

    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      setItems(parsed);
      setLoading(false)
    };

    eventSource.onerror = (event) => {
      console.log("SSE error:", event);
      setError("SSE error");
      eventSource.close();
    };

    const handleBeforeUnload = () => {
      console.log("Fechando essa porra aqui");
      eventSource.close();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      eventSource.close();
    };

  }, [])

  return (
    <div className="w-full flex flex-col items-center justify-center mt-8">
      {!unknownForm ? (
        <GenericList 
        listTitle={selectedReportType[0] + (selectedReportType[1] ? "/" + selectedReportType[1] : "")}
        items={items}
        loading={loading}
        error={error}
      />
      ) : (
        <div>{unknownForm}</div>
      )}
    </div>
  )
}

export default SelectReportItem