import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Download, Edit2, Plus, RefreshCcw, Search, Trash2, UserX, Users, X } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, increment, serverTimestamp, updateDoc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';
import { useConfirmDialog } from './ConfirmDialog';

// The user list, shared by the Users tab and the revenue panel, which needs the same
// counts. fetchUsers() used to write those totals into a shared stats object, so the
// revenue figures were only right if you happened to open Users first.
// `auto: false` lets a caller that only needs the counts decide when to load them,
// instead of every admin tab paying for a users fetch on mount.
export function useUsers({ auto = true }: { auto?: boolean } = {}) {
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (error) {
      console.error("Error fetching users:", error);
      try {
        const { handleFirestoreError, OperationType } = await import('../../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'users');
      } catch (e) {}
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => { if (auto) fetchUsers(); }, [auto]);

  const activeSubscribers = systemUsers.filter(user => user.plan && user.plan !== 'free').length;
  return { systemUsers, setSystemUsers, isLoading, fetchUsers, totalUsers: systemUsers.length, activeSubscribers };
}

export const UsersPanel: React.FC = () => {
  const { setConfirmDialog, confirmDialogElement } = useConfirmDialog();
  const { systemUsers, setSystemUsers, isLoading, fetchUsers } = useUsers();
  const [editingCreditsUser, setEditingCreditsUser] = useState<string | null>(null);
  const [editingUserSettings, setEditingUserSettings] = useState<{uid: string, level: string, plan: string} | null>(null);
  const [creditAmountToAdd, setCreditAmountToAdd] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const visibleUsers = systemUsers.filter(user => `${user.displayName || ''} ${user.email || ''} ${user.plan || ''}`.toLowerCase().includes(userSearch.toLowerCase()));
  const exportUsersCsv = () => {
    const cell = (value: unknown) => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"';
    const rows = [['Name','Email','Plan','Level','Credits'], ...visibleUsers.map(user => [user.displayName,user.email,user.plan,user.level,user.credits || 0])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'ez-academy-users.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
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



  return (
    <>
      {(
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
      {confirmDialogElement}
    </>
  );
};
