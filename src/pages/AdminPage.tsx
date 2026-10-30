import {AffiliateClaims} from './AffiliateClaims';
import {RewardCodesPanel} from './RewardCodesPanel';
import {MarketingPanel} from './MarketingPanel';
import {OperationsPanel} from './OperationsPanel';
import './admin.css';
import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, Reorder } from 'motion/react';
import ReactQuill from 'react-quill-new';
import { Users, Activity, CreditCard, AlertCircle, Database, Settings, Layout, Key, LogOut, Edit2, ShieldAlert, BookOpen, Plus, Search, Trash2, Save, X, ChevronRight, ChevronDown, MessageSquare, Mic, Tag, Loader2, Info, CheckCircle2, Target, Zap, Headphones, PenTool, GripVertical, FileText, RefreshCcw, UserX, TrendingUp, TrendingDown, DollarSign, Upload } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, increment, setDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch, collectionGroup, where, Timestamp } from 'firebase/firestore';
import { db, auth, getSiteConfig, updateSiteConfig } from '../lib/firebase';
import { cn } from '../lib/utils';
import * as Icons from 'lucide-react';
import { UserProfile, QuestionBankItem, AppModule, PracticeSession, SiteConfig } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { GeminiService } from '../services/geminiService';
import { saveReadQuestionToBank, bulkSaveQuestionsToBank } from '../services/questionBankService';

