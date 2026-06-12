import React from 'react';
import {
  ArrowLeft,
  Home,
  Mail,
  MapPin,
  Phone,
  Search,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { listWidgetDomains, listWidgets, type DomainResponse } from '../api/widget';
import { getStoredAccessToken } from '../lib/auth';

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
  } catch {
    return null;
  }
}

function tenantId() {
  const token = getStoredAccessToken();
  const payload = token ? parseJwt(token) : null;
  return typeof payload?.tenantId === 'string' ? payload.tenantId.trim() : '';
}

function currentDomain() {
  return window.location.hostname.replace(/^www\./, '').toLowerCase();
}

function normalizeDomain(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return url.hostname.replace(/^\[|\]$/g, '').replace(/^www\./, '');
  } catch {
    const host = trimmed.replace(/^https?:\/\//, '').split('/')[0] || '';
    return host.replace(/:\d+$/, '').replace(/^\[|\]$/g, '').replace(/^www\./, '');
  }
}

function isLoopbackHost(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function domainAllowed(host: string, domains: DomainResponse[]) {
  const normalizedHost = normalizeDomain(host);
  return domains.some((item) => {
    const allowed = normalizeDomain(item.domain);
    return normalizedHost === allowed
      || (isLoopbackHost(normalizedHost) && isLoopbackHost(allowed))
      || (item.allowSubdomains && normalizedHost.endsWith(`.${allowed}`));
  });
}

function useViewportWidth() {
  const [width, setWidth] = React.useState(() => window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

const BLUE = '#006cb5';
const ORANGE = '#f7aa23';

const NAV = [
  'GIỚI THIỆU',
  'ĐÀO TẠO',
  'KHOA HỌC CÔNG NGHỆ',
  'HỢP TÁC QUỐC TẾ',
  'TUYỂN SINH',
  'SINH VIÊN',
  'BA CÔNG KHAI',
  'THAM QUAN ICTU',
];

const BANNERS = [
  '/ictu-banner.jpg',
  '/ictu-banner2.png',
  '/ictu-banner3.jpg',
];

const WIDGET_SCRIPT_VERSION = '20260612-rich-stream';

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#fff',
    color: '#333',
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
  },
  inner: {
    maxWidth: 1320,
    margin: '0 auto',
    padding: '0 20px',
  },
  header: {
    background: '#fff',
    padding: '9px 0',
    borderBottom: '1px solid #e8e8e8',
  },
  headerInner: {
    maxWidth: 1320,
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    height: 64,
    width: 'auto',
    display: 'block',
  },
  logoText: {
    lineHeight: 1.25,
    color: BLUE,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.01em',
    fontSize: 16,
  },
  social: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  socialIcon: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    overflow: 'hidden',
  },
  socialImage: {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'cover',
  },
  nav: {
    background: BLUE,
    position: 'sticky',
    top: 0,
    zIndex: 500,
    boxShadow: '0 2px 6px rgba(0,0,0,.15)',
  },
  navInner: {
    maxWidth: 1320,
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
  },
  homeIcon: {
    height: 46,
    padding: '0 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    borderRight: '1px solid rgba(255,255,255,.15)',
    textDecoration: 'none',
  },
  navItem: {
    height: 46,
    padding: '0 23px',
    display: 'flex',
    alignItems: 'center',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '.01em',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  searchBtn: {
    width: 46,
    height: 46,
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    cursor: 'pointer',
  },
  hero: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    aspectRatio: '8000 / 2709',
    background: '#e8f0fa',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity .8s ease',
    display: 'block',
  },
  dots: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    zIndex: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '2px solid #fff',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
  },
  dotActive: {
    width: 26,
    borderRadius: 5,
    background: ORANGE,
    borderColor: ORANGE,
  },
  searchOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9998,
    background: 'rgba(0,0,0,.45)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 120,
    backdropFilter: 'blur(3px)',
  },
  searchBox: {
    background: '#fff',
    borderRadius: 10,
    padding: 24,
    width: '90%',
    maxWidth: 560,
    boxShadow: '0 20px 60px rgba(0,0,0,.2)',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: `2px solid ${BLUE}`,
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
  },
  noWidget: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: 9998,
    maxWidth: 310,
    background: '#fffaeb',
    border: '1px solid #fedf89',
    borderRadius: 10,
    padding: '14px 16px',
    fontSize: 12.5,
    color: '#93370d',
    lineHeight: 1.6,
    boxShadow: '0 8px 24px rgba(0,0,0,.1)',
  },
  footer: {
    background: '#1a3a5c',
    color: '#cdd8e8',
    padding: '36px 20px 0',
  },
  footerInner: {
    maxWidth: 1320,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: 36,
    paddingBottom: 30,
    borderBottom: '1px solid rgba(255,255,255,.1)',
  },
  logoBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  footerLogo: {
    height: 44,
    borderRadius: '50%',
    background: '#fff',
    padding: 2,
  },
  footerName: {
    fontSize: 13.5,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.4,
  },
  footerInfo: {
    fontSize: 12.5,
    lineHeight: 1.9,
  },
  footerInfoRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  colTitle: {
    display: 'inline-block',
    marginBottom: 12,
    paddingBottom: 7,
    borderBottom: `2px solid ${ORANGE}`,
    color: '#fff',
    fontSize: 13.5,
    fontWeight: 700,
  },
  colLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  footerLink: {
    color: '#aabbd0',
    fontSize: 12,
    textDecoration: 'none',
  },
  bottom: {
    maxWidth: 1320,
    margin: '0 auto',
    padding: '14px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 11.5,
    color: '#7a8fa8',
  },
};

