"use client";

import { useEffect, useState } from "react";

type DataItem = {
  [key: string]: any;
};

export default function LiveData() {
  const [data, setData] = useState<DataItem[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/entities/convite/32ytzkeRD1jTNEJnBeZRd-FX_LUQuRW81fDoDxIWfkA-tHp2MX-H2x8tZ6X_TlG-M-iG9vneSxTz40JgpLCtJqT");

    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
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