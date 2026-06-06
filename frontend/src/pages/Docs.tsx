import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Code, 
  Terminal, 
  Layers, 
  Copy, 
  Check, 
  Search, 
  BookOpen, 
  Cpu, 
  Globe,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Zap,
  ShoppingBag,
  HelpCircle,
  Send,
  Mail,
  MapPin,
  Clock,
  Phone,
  Shield,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';
import { cn } from '../lib/utils';

type DocSection = 'quickstart' | 'widget' | 'api' | 'webhooks' | 'wordpress' | 'shopify' | 'faq' | 'contact';
type CodeLang = 'curl' | 'javascript' | 'python';

export default function Docs() {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated } = useRole();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active section from query param '?tab=...' or default to 'quickstart'
  const activeSection = (searchParams.get('tab') as DocSection) || 'quickstart';

  const [activeLang, setActiveLang] = useState<CodeLang>('curl');
  const [copiedText, setCopiedText] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Form states for contact support
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'vi' : 'en');

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      showToast(
        language === 'vi' ? 'Vui lòng điền đầy đủ tất cả các trường.' : 'Please fill in all fields.',
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast(
        language === 'vi' 
          ? 'Tin nhắn của bạn đã được gửi thành công đến đội ngũ kỹ thuật.' 
          : 'Your support ticket has been created successfully.',
        'success'
      );
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.wisebot.dev/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chatbot_id": "cb_9f2a8c7e",
    "messages": [
      {
        "role": "user",
        "content": "Chính sách bảo hành sản phẩm là gì?"
      }
    ],
    "stream": false
  }'`,
    javascript: `const response = await fetch('https://api.wisebot.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chatbot_id: 'cb_9f2a8c7e',
    messages: [
      {
        role: 'user',
        content: 'Chính sách bảo hành sản phẩm là gì?'
      }
    ],
    stream: false
  })
});
const data = await response.json();
console.log(data.choices[0].message.content);`,
    python: `import requests

url = "https://api.wisebot.dev/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "chatbot_id": "cb_9f2a8c7e",
    "messages": [
        {
            "role": "user",
            "content": "Chính sách bảo hành sản phẩm là gì?"
        }
    ],
    "stream": False
}

response = requests.post(url, headers=headers, json=data)
print(response.json()["choices"][0]["message"]["content"])`
  };

  const widgetCode = `<script 
  src="https://cdn.wisebot.dev/widget.js" 
  data-chatbot-id="cb_9f2a8c7e"
  data-theme-color="#10b981"
  defer>
</script>`;

  const wordpressCode = `// Thêm mã nhúng Wisebot vào footer của giao diện WordPress
add_action('wp_footer', 'add_wisebot_widget');
function add_wisebot_widget() {
    ?>
    <script 
      src="https://cdn.wisebot.dev/widget.js" 
      data-chatbot-id="cb_9f2a8c7e" 
      data-theme-color="#10b981" 
      defer>
    </script>
    <?php
}`;

  const shopifyCode = `<!-- Thêm đoạn mã này vào theme.liquid ngay trước thẻ đóng </body> -->
<script 
  src="https://cdn.wisebot.dev/widget.js" 
  data-chatbot-id="cb_9f2a8c7e"
  data-theme-color="#10b981"
  defer>
</script>`;

  const webhookPayload = `{
  "event": "message.sent",
  "timestamp": "2026-06-06T15:45:00Z",
  "data": {
    "chatbot_id": "cb_9f2a8c7e",
    "conversation_id": "conv_3a8f9c1d",
    "message": {
      "role": "assistant",
      "content": "Tôi có thể giúp gì cho bạn?"
    }
  }
}`;

  const faqData = {
    vi: [
      {
        q: 'Tôi có thể tải lên những định dạng tài liệu nào?',
        a: 'WiseBot hỗ trợ tải lên các tệp tin .pdf, .docx, .txt và .xlsx (tối đa 10MB mỗi tệp). Ngoài ra bạn cũng có thể nhúng đường dẫn website để hệ thống tự động crawl dữ liệu.'
      },
      {
        q: 'Dữ liệu tài liệu của tôi có được bảo mật không?',
        a: 'Hoàn toàn bảo mật. Dữ liệu của bạn được lưu trữ trong không gian biệt lập, được mã hóa khi truyền tải (SSL/TLS) và khi lưu giữ. Chúng tôi không sử dụng dữ liệu của bạn để làm dữ liệu huấn luyện công khai cho các mô hình LLM bên ngoài.'
      },
      {
        q: 'Giới hạn tin nhắn của gói Miễn phí là gì?',
        a: 'Gói Miễn phí (Free) cho phép tạo 1 Chatbot RAG, nạp tối đa 10 tài liệu (dung lượng 100MB) và giới hạn 1,000 tin nhắn mỗi tháng. Để tăng giới hạn này, bạn có thể nâng cấp lên gói Plus hoặc Pro.'
      },
      {
        q: 'Làm thế nào để nhúng Chatbot trợ lý vào website của tôi?',
        a: 'Trong phần "Widget Customization", sau khi bạn bấm "Publish Changes" thành công, hệ thống sẽ tự động tạo một đoạn mã nhúng script. Bạn chỉ cần sao chép đoạn mã đó dán vào trước thẻ đóng </body> trong HTML trang web của mình.'
      },
      {
        q: 'Hệ thống mất bao lâu để xử lý dữ liệu (vectorize) tài liệu mới?',
        a: 'Thông thường chỉ mất từ 5 đến 30 giây để phân đoạn và vector hóa tệp tin tùy thuộc vào số trang và độ dài của tài liệu. Trạng thái xử lý sẽ hiển thị trực quan là PROCESSED khi hoàn tất.'
      },
      {
        q: 'Tôi có thể giới hạn địa chỉ website được nhúng Chatbot không?',
        a: 'Có. Trong phần cài đặt nâng cao của Widget, bạn có thể thiết lập các Whitelist Domains để chỉ định rõ các tên miền hợp lệ được phép tải Widget của bạn, giúp chống việc đánh cắp hoặc nhúng lậu mã script.'
      }
    ],
    en: [
      {
        q: 'What document formats are supported?',
        a: 'WiseBot supports .pdf, .docx, .txt, and .xlsx files (up to 10MB per file). You can also provide public website URLs for our crawler loops to extract raw text content.'
      },
      {
        q: 'Is my uploaded document data private and secure?',
        a: 'Yes, absolutely. All datasets are stored in isolated vector tenants, encrypted at rest and in transit. We strictly enforce that your knowledge base data is never used to train public LLM models.'
      },
      {
        q: 'What are the limits on the Free plan?',
        a: 'The Free tier grants 1 Chatbot instance, up to 10 documents (100MB storage limit), and 1,000 processed messages/mo. To scale limits, check out our Plus or Pro workspace upgrades.'
      },
      {
        q: 'How do I embed the assistant into my website?',
        a: 'Under Widget Customization, hit "Publish Changes" to generate a unique JS script. Copy and paste that script tag before the closing </body> tag on any web page.'
      },
      {
        q: 'How long does document embedding (vectorization) take?',
        a: 'Typically, it takes between 5 to 30 seconds to parse and vectorize a document depending on length. The document status will transition to PROCESSED once ready.'
      },
      {
        q: 'Can I restrict which domains can embed my chatbot widget?',
        a: 'Yes. In Advanced Widget Settings, you can configure domain whitelists to ensure only authorized web locations can initialize and display your support widget.'
      }
    ]
  };

  // Hierarchy Navigation Menu
  const navigationMenu = [
    {
      group: language === 'vi' ? 'HƯỚNG DẪN CHUNG' : 'GETTING STARTED',
      items: [
        { id: 'quickstart', label: language === 'vi' ? 'Hướng dẫn nhanh' : 'Quickstart Guide', icon: BookOpen }
      ]
    },
    {
      group: language === 'vi' ? 'TÍCH HỢP CỐT LÕI' : 'CORE INTEGRATIONS',
      items: [
        { id: 'widget', label: language === 'vi' ? 'Nhúng Web Widget' : 'Web Widget Embed', icon: Code },
        { id: 'api', label: language === 'vi' ? 'Kết nối REST API' : 'REST API Reference', icon: Terminal },
        { id: 'webhooks', label: language === 'vi' ? 'Webhook sự kiện' : 'Webhooks Trigger', icon: Layers }
      ]
    },
    {
      group: language === 'vi' ? 'NỀN TẢNG HỖ TRỢ' : 'CMS PLATFORMS',
      items: [
        { id: 'wordpress', label: 'WordPress Integration', icon: Globe },
        { id: 'shopify', label: 'Shopify Store App', icon: ShoppingBag }
      ]
    },
    {
      group: language === 'vi' ? 'HỖ TRỢ & TÀI NGUYÊN' : 'RESOURCES & HELP',
      items: [
        { id: 'faq', label: language === 'vi' ? 'Câu hỏi thường gặp' : 'Help & FAQ', icon: HelpCircle },
        { id: 'contact', label: language === 'vi' ? 'Liên hệ hỗ trợ' : 'Contact Support', icon: Mail }
      ]
    }
  ];

  // Helper to switch tab
  const handleSelectTab = (tab: DocSection) => {
    setSearchParams({ tab });
    setExpandedFaq(null);
  };

  // Find sub-headings mapping for the right "On this page" navigation
  const subHeadings: Record<DocSection, Array<{ id: string, label: string }>> = {
    quickstart: [
      { id: 'qs-intro', label: language === 'vi' ? 'Giới thiệu' : 'Introduction' },
      { id: 'qs-step1', label: language === 'vi' ? 'B1: Cơ sở tri thức' : 'Step 1: KB Setup' },
      { id: 'qs-step2', label: language === 'vi' ? 'B2: Cấu hình Bot' : 'Step 2: Tune Bot' },
      { id: 'qs-step3', label: language === 'vi' ? 'B3: Nhúng code' : 'Step 3: Deploy Widget' }
    ],
    widget: [
      { id: 'wd-intro', label: language === 'vi' ? 'Tổng quan Widget' : 'Widget Overview' },
      { id: 'wd-code', label: language === 'vi' ? 'Mã nhúng HTML' : 'HTML Integration' },
      { id: 'wd-params', label: language === 'vi' ? 'Các tham số' : 'Parameters' }
    ],
    api: [
      { id: 'api-intro', label: 'REST API' },
      { id: 'api-endpoint', label: 'Endpoint' },
      { id: 'api-auth', label: 'Authorization' },
      { id: 'api-sample', label: 'Code Sample' }
    ],
    webhooks: [
      { id: 'wh-intro', label: 'Webhooks' },
      { id: 'wh-events', label: 'Webhook Events' }
    ],
    wordpress: [
      { id: 'wp-steps', label: 'WordPress Steps' }
    ],
    shopify: [
      { id: 'sh-steps', label: 'Shopify Steps' }
    ],
    faq: [
      { id: 'faq-list', label: language === 'vi' ? 'Danh sách câu hỏi' : 'FAQ Accordion' }
    ],
    contact: [
      { id: 'ct-form', label: language === 'vi' ? 'Gửi tin nhắn' : 'Contact Form' },
      { id: 'ct-info', label: language === 'vi' ? 'Thông tin liên hệ' : 'Info Details' }
    ]
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] selection:bg-amber-500 selection:text-black font-sans overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Background Mesh (Ngrok Dark theme grid) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(63,63,70,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,63,70,0.08)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.05),transparent_40%)] pointer-events-none" />

      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl transition">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center hover:opacity-90 transition">
            <Logo customSize={86} />
          </Link>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLanguage} 
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            >
              <Globe size={14} />
              {language.toUpperCase()}
            </button>
            
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white px-4 py-2 text-xs font-bold transition shadow-[0_0_15px_rgba(249,115,22,0.15)]"
              >
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 text-zinc-200 px-4 py-2 text-xs font-semibold transition"
              >
                <span>{t('auth.register.login')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMNS LAYOUT */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr_200px]">
          
          {/* Column 1: Left Navigation Menu (Ngrok Sidebar) */}
          <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
            
            {/* Minimal Search box */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-zinc-500" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'vi' ? 'Tìm tài liệu...' : 'Search documentation...'}
                className="w-full h-9 rounded-lg border border-zinc-800 bg-zinc-900/40 pl-9 pr-4 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            <nav className="space-y-6 text-left">
              {navigationMenu.map((group, idx) => {
                // Filter items inside group based on search query
                const filteredItems = group.items.filter(item => 
                  item.label.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                if (filteredItems.length === 0) return null;

                return (
                  <div key={idx} className="space-y-1.5">
                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3">
                      {group.group}
                    </h5>
                    <div className="space-y-0.5">
                      {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id as DocSection)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all border",
                              isActive
                                ? "bg-zinc-800/40 border-zinc-700 text-[#f97316]"
                                : "text-zinc-400 hover:text-white border-transparent hover:bg-zinc-900/40"
                            )}
                          >
                            <Icon size={14} className={isActive ? "text-[#f97316]" : "text-zinc-500"} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Column 2: Main content panel (Middle) */}
          <main className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 sm:p-8 backdrop-blur-md text-left min-h-[600px] flex flex-col justify-between">
            <div className="space-y-8">
              
              {/* === TAB 1: QUICKSTART === */}
              {activeSection === 'quickstart' && (
                <div className="space-y-8 animate-fadeIn">
                  <div id="qs-intro" className="space-y-3 border-b border-zinc-800 pb-5">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Quickstart Guide</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      {language === 'vi' 
                        ? 'Thiết lập cơ sở dữ liệu tri thức của riêng bạn, cấu hình hành vi của Chatbot và nhúng Widget hỗ trợ RAG chỉ trong 3 bước đơn giản.'
                        : 'Learn how to construct your custom knowledge vector database, configure assistant chat personality, and embed RAG chatbot widget.'}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div id="qs-step1" className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#f97316]/10 text-[#f97316] font-mono text-xs font-bold">1</span>
                        <h3 className="text-base font-bold text-white">
                          {language === 'vi' ? 'Nạp Cơ sở dữ liệu Tri thức' : 'Build Knowledge Base'}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light pl-8">
                        {language === 'vi'
                          ? 'Truy cập vào trang "Cơ sở tri thức", tải lên tài liệu PDF, DOCX, TXT hoặc cung cấp URL trang web. Hệ thống sẽ tự động phân tách và đồng bộ vector.'
                          : 'Go to the Knowledge Base page, upload your PDF, Word documents, text resources or crawl web URLs. Our backend pipeline parses and vectorizes data.'}
                      </p>
                    </div>

                    <div id="qs-step2" className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#f97316]/10 text-[#f97316] font-mono text-xs font-bold">2</span>
                        <h3 className="text-base font-bold text-white">
                          {language === 'vi' ? 'Huấn luyện Trợ lý AI' : 'Configure Chatbot Identity'}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light pl-8">
                        {language === 'vi'
                          ? 'Trong phần "Tích hợp & Nhúng", thiết lập tên hiển thị của Chatbot, lời chào ban đầu và chọn liên kết với Cơ sở tri thức đã tạo ở Bước 1.'
                          : 'In the Integration & Embed panel, assign your chatbot name, primary system instruction prompts, and link it with the target knowledge base.'}
                      </p>
                    </div>

                    <div id="qs-step3" className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#f97316]/10 text-[#f97316] font-mono text-xs font-bold">3</span>
                        <h3 className="text-base font-bold text-white">
                          {language === 'vi' ? 'Nhúng Đoạn mã Widget' : 'Deploy Widget Snippet'}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light pl-8">
                        {language === 'vi'
                          ? 'Copy đoạn mã nhúng script được cung cấp ở phần "Nhúng Web Widget" bên dưới và dán vào trước thẻ đóng </body> trên trang HTML.'
                          : 'Copy the integration script tag and place it before the closing </body> tag on any HTML layout file to launch the floating chat widget.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 2: WEB WIDGET EMBED === */}
              {activeSection === 'widget' && (
                <div className="space-y-8 animate-fadeIn">
                  <div id="wd-intro" className="space-y-3 border-b border-zinc-800 pb-5">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Web Widget Embed</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      {language === 'vi'
                        ? 'Tích hợp tiện ích bong bóng chat nổi trực tiếp ở chân trang web để hỗ trợ người dùng cuối.'
                        : 'Embed the floating chat widget into your website footer layout to serve customer questions automatically.'}
                    </p>
                  </div>

                  <div id="wd-code" className="space-y-3">
                    <h3 className="text-sm font-bold text-white">HTML Integration Code</h3>
                    <TerminalMockup code={widgetCode} onCopy={() => copyToClipboard(widgetCode)} copied={copiedText} fileName="index.html" />
                  </div>

                  <div id="wd-params" className="space-y-3">
                    <h3 className="text-sm font-bold text-white">{language === 'vi' ? 'Chi tiết các tham số cấu hình' : 'Configuration Parameters'}</h3>
                    <div className="border border-zinc-800 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold">
                            <th className="p-3">Parameter</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-zinc-800/60 bg-zinc-950/20">
                            <td className="p-3 font-mono text-amber-500 font-bold">data-chatbot-id</td>
                            <td className="p-3 text-zinc-500">string</td>
                            <td className="p-3 text-zinc-300">{language === 'vi' ? 'Khóa định danh duy nhất của Chatbot.' : 'Unique identifier for your RAG chatbot instance.'}</td>
                          </tr>
                          <tr className="bg-zinc-950/10">
                            <td className="p-3 font-mono text-cyan-400 font-bold">data-theme-color</td>
                            <td className="p-3 text-zinc-500">string (HEX)</td>
                            <td className="p-3 text-zinc-300">{language === 'vi' ? 'Tùy chỉnh màu chủ đạo của Widget (ví dụ #f97316).' : 'HEX primary color accent code (e.g. #f97316).'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 3: REST API REFERENCE === */}
              {activeSection === 'api' && (
                <div className="space-y-8 animate-fadeIn">
                  <div id="api-intro" className="space-y-3 border-b border-zinc-800 pb-5">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">REST API Reference</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      {language === 'vi'
                        ? 'Kết nối trực tiếp vào máy chủ WiseBot để xây dựng giao diện hội thoại tùy chỉnh của riêng bạn.'
                        : 'Connect directly to Wisebot server API to query RAG sources and build custom application layouts.'}
                    </p>
                  </div>

                  <div id="api-endpoint" className="space-y-3">
                    <h3 className="text-sm font-bold text-white">Request Endpoint</h3>
                    <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 rounded-lg p-3 font-mono text-xs">
                      <span className="bg-[#f97316]/10 text-[#f97316] text-[10px] font-bold px-2 py-0.5 rounded border border-[#f97316]/20">POST</span>
                      <span className="text-zinc-300 select-all">https://api.wisebot.dev/v1/chat/completions</span>
                    </div>
                  </div>

                  <div id="api-auth" className="space-y-2">
                    <h3 className="text-sm font-bold text-white">Authentication</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light">
                      {language === 'vi'
                        ? 'Tất cả cuộc gọi API yêu cầu đính kèm Mã API (API Key) của Workspace trong Header HTTP Authorization.'
                        : 'Authenticate HTTP client calls by appending your workspace API key in Authorization headers.'}
                    </p>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-3 font-mono text-xs text-zinc-400">
                      Authorization: Bearer <span className="text-amber-500">YOUR_API_KEY</span>
                    </div>
                  </div>

                  <div id="api-sample" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Code Sample</h3>
                      <div className="flex gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                        {(['curl', 'javascript', 'python'] as CodeLang[]).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setActiveLang(lang)}
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-all",
                              activeLang === lang ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                    <TerminalMockup 
                      code={codeSnippets[activeLang]} 
                      onCopy={() => copyToClipboard(codeSnippets[activeLang])} 
                      copied={copiedText} 
                      fileName={activeLang === 'curl' ? 'request.sh' : activeLang === 'javascript' ? 'index.js' : 'app.py'} 
                    />
                  </div>
                </div>
              )}

              {/* === TAB 4: WEBHOOKS === */}
              {activeSection === 'webhooks' && (
                <div className="space-y-8 animate-fadeIn">
                  <div id="wh-intro" className="space-y-3 border-b border-zinc-800 pb-5">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Webhooks Trigger</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      {language === 'vi'
                        ? 'Đăng ký các webhook URL để nhận payload dữ liệu JSON POST tự động mỗi khi sự kiện xảy ra.'
                        : 'Register HTTPS webhook callback links to synchronize internal databases with conversation actions.'}
                    </p>
                  </div>

                  <div id="wh-events" className="space-y-4">
                    <h3 className="text-sm font-bold text-white">{language === 'vi' ? 'Ví dụ Payload gửi đi' : 'Webhook Payload Example'}</h3>
                    <TerminalMockup code={webhookPayload} onCopy={() => copyToClipboard(webhookPayload)} copied={copiedText} fileName="event.json" />
                  </div>
                </div>
              )}

              {/* === TAB 5: WORDPRESS PLATFORM === */}
              {activeSection === 'wordpress' && (
                <div className="space-y-8 animate-fadeIn">
                  <div id="wp-steps" className="space-y-4 border-b border-zinc-800 pb-5">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">WordPress Integration</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      {language === 'vi'
                        ? 'Dễ dàng nhúng chatbot hỗ trợ RAG vào website WordPress mà không cần chỉnh sửa sâu mã nguồn.'
                        : 'Quickly bind the chat assistant to WordPress sites via layout templates or custom action hooks.'}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex gap-3 text-zinc-400 font-light">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#f97316]/10 text-[#f97316] font-mono font-bold">1</span>
                      <div>
                        <p className="font-bold text-white">{language === 'vi' ? 'Sử dụng Hook wp_footer' : 'Leverage footer hook action'}</p>
                        <p className="mt-1 leading-relaxed">{language === 'vi' ? 'Thêm đoạn code PHP này vào tệp functions.php của theme hiện tại hoặc sử dụng plugin code custom.' : 'Insert this simple filter inside your WordPress child-theme functions.php template:'}</p>
                      </div>
                    </div>
                    <TerminalMockup code={wordpressCode} onCopy={() => copyToClipboard(wordpressCode)} copied={copiedText} fileName="functions.php" />
                  </div>
                </div>
              )}

              {/* === TAB 6: SHOPIFY STORE === */}
              {activeSection === 'shopify' && (
                <div className="space-y-8 animate-fadeIn">
                  <div id="sh-steps" className="space-y-4 border-b border-zinc-800 pb-5">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Shopify Store App</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      {language === 'vi'
                        ? 'Hỗ trợ tự động tư vấn sản phẩm, đơn hàng và chính sách đổi trả cho khách hàng mua sắm 24/7.'
                        : 'Answer catalog specifications, policies, and queries 24/7 automatically inside Shopify portals.'}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex gap-3 text-zinc-400 font-light">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#f97316]/10 text-[#f97316] font-mono font-bold">1</span>
                      <div>
                        <p className="font-bold text-white">{language === 'vi' ? 'Nhúng mã script vào Template chính' : 'Insert snippet inside theme layout'}</p>
                        <p className="mt-1 leading-relaxed">{language === 'vi' ? 'Trong phần quản trị Shopify Theme, chỉnh sửa tệp theme.liquid và dán đoạn mã này ngay trước thẻ </body>.' : 'Edit the active layout theme.liquid file inside your Shopify editor and insert this script block:'}</p>
                      </div>
                    </div>
                    <TerminalMockup code={shopifyCode} onCopy={() => copyToClipboard(shopifyCode)} copied={copiedText} fileName="theme.liquid" />
                  </div>
                </div>
              )}

              {/* === TAB 7: FAQ ACCORDION === */}
              {activeSection === 'faq' && (
                <div className="space-y-8 animate-fadeIn">
                  <div id="faq-list" className="space-y-3 border-b border-zinc-800 pb-5">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Help Center & FAQ</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      {language === 'vi'
                        ? 'Các câu hỏi thường gặp về cấu hình, kỹ thuật và hạn mức tài khoản.'
                        : 'Frequently asked questions regarding settings, limits, and technical details.'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {(language === 'vi' ? faqData.vi : faqData.en).map((item, index) => {
                      const isExpanded = expandedFaq === index;
                      return (
                        <div 
                          key={index} 
                          className={cn(
                            "border rounded-lg overflow-hidden transition-all duration-200",
                            isExpanded ? "border-zinc-700 bg-zinc-900/30" : "border-zinc-800/80 bg-zinc-950/20 hover:border-zinc-700/60"
                          )}
                        >
                          <button
                            onClick={() => setExpandedFaq(isExpanded ? null : index)}
                            className="flex w-full items-center justify-between p-4.5 text-left font-bold text-xs sm:text-sm text-zinc-100 hover:text-white"
                          >
                            <span>{item.q}</span>
                            <ChevronDown size={16} className={cn("text-zinc-500 transition-transform duration-200", isExpanded ? "rotate-180 text-amber-500" : "")} />
                          </button>
                          
                          {isExpanded && (
                            <div className="p-4.5 pt-0 text-xs text-zinc-400 font-light leading-relaxed border-t border-zinc-800/40 bg-zinc-950/10">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* === TAB 8: CONTACT SUPPORT FORM === */}
              {activeSection === 'contact' && (
                <div className="space-y-8 animate-fadeIn">
                  <div id="ct-form" className="space-y-3 border-b border-zinc-800 pb-5">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Contact Support</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      {language === 'vi'
                        ? 'Gửi yêu cầu hoặc câu hỏi kỹ thuật trực tiếp cho đội ngũ kỹ sư của WiseBot.'
                        : 'Submit technical inquiries or enterprise consultation tickets to our engineering desk.'}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-[1fr_240px]">
                    {/* Left form block */}
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label htmlFor="name" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            {language === 'vi' ? 'Họ và tên' : 'Full Name'}
                          </label>
                          <input
                            id="name"
                            type="text"
                            name="name"
                            value={contactForm.name}
                            onChange={handleContactChange}
                            placeholder={language === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                            className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/80 transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="email" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            Email
                          </label>
                          <input
                            id="email"
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={handleContactChange}
                            placeholder="example@wisebot.dev"
                            className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/80 transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="subject" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          {language === 'vi' ? 'Tiêu đề' : 'Subject'}
                        </label>
                        <input
                          id="subject"
                          type="text"
                          name="subject"
                          value={contactForm.subject}
                          onChange={handleContactChange}
                          placeholder={language === 'vi' ? 'Tôi cần hỗ trợ về...' : 'Technical assistance...'}
                          className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/80 transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="message" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          {language === 'vi' ? 'Chi tiết yêu cầu' : 'Message details'}
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={contactForm.message}
                          onChange={handleContactChange}
                          rows={4}
                          placeholder={language === 'vi' ? 'Nhập chi tiết yêu cầu hỗ trợ...' : 'Describe your request details...'}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/80 transition resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                          "w-full h-10 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
                          isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{language === 'vi' ? 'Đang gửi...' : 'Sending...'}</span>
                          </>
                        ) : (
                          <>
                            <Send size={13} />
                            <span>{language === 'vi' ? 'Gửi tin nhắn' : 'Submit Ticket'}</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Right contacts sidebar */}
                    <div id="ct-info" className="space-y-4 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6 text-xs text-zinc-400 font-light">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-zinc-500">{language === 'vi' ? 'Địa chỉ' : 'HQ Office'}</h4>
                        <p className="leading-relaxed">High-Tech Park, District 9, HCMC, VN</p>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-zinc-500">Email</h4>
                        <p className="select-all font-mono">support@wisebot.dev</p>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-zinc-500">{language === 'vi' ? 'Hotline' : 'Phone'}</h4>
                        <p className="select-all font-mono">+84 (28) 3730-8888</p>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-zinc-500">{language === 'vi' ? 'Giờ làm việc' : 'Business Hours'}</h4>
                        <p>Mon - Fri: 8 AM - 6 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom info link */}
            <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Shield size={12} className="text-zinc-600" />
                <span>Wisebot SOC2 Compliance Datastore</span>
              </span>
              <span>© 2026 Wisebot Inc.</span>
            </div>
          </main>

          {/* Column 3: Table of contents (Right panel) */}
          <aside className="hidden lg:block space-y-4 text-left">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">On this page</h4>
            <ul className="space-y-1.5 border-l border-zinc-800">
              {subHeadings[activeSection]?.map((heading) => (
                <li key={heading.id}>
                  <a 
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(heading.id);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-xs text-zinc-400 hover:text-white transition font-medium block pl-3.5 py-0.5 hover:border-l hover:border-amber-500 -ml-[1px]"
                  >
                    {heading.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

        </div>
      </div>

      {/* 3. MINIMAL FOOTER */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-xs text-zinc-600 z-10 relative">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-light">
          <p>© 2026 WiseBot Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 justify-center">
            <span>Powered by Wisebot Developer Hub</span>
            <span className="text-red-500">❤️</span>
          </p>
        </div>
      </footer>

    </div>
  );
}

// Sub-Component: Terminal Code Mockup window with mac control bullets
function TerminalMockup({ code, onCopy, copied, fileName }: { code: string, onCopy: () => void, copied: boolean, fileName: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl relative text-left">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-900/40 select-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 select-none">{fileName}</span>
        <button
          onClick={onCopy}
          className="p-1 rounded text-zinc-500 hover:text-white transition bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800"
          title="Copy"
        >
          {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[350px]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