export default function WidgetEmbedTest() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [widgetCode, setWidgetCode] = React.useState('');
  const [domainWarning, setDomainWarning] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [slide, setSlide] = React.useState(0);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1100;

  React.useEffect(() => {
    const id = setInterval(() => setSlide((current) => (current + 1) % BANNERS.length), 5000);
    return () => clearInterval(id);
  }, []);

  const loadWidget = React.useCallback(async () => {
    const id = tenantId();
    if (!id) {
      setWidgetCode('');
      showToast(t('widget.tenant_missing'), 'error');
      return;
    }

    setLoading(true);
    try {
      const widgets = await listWidgets(id);
      const activeWidget = widgets[0] || null;
      if (!activeWidget) {
        setWidgetCode('');
        setDomainWarning('');
        return;
      }

      const domains = await listWidgetDomains(activeWidget.id);
      const host = currentDomain();
      if (!domainAllowed(host, domains)) {
        setWidgetCode('');
        setDomainWarning(
          `Domain hiện tại "${host}" chưa được thêm vào Allowed domains của widget. Hãy thêm domain này ở trang Tùy chỉnh Widget rồi quay lại test.`
        );
        return;
      }

      setDomainWarning('');
      setWidgetCode(activeWidget.code || '');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('widget.load_failed'), 'error');
      setWidgetCode('');
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  React.useEffect(() => {
    void loadWidget();
  }, [loadWidget]);

  React.useEffect(() => {
    document.querySelectorAll('.wisebot-widget-root').forEach((item) => item.remove());
    document.querySelectorAll('script[data-wisebot-test-script="true"]').forEach((item) => item.remove());

    if (!widgetCode) return;

    const script = document.createElement('script');
    script.src = `/widget.js?v=${WIDGET_SCRIPT_VERSION}`;
    script.async = true;
    script.dataset.id = widgetCode;
    script.dataset.apiBase = window.location.origin;
    script.dataset.wisebotTestScript = 'true';
    document.body.appendChild(script);

    return () => {
      script.remove();
      document.querySelectorAll('.wisebot-widget-root').forEach((item) => item.remove());
    };
  }, [widgetCode]);

  return (
    <div style={styles.page}>
      {!widgetCode && !loading && (
        <div style={styles.noWidget}>
          {domainWarning || t('widget.publish_first')}
        </div>
      )}

      <header style={styles.header}>
        <div
          style={{
            ...styles.headerInner,
            padding: isMobile ? '8px 14px' : '0 20px',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? 10 : 14,
          }}
        >
          <div style={{ ...styles.logoGroup, gap: isMobile ? 10 : 14, minWidth: 0 }}>
            <img
              src="/ictu-logo.png"
              alt="ICTU Logo"
              style={{ ...styles.logo, height: isMobile ? 48 : 64 }}
            />
            <div
              style={{
                ...styles.logoText,
                fontSize: isMobile ? 12 : isTablet ? 14 : 16,
                maxWidth: isMobile ? 'calc(100vw - 86px)' : undefined,
              }}
            >
              <div>Đại học Thái Nguyên</div>
              <div>Trường Đại học Công nghệ Thông tin và Truyền thông</div>
            </div>
          </div>

          <div style={{ ...styles.social, display: isMobile ? 'none' : 'flex' }}>
            <a href="#" aria-label="Facebook" style={styles.socialIcon}>
              <img src="/social-facebook.svg" alt="Facebook" style={styles.socialImage} />
            </a>
            <a href="#" aria-label="Website" style={styles.socialIcon}>
              <img src="/social-website.svg" alt="Website" style={styles.socialImage} />
            </a>
            <a href="#" aria-label="YouTube" style={styles.socialIcon}>
              <img src="/social-youtube.svg" alt="YouTube" style={styles.socialImage} />
            </a>
            <a href="#" aria-label="TikTok" style={styles.socialIcon}>
              <img src="/social-tiktok.svg" alt="TikTok" style={styles.socialImage} />
            </a>
            <a href="#" aria-label="English" style={styles.socialIcon}>
              <img src="/flag-uk.svg" alt="English" style={styles.socialImage} />
            </a>
          </div>
        </div>
      </header>

      <nav style={styles.nav}>
        <div
          style={{
            ...styles.navInner,
            padding: isMobile ? '0 10px' : '0 20px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <a
            href="/customization"
            style={{
              ...styles.homeIcon,
              height: isMobile ? 42 : 46,
              padding: isMobile ? '0 12px' : '0 18px',
              flex: '0 0 auto',
            }}
          >
            <ArrowLeft size={16} />
          </a>
          {NAV.map((item) => (
            <a
              key={item}
              href="#"
              style={{
                ...styles.navItem,
                height: isMobile ? 42 : 46,
                padding: isMobile ? '0 14px' : isTablet ? '0 16px' : '0 23px',
                fontSize: isMobile ? 12 : 14,
                flex: '0 0 auto',
              }}
            >
              {item}
            </a>
          ))}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            style={{
              ...styles.searchBtn,
              width: isMobile ? 42 : 46,
              height: isMobile ? 42 : 46,
              border: 0,
              background: 'transparent',
              flex: '0 0 auto',
            }}
          >
            <Search size={22} />
          </button>
        </div>
      </nav>

      {searchOpen && (
        <div style={styles.searchOverlay} onClick={() => setSearchOpen(false)}>
          <div style={styles.searchBox} onClick={(event) => event.stopPropagation()}>
            <input style={styles.searchInput} type="text" placeholder="Tìm kiếm thông tin trường..." autoFocus />
            <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Nhập từ khóa rồi nhấn Enter để tìm kiếm.</p>
          </div>
        </div>
      )}

      <section
        style={{
          ...styles.hero,
          aspectRatio: isMobile ? '16 / 10' : isTablet ? '16 / 7' : styles.hero.aspectRatio,
          minHeight: isMobile ? 260 : undefined,
        }}
      >
        {BANNERS.map((src, index) => (
          <img
            key={src}
            src={src}
            alt={`Banner ${index + 1}`}
            style={{
              ...styles.heroImage,
              opacity: slide === index ? 1 : 0,
              zIndex: slide === index ? 1 : 0,
            }}
          />
        ))}
        <div style={styles.dots}>
          {BANNERS.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Banner ${index + 1}`}
              onClick={() => setSlide(index)}
              style={slide === index ? { ...styles.dot, ...styles.dotActive } : styles.dot}
            />
          ))}
        </div>
      </section>

      <footer style={{ ...styles.footer, padding: isMobile ? '28px 16px 0' : '36px 20px 0' }}>
        <div
          style={{
            ...styles.footerInner,
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1.5fr 1fr 1fr' : styles.footerInner.gridTemplateColumns,
            gap: isMobile ? 22 : 36,
          }}
        >
          <div>
            <div style={styles.logoBlock}>
              <img src="/ictu-logo.png" alt="ICTU" style={styles.footerLogo} />
              <div style={styles.footerName}>Trường ĐH Công nghệ<br />Thông tin và Truyền thông</div>
            </div>
            <div style={styles.footerInfo}>
              <div style={styles.footerInfoRow}><MapPin size={13} /> <span>Phường Quyết Thắng, TP. Thái Nguyên, tỉnh Thái Nguyên</span></div>
              <div style={styles.footerInfoRow}><Phone size={13} /> <span>(0208) 3 848 624</span></div>
              <div style={styles.footerInfoRow}><Mail size={13} /> <span>contact@ictu.edu.vn</span></div>
            </div>
          </div>

          {[
            ['Đào tạo', ['Đại học chính quy', 'Sau đại học', 'Đào tạo từ xa', 'Bồi dưỡng ngắn hạn']],
            ['Khoa & Bộ môn', ['Khoa CNTT', 'Khoa Điện tử', 'Khoa Kinh tế', 'Bộ môn Toán']],
            ['Hỗ trợ', ['Tuyển sinh', 'Học bổng', 'Ký túc xá', 'Việc làm sinh viên']],
          ].map(([title, links]) => (
            <div key={title as string}>
              <div style={styles.colTitle}>{title}</div>
              <div style={styles.colLinks}>
                {(links as string[]).map((link) => (
                  <a key={link} href="#" style={styles.footerLink}>{link}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            ...styles.bottom,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? 8 : 0,
            padding: isMobile ? '14px 0 18px' : '14px 0',
            lineHeight: 1.5,
          }}
        >
          <span>© 2026 Trường Đại học Công nghệ Thông tin và Truyền thông – ICTU</span>
          <div>Powered by <span style={{ color: ORANGE, fontWeight: 700 }}>WiseBot AI</span></div>
        </div>
      </footer>
    </div>
  );
}
