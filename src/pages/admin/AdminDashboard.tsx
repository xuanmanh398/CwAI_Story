import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import {
  Shield,
  BookOpen,
  FileText,
  Users,
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  Lock,
  Upload,
  Palette,
  Megaphone,
  Globe,
  ExternalLink,
  Save,
  Coins,
  Wallet,
  CreditCard,
  DollarSign,
  Check,
  X,
  Search,
  Settings,
  Sliders,
  Mail,
  Bot,
  Sparkles,
  Send,
  Ban,
  UserX,
  AlertOctagon,
  Bell,
} from 'lucide-react';
import { processCoverImage, generateArtisticCoverCanvas } from '../../utils/imageUtils';

export const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { refreshConfig } = useConfig();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'stats' | 'books' | 'addBook' | 'aiCrawler' | 'withdrawals' | 'moderation' | 'ads' | 'sources' | 'rights' | 'users' | 'audit'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [rights, setRights] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tìm kiếm truyện trong tab books
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Tự động nhận diện Model AI
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
  const [discoveringModels, setDiscoveringModels] = useState(false);

  // Quản lý Hàng đợi Kiểm duyệt Nội dung
  const [moderationQueue, setModerationQueue] = useState<any[]>([]);
  const [moderationFilter, setModerationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [notifyAuthorModalItem, setNotifyAuthorModalItem] = useState<any | null>(null);
  const [notifyAuthorMessage, setNotifyAuthorMessage] = useState('');
  const [notifyAuthorSending, setNotifyAuthorSending] = useState(false);

  // Xem nhật ký người dùng
  const [userHistoryModalUser, setUserHistoryModalUser] = useState<any | null>(null);
  const [userHistoryData, setUserHistoryData] = useState<{ user: any; transactions: any[]; notifications: any[] } | null>(null);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);

  // Cấu hình (Quảng cáo & Hệ thống Email/AI)
  const [configSubTab, setConfigSubTab] = useState<'ads' | 'system'>('ads');
  const [systemConfigForm, setSystemConfigForm] = useState({
    email: {
      provider: 'resend',
      resendApiKey: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      fromEmail: 'noreply@truyennha.id.vn',
      fromName: 'Truyện Nhà',
    },
    ai: {
      enabled: false,
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-1.5-flash',
      autoModerateNovels: false,
      autoModerateComments: false,
    },
  });
  const [systemConfigSaving, setSystemConfigSaving] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testAiLoading, setTestAiLoading] = useState(false);

  // Quản lý người dùng: Cảnh báo & Khóa
  const [warnModalUser, setWarnModalUser] = useState<any | null>(null);
  const [warnForm, setWarnForm] = useState({ title: 'Cảnh báo vi phạm nội quy Truyện Nhà', content: '' });
  const [warningSending, setWarningSending] = useState(false);

  const [lockModalUser, setLockModalUser] = useState<any | null>(null);
  const [lockForm, setLockForm] = useState({
    lockType: 'temporary' as 'temporary' | 'permanent',
    days: 7,
    reason: 'Vi phạm quy định đăng tải và nội quy cộng đồng',
    notifyEmail: true,
  });
  const [lockSending, setLockSending] = useState(false);

  // Form tạo truyện mới
  const [newBook, setNewBook] = useState({
    title: '',
    slug: '',
    author_name: '',
    cover_url: '',
    description: '',
    status: 'ongoing',
    publication_status: 'published',
    license_owner: '',
    license_type: 'Độc quyền phân phối số TruyenNha',
    is_18_plus: false,
    is_premium: false,
  });

  // Modal thêm chương cho truyện
  const [selectedBookForChapter, setSelectedBookForChapter] = useState<any | null>(null);
  const [newChapter, setNewChapter] = useState({
    chapter_number: 1,
    title: '',
    slug: '',
    content: '',
    publication_status: 'published',
  });

  // State cho AI Crawler & Editor
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlRawContent, setCrawlRawContent] = useState('');
  const [crawlTitle, setCrawlTitle] = useState('');
  const [aiAction, setAiAction] = useState<'polish' | 'translate' | 'summarize'>('polish');
  const [aiSourceLang, setAiSourceLang] = useState('Tiếng Trung');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'cloudflare_ai' | 'gemini' | 'fallback'>('cloudflare_ai');
  const [aiProcessedContent, setAiProcessedContent] = useState('');
  const [aiStatusMessage, setAiStatusMessage] = useState('');
  const [aiImportMode, setAiImportMode] = useState<'new_book' | 'existing_book_chapter'>('new_book');
  const [aiTargetBookId, setAiTargetBookId] = useState('');
  const [aiTargetBookTitle, setAiTargetBookTitle] = useState('');
  const [aiAuthorName, setAiAuthorName] = useState('');
  const [aiChapterNumber, setAiChapterNumber] = useState(1);
  const [aiPublishStatus, setAiPublishStatus] = useState<'draft' | 'published'>('draft');

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        navigate('/login?redirect=/admin');
      }
    }
  }, [user, authLoading, navigate]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {}
  };

  const loadBooks = async () => {
    try {
      const res = await fetch('/api/admin/books?limit=50', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setBooks(json.data || []);
    } catch {}
  };

  const loadSources = async () => {
    try {
      const res = await fetch('/api/admin/sources', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setSources(json.data || []);
    } catch {}
  };

  const loadRights = async () => {
    try {
      const res = await fetch('/api/admin/rights', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setRights(json.data || []);
    } catch {}
  };

  const loadUsers = async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setUserList(json.data || []);
    } catch {}
  };

  const loadAuditLogs = async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await fetch('/api/admin/audit-logs', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setAuditLogs(json.data || []);
    } catch {}
  };

  // State cấu hình quảng cáo (AdSense & Banner)
  const [adsForm, setAdsForm] = useState({
    adsense: {
      enabled: false,
      publisherId: '',
      slotTop: '',
      slotBottom: '',
      slotReader: '',
      autoAds: false,
    },
    customAds: {
      enabled: false,
      topBanner: { enabled: false, imageUrl: '', targetUrl: '', title: '' },
      bottomBanner: { enabled: false, imageUrl: '', targetUrl: '', title: '' },
      readerBanner: { enabled: false, imageUrl: '', targetUrl: '', title: '' },
    },
  });
  const [adsSaving, setAdsSaving] = useState(false);

  const loadAdsConfig = async () => {
    try {
      const res = await fetch('/api/admin/ads-config', { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success && json.data) {
        setAdsForm({
          adsense: {
            enabled: json.data.adsense?.enabled ?? false,
            publisherId: json.data.adsense?.publisherId ?? '',
            slotTop: json.data.adsense?.slotTop ?? '',
            slotBottom: json.data.adsense?.slotBottom ?? '',
            slotReader: json.data.adsense?.slotReader ?? '',
            autoAds: json.data.adsense?.autoAds ?? false,
          },
          customAds: {
            enabled: json.data.customAds?.enabled ?? false,
            topBanner: json.data.customAds?.topBanner || { enabled: false, imageUrl: '', targetUrl: '', title: '' },
            bottomBanner: json.data.customAds?.bottomBanner || { enabled: false, imageUrl: '', targetUrl: '', title: '' },
            readerBanner: json.data.customAds?.readerBanner || { enabled: false, imageUrl: '', targetUrl: '', title: '' },
          },
        });
      }
    } catch {}
  };

  const handleSaveAdsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdsSaving(true);
    try {
      const res = await fetch('/api/admin/ads-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(adsForm),
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: 'Đã lưu cấu hình quảng cáo thành công và kích hoạt trên toàn hệ thống!' });
        await refreshConfig();
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi khi lưu cấu hình quảng cáo' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi lưu cấu hình quảng cáo' });
    } finally {
      setAdsSaving(false);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals', { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success) {
        setWithdrawals(json.data || []);
      }
    } catch {}
  };

  const handleApproveWithdrawal = async (id: string) => {
    if (!confirm('Xác nhận bạn đã chuyển khoản thành công cho tác giả và phê duyệt lệnh này?')) return;
    setProcessingWithdrawalId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json.success) {
        alert('Đã phê duyệt lệnh rút tiền thành công!');
        loadWithdrawals();
        loadStats();
      } else {
        alert(json.error || 'Lỗi khi duyệt lệnh rút tiền');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    const reason = prompt('Nhập lý do từ chối (tiền sẽ được hoàn trả lại ví tác giả):');
    if (reason === null) return;
    setProcessingWithdrawalId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      const json = await res.json() as any;
      if (json.success) {
        alert('Đã từ chối lệnh rút và hoàn trả tiền vào ví tác giả.');
        loadWithdrawals();
        loadStats();
      } else {
        alert(json.error || 'Lỗi khi từ chối lệnh rút tiền');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const loadSystemConfig = async () => {
    try {
      const res = await fetch('/api/admin/system-config', { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success && json.data) {
        setSystemConfigForm(json.data);
      }
    } catch {}
  };

  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemConfigSaving(true);
    try {
      const res = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(systemConfigForm),
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: 'Đã lưu cấu hình hệ thống (Email & AI) thành công!' });
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi khi lưu cấu hình hệ thống' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi kết nối máy chủ' });
    } finally {
      setSystemConfigSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    try {
      const res = await fetch('/api/admin/system-config/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: testEmailTarget || user?.email,
          customConfig: systemConfigForm.email,
        }),
      });
      const json = await res.json() as any;
      if (json.success) {
        alert(json.message);
      } else {
        alert(json.error || 'Thử nghiệm email thất bại');
      }
    } catch {
      alert('Lỗi kết nối khi gửi thử email');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleTestAi = async () => {
    setTestAiLoading(true);
    try {
      const res = await fetch('/api/admin/system-config/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: systemConfigForm.ai.provider,
          apiKey: systemConfigForm.ai.apiKey,
          model: systemConfigForm.ai.model,
        }),
      });
      const json = await res.json() as any;
      if (json.success) {
        alert(`Thành công! Phản hồi từ AI: "${json.reply || ''}"`);
      } else {
        alert(json.error || 'Kết nối AI API thất bại');
      }
    } catch {
      alert('Lỗi kết nối khi kiểm tra AI API');
    } finally {
      setTestAiLoading(false);
    }
  };

  const handleDiscoverModels = async () => {
    if (!systemConfigForm.ai.apiKey.trim()) {
      alert('Vui lòng nhập API Key trước khi nhận diện danh sách Model.');
      return;
    }
    setDiscoveringModels(true);
    try {
      const res = await fetch('/api/admin/system-config/discover-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: systemConfigForm.ai.provider,
          apiKey: systemConfigForm.ai.apiKey,
        }),
      });
      const json = await res.json() as any;
      if (json.success && Array.isArray(json.models) && json.models.length > 0) {
        setDiscoveredModels(json.models);
        if (!json.models.includes(systemConfigForm.ai.model)) {
          setSystemConfigForm({
            ...systemConfigForm,
            ai: { ...systemConfigForm.ai, model: json.models[0] },
          });
        }
        alert(`Đã nhận diện thành công ${json.models.length} model khả dụng từ ${systemConfigForm.ai.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}!`);
      } else {
        alert(json.error || 'Không tìm thấy model nào phù hợp từ API Key này');
      }
    } catch {
      alert('Lỗi kết nối khi nhận diện Model AI');
    } finally {
      setDiscoveringModels(false);
    }
  };

  const loadModerationQueue = async () => {
    try {
      const res = await fetch('/api/admin/moderation', { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success) setModerationQueue(json.data || []);
    } catch {}
  };

  const handleApproveModeration = async (id: string) => {
    if (!confirm('Xác nhận phê duyệt và cho phép xuất bản nội dung này?')) return;
    try {
      const res = await fetch(`/api/admin/moderation/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json.success) {
        alert(json.message);
        loadModerationQueue();
      } else {
        alert(json.error || 'Lỗi khi phê duyệt');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleRejectModeration = async (id: string) => {
    if (!confirm('Xác nhận từ chối xuất bản nội dung vi phạm này?')) return;
    try {
      const res = await fetch(`/api/admin/moderation/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json.success) {
        alert(json.message);
        loadModerationQueue();
      } else {
        alert(json.error || 'Lỗi khi từ chối');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleNotifyAuthorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyAuthorModalItem) return;
    setNotifyAuthorSending(true);
    try {
      const res = await fetch(`/api/admin/moderation/${notifyAuthorModalItem.id}/notify-author`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: notifyAuthorMessage }),
      });
      const json = await res.json() as any;
      if (json.success) {
        alert(json.message);
        setNotifyAuthorModalItem(null);
        setNotifyAuthorMessage('');
        loadModerationQueue();
      } else {
        alert(json.error || 'Lỗi gửi thông báo cho tác giả');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setNotifyAuthorSending(false);
    }
  };

  const handleOpenUserHistory = async (u: any) => {
    setUserHistoryModalUser(u);
    setUserHistoryLoading(true);
    setUserHistoryData(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/transactions`, { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success && json.data) {
        setUserHistoryData(json.data);
      }
    } catch {
      alert('Lỗi khi tải lịch sử hoạt động của người dùng');
    } finally {
      setUserHistoryLoading(false);
    }
  };

  // Quản lý người dùng: Cảnh báo
  const handleWarnUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warnModalUser) return;
    setWarningSending(true);
    try {
      const res = await fetch(`/api/admin/users/${warnModalUser.id}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(warnForm),
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: json.message || 'Đã gửi cảnh báo thành công!' });
        setWarnModalUser(null);
        setWarnForm({ title: 'Cảnh báo vi phạm nội quy Truyện Nhà', content: '' });
      } else {
        alert(json.error || 'Lỗi gửi cảnh báo');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setWarningSending(false);
    }
  };

  // Quản lý người dùng: Khóa tài khoản
  const handleLockUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockModalUser) return;
    setLockSending(true);
    try {
      const res = await fetch(`/api/admin/users/${lockModalUser.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(lockForm),
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: json.message || 'Đã khóa tài khoản thành công!' });
        setLockModalUser(null);
        loadUsers();
      } else {
        alert(json.error || 'Lỗi khóa tài khoản');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setLockSending(false);
    }
  };

  // Quản lý người dùng: Mở khóa
  const handleUnlockUser = async (u: any) => {
    if (!confirm(`Xác nhận mở khóa tài khoản cho ${u.username}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${u.id}/unlock`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: `Đã mở khóa tài khoản ${u.username} thành công!` });
        loadUsers();
      } else {
        alert(json.error || 'Lỗi mở khóa tài khoản');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Quản lý người dùng: Xóa tài khoản
  const handleDeleteUser = async (u: any) => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${u.username}" (${u.email})? Thao tác này không thể hoàn tác!`)) return;
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: json.message || 'Đã xóa người dùng thành công!' });
        loadUsers();
      } else {
        alert(json.error || 'Lỗi xóa người dùng');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    }
  };

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'stats') {
      loadStats();
      loadModerationQueue();
    }
    else if (activeTab === 'books') loadBooks();
    else if (activeTab === 'withdrawals') loadWithdrawals();
    else if (activeTab === 'moderation') loadModerationQueue();
    else if (activeTab === 'ads') {
      loadAdsConfig();
      loadSystemConfig();
    }
    else if (activeTab === 'sources') loadSources();
    else if (activeTab === 'rights') loadRights();
    else if (activeTab === 'users') loadUsers();
    else if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab, user]);

  // Nạp 50 truyện mẫu dài tập chuẩn vào D1
  const handleSeed50Novels = async () => {
    if (!confirm('Bạn có chắc chắn muốn nạp 50 tác phẩm dài tập mẫu chuẩn (chia chapter chuẩn) vào cơ sở dữ liệu D1?')) return;
    setSeedingLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/seed-50', {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: json.message || 'Nạp 50 tác phẩm thành công!' });
        loadStats();
        loadBooks();
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi khi nạp dữ liệu' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi gọi nạp dữ liệu' });
    } finally {
      setSeedingLoading(false);
    }
  };

  // Tạo truyện mới
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newBook),
      });
      const json = await res.json();

      if (json.success) {
        setMessage({ type: 'success', text: 'Tạo bộ truyện mới thành công!' });
        setNewBook({
          title: '',
          slug: '',
          author_name: '',
          cover_url: '',
          description: '',
          status: 'ongoing',
          publication_status: 'published',
          license_owner: '',
          license_type: 'Độc quyền phân phối số TruyenNha',
          is_18_plus: false,
          is_premium: false,
        });
        setActiveTab('books');
        loadBooks();
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi khi tạo truyện' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi kết nối máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  // Thêm chương mới cho truyện
  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForChapter) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          book_id: selectedBookForChapter.id,
          ...newChapter,
        }),
      });
      const json = await res.json();

      if (json.success) {
        alert('Đã thêm chương thành công!');
        setSelectedBookForChapter(null);
        setNewChapter({
          chapter_number: 1,
          title: '',
          slug: '',
          content: '',
          publication_status: 'published',
        });
        loadBooks();
      } else {
        alert(json.error || 'Lỗi khi thêm chương');
      }
    } finally {
      setLoading(false);
    }
  };

  // Kích hoạt đồng bộ nguồn
  const handleSyncSource = async (sourceId: string) => {
    if (!confirm('Bạn có chắc muốn chạy đồng bộ nguồn cấp phép này ngay bây giờ?')) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/sources/${sourceId}/sync`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();

      if (json.success) {
        alert(`Đồng bộ thành công! Đã nạp ${json.data.totalFetched} truyện, cập nhật ${json.data.totalSaved} bản ghi.`);
        loadSources();
      } else {
        alert(json.error || 'Đồng bộ thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  // Xóa truyện
  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`HÀNH ĐỘNG PHÁ HỦY: Bạn có chắc chắn muốn xóa vĩnh viễn bộ truyện "${title}" và toàn bộ chương của truyện?`)) return;

    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        alert('Đã xóa bộ truyện thành công');
        loadBooks();
      } else {
        alert(json.error || 'Lỗi khi xóa truyện');
      }
    } catch {}
  };

  // Đổi trạng thái xuất bản
  const handleTogglePublish = async (bookId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'published' ? 'unpublished' : 'published';
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ publication_status: nextStatus }),
      });
      if (res.ok) {
        loadBooks();
      }
    } catch {}
  };

  // Đổi vai trò user
  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        loadUsers();
      } else {
        alert(json.error || 'Lỗi đổi quyền');
      }
    } catch {}
  };

  // Xử lý cào dữ liệu từ URL nguồn
  const handleExtractFromUrl = async () => {
    if (!crawlUrl.trim()) {
      alert('Vui lòng nhập URL cần trích xuất');
      return;
    }
    setLoading(true);
    setAiStatusMessage('Đang kết nối và bóc tách nội dung từ trang nguồn...');

    try {
      const res = await fetch('/api/admin/crawler/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: crawlUrl.trim() }),
      });
      const json = await res.json() as any;

      if (json.success && json.data) {
        setCrawlTitle(json.data.title || 'Chương mới');
        setCrawlRawContent(json.data.content || '');
        setAiProcessedContent(''); // Reset kết quả AI
        setAiStatusMessage(`Trích xuất thành công ${json.data.wordCount} chữ. Hãy chọn hành động AI tiếp theo.`);
      } else {
        alert(json.error || 'Không thể trích xuất nội dung từ trang này');
        setAiStatusMessage('');
      }
    } catch {
      alert('Lỗi mạng khi trích xuất dữ liệu');
      setAiStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý chạy AI Biên tập / Dịch thuật
  const handleRunAi = async () => {
    if (!crawlRawContent.trim()) {
      alert('Chưa có nội dung để AI xử lý');
      return;
    }
    setLoading(true);
    setAiStatusMessage('AI đang phân tích, biên tập và chuyển ngữ văn bản...');

    try {
      const res = await fetch('/api/admin/crawler/process-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: aiAction,
          content: crawlRawContent,
          sourceLanguage: aiSourceLang,
          targetLanguage: 'Tiếng Việt',
          novelGenre: 'Tiên Hiệp/Huyền Huyễn/Đô Thị',
          apiKey: aiApiKey,
          provider: aiProvider,
        }),
      });
      const json = await res.json() as any;

      if (json.success && json.data) {
        setAiProcessedContent(json.data.resultText);
        setAiStatusMessage(`Hoàn tất xử lý bởi [${json.data.providerUsed}]! Hãy kiểm tra và lưu vào thư viện.`);
      } else {
        alert(json.error || 'Lỗi khi gọi AI');
        setAiStatusMessage('');
      }
    } catch {
      alert('Lỗi kết nối AI');
      setAiStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  // Lưu nội dung đã biên tập vào Database D1
  const handleSaveImport = async () => {
    const finalContent = aiProcessedContent.trim() || crawlRawContent.trim();
    if (!finalContent) {
      alert('Chưa có nội dung để lưu');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/admin/crawler/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          importType: aiImportMode,
          bookId: aiTargetBookId,
          title: aiTargetBookTitle || crawlTitle,
          authorName: aiAuthorName || 'Sưu tầm & Biên tập AI',
          sourceUrl: crawlUrl,
          chapterNumber: aiChapterNumber,
          chapterTitle: crawlTitle,
          content: finalContent,
          publicationStatus: aiPublishStatus,
        }),
      });
      const json = await res.json() as any;

      if (json.success) {
        alert(json.message);
        loadBooks();
        setActiveTab('books');
      } else {
        alert(json.error || 'Lỗi khi lưu dữ liệu');
      }
    } catch {
      alert('Lỗi kết nối khi lưu');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <p className="text-xs text-gray-500">Đang xác thực quyền Quản trị...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-neutral-800 rounded-2xl shadow-md text-center space-y-4">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Yêu cầu quyền Quản trị tối cao</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          {user?.role === 'editor'
            ? 'Tài khoản của bạn có vai trò Biên tập viên. Theo chính sách hệ thống, Biên tập viên chỉ có quyền đăng tải và quản lý tác phẩm tại Không gian sáng tác Studio.'
            : 'Tài khoản hiện tại không có quyền truy cập trang quản trị.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          {user?.role === 'editor' && (
            <Link to="/studio" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold shadow">
              Đi tới Studio Sáng Tác
            </Link>
          )}
          <Link to="/" className="px-5 py-2.5 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 rounded-xl text-sm font-semibold">
            Về Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Khu vực Quản trị Hệ thống</h1>
            <p className="text-xs text-gray-500">
              Quyền hạn hiện tại: <strong className="text-brand-600 uppercase">{user.role}</strong> ({user.username})
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-gray-100 dark:bg-neutral-800 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'stats' ? 'bg-white dark:bg-neutral-700 shadow-sm text-brand-600 dark:text-white' : 'text-gray-600 dark:text-neutral-300'}`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('books')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'books' ? 'bg-white dark:bg-neutral-700 shadow-sm text-brand-600 dark:text-white' : 'text-gray-600 dark:text-neutral-300'}`}
          >
            Quản lý truyện
          </button>
          <button
            onClick={() => setActiveTab('addBook')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center ${activeTab === 'addBook' ? 'bg-white dark:bg-neutral-700 shadow-sm text-brand-600 dark:text-white' : 'text-gray-600 dark:text-neutral-300'}`}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Thêm truyện
          </button>
          <button
            onClick={() => setActiveTab('aiCrawler')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center ${activeTab === 'aiCrawler' ? 'bg-gradient-to-r from-purple-600 to-brand-600 text-white shadow-sm font-bold' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'}`}
          >
            ✨ AI Biên tập & Nhập nguồn
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'sources' ? 'bg-white dark:bg-neutral-700 shadow-sm text-brand-600 dark:text-white' : 'text-gray-600 dark:text-neutral-300'}`}
          >
            Nguồn cấp phép
          </button>
          <button
            onClick={() => setActiveTab('rights')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'rights' ? 'bg-white dark:bg-neutral-700 shadow-sm text-brand-600 dark:text-white' : 'text-gray-600 dark:text-neutral-300'}`}
          >
            Hồ sơ bản quyền
          </button>

          {user.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('ads')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center ${activeTab === 'ads' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'}`}
              >
                <Settings className="w-3.5 h-3.5 mr-1" />
                Cấu hình
              </button>
              <button
                onClick={() => setActiveTab('moderation')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center ${activeTab === 'moderation' ? 'bg-rose-600 text-white shadow-sm font-bold' : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'}`}
              >
                <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                Kiểm duyệt
                {moderationQueue.filter((m) => m.status === 'pending').length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black leading-none animate-pulse">
                    {moderationQueue.filter((m) => m.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center ${activeTab === 'withdrawals' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'text-gray-600 dark:text-neutral-300'}`}
              >
                <Wallet className="w-3.5 h-3.5 mr-1" />
                Duyệt Rút tiền
                {stats?.monetization?.pending_withdrawals_count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black leading-none">
                    {stats.monetization.pending_withdrawals_count}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'users' ? 'bg-white dark:bg-neutral-700 shadow-sm text-brand-600 dark:text-white' : 'text-gray-600 dark:text-neutral-300'}`}
              >
                Người dùng
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'audit' ? 'bg-white dark:bg-neutral-700 shadow-sm text-brand-600 dark:text-white' : 'text-gray-600 dark:text-neutral-300'}`}
              >
                Nhật ký kiểm toán
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 1. Tab Stats */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Tổng số truyện</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.books?.total || 0}</div>
              <span className="text-[11px] text-emerald-600">Đã xuất bản: {stats.books?.published || 0}</span>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Tổng số chương</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.chapters?.total || 0}</div>
              <span className="text-[11px] text-emerald-600">Đã xuất bản: {stats.chapters?.published || 0}</span>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Tổng người dùng</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.users?.total || 0}</div>
              <span className="text-[11px] text-brand-600">Admin/Editor: {(stats.users?.admins || 0) + (stats.users?.editors || 0)}</span>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Lượt đọc truyện thực tế</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalViews || 0}</div>
              <span className="text-[11px] text-emerald-600">Chống cheat view IP 30 phút</span>
            </div>
          </div>

          {/* Doanh thu & Monetization */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
              <Coins className="w-4 h-4 mr-2 text-amber-500" />
              Doanh thu & Phân chia Tác phẩm (Phí nền tảng 15% / Tác giả 85%)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Doanh thu mở khóa</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">
                  {stats.monetization?.total_revenue_coins || 0} <span className="text-xs font-normal">Xu</span>
                </div>
                <span className="text-[11px] text-gray-500">
                  ≈ {((stats.monetization?.total_revenue_coins || 0) * 1000).toLocaleString()} VNĐ ({stats.monetization?.total_purchases || 0} lượt)
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Phí nền tảng thu được (15%)</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {stats.monetization?.platform_fee_revenue || 0} <span className="text-xs font-normal">Xu</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">
                  ≈ {((stats.monetization?.platform_fee_revenue || 0) * 1000).toLocaleString()} VNĐ
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-purple-200 dark:border-purple-900/40 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Chi trả cho tác giả (85%)</span>
                <div className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.monetization?.author_revenue || 0} <span className="text-xs font-normal">Xu</span>
                </div>
                <span className="text-[11px] text-purple-600 font-medium">
                  ≈ {((stats.monetization?.author_revenue || 0) * 1000).toLocaleString()} VNĐ
                </span>
              </div>

              <div
                onClick={() => setActiveTab('withdrawals')}
                className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm cursor-pointer hover:border-rose-400 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs text-rose-600 font-medium">Chờ duyệt rút tiền</span>
                  <span className="text-[10px] text-rose-600 underline">Xem lệnh →</span>
                </div>
                <div className="text-2xl font-bold text-rose-600 mt-1">
                  {stats.monetization?.pending_withdrawals_count || 0} <span className="text-xs font-normal">lệnh</span>
                </div>
                <span className="text-[11px] text-rose-500 font-medium">
                  Tổng: {(stats.monetization?.pending_withdrawals_amount || 0).toLocaleString()} VNĐ
                </span>
              </div>
            </div>
          </div>

          {/* Banner Nạp 50 truyện mẫu dài tập */}
          <div className="p-5 bg-gradient-to-r from-brand-900/10 via-purple-900/10 to-transparent dark:from-brand-950/40 dark:via-purple-950/30 rounded-2xl border border-brand-200/60 dark:border-brand-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center">
                <Database className="w-4 h-4 mr-2 text-brand-600" />
                Kho Dữ Liệu 50 Bộ Truyện Dài Tập Đầy Đủ
              </h3>
              <p className="text-xs text-gray-600 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                Nạp tức thì 50 tác phẩm văn học tự do và dã sử kinh điển gồm 6 thể loại (Tiên Hiệp, Kiếm Hiệp, Đô Thị, Khoa Huyễn, Huyền Huyễn, Trinh Thám), mỗi truyện có đầy đủ bìa, tác giả, tóm tắt và chia chapter chuẩn vào Cloudflare D1.
              </p>
            </div>
            <button
              onClick={handleSeed50Novels}
              disabled={seedingLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold rounded-xl text-xs hover:from-brand-700 hover:to-purple-700 transition shadow-sm flex items-center shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${seedingLoading ? 'animate-spin' : ''}`} />
              {seedingLoading ? 'Đang nạp 50 truyện...' : '⚡ Nạp 50 truyện chuẩn vào D1'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Tab Quản lý truyện */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <h2 className="font-bold text-sm text-gray-900 dark:text-white shrink-0">
                Danh sách truyện ({books.filter(b => !bookSearchQuery.trim() || (b.title && b.title.toLowerCase().includes(bookSearchQuery.toLowerCase())) || (b.author_name && b.author_name.toLowerCase().includes(bookSearchQuery.toLowerCase()))).length}/{books.length})
              </h2>
              <div className="relative flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên truyện hoặc tác giả..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-brand-500"
                />
                {bookSearchQuery && (
                  <button
                    onClick={() => setBookSearchQuery('')}
                    className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-600 text-sm font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleSeed50Novels}
                disabled={seedingLoading}
                className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold flex items-center hover:bg-purple-200 transition"
              >
                <Database className="w-3.5 h-3.5 mr-1" />
                {seedingLoading ? 'Đang nạp...' : 'Nạp 50 truyện chuẩn'}
              </button>
              <button
                onClick={() => setActiveTab('addBook')}
                className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm truyện mới
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500 border-b border-gray-200 dark:border-neutral-700">
                <tr>
                  <th className="p-3">Truyện</th>
                  <th className="p-3">Tác giả</th>
                  <th className="p-3">Chương</th>
                  <th className="p-3">Bản quyền</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700/60">
                {books
                  .filter((b) => {
                    if (!bookSearchQuery.trim()) return true;
                    const q = bookSearchQuery.toLowerCase();
                    return (
                      (b.title && b.title.toLowerCase().includes(q)) ||
                      (b.author_name && b.author_name.toLowerCase().includes(q))
                    );
                  })
                  .map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-neutral-750">
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">
                      <Link to={`/books/${b.slug}`} target="_blank" className="hover:text-brand-600">
                        {b.title}
                      </Link>
                      <div className="text-[10px] text-gray-400 font-mono">{b.slug}</div>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-neutral-300">{b.author_name || 'Khuyết danh'}</td>
                    <td className="p-3 text-gray-600 dark:text-neutral-300">{b.total_chapters || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        b.license_status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.license_status || 'Chưa xác minh'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleTogglePublish(b.id, b.publication_status)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                          b.publication_status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title="Bấm để bật/tắt xuất bản"
                      >
                        {b.publication_status === 'published' ? 'Đã xuất bản' : 'Bản nháp / Khóa'}
                      </button>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBookForChapter(b);
                          setNewChapter((prev) => ({
                            ...prev,
                            chapter_number: (b.total_chapters || 0) + 1,
                            title: `Chương ${(b.total_chapters || 0) + 1}: `,
                            slug: `chuong-${(b.total_chapters || 0) + 1}`,
                          }));
                        }}
                        className="px-2.5 py-1 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 rounded font-medium hover:bg-brand-100"
                      >
                        + Thêm chương
                      </button>
                      {user.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteBook(b.id, b.title)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Xóa truyện"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* 3. Tab Thêm Truyện Mới */}
      {activeTab === 'addBook' && (
        <div className="max-w-2xl bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Thêm tác phẩm mới</h2>
          <form onSubmit={handleCreateBook} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium mb-1">Tên tác phẩm *</label>
              <input
                type="text"
                required
                value={newBook.title}
                onChange={(e) => {
                  const title = e.target.value;
                  const slug = title
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-');
                  setNewBook({ ...newBook, title, slug });
                }}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                placeholder="Ví dụ: Thiên Cổ Đệ Nhất Kiếm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Slug URL *</label>
                <input
                  type="text"
                  required
                  value={newBook.slug}
                  onChange={(e) => setNewBook({ ...newBook, slug: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Tác giả</label>
                <input
                  type="text"
                  value={newBook.author_name}
                  onChange={(e) => setNewBook({ ...newBook, author_name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  placeholder="Tên tác giả tự sáng tác"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-medium mb-1">Ảnh bìa tác phẩm</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBook.cover_url?.startsWith('data:image') ? '(Ảnh đã tải từ máy tính)' : newBook.cover_url}
                  disabled={newBook.cover_url?.startsWith('data:image')}
                  onChange={(e) => setNewBook({ ...newBook, cover_url: e.target.value })}
                  className="flex-1 p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                  placeholder="Nhập URL ảnh https://... hoặc tải từ máy"
                />
                <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-xs font-semibold flex items-center cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Tải từ máy
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await processCoverImage(file);
                          setNewBook({ ...newBook, cover_url: dataUrl });
                        } catch (err: any) {
                          alert(err.message || 'Lỗi xử lý ảnh');
                        }
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const dataUrl = generateArtisticCoverCanvas(
                      newBook.title || 'Tuyệt Phẩm Truyện',
                      newBook.author_name || 'Tác Giả',
                      newBook.is_18_plus ? '18plus' : 'tienhiep'
                    );
                    if (dataUrl) setNewBook({ ...newBook, cover_url: dataUrl });
                  }}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center cursor-pointer shrink-0 shadow-sm transition"
                >
                  <Palette className="w-3.5 h-3.5 mr-1" />
                  Tạo bìa đẹp
                </button>
                {newBook.cover_url?.startsWith('data:image') && (
                  <button
                    type="button"
                    onClick={() => setNewBook({ ...newBook, cover_url: '' })}
                    className="px-2.5 py-1 text-xs text-red-500 hover:underline"
                  >
                    Gỡ
                  </button>
                )}
              </div>
              {newBook.cover_url && (
                <div className="w-16 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm mt-1">
                  <img src={newBook.cover_url} alt="Bìa xem trước" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">Tóm tắt nội dung</label>
              <textarea
                rows={4}
                value={newBook.description}
                onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                placeholder="Nội dung giới thiệu cốt truyện..."
              />
            </div>

            <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg space-y-2 border border-gray-100 dark:border-neutral-700">
              <span className="font-semibold block text-brand-700 dark:text-brand-400">Cam kết bản quyền & cấp phép</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Chủ sở hữu quyền / Tác giả</label>
                  <input
                    type="text"
                    value={newBook.license_owner}
                    onChange={(e) => setNewBook({ ...newBook, license_owner: e.target.value })}
                    className="w-full p-2 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    placeholder="Ví dụ: Tác giả Lam Vũ"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Loại giấy phép</label>
                  <input
                    type="text"
                    value={newBook.license_type}
                    onChange={(e) => setNewBook({ ...newBook, license_type: e.target.value })}
                    className="w-full p-2 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Tình trạng ra truyện</label>
                <select
                  value={newBook.status}
                  onChange={(e) => setNewBook({ ...newBook, status: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                >
                  <option value="ongoing">Đang tiến hành</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="hiatus">Tạm ngưng</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Trạng thái xuất bản</label>
                <select
                  value={newBook.publication_status}
                  onChange={(e) => setNewBook({ ...newBook, publication_status: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                >
                  <option value="published">Xuất bản công khai</option>
                  <option value="draft">Bản nháp (Draft)</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-2.5">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-rose-900 dark:text-rose-200">
                <input
                  type="checkbox"
                  checked={newBook.is_18_plus}
                  onChange={(e) => setNewBook({ ...newBook, is_18_plus: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>🔞 Phân loại nội dung 18+ (Tự động chặn Google AdSense và yêu cầu quyền xem)</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-amber-900 dark:text-amber-200">
                <input
                  type="checkbox"
                  checked={newBook.is_premium}
                  onChange={(e) => setNewBook({ ...newBook, is_premium: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span>👑 Yêu cầu tài khoản thành viên Premium để mở khóa chương</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo tác phẩm'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Mới: AI Biên Tập & Nhập Nguồn Truyện */}
      {activeTab === 'aiCrawler' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900/80 via-neutral-900 to-brand-950 p-6 rounded-2xl text-white border border-purple-500/30 shadow-lg space-y-2">
            <h2 className="text-xl font-bold flex items-center">
              <span className="mr-2">✨</span> Trợ Lý AI Biên Tập & Chuyển Ngữ Truyện Tự Động
            </h2>
            <p className="text-xs text-purple-200 leading-relaxed max-w-3xl">
              Hệ thống kết hợp công nghệ bóc tách nội dung HTML an toàn (chống SSRF) với mô hình AI (Cloudflare Workers AI Llama 3.1 / Google Gemini). Tự động dịch thuật, nhuận sắc văn phong thuần Việt, sửa lỗi chính tả và loại bỏ các đoạn quảng cáo rác từ nguồn gốc.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột Trái: Nhập Nguồn & Cấu hình AI */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-5 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center pb-2 border-b border-gray-100 dark:border-neutral-700">
                1. Nhập nguồn & Trích xuất nội dung
              </h3>

              <div>
                <label className="block font-medium mb-1 text-gray-700 dark:text-neutral-300">
                  Địa chỉ URL trang nguồn (Chương truyện hoặc bài viết)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={crawlUrl}
                    onChange={(e) => setCrawlUrl(e.target.value)}
                    placeholder="https://trang-nguon.com/chuong-1..."
                    className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={handleExtractFromUrl}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex-shrink-0"
                  >
                    Bóc tách dữ liệu
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-gray-700 dark:text-neutral-300">
                  Tiêu đề chương
                </label>
                <input
                  type="text"
                  value={crawlTitle}
                  onChange={(e) => setCrawlTitle(e.target.value)}
                  placeholder="Ví dụ: Chương 1: Khởi đầu..."
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-gray-700 dark:text-neutral-300">
                  Hoặc dán văn bản thô trực tiếp
                </label>
                <textarea
                  rows={6}
                  value={crawlRawContent}
                  onChange={(e) => setCrawlRawContent(e.target.value)}
                  placeholder="Dán nội dung chương truyện cần biên tập vào đây..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-[11px]"
                />
              </div>

              {/* Cấu hình tác vụ AI */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-800/40 space-y-3">
                <h4 className="font-bold text-purple-900 dark:text-purple-300 flex items-center">
                  2. Lựa chọn tác vụ AI
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiAction('polish')}
                    className={`py-2 px-2.5 rounded-lg border text-center transition font-semibold ${
                      aiAction === 'polish'
                        ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                        : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    Biên tập & Nhuận sắc
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiAction('translate')}
                    className={`py-2 px-2.5 rounded-lg border text-center transition font-semibold ${
                      aiAction === 'translate'
                        ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                        : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    Dịch sang tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiAction('summarize')}
                    className={`py-2 px-2.5 rounded-lg border text-center transition font-semibold ${
                      aiAction === 'summarize'
                        ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                        : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    Tóm tắt cốt truyện
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Mô hình AI</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                    >
                      <option value="cloudflare_ai">Cloudflare Workers AI (Llama 3.1)</option>
                      <option value="gemini">Google Gemini 1.5 Flash</option>
                      <option value="fallback">Bộ lọc làm sạch cục bộ (Regex Engine)</option>
                    </select>
                  </div>

                  {aiProvider === 'gemini' && (
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Gemini API Key (Tùy chọn)</label>
                      <input
                        type="password"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono"
                      />
                    </div>
                  )}

                  {aiAction === 'translate' && (
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">Ngôn ngữ nguồn</label>
                      <select
                        value={aiSourceLang}
                        onChange={(e) => setAiSourceLang(e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                      >
                        <option value="Tiếng Trung (Bạch thoại/Hán Việt)">Tiếng Trung</option>
                        <option value="Tiếng Anh (English)">Tiếng Anh</option>
                        <option value="Tiếng Hàn (Korean)">Tiếng Hàn</option>
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRunAi}
                  disabled={loading || !crawlRawContent.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 text-white font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <span>🚀</span>
                  <span>{loading ? 'Đang phân tích và xử lý...' : 'Thực hiện biên tập với AI'}</span>
                </button>
              </div>

              {aiStatusMessage && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                  {aiStatusMessage}
                </div>
              )}
            </div>

            {/* Cột Phải: Xem Trước Kết Quả & Lưu Vào Thư Viện */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-5 shadow-sm space-y-4 text-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-neutral-700">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    3. Kết quả sau khi xử lý AI
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    {aiProcessedContent ? `${aiProcessedContent.split(/\s+/).filter(Boolean).length} chữ` : 'Chưa có dữ liệu'}
                  </span>
                </div>

                <textarea
                  rows={13}
                  value={aiProcessedContent}
                  onChange={(e) => setAiProcessedContent(e.target.value)}
                  placeholder="Văn bản sau khi AI chuyển ngữ, nhuận sắc và làm sạch sẽ xuất hiện tại đây..."
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-serif leading-relaxed text-xs"
                />

                {/* Cấu hình lưu trữ */}
                <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 space-y-3">
                  <span className="font-bold text-gray-900 dark:text-white block">
                    4. Lưu tác phẩm vào Database D1
                  </span>

                  <div className="flex gap-4">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={aiImportMode === 'new_book'}
                        onChange={() => setAiImportMode('new_book')}
                      />
                      <span>Tạo thành bộ truyện mới</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={aiImportMode === 'existing_book_chapter'}
                        onChange={() => setAiImportMode('existing_book_chapter')}
                      />
                      <span>Thêm chương vào truyện có sẵn</span>
                    </label>
                  </div>

                  {aiImportMode === 'new_book' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-500 mb-1">Tên bộ truyện *</label>
                        <input
                          type="text"
                          value={aiTargetBookTitle}
                          onChange={(e) => setAiTargetBookTitle(e.target.value)}
                          placeholder="Nhập tên truyện..."
                          className="w-full p-2 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Tác giả</label>
                        <input
                          type="text"
                          value={aiAuthorName}
                          onChange={(e) => setAiAuthorName(e.target.value)}
                          placeholder="Tên tác giả..."
                          className="w-full p-2 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-gray-500 mb-1">Chọn bộ truyện tiếp nhận chương</label>
                      <select
                        value={aiTargetBookId}
                        onChange={(e) => setAiTargetBookId(e.target.value)}
                        className="w-full p-2 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                      >
                        <option value="">-- Chọn truyện --</option>
                        {books.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} (Hiện có {b.total_chapters} chương)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-500 mb-1">Số thứ tự chương</label>
                      <input
                        type="number"
                        value={aiChapterNumber}
                        onChange={(e) => setAiChapterNumber(parseInt(e.target.value, 10) || 1)}
                        className="w-full p-2 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1">Trạng thái lưu</label>
                      <select
                        value={aiPublishStatus}
                        onChange={(e) => setAiPublishStatus(e.target.value as any)}
                        className="w-full p-2 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                      >
                        <option value="draft">Bản nháp (Draft - Khuyên dùng để kiểm duyệt)</option>
                        <option value="published">Xuất bản công khai ngay</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveImport}
                disabled={loading || (!aiProcessedContent.trim() && !crawlRawContent.trim())}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition disabled:opacity-50 mt-4 flex items-center justify-center space-x-1.5"
              >
                <span>💾</span>
                <span>Lưu tác phẩm vào Thư viện D1</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Chương */}
      {selectedBookForChapter && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-neutral-700">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Thêm chương mới cho: <span className="text-brand-600">{selectedBookForChapter.title}</span>
              </h3>
              <button onClick={() => setSelectedBookForChapter(null)} className="text-gray-400 hover:text-gray-600">
                Đóng
              </button>
            </div>

            <form onSubmit={handleAddChapter} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">Số thứ tự chương</label>
                  <input
                    type="number"
                    required
                    value={newChapter.chapter_number}
                    onChange={(e) => setNewChapter({ ...newChapter, chapter_number: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-medium mb-1">Tiêu đề chương *</label>
                  <input
                    type="text"
                    required
                    value={newChapter.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = `chuong-${newChapter.chapter_number}-${title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`;
                      setNewChapter({ ...newChapter, title, slug });
                    }}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    placeholder="Chương 1: Khởi đầu..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Slug chương</label>
                <input
                  type="text"
                  required
                  value={newChapter.slug}
                  onChange={(e) => setNewChapter({ ...newChapter, slug: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Nội dung chương (Văn bản thuần an toàn) *</label>
                <textarea
                  rows={10}
                  required
                  value={newChapter.content}
                  onChange={(e) => setNewChapter({ ...newChapter, content: e.target.value })}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-serif leading-relaxed"
                  placeholder="Nhập nội dung chương..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookForChapter(null)}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700"
                >
                  {loading ? 'Đang lưu...' : 'Lưu chương'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Cấu hình (Quảng cáo & Hệ thống Email/AI) */}
      {activeTab === 'ads' && user.role === 'admin' && (
        <div className="space-y-6">
          {/* Subtabs switcher */}
          <div className="flex border-b border-gray-200 dark:border-neutral-700 space-x-2">
            <button
              onClick={() => setConfigSubTab('ads')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center transition ${
                configSubTab === 'ads'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-neutral-300'
              }`}
            >
              <Megaphone className="w-4 h-4 mr-1.5" />
              Cấu hình Quảng cáo
            </button>
            <button
              onClick={() => setConfigSubTab('system')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center transition ${
                configSubTab === 'system'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-neutral-300'
              }`}
            >
              <Sliders className="w-4 h-4 mr-1.5" />
              Cấu hình Hệ thống (Email & AI API)
            </button>
          </div>

          {configSubTab === 'ads' && (
            <form onSubmit={handleSaveAdsConfig} className="space-y-6">
              <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-amber-900 p-6 rounded-2xl text-white border border-amber-500/30 shadow-lg space-y-2">
                <h2 className="text-xl font-bold flex items-center">
                  <Megaphone className="w-5 h-5 mr-2" />
                  Cấu hình Quảng cáo & Doanh thu
                </h2>
                <p className="text-amber-100 text-xs leading-relaxed max-w-3xl">
                  Quản lý gắn mã quảng cáo Google AdSense chính thức hoặc Banner nhà tài trợ đối tác riêng. Thay đổi cấu hình tại đây sẽ có hiệu lực tức thì trên toàn website mà không cần khởi động lại server.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cột 1: Google AdSense */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        G
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Google AdSense</h3>
                        <p className="text-[11px] text-gray-500">Mạng quảng cáo tự động hàng đầu thế giới</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsForm.adsense.enabled}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            adsense: { ...adsForm.adsense, enabled: e.target.checked },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>

                  {/* Thông báo chính sách an toàn 18+ */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Tuân thủ chính sách:</strong> Hệ thống đã kích hoạt cơ chế tự động chặn 100% quảng cáo AdSense trên mọi truyện và chương thuộc thể loại 18+ để bảo đảm tài khoản không vi phạm chính sách nội dung của Google.
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                        Publisher ID (Mã nhà xuất bản) *
                      </label>
                      <input
                        type="text"
                        value={adsForm.adsense.publisherId}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            adsense: { ...adsForm.adsense, publisherId: e.target.value.trim() },
                          })
                        }
                        placeholder="pub-1234567890123456 hoặc ca-pub-..."
                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-xs focus:border-brand-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Lấy từ tài khoản Google AdSense (Cài đặt &gt; Thông tin tài khoản).</p>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="autoAds"
                        checked={adsForm.adsense.autoAds}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            adsense: { ...adsForm.adsense, autoAds: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-brand-600 rounded"
                      />
                      <label htmlFor="autoAds" className="text-xs font-medium text-gray-700 dark:text-neutral-300 cursor-pointer">
                        Kích hoạt Auto Ads (Quảng cáo tự động từ Google)
                      </label>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-neutral-700 space-y-3">
                      <span className="block font-bold text-gray-900 dark:text-white">Mã Vị Trí Quảng Cáo (Ad Slot IDs)</span>
                      
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 dark:text-neutral-400 mb-1">
                          Slot Đầu trang (Top Banner)
                        </label>
                        <input
                          type="text"
                          value={adsForm.adsense.slotTop}
                          onChange={(e) =>
                            setAdsForm({
                              ...adsForm,
                              adsense: { ...adsForm.adsense, slotTop: e.target.value.trim() },
                            })
                          }
                          placeholder="Ví dụ: 1234567890"
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 dark:text-neutral-400 mb-1">
                          Slot Cuối trang (Bottom Banner)
                        </label>
                        <input
                          type="text"
                          value={adsForm.adsense.slotBottom}
                          onChange={(e) =>
                            setAdsForm({
                              ...adsForm,
                              adsense: { ...adsForm.adsense, slotBottom: e.target.value.trim() },
                            })
                          }
                          placeholder="Ví dụ: 2345678901"
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 dark:text-neutral-400 mb-1">
                          Slot Trong chương đọc (Reader Banner)
                        </label>
                        <input
                          type="text"
                          value={adsForm.adsense.slotReader}
                          onChange={(e) =>
                            setAdsForm({
                              ...adsForm,
                              adsense: { ...adsForm.adsense, slotReader: e.target.value.trim() },
                            })
                          }
                          placeholder="Ví dụ: 3456789012"
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cột 2: Banner Đối tác / Nhà tài trợ */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Banner Đối Tác & Tài Trợ Riêng</h3>
                        <p className="text-[11px] text-gray-500">Chèn trực tiếp banner hình ảnh và link click của đối tác</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsForm.customAds.enabled}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            customAds: { ...adsForm.customAds, enabled: e.target.checked },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Top Banner */}
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-neutral-700/80 bg-gray-50/50 dark:bg-neutral-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 dark:text-neutral-200">1. Banner Đầu trang (Top)</span>
                        <input
                          type="checkbox"
                          checked={adsForm.customAds.topBanner?.enabled ?? false}
                          onChange={(e) =>
                            setAdsForm({
                              ...adsForm,
                              customAds: {
                                ...adsForm.customAds,
                                topBanner: { ...adsForm.customAds.topBanner, enabled: e.target.checked } as any,
                              },
                            })
                          }
                          className="w-3.5 h-3.5 text-amber-600"
                        />
                      </div>
                      <input
                        type="text"
                        value={adsForm.customAds.topBanner?.imageUrl || ''}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            customAds: {
                              ...adsForm.customAds,
                              topBanner: { ...adsForm.customAds.topBanner, imageUrl: e.target.value } as any,
                            },
                          })
                        }
                        placeholder="URL ảnh banner (https://...)"
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                      />
                      <input
                        type="text"
                        value={adsForm.customAds.topBanner?.targetUrl || ''}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            customAds: {
                              ...adsForm.customAds,
                              topBanner: { ...adsForm.customAds.topBanner, targetUrl: e.target.value } as any,
                            },
                          })
                        }
                        placeholder="Link đích khi người đọc bấm vào (https://...)"
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                      />
                    </div>

                    {/* Bottom Banner */}
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-neutral-700/80 bg-gray-50/50 dark:bg-neutral-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 dark:text-neutral-200">2. Banner Cuối trang (Bottom)</span>
                        <input
                          type="checkbox"
                          checked={adsForm.customAds.bottomBanner?.enabled ?? false}
                          onChange={(e) =>
                            setAdsForm({
                              ...adsForm,
                              customAds: {
                                ...adsForm.customAds,
                                bottomBanner: { ...adsForm.customAds.bottomBanner, enabled: e.target.checked } as any,
                              },
                            })
                          }
                          className="w-3.5 h-3.5 text-amber-600"
                        />
                      </div>
                      <input
                        type="text"
                        value={adsForm.customAds.bottomBanner?.imageUrl || ''}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            customAds: {
                              ...adsForm.customAds,
                              bottomBanner: { ...adsForm.customAds.bottomBanner, imageUrl: e.target.value } as any,
                            },
                          })
                        }
                        placeholder="URL ảnh banner (https://...)"
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                      />
                      <input
                        type="text"
                        value={adsForm.customAds.bottomBanner?.targetUrl || ''}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            customAds: {
                              ...adsForm.customAds,
                              bottomBanner: { ...adsForm.customAds.bottomBanner, targetUrl: e.target.value } as any,
                            },
                          })
                        }
                        placeholder="Link đích khi người đọc bấm vào (https://...)"
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                      />
                    </div>

                    {/* Reader Banner */}
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-neutral-700/80 bg-gray-50/50 dark:bg-neutral-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 dark:text-neutral-200">3. Banner Trong Chương Đọc (Reader)</span>
                        <input
                          type="checkbox"
                          checked={adsForm.customAds.readerBanner?.enabled ?? false}
                          onChange={(e) =>
                            setAdsForm({
                              ...adsForm,
                              customAds: {
                                ...adsForm.customAds,
                                readerBanner: { ...adsForm.customAds.readerBanner, enabled: e.target.checked } as any,
                              },
                            })
                          }
                          className="w-3.5 h-3.5 text-amber-600"
                        />
                      </div>
                      <input
                        type="text"
                        value={adsForm.customAds.readerBanner?.imageUrl || ''}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            customAds: {
                              ...adsForm.customAds,
                              readerBanner: { ...adsForm.customAds.readerBanner, imageUrl: e.target.value } as any,
                            },
                          })
                        }
                        placeholder="URL ảnh banner (https://...)"
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                      />
                      <input
                        type="text"
                        value={adsForm.customAds.readerBanner?.targetUrl || ''}
                        onChange={(e) =>
                          setAdsForm({
                            ...adsForm,
                            customAds: {
                              ...adsForm.customAds,
                              readerBanner: { ...adsForm.customAds.readerBanner, targetUrl: e.target.value } as any,
                            },
                          })
                        }
                        placeholder="Link đích khi người đọc bấm vào (https://...)"
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-neutral-700">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Xem thử các vị trí hiển thị ngoài trang chủ
                </a>

                <button
                  type="submit"
                  disabled={adsSaving}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 flex items-center transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {adsSaving ? 'Đang lưu cấu hình...' : 'Lưu Cấu Hình Quảng Cáo'}
                </button>
              </div>
            </form>
          )}

          {configSubTab === 'system' && (
            <form onSubmit={handleSaveSystemConfig} className="space-y-6">
              <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-900 p-6 rounded-2xl text-white border border-blue-500/30 shadow-lg space-y-2">
                <h2 className="text-xl font-bold flex items-center">
                  <Sliders className="w-5 h-5 mr-2" />
                  Cấu hình Hệ thống Tự Động (Email OTP & AI Moderation)
                </h2>
                <p className="text-blue-100 text-xs leading-relaxed max-w-3xl">
                  Thiết lập cổng gửi Email thông báo / OTP xác thực (Resend hoặc SMTP riêng) và API Trí tuệ Nhân tạo (Google Gemini hoặc OpenAI ChatGPT) để kiểm duyệt nội dung truyện & bình luận tự động.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cột 1: Cấu hình Email (Resend / SMTP) */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Cấu hình Gửi Email (OTP & Cảnh báo)</h3>
                        <p className="text-[11px] text-gray-500">Gửi mã xác thực đăng ký, quên mật khẩu và thư cảnh báo</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                        Phương thức gửi thư (Email Provider)
                      </label>
                      <select
                        value={systemConfigForm.email.provider}
                        onChange={(e) => setSystemConfigForm({
                          ...systemConfigForm,
                          email: { ...systemConfigForm.email, provider: e.target.value as any }
                        })}
                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-medium"
                      >
                        <option value="resend">Resend API (Khuyến nghị - Gửi nhanh, tỷ lệ vào Inbox cao)</option>
                        <option value="smtp">Máy chủ SMTP riêng (Gmail SMTP, Zimbra, Zoho...)</option>
                      </select>
                    </div>

                    {systemConfigForm.email.provider === 'resend' ? (
                      <div>
                        <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                          Resend API Key *
                        </label>
                        <input
                          type="password"
                          value={systemConfigForm.email.resendApiKey}
                          onChange={(e) => setSystemConfigForm({
                            ...systemConfigForm,
                            email: { ...systemConfigForm.email, resendApiKey: e.target.value.trim() }
                          })}
                          placeholder="re_..."
                          className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-xs focus:border-brand-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Lấy tại resend.com/api-keys (Miễn phí 3.000 email/tháng).</p>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-700">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-neutral-300">SMTP Host</label>
                            <input
                              type="text"
                              value={systemConfigForm.email.smtpHost}
                              onChange={(e) => setSystemConfigForm({
                                ...systemConfigForm,
                                email: { ...systemConfigForm.email, smtpHost: e.target.value.trim() }
                              })}
                              placeholder="smtp.gmail.com"
                              className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-medium mb-1 text-gray-700 dark:text-neutral-300">SMTP Port</label>
                            <input
                              type="number"
                              value={systemConfigForm.email.smtpPort}
                              onChange={(e) => setSystemConfigForm({
                                ...systemConfigForm,
                                email: { ...systemConfigForm.email, smtpPort: parseInt(e.target.value) || 587 }
                              })}
                              placeholder="587"
                              className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-medium mb-1 text-gray-700 dark:text-neutral-300">SMTP Username / Email</label>
                          <input
                            type="text"
                            value={systemConfigForm.email.smtpUser}
                            onChange={(e) => setSystemConfigForm({
                              ...systemConfigForm,
                              email: { ...systemConfigForm.email, smtpUser: e.target.value.trim() }
                            })}
                            placeholder="your-email@gmail.com"
                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1 text-gray-700 dark:text-neutral-300">SMTP App Password</label>
                          <input
                            type="password"
                            value={systemConfigForm.email.smtpPass}
                            onChange={(e) => setSystemConfigForm({
                              ...systemConfigForm,
                              email: { ...systemConfigForm.email, smtpPass: e.target.value.trim() }
                            })}
                            placeholder="Mật khẩu ứng dụng 16 ký tự"
                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">Email người gửi (From Email)</label>
                        <input
                          type="text"
                          value={systemConfigForm.email.fromEmail}
                          onChange={(e) => setSystemConfigForm({
                            ...systemConfigForm,
                            email: { ...systemConfigForm.email, fromEmail: e.target.value.trim() }
                          })}
                          placeholder="noreply@truyennha.id.vn"
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">Tên người gửi (From Name)</label>
                        <input
                          type="text"
                          value={systemConfigForm.email.fromName}
                          onChange={(e) => setSystemConfigForm({
                            ...systemConfigForm,
                            email: { ...systemConfigForm.email, fromName: e.target.value }
                          })}
                          placeholder="Truyện Nhà"
                          className="w-full p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                        />
                      </div>
                    </div>

                    {/* Test Email Section */}
                    <div className="pt-3 border-t border-gray-100 dark:border-neutral-700 flex items-center gap-2">
                      <input
                        type="email"
                        value={testEmailTarget}
                        onChange={(e) => setTestEmailTarget(e.target.value)}
                        placeholder="Nhập email nhận thử (mặc định email bạn)..."
                        className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={testEmailLoading}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition disabled:opacity-50 shrink-0 flex items-center"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        {testEmailLoading ? 'Đang gửi...' : 'Gửi thử nghiệm'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cột 2: Cấu hình AI API & Kiểm duyệt */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Cấu hình AI API & Kiểm Duyệt Tự Động</h3>
                        <p className="text-[11px] text-gray-500">Tích hợp OpenAI ChatGPT hoặc Google Gemini AI</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemConfigForm.ai.enabled}
                        onChange={(e) =>
                          setSystemConfigForm({
                            ...systemConfigForm,
                            ai: { ...systemConfigForm.ai, enabled: e.target.checked },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                        Nhà cung cấp AI (Provider)
                      </label>
                      <select
                        value={systemConfigForm.ai.provider}
                        onChange={(e) => {
                          const prov = e.target.value as 'gemini' | 'openai';
                          setSystemConfigForm({
                            ...systemConfigForm,
                            ai: {
                              ...systemConfigForm.ai,
                              provider: prov,
                              model: prov === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini',
                            },
                          });
                        }}
                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-medium"
                      >
                        <option value="gemini">Google Gemini AI (Tốc độ cao, miễn phí hạn mức lớn)</option>
                        <option value="openai">OpenAI ChatGPT (Chất lượng phân tích cao)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                        {systemConfigForm.ai.provider === 'gemini' ? 'Google Gemini API Key *' : 'OpenAI API Key *'}
                      </label>
                      <input
                        type="password"
                        value={systemConfigForm.ai.apiKey}
                        onChange={(e) =>
                          setSystemConfigForm({
                            ...systemConfigForm,
                            ai: { ...systemConfigForm.ai, apiKey: e.target.value.trim() },
                          })
                        }
                        placeholder={systemConfigForm.ai.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                        className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-xs focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-gray-700 dark:text-neutral-300">
                          Mô hình AI (Model)
                        </label>
                        <button
                          type="button"
                          onClick={handleDiscoverModels}
                          disabled={discoveringModels || !systemConfigForm.ai.apiKey}
                          className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center disabled:opacity-40"
                          title="Tự động kết nối API để quét toàn bộ model khả dụng mới nhất"
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${discoveringModels ? 'animate-spin' : ''}`} />
                          {discoveringModels ? 'Đang quét...' : '🔍 Tự động nhận diện Model'}
                        </button>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          list="discovered-ai-models"
                          value={systemConfigForm.ai.model}
                          onChange={(e) =>
                            setSystemConfigForm({
                              ...systemConfigForm,
                              ai: { ...systemConfigForm.ai, model: e.target.value.trim() },
                            })
                          }
                          placeholder="Chọn gợi ý bên dưới hoặc tự nhập tên model..."
                          className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-xs focus:border-brand-500 focus:outline-none"
                        />
                        <datalist id="discovered-ai-models">
                          {discoveredModels.map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>

                        <div className="flex flex-wrap gap-1">
                          {(discoveredModels.length > 0
                            ? discoveredModels.slice(0, 10)
                            : (systemConfigForm.ai.provider === 'gemini'
                                ? ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
                                : ['gpt-4o-mini', 'gpt-4o', 'o3-mini'])
                          ).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() =>
                                setSystemConfigForm({
                                  ...systemConfigForm,
                                  ai: { ...systemConfigForm.ai, model: m },
                                })
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                                systemConfigForm.ai.model === m
                                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 space-y-2">
                      <span className="font-semibold block text-purple-900 dark:text-purple-200">Kích hoạt Kiểm duyệt Tự động (Auto Moderation)</span>
                      <label className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-neutral-300">
                        <input
                          type="checkbox"
                          checked={systemConfigForm.ai.autoModerateNovels}
                          onChange={(e) =>
                            setSystemConfigForm({
                              ...systemConfigForm,
                              ai: { ...systemConfigForm.ai, autoModerateNovels: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span>Tự động quét nội dung chương truyện khi Tác giả / Biên tập viên xuất bản</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-neutral-300">
                        <input
                          type="checkbox"
                          checked={systemConfigForm.ai.autoModerateComments}
                          onChange={(e) =>
                            setSystemConfigForm({
                              ...systemConfigForm,
                              ai: { ...systemConfigForm.ai, autoModerateComments: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span>Tự động chặn bình luận thô tục, xúc phạm hoặc vi phạm thuần phong mỹ tục</span>
                      </label>
                    </div>

                    {/* Test AI Section */}
                    <div className="pt-2 border-t border-gray-100 dark:border-neutral-700 flex justify-end">
                      <button
                        type="button"
                        onClick={handleTestAi}
                        disabled={testAiLoading || !systemConfigForm.ai.apiKey}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs transition disabled:opacity-50 flex items-center"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        {testAiLoading ? 'Đang gọi kiểm tra...' : 'Kiểm tra kết nối AI'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-neutral-700">
                <button
                  type="submit"
                  disabled={systemConfigSaving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {systemConfigSaving ? 'Đang lưu cấu hình...' : 'Lưu Cấu Hình Hệ Thống'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. Tab Nguồn Cấp Phép & Sync */}
      {activeTab === 'sources' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm space-y-4 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">Nguồn nội dung cấp phép</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Chỉ kết nối API nguồn đã thỏa thuận cấp phép và vượt qua kiểm tra SSRF
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((src) => (
              <div key={src.id} className="p-4 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900/50 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{src.name}</h3>
                    <span className="text-[11px] font-mono text-gray-400">{src.base_url}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${src.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                    {src.is_active ? 'Hoạt động' : 'Tạm khóa'}
                  </span>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>Loại điều hợp: <code className="text-brand-600">{src.provider_type}</code></div>
                  <div>Lần đồng bộ gần nhất: {src.last_synced_at ? new Date(src.last_synced_at).toLocaleString('vi-VN') : 'Chưa chạy'}</div>
                </div>

                <div className="pt-2 border-t border-gray-200/60 dark:border-neutral-750">
                  <button
                    onClick={() => handleSyncSource(src.id)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Chạy đồng bộ ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Tab Hồ Sơ Bản Quyền */}
      {activeTab === 'rights' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">Quản lý Quyền Nội Dung & Giấy Phép Tác Phẩm</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Đảm bảo 100% nội dung hiển thị đều có hồ sơ thẩm định pháp lý minh bạch
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500 border-b border-gray-200 dark:border-neutral-700">
                <tr>
                  <th className="p-3">Tác phẩm</th>
                  <th className="p-3">Chủ sở hữu quyền</th>
                  <th className="p-3">Loại giấy phép</th>
                  <th className="p-3">Phạm vi lãnh thổ</th>
                  <th className="p-3">Trạng thái xác minh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-750">
                {rights.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">{r.book_title}</td>
                    <td className="p-3 text-gray-700 dark:text-neutral-300">{r.owner_name}</td>
                    <td className="p-3 text-gray-600 dark:text-neutral-400">{r.license_type}</td>
                    <td className="p-3 text-gray-600 dark:text-neutral-400">{r.permitted_territory}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {r.verification_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Duyệt Rút Tiền Tác Giả (Admin Only) */}
      {activeTab === 'withdrawals' && user.role === 'admin' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm space-y-4 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 dark:border-neutral-700 pb-3">
            <div>
              <h2 className="font-bold text-sm text-gray-900 dark:text-white flex items-center">
                <Wallet className="w-4 h-4 mr-2 text-amber-600" />
                Quản lý & Phê duyệt Lệnh Rút Tiền Tác Giả
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Kiểm tra thông tin tài khoản ngân hàng và xác nhận sau khi chuyển khoản cho tác giả.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-neutral-900 p-1 rounded-lg text-xs">
              {(['all', 'pending', 'completed', 'rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setWithdrawalFilter(filter)}
                  className={`px-2.5 py-1 rounded-md capitalize transition ${
                    withdrawalFilter === filter
                      ? 'bg-white dark:bg-neutral-700 shadow-xs font-bold text-gray-900 dark:text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {filter === 'all'
                    ? 'Tất cả'
                    : filter === 'pending'
                    ? 'Chờ duyệt'
                    : filter === 'completed'
                    ? 'Đã chuyển'
                    : 'Đã từ chối'}
                </button>
              ))}
            </div>
          </div>

          {withdrawals.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Chưa có yêu cầu rút tiền nào từ tác giả.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500 border-b border-gray-200 dark:border-neutral-700">
                  <tr>
                    <th className="p-3">Tác giả</th>
                    <th className="p-3">Số tiền</th>
                    <th className="p-3">Ngân hàng & STK</th>
                    <th className="p-3">Chủ tài khoản</th>
                    <th className="p-3">Thời gian tạo</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {withdrawals
                    .filter((w) => withdrawalFilter === 'all' || w.status === withdrawalFilter)
                    .map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-750">
                        <td className="p-3">
                          <strong className="text-gray-900 dark:text-white block">{w.username || 'Tác giả'}</strong>
                          <span className="text-[11px] text-gray-400">{w.email}</span>
                        </td>
                        <td className="p-3">
                          <strong className="text-amber-600 text-sm">{w.amount.toLocaleString()} VNĐ</strong>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-gray-800 dark:text-neutral-200">{w.bank_name}</div>
                          <div className="font-mono text-gray-500">{w.account_number}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-gray-900 dark:text-neutral-100">{w.account_holder}</span>
                        </td>
                        <td className="p-3 text-gray-500 whitespace-nowrap">
                          {new Date(w.created_at).toLocaleDateString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </td>
                        <td className="p-3 text-center">
                          {w.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                              Chờ duyệt
                            </span>
                          )}
                          {w.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              Đã chuyển tiền
                            </span>
                          )}
                          {w.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                              Đã từ chối
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {w.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                disabled={processingWithdrawalId === w.id}
                                onClick={() => handleApproveWithdrawal(w.id)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition disabled:opacity-50 flex items-center"
                                title="Xác nhận đã chuyển khoản"
                              >
                                <Check className="w-3 h-3 mr-1" /> Duyệt chuyển
                              </button>
                              <button
                                disabled={processingWithdrawalId === w.id}
                                onClick={() => handleRejectWithdrawal(w.id)}
                                className="px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[11px] transition disabled:opacity-50 flex items-center"
                                title="Từ chối và hoàn tiền"
                              >
                                <X className="w-3 h-3 mr-0.5" /> Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Kiểm Duyệt Nội Dung & Tác Phẩm Bị Gắn Cờ (Admin Only) */}
      {activeTab === 'moderation' && user.role === 'admin' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm space-y-4 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 dark:border-neutral-700 pb-3">
            <div>
              <h2 className="font-bold text-sm text-gray-900 dark:text-white flex items-center">
                <AlertOctagon className="w-4 h-4 mr-2 text-rose-500" />
                Hàng Đợi Kiểm Duyệt Tác Phẩm & Nội Dung Vi Phạm ({moderationQueue.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Kiểm duyệt thủ công các chương/truyện bị AI phát hiện có dấu hiệu vi phạm (chủ quyền lãnh thổ, phân biệt vùng miền, xúc phạm, bạo lực).
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-neutral-900 p-1 rounded-lg text-xs">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setModerationFilter(filter)}
                  className={`px-2.5 py-1 rounded-md capitalize transition ${
                    moderationFilter === filter
                      ? 'bg-white dark:bg-neutral-700 shadow-xs font-bold text-gray-900 dark:text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {filter === 'all'
                    ? 'Tất cả'
                    : filter === 'pending'
                    ? 'Chờ duyệt'
                    : filter === 'approved'
                    ? 'Đã duyệt'
                    : 'Đã từ chối'}
                </button>
              ))}
            </div>
          </div>

          {moderationQueue.filter(m => moderationFilter === 'all' || m.status === moderationFilter).length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Không có tác phẩm hoặc chương truyện nào trong danh sách kiểm duyệt này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500 border-b border-gray-200 dark:border-neutral-700">
                  <tr>
                    <th className="p-3">Tác phẩm / Chương</th>
                    <th className="p-3">Tác giả</th>
                    <th className="p-3">Phân loại vi phạm</th>
                    <th className="p-3">Tóm tắt phát hiện của AI</th>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {moderationQueue
                    .filter((m) => moderationFilter === 'all' || m.status === moderationFilter)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-750">
                        <td className="p-3">
                          <strong className="text-gray-900 dark:text-white block">{item.title}</strong>
                          <span className="text-[10px] text-gray-400 uppercase font-mono">Loại: {item.entity_type}</span>
                          {item.excerpt && (
                            <div className="text-[11px] text-gray-500 italic line-clamp-2 mt-1 bg-gray-50 dark:bg-neutral-900 p-1.5 rounded">
                              "{item.excerpt}..."
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-gray-800 dark:text-neutral-200">
                          {item.author_name || 'Khuyết danh'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                            {item.violation_category || 'Vi phạm nội quy'}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs text-rose-600 dark:text-rose-400 font-medium">
                          {item.violation_summary}
                        </td>
                        <td className="p-3 text-gray-400 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </td>
                        <td className="p-3 text-center">
                          {item.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                              Chờ duyệt
                            </span>
                          )}
                          {item.status === 'approved' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              Đã thông qua
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                              Đã từ chối
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveModeration(item.id)}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition flex items-center shadow-xs"
                                  title="Duyệt và xuất bản nội dung"
                                >
                                  <Check className="w-3 h-3 mr-1" /> Duyệt
                                </button>
                                <button
                                  onClick={() => handleRejectModeration(item.id)}
                                  className="px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[11px] transition flex items-center"
                                  title="Từ chối xuất bản"
                                >
                                  <X className="w-3 h-3 mr-0.5" /> Từ chối
                                </button>
                              </>
                            )}

                            {/* Nút thông báo cho tác giả */}
                            <button
                              onClick={() => {
                                setNotifyAuthorModalItem(item);
                                setNotifyAuthorMessage(
                                  `Kính gửi tác giả ${item.author_name || ''},\n\nBan Quản trị Truyện Nhà xin gửi thông báo về tác phẩm/chương "${item.title}".\n\nHệ thống ghi nhận dấu hiệu vi phạm (${item.violation_category || 'Nội dung chưa phù hợp'}):\n"${item.violation_summary}".\n\nVui lòng chỉnh sửa lại tác phẩm để đảm bảo đúng quy định.`
                                );
                              }}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] transition flex items-center shadow-xs"
                              title="Gửi thông báo & email cho tác giả"
                            >
                              <Bell className="w-3 h-3 mr-1" /> Báo tác giả
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Tab Người Dùng & Phân Quyền (Admin Only) */}
      {activeTab === 'users' && user.role === 'admin' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="font-bold text-sm text-gray-900 dark:text-white flex items-center">
                <Users className="w-4 h-4 mr-2 text-brand-600" />
                Danh sách người dùng & Phân quyền ({userList.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý thành viên, kiểm tra hồ sơ tác giả (CCCD / Ngân hàng), gửi cảnh báo qua email & khóa vi phạm.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500 border-b border-gray-200 dark:border-neutral-700">
                <tr>
                  <th className="p-3">Tài khoản & Họ tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Thông tin nhận tiền</th>
                  <th className="p-3">Số dư</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-750">
                {userList.map((u) => {
                  const isLocked = u.locked_until && new Date(u.locked_until).getTime() > Date.now();
                  const isPermanentLock = u.locked_until && u.locked_until.startsWith('9999');

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-750">
                      <td className="p-3">
                        <strong className="font-semibold text-gray-900 dark:text-white block">{u.username}</strong>
                        {u.full_name && (
                          <div className="text-[11px] text-gray-600 dark:text-neutral-300 font-medium">
                            {u.full_name}
                          </div>
                        )}
                        {u.id_card_number && (
                          <div className="text-[10px] text-gray-400 font-mono">CCCD: {u.id_card_number}</div>
                        )}
                      </td>
                      <td className="p-3 text-gray-500">{u.email}</td>
                      <td className="p-3">
                        {u.bank_name ? (
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-neutral-200">{u.bank_name}</div>
                            <div className="font-mono text-gray-500 text-[11px]">{u.bank_account_number}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Chưa liên kết</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-amber-600">{u.coins || 0} Xu</div>
                        {u.balance > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            {(u.balance || 0).toLocaleString()}đ
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {isLocked ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                              {isPermanentLock ? 'Khóa vĩnh viễn' : 'Tạm khóa'}
                            </span>
                            <div className="text-[10px] text-rose-500 truncate max-w-[140px] mt-0.5" title={u.lock_reason}>
                              {u.lock_reason || 'Vi phạm'}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                            Bình thường
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          disabled={u.id === user.id}
                          className="p-1 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium"
                        >
                          <option value="reader">reader (độc giả)</option>
                          <option value="editor">editor (biên tập viên)</option>
                          <option value="admin">admin (quản trị viên)</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem Nhật Ký Giao Dịch */}
                          <button
                            onClick={() => handleOpenUserHistory(u)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 transition"
                            title="Xem nhật ký giao dịch và hoạt động của người dùng"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Cảnh báo */}
                          <button
                            onClick={() => {
                              setWarnModalUser(u);
                              setWarnForm({
                                title: 'Cảnh báo vi phạm nội quy Truyện Nhà',
                                content: `Kính gửi ${u.username},\n\nBan Quản trị Truyện Nhà xin gửi thông báo nhắc nhở về hoạt động của bạn trên hệ thống...`,
                              });
                            }}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 transition"
                            title="Gửi cảnh báo đến email & hòm thư"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Khóa / Mở khóa */}
                          {isLocked ? (
                            <button
                              onClick={() => handleUnlockUser(u)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-bold transition flex items-center"
                              title="Mở khóa tài khoản"
                            >
                              <Check className="w-3 h-3 mr-1" /> Mở khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setLockModalUser(u);
                                setLockForm({
                                  lockType: 'temporary',
                                  days: 7,
                                  reason: 'Vi phạm quy định đăng tải và nội quy cộng đồng',
                                  notifyEmail: true,
                                });
                              }}
                              disabled={u.id === user.id}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 transition disabled:opacity-30"
                              title="Khóa tài khoản"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Nút Xóa */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === user.id || u.role === 'admin'}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 dark:bg-neutral-750 dark:hover:bg-rose-950/60 transition disabled:opacity-20"
                            title="Xóa vĩnh viễn tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab Nhật Ký Kiểm Toán (Audit Logs) */}
      {activeTab === 'audit' && user.role === 'admin' && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">Nhật ký thao tác quản trị (Audit Logs)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500 border-b border-gray-200 dark:border-neutral-700">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Người thực hiện</th>
                  <th className="p-3">Hành động</th>
                  <th className="p-3">Đối tượng</th>
                  <th className="p-3">Chi tiết</th>
                  <th className="p-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-750 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-3 text-gray-400">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                    <td className="p-3 font-sans font-semibold text-gray-900 dark:text-white">{log.username || 'System'}</td>
                    <td className="p-3 text-brand-600 font-bold">{log.action}</td>
                    <td className="p-3 text-gray-500">{log.entity_type}:{log.entity_id}</td>
                    <td className="p-3 text-gray-600 dark:text-neutral-300 max-w-xs truncate">{log.details_json}</td>
                    <td className="p-3 text-gray-400">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal Gửi Cảnh Báo Thành Viên */}
      {warnModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center">
                <Bell className="w-5 h-5 mr-2 text-amber-500" />
                Gửi Cảnh Báo Thành Viên
              </h3>
              <button
                onClick={() => setWarnModalUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
              Gửi thông báo cảnh cáo trực tiếp đến hòm thư thông báo trên web và email của <strong>{warnModalUser.username}</strong> ({warnModalUser.email}).
            </div>

            <form onSubmit={handleWarnUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Tiêu đề thông báo *
                </label>
                <input
                  type="text"
                  required
                  value={warnForm.title}
                  onChange={(e) => setWarnForm({ ...warnForm, title: e.target.value })}
                  placeholder="Tiêu đề cảnh báo..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Nội dung chi tiết cảnh báo vi phạm *
                </label>
                <textarea
                  required
                  rows={5}
                  value={warnForm.content}
                  onChange={(e) => setWarnForm({ ...warnForm, content: e.target.value })}
                  placeholder="Nhập nội dung nhắc nhở hoặc yêu cầu chỉnh sửa..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setWarnModalUser(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl font-semibold text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-750 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={warningSending || !warnForm.content.trim()}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {warningSending ? 'Đang gửi...' : 'Gửi Cảnh Báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Khóa Tài Khoản */}
      {lockModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center">
                <Ban className="w-5 h-5 mr-2 text-rose-500" />
                Khóa Tài Khoản: {lockModalUser.username}
              </h3>
              <button
                onClick={() => setLockModalUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleLockUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Thời hạn khóa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-3 rounded-xl border flex items-center space-x-2 cursor-pointer transition ${lockForm.lockType === 'temporary' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 font-bold text-rose-700' : 'border-gray-200 dark:border-neutral-700'}`}>
                    <input
                      type="radio"
                      name="lockType"
                      checked={lockForm.lockType === 'temporary'}
                      onChange={() => setLockForm({ ...lockForm, lockType: 'temporary' })}
                      className="text-rose-600"
                    />
                    <span>Khóa có thời hạn (ngày)</span>
                  </label>
                  <label className={`p-3 rounded-xl border flex items-center space-x-2 cursor-pointer transition ${lockForm.lockType === 'permanent' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 font-bold text-rose-700' : 'border-gray-200 dark:border-neutral-700'}`}>
                    <input
                      type="radio"
                      name="lockType"
                      checked={lockForm.lockType === 'permanent'}
                      onChange={() => setLockForm({ ...lockForm, lockType: 'permanent' })}
                      className="text-rose-600"
                    />
                    <span>Khóa vĩnh viễn (Vô hạn)</span>
                  </label>
                </div>
              </div>

              {lockForm.lockType === 'temporary' && (
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                    Số ngày khóa *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={lockForm.days}
                    onChange={(e) => setLockForm({ ...lockForm, days: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Tài khoản sẽ được tự động mở khóa sau {lockForm.days} ngày.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Lý do khóa tài khoản *
                </label>
                <textarea
                  required
                  rows={3}
                  value={lockForm.reason}
                  onChange={(e) => setLockForm({ ...lockForm, reason: e.target.value })}
                  placeholder="Lý do khóa hiển thị cho người dùng biết khi đăng nhập..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="lockNotifyEmail"
                  checked={lockForm.notifyEmail}
                  onChange={(e) => setLockForm({ ...lockForm, notifyEmail: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <label htmlFor="lockNotifyEmail" className="text-gray-700 dark:text-neutral-300 cursor-pointer">
                  Gửi email thông báo quyết định khóa kèm lý do tới {lockModalUser.email}
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setLockModalUser(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl font-semibold text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-750 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={lockSending || !lockForm.reason.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  {lockSending ? 'Đang xử lý...' : 'Xác Nhận Khóa Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Xem Nhật Ký Người Dùng */}
      {userHistoryModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-neutral-700 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700 shrink-0">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center">
                <History className="w-5 h-5 mr-2 text-blue-500" />
                Nhật Ký Giao Dịch & Hoạt Động: {userHistoryModalUser.username}
              </h3>
              <button
                onClick={() => {
                  setUserHistoryModalUser(null);
                  setUserHistoryData(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Thông tin vắn tắt */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0 bg-gray-50 dark:bg-neutral-900 p-3 rounded-xl border border-gray-100 dark:border-neutral-700">
              <div>
                <span className="text-gray-400 block text-[10px]">Tài khoản:</span>
                <strong className="text-gray-900 dark:text-white truncate block">{userHistoryModalUser.username}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Email:</span>
                <span className="text-gray-600 dark:text-neutral-300 truncate block">{userHistoryModalUser.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Số dư Xu:</span>
                <strong className="text-amber-600 font-bold">{userHistoryModalUser.coins || 0} Xu</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Thu nhập Tác giả:</span>
                <strong className="text-emerald-600 font-bold">{(userHistoryModalUser.balance || userHistoryModalUser.author_earnings || 0).toLocaleString()}đ</strong>
              </div>
            </div>

            {/* Nội dung danh sách giao dịch */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1 text-xs">
              {userHistoryLoading ? (
                <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
                  <span>Đang tải nhật ký giao dịch...</span>
                </div>
              ) : userHistoryData?.transactions?.length ? (
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 dark:text-neutral-200 flex items-center text-xs">
                    <Coins className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Lịch sử biến động Xu & Doanh thu ({userHistoryData.transactions.length})
                  </h4>
                  <div className="divide-y divide-gray-100 dark:divide-neutral-700/60 border border-gray-100 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-850">
                    {userHistoryData.transactions.map((tx: any) => (
                      <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-neutral-800 transition">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-900 dark:text-white">{tx.description}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono">
                            <span>{new Date(tx.created_at).toLocaleString('vi-VN')}</span>
                            <span>•</span>
                            <span className="uppercase text-brand-600 font-bold">{tx.type}</span>
                            <span>•</span>
                            <span className={tx.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}>{tx.status}</span>
                          </div>
                        </div>
                        <div className={`font-black text-sm whitespace-nowrap ml-3 ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} xu
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">Người dùng này chưa có giao dịch nào trong hệ thống.</div>
              )}

              {/* Thông báo đã nhận */}
              {userHistoryData?.notifications?.length ? (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-neutral-700">
                  <h4 className="font-bold text-gray-800 dark:text-neutral-200 flex items-center text-xs">
                    <Bell className="w-3.5 h-3.5 mr-1 text-blue-500" />
                    Hòm thư thông báo / cảnh báo đã nhận ({userHistoryData.notifications.length})
                  </h4>
                  <div className="space-y-2">
                    {userHistoryData.notifications.map((n: any) => (
                      <div key={n.id} className="p-2.5 rounded-lg border border-gray-100 dark:border-neutral-700 bg-gray-50/70 dark:bg-neutral-900 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-gray-900 dark:text-white">{n.title}</strong>
                          <span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-300 text-[11px] whitespace-pre-wrap">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-neutral-700 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setUserHistoryModalUser(null);
                  setUserHistoryData(null);
                }}
                className="px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl font-semibold text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-750 text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thông Báo Cho Tác Giả Về Tác Phẩm Bị Gắn Cờ */}
      {notifyAuthorModalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center">
                <Bell className="w-5 h-5 mr-2 text-amber-500" />
                Thông Báo Kiểm Duyệt Tác Giả
              </h3>
              <button
                onClick={() => setNotifyAuthorModalItem(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div>Tác phẩm: <strong>{notifyAuthorModalItem.title}</strong></div>
              <div>Tác giả: <strong>{notifyAuthorModalItem.author_name}</strong></div>
              <div>Phát hiện của AI: <span className="text-rose-600 font-bold">{notifyAuthorModalItem.violation_summary}</span></div>
            </div>

            <form onSubmit={handleNotifyAuthorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                  Nội dung thông báo gửi cho tác giả *
                </label>
                <textarea
                  required
                  rows={5}
                  value={notifyAuthorMessage}
                  onChange={(e) => setNotifyAuthorMessage(e.target.value)}
                  placeholder="Nhập nội dung nhắc nhở hoặc yêu cầu chỉnh sửa gửi đến hòm thư và email tác giả..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setNotifyAuthorModalItem(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl font-semibold text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-750 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={notifyAuthorSending || !notifyAuthorMessage.trim()}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {notifyAuthorSending ? 'Đang gửi...' : 'Gửi Thông Báo Cho Tác Giả'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
