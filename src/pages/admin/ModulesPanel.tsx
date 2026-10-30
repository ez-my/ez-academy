import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Edit2, Layout, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppModule } from '../../types';
import { useConfirmDialog } from './ConfirmDialog';
import { LucideIcon } from './LucideIcon';

// The app modules an admin can add, reorder, rename and switch on or off.
type Confirm = ReturnType<typeof useConfirmDialog>['setConfirmDialog'];

// Modules are edited on their own tab and toggled again from Feature Flags on the
// Maintenance tab. Both views share this hook so there is one fetch, one set of
// mutations and no chance of the two screens disagreeing.
function useModules(setConfirmDialog: Confirm) {
  const [appModules, setAppModules] = useState<AppModule[]>([]);
  const [isModulesLoading, setIsModulesLoading] = useState(false);
  const [editingModule, setEditingModule] = useState<Partial<AppModule> | null>(null);
  const [isSyncingModules, setIsSyncingModules] = useState(false);

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
        const { handleFirestoreError, OperationType } = await import('../../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'modules');
      } catch (e) {}
    } finally {
      setIsModulesLoading(false);
    }
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




  useEffect(() => { fetchModules(); }, []);

  return { appModules, setAppModules, isModulesLoading, editingModule, setEditingModule, isSyncingModules, fetchModules, handleSaveModule, handleDeleteModule, toggleModuleStatus, syncModules };
}

export const ModulesPanel: React.FC = () => {
  const { setConfirmDialog, confirmDialogElement } = useConfirmDialog();
  const { appModules, setAppModules, isModulesLoading, editingModule, setEditingModule, isSyncingModules, fetchModules, handleSaveModule, handleDeleteModule, toggleModuleStatus, syncModules } = useModules(setConfirmDialog);

  return (
    <>
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
      {confirmDialogElement}
    </>
  );
};

// The same module toggles, shown on the Maintenance tab as feature flags. It shares
// useModules with ModulesPanel, so toggling here and there cannot drift apart.
export const ModuleFlagsGrid: React.FC = () => {
  const { setConfirmDialog, confirmDialogElement } = useConfirmDialog();
  const { appModules, isSyncingModules, syncModules, toggleModuleStatus } = useModules(setConfirmDialog);

  return (
    <>
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
      {confirmDialogElement}
    </>
  );
};
