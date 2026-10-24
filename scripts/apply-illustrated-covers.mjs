import fs from 'fs';
import path from 'path';

const coverMapping = {
  // Tiên Hiệp (8 distinct AI covers for top 8, plus matching covers for others)
  'dai-dao-phong-van-ky': '/covers/dai-dao-phong-van-ky.jpg',
  'huyet-long-than-de': '/covers/huyet-long-than-de.jpg',
  'cuu-thien-dao-ton': '/covers/cuu-thien-dao-ton.jpg',
  'thai-so-tien-mon': '/covers/thai-so-tien-mon.jpg',
  'van-co-phong-loi-quyet': '/covers/van-co-phong-loi-quyet.jpg',
  'dan-dao-chi-ton': '/covers/dan-dao-chi-ton.jpg',
  'bat-diet-kiem-the': '/covers/bat-diet-kiem-the.jpg',
  'tu-vi-tinh-quan-truyen-ky': '/covers/tu-vi-tinh-quan-truyen-ky.jpg',
  'than-ma-van-dao': '/covers/huyet-long-than-de.jpg',
  'nghich-menh-tu-tien-luc': '/covers/dai-dao-phong-van-ky.jpg',
  'truong-sinh-bat-tu-gia': '/covers/cuu-thien-dao-ton.jpg',
  'ngu-kiem-phi-thien': '/covers/thai-so-tien-mon.jpg',

  // Kiếm Hiệp
  'thanh-phong-tan-kiem': '/covers/thanh-phong-tan-kiem.jpg',
  'giang-ho-tieu-dao-luc': '/covers/thanh-phong-tan-kiem.jpg',
  'co-nhan-doat-menh-dao': '/covers/bat-diet-kiem-the.jpg',
  'tuong-duong-huyet-le-ky': '/covers/bat-diet-kiem-the.jpg',
  'han-bang-thiet-kiem': '/covers/thanh-phong-tan-kiem.jpg',
  'bach-y-hiep-anh': '/covers/dai-dao-phong-van-ky.jpg',
  'phong-tran-thap-nhat-kiem': '/covers/bat-diet-kiem-the.jpg',
  'tran-ma-tieu-cuc': '/covers/thanh-phong-tan-kiem.jpg',
  'bi-mat-doc-duoc-mon': '/covers/dan-dao-chi-ton.jpg',
  'luc-chi-cam-ma-tai-the': '/covers/tu-vi-tinh-quan-truyen-ky.jpg',
  'vo-lam-bat-dai-khi': '/covers/bat-diet-kiem-the.jpg',

  // Đô Thị
  'gio-ngang-pho-co': '/covers/gio-ngang-pho-co.jpg',
  'pho-thi-phon-hoa': '/covers/gio-ngang-pho-co.jpg',
  'buoc-ngoat-tuoi-30': '/covers/gio-ngang-pho-co.jpg',
  'sai-gon-nang-gio': '/covers/gio-ngang-pho-co.jpg',
  'bac-si-vung-cao': '/covers/gio-ngang-pho-co.jpg',
  'lang-le-ha-thanh': '/covers/gio-ngang-pho-co.jpg',
  'gia-dinh-la-diem-tua': '/covers/gio-ngang-pho-co.jpg',
  'thuc-tap-sinh-tai-nang': '/covers/gio-ngang-pho-co.jpg',
  'ky-tuc-xa-nam-ay': '/covers/gio-ngang-pho-co.jpg',

  // Khoa Huyễn
  'bi-mat-tinh-cau-lam': '/covers/bi-mat-tinh-cau-lam.jpg',
  'bien-gioi-tinh-cau': '/covers/bi-mat-tinh-cau-lam.jpg',
  'tram-khong-gian-vong-thien': '/covers/bi-mat-tinh-cau-lam.jpg',
  'ky-nguyen-nguoi-may-2150': '/covers/bi-mat-tinh-cau-lam.jpg',
  'tin-hieu-tu-vuc-den': '/covers/tu-vi-tinh-quan-truyen-ky.jpg',
  'hai-trinh-lien-sao': '/covers/bi-mat-tinh-cau-lam.jpg',
  'thanh-pho-duoi-day-bien': '/covers/bi-mat-tinh-cau-lam.jpg',
  'mang-luoi-than-kinh-ao': '/covers/tu-vi-tinh-quan-truyen-ky.jpg',
  'di-tich-nen-van-minh-co': '/covers/ban-thao-gia-kim-thuat.jpg',

  // Huyền Huyễn
  'ban-thao-gia-kim-thuat': '/covers/ban-thao-gia-kim-thuat.jpg',
  'luc-dia-ma-phap-aethelgard': '/covers/thai-so-tien-mon.jpg',
  'ky-si-rong-than': '/covers/huyet-long-than-de.jpg',
  'phu-thuy-vung-dat-chet': '/covers/ban-thao-gia-kim-thuat.jpg',
  'lanh-chua-rung-suong-mu': '/covers/thanh-phong-tan-kiem.jpg',
  'khe-uoc-than-thu': '/covers/huyet-long-than-de.jpg',
  'huyet-toc-thuong-co': '/covers/ban-thao-gia-kim-thuat.jpg',
  'than-khi-giac-tinh': '/covers/bat-diet-kiem-the.jpg',
  'hai-tac-bien-sau-ky-bi': '/covers/ban-thao-gia-kim-thuat.jpg',

  // Trinh Thám
  'an-mang-trong-dem-mua-song-huong': '/covers/an-mang-trong-dem-mua-song-huong.jpg',
  'ky-an-tiem-tra-co': '/covers/an-mang-trong-dem-mua-song-huong.jpg',
  'mat-ma-co-tran': '/covers/an-mang-trong-dem-mua-song-huong.jpg',
  'hoang-thanh-di-su': '/covers/an-mang-trong-dem-mua-song-huong.jpg',
  'truyen-la-rung-thieng': '/covers/an-mang-trong-dem-mua-song-huong.jpg',
  'ho-so-vu-an-so-0': '/covers/an-mang-trong-dem-mua-song-huong.jpg',

  // 18+
  'hong-nhan-tien-lo-18': '/covers/hong-nhan-tien-lo-18.jpg',
  'da-sac-phon-hoa-18': '/covers/hong-nhan-tien-lo-18.jpg',
  'ma-nu-nghin-nam-18': '/covers/hong-nhan-tien-lo-18.jpg',
};

