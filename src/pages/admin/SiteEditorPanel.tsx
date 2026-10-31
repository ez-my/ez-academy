import React, { useEffect, useState } from 'react';
import { motion, Reorder } from 'motion/react';
import ReactQuill from 'react-quill-new';
import * as Icons from 'lucide-react';
import { Activity, CheckCircle2, ChevronDown, ChevronRight, Edit2, FileText, GripVertical, Headphones, Info, Layout, Mic, Plus, RefreshCcw, Save, Search, ShieldAlert, Target, Trash2, X, Zap } from 'lucide-react';
import { getSiteConfig, updateSiteConfig } from '../../lib/firebase';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { SiteConfig } from '../../types';
import { useConfirmDialog } from './ConfirmDialog';
import { LucideIcon } from './LucideIcon';
import { TooltipHelp } from './TooltipHelp';

// Colours, hero copy, media, nav and the editable content pages.
// The editor and its save bar live together here; the save bar used to sit in
// AdminPage, detached from the form it saves, with a second copy in the header.
export const SiteEditorPanel: React.FC = () => {
  const { setConfirmDialog, confirmDialogElement } = useConfirmDialog();
  const { refresh: refreshSiteConfig } = useSiteConfig();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [isSiteConfigLoading, setIsSiteConfigLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState<{ index: number } | null>(null);
  const [iconSearch, setIconSearch] = useState('');
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [isSiteConfigSaving, setIsSiteConfigSaving] = useState(false);




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



  const handleSaveSiteConfig = async () => {
    if (!siteConfig) return;
    setIsSiteConfigSaving(true);
    try {
      await updateSiteConfig(siteConfig);
      // The provider no longer listens for changes, so tell it to re-read: without
      // this the live site keeps serving the pre-save copy until a full reload.
      await refreshSiteConfig();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSiteConfigSaving(false);
    }
  };



  useEffect(() => { fetchSiteConfigData(); }, []);

  return (
    <>
      {siteConfig && (
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
      {siteConfig && (
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
      {confirmDialogElement}
    </>
  );
};
