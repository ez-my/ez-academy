import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, AlertCircle, BookOpen, ChevronDown, ChevronRight, Database, Download, Edit2, FileText, Headphones, Loader2, MessageSquare, Mic, PenTool, Plus, RefreshCcw, Save, Search, ShieldAlert, Trash2, Upload, X, Zap } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { QuestionBankItem } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { saveReadQuestionToBank, bulkSaveQuestionsToBank } from '../../services/questionBankService';
import { useConfirmDialog } from './ConfirmDialog';
import { LucideIcon } from './LucideIcon';

// The question bank: browse, filter, edit, bulk upload and AI generation.
export const QuestionBankPanel: React.FC = () => {
  const { setConfirmDialog, confirmDialogElement } = useConfirmDialog();
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuestionBankItem> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingBank, setIsGeneratingBank] = useState(false);
  const [isUploadingBank, setIsUploadingBank] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterPart, setFilterPart] = useState('All');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchQuestions = async () => {
    setIsQuestionsLoading(true);
    try {
      const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionBankItem));
      setQuestions(questionsData);
    } catch (error) {
      console.error("Error fetching questions:", error);
      try {
        const { handleFirestoreError, OperationType } = await import('../../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'questions');
      } catch (e) {}
    } finally {
      setIsQuestionsLoading(false);
    }
  };


  const filteredQuestions = questions.filter(q => {
    const matchesSearch = (q.data.title || q.data.theme || q.data.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (q.data.context || q.data.emailBody || q.data.situation || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || q.type === filterType;
    const matchesPart = filterPart === 'All' || q.part.toString() === filterPart;
    return matchesSearch && matchesType && matchesPart;
  });


  const handleJsonChange = (val: string) => {
    if (!val.trim()) {
      setJsonError("JSON cannot be empty");
      return;
    }
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error("Must be a JSON object");
      }
      setEditingQuestion(prev => prev ? { ...prev, data: parsed } : null);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };


  const toggleQuestionExpansion = (id: string) => {
    const newSet = new Set(expandedQuestions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedQuestions(newSet);
  };


  const expandAllQuestions = () => {
    setExpandedQuestions(new Set(filteredQuestions.map(q => q.id)));
  };


  const collapseAllQuestions = () => {
    setExpandedQuestions(new Set());
  };


  const handleGenerateReadBank = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Generate ReadEZ Bank?',
      message: 'This will auto-generate reading questions part-by-part for each of the 4 themes (20 total generation tasks for 160 questions). This is more stable than generating full papers. Proceed?',
      type: 'warning',
      confirmText: 'Generate',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsGeneratingBank(true);
        
        const themes = [
          "People and Culture",
          "Science and Technology",
          "Health and Environment",
          "Financial and Consumer Awareness"
        ];
        
        try {
          let count = 0;
          for (const theme of themes) {
            for (let part = 1; part <= 5; part++) {
              count++;
              setGenerationProgress(`Theme ${themes.indexOf(theme) + 1}/4: Part ${part} (Total: ${count}/20)`);
              const test = await GeminiService.generateReadTest(theme, part as any);
              await saveReadQuestionToBank(part as any, test, theme);
            }
          }
          alert("Completed generating ReadEZ Bank.");
          fetchQuestions();
        } catch (err: any) {
          console.error("Failed to generate", err);
          alert("Generation failed: " + (err?.message || "Unknown error"));
        } finally {
          setIsGeneratingBank(false);
          setGenerationProgress(null);
        }
      }
    });
  };


  const handleSaveQuestion = async () => {
    if (!editingQuestion || !editingQuestion.type || !editingQuestion.part || !editingQuestion.data) return;
    
    try {
      const questionId = editingQuestion.id || doc(collection(db, 'questions')).id;
      const questionRef = doc(db, 'questions', questionId);
      
      const questionData = {
        id: questionId,
        type: editingQuestion.type,
        part: editingQuestion.part,
        data: editingQuestion.data,
        createdAt: editingQuestion.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(questionRef, questionData);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Error saving question");
    }
  };


  const handleDeleteQuestion = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Question?',
      message: 'Are you sure you want to delete this question?',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteDoc(doc(db, 'questions', id));
          fetchQuestions();
        } catch (error) {
          console.error("Error deleting question:", error);
        }
      }
    });
  };


  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingBank(true);
    try {
      const text = await file.text();
      let questionsToUpload: any[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        questionsToUpload = Array.isArray(parsed) ? parsed : [parsed];
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim());
          questionsToUpload = lines.slice(1).map(line => {
            // Simple split, doesn't handle all CSV complexities but works for basic templates
            const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
            const item: any = { data: {} };
            headers.forEach((header, i) => {
              const value = values[i] || '';
              if (['type', 'part', 'isPublic', 'createdBy'].includes(header)) {
                if (header === 'part') item[header] = value === 'Full' ? 'Full' : parseInt(value) || 1;
                else if (header === 'isPublic') item[header] = value.toLowerCase() === 'true';
                else item[header] = value;
              } else {
                item.data[header] = value;
              }
            });
            return item;
          });
        }
      }

      if (questionsToUpload.length > 0) {
        await bulkSaveQuestionsToBank(questionsToUpload);
        alert(`Successfully uploaded ${questionsToUpload.length} questions to the depository.`);
        fetchQuestions();
      } else {
        alert("No valid questions found in file.");
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      alert("Failed to upload questions: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploadingBank(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const downloadTemplate = (format: 'csv' | 'json') => {
    let content = '';
    const fileName = `question_template.${format}`;
    let mimeType = '';

    if (format === 'json') {
      const template = [{
        type: "Writing",
        part: 1,
        isPublic: true,
        data: {
          title: "Sample Title",
          theme: "People and Culture",
          emailBody: "Hi! This is a sample email body...",
          friendName: "Farhan",
          subject: "Sample Subject"
        }
      }];
      content = JSON.stringify(template, null, 2);
      mimeType = 'application/json';
    } else {
      content = "type,part,title,theme,emailBody,friendName,subject,isPublic\n";
      content += "Writing,1,Sample Title,People and Culture,\"Hi! This is a sample email...\",Farhan,Sample Subject,true";
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };


  const syncQuestions = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sync Question Repository?',
      message: 'This will sync ALL local bank questions to Firestore. It may take a moment. Continue?',
      type: 'warning',
      confirmText: 'Sync Repository',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsSyncing(true);
        try {
          const { PART1_QUESTION_BANK, PART2_QUESTION_BANK, PART3_QUESTION_BANK } = await import('../../data/questionBank');
          const { PART1_SPEAKING_BANK, PART2_SPEAKING_BANK, PART3_SPEAKING_BANK } = await import('../../data/speakingBank');
          const { SPEAKING_PART2_BANK, SPEAKING_PART3_BANK } = await import('../../data/speakingQuestionBank');
          
          const allToSync = [
            ...PART1_QUESTION_BANK.map(q => ({ type: 'Writing' as const, part: 1 as const, data: q })),
            ...PART2_QUESTION_BANK.map(q => ({ type: 'Writing' as const, part: 2 as const, data: q })),
            ...PART3_QUESTION_BANK.map(q => ({ type: 'Writing' as const, part: 3 as const, data: q })),
            ...PART1_SPEAKING_BANK.map(q => ({ type: 'Speaking' as const, part: 1 as const, data: q })),
            ...PART2_SPEAKING_BANK.map(q => ({ type: 'Speaking' as const, part: 2 as const, data: q })),
            ...PART3_SPEAKING_BANK.map(q => ({ type: 'Speaking' as const, part: 3 as const, data: q })),
            ...SPEAKING_PART2_BANK.map(q => ({ type: 'Speaking' as const, part: 2 as const, data: q })),
            ...SPEAKING_PART3_BANK.map(q => ({ type: 'Speaking' as const, part: 3 as const, data: q })),
          ];
    
          let syncedCount = 0;
          const batchSize = 400; // Firestore limit is 500 per batch
          
          for (let i = 0; i < allToSync.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = allToSync.slice(i, i + batchSize);
            
            chunk.forEach(item => {
              // Create a stable ID to avoid duplicates on re-sync if title matches
              const data = item.data as any;
              const titleSlug = (data.title || data.topic || data.theme || i.toString()).toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
              const docId = `${item.type.toLowerCase()[0]}${item.part}_${titleSlug}`;
              
              const docRef = doc(db, 'questions', docId);
              batch.set(docRef, {
                id: docId,
                type: item.type,
                part: item.part,
                data: item.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              }, { merge: true });
              syncedCount++;
            });
            
            await batch.commit();
          }
          
          alert(`Successfully synced ${syncedCount} questions to Firestore repository.`);
          fetchQuestions();
        } catch (error) {
          console.error("Sync error:", error);
          alert("Error syncing questions. See console.");
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };



  useEffect(() => { fetchQuestions(); }, []);

  return (
    <>
      {(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Question Bank</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1 flex items-center gap-2">
                <Database size={10} className="text-primary" /> {filteredQuestions.length} Questions Loaded
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={expandAllQuestions}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  title="Expand All"
                >
                  Expand All
                </button>
                <div className="w-px h-4 bg-white/10 self-center" />
                <button 
                  onClick={collapseAllQuestions}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  title="Collapse All"
                >
                  Collapse All
                </button>
              </div>

              <button 
                onClick={handleGenerateReadBank}
                disabled={isGeneratingBank}
                className="px-4 py-2 bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-primary/30 disabled:opacity-50 relative group"
              >
                {isGeneratingBank ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                <span>{isGeneratingBank ? 'Generating...' : 'Mass Generate ReadEZ'}</span>
                
                {generationProgress && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-obsidian border border-white/10 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter text-primary">
                    {generationProgress}
                  </div>
                )}
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  type="text" 
                  placeholder="Search questions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary w-64"
                />
              </div>
              <button 
                onClick={syncQuestions}
                disabled={isSyncing}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 disabled:opacity-50"
              >
                {isSyncing ? 'Syncing...' : 'Sync from Bank'}
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleBulkUpload} 
                accept=".csv,.json" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingBank}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/30 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {isUploadingBank ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {isUploadingBank ? 'Uploading...' : 'Bulk Upload'}
              </button>

              <button 
                onClick={() => setEditingQuestion({ type: 'Writing', part: 1, data: {} })}
                className="btn-primary py-2 px-4 flex items-center gap-2"
              >
                <Plus size={16} /> Add Question
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-4">
              {isQuestionsLoading ? (
                <div className="glass-card p-4 sm:p-12 text-center text-white/40">Loading repository...</div>
              ) : filteredQuestions.length === 0 ? (
                <div className="glass-card p-4 sm:p-12 text-center">
                  <div className="text-white/20 mb-4 flex justify-center">
                    <BookOpen size={64} />
                  </div>
                  <p className="text-white/60 mb-6">No matching questions found.</p>
                </div>
              ) : (
                filteredQuestions.map(q => {
                  const isExpanded = expandedQuestions.has(q.id);
                  const data = q.data as any;
                  
                  return (
                    <div key={q.id} className={`glass-card overflow-hidden transition-all duration-300 border ${isExpanded ? 'border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]' : 'hover:border-white/20'}`}>
                      <div 
                        className="p-5 flex items-center justify-between group cursor-pointer"
                        onClick={() => toggleQuestionExpansion(q.id)}
                      >
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            q.type === 'Writing' ? 'bg-blue-500/10 text-blue-400' : 
                            q.type === 'Speaking' ? 'bg-green-500/10 text-green-400' :
                            q.type === 'Reading' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-purple-500/10 text-purple-400'
                          }`}>
                            {q.type === 'Writing' && <MessageSquare size={22} />}
                            {q.type === 'Speaking' && <Mic size={22} />}
                            {q.type === 'Reading' && <BookOpen size={22} />}
                            {q.type === 'Listening' && <Headphones size={22} />}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-w-0 items-center">
                            <div className="md:col-span-2 space-y-1">
                              <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Type / Part</div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                  q.type === 'Writing' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' : 
                                  q.type === 'Speaking' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                                  q.type === 'Reading' ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' :
                                  'border-purple-500/30 text-purple-400 bg-purple-500/5'
                                }`}>
                                  {q.type}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded border border-white/10 text-white/60">P{q.part}</span>
                              </div>
                            </div>

                            <div className="md:col-span-4 space-y-1 min-w-0">
                              <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Theme / Title</div>
                              <h4 className="font-bold text-base text-white group-hover:text-primary transition-colors truncate">
                                {data.title || data.topic || data.theme || 'Untitled Question'}
                              </h4>
                            </div>

                            <div className="md:col-span-5 space-y-1 hidden sm:block min-w-0">
                              <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Preview Content</div>
                              <p className="text-xs text-white/40 line-clamp-1 italic font-medium">
                                {data.context || data.emailBody || data.situation || data.transcript || data.passage || 'No preview available'}
                              </p>
                            </div>

                        <div className="flex items-center gap-4">
                          <div className="md:col-span-1 space-y-1 text-right hidden lg:block">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Visibility</div>
                            <div className="flex justify-end">
                              {q.isPublic !== false ? (
                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" title="Public" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-white/20" title="Private" />
                              )}
                            </div>
                          </div>
                          
                          <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/20 group-hover:bg-white/10 group-hover:text-white/40'}`}>
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                        </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 ml-6" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setEditingQuestion(q)}
                              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all scale-90 hover:scale-100"
                              title="Edit Question"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-xl text-white/40 hover:text-red-400 transition-all scale-90 hover:scale-100"
                              title="Delete Question"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => toggleQuestionExpansion(q.id)}
                            className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-white/40 hover:text-white border border-transparent'}`}
                          >
                            <LucideIcon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={20} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="px-6 pb-6 pt-2 border-t border-white/5"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                            <div className="space-y-4">
                              <div>
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Detailed Stimulus / Transcript</h5>
                                <div className="p-4 bg-black/20 rounded-xl text-sm leading-relaxed text-white/80 border border-white/5 max-h-64 overflow-y-auto font-mono text-[10px]">
                                  {data.emailBody || data.context || data.situation || data.transcript || data.passage}
                                </div>
                              </div>
                              
                              {data.questions && Array.isArray(data.questions) && (
                                <div>
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Question Set ({data.questions.length})</h5>
                                  <div className="space-y-4">
                                    {data.questions.map((ques: any, idx: number) => (
                                      <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/5">
                                        <p className="text-xs font-bold text-white mb-2">{ques.number || idx + 1}. {ques.text}</p>
                                        {ques.options && (
                                          <div className="grid grid-cols-2 gap-2 mt-1">
                                            {ques.options.map((opt: string, oi: number) => (
                                              <div key={oi} className="text-[10px] text-white/40 bg-black/20 px-2 py-1 rounded">
                                                {opt}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {data.answers && data.answers[ques.id] && (
                                          <p className="text-[10px] text-primary font-bold mt-2 font-mono">Correct: {data.answers[ques.id]}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              {data.prompts && data.prompts.length > 0 && (
                                <div>
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Speaking Prompts</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {(data.prompts as string[] || []).map((prompt, idx) => (
                                      <span key={idx} className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60 border border-white/10">
                                        {prompt}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {data.examTips && data.examTips.length > 0 && (
                                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-2">Exam Tips</h5>
                                  <ul className="space-y-2">
                                    {(data.examTips as string[] || []).map((tip, idx) => (
                                      <li key={idx} className="text-xs text-amber-500/90 flex items-start gap-2 italic">
                                        • {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {data.bulletPoints && data.bulletPoints.length > 0 && (
                                <div>
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Bullet Points / Hints</h5>
                                  <div className="space-y-2">
                                    {(data.bulletPoints as string[] || []).map((point, idx) => (
                                      <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg text-xs text-white/60">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {point}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="pt-4 flex justify-end">
                                <span className="text-[10px] font-mono text-white/20">DB_ID: {q.id}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Filters</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white/40 block mb-2">Category</label>
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="All">All Types</option>
                      <option value="Writing">Writing</option>
                      <option value="Speaking">Speaking</option>
                      <option value="Reading">Reading</option>
                      <option value="Listening">Listening</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/40 block mb-2">Paper Part</label>
                    <select 
                      value={filterPart}
                      onChange={(e) => setFilterPart(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="All">All Parts</option>
                      <option value="1">Part 1</option>
                      <option value="2">Part 2</option>
                      <option value="3">Part 3</option>
                      <option value="Full">Full Mock</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Bulk Tools</h4>
                <div className="space-y-3">
                  <p className="text-[10px] text-white/40 uppercase font-black leading-relaxed">
                    Download templates to ensure correct formatting for mass uploads.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => downloadTemplate('csv')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/60 transition-all"
                    >
                      <FileText size={12} /> CSV Template
                    </button>
                    <button 
                      onClick={() => downloadTemplate('json')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/60 transition-all"
                    >
                      <Database size={12} /> JSON Template
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Question Bank Logic</span>
                </div>
                <p className="text-[10px] leading-relaxed text-white/60 uppercase font-medium">
                  Questions stored here are prioritized over hardcoded data. Use this for immediate syllabus updates or typo corrections.
                </p>
              </div>
            </div>
          </div>

          {/* Modal / Overlay for Edit Question */}
          {editingQuestion && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-obsidian/95 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="glass-card w-full max-w-4xl h-full sm:h-[90vh] overflow-hidden flex flex-col border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h4 className="text-xl font-bold">{editingQuestion.id ? 'Edit Question' : 'Create New Question'}</h4>
                    <button 
                      onClick={() => setShowJsonEditor(!showJsonEditor)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        showJsonEditor ? 'bg-primary text-obsidian border-primary' : 'text-white/40 border-white/10 hover:text-white'
                      }`}
                    >
                      {showJsonEditor ? 'Form View' : 'Manual JSON Edit'}
                    </button>
                  </div>
                  <button onClick={() => setEditingQuestion(null)} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-4 sm:p-8 overflow-y-auto flex-1">
                  {showJsonEditor ? (
                    <div className="space-y-4 h-[500px] flex flex-col">
                      <div className="flex justify-between items-center shrink-0">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/40">Raw Question Data (JSON)</label>
                        {jsonError ? (
                          <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase">
                            <ShieldAlert size={12} />
                            {jsonError}
                          </div>
                        ) : (
                          <div className="text-green-500 text-[10px] font-bold uppercase flex items-center gap-1">
                            <Activity size={12} /> Valid JSON
                          </div>
                        )}
                      </div>
                      <textarea
                        className={`w-full flex-1 bg-black/40 border rounded-2xl p-4 font-mono text-xs text-white/80 outline-none transition-colors resize-none ${
                          jsonError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary'
                        }`}
                        spellCheck={false}
                        defaultValue={JSON.stringify(editingQuestion.data, null, 2)}
                        onChange={(e) => handleJsonChange(e.target.value)}
                      />
                      <div className="p-4 bg-white/5 rounded-xl text-[10px] text-white/40 leading-relaxed italic shrink-0">
                        Manual JSON editing allows you to set specific fields like <strong>bulletPoints</strong> (array), <strong>examTips</strong> (array), <strong>prompts</strong> (array for speaking), etc. Ensure the structure matches the schema or parts of the app may not display correctly.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Module</label>
                          <select 
                            value={editingQuestion.type} 
                            onChange={(e) => setEditingQuestion({...editingQuestion, type: e.target.value as any})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                          >
                            <option value="Writing">Writing</option>
                            <option value="Speaking">Speaking</option>
                            <option value="Reading">Reading</option>
                            <option value="Listening">Listening</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Part</label>
                          <select 
                            value={editingQuestion.part} 
                            onChange={(e) => setEditingQuestion({...editingQuestion, part: (e.target.value === 'Full' ? 'Full' : parseInt(e.target.value)) as any})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                          >
                            <option value={1}>Part 1</option>
                            <option value={2}>Part 2</option>
                            <option value={3}>Part 3</option>
                            <option value="Full">Full</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Queston Title / Topic</label>
                        <input 
                          type="text" 
                          value={editingQuestion.data?.title || editingQuestion.data?.theme || editingQuestion.data?.topic || ''}
                          onChange={(e) => setEditingQuestion({
                            ...editingQuestion, 
                            data: { ...editingQuestion.data, title: e.target.value }
                          })}
                          placeholder="e.g., Traditional Dance Hobby"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Stimulus / Context / Email Body</label>
                        <textarea 
                          rows={6}
                          value={editingQuestion.data?.emailBody || editingQuestion.data?.context || editingQuestion.data?.situation || ''}
                          onChange={(e) => setEditingQuestion({
                            ...editingQuestion, 
                            data: { 
                              ...editingQuestion.data, 
                              emailBody: editingQuestion.part === 1 ? e.target.value : undefined,
                              context: editingQuestion.part !== 1 ? e.target.value : undefined,
                              situation: editingQuestion.part !== 1 ? e.target.value : undefined
                            }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Friend Name (Part 1)</label>
                          <input 
                            type="text" 
                            value={editingQuestion.data?.friendName || ''}
                            onChange={(e) => setEditingQuestion({
                              ...editingQuestion, 
                              data: { ...editingQuestion.data, friendName: e.target.value }
                            })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Subject (Part 1)</label>
                          <input 
                            type="text" 
                            value={editingQuestion.data?.subject || ''}
                            onChange={(e) => setEditingQuestion({
                              ...editingQuestion, 
                              data: { ...editingQuestion.data, subject: e.target.value }
                            })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-white/10 bg-white/5 flex gap-4">
                  <button 
                    onClick={handleSaveQuestion}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Save Version
                  </button>
                  <button 
                    onClick={() => setEditingQuestion(null)}
                    className="px-6 py-3 bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/20"
                  >
                    Discard Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
      {confirmDialogElement}
    </>
  );
};
