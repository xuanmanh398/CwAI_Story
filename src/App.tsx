import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { BookListPage } from './pages/BookListPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { ChapterReadingPage } from './pages/ChapterReadingPage';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AuthorStudioPage } from './pages/studio/AuthorStudioPage';
import { AuthorRegisterPage } from './pages/studio/AuthorRegisterPage';
import { TopupPage } from './pages/wallet/TopupPage';
import { AboutPage } from './pages/static/AboutPage';
import { TermsPage } from './pages/static/TermsPage';
import { PrivacyPage } from './pages/static/PrivacyPage';
import { CopyrightPage } from './pages/static/CopyrightPage';
import { DmcaReportPage } from './pages/static/DmcaReportPage';
import { ContactPage } from './pages/static/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BookListPage />} />
          <Route path="/danh-muc" element={<BookListPage />} />
          <Route path="/books/:slug" element={<BookDetailPage />} />
          <Route path="/books/:slug/:chapterSlug" element={<ChapterReadingPage />} />
          <Route path="/books/:slug/chuong-:chapterNumber" element={<ChapterReadingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/tu-sach" element={<LibraryPage />} />
          <Route path="/studio" element={<AuthorStudioPage />} />
          <Route path="/dang-truyen" element={<AuthorStudioPage />} />
          <Route path="/dang-ky-tac-gia" element={<AuthorRegisterPage />} />
          <Route path="/nap-xu" element={<TopupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
          <Route path="/xac-thuc-email" element={<VerifyEmailPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />

          {/* Trang tĩnh */}
          <Route path="/gioi-thieu" element={<AboutPage />} />
          <Route path="/dieu-khoan" element={<TermsPage />} />
          <Route path="/chinh-sach-bao-mat" element={<PrivacyPage />} />
          <Route path="/chinh-sach-ban-quyen" element={<CopyrightPage />} />
          <Route path="/bao-cao-vi-pham" element={<DmcaReportPage />} />
          <Route path="/lien-he" element={<ContactPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
};

export default App;
