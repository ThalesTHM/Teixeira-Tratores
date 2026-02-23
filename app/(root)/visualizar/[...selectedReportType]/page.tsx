"use client"

import React, { use, useEffect, useState, useRef } from 'react'
import GenericList from '@/components/list/genericList'

const SelectReportItem = ({ params }: { params: Promise<{ selectedReportType: string[] }> }) => {
  const { selectedReportType } = use(params);
  const [items, setItems] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [retryCount, setRetryCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const [unknownForm, setUnknownForm] = useState<string | undefined>();

  useEffect(() => {
    setLoading(true);

    const maxRetries = 3;

    const createEventSource = () => {
      setError(undefined);
      const url = "/api/entities/" + selectedReportType[0] + (selectedReportType[1] ? "/" + selectedReportType[1] : "") + "/";
      const eventSource = new EventSource(url);
      esRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setItems(parsed);
          setLoading(false);
          // reset retry count on successful message
          setRetryCount(0);
        } catch (e) {
          console.error('Error parsing SSE message:', e, event.data);
        }
      };

      eventSource.onerror = (evt) => {
        console.warn('SSE connection error, attempt:', retryCount, evt);
        // close this connection
        try { eventSource.close(); } catch (_) {}

        if (retryCount < maxRetries) {
          const next = retryCount + 1;
          setRetryCount(next);
          // exponential backoff
          const timeout = Math.min(3000 * next, 10000);
          retryTimerRef.current = window.setTimeout(() => {
            createEventSource();
          }, timeout) as unknown as number;
        } else {
          setError('Erro ao conectar ao servidor de lista.');
          setLoading(false);
        }
      };

      return eventSource;
    };

    createEventSource();

    const handleBeforeUnload = () => {
      if (esRef.current) try { esRef.current.close(); } catch (_) {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (esRef.current) try { esRef.current.close(); } catch (_) {}
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