// Cost Configuration (Standard Rates for calculation - USD converted to MYR approx 4.5)
const PRICING = {
  GEMINI_FLASH: { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  GEMINI_PRO: { input: 3.50 / 1000000, output: 10.50 / 1000000 },
  FIRESTORE: { reads: 0.36 / 1000000, writes: 1.08 / 1000000 },
  HOSTING_FIXED: 5.00, // Fixed monthly cost USD
  CONVERSION_RATE: 4.5, // USD to MYR
};

// Helper to render lucide icon from string
const LucideIcon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  const Icon = (Icons as any)[name] || Icons.Layout;
  return <Icon size={size} className={className} />;
};

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Role-based access control: Only allow specific admin email
  if (auth.currentUser?.email !== 'ezacademy.my@gmail.com') {
    return <Navigate to="/app" replace />;
  }

  const [activeTab, setActiveTab] = useState<'rewards' | 'affiliates' | 'marketing' | 'operations' | 'overview' | 'users' | 'payments' | 'content' | 'questions' | 'system' | 'maintenance' | 'ui'>(() => { const tab = new URLSearchParams(window.location.search).get('tab'); return ['rewards','affiliates','marketing','operations','overview','users','payments','content','questions','system','maintenance','ui'].includes(tab || '') ? tab as any : 'overview'; });
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showArchivedPayments, setShowArchivedPayments] = useState(false);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSiteConfigLoading, setIsSiteConfigLoading] = useState(false);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [isModulesLoading, setIsModulesLoading] = useState(false);
  const [editingCreditsUser, setEditingCreditsUser] = useState<string | null>(null);
  const [editingUserSettings, setEditingUserSettings] = useState<{uid: string, level: string, plan: string} | null>(null);
  const [creditAmountToAdd, setCreditAmountToAdd] = useState('');
  
  // Bank details and payment approval state
  const [bankConfig, setBankConfig] = useState({
    bankName: 'Maybank',
    accountHolder: 'Mohamad Shahrilniza',
    accountNumber: '',
    bankQrImageUrl: '',
    instructions: 'Transfer the exact amount using your bank app. After paying, send your receipt. Your plan starts after we check your payment.',
    isConfigured: false
  });
  const [isSavingBankConfig, setIsSavingBankConfig] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean; imageUrl: string; orderRef: string; studentName: string } | null>(null);
  
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuestionBankItem> | null>(null);
  const [editingModule, setEditingModule] = useState<Partial<AppModule> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingModules, setIsSyncingModules] = useState(false);
  const [isGeneratingBank, setIsGeneratingBank] = useState(false);
  const [isUploadingBank, setIsUploadingBank] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'danger';
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  const [showIconPicker, setShowIconPicker] = useState<{ index: number } | null>(null);
  const [iconSearch, setIconSearch] = useState('');
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const visibleUsers = systemUsers.filter(user => `${user.displayName || ''} ${user.email || ''} ${user.plan || ''}`.toLowerCase().includes(userSearch.toLowerCase()));
  const exportUsersCsv = () => {
    const cell = (value: unknown) => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"';
    const rows = [['Name','Email','Plan','Level','Credits'], ...visibleUsers.map(user => [user.displayName,user.email,user.plan,user.level,user.credits || 0])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'ez-academy-users.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const [filterType, setFilterType] = useState('All');
  const [filterPart, setFilterPart] = useState('All');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

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

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = (q.data.title || q.data.theme || q.data.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (q.data.context || q.data.emailBody || q.data.situation || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || q.type === filterType;
    const matchesPart = filterPart === 'All' || q.part.toString() === filterPart;
    return matchesSearch && matchesType && matchesPart;
  });

  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

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

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: UserProfile[] = [];
      let subs = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        usersData.push(data);
        if (data.plan && data.plan !== 'free') subs++;
      });
      
      setSystemUsers(usersData);
      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length,
        activeSubscribers: subs,
        monthlyRevenue: subs * 10, // Updated to RM10 based on current pricing
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      try {
        const { handleFirestoreError, OperationType } = await import('../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'users');
      } catch (e) {}
    } finally {
      setIsLoading(false);
    }
  };

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
        const { handleFirestoreError, OperationType } = await import('../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'questions');
      } catch (e) {}
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  const fetchModules = async () => {
    setIsModulesLoading(true);
    try {
      const q = query(collection(db, 'modules'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const modulesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppModule));
      setAppModules(modulesData);
    } catch (error) {
      console.error("Error fetching modules:", error);
      try {
        const { handleFirestoreError, OperationType } = await import('../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'modules');
      } catch (e) {}
    } finally {
      setIsModulesLoading(false);
    }
  };

  const fetchSiteConfigData = async () => {
    setIsSiteConfigLoading(true);
    try {
      let config = await getSiteConfig();
      if (!config) {
        // Default initial config
        config = {
          id: 'main',
          hero: {
            title: "Master English the EZ Way",
            subtitle: "SPM, MUET, speaking, writing, and AI-powered practice in one platform. Designed for fast improvement and unbreakable confidence.",
            ctaText: "Try EZ English",
            secondaryCtaText: "Start Free Trial"
          },
          features: {
            title: "Your English Study Tools",
            subtitle: "Four practice tools to help you improve your English for SPM, MUET, and daily life.",
            items: [
              { id: 'speak', title: 'SpeakEZ', iconName: 'Mic', desc: 'SPM and MUET speaking practice with AI speakers and helpful feedback.', highlight: true },
              { id: 'write', title: 'WriteEZ', iconName: 'PenTool', desc: 'Essay feedback on grammar, word choice, and linking words.', highlight: false },
              { id: 'read', title: 'ReadEZ', iconName: 'BookOpen', desc: 'Exam-style reading practice to help you understand texts.', highlight: false },
              { id: 'listen', title: 'ListenEZ', iconName: 'Headphones', desc: 'Listening practice to help you understand spoken English in the exam.', highlight: false }
            ]
          },
          colors: {
            primary: "#CCFF00",
            obsidian: "#0A0A0A"
          },
          contact: {
            email: "support@ez-academy.my",
            whatsapp: "+6011-10043567",
            address: "Kuala Lumpur, Malaysia"
          },
          seo: {
            metaTitle: "EZ Academy | Master English",
            metaDescription: "Your AI-powered English learning platform",
            ogImage: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=1200&h=630",
            keywords: "English Academy, Malaysia Education, IELTS, MUET, Speak English, EZ Academy"
          },
          updatedAt: Date.now()
        };
      }
      setSiteConfig(config);
    } catch (error) {
      console.error("Error fetching site config:", error);
    } finally {
      setIsSiteConfigLoading(false);
    }
  };

  const fetchMaintenanceCosts = async () => {
    setIsCostsLoading(true);
    try {
      // 1. Fetch total sessions using collectionGroup
      // Note: In production, you'd want to aggregate this server-side or use a counter
      const sessionsSnapshot = await getDocs(collectionGroup(db, 'sessions'));
      const totalSessions = sessionsSnapshot.size;
      
      // 2. Estimate Gemini costs
      // Assumption: Each session has ~1000 input tokens and ~500 output tokens
      // SpeakEZ uses Flash, but some pro features use Pro
      const avgFlashCostPerSession = (1000 * PRICING.GEMINI_FLASH.input) + (500 * PRICING.GEMINI_FLASH.output);
      const geminiCostUSD = totalSessions * avgFlashCostPerSession;
      
      // 3. Estimate Firestore costs
      // Assumption: 10 reads, 2 writes per session
      const firestoreCostUSD = (totalSessions * 10 * PRICING.FIRESTORE.reads) + (totalSessions * 2 * PRICING.FIRESTORE.writes);
      
      // 4. Fixed Hosting Costs (Cloud Run, DB Storage base)
      const fixedCostUSD = PRICING.HOSTING_FIXED;
      
      const totalCostUSD = geminiCostUSD + firestoreCostUSD + fixedCostUSD;
      const totalCostMYR = totalCostUSD * PRICING.CONVERSION_RATE;
      
      setStats(prev => ({
        ...prev,
        totalSessions,
        geminiCost: geminiCostUSD * PRICING.CONVERSION_RATE,
        firestoreCost: firestoreCostUSD * PRICING.CONVERSION_RATE,
        estMonthlyCost: totalCostMYR
      }));

      // Create breakdown for charts
      setCostBreakdown([
        { name: 'AI Models', value: geminiCostUSD * PRICING.CONVERSION_RATE, color: '#f59e0b' },
        { name: 'Database', value: firestoreCostUSD * PRICING.CONVERSION_RATE, color: '#10b981' },
        { name: 'Hosting', value: fixedCostUSD * PRICING.CONVERSION_RATE, color: '#3b82f6' },
      ]);

      // Simple mock usage by day based on last 7 days from sessions
      const days: Record<string, number> = {};
      const now = Date.now();
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(day => days[day] = 0);
      
      sessionsSnapshot.forEach(doc => {
        const data = doc.data();
        if (!data.timestamp) return;
        
        const timestamp = (data.timestamp as any) instanceof Timestamp ? (data.timestamp as any).toMillis() : data.timestamp;
        const date = new Date(timestamp).toISOString().split('T')[0];
        if (days[date] !== undefined) {
          days[date]++;
        }
      });

      setUsageByDay(last7Days.map(day => ({
        date: day.split('-').slice(1).join('/'),
        sessions: days[day],
        cost: days[day] * avgFlashCostPerSession * PRICING.CONVERSION_RATE
      })));

    } catch (error) {
      console.error("Error fetching costs:", error);
      try {
        const { handleFirestoreError, OperationType } = await import('../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'sessions_group');
      } catch (e) {}
    } finally {
      setIsCostsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txData);

      // Fetch bank transfer config
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        try {
          const configRes = await fetch('/api/admin/bank-transfer-config', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          const configData = await configRes.json();
          if (configData.success && configData.config) {
            setBankConfig(configData.config);
          }
        } catch (e) {
          console.warn("Could not fetch bank config:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      try {
        const { handleFirestoreError, OperationType } = await import('../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      } catch (e) {
        // Fallback
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openPaymentReceipt = async (tx: any) => {
    try {
      let url = tx.receiptUrl;
      if (url.startsWith('/api/payment/receipt/')) {
        const token = await auth.currentUser!.getIdToken();
        const response = await fetch(url, {headers:{Authorization:`Bearer ${token}`}});
        if (!response.ok) throw new Error('Could not open this receipt.');
        url = URL.createObjectURL(await response.blob());
      }
      setReceiptModal({isOpen:true,imageUrl:url,orderRef:tx.orderReference || tx.id,studentName:tx.userName || 'Student'});
    } catch { alert('Could not open the receipt. Please try again.'); }
  };
  useEffect(() => {
    if (activeTab !== 'payments') return;
    const timer = window.setInterval(fetchTransactions, 30000);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  const handleApprovePayment = async (txId: string) => {
    const manual = transactions.find(tx => tx.id === txId)?.paymentMethod === 'manual_bank_transfer';
    setConfirmDialog({
      isOpen: true,
      title: manual ? 'Approve Payment & Activate Plan?' : 'Check ToyyibPay payment?',
      message: manual ? 'Did you check your bank account and verify the funds were received? This will activate the student\'s plan immediately.' : 'We will check the original bill with ToyyibPay. The package is activated only after a successful payment is confirmed.',
      type: 'warning',
      confirmText: manual ? 'Yes, Approve Plan' : 'Check payment',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const idToken = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/admin/payments/review', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              txId,
              action: 'APPROVE',
              adminNote: 'Manually verified by admin in bank account'
            })
          });
          const data = await res.json();
          if (data.success) {
            alert(data.message || "Payment approved and plan activated!");
            fetchTransactions();
            fetchUsers();
          } else {
            alert(data.message || 'Payment could not be confirmed.');
          }
        } catch (error: any) {
          console.error("Manual approval error:", error);
          alert("Error approving payment: " + error.message);
        }
      }
    });
  };

  const handleRejectPayment = async (txId: string) => {
    const reason = prompt("Enter a brief reason for rejecting this receipt (optional):", "Receipt could not be verified in bank statement");
    if (reason === null) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/payments/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          txId,
          action: 'REJECT',
          adminNote: reason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Payment marked as rejected.");
        fetchTransactions();
      } else {
        alert("Error rejecting payment: " + data.message);
      }
    } catch (error: any) {
      alert("Error rejecting payment: " + error.message);
    }
  };

  const handleSaveBankConfig = async () => {
    setIsSavingBankConfig(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/bank-transfer-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(bankConfig)
      });
      const data = await res.json();
      if (data.success) {
        alert("Bank transfer settings saved!");
        if (data.config) setBankConfig(data.config);
      } else {
        alert("Error saving settings: " + data.message);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSavingBankConfig(false);
    }
  };

  const handleDeletePayment = async (txId: string, restore = false) => {
    setConfirmDialog({isOpen:true, title:restore ? 'Restore payment?' : 'Archive payment?',
      message:restore ? 'Show this payment in the active history again.' : 'Hide this payment from the active history. Its payment status and audit record are preserved; you can restore it later.',
      type:'warning',confirmText:restore ? 'Restore' : 'Archive',onConfirm:async()=>{
        setConfirmDialog(null);
        try {
          const token=await auth.currentUser?.getIdToken();
          const response=await fetch('/api/admin/payments/review',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({txId,action:restore ? 'RESTORE' : 'ARCHIVE'})});
          const data=await response.json();if(!data.success) throw new Error(data.message || 'Unable to update payment');
          await fetchTransactions();
        } catch(error:any){alert(error.message);}
      }});
  };
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'payments') {
      fetchTransactions();
    }
    if (activeTab === 'questions') {
      fetchQuestions();
    }
    if (activeTab === 'content') {
      fetchModules();
    }
    if (activeTab === 'maintenance' || activeTab === 'overview') {
      fetchMaintenanceCosts();
    }
    if (activeTab === 'ui') {
      fetchSiteConfigData();
    }
  }, [activeTab]);

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

  const handleUpdateUserSettings = async () => {
    if (!editingUserSettings) return;
    try {
      const userRef = doc(db, 'users', editingUserSettings.uid);
      await updateDoc(userRef, {
        level: editingUserSettings.level,
        plan: editingUserSettings.plan,
        updatedAt: serverTimestamp()
      });
      setSystemUsers(prev => prev.map(u => 
        u.uid === editingUserSettings.uid 
          ? { ...u, level: editingUserSettings.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED", plan: editingUserSettings.plan as "basic" | "pro_plus" } 
          : u
      ));
      setEditingUserSettings(null);
      alert("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      alert('Error updating user: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleAddCredits = async (uid: string) => {
    try {
      const amount = parseInt(creditAmountToAdd);
      if (isNaN(amount) || amount <= 0) return;
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { 
        credits: increment(amount),
        updatedAt: serverTimestamp()
      });
      
      setSystemUsers(prev => prev.map(u => u.uid === uid ? { ...u, credits: (u.credits || 0) + amount } : u));
      setEditingCreditsUser(null);
      setCreditAmountToAdd('');
    } catch (error) {
      console.error("Error adding credits:", error);
      alert('Error adding credits: ' + (error instanceof Error ? error.message : String(error)));
    }
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

  const handleResetUsage = async (uid: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset User Account?',
      message: 'Are you sure you want to reset all credits and usage data for this user? This will also clear their practice history and reminders. This cannot be undone.',
      type: 'danger',
      confirmText: 'Reset',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const userRef = doc(db, 'users', uid);
          await updateDoc(userRef, { 
            credits: 0,
            usage: {
              date: new Date().toISOString().split('T')[0],
              speak: 0,
              write: 0,
              read: 0,
              listen: 0,
              deep: 0
            },
            points: 0,
            streak: 0,
            weeklyGoalProgress: 0,
            updatedAt: serverTimestamp()
          });
          
          // Delete sessions
          const sessionsSnapshot = await getDocs(collection(db, 'users', uid, 'sessions'));
          const batch = writeBatch(db);
          sessionsSnapshot.forEach(doc => batch.delete(doc.ref));
          
          // Delete reminders
          const remindersSnapshot = await getDocs(collection(db, 'users', uid, 'reminders'));
          remindersSnapshot.forEach(doc => batch.delete(doc.ref));
    
          // Delete activity logs
          const logsQuery = query(collection(db, 'activity_logs'), where('userId', '==', uid));
          const logsSnapshot = await getDocs(logsQuery);
          logsSnapshot.forEach(doc => batch.delete(doc.ref));
    
          await batch.commit();
    
          alert("User usage data and credits reset successfully.");
          fetchUsers();
        } catch (error) {
          console.error("Error resetting usage:", error);
          alert("Error resetting usage: " + (error instanceof Error ? error.message : String(error)));
        }
      }
    });
  };

  const handleDeleteUser = async (uid: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'PERMANENTLY DELETE USER?',
      message: 'Are you sure you want to PERMANENTLY DELETE this user account? This will remove all their data (profile, sessions, reminders, logs) from Firestore and cannot be undone.',
      type: 'danger',
      confirmText: 'Permanently Delete',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const batch = writeBatch(db);
    
          // Sub-collections
          const sessionsSnapshot = await getDocs(collection(db, 'users', uid, 'sessions'));
          sessionsSnapshot.forEach(doc => batch.delete(doc.ref));
          
          const remindersSnapshot = await getDocs(collection(db, 'users', uid, 'reminders'));
          remindersSnapshot.forEach(doc => batch.delete(doc.ref));
    
          // Global collections with userId
          const logsQuery = query(collection(db, 'activity_logs'), where('userId', '==', uid));
          const logsSnapshot = await getDocs(logsQuery);
          logsSnapshot.forEach(doc => batch.delete(doc.ref));
    
          const feedbackQuery = query(collection(db, 'feedback'), where('userId', '==', uid));
          const feedbackSnapshot = await getDocs(feedbackQuery);
          feedbackSnapshot.forEach(doc => batch.delete(doc.ref));
    
          // Main user document
          batch.delete(doc(db, 'users', uid));
    
          await batch.commit();
    
          alert("User account and all associated data deleted successfully.");
          fetchUsers();
        } catch (error) {
          console.error("Error deleting user:", error);
          alert("Error deleting user: " + (error instanceof Error ? error.message : String(error)));
        }
      }
    });
  };

  const handleSaveModule = async () => {
    if (!editingModule || !editingModule.name || !editingModule.slug) return;
    
    try {
      const moduleId = editingModule.id || editingModule.slug.toLowerCase().replace(/\s+/g, '-');
      const moduleRef = doc(db, 'modules', moduleId);
      
      const moduleData: any = {
        ...editingModule,
        id: moduleId,
        updatedAt: Date.now()
      };
      
      await setDoc(moduleRef, moduleData, { merge: true });
      setEditingModule(null);
      fetchModules();
    } catch (error) {
      console.error("Error saving module:", error);
      alert("Error saving module");
    }
  };

  const handleDeleteModule = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Module?',
      message: 'Are you sure you want to delete this module?',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteDoc(doc(db, 'modules', id));
          fetchModules();
        } catch (error) {
          console.error("Error deleting module:", error);
        }
      }
    });
  };

  const toggleModuleStatus = async (moduleId: string, currentStatus: boolean | undefined) => {
    try {
      const moduleRef = doc(db, 'modules', moduleId);
      await updateDoc(moduleRef, { 
        isActive: !currentStatus,
        updatedAt: Date.now()
      });
      setAppModules(prev => prev.map(m => m.id === moduleId ? { ...m, isActive: !currentStatus } : m));
    } catch (error) {
      console.error("Error toggling module status:", error);
      alert("Error toggling status");
    }
  };

  const syncModules = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sync Core Modules?',
      message: 'This will initialize/sync the default core modules (SpeakEZ, WriteEZ, etc.) to Firestore. Existing custom modules will be preserved. Continue?',
      type: 'warning',
      confirmText: 'Sync Now',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsSyncingModules(true);
        try {
          const defaultModules = [
            { name: 'SpeakEZ', slug: 'speakez', description: 'Master speaking skills with AI simulations', iconName: 'Mic', category: 'core', order: 1, isActive: true, difficulty: 'Advanced' },
            { name: 'WriteEZ', slug: 'writeez', description: 'Advanced essay grading and feedback', iconName: 'PenTool', category: 'core', order: 2, isActive: true, difficulty: 'Intermediate' },
            { name: 'ReadEZ', slug: 'readez', description: 'Exam-style reading comprehension', iconName: 'BookOpen', category: 'core', order: 3, isActive: true, difficulty: 'Easy' },
            { name: 'ListenEZ', slug: 'listenez', description: 'Immersive audio training drills', iconName: 'Headphones', category: 'core', order: 4, isActive: true, difficulty: 'Intermediate' },
            { name: 'History', slug: 'history', description: 'Review your past performance', iconName: 'History', category: 'core', order: 5, isActive: true },
          ];
    
          for (const mod of defaultModules) {
            const moduleRef = doc(db, 'modules', mod.slug);
            await setDoc(moduleRef, {
              ...mod,
              id: mod.slug,
              updatedAt: Date.now()
            }, { merge: true });
          }
          
          alert("Modules synced successfully!");
          fetchModules();
        } catch (error) {
          console.error("Error syncing modules:", error);
          alert("Failed to sync modules.");
        } finally {
          setIsSyncingModules(false);
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
          const { PART1_QUESTION_BANK, PART2_QUESTION_BANK, PART3_QUESTION_BANK } = await import('../data/questionBank');
          const { PART1_SPEAKING_BANK, PART2_SPEAKING_BANK, PART3_SPEAKING_BANK } = await import('../data/speakingBank');
          const { SPEAKING_PART2_BANK, SPEAKING_PART3_BANK } = await import('../data/speakingQuestionBank');
          
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

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    activeTasks: 18,
    estMonthlyCost: 0,
    totalSessions: 0,
    geminiCost: 0,
    firestoreCost: 0,
  });

  const [costBreakdown, setCostBreakdown] = useState<any[]>([]);
  const [usageByDay, setUsageByDay] = useState<any[]>([]);
  const [isCostsLoading, setIsCostsLoading] = useState(false);

  const TooltipHelp = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2">
      <Info size={14} className="text-white/20 hover:text-primary cursor-help transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-obsidian border border-white/10 rounded-xl text-[10px] font-medium leading-relaxed text-white/60 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-2xl">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-obsidian" />
      </div>
    </div>
  );

  const [isSiteConfigSaving, setIsSiteConfigSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSiteConfig = async () => {
    if (!siteConfig) return;
    setIsSiteConfigSaving(true);
    try {
      await updateSiteConfig(siteConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSiteConfigSaving(false);
    }
  };

  const tabs = [
    { id: 'rewards', label: 'Reward Codes', icon: Tag },
    { id: 'marketing', label: 'Marketing', icon: Target },
    { id: 'affiliates', label: 'Affiliate claims', icon: DollarSign },
    { id: 'operations', label: 'Operations', icon: Activity },
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'questions', label: 'Question Bank', icon: BookOpen },
    { id: 'content', label: 'Modules', icon: Layout },
    { id: 'ui', label: 'UI Editor', icon: Edit2 },
    { id: 'maintenance', label: 'Maintenance', icon: Settings },
    { id: 'system', label: 'System', icon: Database },
  ];

  return (
    <div className="admin-workspace space-y-6 pb-32 min-w-0">
      <header className="admin-header sticky top-0 z-40 bg-obsidian/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic uppercase text-white leading-none">
                  Admin <span className="text-primary neon-text-glow">Tools</span>
                </h2>
                <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-amber-500/20 flex items-center gap-1 italic">
                  <ShieldAlert size={12} className="pulse-primary" /> Root
                </div>
              </div>
              <p className="hidden sm:block text-white/20 uppercase tracking-[0.4em] text-[8px] font-black italic mt-1.5 underline decoration-primary/20 underline-offset-4">App Settings and Status</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 pr-4 border-r border-white/5">
                <div className="text-right">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">User</div>
                  <div className="text-xs font-bold text-white truncate max-w-[150px]">{auth.currentUser?.email}</div>
                </div>
              </div>

              {activeTab === 'ui' && (
                <button 
                  onClick={handleSaveSiteConfig}
                  disabled={isSiteConfigSaving}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-obsidian rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] transition-all disabled:opacity-50 italic"
                >
                  {isSiteConfigSaving ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSiteConfigSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              
              <button 
                onClick={() => navigate('/app/admin')}
                className="p-2.5 bg-white/5 hover:bg-primary/20 text-white/40 hover:text-primary rounded-xl transition-all border border-white/5"
                title="Return to Admin Dashboard"
              >
                <Activity size={18} />
              </button>

              <button 
                onClick={() => navigate('/app')}
                className="p-2.5 bg-white/5 hover:bg-blue-400/20 text-white/40 hover:text-blue-400 rounded-xl transition-all border border-white/5"
                title="Return to Student Deck"
              >
                <Target size={18} />
              </button>

              <button 
                onClick={() => auth.signOut()}
                className="p-2.5 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-all border border-white/5"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          
          <label className="sm:hidden block text-sm text-white/70">
            Manage
            <select aria-label="Admin section" value={activeTab} onChange={e => setActiveTab(e.target.value as any)} className="mt-2 w-full rounded-xl border border-white/15 bg-obsidian p-3 text-white">
              {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
            </select>
          </label>
          <div className="hidden sm:flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner">
            <div className="flex flex-wrap gap-1 min-w-0">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all italic whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-primary text-obsidian shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] scale-[1.02]' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'affiliates' && <AffiliateClaims/>}
      {activeTab === 'rewards' && <RewardCodesPanel/>}
      {activeTab === 'marketing' && <MarketingPanel/>}
      {(activeTab === 'operations' || activeTab === 'overview') && <OperationsPanel/>}

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold tracking-tight">Users <span className="text-sm text-white/50">({visibleUsers.length})</span></h3>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  type="text" 
                  placeholder="Search name, email or plan"
                  aria-label="Search users" value={userSearch} onChange={e => setUserSearch(e.target.value)} 
                  className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button onClick={exportUsersCsv} className="px-4 py-2 bg-primary text-obsidian rounded-lg text-xs font-bold uppercase tracking-widest">
                Export CSV
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="admin-records w-full text-left min-w-[700px]">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-white/40 border-b border-white/10">
                  <th className="pb-4 font-bold px-2">User</th>
                  <th className="pb-4 font-bold px-2">Goal/Level</th>
                  <th className="pb-4 font-bold px-2">Plan</th>
                  <th className="pb-4 font-bold px-2">Credits</th>
                  <th className="pb-4 font-bold text-right px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-white/40">Loading database...</td></tr>
                ) : visibleUsers.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-white/50">No users match your search.</td></tr>
                ) : visibleUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-white-[0.02] transition-colors">
                    <td data-label="User" className="py-4 px-2">
                      <div className="font-bold flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
                          {user.displayName?.[0] || 'U'}
                        </div>
                        {user.displayName || 'No Name'}
                      </div>
                      <div className="text-[10px] text-white/40">{user.email}</div>
                    </td>
                    <td data-label="Goal / Level" className="py-4 px-2">
                      <div className="text-xs capitalize font-medium">{user.goal || 'General'}</div>
                      <div className="text-[10px] text-white/40 capitalize">{user.level || 'Beginner'}</div>
                    </td>
                    <td data-label="Plan" className="py-4 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        user.plan === 'pro_plus' ? 'bg-primary/20 text-primary border border-primary/20' :
                        user.plan === 'basic' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                        'bg-white/5 text-white/60 border border-white/10'
                      }`}>
                        {user.plan || 'Free'}
                      </span>
                    </td>
                    <td data-label="Credits" className="py-4 px-2">
                      <div className="font-mono text-xs font-bold text-white/80">{user.credits || 0}</div>
                    </td>
                    <td data-label="Actions" className="py-4 px-2 text-right">
                      {editingCreditsUser === user.uid ? (
                        <div className="flex items-center justify-end gap-2">
                          <input 
                            type="number" 
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 w-16 text-center text-sm outline-none focus:border-primary" 
                            placeholder="+0"
                            value={creditAmountToAdd}
                            onChange={(e) => setCreditAmountToAdd(e.target.value)}
                          />
                          <button onClick={() => handleAddCredits(user.uid)} className="px-3 py-1 bg-primary text-obsidian text-xs font-bold rounded">Add</button>
                          <button onClick={() => setEditingCreditsUser(null)} className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 text-right">
                          <button 
                            onClick={() => setEditingUserSettings({ uid: user.uid, level: user.level || 'beginner', plan: user.plan || 'free' })}
                            className="p-2 bg-white/5 hover:bg-blue-500 hover:text-white border border-white/10 rounded-lg transition-colors group relative"
                            title="Edit Plan & Level"
                          >
                            <Edit2 size={14} />
                            <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-obsidian text-[10px] whitespace-nowrap rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Edit Settings</span>
                          </button>

                          <button 
                            onClick={() => { setEditingCreditsUser(user.uid); setCreditAmountToAdd('50'); }} 
                            className="p-2 bg-white/5 hover:bg-primary hover:text-obsidian border border-white/10 rounded-lg transition-colors group relative"
                            title="Add Credits"
                          >
                            <Plus size={14} />
                            <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-obsidian text-[10px] whitespace-nowrap rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Add Credits</span>
                          </button>
                          
                          <button 
                            onClick={() => handleResetUsage(user.uid)}
                            className="p-2 bg-white/5 hover:bg-amber-500 hover:text-white border border-white/10 rounded-lg transition-colors group relative"
                            title="Reset Usage"
                          >
                            <RefreshCcw size={14} />
                            <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-obsidian text-[10px] whitespace-nowrap rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Reset Usage</span>
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-2 bg-white/5 hover:bg-red-500 hover:text-white border border-white/10 rounded-lg transition-colors group relative"
                            title="Delete User"
                          >
                            <UserX size={14} />
                            <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-obsidian text-[10px] whitespace-nowrap rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Delete User</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {editingUserSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-obsidian w-full max-w-md rounded-2xl border border-white/10 p-6 overflow-hidden relative shadow-2xl">
            <h3 className="text-xl font-bold tracking-tight mb-4">Edit User Settings</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Plan</label>
                <select 
                  value={editingUserSettings.plan} 
                  onChange={e => setEditingUserSettings(prev => prev ? {...prev, plan: e.target.value} : null)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary text-white"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic (Pro)</option>
                  <option value="pro_plus">Pro Plus</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Level</label>
                <select 
                  value={editingUserSettings.level} 
                  onChange={e => setEditingUserSettings(prev => prev ? {...prev, level: e.target.value} : null)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleUpdateUserSettings}
                className="flex-1 btn-primary py-3 px-4 font-bold rounded-xl text-obsidian bg-primary hover:bg-primary/90"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setEditingUserSettings(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'payments' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* 1. Pending Approvals Banner & Inbox */}
          {transactions.filter(t => t.status === 'PENDING_REVIEW' && !t.archived).length > 0 && (
            <div className="p-6 rounded-3xl bg-yellow-500/10 border-2 border-yellow-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-500 text-obsidian flex items-center justify-center font-black">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {transactions.filter(t => t.status === 'PENDING_REVIEW' && !t.archived).length} Payment Receipt(s) Waiting for Your Review
                    </h3>
                    <p className="text-xs text-yellow-200/80">
                      Check your Maybank account statement first to confirm the funds before approving.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={fetchTransactions}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-xl text-xs font-bold hover:bg-yellow-500/30 transition"
                >
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {transactions.filter(t => t.status === 'PENDING_REVIEW' && !t.archived).map(tx => (
                  <div key={tx.id} className="p-5 rounded-2xl bg-black/40 border border-yellow-500/20 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-wider block">
                          Ref: {tx.orderReference || tx.id}
                        </span>
                        <h4 className="font-bold text-white text-base">{tx.userName}</h4>
                        <p className="text-xs text-white/50">{tx.userEmail}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-primary">RM{tx.amount?.toFixed(2)}</span>
                        <span className="text-[10px] text-white/40 block font-bold uppercase">{tx.planId}</span>
                      </div>
                    </div>

                    <div className="text-xs bg-white/5 p-3 rounded-xl space-y-1 text-white/70">
                      {tx.userBankReference && (
                        <div>Bank Ref: <strong className="text-white font-mono">{tx.userBankReference}</strong></div>
                      )}
                      {tx.userNotes && (
                        <div>Notes: <em>{tx.userNotes}</em></div>
                      )}
                      <div className="text-[10px] text-white/40">
                        Submitted: {tx.receiptSubmittedAt ? new Date(tx.receiptSubmittedAt.seconds ? tx.receiptSubmittedAt.seconds * 1000 : tx.receiptSubmittedAt).toLocaleString() : 'Just now'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {tx.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => openPaymentReceipt(tx)}
                          className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-[11px] text-white/40 italic flex-1 py-2 text-center">{tx.receiptDelivery === 'whatsapp' ? 'Check receipt on WhatsApp and verify bank funds before approving' : 'No image attached'}</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleApprovePayment(tx.id)}
                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-obsidian rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md"
                      >
                        Approve Plan
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectPayment(tx.id)}
                        className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Bank Details & QR Settings Card */}
          <div className="glass-card p-6 sm:p-8 space-y-6 border border-white/10 rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Bank Transfer / Bank QR Setup</h3>
                <p className="text-xs text-white/50">
                  Set up the bank account and bank QR image shown to students at checkout.
                </p>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                bankConfig.isConfigured 
                  ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                  : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              )}>
                {bankConfig.isConfigured ? 'Checkout Active' : 'Bank QR Unavailable at Checkout'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-white/60 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankConfig.bankName}
                  onChange={e => setBankConfig({...bankConfig, bankName: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/60 block mb-1">Account Holder</label>
                <input
                  type="text"
                  value={bankConfig.accountHolder}
                  onChange={e => setBankConfig({...bankConfig, accountHolder: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/60 block mb-1">
                  Bank Account Number (Leave blank if QR-only)
                </label>
                <input
                  type="text"
                  placeholder="Optional: Enter Maybank account number"
                  value={bankConfig.accountNumber}
                  onChange={e => setBankConfig({...bankConfig, accountNumber: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs font-mono"
                />
                <span className="text-[10px] text-white/40 mt-1 block">
                  Plain account transfer stays unavailable at checkout unless this is filled.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/60 block mb-1">
                  Bank QR image
                </label>
                <input
                  type="text"
                  placeholder="Paste bank-issued QR image URL (e.g. /maybank-qr.png or image URL)"
                  value={bankConfig.bankQrImageUrl}
                  onChange={e => setBankConfig({...bankConfig, bankQrImageUrl: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs"
                />
                <input type="file" aria-label="Upload bank QR image" accept="image/png,image/jpeg,image/webp" onChange={e => {
                  const file=e.target.files?.[0]; if (!file) return;
                  if (file.size > 512000 || !['image/png','image/jpeg','image/webp'].includes(file.type)) { alert('Use a bank QR image smaller than 500 KB.'); return; }
                  const reader=new FileReader(); reader.onload=() => setBankConfig({...bankConfig,bankQrImageUrl:String(reader.result)}); reader.readAsDataURL(file);
                }} className="mt-2 w-full" />
                <span className="text-[10px] text-white/40 mt-1 block">
                  Bank QR stays unavailable at checkout until this actual bank-issued QR is configured.
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-white/60 block mb-1">Instructions for Students</label>
                <input
                  type="text"
                  value={bankConfig.instructions}
                  onChange={e => setBankConfig({...bankConfig, instructions: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-3 md:col-span-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={bankConfig.isConfigured}
                    onChange={e => setBankConfig({...bankConfig, isConfigured: e.target.checked})}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span>Enable Bank transfer / QR at checkout (requires account number or QR image)</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveBankConfig}
              disabled={isSavingBankConfig}
              className="px-6 py-3 bg-primary text-obsidian font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition shadow-md disabled:opacity-50"
            >
              {isSavingBankConfig ? 'Saving...' : 'Save Bank Settings'}
            </button>
          </div>

          {/* 3. All Transactions Ledger */}
          <div className="glass-card p-6 sm:p-8 space-y-6 border border-white/10 rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">Payment History</h3>
                <label className="flex items-center gap-2 mt-3 text-sm text-white/70"><input type="checkbox" checked={showArchivedPayments} onChange={e=>setShowArchivedPayments(e.target.checked)} /> Show archived payments</label>
                <p className="text-xs text-white/40">Complete log of all online and manual payment transactions.</p>
              </div>
              <button 
                onClick={fetchTransactions}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-primary transition-all"
                title="Refresh"
              >
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="admin-records w-full text-left min-w-[900px]">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-[0.2em] text-white/20 border-b border-white/5 italic">
                    <th className="pb-4 px-2">Timestamp</th>
                    <th className="pb-4 px-2">Merchant Ref</th>
                    <th className="pb-4 px-2">User / Email</th>
                    <th className="pb-4 px-2">Plan</th>
                    <th className="pb-4 px-2">Amount</th>
                    <th className="pb-4 px-2">Status</th>
                    <th className="pb-4 text-right px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {isLoading ? (
                    <tr><td colSpan={7} className="py-12 text-center text-white/40 font-bold uppercase tracking-widest italic animate-pulse">Scanning Ledger...</td></tr>
                  ) : transactions.filter(tx => showArchivedPayments ? tx.archived : !tx.archived).length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-white/20 font-bold uppercase tracking-widest italic">No transactions found</td></tr>
                  ) : transactions.filter(tx => showArchivedPayments ? tx.archived : !tx.archived).map(tx => (
                    <tr key={tx.id} className="hover:bg-white-[0.02] transition-colors group">
                      <td data-label="Date" className="py-4 px-2">
                        <div className="text-[10px] text-white font-mono">{tx.createdAt ? new Date(tx.createdAt.seconds ? tx.createdAt.seconds * 1000 : tx.createdAt).toLocaleString() : 'Pending...'}</div>
                      </td>
                      <td data-label="Reference" className="py-4 px-2">
                        <div className="text-[10px] text-white/40 font-mono tracking-tighter uppercase">{tx.orderReference || tx.id}</div>
                        {tx.billCode && (
                          <div className="text-[8px] text-primary font-mono mt-0.5">BC: {tx.billCode}</div>
                        )}
                        {tx.paymentMethod && (
                          <div className="text-[8px] text-white/30 uppercase mt-0.5">{tx.paymentMethod}</div>
                        )}
                      </td>
                      <td data-label="User / Email" className="py-4 px-2">
                        <div className="font-bold text-white">{tx.userName}</div>
                        <div className="text-[10px] text-white/40">{tx.userEmail}</div>
                      </td>
                      <td data-label="Plan" className="py-4 px-2">
                         <span className="text-[10px] font-black uppercase tracking-wider text-primary">{tx.planName || tx.planId}</span>
                      </td>
                      <td data-label="Amount" className="py-4 px-2">
                        <div className="font-bold text-white">RM {tx.amount?.toFixed(2)}</div>
                      </td>
                      <td data-label="Status" className="py-4 px-2">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                          tx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          tx.status === 'FAILED' || tx.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          tx.status === 'PENDING_REVIEW' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse' :
                          'bg-white/5 text-amber-500 border border-amber-500/20'
                        )}>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            tx.status === 'SUCCESS' ? 'bg-green-500' :
                            tx.status === 'FAILED' || tx.status === 'REJECTED' ? 'bg-red-500' :
                            'bg-yellow-400'
                          )} />
                          {tx.status}
                        </span>
                      </td>
                      <td data-label="Actions" className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tx.receiptUrl && (
                            <button
                              onClick={() => openPaymentReceipt(tx)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-bold"
                            >
                              Receipt
                            </button>
                          )}
                          {!tx.archived && ((tx.paymentMethod === 'manual_bank_transfer' && tx.status === 'PENDING_REVIEW') || (tx.paymentMethod !== 'manual_bank_transfer' && !['SUCCESS','REJECTED'].includes(tx.status))) && (
                            <button 
                              onClick={() => handleApprovePayment(tx.id)}
                              className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary hover:text-obsidian transition-all"
                            >
                              {tx.paymentMethod === 'manual_bank_transfer' ? 'Approve' : 'Check payment'}
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeletePayment(tx.id, Boolean(tx.archived))} 
                            className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[9px] font-bold hover:bg-red-500 hover:text-white transition-all"
                          >
                            {tx.archived ? 'Restore' : 'Archive'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Modal */}
          {receiptModal?.isOpen && (
            <div 
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setReceiptModal(null)}
            >
              <div 
                className="bg-card border border-white/10 p-6 rounded-3xl max-w-lg w-full space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h4 className="font-bold text-white text-sm">Receipt Proof</h4>
                    <p className="text-xs text-white/40">{receiptModal.studentName} ({receiptModal.orderRef})</p>
                  </div>
                  <button 
                    onClick={() => setReceiptModal(null)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-2">
                  <img 
                    src={receiptModal.imageUrl} 
                    alt="Receipt" 
                    className="max-w-full h-auto mx-auto rounded-lg object-contain"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setReceiptModal(null)}
                    className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'questions' && (
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
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-obsidian border border-white/10 px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter text-primary">
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
                              <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Type / Part</div>
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
                              <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Theme / Title</div>
                              <h4 className="font-bold text-base text-white group-hover:text-primary transition-colors truncate">
                                {data.title || data.topic || data.theme || 'Untitled Question'}
                              </h4>
                            </div>

                            <div className="md:col-span-5 space-y-1 hidden sm:block min-w-0">
                              <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Preview Content</div>
                              <p className="text-xs text-white/40 line-clamp-1 italic font-medium">
                                {data.context || data.emailBody || data.situation || data.transcript || data.passage || 'No preview available'}
                              </p>
                            </div>

                        <div className="flex items-center gap-4">
                          <div className="md:col-span-1 space-y-1 text-right hidden lg:block">
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Visibility</div>
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

      {activeTab === 'content' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight">App Modules</h3>
            <button 
              onClick={() => setEditingModule({ 
                name: '', 
                description: '', 
                slug: '', 
                iconName: 'Layout', 
                order: appModules.length + 1, 
                isActive: true,
                category: 'core'
              })}
              className="btn-primary py-2 px-4 flex items-center gap-2"
            >
              <Plus size={16} /> New Module
            </button>
          </div>

          <div className="glass-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="admin-records w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-white/40 border-b border-white/10">
                    <th className="px-8 py-4 font-bold">Order</th>
                    <th className="py-4 font-bold">Module info</th>
                    <th className="py-4 font-bold text-center">Status</th>
                    <th className="py-4 font-bold text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isModulesLoading ? (
                    <tr><td colSpan={4} className="py-8 text-center text-white/40">Loading modules...</td></tr>
                  ) : appModules.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-white/40">No modules found in database. Create one to get started.</td></tr>
                  ) : appModules.map(mod => (
                    <tr key={mod.id} className="hover:bg-white/5 transition-colors">
                      <td data-label="Order" className="px-8 py-6">
                        <div className="font-mono text-sm text-primary font-bold">#{mod.order}</div>
                      </td>
                      <td data-label="Module" className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 ring-1 ring-white/10">
                             <LucideIcon name={mod.iconName || 'Layout'} size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-lg">{mod.name}</div>
                            <div className="text-sm text-white/40">{mod.description}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-black/40 rounded border border-white/10 text-white/40">/{mod.slug}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded border border-white/10 text-white/30">{mod.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Status" className="py-6 text-center">
                        <button 
                          onClick={() => toggleModuleStatus(mod.id, mod.isActive)}
                          className="group relative flex items-center justify-center"
                        >
                          <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${
                            mod.isActive ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]' : 'bg-white/10'
                          }`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                              mod.isActive ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </div>
                          <span className={`absolute -bottom-5 w-auto whitespace-nowrap text-[8px] font-black uppercase tracking-widest transition-opacity ${
                            mod.isActive ? 'text-primary' : 'text-white/20'
                          }`}>
                            {mod.isActive ? 'Live' : 'Hidden'}
                          </span>
                        </button>
                      </td>
                      <td data-label="Actions" className="py-6 text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingModule(mod)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                            title="Edit Module"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-white/60 hover:text-red-400 transition-colors"
                            title="Delete Module"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal / Overlay for Edit Module */}
          {editingModule && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-obsidian/95 backdrop-blur-md shadow-2xl">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="glass-card w-full max-w-lg h-full sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-primary/5">
                  <h4 className="text-xl font-bold flex items-center gap-2">
                    <Layout className="text-primary" size={20} />
                    {editingModule.id ? 'Edit Module' : 'Create New Module'}
                  </h4>
                  <button onClick={() => setEditingModule(null)} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-4 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Module Name</label>
                      <input 
                        type="text" 
                        value={editingModule.name || ''}
                        onChange={(e) => setEditingModule({...editingModule, name: e.target.value})}
                        placeholder="e.g., SpeakEZ"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Slug</label>
                      <input 
                        type="text" 
                        value={editingModule.slug || ''}
                        onChange={(e) => setEditingModule({...editingModule, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                        placeholder="e.g., speak-ez"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Order</label>
                      <input 
                        type="number" 
                        value={editingModule.order || 0}
                        onChange={(e) => setEditingModule({...editingModule, order: parseInt(e.target.value)})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Icon Name (Lucide)</label>
                      <div className="flex gap-2">
                        <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10 shrink-0">
                          <LucideIcon name={editingModule.iconName || 'Layout'} size={24} />
                        </div>
                        <input 
                          type="text" 
                          value={editingModule.iconName || 'Layout'}
                          onChange={(e) => setEditingModule({...editingModule, iconName: e.target.value})}
                          placeholder="Search icons..."
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 text-sm focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {['MessageSquare', 'Mic', 'BookOpen', 'PenTool', 'Headphones', 'Zap', 'Cpu', 'Layers'].map(ic => (
                          <button 
                            key={ic}
                            onClick={() => setEditingModule({...editingModule, iconName: ic})}
                            className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 border border-white/5 text-white/40 hover:text-white"
                          >
                            <LucideIcon name={ic} size={14} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Category</label>
                      <select 
                        value={editingModule.category || 'core'}
                        onChange={(e) => setEditingModule({...editingModule, category: e.target.value as any})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 h-11 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="core">Core Skills</option>
                        <option value="exam">Exam Prep</option>
                        <option value="bonus">Bonus Content</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Description</label>
                    <textarea 
                      rows={3}
                      value={editingModule.description || ''}
                      onChange={(e) => setEditingModule({...editingModule, description: e.target.value})}
                      placeholder="Short catchphrase or description..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Difficulty</label>
                      <select 
                        value={editingModule.difficulty || ''}
                        onChange={(e) => setEditingModule({...editingModule, difficulty: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">Unspecified</option>
                        <option value="Easy">Easy</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Status</label>
                      <div 
                        onClick={() => setEditingModule({...editingModule, isActive: !editingModule.isActive})}
                        className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${editingModule.isActive ? 'bg-primary' : 'bg-white/20'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${editingModule.isActive ? 'translate-x-5' : ''}`} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest">{editingModule.isActive ? 'Active' : 'Draft'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-white/5 flex gap-4">
                  <button 
                    onClick={handleSaveModule}
                    className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs"
                  >
                    <Save size={18} /> Save Module
                  </button>
                  <button 
                    onClick={() => setEditingModule(null)}
                    className="px-8 py-4 bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all font-black"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'ui' && siteConfig && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Main UI & Website Editor</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black italic mt-1">Live configuration for landing page & brand identity</p>
            </div>
            <div className="flex items-center gap-4">
              {saveSuccess && (
                <motion.span 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-2"
                >
                  <CheckCircle2 size={14} /> Saved and Live!
                </motion.span>
              )}
              <button 
                onClick={handleSaveSiteConfig}
                disabled={isSiteConfigSaving}
                className="btn-primary py-2.5 px-8 flex items-center gap-3 shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] disabled:opacity-50 group"
              >
                {isSiteConfigSaving ? (
                  <>
                    <Activity size={18} className="animate-spin" /> Saving Synchronization...
                  </>
                ) : (
                  <>
                    <Save size={18} className="group-hover:scale-110 transition-transform" /> Commit Changes
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* EDITOR COLUMN */}
            <div className="xl:col-span-7 space-y-8">
              {/* BRANDING & THEME */}
              <div className="glass-card p-4 sm:p-10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 italic">
                    <ShieldAlert size={18} /> Identity & Visual Core
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Quick Themes</span>
                    {[
                      { p: '#CCFF00', name: 'Cyber' },
                      { p: '#00E0FF', name: 'Aqua' },
                      { p: '#FF005C', name: 'Pulse' },
                      { p: '#A855F7', name: 'Void' }
                    ].map(theme => (
                      <button 
                        key={theme.name}
                        onClick={() => setSiteConfig({...siteConfig, colors: {...siteConfig.colors, primary: theme.p}})}
                        className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform"
                        style={{ backgroundColor: theme.p }}
                        title={theme.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                      Primary Brand Color <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </label>
                    <div className="flex gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="relative group">
                        <input 
                          type="color" 
                          value={siteConfig.colors.primary}
                          onChange={(e) => setSiteConfig({...siteConfig, colors: {...siteConfig.colors, primary: e.target.value.toUpperCase()}})}
                          className="w-14 h-14 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden"
                        />
                        <div className="absolute inset-0 border-2 border-white/10 rounded-xl pointer-events-none" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <input 
                          type="text" 
                          value={siteConfig.colors.primary}
                          onChange={(e) => setSiteConfig({...siteConfig, colors: {...siteConfig.colors, primary: e.target.value.toUpperCase()}})}
                          className="w-full bg-transparent border-none p-0 text-xl font-black italic tracking-tighter text-white focus:outline-none"
                        />
                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Main Accent HEX Code</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                      Base Background <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    </label>
                    <div className="flex gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="relative group">
                        <input 
                          type="color" 
                          value={siteConfig.colors.obsidian}
                          onChange={(e) => setSiteConfig({...siteConfig, colors: {...siteConfig.colors, obsidian: e.target.value.toUpperCase()}})}
                          className="w-14 h-14 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden"
                        />
                        <div className="absolute inset-0 border-2 border-white/10 rounded-xl pointer-events-none" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <input 
                          type="text" 
                          value={siteConfig.colors.obsidian}
                          onChange={(e) => setSiteConfig({...siteConfig, colors: {...siteConfig.colors, obsidian: e.target.value.toUpperCase()}})}
                          className="w-full bg-transparent border-none p-0 text-xl font-black italic tracking-tighter text-white focus:outline-none"
                        />
                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Obsidian Base HEX</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                  <div className="p-2 bg-primary/20 text-primary rounded-lg">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Dynamic Range Simulation</h5>
                    <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                      Changing these will update the global CSS variables. The UI uses mathematical variations of the brand color for shadows, blurs, and neon effects.
                    </p>
                  </div>
                </div>
              </div>

              {/* HERO SECTION */}
              <div className="glass-card p-4 sm:p-10 space-y-8">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 italic">
                  <Layout size={18} /> Hero Architecture
                </h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Main Heading</label>
                      <input 
                        type="text" 
                        value={siteConfig.hero.title}
                        onChange={(e) => setSiteConfig({...siteConfig, hero: {...siteConfig.hero, title: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xl font-black italic tracking-tight focus:outline-none focus:border-primary/50 focus:bg-primary/[0.02] transition-all"
                        placeholder="e.g. Master English the EZ Way"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Subtext / Marketing Hook</label>
                      <textarea 
                        rows={3}
                        value={siteConfig.hero.subtitle}
                        onChange={(e) => setSiteConfig({...siteConfig, hero: {...siteConfig.hero, subtitle: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium leading-relaxed focus:outline-none focus:border-primary/50 focus:bg-primary/[0.02] transition-all resize-none"
                        placeholder="Describe the platform's value proposition..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Main CTA Label</label>
                        <input 
                          type="text" 
                          value={siteConfig.hero.ctaText}
                          onChange={(e) => setSiteConfig({...siteConfig, hero: {...siteConfig.hero, ctaText: e.target.value}})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Secondary CTA Label</label>
                        <input 
                          type="text" 
                          value={siteConfig.hero.secondaryCtaText}
                          onChange={(e) => setSiteConfig({...siteConfig, hero: {...siteConfig.hero, secondaryCtaText: e.target.value}})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Hero Asset: Picture URL</label>
                        <input 
                          type="text" 
                          value={siteConfig.hero.imageUrl || ''}
                          onChange={(e) => setSiteConfig({...siteConfig, hero: {...siteConfig.hero, imageUrl: e.target.value}})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Hero Asset: Background Video</label>
                        <input 
                          type="text" 
                          value={siteConfig.hero.videoUrl || ''}
                          onChange={(e) => setSiteConfig({...siteConfig, hero: {...siteConfig.hero, videoUrl: e.target.value}})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="Link to .mp4 file"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MEDIA & GLOBAL ASSETS */}
              <div className="glass-card p-4 sm:p-10 space-y-8">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 italic">
                  <Headphones size={18} /> Multimedia & Streaming
                </h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Background Audio Engine (MP3/WAV)</label>
                      <div className="relative">
                        <Mic className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                          type="text" 
                          value={siteConfig.media?.backgroundAudio || ''}
                          onChange={(e) => setSiteConfig({...siteConfig, media: {...(siteConfig.media || {}), backgroundAudio: e.target.value}})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="Global ambient sound URL"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Audio Display Title</label>
                      <input 
                        type="text" 
                        value={siteConfig.media?.audioTitle || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, media: {...(siteConfig.media || {}), audioTitle: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="e.g. Focus Mood: Lofi Beats"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Landing Page Promo/Explainer Video</label>
                      <div className="relative">
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                          type="text" 
                          value={siteConfig.media?.promoVideo || ''}
                          onChange={(e) => setSiteConfig({...siteConfig, media: {...(siteConfig.media || {}), promoVideo: e.target.value}})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="Main marketing video link"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                    <p className="text-[9px] text-primary font-black uppercase tracking-widest italic">
                      SYSTEM NOTE: Media URLs must be direct links. Audio will be processed through the global player synchronized with user sessions.
                    </p>
                  </div>
                </div>
              </div>

              {/* RICH TEXT CONTENT SECTIONS */}
              <div className="glass-card p-4 sm:p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 italic">
                    <FileText size={18} /> Content Architecture
                  </h4>
                  <button 
                    onClick={() => {
                      const newSections = [...(siteConfig.contentSections || [])];
                      newSections.push({
                        id: `section-${Date.now()}`,
                        title: 'New Section',
                        content: '<p>Enter content here...</p>',
                        showInNav: false
                      });
                      setSiteConfig({...siteConfig, contentSections: newSections});
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-obsidian transition-all"
                  >
                    <Plus size={14} /> Add New Page/Section
                  </button>
                </div>

                <div className="space-y-4">
                  {(siteConfig?.contentSections || []).map((section, idx) => (
                    <div key={section.id} className="border border-white/5 bg-white/[0.02] rounded-3xl overflow-hidden group">
                      <div 
                        className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                        onClick={() => setEditingSectionIndex(editingSectionIndex === idx ? null : idx)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${editingSectionIndex === idx ? 'bg-primary text-obsidian' : 'bg-white/5 text-white/40'}`}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <h5 className="text-sm font-black italic tracking-tight">{section.title}</h5>
                            <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">ID: {section.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Global Nav</span>
                             <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSections = [...(siteConfig.contentSections || [])];
                                  newSections[idx] = {...section, showInNav: !section.showInNav};
                                  setSiteConfig({...siteConfig, contentSections: newSections});
                                }}
                                className={`w-8 h-4 rounded-full transition-all relative ${section.showInNav ? 'bg-primary' : 'bg-white/10'}`}
                              >
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${section.showInNav ? 'left-4.5' : 'left-0.5'}`} />
                              </button>
                           </div>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setConfirmDialog({
                                 isOpen: true,
                                 title: 'Delete Section?',
                                 message: 'Are you sure you want to delete this content section?',
                                 type: 'danger',
                                 confirmText: 'Delete',
                                 onConfirm: () => {
                                   setConfirmDialog(null);
                                   const newSections = siteConfig?.contentSections?.filter((_, i) => i !== idx);
                                   if (siteConfig) {
                                     setSiteConfig({...siteConfig, contentSections: newSections});
                                   }
                                 }
                               });
                             }}
                             className="p-2 text-white/10 hover:text-red-500 transition-colors"
                           >
                             <Trash2 size={16} />
                           </button>
                           <ChevronDown size={20} className={`text-white/20 transition-transform ${editingSectionIndex === idx ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {editingSectionIndex === idx && (
                        <div className="p-4 sm:p-8 border-t border-white/5 bg-black/40 space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Section Title</label>
                               <input 
                                 type="text" 
                                 value={section.title}
                                 onChange={(e) => {
                                   const newSections = [...(siteConfig.contentSections || [])];
                                   newSections[idx] = {...section, title: e.target.value};
                                   setSiteConfig({...siteConfig, contentSections: newSections});
                                 }}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-primary/50"
                               />
                             </div>
                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">URL Slug / ID</label>
                               <input 
                                 type="text" 
                                 value={section.id}
                                 onChange={(e) => {
                                   const newSections = [...(siteConfig.contentSections || [])];
                                   newSections[idx] = {...section, id: e.target.value.toLowerCase().replace(/\s+/g, '-')};
                                   setSiteConfig({...siteConfig, contentSections: newSections});
                                 }}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-primary/50"
                               />
                             </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Rich Content Layer</label>
                            <ReactQuill 
                              theme="snow"
                              value={section.content}
                              onChange={(content) => {
                                const newSections = [...(siteConfig.contentSections || [])];
                                newSections[idx] = {...section, content};
                                setSiteConfig({...siteConfig, contentSections: newSections});
                              }}
                              modules={{
                                toolbar: [
                                  [{ 'header': [1, 2, 3, false] }],
                                  ['bold', 'italic', 'underline', 'strike'],
                                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                  ['link', 'image', 'clean']
                                ],
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {(!siteConfig.contentSections || siteConfig.contentSections.length === 0) && (
                    <div className="p-4 sm:p-12 border-2 border-dashed border-white/5 rounded-[2rem] text-center">
                       <FileText size={48} className="mx-auto text-white/5 mb-4" />
                       <p className="text-white/20 text-xs font-black uppercase tracking-widest">No custom sections defined</p>
                    </div>
                  )}
                </div>
              </div>

              {/* MODULES MANAGEMENT */}
              <div className="glass-card p-4 sm:p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 italic">
                    <Target size={18} /> Modular Ecosystem
                  </h4>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Section Title</label>
                      <input 
                        type="text" 
                        value={siteConfig.features.title}
                        onChange={(e) => setSiteConfig({...siteConfig, features: {...siteConfig.features, title: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black uppercase focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Section Description</label>
                      <input 
                        type="text" 
                        value={siteConfig.features.subtitle}
                        onChange={(e) => setSiteConfig({...siteConfig, features: {...siteConfig.features, subtitle: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {siteConfig?.features?.items?.map((item, index) => (
                      <div key={item.id} className="group p-6 bg-white/5 border border-white/5 hover:border-primary/30 rounded-[2rem] transition-all relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                        
                        <div className="flex justify-between items-start mb-6">
                          <button 
                            onClick={() => {
                              setShowIconPicker({ index });
                              setIconSearch('');
                            }}
                            className="w-12 h-12 bg-white/5 hover:bg-primary hover:text-obsidian rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg"
                          >
                            <LucideIcon name={item.iconName} size={20} />
                          </button>
                          
                          <div className="flex flex-col items-end">
                            <label className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Highlight</label>
                            <button 
                              onClick={() => {
                                const newItems = [...(siteConfig?.features?.items || [])];
                                newItems[index] = {...item, highlight: !item.highlight};
                                if (siteConfig) setSiteConfig({...siteConfig, features: {...siteConfig.features, items: newItems}});
                              }}
                              className={`w-10 h-5 rounded-full transition-all relative ${item.highlight ? 'bg-primary' : 'bg-white/10'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${item.highlight ? 'left-6' : 'left-1'}`} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <input 
                            type="text" 
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...(siteConfig?.features?.items || [])];
                              newItems[index] = {...item, title: e.target.value};
                              if (siteConfig) setSiteConfig({...siteConfig, features: {...siteConfig.features, items: newItems}});
                            }}
                            className="w-full bg-transparent border-none p-0 text-lg font-black italic tracking-tight text-white focus:outline-none"
                            placeholder="Module Title"
                          />
                          <textarea 
                            rows={2}
                            value={item.desc}
                            onChange={(e) => {
                              const newItems = [...(siteConfig?.features?.items || [])];
                              newItems[index] = {...item, desc: e.target.value};
                              if (siteConfig) setSiteConfig({...siteConfig, features: {...siteConfig.features, items: newItems}});
                            }}
                            className="w-full bg-transparent border-none p-0 text-xs font-medium text-white/40 leading-relaxed focus:outline-none resize-none"
                            placeholder="Module description (keep it concise)..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* GLOBAL CONTACT */}
              <div className="glass-card p-4 sm:p-10 space-y-8">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 italic">
                  <Info size={18} /> Global Access Points
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Official Support Email</label>
                    <input 
                      type="email" 
                      value={siteConfig.contact.email}
                      onChange={(e) => setSiteConfig({...siteConfig, contact: {...siteConfig.contact, email: e.target.value}})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">WhatsApp Hotlink (No spaces)</label>
                    <input 
                      type="text" 
                      value={siteConfig.contact.whatsapp}
                      onChange={(e) => setSiteConfig({...siteConfig, contact: {...siteConfig.contact, whatsapp: e.target.value}})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Headquaters Physical Registry</label>
                    <input 
                      type="text" 
                      value={siteConfig.contact.address}
                      onChange={(e) => setSiteConfig({...siteConfig, contact: {...siteConfig.contact, address: e.target.value}})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* LANDING PAGE LAYOUT ARCHITECTURE */}
              <div className="glass-card p-4 sm:p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 italic">
                    <Layout size={18} /> Landing Page Architecture
                  </h4>
                  <div className="p-2 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-[8px] text-primary font-black uppercase tracking-widest italic">
                      Drag to reorder sections. Toggle to hide/show.
                    </p>
                  </div>
                </div>

                <Reorder.Group 
                  axis="y" 
                  values={siteConfig.sectionLayout || []} 
                  onReorder={(newOrder) => setSiteConfig({...siteConfig, sectionLayout: newOrder})}
                  className="space-y-3"
                >
                  {(siteConfig?.sectionLayout || []).map((section) => (
                    <Reorder.Item 
                      key={section.id} 
                      value={section}
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-transform cursor-grab"
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical size={16} className="text-white/20 group-hover:text-primary transition-colors" />
                        <div>
                          <p className="text-xs font-black italic tracking-tight">{section.label}</p>
                          <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-0.5">Component ID: {section.id}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const newLayout = siteConfig.sectionLayout?.map(s => 
                            s.id === section.id ? {...s, enabled: !s.enabled} : s
                          );
                          setSiteConfig({...siteConfig, sectionLayout: newLayout});
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          section.enabled 
                            ? 'bg-primary/20 text-primary border border-primary/30' 
                            : 'bg-white/5 text-white/20 border border-white/10'
                        }`}
                      >
                        {section.enabled ? 'Enabled' : 'Hidden'}
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>

              {/* SEO & SOCIAL DISCOVERY */}
              <div className="glass-card p-4 sm:p-10 space-y-8">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 italic">
                  <Search size={18} /> SEO & Social Discovery
                </h4>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Meta Browser Title</label>
                      <input 
                        type="text" 
                        value={siteConfig.seo?.metaTitle || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, seo: {...(siteConfig.seo || {metaTitle: '', metaDescription: '', ogImage: '', keywords: ''}), metaTitle: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-black italic focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="e.g. EZ Academy | Master English the EZ Way"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Meta Description (Social Snippet)</label>
                      <textarea 
                        rows={3}
                        value={siteConfig.seo?.metaDescription || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, seo: {...(siteConfig.seo || {metaTitle: '', metaDescription: '', ogImage: '', keywords: ''}), metaDescription: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-medium leading-relaxed focus:outline-none focus:border-primary/50 transition-all resize-none"
                        placeholder="Provide a compelling description for search results..."
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Social Sharing Image (OG Image URL)</label>
                      <input 
                        type="text" 
                        value={siteConfig.seo?.ogImage || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, seo: {...(siteConfig.seo || {metaTitle: '', metaDescription: '', ogImage: '', keywords: ''}), ogImage: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-mono focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="Link to 1200x630px image"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Keywords (Comma separated)</label>
                      <input 
                        type="text" 
                        value={siteConfig.seo?.keywords || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, seo: {...(siteConfig.seo || {metaTitle: '', metaDescription: '', ogImage: '', keywords: ''}), keywords: e.target.value}})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-medium focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="English, Academy, Learning, Malaysia..."
                      />
                    </div>
                  </div>

                  {/* PREVIEW OF THE SNIPPET */}
                  <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-4">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Live Sharing Insight (Google Search)</p>
                    <div className="space-y-1">
                      <a href="https://ez-academy.my" target="_blank" rel="noopener noreferrer" className="text-xl text-[#8ab4f8] font-medium hover:underline cursor-pointer block">
                        {siteConfig.seo?.metaTitle || 'EZ Academy Link'}
                      </a>
                      <a href="https://ez-academy.my" target="_blank" rel="noopener noreferrer" className="text-[#3c4043] text-sm truncate block hover:underline">
                        https://ez-academy.my › master-english
                      </a>
                      <p className="text-[#bdc1c6] text-sm line-clamp-2 leading-relaxed">
                        {siteConfig.seo?.metaDescription || 'No description provided. Google will fallback to page content.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PREVIEW COLUMN */}
            <div className="xl:col-span-5 space-y-6">
              <div className="sticky top-32 space-y-6">
                {/* PREVIEW CONTROL */}
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic flex items-center gap-2">
                    <Activity size={14} className="text-primary animate-pulse" /> Live Visual Feed
                  </h4>
                  <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 tracking-widest uppercase">Scaled 0.6x</span>
                </div>

                {/* THE MOCKUP STAGE */}
                <div 
                  className="rounded-[3rem] border-4 border-white/10 overflow-hidden shadow-2xl relative aspect-[4/3] group"
                  style={{ backgroundColor: siteConfig.colors.obsidian }}
                >
                  {/* NAVIGATION MOCK */}
                  <div className="absolute top-0 inset-x-0 h-16 border-b border-white/5 flex items-center justify-between px-10 z-10 bg-black/20 backdrop-blur-md">
                     <div className="text-lg font-black italic tracking-tighter text-white">EZ <span className="text-primary" style={{ color: siteConfig.colors.primary }}>ACADEMY</span></div>
                     <div className="flex gap-4">
                        <div className="w-8 h-1.5 rounded-full bg-white/10" />
                        <div className="w-8 h-1.5 rounded-full bg-white/10" />
                        <div className="w-16 h-8 rounded-full border border-primary/20" style={{ borderColor: `${siteConfig?.colors?.primary}44` }} />
                     </div>
                  </div>

                  {/* HERO MOCK */}
                  <div className="h-full flex flex-col items-center justify-center p-4 sm:p-12 text-center space-y-6">
                     <div className="w-full" style={{ color: 'white' }}>
                        <h5 className="text-3xl font-black tracking-tighter leading-tight mb-4">
                           {(siteConfig?.hero?.title || '').split(' ').map((word, i) => (
                             <span key={i} className={word.toLowerCase() === 'ez' ? 'italic' : ''} style={{ color: word.toLowerCase() === 'ez' ? siteConfig?.colors?.primary : 'white' }}>
                               {word}{' '}
                             </span>
                           ))}
                        </h5>
                        <p className="text-xs text-white/40 max-w-[80%] mx-auto leading-relaxed">
                          {siteConfig?.hero?.subtitle}
                        </p>
                     </div>
                     <div className="flex gap-3">
                        <div 
                          className="px-6 py-3 rounded-full text-[8px] font-black uppercase tracking-widest text-obsidian shadow-lg"
                          style={{ backgroundColor: siteConfig?.colors?.primary }}
                        >
                          {siteConfig?.hero?.ctaText}
                        </div>
                        <div className="px-6 py-3 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10 text-white">
                          {siteConfig?.hero?.secondaryCtaText}
                        </div>
                     </div>

                     {/* MODULES STRIP MOCK */}
                     <div className="grid grid-cols-4 gap-2 w-full pt-8">
                        {(siteConfig?.features?.items || []).map(m => (
                           <div 
                            key={m.id} 
                            className="aspect-square rounded-xl border border-white/5 flex items-center justify-center"
                            style={{ 
                              backgroundColor: m.highlight ? `${siteConfig?.colors?.primary}11` : 'rgba(255,255,255,0.03)',
                              borderColor: m.highlight ? `${siteConfig?.colors?.primary}33` : 'rgba(255,255,255,0.05)'
                            }}
                           >
                              <div style={{ color: m.highlight ? siteConfig.colors.primary : 'rgba(255,255,255,0.2)' }}>
                                <LucideIcon name={m.iconName} size={14} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* GLOSS OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 blur-[80px] pointer-events-none" style={{ backgroundColor: siteConfig.colors.primary, opacity: 0.2 }} />
                </div>

                <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Diagnostic Context</p>
                  <div className="space-y-2 text-[10px] font-medium text-white/50">
                    <div className="flex justify-between"><span>Active Accent</span> <span className="font-mono text-primary" style={{ color: siteConfig.colors.primary }}>{siteConfig.colors.primary}</span></div>
                    <div className="flex justify-between"><span>Media Objects</span> <span className="text-white">{(siteConfig.media?.backgroundAudio ? 1 : 0) + (siteConfig.media?.promoVideo ? 1 : 0) + (siteConfig.hero.imageUrl ? 1 : 0)} Active</span></div>
                    <div className="flex justify-between"><span>Typography</span> <span className="text-white">Inter Display + JetBrains</span></div>
                    <div className="flex justify-between"><span>Last Committed</span> <span className="text-white">{siteConfig.updatedAt ? new Date((siteConfig.updatedAt as any).seconds ? (siteConfig.updatedAt as any).seconds * 1000 : siteConfig.updatedAt).toLocaleTimeString() : 'N/A'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ICON PICKER MODAL */}
          {showIconPicker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-obsidian/90 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
              >
                <div className="p-4 sm:p-8 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-black italic tracking-tighter uppercase">Glyph <span className="text-primary">Library</span></h4>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Select visual representation for module</p>
                  </div>
                  <button onClick={() => setShowIconPicker(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-4 sm:p-8 space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input 
                      type="text"
                      placeholder="Search icon name (e.g. mic, pen, book)..."
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:outline-none focus:border-primary/50"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '400px' }}>
                    {Object.keys(Icons)
                      .filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()) && typeof (Icons as any)[name] === 'function')
                      .slice(0, 120)
                      .map(name => {
                        const Icon = (Icons as any)[name];
                        return (
                          <button
                            key={name}
                            onClick={() => {
                              const newItems = [...siteConfig.features.items];
                              newItems[showIconPicker.index] = { ...newItems[showIconPicker.index], iconName: name };
                              setSiteConfig({...siteConfig, features: {...siteConfig.features, items: newItems}});
                              setShowIconPicker(null);
                            }}
                            className="aspect-square flex flex-col items-center justify-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-primary hover:bg-primary/5 transition-all group"
                            title={name}
                          >
                            <Icon size={20} className="group-hover:scale-110 group-hover:text-primary transition-transform" />
                            <span className="text-[6px] font-black uppercase tracking-tighter text-white/20 truncate w-full text-center group-hover:text-primary/60">{name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="p-4 sm:p-8 bg-white/5 border-t border-white/5 flex justify-end">
                  <button onClick={() => setShowIconPicker(null)} className="px-6 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Cancel Selection
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'maintenance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center">
                Total Usage
              </h4>
              <div className="text-2xl sm:text-4xl font-black text-white mb-2">{stats.totalSessions}</div>
              <p className="text-xs text-white/40">Total practice sessions logged across all modules.</p>
            </div>
            <div className="glass-card p-6 flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center">
                Cost Efficiency
                <TooltipHelp text="Calculation: (Active Subscribers × RM10) ÷ (Est. Monthly Cost). Shows how sustainable the current operation is." />
              </h4>
              <div className="text-2xl sm:text-4xl font-black text-green-400 mb-2">
                {stats.monthlyRevenue > 0 ? Math.round((stats.monthlyRevenue / (stats.estMonthlyCost || 1)) * 100) : 0}%
              </div>
              <p className="text-xs text-white/40">Revenue to Maintenance cost ratio (RoI).</p>
            </div>
            <div className="glass-card p-6 flex flex-col justify-between border-primary/20">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center">
                Est. Burn Rate
                <TooltipHelp text="Projected monthly total. Includes AI costs, Database ops, and $5.00 fixed hosting. Rates: 4.5 MYR/USD." />
              </h4>
              <div className="text-2xl sm:text-4xl font-black text-white mb-2">RM {Math.round(stats.estMonthlyCost)}</div>
              <p className="text-xs text-white/40">Total projected infrastructure & AI cost per month.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-4 sm:p-8">
              <h3 className="text-lg font-bold mb-8 tracking-tight flex items-center">
                Cost Breakdown (MYR)
                <TooltipHelp text="Assumes Gemini 1.5 Flash (~1500 tokens/session) and Firestore (10 reads/2 writes per session)." />
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any) => [`RM ${parseFloat(value).toFixed(2)}`, 'Cost']}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                {costBreakdown.map((item, i) => (
                  <div key={i}>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{item.name}</div>
                    <div className="text-sm font-bold" style={{ color: item.color }}>RM {item.value.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 sm:p-8">
              <h3 className="text-lg font-bold mb-8 tracking-tight">Usage Growth (7 Days)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="sessions" fill="#ffffff20" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-[10px] text-center text-white/30 uppercase tracking-widest font-bold">
                Sessions (Grey) vs. AI Cost in RM (Orange)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-4 sm:p-8 flex flex-col justify-between border-primary/10">
              <div>
                <h3 className="text-lg font-bold mb-2 tracking-tight flex items-center gap-2">
                  <TrendingUp className="text-primary" size={20} />
                  Tier Profitability Analysis
                </h3>
                <p className="text-xs text-white/40 mb-8">Maintenance cost vs revenue per user tier (Calculated in MYR)</p>
                
                <div className="space-y-6">
                  {/* Pro Tier */}
                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 italic">Pro Membership</div>
                      <div className="text-xl font-bold text-white">RM 10.00 / head</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 italic">Est. Profit</div>
                      <div className={`text-xl font-bold ${stats.monthlyRevenue > stats.estMonthlyCost ? 'text-green-400' : 'text-red-400'}`}>
                        +RM {(10 - (stats.estMonthlyCost / Math.max(stats.totalUsers, 1))).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Free Tier */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 italic">Free Learner</div>
                      <div className="text-xl font-bold text-white">RM 0.00 / head</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 italic">Est. Burn</div>
                      <div className="text-xl font-bold text-red-500/80">
                        -RM {(stats.estMonthlyCost / Math.max(stats.totalUsers, 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Cost Per Head</div>
                  <div className="text-lg font-bold text-white">RM {(stats.estMonthlyCost / Math.max(stats.totalUsers, 1)).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Sustainability Threshold</div>
                  <div className="text-lg font-bold text-primary">
                    {Math.ceil((stats.estMonthlyCost / 10))} Subscribers
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 sm:p-8 bg-primary/[0.03] border-primary/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <DollarSign size={120} className="text-primary rotate-12" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-2 tracking-tight flex items-center gap-2">
                  <Activity className="text-primary" size={20} />
                  Net Operating Margin
                </h3>
                <p className="text-xs text-white/40 mb-8 italic uppercase tracking-widest font-black">Monthly Financial Snapshot</p>
                
                <div className="flex flex-col gap-1 justify-center min-h-[140px]">
                  <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Estimated Monthly Profit</div>
                  <div className={`text-2xl sm:text-6xl font-black italic tracking-tighter ${stats.monthlyRevenue >= stats.estMonthlyCost ? 'text-white' : 'text-red-500'}`}>
                    RM {(stats.monthlyRevenue - stats.estMonthlyCost).toFixed(2)}
                  </div>
                  <div className={`flex items-center gap-2 mt-4 text-xs font-bold ${stats.monthlyRevenue >= stats.estMonthlyCost ? 'text-green-400' : 'text-red-400'}`}>
                     {stats.monthlyRevenue >= stats.estMonthlyCost ? (
                       <><TrendingUp size={14} /> POSITIVE CASH FLOW</>
                     ) : (
                       <><TrendingDown size={14} /> OPERATING AT LOSS</>
                     )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                <div className="flex -space-x-3">
                  {Array.from({length: 5}).map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-obsidian bg-white/5 flex items-center justify-center text-[8px] font-bold text-white/20">
                      U{i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-obsidian bg-primary text-obsidian flex items-center justify-center text-[8px] font-black">
                    +{stats.totalUsers > 5 ? stats.totalUsers - 5 : 0}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Monthly Rev</div>
                  <div className="text-xl font-bold text-white italic">RM {stats.monthlyRevenue.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-8 bg-amber-500/5 border-amber-500/20">
            <h3 className="text-lg font-bold mb-4 tracking-tight flex items-center gap-2">
              <AlertCircle className="text-amber-500" />
              Optimization Recommendations
            </h3>
            {/* ... recommendations */}
          </div>

          <div className="glass-card p-4 sm:p-10 space-y-8 border-primary/20 bg-primary/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Feature Flags & Maintenance</h3>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">Control individual skill availability during upgrades</p>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={syncModules}
                  disabled={isSyncingModules}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isSyncingModules ? <Activity size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                  Sync Core Modules
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {appModules.map(mod => (
                <div key={mod.id} className={`p-6 rounded-[2rem] border transition-all ${mod.isActive ? 'bg-primary/5 border-primary/20' : 'bg-white/5 border-white/10 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${mod.isActive ? 'bg-primary text-obsidian shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]' : 'bg-white/5 text-white/20'}`}>
                      <LucideIcon name={mod.iconName || 'Layout'} size={20} />
                    </div>
                    <button 
                      onClick={() => toggleModuleStatus(mod.id, mod.isActive)}
                      className={`w-12 h-6 rounded-full p-1 transition-all ${mod.isActive ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${mod.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight mb-1">{mod.name}</h4>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${mod.isActive ? 'text-primary' : 'text-white/20'}`}>
                      {mod.isActive ? 'Operational' : 'On Maintenance'}
                    </p>
                  </div>
                </div>
              ))}
              {appModules.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                  <p className="text-sm text-white/20 font-bold uppercase tracking-widest">Click 'Sync Core Modules' to initialize feature toggles</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'system' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-4 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold tracking-tight">API Configuration</h3>
              <Key className="text-white/40" />
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Gemini API Key</label>
                <div className="flex bg-black/40 border border-white/10 rounded-lg p-3">
                  <input type="password" value="************************" readOnly className="bg-transparent w-full outline-none text-sm font-mono text-white/60" />
                  <button className="text-xs font-bold text-primary px-2">EDIT</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Stripe Secret Key</label>
                <div className="flex bg-black/40 border border-white/10 rounded-lg p-3">
                  <input type="password" value="************************" readOnly className="bg-transparent w-full outline-none text-sm font-mono text-white/60" />
                  <button className="text-xs font-bold text-primary px-2">EDIT</button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-8 border-red-500/20 bg-red-500/5">
            <h3 className="text-xl font-bold tracking-tight text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-white/60 mb-6">Irreversible system actions.</p>
            
            <div className="space-y-4">
              <button className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors">
                Purge All History Logs
              </button>
              <button className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors">
                Reset Daily Credits
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirm Dialog Overlay */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card max-w-md w-full p-4 sm:p-8 border-white/10 space-y-6"
          >
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
              confirmDialog.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
            }`}>
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{confirmDialog.title}</h3>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all italic"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={`flex-1 px-6 py-4 text-obsidian text-xs font-black uppercase tracking-widest rounded-2xl transition-all italic shadow-2xl ${
                  confirmDialog.type === 'danger' ? 'bg-red-500 shadow-red-500/20' : 'bg-primary shadow-primary/20'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Global Floating Save Action */}
      {activeTab === 'ui' && siteConfig && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center p-1.5 bg-obsidian/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
        >
          <div className="flex items-center gap-3 px-2">
            <div className="pl-6 pr-4 hidden md:block border-r border-white/5">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Editor Status</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isSiteConfigSaving ? 'bg-amber-500 animate-pulse' : 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]'}`} />
                <span className="text-[9px] font-bold text-white/60">Ready to Commit</span>
              </div>
            </div>

            <button 
              onClick={handleSaveSiteConfig}
              disabled={isSiteConfigSaving}
              className="btn-primary py-4 px-10 flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(var(--primary-rgb),0.4)] group rounded-full relative overflow-hidden"
            >
              {isSiteConfigSaving ? (
                <RefreshCcw size={20} className="animate-spin" />
              ) : (
                <Save size={20} className="group-hover:scale-110 transition-transform" />
              )}
              <span className="font-black uppercase tracking-[0.2em] italic text-[11px]">Sync Changes Live</span>
              
              {isSiteConfigSaving && (
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="absolute inset-0 bg-white/20 pointer-events-none"
                />
              )}
            </button>

            {saveSuccess && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                className="pr-8 pl-4 flex items-center gap-2 text-primary overflow-hidden"
              >
                <CheckCircle2 size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest italic whitespace-nowrap">Success!</span>
              </motion.div>
            )}
            
            <div className="pr-4">
              <TooltipHelp text="Updates the live website typography, content, and layout instantly across all student interfaces." />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};


