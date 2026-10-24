import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { processCoverImage, generateArtisticCoverCanvas } from '../../utils/imageUtils';
import { extractTextFromPdfFile, ExtractedChapter } from '../../utils/pdfExtractor';
import {
  Feather,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Layers,
  Save,
  BookPlus,
  RefreshCw,
  Upload,
  FileUp,
  FolderUp,
  Loader2,
  Check,
  X,
  FileCode,
  Palette,
  ShieldAlert,
  Coins,
  Wallet,
  ArrowDownRight,
  CreditCard,
  DollarSign,
} from 'lucide-react';

interface AuthorBook {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  description: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  publication_status: 'draft' | 'published';
  author_name: string;
  chapter_count: number;
  view_count: number;
  genre_names?: string;
  genre_ids_csv?: string;
  is_18_plus?: number;
  is_premium?: number;
  price_coins?: number;
  free_chapters_count?: number;
  created_at: string;
  updated_at: string;
}

interface ChapterItem {
  id: string;
  chapter_number: number;
  title: string;
  slug: string;
  word_count: number;
  publication_status: 'draft' | 'published';
  created_at: string;
}

const PRESET_COVERS = [
  { name: 'Tiên Hiệp', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80' },
  { name: 'Kiếm Hiệp', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80' },
  { name: 'Huyền Huyễn', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80' },
  { name: 'Đô Thị', url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=600&auto=format&fit=crop&q=80' },
  { name: 'Khoa Huyễn', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80' },
  { name: 'Trinh Thám', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80' },
  { name: '🔞 18+ Diễm Tình', url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80' },
  { name: '🔞 18+ Sắc Hiệp', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80' },
];

export const AuthorStudioPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState<'my_books' | 'create_book' | 'manage_chapters' | 'earnings'>('my_books');
  const [books, setBooks] = useState<AuthorBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Thu nhập & Rút tiền tác giả
  const [earningsData, setEarningsData] = useState<{
    author_earnings: number;
    pending_withdrawals: number;
    withdrawal_history: any[];
    recent_sales?: any[];
  } | null>(null);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: 50000,
    bank_name: 'MB Bank',
    account_number: '',
    account_holder: '',
  });
  const [withdrawing, setWithdrawing] = useState(false);

  // Thể loại hệ thống
  const [availableGenres, setAvailableGenres] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Ref cho upload ảnh bìa từ máy
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Form tạo/sửa truyện
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author_name: '',
    cover_url: PRESET_COVERS[0].url,
    description: '',
    status: 'ongoing' as 'ongoing' | 'completed',
    publication_status: 'published' as 'published' | 'draft',
    genre_ids: [] as string[],
    is_18_plus: false,
    is_premium: false,
    price_coins: 0,
    free_chapters_count: 5,
    copyrightAgreement: false,
  });

  const handleAutoGenerateCover = () => {
    let theme: 'tienhiep' | 'kiemhiep' | 'dothi' | 'khoahuyen' | 'huyenhuyen' | 'trinhtham' | '18plus' = 'tienhiep';
    if (bookForm.is_18_plus) theme = '18plus';
    else {
      const selectedG = availableGenres.find((g) => bookForm.genre_ids.includes(g.id));
      if (selectedG?.slug === 'kiem-hiep') theme = 'kiemhiep';
      else if (selectedG?.slug === 'do-thi') theme = 'dothi';
      else if (selectedG?.slug === 'khoa-huyen') theme = 'khoahuyen';
      else if (selectedG?.slug === 'huyen-huyen') theme = 'huyenhuyen';
      else if (selectedG?.slug === 'trinh-tham') theme = 'trinhtham';
      else if (selectedG?.slug === '18-plus') theme = '18plus';
    }
    const dataUrl = generateArtisticCoverCanvas(
      bookForm.title || 'Tuyệt Phẩm Truyện',
      bookForm.author_name || user?.username || 'Tác Giả',
      theme
    );
    if (dataUrl) {
      setBookForm((prev) => ({ ...prev, cover_url: dataUrl }));
      setMessage({ type: 'success', text: 'Đã tạo ảnh bìa nghệ thuật theo tên truyện thành công!' });
    }
  };

  // Quản lý chương của một truyện đang chọn
  const [selectedBook, setSelectedBook] = useState<AuthorBook | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState({
    chapter_number: 1,
    title: '',
    content: '',
    publication_status: 'published' as 'published' | 'draft',
  });

  // Ref cho import PDF
  const singlePdfInputRef = useRef<HTMLInputElement>(null);
  const batchPdfInputRef = useRef<HTMLInputElement>(null);
  const [pdfExtracting, setPdfExtracting] = useState(false);

  // Modal import hàng loạt PDF
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchChapters, setBatchChapters] = useState<ExtractedChapter[]>([]);
  const [batchImportProgress, setBatchImportProgress] = useState<{ current: number; total: number } | null>(null);

  // Tải danh sách thể loại
  useEffect(() => {
    fetch('/api/genres')
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && Array.isArray(json.data)) {
          setAvailableGenres(json.data);
          if (json.data.length > 0 && bookForm.genre_ids.length === 0) {
            setBookForm((prev) => ({ ...prev, genre_ids: [json.data[0].id] }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Tải danh sách truyện của tác giả
  const loadMyBooks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/studio/my-books', { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success) {
        setBooks(json.data || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyBooks();
      setBookForm((prev) => ({
        ...prev,
        author_name: prev.author_name || user.username,
      }));
    }
  }, [user]);

  // Tải danh sách chương khi chọn một truyện
  const loadChapters = async (bookId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/books/${bookId}`, { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success && json.data) {
        setSelectedBook(json.data);
        setChapters(json.data.chapters || []);
        // Tính chương kế tiếp
        const maxNum = (json.data.chapters || []).reduce(
          (max: number, ch: any) => Math.max(max, ch.chapter_number || 0),
          0
        );
        setChapterForm({
          chapter_number: maxNum + 1,
          title: `Chương ${maxNum + 1}: `,
          content: '',
          publication_status: 'published',
        });
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi tải danh sách chương' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối khi tải chương' });
    } finally {
      setLoading(false);
    }
  };

  // Mở quản lý chương của truyện
  const handleOpenChapters = (b: AuthorBook) => {
    setSelectedBook(b);
    setEditingChapterId(null);
    loadChapters(b.id);
    setActiveView('manage_chapters');
  };

  // Mở form chỉnh sửa truyện
  const handleEditBook = (b: AuthorBook) => {
    setEditingBookId(b.id);
    const initialGids = b.genre_ids_csv ? b.genre_ids_csv.split(',').filter(Boolean) : [];
    setBookForm({
      title: b.title,
      author_name: b.author_name || user?.username || '',
      cover_url: b.cover_url || PRESET_COVERS[0].url,
      description: b.description || '',
      status: b.status === 'completed' ? 'completed' : 'ongoing',
      publication_status: b.publication_status,
      genre_ids: initialGids,
      is_18_plus: Number(b.is_18_plus) === 1,
      is_premium: Number(b.is_premium) === 1,
      price_coins: b.price_coins || 0,
      free_chapters_count: b.free_chapters_count !== undefined && b.free_chapters_count !== null ? b.free_chapters_count : 5,
      copyrightAgreement: true,
    });
    setActiveView('create_book');

    // Tải thông tin chi tiết từ server để đồng bộ thể loại và trạng thái mới nhất
    fetch(`/api/studio/books/${b.id}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && json.data) {
          const fetchedGenres = (json.data.genres || []).map((g: any) => g.id);
          setBookForm((prev) => ({
            ...prev,
            genre_ids: fetchedGenres.length > 0 ? fetchedGenres : prev.genre_ids,
            is_18_plus: Number(json.data.is_18_plus) === 1,
            is_premium: Number(json.data.is_premium) === 1,
            price_coins: json.data.price_coins !== undefined ? json.data.price_coins : prev.price_coins,
            free_chapters_count: json.data.free_chapters_count !== undefined && json.data.free_chapters_count !== null ? json.data.free_chapters_count : prev.free_chapters_count,
          }));
        }
      })
      .catch(() => {});
  };

  // Tải thông tin doanh thu tác giả
  const loadEarnings = async () => {
    try {
      const res = await fetch('/api/studio/earnings', { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success && json.data) {
        setEarningsData(json.data);
      }
    } catch {}
  };

  // Gửi yêu cầu rút tiền
  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawForm.account_number.trim() || !withdrawForm.account_holder.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ số tài khoản và tên chủ tài khoản' });
      return;
    }
    if (withdrawForm.amount < 50000) {
      setMessage({ type: 'error', text: 'Số tiền rút tối thiểu là 50.000 VNĐ' });
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch('/api/studio/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(withdrawForm),
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: 'Đã gửi yêu cầu rút tiền thành công! Quản trị viên sẽ xử lý trong 24h.' });
        loadEarnings();
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi khi gửi yêu cầu rút tiền' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng kết nối máy chủ' });
    } finally {
      setWithdrawing(false);
    }
  };

  // Xử lý upload ảnh bìa từ máy
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WebP...)');
      return;
    }

    setUploadingCover(true);
    try {
      const compressedDataUrl = await processCoverImage(file);
      setBookForm((prev) => ({ ...prev, cover_url: compressedDataUrl }));
      setMessage({ type: 'success', text: `Đã nạp và tối ưu ảnh bìa "${file.name}" thành công!` });
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xử lý ảnh');
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  // Xử lý nạp 1 file PDF vào ô soạn thảo chương hiện tại
  const handleSinglePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Vui lòng chọn file định dạng PDF');
      return;
    }

    setPdfExtracting(true);
    try {
      const extracted = await extractTextFromPdfFile(file);
      if (!extracted.content) {
        alert('File PDF không chứa văn bản dạng text hoặc là file scan dạng ảnh thuần.');
        return;
      }

      setChapterForm((prev) => ({
        ...prev,
        title: extracted.suggestedTitle || prev.title,
        chapter_number: extracted.chapterNumber || prev.chapter_number,
        content: extracted.content,
      }));

      setMessage({
        type: 'success',
        text: `Đã trích xuất thành công ${extracted.wordCount} chữ (${extracted.pageCount} trang) từ file "${file.name}"!`,
      });
    } catch (err: any) {
      alert('Lỗi trích xuất file PDF: ' + (err.message || String(err)));
    } finally {
      setPdfExtracting(false);
      if (e.target) e.target.value = '';
    }
  };

  // Xử lý chọn nhiều file PDF (mỗi file 1 chapter) để import hàng loạt
  const handleBatchPdfSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (files.length === 0) return;

    setPdfExtracting(true);
    setShowBatchModal(true);

    try {
      const results: ExtractedChapter[] = [];
      for (const file of files) {
        const item = await extractTextFromPdfFile(file);
        results.push(item);
      }

      // Sắp xếp các chương theo số chương tăng dần (nếu nhận diện được) hoặc theo tên file
      results.sort((a, b) => {
        if (a.chapterNumber && b.chapterNumber) {
          return a.chapterNumber - b.chapterNumber;
        }
        return a.fileName.localeCompare(b.fileName, undefined, { numeric: true });
      });

      // Đánh số chương liên tục nếu số chương chưa có
      const currentMaxNum = chapters.reduce((m, c) => Math.max(m, c.chapter_number || 0), 0);
      results.forEach((r, idx) => {
        if (!r.chapterNumber) {
          r.chapterNumber = currentMaxNum + idx + 1;
        }
      });

      setBatchChapters(results);
    } catch (err: any) {
      alert('Lỗi xử lý file PDF: ' + (err.message || String(err)));
      setShowBatchModal(false);
    } finally {
      setPdfExtracting(false);
      if (e.target) e.target.value = '';
    }
  };

  // Thực thi lưu hàng loạt chương đã trích xuất từ PDF
  const handleExecuteBatchImport = async () => {
    if (!selectedBook || batchChapters.length === 0) return;

    setLoading(true);
    setBatchImportProgress({ current: 0, total: batchChapters.length });

    let successCount = 0;
    for (let i = 0; i < batchChapters.length; i++) {
      const ch = batchChapters[i];
      setBatchImportProgress({ current: i + 1, total: batchChapters.length });

      try {
        const res = await fetch(`/api/studio/books/${selectedBook.id}/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            chapter_number: ch.chapterNumber,
            title: ch.suggestedTitle || `Chương ${ch.chapterNumber}`,
            content: ch.content,
            publication_status: 'published',
          }),
        });
        const json = await res.json() as any;
        if (json.success) {
          successCount++;
        }
      } catch (err) {
        console.error('Lỗi lưu chương:', ch.fileName, err);
      }
    }

    setLoading(false);
    setBatchImportProgress(null);
    setShowBatchModal(false);
    setBatchChapters([]);

    setMessage({
      type: 'success',
      text: `Đã nạp thành công ${successCount}/${batchChapters.length} chương từ file PDF vào truyện "${selectedBook.title}"!`,
    });

    await loadChapters(selectedBook.id);
    loadMyBooks();
  };

  // Xóa truyện
  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tác phẩm "${title}" và toàn bộ các chương liên quan không? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/books/${bookId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: 'Đã xóa tác phẩm thành công' });
        loadMyBooks();
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi khi xóa tác phẩm' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi xóa tác phẩm' });
    } finally {
      setLoading(false);
    }
  };

  // Lưu thông tin truyện (Tạo mới hoặc Sửa)
  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên truyện' });
      return;
    }
    if (!editingBookId && !bookForm.copyrightAgreement) {
      setMessage({ type: 'error', text: 'Vui lòng xác nhận cam kết bản quyền sáng tác' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const url = editingBookId ? `/api/studio/books/${editingBookId}` : '/api/studio/books';
      const method = editingBookId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookForm),
      });
      const json = await res.json() as any;

      if (json.success) {
        setMessage({
          type: 'success',
          text: editingBookId ? 'Cập nhật tác phẩm thành công!' : 'Tạo tác phẩm mới thành công! Giờ bạn có thể bắt đầu đăng chương hoặc tải lên file PDF.',
        });
        setEditingBookId(null);
        await loadMyBooks();

        if (!editingBookId && json.data) {
          handleOpenChapters(json.data);
        } else {
          setActiveView('my_books');
        }
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi khi lưu tác phẩm' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng kết nối máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  // Lưu chương (Thêm mới hoặc Cập nhật)
  const handleSubmitChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    if (!chapterForm.title.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tiêu đề chương' });
      return;
    }
    if (chapterForm.content.trim().length < 10) {
      setMessage({ type: 'error', text: 'Nội dung chương quá ngắn (tối thiểu 10 ký tự)' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const url = editingChapterId
        ? `/api/studio/chapters/${editingChapterId}`
        : `/api/studio/books/${selectedBook.id}/chapters`;
      const method = editingChapterId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(chapterForm),
      });
      const json = await res.json() as any;

      if (json.success) {
        setMessage({
          type: 'success',
          text: editingChapterId ? 'Cập nhật chương thành công!' : 'Xuất bản chương mới thành công!',
        });
        setEditingChapterId(null);
        await loadChapters(selectedBook.id);
        loadMyBooks();
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi khi lưu chương' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi lưu chương' });
    } finally {
      setLoading(false);
    }
  };

  // Nạp dữ liệu chương để sửa
  const handleEditChapter = async (ch: ChapterItem) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/chapters/${ch.id}`, { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success && json.data) {
        setEditingChapterId(ch.id);
        setChapterForm({
          chapter_number: json.data.chapter_number,
          title: json.data.title,
          content: json.data.content,
          publication_status: json.data.publication_status || 'published',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Không thể nạp nội dung chương' });
    } finally {
      setLoading(false);
    }
  };

  // Xóa chương
  const handleDeleteChapter = async (chapterId: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${title}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/chapters/${chapterId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json.success) {
        setMessage({ type: 'success', text: 'Đã xóa chương thành công' });
        if (selectedBook) {
          loadChapters(selectedBook.id);
          loadMyBooks();
        }
      } else {
        setMessage({ type: 'error', text: json.error || 'Lỗi xóa chương' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi xóa chương' });
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra đăng nhập
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-gray-500">
        Đang xác thực thông tin tài khoản...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center">
          <Feather className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Không Gian Sáng Tác Tác Giả</h1>
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            Nơi bạn thỏa sức đăng tải các câu chuyện tự sáng tác, chia sẻ với cộng đồng độc giả và xây dựng cộng đồng người theo dõi của riêng mình.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/login?redirect=/studio"
            className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition shadow-sm"
          >
            Đăng nhập để đăng truyện
          </Link>
          <Link
            to="/dang-ky-tac-gia"
            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition shadow-sm"
          >
            Đăng ký làm Tác giả
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user.is_author === 1 || user.role === 'admin' || user.role === 'editor';
  if (!isAuthor) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
          <Feather className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bạn chưa đăng ký làm Tác giả</h1>
          <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
            Để bảo vệ chất lượng tác phẩm và quyền tác giả trên nền tảng, chỉ những tài khoản đã đăng ký thông tin tác giả mới có quyền tạo và đăng truyện mới.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/dang-ky-tac-gia"
            className="px-6 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition shadow-md inline-flex items-center"
          >
            <Feather className="w-4 h-4 mr-2" />
            Đăng ký làm Tác giả ngay
          </Link>
          <Link
            to="/books"
            className="px-5 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
          >
            Quay lại đọc truyện
          </Link>
        </div>
      </div>
    );
  }

  // Thống kê tác giả
  const totalChaptersCount = books.reduce((sum, b) => sum + (b.chapter_count || 0), 0);
  const totalViewsCount = books.reduce((sum, b) => sum + (b.view_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-neutral-900 to-purple-950 p-6 sm:p-8 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-brand-500/20">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-brand-300">
            <Feather className="w-4 h-4 text-brand-400" />
            <span>Studio Sáng Tác & Đăng Truyện</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {user.username}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
            Hệ thống hỗ trợ bạn đăng truyện trực tiếp, tải ảnh bìa từ máy tính/điện thoại, và tải chương tự động từ file PDF.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingBookId(null);
              setBookForm({
                title: '',
                author_name: user.username,
                cover_url: PRESET_COVERS[0].url,
                description: '',
                status: 'ongoing',
                publication_status: 'published',
                genre_ids: availableGenres.length > 0 ? [availableGenres[0].id] : [],
                is_18_plus: false,
                is_premium: false,
                price_coins: 0,
                free_chapters_count: 5,
                copyrightAgreement: false,
              });
              setActiveView('create_book');
            }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-brand-600/30 flex items-center transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Đăng truyện mới
          </button>
          <button
            onClick={() => {
              setActiveView('my_books');
              loadMyBooks();
            }}
            className={`px-4 py-2 font-semibold text-xs sm:text-sm rounded-xl transition flex items-center ${
              activeView === 'my_books'
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/10 hover:bg-white/15 text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Tác phẩm ({books.length})
          </button>
          <button
            onClick={() => {
              setActiveView('earnings');
              loadEarnings();
            }}
            className={`px-4 py-2 font-semibold text-xs sm:text-sm rounded-xl transition flex items-center ${
              activeView === 'earnings'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-white/10 hover:bg-white/15 text-neutral-200'
            }`}
          >
            <Coins className="w-4 h-4 mr-1.5 text-amber-300" />
            Doanh thu & Rút tiền
          </button>
        </div>
      </div>

      {/* Thông báo thao tác */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs underline ml-4">
            Đóng
          </button>
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
          <span className="text-xs text-gray-500 dark:text-neutral-400">Tác phẩm đã đăng</span>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
            {books.length}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
          <span className="text-xs text-gray-500 dark:text-neutral-400">Tổng số chương</span>
          <div className="text-xl sm:text-2xl font-bold text-brand-600 dark:text-brand-400 mt-0.5">
            {totalChaptersCount}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
          <span className="text-xs text-gray-500 dark:text-neutral-400">Lượt đọc truyện</span>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {totalViewsCount}
          </div>
        </div>
        <div
          onClick={() => {
            setActiveView('earnings');
            loadEarnings();
          }}
          className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Thu nhập khả dụng</span>
            <span className="text-[10px] text-amber-600 underline">Rút tiền →</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {((earningsData?.author_earnings ?? user.author_earnings) || 0).toLocaleString()}đ
          </div>
        </div>
      </div>

      {/* VIEW 1: DANH SÁCH TRUYỆN CỦA TÔI */}
      {activeView === 'my_books' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-brand-600" />
              Tác phẩm của tôi ({books.length})
            </h2>
            <button
              onClick={() => {
                setEditingBookId(null);
                setActiveView('create_book');
              }}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Tạo truyện mới
            </button>
          </div>

          {loading && books.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">Đang nạp danh sách truyện...</div>
          ) : books.length === 0 ? (
            <div className="p-10 bg-white dark:bg-neutral-800 rounded-2xl border border-dashed border-gray-300 dark:border-neutral-700 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center">
                <BookPlus className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Bạn chưa đăng truyện nào</h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                Hãy bắt đầu hành trình sáng tác bằng cách tạo bộ truyện đầu tiên và đăng tải những chương truyện lôi cuốn nhất!
              </p>
              <button
                onClick={() => {
                  setEditingBookId(null);
                  setActiveView('create_book');
                }}
                className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 transition"
              >
                Đăng truyện ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-4 shadow-sm flex flex-col justify-between hover:border-brand-500/50 transition group"
                >
                  <div className="flex gap-4">
                    {/* Bìa truyện */}
                    <img
                      src={b.cover_url || PRESET_COVERS[0].url}
                      alt={b.title}
                      className="w-20 h-28 object-cover rounded-xl shadow shrink-0 bg-neutral-100 dark:bg-neutral-900"
                    />

                    {/* Thông tin */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-brand-600 transition">
                          {b.title}
                        </h3>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Bút danh: <span className="font-medium text-gray-700 dark:text-neutral-200">{b.author_name}</span>
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          b.publication_status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {b.publication_status === 'published' ? 'Công khai' : 'Bản nháp'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 font-medium">
                          {b.status === 'completed' ? 'Hoàn thành' : 'Đang ra'}
                        </span>
                        {b.genre_names && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300">
                            {b.genre_names}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-500 dark:text-neutral-400 flex items-center space-x-3 pt-2">
                        <span><strong>{b.chapter_count || 0}</strong> chương</span>
                        <span>•</span>
                        <span><strong>{b.view_count || 0}</strong> lượt đọc</span>
                      </div>
                    </div>
                  </div>

                  {/* Thanh nút hành động */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenChapters(b)}
                        className="px-3 py-1.5 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-300 hover:bg-brand-100 font-semibold rounded-lg flex items-center transition"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Quản lý chương
                      </button>

                      <button
                        onClick={() => handleEditBook(b)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                        title="Sửa thông tin truyện"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteBook(b.id, b.title)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                        title="Xóa truyện"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <Link
                      to={`/books/${b.slug}`}
                      target="_blank"
                      className="text-gray-500 hover:text-brand-600 flex items-center text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Xem trang đọc
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FORM TẠO / SỬA TRUYỆN */}
      {activeView === 'create_book' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-700">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingBookId ? 'Chỉnh sửa thông tin tác phẩm' : 'Đăng tác phẩm sáng tác mới'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                Điền đầy đủ thông tin để bạn đọc có thể tìm kiếm và đón đọc tác phẩm của bạn.
              </p>
            </div>
            <button
              onClick={() => setActiveView('my_books')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white flex items-center"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Quay lại
            </button>
          </div>

          <form onSubmit={handleSubmitBook} className="space-y-4 text-xs sm:text-sm">
            {/* Tên truyện */}
            <div>
              <label className="block font-semibold text-gray-800 dark:text-neutral-200 mb-1.5">
                Tên tác phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                placeholder="Ví dụ: Đêm Trăng Huyền Bí, Tu Tiên Ký..."
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition"
              />
            </div>

            {/* Bút danh & Thể loại */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-800 dark:text-neutral-200 mb-1.5">
                  Bút danh tác giả
                </label>
                <input
                  type="text"
                  value={bookForm.author_name}
                  onChange={(e) => setBookForm({ ...bookForm, author_name: e.target.value })}
                  placeholder="Tên bút danh bạn muốn hiển thị"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-800 dark:text-neutral-200 mb-1.5">
                  Thể loại chính
                </label>
                <select
                  value={bookForm.genre_ids[0] || ''}
                  onChange={(e) => setBookForm({ ...bookForm, genre_ids: [e.target.value] })}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition"
                >
                  {availableGenres.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trạng thái ra truyện & Chế độ xuất bản */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-800 dark:text-neutral-200 mb-1.5">
                  Tình trạng sáng tác
                </label>
                <select
                  value={bookForm.status}
                  onChange={(e) => setBookForm({ ...bookForm, status: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition"
                >
                  <option value="ongoing">Đang tiến hành (Còn tiếp)</option>
                  <option value="completed">Đã hoàn thành</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 dark:text-neutral-200 mb-1.5">
                  Chế độ hiển thị
                </label>
                <select
                  value={bookForm.publication_status}
                  onChange={(e) => setBookForm({ ...bookForm, publication_status: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition"
                >
                  <option value="published">Công khai cho bạn đọc</option>
                  <option value="draft">Bản nháp (Chỉ tác giả thấy)</option>
                </select>
              </div>
            </div>

            {/* Ảnh bìa & Tải ảnh từ máy */}
            <div className="space-y-3">
              <label className="block font-semibold text-gray-800 dark:text-neutral-200">
                Ảnh bìa tác phẩm
              </label>

              {/* Input file ẩn */}
              <input
                type="file"
                ref={coverFileInputRef}
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Xem trước ảnh bìa */}
                <div className="w-24 h-36 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 shadow shrink-0 bg-neutral-100 dark:bg-neutral-900 relative group">
                  <img
                    src={bookForm.cover_url || PRESET_COVERS[0].url}
                    alt="Xem trước bìa"
                    className="w-full h-full object-cover"
                  />
                  {bookForm.cover_url?.startsWith('data:image') && (
                    <span className="absolute bottom-1 left-1 right-1 bg-black/75 text-[9px] text-white text-center py-0.5 rounded">
                      Ảnh từ máy
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverFileInputRef.current?.click()}
                      className="px-4 py-2 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold text-xs flex items-center hover:from-brand-700 hover:to-purple-700 transition shadow-sm disabled:opacity-50"
                    >
                      <Upload className={`w-3.5 h-3.5 mr-1.5 ${uploadingCover ? 'animate-spin' : ''}`} />
                      {uploadingCover ? 'Đang xử lý ảnh...' : '📤 Tải ảnh bìa từ máy'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoGenerateCover}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-xs flex items-center hover:from-amber-600 hover:to-orange-600 transition shadow-sm"
                    >
                      <Palette className="w-3.5 h-3.5 mr-1.5" />
                      🎨 Tự tạo ảnh bìa nghệ thuật
                    </button>
                    {bookForm.cover_url?.startsWith('data:image') && (
                      <button
                        type="button"
                        onClick={() => setBookForm({ ...bookForm, cover_url: PRESET_COVERS[0].url })}
                        className="px-3 py-2 text-xs text-gray-500 hover:text-red-600 rounded-xl border border-gray-200 dark:border-neutral-700 transition"
                      >
                        Dùng ảnh mặc định
                      </button>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-400 block mb-1">Hoặc nhập liên kết ảnh trực tuyến (URL):</span>
                    <input
                      type="text"
                      value={bookForm.cover_url?.startsWith('data:image') ? '(Ảnh tải từ máy tính)' : bookForm.cover_url}
                      disabled={bookForm.cover_url?.startsWith('data:image')}
                      onChange={(e) => setBookForm({ ...bookForm, cover_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-neutral-400 pt-0.5">
                    <span>Hoặc chọn bìa mẫu:</span>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COVERS.map((cov, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBookForm({ ...bookForm, cover_url: cov.url })}
                          className="px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-700 hover:bg-brand-100 hover:text-brand-700 transition text-[11px]"
                        >
                          {cov.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tóm tắt giới thiệu */}
            <div>
              <label className="block font-semibold text-gray-800 dark:text-neutral-200 mb-1.5">
                Giới thiệu tóm tắt tác phẩm
              </label>
              <textarea
                rows={4}
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                placeholder="Mô tả bối cảnh, giới thiệu nhân vật chính và cốt truyện..."
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition leading-relaxed"
              />
            </div>

            {/* Cài đặt Thu phí & Giá bán tác phẩm */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-4">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Cài đặt Thu phí tác phẩm & Chương đọc thử (Tác giả hưởng 85%)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                    Giá mở khóa toàn bộ truyện (Xu)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={bookForm.price_coins}
                      onChange={(e) => setBookForm({ ...bookForm, price_coins: Math.max(0, parseInt(e.target.value) || 0) })}
                      placeholder="0 = Miễn phí hoàn toàn"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white text-sm"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-amber-600 font-bold">Xu</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {bookForm.price_coins === 0
                      ? 'Để 0 nếu muốn truyện mở miễn phí 100% cho mọi độc giả.'
                      : `Tác giả nhận 85% (${Math.round(bookForm.price_coins * 0.85)} Xu/lượt mua), Nhà phát hành trích 15% (${Math.round(bookForm.price_coins * 0.15)} Xu).`}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                    Số chương đọc thử miễn phí
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bookForm.free_chapters_count}
                    onChange={(e) => setBookForm({ ...bookForm, free_chapters_count: Math.max(0, parseInt(e.target.value) || 0) })}
                    disabled={bookForm.price_coins === 0}
                    placeholder="Mặc định: 5"
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white text-sm disabled:opacity-50"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    {bookForm.price_coins === 0
                      ? 'Không áp dụng khi truyện miễn phí.'
                      : `Độc giả được đọc miễn phí từ chương 1 đến chương ${bookForm.free_chapters_count}. Từ chương ${bookForm.free_chapters_count + 1} sẽ yêu cầu mở khóa truyện.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Tùy chọn 18+ và Giới Hạn Quyền Truy Cập */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="cb18Plus"
                  checked={bookForm.is_18_plus}
                  onChange={(e) => setBookForm({ ...bookForm, is_18_plus: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="cb18Plus" className="text-xs text-rose-900 dark:text-rose-200 cursor-pointer leading-relaxed">
                  <strong>🔞 Tác phẩm có yếu tố 18+ (Nội dung người lớn):</strong> Truyện sẽ được xếp vào danh mục 18+, tự động kích hoạt bảo vệ an toàn (chặn hiển thị quảng cáo Google AdSense trên các trang của truyện này, và chỉ mở khóa đầy đủ cho độc giả xác thực hoặc thành viên Premium).
                </label>
              </div>

              <div className="flex items-start space-x-3 pt-2 border-t border-rose-200/50 dark:border-rose-900/30">
                <input
                  type="checkbox"
                  id="cbPremium"
                  checked={bookForm.is_premium}
                  onChange={(e) => setBookForm({ ...bookForm, is_premium: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="cbPremium" className="text-xs text-amber-900 dark:text-amber-200 cursor-pointer leading-relaxed">
                  <strong>👑 Độc quyền thành viên VIP Premium:</strong> Giới hạn đọc toàn văn cho độc giả có gói hội viên Premium trả phí.
                </label>
              </div>
            </div>

            {/* Cam kết bản quyền */}
            {!editingBookId && (
              <div className="p-4 bg-brand-50 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-800/60 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="cbCopyright"
                  checked={bookForm.copyrightAgreement}
                  onChange={(e) => setBookForm({ ...bookForm, copyrightAgreement: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="cbCopyright" className="text-xs text-brand-900 dark:text-brand-200 cursor-pointer leading-relaxed">
                  <strong>Cam kết bản quyền:</strong> Tôi cam đoan nội dung tác phẩm này do tôi sáng tác hoặc tôi là người sở hữu quyền tác giả/cấp phép hợp pháp. Tôi không tự ý sao chép hay vi phạm quyền sở hữu trí tuệ của bất kỳ ai theo chính sách của TruyenNha.
                </label>
              </div>
            )}

            {/* Nút lưu */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setActiveView('my_books')}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition shadow-md shadow-brand-600/30 disabled:opacity-50 flex items-center"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {loading ? 'Đang lưu...' : editingBookId ? 'Lưu cập nhật' : 'Tạo tác phẩm & Đăng chương'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: QUẢN LÝ & SOẠN THẢO CHƯƠNG */}
      {activeView === 'manage_chapters' && selectedBook && (
        <div className="space-y-6">
          {/* Input file ẩn cho PDF */}
          <input
            type="file"
            ref={singlePdfInputRef}
            accept="application/pdf"
            onChange={handleSinglePdfUpload}
            className="hidden"
          />
          <input
            type="file"
            ref={batchPdfInputRef}
            accept="application/pdf"
            multiple
            onChange={handleBatchPdfSelected}
            className="hidden"
          />

          {/* Header truyện được chọn */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={selectedBook.cover_url || PRESET_COVERS[0].url}
                alt={selectedBook.title}
                className="w-14 h-20 object-cover rounded-xl shadow shrink-0 bg-neutral-100"
              />
              <div>
                <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
                  Quản lý chương
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedBook.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Tổng số: <strong>{chapters.length}</strong> chương đã đăng
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => batchPdfInputRef.current?.click()}
                disabled={pdfExtracting}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-brand-600 text-white rounded-xl text-xs font-semibold hover:from-purple-700 hover:to-brand-700 transition flex items-center shadow-sm disabled:opacity-50"
                title="Chọn nhiều file PDF, mỗi file là 1 chương để nạp tự động"
              >
                <FolderUp className="w-3.5 h-3.5 mr-1.5" />
                {pdfExtracting ? 'Đang trích xuất...' : 'Tải nhiều file PDF (1 file = 1 chapter)'}
              </button>

              <button
                onClick={() => {
                  setEditingChapterId(null);
                  const maxNum = chapters.reduce((m, c) => Math.max(m, c.chapter_number || 0), 0);
                  setChapterForm({
                    chapter_number: maxNum + 1,
                    title: `Chương ${maxNum + 1}: `,
                    content: '',
                    publication_status: 'published',
                  });
                }}
                className="px-3.5 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Soạn chương mới
              </button>
              <button
                onClick={() => setActiveView('my_books')}
                className="px-3.5 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-200 rounded-xl text-xs font-semibold hover:bg-gray-200 transition flex items-center"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Quay lại
              </button>
            </div>
          </div>

          {/* Hai cột: Danh sách chương (Trái) & Soạn thảo chương (Phải) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cột trái: Danh sách chương (5 cột) */}
            <div className="lg:col-span-5 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-700">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-neutral-400">
                  Mục lục chương ({chapters.length})
                </h3>
                <button
                  onClick={() => batchPdfInputRef.current?.click()}
                  className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center"
                >
                  <FileUp className="w-3 h-3 mr-1" /> Nhập từ PDF
                </button>
              </div>

              {chapters.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 space-y-2">
                  <p>Chưa có chương nào.</p>
                  <button
                    onClick={() => batchPdfInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-semibold text-xs inline-flex items-center"
                  >
                    <FolderUp className="w-3.5 h-3.5 mr-1" /> Tải lên các file PDF của bạn
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                  {chapters.map((ch) => (
                    <div
                      key={ch.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between text-xs ${
                        editingChapterId === ch.id
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 font-medium'
                          : 'border-gray-100 dark:border-neutral-700/60 hover:bg-gray-50 dark:hover:bg-neutral-750'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">
                          {ch.title}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center space-x-2 mt-0.5">
                          <span>{ch.word_count || 0} từ</span>
                          <span>•</span>
                          <span className={ch.publication_status === 'published' ? 'text-emerald-600' : 'text-amber-600'}>
                            {ch.publication_status === 'published' ? 'Công khai' : 'Bản nháp'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleEditChapter(ch)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 rounded transition"
                          title="Sửa chương"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(ch.id, ch.title)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded transition"
                          title="Xóa chương"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cột phải: Khung soạn thảo chương (7 cột) */}
            <div className="lg:col-span-7 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center">
                    <Feather className="w-4 h-4 mr-2 text-brand-600" />
                    {editingChapterId ? 'Chỉnh sửa chương' : 'Soạn chương mới'}
                  </h3>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Nút nạp 1 file PDF trực tiếp vào khung soạn thảo */}
                  <button
                    type="button"
                    disabled={pdfExtracting}
                    onClick={() => singlePdfInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-semibold text-xs flex items-center transition"
                    title="Trích xuất nội dung từ 1 file PDF vào chương này"
                  >
                    <FileUp className="w-3.5 h-3.5 mr-1" />
                    {pdfExtracting ? 'Đang đọc...' : '📄 Nhập từ 1 file PDF'}
                  </button>

                  <div className="text-xs text-gray-400">
                    {chapterForm.content.split(/\s+/).filter(Boolean).length} từ
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitChapter} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                      Số chương
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={chapterForm.chapter_number}
                      onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: parseInt(e.target.value, 10) || 1 })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                      Tiêu đề chương <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={chapterForm.title}
                      onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                      placeholder="Ví dụ: Chương 1: Thiếu niên thức tỉnh"
                      className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                    Trạng thái hiển thị
                  </label>
                  <select
                    value={chapterForm.publication_status}
                    onChange={(e) => setChapterForm({ ...chapterForm, publication_status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition"
                  >
                    <option value="published">Xuất bản công khai (Độc giả đọc ngay)</option>
                    <option value="draft">Bản nháp (Chưa công khai)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-neutral-300">
                    Nội dung chương <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={15}
                    required
                    value={chapterForm.content}
                    onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                    placeholder="Nhập hoặc dán nội dung chương tại đây. Hoặc bấm '📄 Nhập từ 1 file PDF' phía trên để trích xuất tự động..."
                    className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none transition font-sans text-xs sm:text-sm leading-relaxed"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                    Ước tính thời gian đọc: ~{Math.ceil(chapterForm.content.split(/\s+/).filter(Boolean).length / 250)} phút
                  </div>

                  <div className="flex gap-2">
                    {editingChapterId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChapterId(null);
                          const maxNum = chapters.reduce((m, c) => Math.max(m, c.chapter_number || 0), 0);
                          setChapterForm({
                            chapter_number: maxNum + 1,
                            title: `Chương ${maxNum + 1}: `,
                            content: '',
                            publication_status: 'published',
                          });
                        }}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 transition"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition shadow-md shadow-brand-600/30 disabled:opacity-50 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-1.5" />
                      {loading ? 'Đang lưu...' : editingChapterId ? 'Cập nhật chương' : 'Xuất bản chương'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: DOANH THU & RÚT TIỀN TÁC GIẢ */}
      {activeView === 'earnings' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-800 p-6 sm:p-8 rounded-2xl text-white shadow-lg space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-200">
              <Coins className="w-4 h-4" />
              <span>Quản lý Doanh thu & Rút tiền tác giả</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Thu nhập từ tác phẩm sáng tác
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 max-w-2xl leading-relaxed">
              Tác giả hưởng trọn 85% doanh thu từ độc giả mở khóa tác phẩm (15% phí duy trì nền tảng). Thu nhập được kết toán tức thì và có thể rút về tài khoản ngân hàng bất kỳ lúc nào.
            </p>
          </div>

          {/* Cards thống kê tài chính */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 dark:text-neutral-400 font-medium">Số dư khả dụng</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {((earningsData?.author_earnings ?? user.author_earnings) || 0).toLocaleString()} <span className="text-base font-normal">VNĐ</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium block pt-1">
                Có thể rút về tài khoản ngân hàng
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 dark:text-neutral-400 font-medium">Đang chờ xử lý rút</span>
              <div className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white">
                {(earningsData?.pending_withdrawals || 0).toLocaleString()} <span className="text-base font-normal">VNĐ</span>
              </div>
              <span className="text-[11px] text-amber-600 font-medium block pt-1">
                Ban quản trị phê duyệt trong vòng 24h
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 dark:text-neutral-400 font-medium">Tỷ lệ phân chia</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                85% <span className="text-xs font-normal text-gray-500">/ 15% nền tảng</span>
              </div>
              <span className="text-[11px] text-gray-400 block pt-1">
                Theo thỏa thuận bản quyền sáng tác
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form tạo yêu cầu rút tiền */}
            <div className="lg:col-span-1 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center border-b border-gray-100 dark:border-neutral-700 pb-3">
                <Wallet className="w-4 h-4 mr-2 text-amber-600" />
                Yêu cầu Rút tiền về Ngân hàng
              </h3>

              <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                      Số tiền muốn rút (VNĐ) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setWithdrawForm({
                          ...withdrawForm,
                          amount: Math.max(0, (earningsData?.author_earnings ?? user.author_earnings) || 0),
                        })
                      }
                      className="text-[11px] text-amber-600 hover:underline font-semibold"
                    >
                      Rút tất cả
                    </button>
                  </div>
                  <input
                    type="number"
                    min="50000"
                    step="1000"
                    required
                    value={withdrawForm.amount}
                    onChange={(e) =>
                      setWithdrawForm({ ...withdrawForm, amount: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Tối thiểu: 50.000 VNĐ</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                    Tên Ngân hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawForm.bank_name}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
                    placeholder="Ví dụ: MB Bank, Vietcombank, Techcombank..."
                    className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                    Số tài khoản ngân hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawForm.account_number}
                    onChange={(e) =>
                      setWithdrawForm({ ...withdrawForm, account_number: e.target.value.trim() })
                    }
                    placeholder="Nhập số tài khoản..."
                    className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                    Tên chủ tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawForm.account_holder}
                    onChange={(e) =>
                      setWithdrawForm({ ...withdrawForm, account_holder: e.target.value.toUpperCase() })
                    }
                    placeholder="Ví dụ: NGUYEN VAN A"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={withdrawing || ((earningsData?.author_earnings ?? user.author_earnings) || 0) < 50000}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{withdrawing ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu Rút Tiền'}</span>
                </button>
              </form>
            </div>

            {/* Bảng lịch sử rút tiền */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-700 pb-3">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-brand-600" />
                  Lịch sử yêu cầu rút tiền
                </h3>
                <button
                  type="button"
                  onClick={loadEarnings}
                  className="text-xs text-brand-600 hover:underline flex items-center"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Làm mới
                </button>
              </div>

              {(!earningsData?.withdrawal_history || earningsData.withdrawal_history.length === 0) ? (
                <div className="py-12 text-center text-xs text-gray-400 space-y-1">
                  <p>Chưa có lịch sử rút tiền nào.</p>
                  <p className="text-[11px]">Khi bạn gửi yêu cầu rút tiền, tiến trình xử lý sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-neutral-700 text-gray-400 font-semibold">
                        <th className="py-2.5">Thời gian</th>
                        <th className="py-2.5">Số tiền</th>
                        <th className="py-2.5">Ngân hàng</th>
                        <th className="py-2.5">Tài khoản</th>
                        <th className="py-2.5 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                      {earningsData.withdrawal_history.map((w: any) => (
                        <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-750">
                          <td className="py-3 text-gray-500 whitespace-nowrap">
                            {new Date(w.created_at).toLocaleDateString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </td>
                          <td className="py-3 font-bold text-amber-600">
                            {w.amount.toLocaleString()} VNĐ
                          </td>
                          <td className="py-3 text-gray-800 dark:text-neutral-200">
                            {w.bank_name}
                          </td>
                          <td className="py-3 text-gray-500">
                            <div>{w.account_number}</div>
                            <div className="text-[10px] text-gray-400">{w.account_holder}</div>
                          </td>
                          <td className="py-3 text-center">
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* BẢNG THEO DÕI DOANH THU ĐỘC GIẢ MỞ KHÓA TRUYỆN THEO THỜI GIAN THỰC */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700 space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center">
                <Coins className="w-4 h-4 mr-2 text-amber-500" />
                Lịch sử độc giả mở khóa tác phẩm (Quy đổi Xu sang VNĐ nhận ngay lập tức)
              </h3>

              {(!earningsData?.recent_sales || earningsData.recent_sales.length === 0) ? (
                <p className="text-xs text-gray-400 py-6 text-center">Chưa có lượt mở khóa truyện trả phí nào gần đây.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-neutral-700 text-gray-400 font-medium">
                        <th className="pb-2.5">Thời gian</th>
                        <th className="pb-2.5">Tác phẩm</th>
                        <th className="pb-2.5">Độc giả</th>
                        <th className="pb-2.5">Giá mở khóa</th>
                        <th className="pb-2.5 text-right">Doanh thu nhận (85% VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                      {earningsData.recent_sales.map((s: any) => (
                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-750">
                          <td className="py-3 text-gray-500 whitespace-nowrap">
                            {new Date(s.created_at).toLocaleDateString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </td>
                          <td className="py-3 font-semibold text-gray-900 dark:text-white">
                            {s.book_title}
                          </td>
                          <td className="py-3 text-gray-600 dark:text-neutral-300">
                            {s.reader_name || 'Độc giả'}
                          </td>
                          <td className="py-3 text-amber-600 font-bold">
                            🪙 {s.price_paid} Xu
                          </td>
                          <td className="py-3 font-extrabold text-emerald-600 text-right">
                            +{Number(s.author_earned).toLocaleString()} VNĐ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XEM TRƯỚC VÀ NẠP HÀNG LOẠT FILE PDF (MỖI FILE 1 CHAPTER) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-neutral-700 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
              <div className="flex items-center space-x-2">
                <FolderUp className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Tải lên hàng loạt từ PDF ({batchChapters.length} file)
                </h3>
              </div>
              <button
                disabled={loading}
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchChapters([]);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Hệ thống đã tự động trích xuất nội dung từ các file PDF. Bạn có thể kiểm tra tiêu đề và số chương trước khi đưa vào truyện <strong>{selectedBook?.title}</strong>.
            </p>

            {/* Danh sách các chương trích xuất */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {batchChapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                      📄 {ch.fileName}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {ch.pageCount} trang • {ch.wordCount} chữ
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Số chương</label>
                      <input
                        type="number"
                        min={1}
                        value={ch.chapterNumber || idx + 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const updated = [...batchChapters];
                          updated[idx].chapterNumber = val;
                          setBatchChapters(updated);
                        }}
                        className="w-full p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] text-gray-500 block mb-0.5">Tiêu đề chương</label>
                      <input
                        type="text"
                        value={ch.suggestedTitle}
                        onChange={(e) => {
                          const updated = [...batchChapters];
                          updated[idx].suggestedTitle = e.target.value;
                          setBatchChapters(updated);
                        }}
                        className="w-full p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tiến trình khi đang lưu */}
            {batchImportProgress && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 text-xs text-purple-800 dark:text-purple-300 flex items-center space-x-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>
                  Đang lưu chương {batchImportProgress.current} trên tổng số {batchImportProgress.total} chương...
                </span>
              </div>
            )}

            {/* Nút hành động */}
            <div className="pt-2 border-t border-gray-100 dark:border-neutral-700 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Tổng cộng: <strong>{batchChapters.length}</strong> chương
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-xs text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={loading || batchChapters.length === 0}
                  onClick={handleExecuteBatchImport}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-brand-600 text-white rounded-xl text-xs font-semibold hover:from-purple-700 hover:to-brand-700 transition shadow flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Bắt đầu tải lên {batchChapters.length} chương
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorStudioPage;
