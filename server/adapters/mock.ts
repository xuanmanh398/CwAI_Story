import { ContentAdapter, ExternalBookData, ExternalChapterData } from './base';

/**
 * MockAdapter: Bộ điều hợp giả lập nguồn cấp phép nội bộ
 * Cung cấp dữ liệu tự sáng tác có thỏa thuận ủy quyền bản quyền demo.
 */
export class MockInternalAdapter implements ContentAdapter {
  readonly providerType = 'mock_internal';

  async testConnection(_baseUrl: string, _configJson: string): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: 'Kết nối nguồn mẫu nội bộ thành công (Latency 12ms)' };
  }

  async fetchBooks(_baseUrl: string, _configJson: string): Promise<ExternalBookData[]> {
    return [
      {
        externalId: 'ext_sontrang_ky',
        title: 'Sơn Trang Ký Sự',
        authorName: 'Bạch Vân Cư Sĩ',
        coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        description: 'Chuyện về một sơn trang yên bình giữa thung lũng sương mù, nơi ẩn cư của những kỳ nhân dị sĩ lánh đời. Tác phẩm tự sáng tác mang phong cách điền viên dưỡng tâm.',
        genres: ['Kiếm Hiệp', 'Kỳ Ảo'],
        status: 'ongoing',
        licenseOwner: 'Bạch Vân Cư Sĩ (Ủy quyền số TN-MOCK-009)',
        licenseNotes: 'Được tác giả cho phép phát hành trọn bộ phi thương mại trên TruyenNha.',
      },
      {
        externalId: 'ext_nganthien_ngoai',
        title: 'Ngân Thiên Ngoại Truyện',
        authorName: 'Thiên Lam Tinh',
        coverUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80',
        description: 'Cuộc phiêu lưu giữa các hạm đội tuần tra không gian giải cứu các tiểu hành tinh khỏi thiên thạch. Tác phẩm viễn tưởng độc lập.',
        genres: ['Khoa Huyễn'],
        status: 'ongoing',
        licenseOwner: 'Thiên Lam Tinh (Ủy quyền số TN-MOCK-010)',
        licenseNotes: 'Hợp đồng cấp phép số hóa bản địa hóa tiếng Việt.',
      },
    ];
  }

  async fetchChapters(_baseUrl: string, bookExternalId: string, _configJson: string): Promise<ExternalChapterData[]> {
    if (bookExternalId === 'ext_sontrang_ky') {
      return [
        {
          chapterNumber: 1,
          title: 'Chương 1: Mưa xuân trên mái rạ',
          content: 'Mưa đầu xuân lất phất bay trên triền đồi ngát hương hoa mơ. Căn nhà tranh ba gian nép mình dưới bóng cây bách ngàn năm tuổi. Lão gia tử phe phẩy chiếc quạt nan, nhấp một ngụm trà sương sớm rồi mỉm cười nhìn đám đệ tử đang luyện tập trên bãi cỏ.',
        },
        {
          chapterNumber: 2,
          title: 'Chương 2: Khách quý từ kinh thành',
          content: 'Tiếng vó ngựa dồn dập phá vỡ bầu không khí tĩnh mịch của thung lũng. Một cỗ xe ngựa bằng gỗ đàn hương dừng lại trước cổng trúc. Từ trên xe bước xuống một thiếu niên tuấn tú mang theo phong thư có đóng dấu sáp đỏ của phủ vương gia.',
        },
      ];
    }

    if (bookExternalId === 'ext_nganthien_ngoai') {
      return [
        {
          chapterNumber: 1,
          title: 'Chương 1: Còi báo động vành đai Kuiper',
          content: 'Hệ thống radar quét tần số cao phát hiện luồng bụi vũ trụ bất thường di chuyển với tốc độ 0.05c về phía trạm tiếp nhiên liệu Alpha. Chỉ huy trưởng lập tức ban bố mức báo động cấp 3 cho toàn phi đội.',
        },
      ];
    }

    return [];
  }
}
