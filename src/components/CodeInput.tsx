import React, { useState, useEffect } from 'react';
import { Upload, Code, Image as ImageIcon, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CodeInputProps {
  onProcess: (content: string | { mimeType: string; data: string }, isImage: boolean) => void;
  isLoading: boolean;
}

export default function CodeInput({ onProcess, isLoading }: CodeInputProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<'text' | 'image'>('text');

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setFile(blob);
            setMode('image');
            const reader = new FileReader();
            reader.onloadend = () => {
              setPreview(reader.result as string);
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen.');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'text' && text.trim()) {
      onProcess(text, false);
    } else if (mode === 'image' && file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        onProcess({ mimeType: file.type, data: base64Data }, true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;
      setText(value.substring(0, start) + '    ' + value.substring(end));
      setTimeout(() => {
        if (e.currentTarget) {
          e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
        <button
          onClick={() => setMode('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            mode === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Code size={18} />
          <span>Texto / Enunciado</span>
        </button>
        <button
          onClick={() => setMode('image')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            mode === 'image' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          <ImageIcon size={18} />
          <span>Imagen / Screenshot</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'text' ? (
          <motion.div
            key="text-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pega tu código Python o el enunciado del ejercicio aquí..."
              className="w-full h-64 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm resize-none"
            />
          </motion.div>
        ) : (
          <motion.div
            key="image-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            {!preview ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl bg-white hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-gray-400 group-hover:text-indigo-500 mb-4 transition-colors" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Haz clic para subir</span> o arrastra una imagen
                  </p>
                  <p className="text-xs text-gray-400 font-mono tracking-tight uppercase">O pega una imagen (Ctrl+V)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 h-64 bg-gray-50">
                <img src={preview} alt="Vista previa" className="w-full h-full object-contain" />
                <button
                  onClick={removeFile}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleSubmit}
        disabled={isLoading || (mode === 'text' ? !text.trim() : !file)}
        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all shadow-lg ${
          isLoading || (mode === 'text' ? !text.trim() : !file)
            ? 'bg-slate-300 cursor-not-allowed shadow-none'
            : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Procesando...</span>
          </div>
        ) : (
          <>
            <Send size={20} />
            <span>Explicar Código</span>
          </>
        )}
      </button>
    </div>
  );
}
