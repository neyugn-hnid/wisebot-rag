import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChevronRight,
  ChevronDown,
  Check
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
import {
  getMySubscription,
  listPlans,
  type BillingPlanResponse,
  type SubscriptionResponse,
} from '../api/billing';
import DeleteModal from '../components/DeleteModal';

// Set up PDF.js worker
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

type UploadFilter = 'all' | 'Completed' | 'Processing' | 'Failed';

const initialSources: SourceItem[] = [];
const recentUploads: UploadItem[] = [];

export default function KnowledgeBase() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'overview' | 'manage'>('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingKbId, setEditingKbId] = useState<string | null>(null);

  const [sources, setSources] = useState<SourceItem[]>(initialSources);
  const [knowledgeBaseLimit, setKnowledgeBaseLimit] = useState<number>(1);
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
  const [uploadSearch, setUploadSearch] = useState('');
  const [uploadFilter, setUploadFilter] = useState<UploadFilter>('all');
  const [isKbDropdownOpen, setIsKbDropdownOpen] = useState(false);
  const [isUploadFilterOpen, setIsUploadFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kbDropdownRef = useRef<HTMLDivElement>(null);
  const uploadFilterRef = useRef<HTMLDivElement>(null);

  const knowledgeBaseLimitReached = knowledgeBaseLimit >= 0 && sources.length >= knowledgeBaseLimit;
  const selectedSource = sources.find((source) => source.id === selectedKbForUpload) || null;
  const uploadFilterOptions: Array<{ id: UploadFilter; label: string }> = [
    { id: 'all', label: t('kb.recent.filter_all') },
    { id: 'Completed', label: t('kb.recent.filter_completed') },
    { id: 'Processing', label: t('kb.recent.filter_processing') },
    { id: 'Failed', label: t('kb.recent.filter_failed') },
  ];
  const uploadFilterLabel = uploadFilterOptions.find((item) => item.id === uploadFilter)?.label || t('kb.recent.filter_all');
  const kbDropdownLabel = isLoadingKb
    ? t('common.processing')
    : selectedSource?.name || t('kb.upload.none');
  const resolveKnowledgeBaseLimit = (plans: BillingPlanResponse[], subscription: SubscriptionResponse | null) => {
    if (!subscription) {
      return 1;
    }
    const plan = plans.find((item) => item.id === subscription.planId);
    const planCode = (plan?.code || '').toLowerCase();
    if (planCode === 'pro') {
      return -1;
    }
    if (planCode === 'plus') {
      return 5;
    }
    return 1;
  };

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
          color: type === 'PDF' ? 'text-[#d7d9da]' : type === 'DOCX' ? 'text-[#9ed1ff]' : 'text-[#a1a4a5]',
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
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (kbDropdownRef.current && !kbDropdownRef.current.contains(targetNode)) {
        setIsKbDropdownOpen(false);
      }
      if (uploadFilterRef.current && !uploadFilterRef.current.contains(targetNode)) {
        setIsUploadFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadBillingLimit() {
      try {
        const [plans, subscription] = await Promise.all([
          listPlans().catch(() => [] as BillingPlanResponse[]),
          getMySubscription().catch(() => null as SubscriptionResponse | null),
        ]);
        if (!cancelled) {
          setKnowledgeBaseLimit(resolveKnowledgeBaseLimit(plans, subscription));
        }
      } catch {
        if (!cancelled) {
          setKnowledgeBaseLimit(1);
        }
      }
    }

    void loadBillingLimit();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadDocumentsByKb(selectedKbForUpload);
  }, [selectedKbForUpload]);

  useEffect(() => {
    setCurrentPage(1);
  }, [uploads.length, uploadSearch, uploadFilter]);

  const handleRefreshUploads = async () => {
    setIsRefreshing(true);
    await loadDocumentsByKb(selectedKbForUpload);
    setIsRefreshing(false);
  };

  const filteredUploads = uploads.filter((file) => {
    const matchesStatus = uploadFilter === 'all' || file.status === uploadFilter;
    const keyword = uploadSearch.trim().toLowerCase();
    const matchesSearch = keyword.length === 0
      || file.name.toLowerCase().includes(keyword)
      || file.type.toLowerCase().includes(keyword);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredUploads.length / itemsPerPage);
  const paginatedUploads = filteredUploads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const openDeleteUploadConfirmation = (upload: UploadItem) => {
    setDeleteModal({
      isOpen: true,
      type: 'upload',
      title: t('kb.confirm.delete.title'),
      description: `${t('kb.confirm.delete.msg')} "${upload.name}"?`,
      targetId: upload.id,
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
  
  // Form state
  const [kbName, setKbName] = useState('');
  const [kbDesc, setKbDesc] = useState('');
  const [kbFormErrors, setKbFormErrors] = useState<{ name?: string }>({});
  const [kbFormTouched, setKbFormTouched] = useState<{ name?: boolean }>({});

  const validateKnowledgeBaseName = (value: string) => {
    if (!value.trim()) {
      return t('validation.required');
    }
    if (value.trim().length < 2) {
      return t('validation.name_min').replace('{min}', '2');
    }
    return undefined;
  };

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'knowledge_base' | 'upload';
    title: string;
    description: string;
    targetId?: string;
    targetName?: string;
  }>({
    isOpen: false,
    type: 'knowledge_base',
    title: '',
    description: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreateModal = () => {
    if (knowledgeBaseLimitReached) {
      navigate('/billing/upgrade', { state: { from: 'knowledge-base-limit' } });
      return;
    }
    setFormMode('create');
    setEditingKbId(null);
    setKbName('');
    setKbDesc('');
    setKbFormErrors({});
    setKbFormTouched({});
    setIsCreateModalOpen(true);
  };

  const openEditModal = (source: SourceItem) => {
    setFormMode('edit');
    setEditingKbId(source.id);
    setKbName(source.name);
    setKbDesc(source.desc);
    setKbFormErrors({});
    setKbFormTouched({});
    setIsCreateModalOpen(true);
  };

  const handleDeleteClick = (source: SourceItem) => {
    setDeleteModal({
      isOpen: true,
      type: 'knowledge_base',
      title: t('kb.confirm.delete.title'),
      description: `${t('kb.confirm.delete.msg')} "${source.name}"?`,
      targetId: source.id,
      targetName: source.name,
    });
  };

  const executeDelete = async () => {
    if (!deleteModal.targetId || isDeleting) return;

    setIsDeleting(true);
    try {
      if (deleteModal.type === 'upload') {
        await deleteDocument(deleteModal.targetId);
        await loadDocumentsByKb(selectedKbForUpload);
        await loadKnowledgeBases();
        showToast(t('toast.kb_deleted'), 'success');
      } else {
        const deletingSelected = selectedKbForUpload === deleteModal.targetId;
        await deleteKnowledgeBase(deleteModal.targetId);
        await loadKnowledgeBases();
        if (deletingSelected) {
          setSelectedKbForUpload('');
          setUploads([]);
        }
        showToast(t('toast.kb_deleted'), 'success');
      }
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      const fallback = deleteModal.type === 'upload' ? 'Xóa tài liệu thất bại.' : 'Xóa kho tri thức thất bại.';
      const message = error instanceof Error ? error.message : fallback;
      showToast(message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveClick = async () => {
    const nameError = validateKnowledgeBaseName(kbName);
    setKbFormErrors({ name: nameError });
    setKbFormTouched({ name: true });
    if (nameError) return;
    if (formMode === 'create' && knowledgeBaseLimitReached) {
      showToast(`Gói hiện tại chỉ cho phép tạo tối đa ${knowledgeBaseLimit} cơ sở tri thức. Vui lòng nâng cấp gói để tạo thêm.`, 'error');
      return;
    }
    await executeSave();
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
      setKbFormErrors({});
      setKbFormTouched({});
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

    // Reset input
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
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-[#f0f0f0]">{t('kb.manage.title')}</h2>
                  <p className="text-sm text-[#8b8f91] max-w-2xl">{t('kb.manage.helper')}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                if (knowledgeBaseLimitReached) {
                  navigate('/billing/upgrade', { state: { from: 'knowledge-base-limit' } });
                  return;
                }
                openCreateModal();
              }}
              className="bg-[#ffffff] text-[#000000] px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-[#f0f0f0] transition-all shadow-md shadow-black/40 shadow-primary/20"
            >
              <PlusCircle size={18} />
              {knowledgeBaseLimitReached ? (t('billing.upgrade') || 'Nâng cấp gói') : t('kb.create')}
            </button>
          </div>

          {knowledgeBaseLimitReached && (
            <div className="rounded-[16px] border border-[rgba(255,189,89,0.18)] bg-[rgba(255,189,89,0.07)] p-4 text-sm text-[#f0d39c]">
              <p className="font-semibold">{t('kb.limit.reached')}</p>
              <p className="mt-2 text-xs text-[#d8bd8a]">{t('kb.limit.desc')}</p>
            </div>
          )}

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
                  <p className="mt-2 text-sm text-[#7d8183]">{t('kb.empty.cta')}</p>
                </div>
              ) : (
                sources.map(source => (
                  <div key={source.id} className="flex flex-col gap-4 p-5 bg-[#000000] border border-[rgba(255,255,255,0.3)] rounded-[20px] hover:border-[rgba(59,158,255,0.28)] hover:shadow-md shadow-black/40 transition-all md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-[12px] bg-[rgba(255,255,255,0.02)] flex items-center justify-center text-[#3b9eff] shrink-0">
                        <source.icon size={24} />
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-bold text-[#f0f0f0] text-sm">{source.name}</h4>
                          <p className="text-xs text-[#a1a4a5] mt-0.5 line-clamp-2">{source.desc}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#a1a4a5]">
                            <FileText size={10} /> {source.count}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#7d8183]">
                            <Clock size={11} /> {source.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedKbForUpload(source.id);
                          setCurrentView('overview');
                        }}
                        className="rounded-[12px] border border-[rgba(255,255,255,0.12)] px-3 py-2 text-xs font-semibold text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                      >
                        {t('kb.upload.title')}
                      </button>
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
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#9fa3a5]">
                <Database size={13} />
                {t('kb.hero.badge')}
              </div>
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
                    <div className="relative h-32 bg-[linear-gradient(180deg,rgba(59,158,255,0.12),rgba(255,255,255,0.02))] flex items-center justify-center">
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
                    <button
                      onClick={() => setSelectedKbForUpload(source.id)}
                      className="mt-4 inline-flex items-center gap-2 rounded-[12px] border border-[rgba(255,255,255,0.12)] px-3 py-2 text-xs font-semibold text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                    >
                      <UploadCloud size={14} />
                      {t('kb.upload.title')}
                    </button>
                  </div>
                </div>
              )))}
            </div>
          </section>

          {/* Upload Area */}
          <section>
            <div className="rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[radial-gradient(circle_at_top,rgba(59,158,255,0.08),transparent_28%),#050505] p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#f0f0f0]">{t('kb.upload.title')}</h3>
                  <p className="mt-1 text-sm text-[#8b8f91]">{t('kb.upload.helper')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold text-[#f0f0f0]">{t('kb.upload.target')}:</label>
                  <div ref={kbDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isLoadingKb && sources.length > 0) {
                          setIsKbDropdownOpen((prev) => !prev);
                        }
                      }}
                      disabled={isLoadingKb || sources.length === 0}
                      className="flex min-w-[220px] items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-left text-sm text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-[rgba(59,158,255,0.24)] disabled:cursor-not-allowed disabled:text-[#a1a4a5] disabled:opacity-70"
                    >
                      <span className="min-w-0 truncate">{kbDropdownLabel}</span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "shrink-0 text-[#8d9295] transition-transform",
                          isKbDropdownOpen ? "rotate-180" : ""
                        )}
                      />
                    </button>

                    {isKbDropdownOpen && sources.length > 0 ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKbForUpload('');
                            setIsKbDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                            !selectedKbForUpload
                              ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                              : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                          )}
                        >
                          <span className="truncate">{t('kb.upload.none')}</span>
                          {!selectedKbForUpload ? <Check size={15} className="text-[#3b9eff]" /> : null}
                        </button>
                        <div className="mt-1 space-y-1">
                          {sources.map((source) => {
                            const isSelected = source.id === selectedKbForUpload;
                            return (
                              <button
                                key={source.id}
                                type="button"
                                onClick={() => {
                                  setSelectedKbForUpload(source.id);
                                  setIsKbDropdownOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                                  isSelected
                                    ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                                    : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                                )}
                              >
                                <span className="truncate">{source.name}</span>
                                {isSelected ? <Check size={15} className="text-[#3b9eff]" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.02)] p-10 text-center transition-all hover:border-[rgba(59,158,255,0.4)] hover:bg-[rgba(59,158,255,0.05)]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[8px] text-[#f0f0f0] text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-[#a1a4a5]/40"
                  accept=".pdf,.docx,.txt"
                />
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[rgba(59,158,255,0.08)] transition-all group-hover:scale-110 group-hover:bg-[rgba(59,158,255,0.14)]">
                  <UploadCloud size={32} className="text-[#3b9eff]" />
                </div>
                <h4 className="text-lg font-bold text-[#f0f0f0]">{t('kb.upload.drop')}</h4>
                <p className="mt-1 text-sm text-[#a1a4a5]">{t('kb.upload.limit')}</p>
                <button className="mt-6 rounded-md border border-[rgba(255,255,255,0.18)] px-6 py-2 text-sm font-semibold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.05)]">
                  {t('common.select')}
                </button>
              </div>
            </div>
          </section>

          {/* Recent Uploads Table */}
          <section>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
              <div className="w-full lg:w-[220px]">
                <h3 className="text-base font-bold text-[#f0f0f0]">{t('kb.recent.title')}</h3>
                {selectedSource ? (
                  <p className="mt-1 text-sm text-[#8b8f91] truncate">{selectedSource.name}</p>
                ) : null}
              </div>
              <div className="w-full lg:flex-1">
                <input
                  value={uploadSearch}
                  onChange={(e) => setUploadSearch(e.target.value)}
                  placeholder={t('kb.recent.search')}
                  className="w-full rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[#f0f0f0] outline-none transition-colors placeholder:text-[#7d8183] focus:border-[#ffffff] focus:ring-[#ffffff]"
                />
              </div>
              <div className="flex items-center gap-2 justify-start lg:justify-end">
                <div ref={uploadFilterRef} className="relative w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsUploadFilterOpen((prev) => !prev)}
                    className="flex w-full sm:min-w-[160px] items-center justify-between gap-3 rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-left text-sm text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)] focus:outline-none focus:ring-[#ffffff] focus:border-[#ffffff] disabled:cursor-not-allowed disabled:text-[#a1a4a5] disabled:opacity-70"
                  >
                    <span className="min-w-0 truncate">{uploadFilterLabel}</span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "shrink-0 text-[#8d9295] transition-transform",
                        isUploadFilterOpen ? "rotate-180" : ""
                      )}
                    />
                  </button>

                  {isUploadFilterOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#0b0b0c] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.42)]">
                      <div className="space-y-1">
                        {uploadFilterOptions.map((item) => {
                          const isSelected = item.id === uploadFilter;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setUploadFilter(item.id);
                                setIsUploadFilterOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm transition-colors",
                                isSelected
                                  ? "bg-[rgba(59,158,255,0.10)] text-[#f0f0f0]"
                                  : "text-[#c9cdcf] hover:bg-[rgba(255,255,255,0.05)]"
                              )}
                            >
                              <span className="truncate">{item.label}</span>
                              {isSelected ? <Check size={15} className="text-[#3b9eff]" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
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
            <div className="space-y-3 lg:hidden">
              {isLoadingUploads ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`doc-mobile-skeleton-${idx}`} className="rounded-[18px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] p-4 animate-pulse">
                    <div className="h-4 w-2/3 rounded bg-[rgba(255,255,255,0.08)]"></div>
                    <div className="mt-3 h-3 w-1/3 rounded bg-[rgba(255,255,255,0.06)]"></div>
                    <div className="mt-4 h-10 rounded bg-[rgba(255,255,255,0.05)]"></div>
                  </div>
                ))
              ) : paginatedUploads.length === 0 ? (
                <div className="rounded-[18px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-8 text-center text-sm text-[#a1a4a5]">
                  {t('kb.recent.empty')}
                </div>
              ) : paginatedUploads.map((file, idx) => (
                <div key={`${file.name}-mobile-${idx}`} className="rounded-[20px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[0_14px_32px_rgba(0,0,0,0.22)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className={file.color} />
                        <p className="truncate text-sm font-semibold text-[#f0f0f0]">{file.name}</p>
                      </div>
                      <p className="mt-2 text-xs text-[#8b8f91]">{file.type} • {file.size}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
                      file.status === 'Completed' ? 'text-[#84c5ff]' :
                      file.status === 'Processing' ? 'text-[#d7d9da]' : 'text-[#f0d39c]'
                    }`}>
                      {file.status === 'Completed' && <CheckCircle2 size={12} />}
                      {file.status === 'Processing' && <Loader2 size={12} className="animate-spin" />}
                      {file.status === 'Failed' && <AlertCircle size={12} />}
                      {file.status === 'Completed' ? t('status.completed') :
                       file.status === 'Processing' ? t('status.processing') : t('status.failed')}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-[#7d8183]">
                    <span>{file.date}</span>
                    <span className="truncate max-w-[45%]">{selectedSource?.name}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {file.status === 'Failed' && (
                      <button
                        onClick={() => handleResyncUpload(file.id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs font-semibold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                      >
                        <RefreshCw size={14} />
                        {t('common.retry')}
                      </button>
                    )}
                    <button
                      onClick={() => handlePreview(file)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-[rgba(255,255,255,0.12)] px-3 py-2 text-xs font-semibold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                    >
                      <Eye size={14} />
                      {t('kb.preview')}
                    </button>
                    <button
                      onClick={() => openDeleteUploadConfirmation(file)}
                      className="inline-flex items-center justify-center rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[#d7d9da] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#151517] border border-[rgba(255,255,255,0.3)] rounded-[16px] overflow-hidden shadow-md shadow-black/40">
              <div className="hidden overflow-x-auto max-h-[500px] overflow-y-auto lg:block">
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
                          {t('kb.recent.empty')}
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
                            ${file.status === 'Completed' ? 'text-[#84c5ff]' : 
                              file.status === 'Processing' ? 'text-[#d7d9da]' : 'text-[#f0d39c]'}`}>
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
                  {t('kb.table.showing')} {paginatedUploads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredUploads.length)} {t('kb.table.of')} {filteredUploads.length} {t('kb.table.docs')}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#000000]/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[#050505] shadow-[0_28px_90px_rgba(0,0,0,0.62)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[rgba(59,158,255,0.18)] bg-[rgba(59,158,255,0.08)] text-[#9ed1ff]">
                  <Database size={20} />
                </div>
                <h3 className="text-[22px] font-display font-medium tracking-tight text-[#f5f5f5]">
                  {formMode === 'create' ? t('kb.modal.create') : t('kb.modal.edit')}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setKbFormErrors({});
                  setKbFormTouched({});
                }}
                className="rounded-[12px] p-2 text-[#a1a4a5] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#ffffff]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="space-y-2">
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#a1a4a5]">{t('kb.modal.name')}</label>
                <input
                  type="text" 
                  value={kbName}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setKbName(nextValue);
                    if (kbFormTouched.name) {
                      setKbFormErrors({ name: validateKnowledgeBaseName(nextValue) });
                    }
                  }}
                  onBlur={() => {
                    setKbFormTouched({ name: true });
                    setKbFormErrors({ name: validateKnowledgeBaseName(kbName) });
                  }}
                  placeholder={t('kb.modal.name_placeholder')} 
                  className={cn(
                    'w-full rounded-[14px] border bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[#ffffff] outline-none transition-colors placeholder:text-[#a1a4a5]/40',
                    kbFormTouched.name && kbFormErrors.name
                      ? 'border-[#ff0000] focus:border-[#ff0000] focus:ring-2 focus:ring-[#ff0000]/20'
                      : 'border-[rgba(255,255,255,0.12)] focus:border-[#ffffff] focus:ring-1 focus:ring-[#ffffff]'
                  )}
                />
                {kbFormTouched.name && kbFormErrors.name ? (
                  <p className="text-[11px] font-medium text-[#ff0000]">{kbFormErrors.name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium tracking-[0.5px] text-[#a1a4a5]">{t('kb.modal.desc')}</label>
                <textarea
                  value={kbDesc}
                  onChange={(e) => setKbDesc(e.target.value)}
                  placeholder={t('kb.modal.desc_placeholder')} 
                  rows={3}
                  className="w-full resize-none rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[#ffffff] outline-none transition-colors placeholder:text-[#a1a4a5]/40 focus:border-[#ffffff] focus:ring-1 focus:ring-[#ffffff]"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-[rgba(255,255,255,0.08)] p-6">
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setKbFormErrors({});
                  setKbFormTouched({});
                }}
                className="flex-1 rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] py-3 text-sm font-semibold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.1)]"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSaveClick}
                className="flex-1 rounded-[14px] bg-[#ffffff] py-3 text-sm font-semibold text-[#000000] transition-colors hover:bg-[#ececec] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formMode === 'create' ? t('common.create') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#000000]/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[#050505] shadow-[0_28px_90px_rgba(0,0,0,0.62)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[rgba(59,158,255,0.18)] bg-[rgba(59,158,255,0.08)] text-[#9ed1ff]">
                  <FileText size={20} />
                </div>
                <h3 className="text-[22px] font-display font-medium tracking-tight text-[#f5f5f5]">{t('common.view_details')}</h3>
              </div>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="rounded-[12px] p-2 text-[#a1a4a5] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#ffffff]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 rounded-[18px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                <div className={cn("w-12 h-12 rounded-[14px] bg-[rgba(255,255,255,0.06)] flex items-center justify-center shadow-md shadow-black/40", selectedUpload.color)}>
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#f0f0f0] truncate">{selectedUpload.name}</p>
                  <p className="text-xs text-[#a1a4a5]">{selectedUpload.type} • {selectedUpload.size}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-3">
                  <p className="text-[10px] font-black text-[#a1a4a5] uppercase tracking-wider mb-1">{t('kb.table.status')}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      selectedUpload.status === 'Completed' ? "bg-[#84c5ff]" :
                      selectedUpload.status === 'Processing' ? "bg-[#d7d9da]" : "bg-[#f0d39c]"
                    )}></span>
                    <p className="text-xs font-bold text-[#f0f0f0]">{selectedUpload.status}</p>
                  </div>
                </div>
                <div className="rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-3">
                  <p className="text-[10px] font-black text-[#a1a4a5] uppercase tracking-wider mb-1">{t('kb.table.date')}</p>
                  <p className="text-xs font-bold text-[#f0f0f0]">{selectedUpload.date}</p>
                </div>
              </div>

              <div className="rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                <div className="flex items-start gap-3">
                  <Database size={18} className="mt-0.5 text-[#9ed1ff]" />
                  <div>
                    <p className="text-xs font-bold text-[#f0f0f0]">{t('kb.upload.target')}</p>
                    <p className="mt-1 text-xs text-[#a1a4a5]">{selectedSource?.name || t('kb.upload.none')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[rgba(255,255,255,0.08)] p-6">
              <button 
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handlePreview(selectedUpload);
                }}
                className="rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-6 py-2.5 text-sm font-semibold text-[#f0f0f0] transition-colors hover:bg-[rgba(255,255,255,0.1)]"
              >
                {t('kb.preview')}
              </button>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="rounded-[14px] bg-[#ffffff] px-6 py-2.5 text-sm font-semibold text-[#000000] transition-colors hover:bg-[#ececec]"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && previewData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#000000]/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[#050505] shadow-[0_28px_90px_rgba(0,0,0,0.62)] animate-in zoom-in-95 duration-200">
            <div className="flex shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-6">
              <div>
                <h3 className="text-[22px] font-display font-medium tracking-tight text-[#f5f5f5]">{t('kb.preview')}</h3>
                <p className="text-xs text-[#a1a4a5] mt-0.5">{previewData.name}</p>
              </div>
              <button 
                onClick={closePreview}
                className="rounded-[12px] p-2 text-[#a1a4a5] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[#ffffff]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative flex-1 overflow-hidden bg-[rgba(255,255,255,0.03)]">
              {isPreviewLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#000000]/50 backdrop-blur-sm z-10">
                  <Loader2 size={40} className="text-[#3b9eff] animate-spin mb-4" />
                  <p className="text-sm font-bold text-[#a1a4a5]">{t('kb.preview.loading')}</p>
                </div>
              ) : null}

              <div className="h-full overflow-y-auto p-6 scrollbar-hide">
                {previewData.pdfPages ? (
                  <div className="flex flex-col gap-6 items-center">
                    {previewData.pdfPages.map((pageData, i) => (
                      <div key={i} className="max-w-full overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-[#000000] shadow-md shadow-black/40">
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
                        {t('kb.preview.pdf_limit')}
                      </p>
                    )}
                  </div>
                ) : previewData.url ? (
                  <iframe 
                    src={previewData.url} 
                    className="h-full w-full rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#000000] shadow-md shadow-black/40"
                    title="PDF Preview"
                  />
                ) : previewData.content ? (
                  <div className="min-h-full max-w-none rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[#000000] p-8 shadow-md shadow-black/40 prose prose-slate">
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
                        ? t('kb.preview.session_only')
                        : t('kb.preview.unsupported_instant')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 justify-end border-t border-[rgba(255,255,255,0.08)] p-6">
              <button 
                onClick={closePreview}
                className="rounded-[14px] bg-[#ffffff] px-6 py-2.5 text-sm font-semibold text-[#000000] transition-colors hover:bg-[#ececec]"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
          }
        }}
        onConfirm={executeDelete}
        isDeleting={isDeleting}
        title={deleteModal.title}
        description={deleteModal.description}
        warningText={t('kb.confirm.delete.undone')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </>
  );
}
