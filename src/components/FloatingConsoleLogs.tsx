import { useEffect, useRef, useState } from "react";

export function FloatingConsoleLogs() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep original console.log
    const originalLog = console.log;

    console.log = (...args: any[]) => {
      const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ");
      setLogs((prev) => [...prev, message]);
      originalLog.apply(console, args); // still output to browser console
    };

    return () => {
      console.log = originalLog; // restore on unmount
    };
  }, []);

  useEffect(() => {
    // Auto scroll to latest log
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="fixed bottom-4 right-4 w-72 max-h-64 bg-black bg-opacity-80 text-white text-xs rounded-lg shadow-lg flex flex-col overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-900 p-2 border-b border-gray-700">
        <span className="font-bold">Logs</span>
        <button className="text-gray-400 hover:text-white" onClick={() => setIsVisible(!isVisible)}>
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>

      {/* Body */}
      {isVisible && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="whitespace-pre-wrap break-words">
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
