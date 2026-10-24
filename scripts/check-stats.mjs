import { SEED_50_NOVELS } from '../server/data/seed-novels.js';

let totalChapters = 0;
let totalWords = 0;
let minWords = Infinity;
let maxWords = 0;

for (const n of SEED_50_NOVELS) {
  for (const c of n.chapters) {
    totalChapters++;
    const count = c.content.split(/\s+/).filter(Boolean).length;
    totalWords += count;
    if (count < minWords) minWords = count;
    if (count > maxWords) maxWords = count;
  }
}

console.log('--- THỐNG KÊ NỘI DUNG 50 TRUYỆN SIÊU DÀI ---');
console.log('Tổng số truyện:', SEED_50_NOVELS.length);
console.log('Tổng số chương:', totalChapters);
console.log('Tổng số chữ:', totalWords.toLocaleString('vi-VN'));
console.log('Trung bình chữ / chương:', Math.round(totalWords / totalChapters).toLocaleString('vi-VN'));
console.log('Chương ngắn nhất:', minWords, 'chữ');
console.log('Chương dài nhất:', maxWords, 'chữ');
