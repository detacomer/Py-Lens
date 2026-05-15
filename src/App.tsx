import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, AlertCircle, RefreshCw } from 'lucide-react';
import CodeInput from './components/CodeInput';
import ExplanationDisplay from './components/ExplanationDisplay';
import { explainPythonCode, ExplanationResponse } from './services/geminiService';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplanationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessCode = async (
    content: string | { mimeType: string; data: string },
    isImage: boolean
  ) => {
    setLoading(true);
    setError(null);
    try {
      const explanation = await explainPythonCode(content, isImage);
      setResult(explanation);
    } catch (err: any) {
      console.error(err);
      setError('Hubo un problema al procesar el código. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">Py</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">PythonLens <span className="text-slate-400 font-normal">| Explicación de Código</span></h1>
        </div>
        {result && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
            >
              Cerrar Editor
            </button>
            <button
              onClick={() => handleReset()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium shadow-sm transition-all active:scale-95"
            >
              Nueva Consulta
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 relative overflow-auto">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-6"
            >
              <div className="w-full max-w-4xl space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    Domina Python <span className="text-indigo-600">Línea por Línea</span>
                  </h2>
                  <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                    Analiza código desde texto o imágenes y obtén explicaciones lógicas instantáneas con IA.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none -m-10" />
                  <CodeInput onProcess={handleProcessCode} isLoading={loading} />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 justify-center">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`result-display-${result.code.length}-${result.explanations.length}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <ExplanationDisplay 
                data={result} 
                onReset={handleReset} 
                onRefresh={(newCode) => handleProcessCode(newCode, false)}
                isRefreshing={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-12 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-20">
        <div className="flex space-x-8">
          <div className="flex items-center text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            Transcriptor OCR Activo
          </div>
          <div className="flex items-center text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
            Explicación Nivel: Principiante
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono tracking-widest">
          [SYSTEM READY] 100% PARSED
        </div>
      </footer>
    </div>
  );
}
