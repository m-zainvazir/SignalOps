'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [inputText, setInputText] = useState('Due to severe weather in Shenzhen, factory output is halted. All shipments from Supplier X are delayed by 14 days.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [trace, setTrace] = useState<any[]>([]);
  const [stateBefore, setStateBefore] = useState<any[]>([]);
  const [stateAfter, setStateAfter] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const runPipeline = async () => {
    setIsProcessing(true);
    setTrace([]);
    setStateBefore([]);
    setStateAfter([]);
    setError(null);

    try {
      const response = await fetch('/api/agents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unstructuredText: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
         setError(data.error || 'Pipeline failed');
         if (data.trace) setTrace(data.trace);
         return;
      }

      setTrace(data.trace);
      setStateBefore(data.system_state.before);
      setStateAfter(data.system_state.after);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-2">Antigravity: Insight → Action</h1>
        <p className="text-gray-500">Autonomous Supply Chain Orchestration System</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Input and Traces */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold mb-4">1. Unstructured Data Input</h2>
             <textarea 
               className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder="Paste email, news, or report here..."
             />
             <button 
               onClick={runPipeline}
               disabled={isProcessing}
               className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
             >
               {isProcessing ? 'Agent Pipeline Running...' : 'Execute Agentic Workflow'}
             </button>
             {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 overflow-y-auto">
             <h2 className="text-xl font-bold mb-4">2. Agent Orchestration Trace</h2>
             {trace.length === 0 && <p className="text-gray-400 italic">Waiting for execution...</p>}
             <div className="space-y-4">
               {trace.map((step, idx) => (
                 <div key={idx} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500 text-sm">
                   <div className="flex justify-between items-center mb-2">
                     <span className="font-bold text-blue-800">{step.agent}</span>
                     <span className={`text-xs px-2 py-1 rounded-full ${step.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                       {step.status}
                     </span>
                   </div>
                   {step.details && <p className="text-gray-600 mb-2">{step.details}</p>}
                   {step.result && (
                      <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(step.result, null, 2)}
                      </pre>
                   )}
                 </div>
               ))}
             </div>
          </section>
        </div>

        {/* Right Column: System State */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold mb-4">3. System State (Inventory Database)</h2>
             
             {!stateBefore.length ? (
                <p className="text-gray-400 italic text-sm">Run the pipeline to simulate state changes.</p>
             ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Before Execution</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600">
                          <tr>
                            <th className="px-4 py-2">Product</th>
                            <th className="px-4 py-2">Stock</th>
                            <th className="px-4 py-2">Next Shipment</th>
                            <th className="px-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stateBefore.map((p: any) => (
                            <tr key={p.id} className="border-b">
                              <td className="px-4 py-2 font-medium">{p.name}</td>
                              <td className="px-4 py-2">{p.stock}</td>
                              <td className="px-4 py-2">{p.nextShipmentDate}</td>
                              <td className="px-4 py-2">{p.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">After Execution (Simulated Outcome)</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-left">
                        <thead className="bg-green-50 text-green-800">
                          <tr>
                            <th className="px-4 py-2">Product</th>
                            <th className="px-4 py-2">Stock</th>
                            <th className="px-4 py-2">Next Shipment</th>
                            <th className="px-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stateAfter.map((p: any) => {
                             const beforeItem = stateBefore.find((b: any) => b.id === p.id);
                             const changedStatus = p.status !== beforeItem?.status;
                             const changedDate = p.nextShipmentDate !== beforeItem?.nextShipmentDate;
                             return (
                              <tr key={p.id} className="border-b bg-green-50/30">
                                <td className="px-4 py-2 font-medium">{p.name}</td>
                                <td className="px-4 py-2">{p.stock}</td>
                                <td className={`px-4 py-2 ${changedDate ? 'text-red-600 font-bold' : ''}`}>{p.nextShipmentDate}</td>
                                <td className={`px-4 py-2 ${changedStatus ? 'text-red-600 font-bold' : ''}`}>{p.status}</td>
                              </tr>
                             );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
             )}
          </section>
        </div>

      </div>
    </div>
  );
}
