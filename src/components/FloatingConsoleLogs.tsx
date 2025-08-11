import { useEffect, useRef, useState } from "react";

export function FloatingConsoleLogs() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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
    if (isOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-black bg-opacity-80 text-white shadow-lg hover:bg-opacity-90 transition"
        title="View Logs"
      >
        📝
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
              <span className="font-bold text-lg">Logs</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                ✖
              </button>
            </div>

            {/* Logs Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-xs">
              {logs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap break-words">
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
