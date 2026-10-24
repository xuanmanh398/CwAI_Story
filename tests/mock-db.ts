/**
 * Mock D1Database cho Vitest
 */
export function createMockD1Database(initialData: {
  books?: any[];
  chapters?: any[];
  authors?: any[];
  genres?: any[];
  users?: any[];
  sessions?: any[];
  bookmarks?: any[];
} = {}): any {
  const books = initialData.books || [
    {
      id: 'bk_1',
      title: 'Đại Đạo Phong Vân Ký',
      slug: 'dai-dao-phong-van-ky',
      author_id: 'auth_1',
      cover_url: 'https://example.com/cover1.jpg',
      description: 'Truyện tiên hiệp tự sáng tác',
      status: 'ongoing',
      publication_status: 'published',
      source_type: 'original',
      view_count: 10,
      created_at: '2024-10-20T10:00:00.000Z',
      updated_at: '2024-10-20T10:00:00.000Z',
    },
    {
      id: 'bk_draft',
      title: 'Bản Thảo Giả Kim Thuật',
      slug: 'ban-thao-gia-kim-thuat',
      author_id: 'auth_1',
      cover_url: '',
      description: 'Bản nháp thử nghiệm',
      status: 'ongoing',
      publication_status: 'draft',
      source_type: 'original',
      view_count: 0,
      created_at: '2024-10-20T10:00:00.000Z',
      updated_at: '2024-10-20T10:00:00.000Z',
    },
  ];

  const chapters = initialData.chapters || [
    {
      id: 'chap_1',
      book_id: 'bk_1',
      chapter_number: 1,
      title: 'Chương 1: Phế tích',
      slug: 'chuong-1-phe-tich',
      content: 'Nội dung chương 1...',
      word_count: 200,
      publication_status: 'published',
      created_at: '2024-10-20T10:00:00.000Z',
      updated_at: '2024-10-20T10:00:00.000Z',
    },
    {
      id: 'chap_draft',
      book_id: 'bk_draft',
      chapter_number: 1,
      title: 'Chương nháp bí mật',
      slug: 'chuong-nhap',
      content: 'Nội dung chưa công bố...',
      word_count: 100,
      publication_status: 'draft',
      created_at: '2024-10-20T10:00:00.000Z',
      updated_at: '2024-10-20T10:00:00.000Z',
    },
  ];

  const users = initialData.users || [];
  const sessions = initialData.sessions || [];
  const bookmarks = initialData.bookmarks || [];

  return {
    prepare(sql: string) {
      let boundParams: any[] = [];
      const stmt = {
        bind(...params: any[]) {
          boundParams = params;
          return stmt;
        },
        async first<T = any>(): Promise<T | null> {
          const lower = sql.toLowerCase();

          // Check user by username/email
          if (lower.includes('from users') && (lower.includes('username = ?') || lower.includes('email = ?'))) {
            const uOrE = boundParams[0];
            const u = users.find(
              (x) => x.username.toLowerCase() === uOrE.toLowerCase() || x.email.toLowerCase() === uOrE.toLowerCase()
            );
            return (u as T) || null;
          }

          // Check existing admin
          if (lower.includes('from users where role = \'admin\'')) {
            const admin = users.find((x) => x.role === 'admin');
            return (admin as T) || null;
          }

          // Check session user
          if (lower.includes('from sessions') && lower.includes('join users')) {
            const sessionId = boundParams[0];
            const sess = sessions.find((s) => s.id === sessionId);
            if (!sess) return null;
            const u = users.find((x) => x.id === sess.user_id);
            if (!u) return null;
            return { ...u, expires_at: sess.expires_at } as T;
          }

          // Total count for books
          if (lower.includes('select count(*) as total from books')) {
            const count = books.filter((b) => b.publication_status === 'published').length;
            return { total: count } as T;
          }

          // Detail book by slug
          if (lower.includes('from books b') && lower.includes('where b.slug = ?')) {
            const slug = boundParams[1] || boundParams[0];
            const b = books.find((x) => x.slug === slug);
            if (!b) return null;
            return {
              ...b,
              author_name: 'Lam Vũ',
              genres_raw: 'genre_1::Tiên Hiệp::tien-hiep',
              total_chapters: chapters.filter((c) => c.book_id === b.id).length,
            } as T;
          }

          // Single chapter
          if (lower.includes('from chapters') && lower.includes('chapter_number = ?')) {
            const bId = boundParams[0];
            const chNum = boundParams[1];
            const ch = chapters.find((c) => c.book_id === bId && c.chapter_number === chNum);
            return (ch as T) || null;
          }

          // Single chapter by id
          if (lower.includes('from chapters') && lower.includes('where c.id = ?')) {
            const chId = boundParams[0];
            const ch = chapters.find((c) => c.id === chId);
            return (ch as T) || null;
          }

          // Max chapter number
          if (lower.includes('select max(chapter_number) as max_num from chapters')) {
            const bId = boundParams[0];
            const max = chapters.filter((c) => c.book_id === bId).reduce((m, c) => Math.max(m, c.chapter_number || 0), 0);
            return { max_num: max } as T;
          }

          // Single book by id
          if (lower.includes('from books') && lower.includes('where') && (lower.includes('id = ?') || lower.includes('b.id = ?'))) {
            const bId = boundParams[0];
            const b = books.find((x) => x.id === bId);
            return (b as T) || null;
          }

          // Check bookmark
          if (lower.includes('from bookmarks where user_id = ?')) {
            const uId = boundParams[0];
            const bId = boundParams[1];
            const bm = bookmarks.find((x) => x.user_id === uId && x.book_id === bId);
            return (bm as T) || null;
          }

          return null;
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          const lower = sql.toLowerCase();

          if (lower.includes('from books')) {
            const pubOnly = lower.includes("b.publication_status = 'published'");
            let list = pubOnly ? books.filter((b) => b.publication_status === 'published') : books;
            return { results: list as T[] };
          }

          if (lower.includes('from chapters')) {
            const bId = boundParams[0];
            const list = chapters.filter((c) => c.book_id === bId);
            return { results: list as T[] };
          }

          return { results: [] };
        },
        async run(): Promise<{ success: boolean }> {
          const lower = sql.toLowerCase();

          if (lower.includes('insert into users')) {
            users.push({
              id: boundParams[0],
              username: boundParams[1],
              email: boundParams[2],
              password_hash: boundParams[3],
              salt: boundParams[4],
              role: boundParams[5],
              is_active: 1,
            });
          }

          if (lower.includes('insert into sessions')) {
            sessions.push({
              id: boundParams[0],
              user_id: boundParams[1],
              expires_at: boundParams[2],
            });
          }

          if (lower.includes('insert into books')) {
            books.push({
              id: boundParams[0],
              title: boundParams[1],
              slug: boundParams[2],
              author_id: boundParams[3],
              cover_url: boundParams[4],
              description: boundParams[5],
              status: boundParams[6],
              publication_status: boundParams[7],
              source_type: 'original',
              view_count: 0,
              created_by_user_id: boundParams[8],
              created_at: boundParams[9],
              updated_at: boundParams[10],
            });
          }

          if (lower.includes('insert into chapters')) {
            chapters.push({
              id: boundParams[0],
              book_id: boundParams[1],
              chapter_number: boundParams[2],
              title: boundParams[3],
              slug: boundParams[4],
              content: boundParams[5],
              word_count: boundParams[6],
              publication_status: boundParams[7],
              created_at: boundParams[9],
              updated_at: boundParams[10],
            });
          }

          if (lower.includes('insert or ignore into bookmarks')) {
            bookmarks.push({
              id: boundParams[0],
              user_id: boundParams[1],
              book_id: boundParams[2],
            });
          }

          return { success: true };
        },
      };
      return stmt;
    },
    async batch(statements: any[]) {
      for (const st of statements) {
        if (st && typeof st.run === 'function') {
          await st.run();
        }
      }
      return [];
    },
  };
}
