import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Terminal, ChevronRight, AlertTriangle, Lightbulb, Play, Copy, Check, RefreshCw, Wand2, Send, MessageSquare, Bot, User, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { ExplanationResponse, getCodeCompletion, applyCodeInstruction, askQuestionAboutCode, expandLineExplanation } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExplanationDisplayProps {
  data: ExplanationResponse;
  onReset: () => void;
  onRefresh: (newCode: string) => void;
  isRefreshing: boolean;
}

export default function ExplanationDisplay({ data, onRefresh, isRefreshing }: ExplanationDisplayProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [localCode, setLocalCode] = useState(data.code);
  const [ghostSuggestion, setGhostSuggestion] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [activeTab, setActiveTab] = useState<'tech' | 'script' | 'chat'>('script'); 
  const [isApplyingInstruction, setIsApplyingInstruction] = useState(false);
  
  const [expandedLines, setExpandedLines] = useState<Record<number, { text: string; loading: boolean }>>({});
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalCode(data.code);
    setGhostSuggestion("");
    setExpandedLines({});
  }, [data.code]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleExpandLine = async (idx: number, line: string, currentExplanation: string) => {
    if (expandedLines[idx]) {
      const next = { ...expandedLines };
      delete next[idx];
      setExpandedLines(next);
      return;
    }

    setExpandedLines(prev => ({ ...prev, [idx]: { text: "", loading: true } }));
    try {
      const text = await expandLineExplanation(localCode, line, currentExplanation);
      setExpandedLines(prev => ({ ...prev, [idx]: { text, loading: false } }));
    } catch (error) {
      setExpandedLines(prev => ({ ...prev, [idx]: { text: "Error al expandir la explicación.", loading: false } }));
    }
  };

  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalCode(val);

    if (e.target.selectionStart === val.length && val.trim().length > 0) {
      const lastChar = val.slice(-1);
      if (lastChar === '\n' || lastChar === ' ') {
        const suggestion = await getCodeCompletion(val);
        setGhostSuggestion(suggestion);
      } else {
        setGhostSuggestion("");
      }
    } else {
      setGhostSuggestion("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      if (ghostSuggestion) {
        e.preventDefault();
        const updated = localCode + ghostSuggestion;
        setLocalCode(updated);
        setGhostSuggestion("");
      } else {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        setLocalCode(localCode.substring(0, start) + '    ' + localCode.substring(end));
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          }
        }, 0);
      }
    }
  };

  const handleApplyInstruction = async (instruction: string) => {
    if (!instruction.trim() || isApplyingInstruction) return;
    
    setIsApplyingInstruction(true);
    try {
      const updatedCode = await applyCodeInstruction(localCode, instruction);
      setLocalCode(updatedCode);
      setCustomInstruction("");
      onRefresh(updatedCode);
    } catch (error) {
      console.error("Error applying instruction:", error);
    } finally {
      setIsApplyingInstruction(false);
    }
  };

  const handleSendQuestion = async () => {
    if (!chatInput.trim() || isAsking) return;

    const userMsg: Message = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsAsking(true);

    try {
      const response = await askQuestionAboutCode(localCode, chatInput);
      const assistantMsg: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Hubo un error al procesar tu duda." }]);
    } finally {
      setIsAsking(false);
    }
  };

  const hasChanges = localCode.trim() !== data.code.trim();

  const getFullReport = () => {
    let report = `REPORTE DE CÓDIGO PYTHON\n\n`;
    report += `OBJETIVO: ${data.objective}\n\n`;
    report += `CÓDIGO:\n${localCode}\n\n`;
    report += ` GUION DE EXPOSICIÓN:\n${data.presentationScript}\n\n`;
    report += `CONCLUSIÓN: ${data.conclusion}\n\n`;
    return report;
  };

  const renderScriptLine = (line: string) => {
    if (line.startsWith('###')) {
      return <h3 className="text-xl font-extrabold text-indigo-700 mt-8 mb-4 border-b-2 border-indigo-100 pb-2 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
        {line.replace('###', '').trim()}
      </h3>;
    }
    
    const parts = line.split(/(\[Pausa\])/g);
    return (
      <span className="leading-relaxed">
        {parts.map((part, i) => (
          part === '[Pausa]' 
            ? <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-tighter mx-1 align-middle border border-amber-200">Pausa</span>
            : part
        ))}
      </span>
    );
  };

  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
      <div className="w-1/2 bg-slate-900 flex flex-col border-r border-slate-200/10 relative">
        <div className="h-12 bg-slate-800/80 flex items-center px-6 justify-between border-b border-slate-700/50 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">Editor Interactivo</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRefresh(localCode)}
              disabled={isRefreshing || isApplyingInstruction}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                hasChanges ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Actualizar análisis con el código actual"
            >
              {isRefreshing ? <RefreshCw size={10} className="animate-spin" /> : <RefreshCw size={10} />}
              {hasChanges ? 'Sincronizar Cambios' : 'Refrescar Análisis'}
            </motion.button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(localCode, 'code')}
              className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors"
              title="Copiar código"
            >
              {copiedSection === 'code' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:24px_24px] opacity-10 pointer-events-none" />
          <div className="absolute inset-0 flex">
            <div className="w-12 bg-slate-900/50 border-r border-slate-800/30 flex flex-col pt-6 shrink-0 select-none overflow-hidden">
               {localCode.split('\n').map((_, i) => (
                 <div key={i} className="h-6 flex items-center justify-center text-[10px] font-mono text-slate-700">
                    {(i + 1).toString().padStart(2, '0')}
                 </div>
               ))}
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 p-6 pointer-events-none whitespace-pre-wrap break-all overflow-hidden text-sm leading-6 font-mono">
                  <span className="opacity-0">{localCode}</span>
                  <span className="text-emerald-500/40 italic">{ghostSuggestion}</span>
              </div>
              <textarea
                ref={textareaRef}
                value={localCode}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                readOnly={isApplyingInstruction}
                className="absolute inset-0 w-full h-full p-6 bg-transparent text-emerald-400 font-mono text-sm leading-6 outline-none resize-none break-all whitespace-pre-wrap overflow-y-auto custom-scrollbar"
                placeholder="Escribe tu código aquí..."
              />
              {isApplyingInstruction && (
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={32} className="text-indigo-500 animate-spin" />
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Aplicando Cambios...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-1/3 bg-black border-t border-slate-800 flex flex-col shrink-0 relative z-10">
          <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
             <div className="flex items-center gap-2">
                <Play size={10} className="text-emerald-500" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Simulated Console</span>
             </div>
          </div>
          <div className="flex-1 p-4 font-mono text-xs text-emerald-500/80 overflow-y-auto custom-scrollbar">
            {data.simulatedOutput || 'Ejecución exitosa sin salida de texto.'}
            <div className="w-1.5 h-3 bg-emerald-500 inline-block ml-1 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="w-1/2 bg-white flex flex-col relative font-sans">
        <div className="h-12 bg-slate-50 flex items-center px-4 border-b border-slate-200 shrink-0 relative z-10 gap-2">
          <div className="flex bg-slate-200/50 p-1 rounded-lg gap-1">
            <button
              onClick={() => setActiveTab('script')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeTab === 'script' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Guion Académico
            </button>
            <button
              onClick={() => setActiveTab('tech')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeTab === 'tech' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Análisis Técnico
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Resolver Dudas
            </button>
          </div>
          
          <div className="h-4 w-[1px] bg-slate-200 mx-2" />
          
          <button
            onClick={() => copyToClipboard(getFullReport(), 'report')}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ml-auto ${
              copiedSection === 'report' ? 'bg-emerald-500 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            {copiedSection === 'report' ? <Check size={12} /> : <Copy size={12} />}
            {copiedSection === 'report' ? 'Reporte Copiado' : 'Copiar Reporte'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'script' ? (
              <motion.div
                key="script-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 space-y-8"
              >
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Objetivo del Programa</h4>
                    <p className="text-slate-700 text-sm leading-relaxed font-medium">
                      {data.objective}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <Send size={120} className="text-slate-900" />
                    </div>
                    
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center border-b border-slate-100 pb-4">
                      Guion de Exposición Oral
                    </h2>
                    
                    <div className="space-y-4 text-slate-800 leading-relaxed text-base font-medium">
                      {data.presentationScript.split('\n').map((line, idx) => (
                        <div key={idx} className="relative">
                          {renderScriptLine(line)}
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Conclusión del Grupo</h4>
                      <p className="text-slate-600 text-sm leading-relaxed italic">
                        "{data.conclusion}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-8 opacity-50">
                   <div className="w-12 h-[1px] bg-slate-300" />
                   <div className="mx-4 text-[9px] font-mono text-slate-400 uppercase tracking-[0.4em]">Fin del Guion</div>
                   <div className="w-12 h-[1px] bg-slate-300" />
                </div>
              </motion.div>
            ) : activeTab === 'tech' ? (
              <motion.div
                key="tech-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="font-sans"
              >
                {data.explanations.map((item, idx) => {
                  const colors = ['text-indigo-600', 'text-blue-600', 'text-pink-600', 'text-amber-600', 'text-emerald-600'];
                  const colorClass = colors[idx % colors.length];
                  const isExpanded = !!expandedLines[idx];
                  const isLoading = expandedLines[idx]?.loading;

                  return (
                    <div
                      key={`explanation-${idx}`}
                      className={`border-b border-slate-100 flex flex-col px-6 py-4 group transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                      }`}
                    >
                       {!item.line.trim() ? (
                        <p className="text-[10px] text-slate-400 italic">Línea vacía</p>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className={`text-[9px] font-black uppercase tracking-wider ${colorClass} mb-1 leading-none`}>
                                {getCategory(item.line)}
                              </h4>
                              <p className="text-[13px] text-slate-700 leading-tight font-medium">
                                {item.explanation}
                              </p>
                            </div>
                            <button
                              onClick={() => handleExpandLine(idx, item.line, item.explanation)}
                              disabled={isLoading}
                              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                                isExpanded 
                                  ? 'bg-indigo-50 text-indigo-600' 
                                  : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50'
                              }`}
                              title="Análisis profundo de esta línea"
                            >
                              {isLoading ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : isExpanded ? (
                                <ChevronUp size={12} />
                              ) : (
                                <Sparkles size={12} />
                              )}
                              <span className="text-[10px] font-bold uppercase tracking-tight">
                                {isLoading ? 'Cargando...' : isExpanded ? 'Contraer' : 'Deep Dive'}
                              </span>
                            </button>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                {isLoading ? (
                                  <div className="mt-4 p-4 bg-indigo-50/30 rounded-xl space-y-2 animate-pulse">
                                    <div className="h-2 bg-indigo-100 rounded w-full" />
                                    <div className="h-2 bg-indigo-100 rounded w-[90%]" />
                                    <div className="h-2 bg-indigo-100 rounded w-[40%]" />
                                  </div>
                                ) : (
                                  <div className="mt-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Bot size={12} className="text-indigo-500" />
                                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Explicación Extendida</span>
                                    </div>
                                    <div className="text-[13px] text-indigo-900/80 leading-relaxed space-y-3 whitespace-pre-wrap">
                                      {expandedLines[idx].text}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  );
                })}

                <div className="p-8 space-y-6 bg-slate-50">
                  <div className="space-y-3">
                      <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <Wand2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Modificar con IA</span>
                      </div>
                      <div className="relative group">
                        <input
                          type="text"
                          value={customInstruction}
                          onChange={(e) => setCustomInstruction(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyInstruction(customInstruction)}
                          placeholder="Ej: Modifica la función para que acepte un nombre..."
                          className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                        />
                        <button 
                          onClick={() => handleApplyInstruction(customInstruction)}
                          disabled={!customInstruction.trim() || isApplyingInstruction}
                          className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                  </div>

                  {data.possibleErrors && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Errores a Revisar</span>
                      </div>
                      <p className="text-sm text-red-700/80 leading-relaxed italic">{data.possibleErrors}</p>
                    </div>
                  )}

                  {data.autocompleteSuggestions && data.autocompleteSuggestions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <Lightbulb size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Sugerencias del Asistente</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {data.autocompleteSuggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleApplyInstruction(suggestion)}
                            disabled={isApplyingInstruction}
                            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-left text-[13px] text-slate-600 font-mono shadow-sm hover:border-indigo-300 hover:bg-slate-50 transition-all group"
                          >
                            <div className="flex items-center">
                              <span className="text-indigo-400 mr-2 group-hover:translate-x-1 transition-transform">{">>>"}</span>
                              {suggestion}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] px-2 py-0.5 bg-slate-100 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Wand2 size={8} /> Aplicar
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full bg-slate-50"
              >
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <MessageSquare size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">¿Tienes dudas sobre el código?</h3>
                      <p className="text-sm text-slate-500 max-w-xs">Pregúntame cualquier cosa: desde qué hace una función específica hasta cómo mejorar la lógica.</p>
                    </div>
                  )}
                  
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                        }`}>
                          {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isAsking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-white text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 animate-pulse">
                          <Bot size={14} />
                        </div>
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                  <div className="relative group">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
                      placeholder="Escribe tu duda aquí..."
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner transition-all"
                    />
                    <button 
                      onClick={handleSendQuestion}
                      disabled={!chatInput.trim() || isAsking}
                      className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 text-center uppercase tracking-widest font-bold">Asistente PythonLens Activo</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="h-24" />
        </div>
      </div>
    </div>
  );
}

function getCategory(line: string): string {
  const l = line.toLowerCase().trim();
  if (!l) return 'Empty';
  if (l.includes('import ') || l.includes('from ')) return 'Library Import';
  if (l.includes('def ')) return 'Function Definition';
  if (l.includes('class ')) return 'Class Structure';
  if (l.includes('print(')) return 'Data Output';
  if (l.includes('=') && !l.includes('==') && !l.includes('!=') && !l.includes('<=') && !l.includes('>=')) return 'Variable Assignment';
  if (l.includes('if ') || l.includes('elif ') || l.includes('else:')) return 'Flow Control';
  if (l.includes('for ') || l.includes('while ')) return 'Loop Control';
  if (l.startsWith('#')) return 'Comment';
  return 'Line Logic';
}
