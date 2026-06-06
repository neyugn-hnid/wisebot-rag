import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  MessageSquare, 
  ShieldAlert, 
  CreditCard, 
  Database,
  Globe,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import Logo from '../components/Logo';
import { cn } from '../lib/utils';

type FaqCategory = 'all' | 'data' | 'security' | 'billing' | 'general';

export default function Faq() {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated } = useRole();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setExpandedIndex(prev => prev === index ? null : index);
  };

  const faqData = {
    vi: [
      {
        category: 'data',
        q: 'Tôi có thể tải lên những định dạng tài liệu nào?',
        a: 'WiseBot hỗ trợ tải lên các tệp tin .pdf, .docx, .txt và .xlsx (tối đa 10MB mỗi tệp). Ngoài ra bạn cũng có thể nhúng đường dẫn website để hệ thống tự động crawl dữ liệu.'
      },
      {
        category: 'security',
        q: 'Dữ liệu tài liệu của tôi có được bảo mật không?',
        a: 'Hoàn toàn bảo mật. Dữ liệu của bạn được lưu trữ trong không gian biệt lập, được mã hóa khi truyền tải (SSL/TLS) và khi lưu giữ. Chúng tôi không sử dụng dữ liệu của bạn để làm dữ liệu huấn luyện công khai cho các mô hình LLM bên ngoài.'
      },
      {
        category: 'billing',
        q: 'Giới hạn tin nhắn của gói Miễn phí là gì?',
        a: 'Gói Miễn phí (Free) cho phép tạo 1 Chatbot RAG, nạp tối đa 10 tài liệu (dung lượng 100MB) và giới hạn 1,000 tin nhắn mỗi tháng. Để tăng giới hạn này, bạn có thể nâng cấp lên gói Plus hoặc Pro.'
      },
      {
        category: 'general',
        q: 'Làm thế nào để nhúng Chatbot trợ lý vào website của tôi?',
        a: 'Trong phần "Widget Customization", sau khi bạn bấm "Publish Changes" thành công, hệ thống sẽ tự động tạo một đoạn mã nhúng script. Bạn chỉ cần sao chép đoạn mã đó dán vào trước thẻ đóng </body> trong HTML trang web của mình.'
      },
      {
        category: 'data',
        q: 'Hệ thống mất bao lâu để xử lý dữ liệu (vectorize) tài liệu mới?',
        a: 'Thông thường chỉ mất từ 5 đến 30 giây để phân đoạn và vector hóa tệp tin tùy thuộc vào số trang và độ dài của tài liệu. Trạng thái xử lý sẽ hiển thị trực quan là PROCESSED khi hoàn tất.'
      },
      {
        category: 'security',
        q: 'Tôi có thể giới hạn địa chỉ website được nhúng Chatbot không?',
        a: 'Có. Trong phần cài đặt nâng cao của Widget, bạn có thể thiết lập các Whitelist Domains để chỉ định rõ các tên miền hợp lệ được phép tải Widget của bạn, giúp chống việc đánh cắp hoặc nhúng lậu mã script.'
      }
    ],
    en: [
      {
        category: 'data',
        q: 'What document formats are supported?',
        a: 'WiseBot supports .pdf, .docx, .txt, and .xlsx files (up to 10MB per file). You can also provide public website URLs for our crawler loops to extract raw text content.'
      },
      {
        category: 'security',
        q: 'Is my uploaded document data private and secure?',
        a: 'Yes, absolutely. All datasets are stored in isolated vector tenants, encrypted at rest and in transit. We strictly enforce that your knowledge base data is never used to train public LLM models.'
      },
      {
        category: 'billing',
        q: 'What are the limits on the Free plan?',
        a: 'The Free tier grants 1 Chatbot instance, up to 10 documents (100MB storage limit), and 1,000 processed messages/mo. To scale limits, check out our Plus or Pro workspace upgrades.'
      },
      {
        category: 'general',
        q: 'How do I embed the assistant into my website?',
        a: 'Under Widget Customization, hit "Publish Changes" to generate a unique JS script. Copy and paste that script tag before the closing </body> tag on any web page.'
      },
      {
        category: 'data',
        q: 'How long does document embedding (vectorization) take?',
        a: 'Typically, it takes between 5 to 30 seconds to parse and vectorize a document depending on length. The document status will transition to PROCESSED once ready.'
      },
      {
        category: 'security',
        q: 'Can I restrict which domains can embed my chatbot widget?',
        a: 'Yes. In Advanced Widget Settings, you can configure domain whitelists to ensure only authorized web locations can initialize and display your support widget.'
      }
    ]
  };

  const categories = [
    { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All', icon: HelpCircle },
    { id: 'data', label: language === 'vi' ? 'Cơ sở dữ liệu' : 'Data & Files', icon: Database },
    { id: 'security', label: language === 'vi' ? 'Bảo mật' : 'Security', icon: ShieldAlert },
    { id: 'billing', label: language === 'vi' ? 'Chi phí' : 'Billing', icon: CreditCard },
    { id: 'general', label: language === 'vi' ? 'Tổng quan' : 'General', icon: MessageSquare }
  ];

  const currentQuestions = language === 'vi' ? faqData.vi : faqData.en;
  const filteredFaq = currentQuestions.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleLanguage = () => setLanguage(language === 'en' ? 'vi' : 'en');

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-400 selection:text-slate-950 font-sans overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Background Gradients & Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.04),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Floating neon light blobs */}
      <div className="absolute top-[15%] left-[-5%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[-5%] w-[350px] h-[350px] bg-emerald-500/6 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. PUBLIC HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl transition">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center hover:opacity-90 transition">
            <Logo customSize={86} />
          </Link>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLanguage} 
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-700 transition"
            >
              <Globe size={14} />
              {language.toUpperCase()}
            </button>
            
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-200 px-4 py-2 text-xs font-semibold transition"
              >
                <span>{t('auth.register.login')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. HELP CENTER MAIN LAYOUT */}
      <div className="flex-1 mx-auto w-full max-w-4xl px-5 sm:px-6 py-12 relative z-10 space-y-8">
        
        {/* Title area */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            {language === 'vi' ? 'Hỏi đáp & Hỗ trợ kỹ thuật' : 'Help Center & FAQ'}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed font-light">
            {language === 'vi'
              ? 'Tìm kiếm câu trả lời nhanh chóng cho các thắc mắc phổ biến nhất của bạn.'
              : 'Find answers to common questions about features, accounts setup, and integrations.'}
          </p>

          {/* Centered Search Bar */}
          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="absolute left-4 top-5 text-slate-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setExpandedIndex(null);
              }}
              placeholder={language === 'vi' ? 'Tìm câu hỏi tại đây...' : 'Type your question here...'}
              className="w-full h-12 rounded-xl border border-slate-800 bg-slate-950/80 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/80 transition"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id as FaqCategory);
                  setExpandedIndex(null);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all",
                  isActive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900/30 hover:text-white'
                )}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Accordions */}
        <div className="space-y-4 pt-2">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((item, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div 
                  key={index}
                  className={cn(
                    "rounded-2xl border transition-all duration-300 overflow-hidden text-left",
                    isExpanded ? "border-slate-700 bg-slate-900/10" : "border-slate-800/80 bg-slate-950/30 hover:border-slate-700/60"
                  )}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition"
                  >
                    <span className="text-sm sm:text-base font-semibold text-slate-200 hover:text-white transition leading-snug">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        "shrink-0 text-slate-500 transition-transform duration-300",
                        isExpanded ? "rotate-180 text-emerald-400" : ""
                      )}
                    />
                  </button>

                  <div 
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isExpanded ? "grid-rows-[1fr] opacity-100 border-t border-slate-900/60" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="p-5 text-xs sm:text-sm leading-relaxed text-slate-400 font-light bg-slate-950/20">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/20 p-12 text-center text-slate-500 text-xs sm:text-sm font-light">
              {language === 'vi' ? 'Không tìm thấy câu hỏi tương ứng.' : 'No matching questions found.'}
            </div>
          )}
        </div>

        {/* Link to Docs page */}
        <div className="pt-6 border-t border-slate-900 text-center">
          <Link to="/docs" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition">
            <span>{language === 'vi' ? 'Đi tới trang Tài liệu kỹ thuật' : 'Go to Developer Documentation'}</span>
            <ChevronRight size={15} />
          </Link>
        </div>

      </div>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-600 z-10 relative">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-light">
          <p>© 2026 WiseBot Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 justify-center">
            <span>Powered by WiseBot Help Center</span>
            <span className="text-red-500">❤️</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