const defaultGenreCovers = {
  'tien-hiep': '/covers/dai-dao-phong-van-ky.jpg',
  'kiem-hiep': '/covers/thanh-phong-tan-kiem.jpg',
  'do-thi': '/covers/gio-ngang-pho-co.jpg',
  'khoa-huyen': '/covers/bi-mat-tinh-cau-lam.jpg',
  'huyen-huyen': '/covers/ban-thao-gia-kim-thuat.jpg',
  'trinh-tham': '/covers/an-mang-trong-dem-mua-song-huong.jpg',
  '18-plus': '/covers/hong-nhan-tien-lo-18.jpg'
};

const seedFilePath = path.join(process.cwd(), 'server', 'data', 'seed-novels.ts');
let rawCode = fs.readFileSync(seedFilePath, 'utf-8');

const match = rawCode.match(/export const SEED_50_NOVELS: SeedNovel\[\] = (\[[\s\S]*\]);/);
if (!match) {
  console.error('Failed to parse SEED_50_NOVELS');
  process.exit(1);
}

const novels = eval(match[1]);
console.log(`Updating covers for ${novels.length} novels...`);

const updated = novels.map(n => {
  const chosenCover = coverMapping[n.slug] || defaultGenreCovers[n.genreSlug] || '/covers/dai-dao-phong-van-ky.jpg';
  return {
    ...n,
    cover: chosenCover,
    coverUrl: chosenCover
  };
});

const newTsContent = `export interface SeedChapter {
  num: number;
  title: string;
  content: string;
}

export interface SeedNovel {
  id?: string;
  title: string;
  slug: string;
  author: string;
  authorId?: string;
  genreSlug: string;
  cover?: string;
  coverUrl?: string;
  status?: string;
  description?: string;
  is18Plus?: number;
  isPremium?: number;
  is_18_plus?: number;
  is_premium?: number;
  chapters?: SeedChapter[];
  [key: string]: any;
}

export const SEED_50_NOVELS: SeedNovel[] = ${JSON.stringify(updated, null, 2)};
`;
fs.writeFileSync(seedFilePath, newTsContent, 'utf-8');
console.log('Successfully updated seed-novels.ts with illustrated character/setting covers!');
