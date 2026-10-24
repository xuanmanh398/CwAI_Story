import { SEED_50_NOVELS } from '../server/data/seed-novels.js';
console.log(`Total novels: ${SEED_50_NOVELS.length}`);
for (let i = 0; i < SEED_50_NOVELS.length; i++) {
  const n = SEED_50_NOVELS[i];
  console.log(`${i + 1}. [${n.genreSlug}] ${n.title} - ${n.chapters.length} chương`);
}
