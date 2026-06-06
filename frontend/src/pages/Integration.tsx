import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Code, 
  Terminal, 
  Globe, 
  ShoppingBag, 
  Layers, 
  Copy, 
  Check, 
  ArrowRight, 
  ChevronRight,
  ExternalLink,
  Cpu,
  Zap,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import Logo from '../components/Logo';
import { cn } from '../lib/utils';

type IntegrationPlatform = 'widget' | 'api' | 'wordpress' | 'shopify' | 'webhooks';

export default function Integration() {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated } = useRole();
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState<IntegrationPlatform>('widget');
  const [copiedText, setCopiedText] = useState(false);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'vi' : 'en');

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const platforms = [
    { id: 'widget', name: language === 'vi' ? 'Nhúng Web Widget' : 'Web Widget Embed', icon: Code, desc: language === 'vi' ? 'Nhúng trực tiếp vào website của bạn' : 'Embed directly into your website' },
    { id: 'api', name: 'API & SDK', icon: Terminal, desc: language === 'vi' ? 'Tương tác thông qua API RESTful' : 'Interact via RESTful API' },
    { id: 'wordpress', name: 'WordPress Plugin', icon: Globe, desc: language === 'vi' ? 'Tích hợp vào CMS WordPress' : 'Integrate into WordPress CMS' },
    { id: 'shopify', name: 'Shopify App', icon: ShoppingBag, desc: language === 'vi' ? 'Tích hợp cửa hàng Shopify' : 'Integrate with Shopify store' },
    { id: 'webhooks', name: 'Webhook Triggers', icon: Layers, desc: language === 'vi' ? 'Đồng bộ hóa dữ liệu thời gian thực' : 'Real-time data synchronization' }
  ];

  const codeSnippets = {
    widget: `<script 
  src="https://cdn.wisebot.dev/widget.js" 
  data-chatbot-id="cb_9f2a8c7e"
  data-theme-color="#10b981"
  defer>
</script>`,
    api: `const response = await fetch('https://api.wisebot.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chatbot_id: 'cb_9f2a8c7e',
    messages: [{ role: 'user', content: 'Xin chào!' }]
  })
});
const data = await response.json();`,
    wordpress: `// Add this to your child theme's functions.php or a custom plugin
add_action('wp_footer', 'add_wisebot_widget');
function add_wisebot_widget() {
    ?>
    <script src="https://cdn.wisebot.dev/widget.js" data-chatbot-id="cb_9f2a8c7e" data-theme-color="#10b981" defer></script>
    <?php
}`,
    shopify: `// Paste this script snippet in theme.liquid before the </body> tag
<script 
  src="https://cdn.wisebot.dev/widget.js" 
  data-chatbot-id="cb_9f2a8c7e"
  data-theme-color="#10b981"
  defer>
</script>`,
    webhooks: `{
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
}`
  };

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

      {/* 2. INTEGRATION MAIN LAYOUT */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 py-16 relative z-10 space-y-12">
        
        {/* Title Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs font-bold text-indigo-400 tracking-wide select-none">
            <Zap size={12} className="text-indigo-400 animate-pulse" />
            {language === 'vi' ? 'Hướng dẫn Tích hợp hệ thống' : 'System Integration Reference'}
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl leading-tight">
            {language === 'vi' ? 'Kết nối Chatbot của bạn' : 'Connect Your Chatbot'}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed font-light">
            {language === 'vi'
              ? 'Tích hợp WiseBot RAG Chatbot vào website, ứng dụng di động hoặc cửa hàng thương mại điện tử chỉ trong vài bước đơn giản.'
              : 'Embed WiseBot RAG Chatbot into your website, mobile apps, or e-commerce shopfront in simple steps.'}
          </p>
        </div>

        {/* Bố cục 2 cột: Danh sách nền tảng bên trái, tài liệu chi tiết/hoạt ảnh mẫu bên phải */}
        <div className="grid gap-8 lg:grid-cols-[300px_1fr] items-start max-w-6xl mx-auto">
          
          {/* Cột Trái: Chọn Nền Tảng */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 backdrop-blur-md">
            <h3 className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">
              {language === 'vi' ? 'Chọn Nền Tảng' : 'Select Platform'}
            </h3>
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isActive = activePlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => setActivePlatform(platform.id as IntegrationPlatform)}
                  className={cn(
                    "flex items-center gap-4.5 rounded-xl p-3.5 text-left transition-all border",
                    isActive
                      ? "border-emerald-500/20 bg-slate-900/60 text-emerald-400"
                      : "border-transparent text-slate-400 hover:text-white hover:bg-slate-900/10"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors shrink-0",
                    isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-900 text-slate-500"
                  )}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-tight">{platform.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-light leading-snug">{platform.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cột Phải: Nội Dung Tài Liệu Chi Tiết */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 sm:p-8 backdrop-blur-md text-left min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="space-y-6">
              {/* Header của content */}
              <div className="border-b border-slate-900 pb-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
                    <Cpu size={16} />
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    {platforms.find(p => p.id === activePlatform)?.name}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
                  {activePlatform === 'widget' && (language === 'vi'
                    ? 'Nhúng tiện ích bong bóng chat nổi ở góc dưới trang web để khách hàng dễ dàng gửi câu hỏi.'
                    : 'Embed a floating chat bubble widget at the bottom corner of your website for guest queries.')}
                  {activePlatform === 'api' && (language === 'vi'
                    ? 'Xây dựng giao diện chat tùy chỉnh của riêng bạn bằng cách gửi truy vấn trực tiếp qua API REST.'
                    : 'Design and build your own custom chat UI components by polling queries through our RESTful API endpoints.')}
                  {activePlatform === 'wordpress' && (language === 'vi'
                    ? 'Nhúng chatbot trực tiếp vào trang web WordPress của bạn thông qua việc chèn mã vào theme hoặc sử dụng plugin.'
                    : 'Embed your custom conversational assistant into WordPress template layouts or functions.')}
                  {activePlatform === 'shopify' && (language === 'vi'
                    ? 'Hỗ trợ khách mua hàng và giải đáp chính sách bán hàng tự động 24/7 trực tiếp trên website Shopify của bạn.'
                    : 'Provide round-the-clock sales conversion assistance and automated policy support directly within your Shopify store.')}
                  {activePlatform === 'webhooks' && (language === 'vi'
                    ? 'Đăng ký nhận thông báo HTTP POST khi các sự kiện hội thoại hoặc đồng bộ tài liệu xảy ra trên máy chủ.'
                    : 'Register URL callbacks to receive HTTP POST payloads when conversational states or knowledge vectors sync.')}
                </p>
              </div>

              {/* Code Snippet Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider font-mono">
                    {activePlatform === 'webhooks' ? 'JSON PAYLOAD EXAMPLE' : 'INTEGRATION CODE'}
                  </h4>
                  <button
                    onClick={() => copyToClipboard(codeSnippets[activePlatform])}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800"
                  >
                    {copiedText ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="bg-slate-950/80 border border-slate-900 rounded-2xl p-5 text-xs font-mono text-emerald-400/90 overflow-x-auto leading-relaxed max-h-[350px] shadow-inner">
                    <code>{codeSnippets[activePlatform]}</code>
                  </pre>
                </div>
              </div>

              {/* Step By Step Instructions */}
              <div className="space-y-4 pt-4 border-t border-slate-900/60">
                <h4 className="text-sm font-bold text-white">
                  {language === 'vi' ? 'Các bước thực hiện' : 'Step-by-step Guidelines'}
                </h4>
                
                {activePlatform === 'widget' && (
                  <ul className="space-y-3 text-xs text-slate-400 font-light list-none pl-0">
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">1</span>
                      <span>{language === 'vi' ? 'Đăng nhập vào Bảng điều khiển và chọn chatbot bạn muốn tích hợp.' : 'Login to your Dashboard and select the chatbot template you want to deploy.'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">2</span>
                      <span>{language === 'vi' ? 'Đi tới trang Cài đặt Widget để thiết lập màu sắc, bong bóng chat và lời chào mừng.' : 'Navigate to Customization settings to define themes, avatar icons, and greeting lines.'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">3</span>
                      <span>{language === 'vi' ? 'Sao chép đoạn mã script phía trên và nhúng vào trước thẻ đóng </body> trong mã nguồn HTML.' : 'Copy the script tag above and insert it before the closing </body> tag of your platform template files.'}</span>
                    </li>
                  </ul>
                )}

                {activePlatform === 'api' && (
                  <ul className="space-y-3 text-xs text-slate-400 font-light list-none pl-0">
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">1</span>
                      <span>{language === 'vi' ? 'Truy cập tab "Mã API" trong Dashboard để khởi tạo một khóa API mới.' : 'Go to the API Keys section under dashboard parameters to generate your secret client key.'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">2</span>
                      <span>{language === 'vi' ? 'Đảm bảo khóa API được giữ bí mật và truyền trong Header Authorization của các yêu cầu gửi đi.' : 'Securely store the API key on your server environment and attach it inside the Authorization Headers.'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">3</span>
                      <span>{language === 'vi' ? 'Nhận dữ liệu trả về và xử lý hiển thị hội thoại động lên giao diện tùy chỉnh.' : 'Parse JSON returns from responses to display streaming or static AI bubbles dynamically.'}</span>
                    </li>
                  </ul>
                )}

                {activePlatform === 'wordpress' && (
                  <ul className="space-y-3 text-xs text-slate-400 font-light list-none pl-0">
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">1</span>
                      <span>{language === 'vi' ? 'Vào trang quản trị WordPress (wp-admin).' : 'Open your WordPress Admin Control Panel (wp-admin).'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">2</span>
                      <span>{language === 'vi' ? 'Sử dụng một plugin quản lý Header & Footer (ví dụ "Insert Headers and Footers") hoặc thêm code trực tiếp vào tệp functions.php của Theme.' : 'Install a code manager plugin (like Header & Footer Code Manager) or hook the script action inside child theme functions.php.'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">3</span>
                      <span>{language === 'vi' ? 'Dán mã nhúng Widget vào và lưu thay đổi để chatbot tự động hiển thị.' : 'Insert the web widget async script block, clear cache plugins, and review your live front pages.'}</span>
                    </li>
                  </ul>
                )}

                {activePlatform === 'shopify' && (
                  <ul className="space-y-3 text-xs text-slate-400 font-light list-none pl-0">
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">1</span>
                      <span>{language === 'vi' ? 'Đăng nhập vào trang quản trị Shopify Store.' : 'Login to your Shopify Merchant dashboard portal.'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">2</span>
                      <span>{language === 'vi' ? 'Truy cập Online Store -> Themes -> Edit Code.' : 'Navigate to Online Store -> Themes. Click Edit Code on your live active layout template.'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">3</span>
                      <span>{language === 'vi' ? 'Tìm tệp theme.liquid và dán mã nhúng script vào ngay trước thẻ đóng </body>.' : 'Find the theme.liquid configuration and paste the script directly preceding the closing </body> tag.'}</span>
                    </li>
                  </ul>
                )}

                {activePlatform === 'webhooks' && (
                  <ul className="space-y-3 text-xs text-slate-400 font-light list-none pl-0">
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">1</span>
                      <span>{language === 'vi' ? 'Thiết lập Endpoint Webhook nhận sự kiện trên máy chủ ứng dụng của bạn.' : 'Prepare a public HTTPS listener route on your hosting servers to receive hook events.'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">2</span>
                      <span>{language === 'vi' ? 'Trong phần Cài đặt nâng cao của Dashboard, điền URL Endpoint và chọn các sự kiện muốn đăng ký.' : 'Under advanced configuration options, fill in your webhook URL payload link and select subscriptions.'}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">3</span>
                      <span>{language === 'vi' ? 'Lưu cấu hình và kiểm thử bằng cách gửi tin nhắn mẫu đến chatbot.' : 'Confirm settings and check payload logs upon sending test messages to the chatbot playground.'}</span>
                    </li>
                  </ul>
                )}
              </div>
            </div>

            {/* CTA action bottom */}
            <div className="mt-8 pt-6 border-t border-slate-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-xs text-slate-500">
                {language === 'vi' ? 'Cần trợ giúp trong việc lập trình tích hợp?' : 'Require assistance regarding software integration?'}
              </span>
              <button
                onClick={() => navigate('/contact')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all self-start sm:self-center"
              >
                <span>{language === 'vi' ? 'Liên hệ hỗ trợ kỹ thuật' : 'Contact Developer Support'}</span>
                <ArrowRight size={13} />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-600 z-10 relative">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-light">
          <p>© 2026 WiseBot Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 justify-center">
            <span>Powered by WiseBot Integration Engine</span>
            <span className="text-red-500">❤️</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
