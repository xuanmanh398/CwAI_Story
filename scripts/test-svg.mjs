import fs from 'fs';

function generateSvgCover(title, author, genreSlug) {
  // Theme styling based on genre
  const themes = {
    'tien-hiep': {
      bgGrad: ['#090d16', '#1e1b4b', '#030712'],
      accentColor: '#38bdf8',
      dividerColor: '#a855f7',
      badgeBg: '#7c3aed',
      genreText: 'TIÊN HIỆP TU CHÂN',
      artSymbol: `
        <circle cx='300' cy='320' r='120' fill='none' stroke='#c084fc' stroke-width='1.5' stroke-dasharray='4,6' opacity='0.3'/>
        <circle cx='300' cy='320' r='85' fill='none' stroke='#38bdf8' stroke-width='1' opacity='0.4'/>
        <!-- Celestial Sword Silhouette -->
        <path d='M300,180 L308,310 L325,320 L308,325 L300,420 L292,325 L275,320 L292,310 Z' fill='url(#swordGrad)' opacity='0.85'/>
        <path d='M285,320 L315,320' stroke='#f8fafc' stroke-width='3'/>
        <!-- Mist mountain base -->
        <path d='M100,520 Q200,460 300,500 T500,470 L500,540 L100,540 Z' fill='#1e1b4b' opacity='0.4'/>
      `
    },
    'kiem-hiep': {
      bgGrad: ['#1c1917', '#450a0a', '#0c0a09'],
      accentColor: '#f87171',
      dividerColor: '#ef4444',
      badgeBg: '#b91c1c',
      genreText: 'KIẾM HIỆP TRƯỜNG THIÊN',
      artSymbol: `
        <!-- Ancient Sun / Blood Moon -->
        <circle cx='300' cy='310' r='100' fill='#7f1d1d' opacity='0.35'/>
        <circle cx='300' cy='310' r='90' fill='none' stroke='#ef4444' stroke-width='2' opacity='0.4'/>
        <!-- Crossed Blades -->
        <path d='M230,220 L370,390 M370,220 L230,390' stroke='#fca5a5' stroke-width='4' stroke-linecap='round' opacity='0.8'/>
        <circle cx='300' cy='305' r='12' fill='#ef4444'/>
        <!-- Bamboo stalks silhouette -->
        <path d='M140,480 L140,240 M148,480 L148,270 M450,480 L450,220 M460,480 L460,260' stroke='#78716c' stroke-width='2.5' opacity='0.25'/>
      `
    },
    'do-thi': {
      bgGrad: ['#0f172a', '#064e3b', '#022c22'],
      accentColor: '#34d399',
      dividerColor: '#10b981',
      badgeBg: '#059669',
      genreText: 'ĐÔ THỊ HIỆN ĐẠI',
      artSymbol: `
        <!-- Modern Skyscraper Silhouette & Night Lights -->
        <rect x='180' y='240' width='45' height='220' fill='#042f2e' opacity='0.7'/>
        <rect x='235' y='180' width='60' height='280' fill='#064e3b' opacity='0.8'/>
        <rect x='305' y='210' width='55' height='250' fill='#042f2e' opacity='0.75'/>
        <rect x='370' y='260' width='50' height='200' fill='#022c22' opacity='0.85'/>
        <!-- Antenna needle -->
        <line x1='265' y1='140' x2='265' y2='180' stroke='#34d399' stroke-width='2'/>
        <circle cx='265' cy='140' r='3' fill='#34d399'/>
        <!-- Window dots -->
        <circle cx='250' cy='210' r='2' fill='#a7f3d0' opacity='0.7'/>
        <circle cx='270' cy='230' r='2' fill='#a7f3d0' opacity='0.7'/>
        <circle cx='330' cy='240' r='2' fill='#a7f3d0' opacity='0.7'/>
      `
    },
    'khoa-huyen': {
      bgGrad: ['#020617', '#0c4a6e', '#030712'],
      accentColor: '#38bdf8',
      dividerColor: '#0ea5e9',
      badgeBg: '#0284c7',
      genreText: 'KHOA HỌC VIỄN TƯỞNG',
      artSymbol: `
        <!-- Planet with orbit ring -->
        <circle cx='300' cy='310' r='80' fill='url(#planetGrad)' opacity='0.85'/>
        <ellipse cx='300' cy='310' rx='140' ry='35' fill='none' stroke='#38bdf8' stroke-width='2.5' transform='rotate(-20 300 310)' opacity='0.6'/>
        <!-- Deep space stars -->
        <circle cx='180' cy='200' r='1.5' fill='#fff' opacity='0.8'/>
        <circle cx='420' cy='220' r='2' fill='#fff' opacity='0.9'/>
        <circle cx='380' cy='420' r='1.5' fill='#fff' opacity='0.7'/>
        <circle cx='220' cy='410' r='1.2' fill='#fff' opacity='0.6'/>
      `
    },
    'huyen-huyen': {
      bgGrad: ['#180b26', '#4c1d95', '#0f051d'],
      accentColor: '#fbbf24',
      dividerColor: '#d97706',
      badgeBg: '#b45309',
      genreText: 'HUYỀN HUYỄN MA THUẬT',
      artSymbol: `
        <!-- Magic Runic Circle -->
        <circle cx='300' cy='310' r='110' fill='none' stroke='#fbbf24' stroke-width='2' stroke-dasharray='10,6' opacity='0.4'/>
        <polygon points='300,205 390,360 210,360' fill='none' stroke='#f59e0b' stroke-width='1.5' opacity='0.45'/>
        <polygon points='300,415 390,260 210,260' fill='none' stroke='#f59e0b' stroke-width='1.5' opacity='0.45'/>
        <circle cx='300' cy='310' r='40' fill='#7c2d12' opacity='0.5'/>
        <circle cx='300' cy='310' r='15' fill='#fbbf24' opacity='0.8'/>
      `
    },
    'trinh-tham': {
      bgGrad: ['#090d16', '#1e293b', '#030712'],
      accentColor: '#fbbf24',
      dividerColor: '#e2e8f0',
      badgeBg: '#b91c1c',
      genreText: 'TRINH THÁM LY KỲ',
      artSymbol: `
        <!-- Noir Streetlamp & Detective Silhouette -->
        <circle cx='300' cy='260' r='140' fill='url(#lampGrad)' opacity='0.3'/>
        <!-- Silhouette in hat & trenchcoat -->
        <path d='M280,240 Q300,225 320,240 L335,245 L265,245 Z' fill='#e2e8f0' opacity='0.7'/>
        <circle cx='300' cy='258' r='14' fill='#e2e8f0' opacity='0.75'/>
        <path d='M275,275 L325,275 L345,390 L255,390 Z' fill='#e2e8f0' opacity='0.65'/>
        <!-- Magnifying glass line -->
        <circle cx='360' cy='330' r='25' fill='none' stroke='#fbbf24' stroke-width='3' opacity='0.7'/>
        <line x1='378' y1='348' x2='405' y2='375' stroke='#fbbf24' stroke-width='4' stroke-linecap='round' opacity='0.7'/>
      `
    },
    '18-plus': {
      bgGrad: ['#180816', '#4c0519', '#090209'],
      accentColor: '#f43f5e',
      dividerColor: '#fb7185',
      badgeBg: '#e11d48',
      genreText: '🔞 TRUYỆN 18+ (GIỚI HẠN)',
      artSymbol: `
        <!-- Sensual Velvet Rose & Ornate Heart / Petals -->
        <circle cx='300' cy='310' r='105' fill='none' stroke='#f43f5e' stroke-width='1.5' stroke-dasharray='4,4' opacity='0.4'/>
        <path d='M300,340 C280,310 240,280 240,240 C240,200 280,190 300,220 C320,190 360,200 360,240 C360,280 320,310 300,340 Z' fill='#be123c' opacity='0.65'/>
        <!-- Rose Petals Drift -->
        <ellipse cx='230' cy='360' rx='14' ry='8' transform='rotate(25 230 360)' fill='#fda4af' opacity='0.4'/>
        <ellipse cx='370' cy='350' rx='12' ry='7' transform='rotate(-20 370 350)' fill='#fda4af' opacity='0.4'/>
      `
    }
  };

  const t = themes[genreSlug] || themes['tien-hiep'];

  // Break title into balanced lines (max 20 chars per line)
  const words = title.trim().toUpperCase().split(/\s+/);
  const lines = [];
  let currentLine = '';
  for (const w of words) {
    if ((currentLine + ' ' + w).trim().length > 18) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine = (currentLine + ' ' + w).trim();
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  // Dynamic font size
  const fontSize = lines.length >= 3 ? 30 : lines.length === 2 ? 34 : 38;
  const lineSpacing = fontSize + 12;
  const startY = 530 - ((lines.length - 1) * lineSpacing) / 2;

  const titleLinesSvg = lines.map((l, i) => 
    `<text x='300' y='${startY + i * lineSpacing}' text-anchor='middle' fill='#ffffff' font-family='\"Segoe UI\", Roboto, \"Noto Serif\", Georgia, serif' font-size='${fontSize}' font-weight='800' letter-spacing='0.5'>${l}</text>`
  ).join('\n    ');

  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 900' width='600' height='900'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0.6' y2='1'>
      <stop offset='0%' stop-color='${t.bgGrad[0]}'/>
      <stop offset='50%' stop-color='${t.bgGrad[1]}'/>
      <stop offset='100%' stop-color='${t.bgGrad[2]}'/>
    </linearGradient>
    <linearGradient id='swordGrad' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#ffffff'/>
      <stop offset='50%' stop-color='#e0e7ff'/>
      <stop offset='100%' stop-color='#a855f7'/>
    </linearGradient>
    <radialGradient id='lampGrad' cx='50%' cy='50%' r='50%'>
      <stop offset='0%' stop-color='rgba(251,191,36,0.5)'/>
      <stop offset='100%' stop-color='rgba(0,0,0,0)'/>
    </radialGradient>
    <radialGradient id='planetGrad' cx='35%' cy='35%' r='65%'>
      <stop offset='0%' stop-color='#38bdf8'/>
      <stop offset='50%' stop-color='#0284c7'/>
      <stop offset='100%' stop-color='#0f172a'/>
    </radialGradient>
    <filter id='shadow' x='-10%' y='-10%' width='120%' height='120%'>
      <feDropShadow dx='0' dy='3' stdDeviation='5' flood-color='rgba(0,0,0,0.85)'/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width='600' height='900' fill='url(#bg)'/>

  <!-- Classical Border Frame -->
  <rect x='28' y='28' width='544' height='844' fill='none' stroke='${t.accentColor}' stroke-width='1.5' opacity='0.4'/>
  <rect x='36' y='36' width='528' height='828' fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='1'/>
  
  <!-- Corner Flourishes -->
  <path d='M44,60 L60,44 M540,60 L524,44 M44,840 L60,856 M540,840 L524,856' stroke='${t.accentColor}' stroke-width='1.5' opacity='0.6'/>

  <!-- Header Branding -->
  <text x='300' y='85' text-anchor='middle' fill='rgba(255,255,255,0.7)' font-family='system-ui, sans-serif' font-size='11' font-weight='600' letter-spacing='3'>TRUYỆN NHÀ • TUYỂN CHỌN ĐẶC SẮC</text>
  <line x1='200' y1='102' x2='400' y2='102' stroke='rgba(255,255,255,0.2)' stroke-width='1'/>

  <!-- Center Artwork Symbol -->
  <g>
    ${t.artSymbol}
  </g>

  <!-- Title Area with Shadow -->
  <g filter='url(#shadow)'>
    ${titleLinesSvg}
  </g>

  <!-- Decorative Divider -->
  <g transform='translate(225, ${startY + lines.length * lineSpacing + 5})'>
    <line x1='0' y1='0' x2='60' y2='0' stroke='${t.dividerColor}' stroke-width='1.5'/>
    <polygon points='75,-5 80,0 75,5 70,0' fill='${t.dividerColor}'/>
    <line x1='90' y1='0' x2='150' y2='0' stroke='${t.dividerColor}' stroke-width='1.5'/>
  </g>

  <!-- Author Name -->
  <text x='300' y='${startY + lines.length * lineSpacing + 45}' text-anchor='middle' fill='#fde68a' font-family='\"Noto Serif\", Georgia, serif' font-size='17' font-style='italic'>Tác giả: ${author}</text>

  <!-- Bottom Genre Badge -->
  <rect x='190' y='765' width='220' height='34' rx='17' fill='${t.badgeBg}' opacity='0.9'/>
  <text x='300' y='787' text-anchor='middle' fill='#ffffff' font-family='system-ui, sans-serif' font-size='11' font-weight='700' letter-spacing='1.5'>${t.genreText}</text>

  <!-- Bottom Subtitle -->
  <text x='300' y='835' text-anchor='middle' fill='rgba(255,255,255,0.45)' font-family='system-ui, sans-serif' font-size='9.5' letter-spacing='2'>XUẤT BẢN TRỌN BỘ • 10 CHƯƠNG HOÀN CHỈNH</text>
</svg>`;
}

const testSvg = generateSvgCover('Án Mạng Trong Đêm Mưa Sông Hương', 'Thám Tử Trần', 'trinh-tham');
console.log('Generated test SVG length:', testSvg.length);
fs.writeFileSync('test-cover.svg', testSvg);
