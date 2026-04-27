import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { 
  PlusCircle, 
  Database, 
  MessageSquare, 
  Terminal, 
  Clock, 
  FileText, 
  UploadCloud, 
  MoreVertical,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Edit2,
  Trash2,
  ArrowLeft,
  Eye,
  FileCode,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { useToast } from '../contexts/ToastContext';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const initialSources = [
  { 
    name: 'Product Documentation', 
    desc: 'Internal user guides and API references for the core platform.', 
    status: 'synced', 
    count: '45 Docs', 
    time: '2h ago',
    icon: FileText,
    color: 'emerald'
  },
  { 
    name: 'Customer Support FAQ', 
    desc: 'Shared library of common support responses and knowledge articles.', 
    status: 'live sync', 
    count: '122 Articles', 
    time: '5m ago',
    icon: MessageSquare,
    color: 'blue'
  },
  { 
    name: 'Technical Specifications', 
    desc: 'Manuals for engineering teams and detailed hardware specs.', 
    status: 'idle', 
    count: '15 Manuals', 
    time: '1d ago',
    icon: Terminal,
    color: 'amber'
  },
];

const recentUploads = [
  { name: 'User_Guide_v2.pdf', type: 'PDF', status: 'Completed', size: '2.4 MB', date: 'Jun 12, 2024', color: 'text-[#ff0000]', previewContent: null },
  { name: 'Release_Notes_June.docx', type: 'DOCX', status: 'Processing', size: '850 KB', date: 'Jun 14, 2024', color: 'text-blue-500', previewContent: null },
  { name: 'System_Logs.txt', type: 'TXT', status: 'Failed', size: '12 KB', date: 'Jun 14, 2024', color: 'text-[#a1a4a5]', previewContent: '2024-06-14 10:00:01 INFO: System started\n2024-06-14 10:05:22 ERROR: Connection timeout\n2024-06-14 10:10:45 WARN: High memory usage detected' },
  { name: 'API_Ref_v4.pdf', type: 'PDF', status: 'Completed', size: '4.1 MB', date: 'May 28, 2024', color: 'text-[#ff0000]', previewContent: null },
];

export default function KnowledgeBase() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<'overview' | 'manage'>('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingKbOriginalName, setEditingKbOriginalName] = useState('');

  const [sources, setSources] = useState(initialSources);
  const [uploads, setUploads] = useState(recentUploads);
  const [selectedKbForUpload, setSelectedKbForUpload] = useState(initialSources[0]?.name || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<any>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ 
    name: string; 
    content: string | null; 
    type: string; 
    url?: string;
    pdfPages?: string[]; // Array of data URLs for PDF pages
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefreshUploads = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const totalPages = Math.ceil(uploads.length / itemsPerPage);
  const paginatedUploads = uploads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const openDeleteUploadConfirmation = (idx: number) => {
    const upload = uploads[idx];
    setConfirmModal({
      isOpen: true,
      type: 'delete_upload',
      title: t('kb.confirm.delete.title'),
      message: (
        <>
          {t('kb.confirm.delete.msg')} <span className="font-bold text-[#f0f0f0]">"{upload.name}"</span>?
          <br />
          <span className="text-[#ff0000] font-medium mt-2 block">
            {t('kb.confirm.delete.undone')}
          </span>
        </>
      ),
      targetIndex: idx
    });
  };

  const handleViewDetails = (upload: any) => {
    setSelectedUpload(upload);
    setIsDetailsModalOpen(true);
  };

  const handlePreview = async (file: any) => {
    setIsPreviewLoading(true);
    setIsPreviewModalOpen(true);
    
    try {
      if (file.type === 'TXT') {
        setPreviewData({
          name: file.name,
          type: file.type,
          content: file.previewContent || 'No content available.'
        });
      } else if (file.type === 'PDF') {
        if (file.fileObject) {
          const arrayBuffer = await file.fileObject.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          const pages: string[] = [];
          // Render first 5 pages for preview to keep it performant
          const numPages = Math.min(pdf.numPages, 5);
          
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            if (context) {
              // @ts-ignore - Handle potential version differences in pdfjs-dist types
              await page.render({ canvasContext: context, viewport }).promise;
              pages.push(canvas.toDataURL());
            }
          }
          
          setPreviewData({
            name: file.name,
            type: file.type,
            content: null,
            pdfPages: pages
          });
        } else {
          setPreviewData({
            name: file.name,
            type: file.type,
            content: null
          });
        }
      } else if (file.type === 'DOCX') {
        if (file.fileObject) {
          const arrayBuffer = await file.fileObject.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setPreviewData({
            name: file.name,
            type: file.type,
            content: result.value
          });
        } else {
          setPreviewData({
            name: file.name,
            type: file.type,
            content: null
          });
        }
      } else {
        setPreviewData({
          name: file.name,
          type: file.type,
          content: null
        });
      }
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewData({
        name: file.name,
        type: file.type,
        content: 'Error loading preview.'
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewData?.url) {
      URL.revokeObjectURL(previewData.url);
    }
    setIsPreviewModalOpen(false);
    setPreviewData(null);
  };

  const handleResyncUpload = (idx: number) => {
    setUploads(prev => prev.map((u, i) => 
      i === idx ? { ...u, status: 'Processing', color: 'text-blue-500' } : u
    ));

    setTimeout(() => {
      setUploads(prev => prev.map((u, i) => 
        i === idx ? { ...u, status: 'Completed', color: 'text-emerald-500' } : u
      ));
      showToast(t('status.completed'), 'success');
    }, 2000);
  };
  
  // Form state
  const [kbName, setKbName] = useState('');
  const [kbDesc, setKbDesc] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'edit' | 'delete_upload';
    title: string;
    message: React.ReactNode;
    targetName?: string;
    targetIndex?: number;
  }>({ isOpen: false, type: 'delete', title: '', message: '' });

  const openCreateModal = () => {
    setFormMode('create');
    setKbName('');
    setKbDesc('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (source: any) => {
    setFormMode('edit');
    setEditingKbOriginalName(source.name);
    setKbName(source.name);
    setKbDesc(source.desc);
    setIsCreateModalOpen(true);
  };

  const handleDeleteClick = (name: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      title: t('kb.confirm.delete.title'),
      message: (
        <>
          {t('kb.confirm.delete.msg')} <span className="font-bold text-[#f0f0f0]">"{name}"</span>?
          <br />
          <span className="text-[#ff0000] font-medium mt-2 block">
            {t('kb.confirm.delete.undone')}
          </span>
        </>
      ),
      targetName: name
    });
  };

  const executeDelete = () => {
    if (confirmModal.type === 'delete_upload') {
      const idxToDelete = confirmModal.targetIndex;
      if (idxToDelete !== undefined) {
        setUploads(prev => prev.filter((_, i) => i !== idxToDelete));
        showToast(t('toast.kb_deleted'), 'success');
      }
    } else {
      const nameToDelete = confirmModal.targetName;
      if (nameToDelete) {
        setSources(prev => prev.filter(s => s.name !== nameToDelete));
        showToast(t('toast.kb_deleted'), 'success');
        if (selectedKbForUpload === nameToDelete) {
          const remaining = sources.filter(s => s.name !== nameToDelete);
          setSelectedKbForUpload(remaining.length > 0 ? remaining[0].name : '');
        }
      }
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveClick = () => {
    if (!kbName.trim()) return;
    if (formMode === 'edit') {
      setConfirmModal({
        isOpen: true,
        type: 'edit',
        title: t('kb.confirm.edit.title'),
        message: (
          <>
            {t('kb.confirm.edit.msg')} <span className="font-bold text-[#f0f0f0]">"{editingKbOriginalName}"</span>?
          </>
        ),
      });
    } else {
      executeSave();
    }
  };

  const executeSave = () => {
    if (formMode === 'create') {
      const newSource = {
        name: kbName,
        desc: kbDesc || 'Newly created knowledge base.',
        status: 'idle',
        count: '0 Docs',
        time: 'Just now',
        icon: FileText,
        color: 'blue'
      };
      setSources([newSource, ...sources]);
      setSelectedKbForUpload(newSource.name);
      showToast(t('toast.kb_created'), 'success');
    } else {
      setSources(prev => prev.map(s => {
        if (s.name === editingKbOriginalName) {
          return {
            ...s,
            name: kbName,
            desc: kbDesc,
            icon: FileText
          };
        }
        return s;
      }));
      showToast(t('toast.kb_created'), 'success'); // Reusing created for simplicity or I could add updated
      if (selectedKbForUpload === editingKbOriginalName) {
        setSelectedKbForUpload(kbName);
      }
    }
    
    setIsCreateModalOpen(false);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    const processFile = (previewContent: string | null = null) => {
      const newUpload = {
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        status: 'Processing',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        color: file.name.toLowerCase().endsWith('.pdf') ? 'text-[#ff0000]' : 
               file.name.toLowerCase().endsWith('.docx') ? 'text-blue-500' : 'text-[#a1a4a5]',
        previewContent,
        fileObject: file // Store the file object for later preview
      };

      setUploads(prev => [newUpload, ...prev]);
      showToast(t('toast.kb_created'), 'success');
      
      // Simulate processing -> completed
      setTimeout(() => {
        setUploads(prev => prev.map(u => 
          u.name === file.name && u.status === 'Processing' ? { ...u, status: 'Completed', color: u.type === 'PDF' ? 'text-[#ff0000]' : u.type === 'DOCX' ? 'text-blue-500' : 'text-emerald-500' } : u
        ));
        
        // Update the doc count for the selected KB
        setSources(prev => prev.map(s => {
          if (s.name === selectedKbForUpload) {
            const currentCount = parseInt(s.count.split(' ')[0]) || 0;
            return { ...s, count: `${currentCount + 1} Docs`, status: 'synced', time: 'Just now' };
          }
          return s;
        }));
      }, 2000);
    };

    if (file.name.toLowerCase().endsWith('.txt')) {
      reader.onload = (event) => {
        processFile(event.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      processFile(null);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {currentView === 'manage' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentView('overview')}
                className="p-2 text-[#a1a4a5] hover:text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)] rounded-[12px] transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#f0f0f0]">{t('kb.manage.title')}</h2>
              </div>
            </div>
            <button 
              onClick={openCreateModal}
              className="bg-[#ffffff] text-[#000000] px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-[#f0f0f0] transition-all shadow-md shadow-black/40 shadow-primary/20"
            >
              <PlusCircle size={18} />
              {t('kb.create')}
            </button>
          </div>

          <div className="bg-[#000000] rounded-[16px] shadow-md shadow-black/40 border border-[rgba(255,255,255,0.3)] overflow-hidden">
            <div className="p-6 space-y-3">
              {sources.length === 0 ? (
                <div className="text-center py-12">
                  <Database size={48} className="mx-auto text-[rgba(255,255,255,0.3)] mb-4" />
                  <p className="text-[#a1a4a5] font-medium">{t('kb.no_sources')}</p>
                </div>
              ) : (
                sources.map(source => (
                  <div key={source.name} className="flex items-center justify-between p-4 bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] hover:border-primary/30 hover:shadow-md shadow-black/40 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[12px] bg-[rgba(255,255,255,0.02)] flex items-center justify-center text-[#3b9eff] shrink-0">
                        <source.icon size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#f0f0f0] text-sm">{source.name}</h4>
                        <p className="text-xs text-[#a1a4a5] mt-0.5 line-clamp-1">{source.desc}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a1a4a5] flex items-center gap-1">
                            <FileText size={10} /> {source.count}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <button 
                        onClick={() => openEditModal(source)} 
                        className="p-2 text-[#3b9eff] hover:bg-[rgba(59,158,255,0.05)] rounded-[12px] transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(source.name)} 
                        className="p-2 text-[#ff0000] hover:bg-[#ff0000]/10 rounded-[12px] transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-[24px] font-display font-medium tracking-tight tracking-tight text-[#f0f0f0]">{t('kb.title')}</h2>
            </div>
            <button 
              onClick={openCreateModal}
              className="bg-[#ffffff] text-[#000000] px-5 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-[#f0f0f0] transition-all shadow-md shadow-black/40 shadow-primary/20"
            >
              <PlusCircle size={18} />
              {t('kb.create')}
            </button>
          </div>

          {/* Managed Data Sources */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-[#f0f0f0]">{t('kb.sources.title')}</h3>
              <button onClick={() => setCurrentView('manage')} className="text-[#3b9eff] text-sm font-semibold hover:underline">{t('dashboard.view_all')}</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sources.slice(0, 3).map((source) => (
                <div key={source.name} className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-32 bg-[rgba(255,255,255,0.02)] flex items-center justify-center relative">
                    <source.icon size={48} className="text-[#3b9eff]/20 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-[#f0f0f0] mb-1">{source.name}</h4>
                    <p className="text-xs text-[#a1a4a5] mb-4 line-clamp-2">{source.desc}</p>
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#a1a4a5]">
                      <span className="flex items-center gap-1"><FileText size={12} /> {source.count}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {source.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upload Area */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h3 className="text-base font-bold text-[#f0f0f0]">{t('kb.upload.title')}</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-[#f0f0f0]">{t('kb.upload.target')}:</label>
                <select 
                  value={selectedKbForUpload}
                  onChange={(e) => setSelectedKbForUpload(e.target.value)}
                  className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[12px] px-3 py-2 text-sm font-medium outline-none"
                >
                  {sources.map(s => (
                    <option key={s.name} value={s.name} className="bg-[#000000] text-[#f0f0f0]">{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border border-[rgba(255,255,255,0.3)] bg-[#000000] rounded-[16px] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-[rgba(59,158,255,0.05)] transition-all group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40" 
                accept=".pdf,.docx,.txt"
              />
              <div className="size-16 rounded-full bg-[rgba(59,158,255,0.05)] flex items-center justify-center mb-4 group-hover:bg-[rgba(59,158,255,0.1)] group-hover:scale-110 transition-all">
                <UploadCloud size={32} className="text-[#3b9eff]" />
              </div>
              <h4 className="text-lg font-bold text-[#f0f0f0]">{t('kb.upload.drop')}</h4>
              <p className="text-[#a1a4a5] text-sm mt-1">{t('kb.upload.limit')}</p>
              <button className="mt-6 px-6 py-2 border border-[rgba(255,255,255,0.3)] rounded-md text-sm font-semibold hover:bg-[#000000] transition-colors">
                {t('common.select')}
              </button>
            </div>
          </section>

          {/* Recent Uploads Table */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#f0f0f0]">{t('kb.recent.title')}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleRefreshUploads}
                  className={cn(
                    "p-2 rounded-md text-[#a1a4a5] hover:bg-[#000000] transition-all",
                    isRefreshing && "animate-spin text-[#3b9eff]"
                  )}
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
            <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] overflow-hidden shadow-md shadow-black/40">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-[rgba(255,255,255,0.02)]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('kb.table.file')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('kb.table.type')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('kb.table.status')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('kb.table.size')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider">{t('kb.table.date')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#a1a4a5] uppercase tracking-wider text-right">{t('dashboard.table.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.3)]">
                    {paginatedUploads.map((file, idx) => (
                      <tr key={`${file.name}-${idx}`} className="hover:bg-[rgba(255,255,255,0.02)]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className={file.color} />
                            <span className="text-sm font-semibold text-[#f0f0f0]">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#a1a4a5]">{file.type}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-0 py-1 text-xs font-black uppercase tracking-wider 
                            ${file.status === 'Completed' ? 'text-green-500' : 
                              file.status === 'Processing' ? 'text-blue-500' : 'text-red-500'}`}>
                            {file.status === 'Completed' && <CheckCircle2 size={12} />}
                            {file.status === 'Processing' && <Loader2 size={12} className="animate-spin" />}
                            {file.status === 'Failed' && <AlertCircle size={12} />}
                            {file.status === 'Completed' ? t('status.completed') : 
                             file.status === 'Processing' ? t('status.processing') : t('status.failed')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#a1a4a5]">{file.size}</td>
                        <td className="px-6 py-4 text-sm text-[#a1a4a5]">{file.date}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {file.status === 'Failed' && (
                              <button 
                                onClick={() => handleResyncUpload(idx)}
                                className="p-2 text-[#3b9eff] hover:bg-[rgba(59,158,255,0.05)] rounded-[12px] transition-colors"
                                title={t('common.retry') || 'Retry Sync'}
                              >
                                <RefreshCw size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => handlePreview(file)}
                              className="p-2 text-[#3b9eff] hover:bg-[rgba(59,158,255,0.05)] rounded-[12px] transition-colors"
                              title={t('kb.preview')}
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => openDeleteUploadConfirmation(idx)}
                              className="p-2 text-[#ff0000] hover:bg-[#ff0000]/10 rounded-[12px] transition-colors"
                              title={t('common.delete')}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-[rgba(255,255,255,0.02)] flex items-center justify-between border-t border-[rgba(255,255,255,0.3)]">
                <p className="text-xs text-[#a1a4a5] font-medium">
                  {t('kb.table.showing')} {paginatedUploads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, uploads.length)} {t('kb.table.of')} {uploads.length} {t('kb.table.docs')}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-1 px-3 border border-[rgba(255,255,255,0.3)] rounded-md text-[#f0f0f0] hover:text-[#3b9eff] hover:border-primary/50 disabled:opacity-50 disabled:hover:text-[#f0f0f0] disabled:hover:border-[rgba(255,255,255,0.3)] transition-colors inline-flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 px-3 border border-[rgba(255,255,255,0.3)] rounded-md text-[#f0f0f0] hover:text-[#3b9eff] hover:border-primary/50 disabled:opacity-50 disabled:hover:text-[#f0f0f0] disabled:hover:border-[rgba(255,255,255,0.3)] transition-colors inline-flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
      {/* Create / Edit Knowledge Base Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)]">
              <h3 className="text-lg font-bold text-[#f0f0f0]">
                {formMode === 'create' ? t('kb.modal.create') : t('kb.modal.edit')}
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#f0f0f0]">{t('kb.modal.name')}</label>
                <input 
                  type="text" 
                  value={kbName}
                  onChange={(e) => setKbName(e.target.value)}
                  placeholder={t('kb.modal.name_placeholder')} 
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#f0f0f0]">{t('kb.modal.desc')}</label>
                <textarea 
                  value={kbDesc}
                  onChange={(e) => setKbDesc(e.target.value)}
                  placeholder={t('kb.modal.desc_placeholder')} 
                  rows={3}
                  className="w-full bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] px-4 py-2.5 text-sm focus:ring-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[rgba(255,255,255,0.3)] bg-[#000000] flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] rounded-[12px] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSaveClick}
                disabled={!kbName.trim()}
                className="px-5 py-2.5 text-sm font-bold bg-[#ffffff] text-[#000000] hover:bg-[#f0f0f0] rounded-md transition-colors shadow-md shadow-black/40 shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formMode === 'create' ? t('common.create') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)]">
              <h3 className="text-lg font-bold text-[#f0f0f0]">{t('common.view_details')}</h3>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)]">
                <div className={cn("w-12 h-12 rounded-[12px] bg-[#000000] flex items-center justify-center shadow-md shadow-black/40", selectedUpload.color)}>
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#f0f0f0] truncate">{selectedUpload.name}</p>
                  <p className="text-xs text-[#a1a4a5]">{selectedUpload.type} • {selectedUpload.size}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)]">
                  <p className="text-[10px] font-black text-[#a1a4a5] uppercase tracking-wider mb-1">{t('kb.table.status')}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      selectedUpload.status === 'Completed' ? "bg-emerald-500" :
                      selectedUpload.status === 'Processing' ? "bg-blue-500" : "bg-red-500"
                    )}></span>
                    <p className="text-xs font-bold text-[#f0f0f0]">{selectedUpload.status}</p>
                  </div>
                </div>
                <div className="p-3 bg-[rgba(255,255,255,0.02)] rounded-[16px] border border-[rgba(255,255,255,0.3)]">
                  <p className="text-[10px] font-black text-[#a1a4a5] uppercase tracking-wider mb-1">{t('kb.table.date')}</p>
                  <p className="text-xs font-bold text-[#f0f0f0]">{selectedUpload.date}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-[16px] border-blue-100">
                <div className="flex items-start gap-3">
                  <Database size={18} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-900">{t('kb.upload.target')}</p>
                    <p className="text-xs text-blue-700 mt-1">Product Documentation</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[rgba(255,255,255,0.3)] bg-[#000000] flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handlePreview(selectedUpload);
                }}
                className="px-6 py-2.5 text-sm font-bold border border-[rgba(255,255,255,0.3)] text-[#a1a4a5] hover:bg-[rgba(255,255,255,0.05)] rounded-[12px] transition-colors"
              >
                {t('kb.preview')}
              </button>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold bg-[#ffffff] text-[#000000] hover:bg-[#f0f0f0] rounded-[12px] transition-colors shadow-md shadow-black/40 shadow-primary/20"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && previewData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.3)] shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#f0f0f0]">{t('kb.preview')}</h3>
                <p className="text-xs text-[#a1a4a5] mt-0.5">{previewData.name}</p>
              </div>
              <button 
                onClick={closePreview}
                className="text-[#a1a4a5] hover:text-[#a1a4a5] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-[rgba(255,255,255,0.02)] relative">
              {isPreviewLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#000000]/50 backdrop-blur-sm z-10">
                  <Loader2 size={40} className="text-[#3b9eff] animate-spin mb-4" />
                  <p className="text-sm font-bold text-[#a1a4a5]">Preparing preview...</p>
                </div>
              ) : null}

              <div className="h-full overflow-y-auto p-6 scrollbar-hide">
                {previewData.pdfPages ? (
                  <div className="flex flex-col gap-6 items-center">
                    {previewData.pdfPages.map((pageData, i) => (
                      <div key={i} className="bg-[#000000] shadow-md shadow-black/40 border border-[rgba(255,255,255,0.3)] rounded-sm overflow-hidden max-w-full">
                        <img 
                          src={pageData} 
                          alt={`Page ${i + 1}`} 
                          className="max-w-full h-auto"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                    {previewData.pdfPages.length === 5 && (
                      <p className="text-xs text-[#a1a4a5] py-4 italic">
                        Preview limited to first 5 pages.
                      </p>
                    )}
                  </div>
                ) : previewData.url ? (
                  <iframe 
                    src={previewData.url} 
                    className="w-full h-full rounded-[16px] border border-[rgba(255,255,255,0.3)] bg-[#000000] shadow-md shadow-black/40"
                    title="PDF Preview"
                  />
                ) : previewData.content ? (
                  <div className="bg-[#000000] p-8 rounded-[16px] border border-[rgba(255,255,255,0.3)] shadow-md shadow-black/40 min-h-full prose prose-slate max-w-none">
                    {previewData.type === 'DOCX' ? (
                      <div dangerouslySetInnerHTML={{ __html: previewData.content }} />
                    ) : (
                      <pre className="text-sm text-[#f0f0f0] font-sans whitespace-pre-wrap leading-relaxed">
                        {previewData.content}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-[rgba(255,255,255,0.05)] rounded-full flex items-center justify-center mb-4 text-[#a1a4a5]">
                      <FileCode size={32} />
                    </div>
                    <p className="text-[#a1a4a5] font-medium">{t('kb.preview_not_available')}</p>
                    <p className="text-xs text-[#a1a4a5] mt-2 max-w-xs">
                      {previewData.type === 'PDF' || previewData.type === 'DOCX' 
                        ? 'Preview is only available for files uploaded in this session. Mock data files cannot be previewed.' 
                        : 'This file type is not supported for instant preview.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[rgba(255,255,255,0.3)] bg-[#000000] flex justify-end shrink-0">
              <button 
                onClick={closePreview}
                className="px-6 py-2.5 text-sm font-bold bg-[#ffffff] text-[#000000] hover:bg-[#f0f0f0] rounded-md transition-colors shadow-md shadow-black/40 shadow-primary/20"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`size-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.type.startsWith('delete') ? 'bg-[#ff0000]/10 text-[#ff0000]' : 'bg-[rgba(59,158,255,0.1)] text-[#3b9eff]'}`}>
                {confirmModal.type.startsWith('delete') ? <Trash2 size={32} /> : <AlertCircle size={32} />}
              </div>
              <h3 className="text-xl font-black text-[#f0f0f0] mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-[#a1a4a5] leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="p-6 border-t border-[rgba(255,255,255,0.3)] bg-[#000000] flex gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 text-sm font-bold bg-[#000000] border border-[rgba(255,255,255,0.3)] text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.02)] hover:text-[#f0f0f0] rounded-md transition-all"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={confirmModal.type.startsWith('delete') ? executeDelete : executeSave}
                className={`flex-1 py-2.5 text-sm font-bold text-white rounded-md transition-colors shadow-md shadow-black/40 ${
                  confirmModal.type.startsWith('delete') 
                    ? 'bg-[#ff0000] text-[#000000] hover:bg-[#ff0000]/90 shadow-black/40' 
                    : 'bg-[#ffffff] text-[#000000] hover:bg-[#e0e0e0] shadow-primary/20'
                }`}
              >
                {confirmModal.type.startsWith('delete') ? t('common.delete') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
