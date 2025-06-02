"use client";

import { useEffect, useState } from "react";

type DataItem = {
  id: string;
  active: boolean;
  [key: string]: any;
};

export default function LiveData() {
  const [data, setData] = useState<DataItem[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/stream-test");

    eventSource.onmessage = (event) => {
      const parsed: DataItem[] = JSON.parse(event.data);
      setData(parsed);
    };

    eventSource.onerror = (event) => {
      console.log("SSE error:", event);
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
    
  }, []);

  return (
    <div>
      <h2>Live Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}