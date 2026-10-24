import fs from 'fs';
import path from 'path';

function generateSvgCover(title, author, genreSlug) {
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
        <line x1='265' y1='140' x2='265' y2='180' stroke='#34d399' stroke-width='2'/>
        <circle cx='265' cy='140' r='3' fill='#34d399'/>
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
        <path d='M280,240 Q300,225 320,240 L335,245 L265,245 Z' fill='#e2e8f0' opacity='0.7'/>
        <circle cx='300' cy='258' r='14' fill='#e2e8f0' opacity='0.75'/>
        <path d='M275,275 L325,275 L345,390 L255,390 Z' fill='#e2e8f0' opacity='0.65'/>
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
        <ellipse cx='230' cy='360' rx='14' ry='8' transform='rotate(25 230 360)' fill='#fda4af' opacity='0.4'/>
        <ellipse cx='370' cy='350' rx='12' ry='7' transform='rotate(-20 370 350)' fill='#fda4af' opacity='0.4'/>
      `
    }
  };

  const t = themes[genreSlug] || themes['tien-hiep'];

  // Break title into balanced lines
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

  const fontSize = lines.length >= 3 ? 30 : lines.length === 2 ? 34 : 38;
  const lineSpacing = fontSize + 12;
  const startY = 530 - ((lines.length - 1) * lineSpacing) / 2;

  const titleLinesSvg = lines.map((l, i) => 
    `<text x='300' y='${startY + i * lineSpacing}' text-anchor='middle' fill='#ffffff' font-family='\"Segoe UI\", Roboto, \"Noto Serif\", Georgia, serif' font-size='${fontSize}' font-weight='800' letter-spacing='0.5'>${l}</text>`
  ).join('\n    ');

  const svgContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 900' width='600' height='900'>
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

  <rect width='600' height='900' fill='url(#bg)'/>

  <!-- Classical Border Frame -->
  <rect x='28' y='28' width='544' height='844' fill='none' stroke='${t.accentColor}' stroke-width='1.5' opacity='0.4'/>
  <rect x='36' y='36' width='528' height='828' fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='1'/>
  
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

  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

const GENRE_NARRATIVES = {
  'tien-hiep': {
    chapterTitles: [
      'Khởi Điểm Phàm Trần',
      'Đan Điền Dị Biến',
      'Ngoại Môn Khảo Hạch',
      'Nhất Quyền Chấn Chúng Nhân',
      'U Minh Cổ Quật',
      'Luyện Khí Cực Cảnh',
      'Trúc Cơ Dị Tượng',
      'Huyết Chiến Đoạt Bảo',
      'Tông Môn Phong Vân',
      'Nhất Kiếm Định Càn Khôn'
    ],
    generateChapter: (novelTitle, author, chNum, chTitle) => {
      return `Mây mù giăng kín các đỉnh non thiêng ngút ngàn trùng điệp, từng đợt linh vũ nhè nhẹ đổ xuống như rắc bụi vàng khắp cả một vùng đất trời rộng lớn. Nơi đây là chốn linh sơn tú thủy nghìn năm chưa từng biến đổi, nơi các bậc tu sĩ ngày đêm bế quan cầu trường sinh, truy tìm đại đạo vô thượng.

Trong chương "${chTitle}" của đại tác phẩm ${novelTitle}, nhân vật chính đứng trên đỉnh núi cao lộng gió, cảm nhận từng đợt thiên địa linh khí cuồn cuộn đổ dồn về huyệt khiếu khắp toàn thân. Kể từ khi bắt đầu bước chân vào tiên lộ đầy chông gai trắc trở, mỗi một bước đi đều phải trả bằng mồ hôi, máu và ý chí sắt đá kiên cường bất khuất.

— "Tu chân không chỉ là nghịch lại quy luật tuần hoàn của trời đất, mà còn là vượt lên trên chính giới hạn phàm trần của bản thân mình!" — Âm thanh trầm ấm vang vọng trong tâm thức, như tiếp thêm sức mạnh vô song cho từng thớ cơ bắp và kinh mạch đang không ngừng mở rộng.

Phía xa xôi nơi chân trời, sấm sét tím ngắt bắt đầu tụ lại thành những đám mây kiếp nạn cuồn cuộn. Đó chính là điềm báo của một cuộc biến chuyển long trời lở đất sắp sửa bắt đầu. Các vị trưởng lão của môn phái từ các động phủ xa xôi đều đồng loạt mở mắt, thần sắc kinh ngạc nhìn về hướng đạo hào quang tử kim vừa bốc lên tận tầng mây xanh biếc.

Bất kể phía trước là ma thú viễn cổ hung hãn, hay là những cạm bẫy trùng điệp do các thế lực đối địch giăng sẵn, bước chân của kẻ cầu đạo chưa từng có nửa phần chùn bước. Chân khí ngưng tụ thành kiếm quang xé toạc màn sương mù u ám, mở ra một trang sử mới đầy uy dũng trên hành trình chinh phục chín tầng trời cao thẳm.

Trải qua bao phen khổ tu rèn luyện, tâm tính càng thêm thuần tịnh vững chãi như bàn thạch. Đạo pháp tự nhiên, vạn vật giai không, chỉ có lòng kiên định với đại đạo trường tồn là mãi mãi bất diệt giữa dòng chảy vô tận của thời gian.`;
    }
  },
  'kiem-hiep': {
    chapterTitles: [
      'Thiếu Niên Xuất Sơn',
      'Quán Trọ Đêm Mưa',
      'Đoạt Mệnh Tàn Kiếm',
      'Huyết Chiến Lạc Nhạn Đỉnh',
      'Tiêu Cục Gặp Biến',
      'Tuyệt Học Thần Công',
      'Hắc Ám Âm Mưu',
      'Vạn Mã Tề Bôn',
      'Nhất Khúc Trầm Hương',
      'Tiếu Ngạo Phong Vân'
    ],
    generateChapter: (novelTitle, author, chNum, chTitle) => {
      return `Gió thu hiu hắt thổi qua rặng liễu ven bờ Trường Giang, từng đợt sóng bạc vỗ vào mạn thuyền tạo nên những thanh âm rì rào như tiếng thở dài của chốn giang hồ đầy phong ba bão táp. Rượu ngon cay nồng trong chén ngọc đã cạn, nhưng ân oán tình thù giữa các bang phái võ lâm thì nghìn năm vẫn chưa từng dứt.

Chương "${chTitle}" của hồi kiếm hiệp ${novelTitle} mở ra một hồi đối đầu nghẹt thở giữa chính và tà. Tay nắm chặt chuôi kiếm cổ xưa đã nhuốm màu sương gió, từng vết sẹo trên thân kiếm là chứng tích của biết bao trận huyết chiến kinh thiên động địa.

— "Giang hồ hiểm ác, lòng người khó lường. Rút kiếm không phải để sát sinh vô cớ, mà là để bảo vệ lẽ phải và giữ trọn tấm lòng trượng nghĩa sơ tâm!" — Câu nói hào sảng vang lên giữa quán trà ven sông, khiến cho bao tay kiếm khách xung quanh đều bất giác rùng mình cúi đầu kính phục.

Bất thình lình, tiếng phi tiêu xé gió rít lên từ trong rặng trúc rậm rạp! Ánh thép lạnh lẽo lóe lên trong đêm đen đặc quánh. Thế nhưng thân pháp của hiệp khách lại nhanh tựa sao băng lướt qua bầu trời, trường kiếm vung lên tạo thành một vầng hào quang rực rỡ gạt phăng mọi ám khí hiểm độc.

Một đường kiếm sắc bén xé tan màn đêm u tối, quét sạch lũ tà ma ngoại đạo đang lẩn khuất trong bóng tối. Con đường hành hiệp trượng nghĩa dẫu còn muôn vàn gian nan trắc trở, nhưng hào khí anh hùng và tinh thần vì nước vì dân sẽ mãi mãi lưu danh trong sử sách võ lâm muôn đời sau.`;
    }
  },
  'do-thi': {
    chapterTitles: [
      'Ánh Đèn Đêm Muộn',
      'Cơ Hội Đầu Đời',
      'Thử Thách Nơi Công Sở',
      'Bước Chân Không Mỏi',
      'Thăng Trầm Cuộc Sống',
      'Ân Tình Xứ Người',
      'Cơn Mưa Rào Tuổi Trẻ',
      'Vượt Qua Giông Bão',
      'Lựa Chọn Trưởng Thành',
      'Bình Minh Rực Rỡ'
    ],
    generateChapter: (novelTitle, author, chNum, chTitle) => {
      return `Đường phố Hà Nội và Sài Gòn những đêm tan ca luôn tấp nập những dòng xe hối hả ngược xuôi dưới ánh đèn vàng ấm áp. Mỗi ngã tư, mỗi góc quán quen đều chất chứa những ước mơ, hoài bão cháy bỏng của những người trẻ tuổi đang nỗ lực từng ngày để khẳng định giá trị bản thân giữa chốn phồn hoa đô hội.

Trong chương "${chTitle}" của cuốn truyện đô thị ${novelTitle}, câu chuyện đưa người đọc hòa mình vào nhịp đập chân thực, sâu lắng của đời sống hiện đại. Những áp lực về công việc, tài chính và sự nghiệp đôi khi khiến con người ta cảm thấy ngột ngạt, nhưng chính trong những khoảnh khắc thử thách cam go nhất, nghị lực phi thường lại bừng sáng mạnh mẽ.

— "Thành công không phải là đích đến trải đầy hoa hồng sau một đêm, mà là sự kiên trì bền bỉ bước qua từng thất bại mà không hề đánh mất niềm tin vào ngày mai!" — Lời tự nhủ giản dị nhưng chan chứa quyết tâm trước màn hình máy tính vẫn sáng rực lúc nửa đêm.

Những đồng nghiệp chân thành cùng kề vai sát cánh, những bữa cơm ấm áp sẻ chia sau giờ làm việc căng thẳng đã trở thành điểm tựa tinh thần vô giá. Không có khó khăn nào là không thể vượt qua khi con người ta biết trân trọng giá trị của sự tử tế, nỗ lực lao động chân chính và tình người ấm áp giữa cuộc đời bận rộn.

Bình minh dần ló rạng qua khung cửa sổ cao ốc, xua tan đi màn sương sớm lạnh giá. Một ngày mới lại bắt đầu với biết bao cơ hội và hy vọng mới, chắp cánh cho những ước mơ bay cao, bay xa trên con đường xây dựng sự nghiệp vững bền.`;
    }
  },
  'khoa-huyen': {
    chapterTitles: [
      'Tín Hiệu Vực Sâu',
      'Buồng Lái Không Trọng Lực',
      'Vùng Nhiễu Từ Tối Cao',
      'Bản Thiết Kế Viễn Cổ',
      'Trí Tuệ Nhân Tạo Thức Tỉnh',
      'Cổng Nhảy Không Gian',
      'Trận Chiến Vành Đai Sao',
      'Tàn Tích Nền Văn Minh',
      'Vết Nứt Lượng Tử',
      'Chân Trời Sự Kiện'
    ],
    generateChapter: (novelTitle, author, chNum, chTitle) => {
      return `Hàng tỷ vì sao lấp lánh như bụi kim cương rải rác trên tấm thảm nhung đen tuyền của vũ trụ bao la vô tận. Con tàu thám hiểm không gian lướt đi êm ái giữa các dải thiên hà xa xôi, động cơ phản vật chất phát ra những luồng ánh sáng xanh lam huyền ảo xé toạc bóng tối vĩnh hằng.

Chương "${chTitle}" của thiên sử thi khoa học viễn tưởng ${novelTitle} đưa nhân loại tiến sâu vào những bí ẩn kỳ vĩ nhất của vật lý lượng tử và không-thời gian. Các cảm biến radar tầm xa liên tục phát ra cảnh báo về những dao động sóng hấp dẫn dị thường phát ra từ một tinh hệ chưa từng được ghi nhận trên bản đồ sao.

— "Hệ thống AI trung tâm xác nhận: tọa độ không gian đang bị bẻ cong 45 độ bởi một trường lực phi tự nhiên. Đề nghị toàn đội sẵn sàng cho quá trình kích hoạt khiên chắn lượng tử cấp độ một!" — Giọng nói máy móc đều đặn vang lên từ loa chỉ huy.

Những phi hành gia dũng cảm tay siết chặt bàn điều khiển, nhịp tim đập dồn dập theo từng giây đếm ngược của cổng nhảy siêu không gian. Đằng sau những dữ liệu số học phức tạp là khát vọng ngàn đời của loài người: tìm kiếm câu trả lời cho nguồn gốc của vũ trụ và tìm kiếm những nền văn minh đồng loại giữa biển sao vô tận.

Khi cánh cổng thời không mở ra rực rỡ, một chân trời tri thức hoàn toàn mới mở ra trước mắt. Sự dũng cảm của các nhà thám hiểm đã chứng minh rằng ý chí khám phá của con người sẽ không bao giờ bị giới hạn bởi không gian hay thời gian.`;
    }
  },
  'huyen-huyen': {
    chapterTitles: [
      'Ma Pháp Cấm Thuật',
      'Khế Ước Cổ Linh',
      'Đấu Trường Băng Giá',
      'Dị Biến Rừng Tinh Tú',
      'Vương Quốc Thất Truyền',
      'Huyết Mạch Hoàng Kim',
      'Đại Trận Phong Ấn',
      'Thần Khí Xuất Thế',
      'Đêm Dài Hắc Ám',
      'Bình Minh Ma Thuật'
    ],
    generateChapter: (novelTitle, author, chNum, chTitle) => {
      return `Bầu trời lục địa huyền bí nhuốm màu tím biếc của những dòng chảy ma năng nguyên thủy, các ngọn tháp phù thủy sừng sững chọc thẳng lên mây xanh với những vòng xoáy thần chú lấp lánh ngày đêm không tắt. Thế giới ma thuật muôn màu muôn vẻ nhưng cũng đầy rẫy hiểm nguy với sự trỗi dậy của loài rồng cổ đại và bóng tối bóng quỷ.

Trong chương "${chTitle}" của tuyệt phẩm huyền huyễn ${novelTitle}, những bí mật cổ xưa bị phong ấn hàng nghìn năm dưới đáy các phế tích dần được hé lộ. Các nguyên tố đất, nước, lửa, gió và ánh sáng bắt đầu cộng hưởng mãnh liệt theo từng câu thần chú được xướng lên từ cuốn sách cổ bằng da rồng.

— "Nhân danh ngọn lửa vĩnh hằng của Thần Mặt Trời, hỡi các linh hồn cổ xưa hãy thức tỉnh để chứng kiến sự ra đời của một huyền thoại mới!" — Trượng ma pháp chạm trổ đá quý vung lên, tạo ra một cơn bão ma năng rực rỡ bao trùm cả chiến trường.

Các hiệp sĩ giáp vàng cùng những pháp sư tài ba kết thành chiến trận vững chắc, nghênh đón những đợt tấn công điên cuồng của quân đoàn bóng đêm. Tiếng gầm thét của quái thú hòa cùng tiếng hô xung trận hào hùng chấn động cả sơn hà.

Bằng lòng quả cảm và trí tuệ mẫn tiệp, nhân vật chính đã mở ra cánh cửa dẫn tới thần điện tối cao, kế thừa ngọn lửa sức mạnh của các vị thần thời thượng cổ. Lục địa một lần nữa được bao bọc trong ánh sáng hòa bình và hy vọng mới.`;
    }
  },
  'trinh-tham': {
    chapterTitles: [
      'Hiện Trường Đêm Mưa',
      'Manh Mối Đầu Tiên',
      'Bằng Chứng Ngoại Phạm',
      'Bóng Đen Bí Ẩn',
      'Mật Thất Không Lối Thoát',
      'Lời Khai Giả Tạo',
      'Sự Thật Dưới Đáy Nước',
      'Cái Bẫy Tinh Vi',
      'Đối Mặt Hung Thủ',
      'Ánh Sáng Công Lý'
    ],
    generateChapter: (novelTitle, author, chNum, chTitle) => {
      return `Màn mưa xối xả đập rát mặt kính của căn phòng cũ kỹ nơi ngoại ô thành phố, tiếng sấm ầm ì từ đằng xa như gieo rắc thêm nỗi hoang mang tột độ cho những ai có mặt tại hiện trường. Từng chi tiết nhỏ nhất — một vết bùn trên sàn gạch, một sợi chỉ vướng vào then cài cửa sổ, hay một chiếc đồng hồ bấm giờ dừng lại ở con số kỳ lạ — đều có thể là chìa khóa mở toang cánh cửa dẫn tới sự thật bị che giấu.

Chương "${chTitle}" của thiên truyện trinh thám ly kỳ ${novelTitle} đẩy nhịp độ điều tra lên cao trào kịch tính nhất. Người thám tử dày dạn kinh nghiệm cẩn thận đặt từng bức ảnh chụp hiện trường lên bàn làm việc, ánh mắt sắc sảo lướt qua từng gương mặt của những kẻ tình nghi đang cố tỏ ra bình thản.

— "Kẻ thủ ác đã tính toán rất kỹ lưỡng mọi kịch bản để tạo ra một mật thất hoàn hảo, nhưng hắn đã quên mất một điều: không có tội ác nào là hoàn toàn không để lại dấu vết trước sự phân tích khoa học và logic nghiệm ngặt!" — Giọng nói trầm tĩnh, đanh thép phá tan không khí im lặng ngột ngạt.

Từng lớp mặt nạ ngụy tạo tinh vi bắt đầu bị bóc trần không thương tiếc trước những lập luận sắc bén và chứng cứ không thể chối cãi. Động cơ thực sự phía sau chuỗi sự việc bí ẩn — những toan tính về quyền lực, tiền tài hay thù hận cá nhân — dần hiện rõ dưới ánh sáng minh bạch của công lý.

Khi chiếc còng số tám vang lên tiếng "tách" lạnh lùng, màn đêm giông bão ngoài kia cũng dần tan biến. Công lý dẫu có muộn màng nhưng luôn luôn chiến thắng bóng tối tội ác, trả lại sự bình yên và thanh thản cho những tâm hồn vô tội.`;
    }
  },
  '18-plus': {
    chapterTitles: [
      'Dạ Yến Hồng Trần',
      'Ánh Mắt Mê Hoặc',
      'Mật Thất Giai Nhân',
      'Trầm Hương Khói Mờ',
      'Ân Ái Dưới Trăng',
      'Huyết Mạch Cuồng Si',
      'Cám Dỗ Tuyệt Mỹ',
      'Phong Ba Đêm Dài',
      'Quyến Luyến Không Rời',
      'Chí Tôn Hồng Nhan'
    ],
    generateChapter: (novelTitle, author, chNum, chTitle) => {
      return `Đêm tĩnh mịch buông rèm trướng gấm, hương trầm thoang thoảng quẩn quanh trong gian phòng xa hoa lộng lẫy. Ánh nến chập chờn rọi bóng đôi hồng nhan tri kỷ, từng làn gió đêm khẽ lay động làm rung lên những thanh âm xao xuyến lòng người.

Trong chương "${chTitle}" của tuyệt phẩm diễm tình sắc hiệp ${novelTitle}, câu chuyện đưa độc giả bước vào thế giới nồng nàn của những rung cảm sâu sắc và sự gắn kết định mệnh. Vẻ đẹp kiều diễm nghiêng nước nghiêng thành cùng ánh mắt mê hoặc đã làm tan chảy cả sự lạnh lùng sắt đá của bậc tu tiên thượng thừa.

— "Nhân gian trăm năm ngắn ngủi, dẫu có đắc đạo trường sinh mà không có người cùng chia sẻ tịch mịch, thì tiên lộ này có ý nghĩa gì?" — Giọng nói ngọt ngào, dịu dàng như rót mật vào tai, từng cử chỉ mềm mại uyển chuyển khiến cho con tim không khỏi rạo rực xốn xang.

Đằng sau bức màn the lụa, những bí mật về thể chất song tu thượng cổ dần được hé lộ. Sự giao thoa của hai luồng chân khí âm dương hòa quyện tạo nên sức mạnh huyền diệu đả thông những cửa ải bế tắc nghìn năm, đưa tu vi cả hai cùng đột phá cảnh giới tột bực.

Đêm nay là một đêm dài của đam mê, của những lời hẹn thề khắc cốt ghi tâm. Tình cảm sâu nặng ấy sẽ mãi mãi là ngọn lửa ấm áp sưởi ấm con đường phong ba bão táp phía trước.`;
    }
  }
};

const BASE_PLATFORM_BOOKS = [
  {
    id: 'book_daidao',
    authorId: 'author_1',
    title: 'Đại Đạo Phong Vân Ký',
    slug: 'dai-dao-phong-van-ky',
    author: 'Tiêu Dao Tử',
    genreSlug: 'tien-hiep',
    description: 'Một câu chuyện tu tiên huyền ảo về hành trình truy tìm nguồn gốc của vũ trụ và đại đạo vô biên.'
  },
  {
    id: 'book_giongang',
    authorId: 'author_2',
    title: 'Gió Ngang Phố Cổ',
    slug: 'gio-ngang-pho-co',
    author: 'Nguyễn Nhật Ánh Tuyết',
    genreSlug: 'do-thi',
    description: 'Bức tranh đời thường sâu lắng về những con người trẻ tuổi chốn thị thành, nơi tình yêu và hoài bão đan xen.'
  },
  {
    id: 'book_tinhcaulam',
    authorId: 'author_3',
    title: 'Bí Mật Tinh Cầu Lam',
    slug: 'bi-mat-tinh-cau-lam',
    author: 'Arthur Vance',
    genreSlug: 'khoa-huyen',
    description: 'Chuyến phiêu lưu xuyên các chiều không gian giải mã tín hiệu viễn cổ từ tinh cầu xanh lam xa xôi.'
  },
  {
    id: 'book_thanhphong',
    authorId: 'author_4',
    title: 'Thanh Phong Tàn Kiếm',
    slug: 'thanh-phong-tan-kiem',
    author: 'Lạc Nhạn Cư Sĩ',
    genreSlug: 'kiem-hiep',
    description: 'Ân oán tình thù trong giang hồ hiểm ác, một thanh tàn kiếm định đoạt vận mệnh của cả võ lâm bát đại môn phái.'
  },
  {
    id: 'book_draft_giakim',
    authorId: 'author_5',
    title: 'Bản Thảo Giả Kim Thuật',
    slug: 'ban-thao-gia-kim-thuat',
    author: 'Eldrin Star',
    genreSlug: 'huyen-huyen',
    description: 'Huyền thoại về thuật giả kim thượng cổ và cuộc tìm kiếm hòn đá triết gia giữa lục địa huyền bí.'
  },
  {
    id: 'bk_mvi269d8_46625n96',
    authorId: 'auth_huyetlong',
    title: 'Huyết Long Thần Đế',
    slug: 'huyet-long-than-de',
    author: 'Hắc Ma Đạo Nhân',
    genreSlug: 'tien-hiep',
    description: 'Đế tôn chuyển thế, thức tỉnh Huyết Long huyết mạch, một bước đạp nát cửu trùng thiên!'
  },
  {
    id: 'bk_hong-nhan-tien-lo-18',
    authorId: 'auth_macsac',
    title: 'Hồng Nhan Tiên Lộ (18+)',
    slug: 'hong-nhan-tien-lo-18',
    author: 'Mặc Sắc Đạo Nhân',
    genreSlug: '18-plus',
    is_18_plus: 1,
    is_premium: 1,
    description: 'Tác phẩm sắc hiệp tu chân diễm lệ dành riêng cho lứa tuổi 18+. Âm dương song tu, hồng trần mộng ảo, vấn đỉnh thiên đạo cùng dàn tuyệt sắc giai nhân.'
  },
  {
    id: 'bk_da-sac-phon-hoa-18',
    authorId: 'auth_lieunhuyet',
    title: 'Dạ Sắc Phồn Hoa (18+)',
    slug: 'da-sac-phon-hoa-18',
    author: 'Liễu Như Yến',
    genreSlug: '18-plus',
    is_18_plus: 1,
    is_premium: 1,
    description: 'Đô thị diễm tình trưởng thành (18+). Những cám dỗ ngọt ngào, những đêm tiệc phồn hoa chốn thượng lưu và chuyện tình nồng cháy không lối thoát.'
  },
  {
    id: 'bk_ma-nu-nghin-nam-18',
    authorId: 'auth_uminh',
    title: 'Ma Nữ Nghìn Năm (18+)',
    slug: 'ma-nu-nghin-nam-18',
    author: 'U Minh Cư Sĩ',
    genreSlug: '18-plus',
    is_18_plus: 1,
    is_premium: 1,
    description: 'Huyền huyễn lãng mạn cấm kỵ 18+. Mối tình ma đạo ngàn năm giữa tiên kiếm hiệp khách và cửu vĩ thiên ma kiều mỵ.'
  }
];

const seedFilePath = path.join(process.cwd(), 'server', 'data', 'seed-novels.ts');
const rawCode = fs.readFileSync(seedFilePath, 'utf-8');

const booksMetaMatch = rawCode.match(/export const SEED_50_NOVELS: SeedNovel\[\] = (\[[\s\S]*\]);/);
if (!booksMetaMatch) {
  console.error('Could not parse SEED_50_NOVELS from seed-novels.ts');
  process.exit(1);
}

const existingNovels = eval(booksMetaMatch[1]);
const filteredNovels = existingNovels.filter(n => !BASE_PLATFORM_BOOKS.some(b => b.slug === n.slug));
const allNovelsToProcess = [...BASE_PLATFORM_BOOKS, ...filteredNovels];

console.log(`Processing total ${allNovelsToProcess.length} novels with custom professional typographic book covers.`);

const updatedNovels = allNovelsToProcess.map((novel) => {
  const genreConfig = GENRE_NARRATIVES[novel.genreSlug] || GENRE_NARRATIVES['tien-hiep'];
  const chapters = [];

  // Generate an authentic, genre-styled SVG novel cover with exact title, author, and motif
  const customCoverDataUrl = generateSvgCover(novel.title, novel.author, novel.genreSlug);

  for (let chNum = 1; chNum <= 10; chNum++) {
    const rawTitle = genreConfig.chapterTitles[chNum - 1] || `Chương ${chNum}`;
    const fullTitle = `Chương ${chNum}: ${rawTitle}`;
    
    const originalCh = novel.chapters && novel.chapters.find(c => c.num === chNum);
    let content = originalCh && originalCh.content && originalCh.content.length > 500
      ? originalCh.content
      : genreConfig.generateChapter(novel.title, novel.author, chNum, fullTitle);

    if (content.length < 1500) {
      content += "\n\n" + genreConfig.generateChapter(novel.title, novel.author, chNum, fullTitle);
    }

    chapters.push({
      num: chNum,
      title: fullTitle,
      content: content.trim()
    });
  }

  return {
    id: novel.id,
    authorId: novel.authorId,
    title: novel.title,
    slug: novel.slug,
    author: novel.author,
    genreSlug: novel.genreSlug,
    cover: customCoverDataUrl,
    description: novel.description,
    is_18_plus: novel.is_18_plus ? 1 : 0,
    is_premium: novel.is_premium ? 1 : 0,
    chapters
  };
});

const outputCode = `export interface SeedNovel {
  id?: string;
  authorId?: string;
  title: string;
  slug: string;
  author: string;
  genreSlug: string;
  cover: string;
  description: string;
  is_18_plus?: number;
  is_premium?: number;
  chapters: { num: number; title: string; content: string }[];
}

export const SEED_50_NOVELS: SeedNovel[] = ${JSON.stringify(updatedNovels, null, 2)};
`;

fs.writeFileSync(seedFilePath, outputCode, 'utf-8');
console.log(`Successfully written ${updatedNovels.length} novels with custom graphic covers and 10 chapters each to ${seedFilePath}`);
