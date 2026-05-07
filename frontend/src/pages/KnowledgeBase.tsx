import React, { useEffect, useRef, useState } from 'react';
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
import {
  listKnowledgeBases,
  listDocuments,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  uploadDocument,
  deleteDocument,
  reprocessDocument,
  previewDocument,
  type KnowledgeBaseResponse,
  type DocumentResponse,
} from '../api/knowledge-base';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type SourceItem = {
  id: string;
  name: string;
  desc: string;
  status: 'synced' | 'live sync' | 'idle';
  count: string;
  time: string;
  icon: typeof FileText;
  color: string;
};

type UploadItem = {
  id: string;
  name: string;
  type: string;
  status: 'Completed' | 'Processing' | 'Failed';
  size: string;
  date: string;
  color: string;
  previewContent: string | null;
  fileObject?: File;
};

const initialSources: SourceItem[] = [];
const recentUploads: UploadItem[] = [];

export default function KnowledgeBase() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<'overview' | 'manage'>('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingKbId, setEditingKbId] = useState<string | null>(null);

  const [sources, setSources] = useState<SourceItem[]>(initialSources);
  const [uploads, setUploads] = useState<UploadItem[]>(recentUploads);
  const [selectedKbForUpload, setSelectedKbForUpload] = useState('');
  const [isLoadingKb, setIsLoadingKb] = useState(false);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<UploadItem | null>(null);
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

  const formatTimeAgo = (value?: string) => {
    if (!value) {
      return 'Just now';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) {
      return '0 KB';
    }
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const mapDocumentType = (filename: string, contentType?: string) => {
    if (contentType?.includes('pdf') || filename.toLowerCase().endsWith('.pdf')) {
      return 'PDF';
    }
    if (contentType?.includes('word') || filename.toLowerCase().endsWith('.docx')) {
      return 'DOCX';
    }
    if (contentType?.includes('text') || filename.toLowerCase().endsWith('.txt')) {
      return 'TXT';
    }
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const mapDocumentStatus = (status: DocumentResponse['status']): UploadItem['status'] => {
    if (status === 'PROCESSED') return 'Completed';
    if (status === 'FAILED') return 'Failed';
    return 'Processing';
  };

  const loadKnowledgeBases = async () => {
    setIsLoadingKb(true);
    try {
      const knowledgeBases = await listKnowledgeBases();

      const countMap = new Map<string, number>();
      await Promise.all(
        knowledgeBases.map(async (kb) => {
          try {
            const docs = await listDocuments(kb.id);
            countMap.set(kb.id, docs.length);
          } catch {
            countMap.set(kb.id, 0);
          }
        })
      );

      const mapped: SourceItem[] = knowledgeBases.map((kb) => ({
        id: kb.id,
        name: kb.name,
        desc: kb.description || 'No description',
        status: 'synced',
        count: `${countMap.get(kb.id) || 0} Docs`,
        time: formatTimeAgo(kb.createdAt),
        icon: FileText,
        color: 'blue',
      }));

      setSources(mapped);

      if (!mapped.some((item) => item.id === selectedKbForUpload)) {
        setSelectedKbForUpload(mapped[0]?.id || '');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tải được danh sách kho tri thức.';
      showToast(message, 'error');
      setSources([]);
      setSelectedKbForUpload('');
    } finally {
      setIsLoadingKb(false);
    }
  };

  const loadDocumentsByKb = async (knowledgeBaseId: string) => {
    if (!knowledgeBaseId) {
      setUploads([]);
      return;
    }

    setIsLoadingUploads(true);
    try {
      const documents = await listDocuments(knowledgeBaseId);

      const mapped: UploadItem[] = (documents || []).map((doc) => {
        const type = mapDocumentType(doc.filename, doc.contentType);
        const status = mapDocumentStatus(doc.status);
        return {
          id: doc.id,
          name: doc.filename,
          type,
          status,
          size: formatFileSize(doc.size),
          date: doc.createdAt
            ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A',
          color: type === 'PDF' ? 'text-[#ff0000]' : type === 'DOCX' ? 'text-blue-500' : 'text-[#a1a4a5]',
          previewContent: null,
        };
      });

      setUploads(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tải được danh sách tài liệu.';
      showToast(message, 'error');
      setUploads([]);
    } finally {
      setIsLoadingUploads(false);
    }
  };

  useEffect(() => {
    void loadKnowledgeBases();
  }, []);

  useEffect(() => {
    void loadDocumentsByKb(selectedKbForUpload);
  }, [selectedKbForUpload]);

  useEffect(() => {
    setCurrentPage(1);
  }, [uploads.length]);

  const handleRefreshUploads = async () => {
    setIsRefreshing(true);
    await loadDocumentsByKb(selectedKbForUpload);
    setIsRefreshing(false);
  };

  const totalPages = Math.ceil(uploads.length / itemsPerPage);
  const paginatedUploads = uploads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const openDeleteUploadConfirmation = (upload: UploadItem) => {
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
      targetUploadId: upload.id,
      targetName: upload.name,
    });
  };

  const handleViewDetails = (upload: UploadItem) => {
    setSelectedUpload(upload);
    setIsDetailsModalOpen(true);
  };

  const handlePreview = async (file: UploadItem) => {
    setIsPreviewLoading(true);
    setIsPreviewModalOpen(true);
    
    try {
      if (file.type === 'TXT') {
        if (file.previewContent) {
          setPreviewData({
            name: file.name,
            type: file.type,
            content: file.previewContent,
          });
        } else {
          const content = await previewDocument(file.id);
          setPreviewData({
            name: file.name,
            type: file.type,
            content: content || 'No content available.',
          });
        }
      } else if (file.type === 'PDF') {
        if (file.fileObject) {
          const arrayBuffer = await file.fileObject.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          const pages: string[] = [];
          const numPages = Math.min(pdf.numPages, 5);
          
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            if (context) {
              await page.render({ canvasContext: context, canvas, viewport }).promise;
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
      const message = error instanceof Error ? error.message : 'Lỗi tải nội dung xem trước.';
      setPreviewData({
        name: file.name,
        type: file.type,
        content: message
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

  const handleResyncUpload = async (uploadId: string) => {
    try {
      await reprocessDocument(uploadId);
      await loadDocumentsByKb(selectedKbForUpload);
      showToast(t('status.completed'), 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đồng bộ lại tài liệu thất bại.';
      showToast(message, 'error');
    }
  };
  
  const [kbName, setKbName] = useState('');
  const [kbDesc, setKbDesc] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'edit' | 'delete_upload';
    title: string;
    message: React.ReactNode;
    targetKbId?: string;
    targetName?: string;
    targetUploadId?: string;
  }>({ isOpen: false, type: 'delete', title: '', message: '' });

  const openCreateModal = () => {
    setFormMode('create');
    setEditingKbId(null);
    setKbName('');
    setKbDesc('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (source: SourceItem) => {
    setFormMode('edit');
    setEditingKbId(source.id);
    setKbName(source.name);
    setKbDesc(source.desc);
    setIsCreateModalOpen(true);
  };

  const handleDeleteClick = (source: SourceItem) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      title: t('kb.confirm.delete.title'),
      message: (
        <>
          {t('kb.confirm.delete.msg')} <span className="font-bold text-[#f0f0f0]">"{source.name}"</span>?
          <br />
          <span className="text-[#ff0000] font-medium mt-2 block">
            {t('kb.confirm.delete.undone')}
          </span>
        </>
      ),
      targetKbId: source.id,
      targetName: source.name,
    });
  };

  const executeDelete = async () => {
    if (confirmModal.type === 'delete_upload') {
      if (confirmModal.targetUploadId) {
        try {
          await deleteDocument(confirmModal.targetUploadId);
          await loadDocumentsByKb(selectedKbForUpload);
          await loadKnowledgeBases();
          showToast(t('toast.kb_deleted'), 'success');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Xóa tài liệu thất bại.';
          showToast(message, 'error');
        }
      }
      } else {
        if (confirmModal.targetKbId) {
          try {
            const deletingSelected = selectedKbForUpload === confirmModal.targetKbId;
            await deleteKnowledgeBase(confirmModal.targetKbId);
            await loadKnowledgeBases();
            if (deletingSelected) {
              setSelectedKbForUpload('');
              setUploads([]);
            }
            showToast(t('toast.kb_deleted'), 'success');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Xóa kho tri thức thất bại.';
            showToast(message, 'error');
        }
      }
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveClick = async () => {
    if (!kbName.trim()) return;
    if (formMode === 'edit') {
      const editingName = sources.find((s) => s.id === editingKbId)?.name || kbName;
      setConfirmModal({
        isOpen: true,
        type: 'edit',
        title: t('kb.confirm.edit.title'),
        message: (
          <>
            {t('kb.confirm.edit.msg')} <span className="font-bold text-[#f0f0f0]">"{editingName}"</span>?
          </>
        ),
      });
    } else {
      await executeSave();
    }
  };

  const executeSave = async () => {
    try {
      const requestBody = { name: kbName.trim(), description: kbDesc.trim() };

      if (formMode === 'create') {
        const newKb = await createKnowledgeBase(requestBody);
        await loadKnowledgeBases();
        if (newKb?.id) {
          setSelectedKbForUpload(newKb.id);
          await loadDocumentsByKb(newKb.id);
        }
      } else if (editingKbId) {
        await updateKnowledgeBase(editingKbId, requestBody);
        await loadKnowledgeBases();
      }

      showToast(
        formMode === 'create' ? t('toast.kb_created') : (t('toast.kb_updated') || 'Knowledge base updated successfully!'),
        'success'
      );
      setIsCreateModalOpen(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lưu kho tri thức thất bại.';
      showToast(message, 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!selectedKbForUpload) {
      showToast('Please select a knowledge base first.', 'error');
      return;
    }

    const file = files[0];
    try {
      await uploadDocument(selectedKbForUpload, file);

      await loadDocumentsByKb(selectedKbForUpload);
      await loadKnowledgeBases();
      showToast(t('toast.file_uploaded') || 'Tải tệp lên thành công!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tải tệp lên thất bại.';
      showToast(message, 'error');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {currentView === 'manage' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto relative">
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
              {isLoadingKb ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`kb-skeleton-${idx}`} className="p-4 border border-[rgba(255,255,255,0.3)] rounded-[16px] animate-pulse">
                    <div className="h-4 w-1/3 bg-[rgba(255,255,255,0.08)] rounded mb-3"></div>
                    <div className="h-3 w-2/3 bg-[rgba(255,255,255,0.06)] rounded mb-2"></div>
                    <div className="h-3 w-1/5 bg-[rgba(255,255,255,0.06)] rounded"></div>
                  </div>
                ))
              ) : sources.length === 0 ? (
                <div className="text-center py-12">
                  <Database size={48} className="mx-auto text-[rgba(255,255,255,0.3)] mb-4" />
                  <p className="text-[#a1a4a5] font-medium">{t('kb.no_sources')}</p>
                </div>
              ) : (
                sources.map(source => (
                  <div key={source.id} className="flex items-center justify-between p-4 bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[16px] hover:border-primary/30 hover:shadow-md shadow-black/40 transition-all">
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
                        onClick={() => handleDeleteClick(source)} 
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

          {}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-[#f0f0f0]">{t('kb.sources.title')}</h3>
              <button onClick={() => setCurrentView('manage')} className="text-[#3b9eff] text-sm font-semibold hover:underline">{t('dashboard.view_all')}</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingKb ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`overview-kb-skeleton-${idx}`} className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] p-5 animate-pulse">
                    <div className="h-24 bg-[rgba(255,255,255,0.05)] rounded-[12px] mb-4"></div>
                    <div className="h-4 w-2/3 bg-[rgba(255,255,255,0.08)] rounded mb-2"></div>
                    <div className="h-3 w-full bg-[rgba(255,255,255,0.06)] rounded mb-1"></div>
                    <div className="h-3 w-5/6 bg-[rgba(255,255,255,0.06)] rounded"></div>
                  </div>
                ))
              ) : (
                sources.slice(0, 3).map((source) => (
                <div key={source.id} className="bg-[#000000] rounded-[16px] border border-[rgba(255,255,255,0.3)] overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-32 bg-[rgba(255,255,255,0.02)] flex items-center justify-center relative">
                    <source.icon size={48} className="text-[#3b9eff]/20 group-hover:scale-110 transition-transform" />
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(source)}
                        className="p-2 text-[#3b9eff] hover:bg-[rgba(59,158,255,0.08)] rounded-[12px] transition-colors"
                        title="Edit"
                        type="button"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(source)}
                        className="p-2 text-[#ff0000] hover:bg-[#ff0000]/10 rounded-[12px] transition-colors"
                        title="Delete"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
              )))}
            </div>
          </section>

          {}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h3 className="text-base font-bold text-[#f0f0f0]">{t('kb.upload.title')}</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-[#f0f0f0]">{t('kb.upload.target')}:</label>
                <select 
                  value={selectedKbForUpload}
                  onChange={(e) => setSelectedKbForUpload(e.target.value)}
                  disabled={isLoadingKb || sources.length === 0}
                  className="bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[12px] px-3 py-2 text-sm font-medium outline-none"
                >
                  {sources.length === 0 && (
                    <option value="" className="bg-[#000000] text-[#f0f0f0]">No knowledge base</option>
                  )}
                  {sources.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#000000] text-[#f0f0f0]">{s.name}</option>
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

          {}
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
                    {isLoadingUploads ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <tr key={`doc-skeleton-${idx}`} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-40 bg-[rgba(255,255,255,0.08)] rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-12 bg-[rgba(255,255,255,0.08)] rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-24 bg-[rgba(255,255,255,0.08)] rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-16 bg-[rgba(255,255,255,0.08)] rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-20 bg-[rgba(255,255,255,0.08)] rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-16 ml-auto bg-[rgba(255,255,255,0.08)] rounded"></div></td>
                        </tr>
                      ))
                    ) : paginatedUploads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#a1a4a5]">
                          {t('kb.no_sources')}
                        </td>
                      </tr>
                    ) : paginatedUploads.map((file, idx) => (
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
                                onClick={() => handleResyncUpload(file.id)}
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
                              onClick={() => openDeleteUploadConfirmation(file)}
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
      {}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[rgba(44,44,46,0.48)] backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[rgba(44,44,46,0.92)] border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl shadow-black/35 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.08)]">
              <h3 className="text-lg font-bold text-[#ffffff]">
                {formMode === 'create' ? t('kb.modal.create') : t('kb.modal.edit')}
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[rgba(255,255,255,0.7)] hover:text-[#ffffff] p-1 rounded-md hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#ffffff]">{t('kb.modal.name')}</label>
                <input 
                  type="text" 
                  value={kbName}
                  onChange={(e) => setKbName(e.target.value)}
                  placeholder={t('kb.modal.name_placeholder')} 
                  className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-[8px] px-4 py-2.5 text-sm text-[#ffffff] focus:border-white focus:ring-2 focus:ring-white/30 outline-none transition-all placeholder:text-[rgba(255,255,255,0.5)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#ffffff]">{t('kb.modal.desc')}</label>
                <textarea 
                  value={kbDesc}
                  onChange={(e) => setKbDesc(e.target.value)}
                  placeholder={t('kb.modal.desc_placeholder')} 
                  rows={3}
                  className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-[8px] px-4 py-2.5 text-sm text-[#ffffff] focus:border-white focus:ring-2 focus:ring-white/30 outline-none transition-all resize-none placeholder:text-[rgba(255,255,255,0.5)]"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(44,44,46,0.92)] flex gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-bold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ffffff] rounded-md transition-all"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSaveClick}
                disabled={!kbName.trim()}
                className="flex-1 py-2.5 text-sm font-bold bg-[#ffffff] text-[#000000] hover:bg-[#f0f0f0] rounded-md transition-colors shadow-md shadow-black/40 shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formMode === 'create' ? t('common.create') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {isDetailsModalOpen && selectedUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[rgba(44,44,46,0.48)] backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[rgba(44,44,46,0.92)] border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl shadow-black/35 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.08)]">
              <h3 className="text-lg font-bold text-[#ffffff]">{t('common.view_details')}</h3>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-[rgba(255,255,255,0.7)] hover:text-[#ffffff] p-1 rounded-md hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[rgba(255,255,255,0.04)] rounded-[16px] border border-[rgba(255,255,255,0.08)]">
                <div className={cn("w-12 h-12 rounded-[12px] bg-[rgba(255,255,255,0.06)] flex items-center justify-center", selectedUpload.color)}>
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#f0f0f0] truncate">{selectedUpload.name}</p>
                  <p className="text-xs text-[#a1a4a5]">{selectedUpload.type} • {selectedUpload.size}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[rgba(255,255,255,0.04)] rounded-[16px] border border-[rgba(255,255,255,0.08)]">
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
                <div className="p-3 bg-[rgba(255,255,255,0.04)] rounded-[16px] border border-[rgba(255,255,255,0.08)]">
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
            <div className="p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(44,44,46,0.92)] flex gap-3">
              <button 
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handlePreview(selectedUpload);
                }}
                className="flex-1 py-2.5 text-sm font-bold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ffffff] rounded-md transition-all"
              >
                {t('kb.preview')}
              </button>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-bold bg-[#ffffff] text-[#000000] hover:bg-[#f0f0f0] rounded-[12px] transition-colors shadow-md shadow-black/40 shadow-primary/20"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {isPreviewModalOpen && previewData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[rgba(44,44,46,0.48)] backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[rgba(44,44,46,0.92)] border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl shadow-black/35 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.08)] shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#ffffff]">{t('kb.preview')}</h3>
                <p className="text-xs text-[#a1a4a5] mt-0.5">{previewData.name}</p>
              </div>
              <button 
                onClick={closePreview}
                className="text-[rgba(255,255,255,0.7)] hover:text-[#ffffff] p-1 rounded-md hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-[rgba(255,255,255,0.04)] relative">
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
                      <div key={i} className="bg-[rgba(255,255,255,0.04)] shadow-md shadow-black/30 border border-[rgba(255,255,255,0.08)] rounded-sm overflow-hidden max-w-full">
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
                    className="w-full h-full rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] shadow-md shadow-black/30"
                    title="PDF Preview"
                  />
                ) : previewData.content ? (
                  <div className="bg-[rgba(255,255,255,0.04)] p-8 rounded-[16px] border border-[rgba(255,255,255,0.08)] shadow-md shadow-black/30 min-h-full prose prose-slate max-w-none">
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
            <div className="p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(44,44,46,0.92)] flex justify-end shrink-0">
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

      {}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[rgba(44,44,46,0.48)] backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[rgba(44,44,46,0.92)] border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-2xl shadow-black/35 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
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
            <div className="p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(44,44,46,0.92)] flex gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 text-sm font-bold bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ffffff] rounded-md transition-all"
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
