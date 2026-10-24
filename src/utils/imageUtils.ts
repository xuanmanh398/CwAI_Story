/**
 * Nén và chuyển đổi ảnh sang Base64 Data URL tối ưu cho ảnh bìa sách
 */
export async function processCoverImage(file: File, maxWidth = 600, maxHeight = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Tính tỉ lệ thu phóng giữ nguyên aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Vẽ ảnh lên canvas chất lượng cao
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất ra JPEG chất lượng 85% để kích thước nhỏ gọn (~30-60KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể tải file ảnh'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Không thể đọc file từ thiết bị'));
    reader.readAsDataURL(file);
  });
}

/**
 * Tự động tạo ảnh bìa sách nghệ thuật (Artwork Cover Generator) chuẩn tỷ lệ 3:4
 */
export function generateArtisticCoverCanvas(
  title: string,
  author: string,
  theme: 'tienhiep' | 'kiemhiep' | 'dothi' | 'khoahuyen' | 'huyenhuyen' | 'trinhtham' | '18plus' = 'tienhiep'
): string {
  const width = 600;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Phối màu nền theo chủ đề
  const gradients: Record<string, [string, string, string]> = {
    tienhiep: ['#0f172a', '#312e81', '#1e1b4b'],
    kiemhiep: ['#0c0a09', '#7f1d1d', '#1c1917'],
    dothi: ['#0f172a', '#064e3b', '#042f2e'],
    khoahuyen: ['#020617', '#0369a1', '#082f49'],
    huyenhuyen: ['#1c1917', '#78350f', '#451a03'],
    trinhtham: ['#18181b', '#3f3f46', '#09090b'],
    '18plus': ['#180816', '#831843', '#4c0519'],
  };

  const colors = gradients[theme] || gradients.tienhiep;
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.5, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Họa tiết hình học & ánh sáng viền
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, width - 60, height - 60);
  ctx.strokeRect(38, 38, width - 76, height - 76);

  // Vòng tròn hào quang trung tâm
  const radial = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 320);
  radial.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  radial.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = radial;
  ctx.fillRect(40, 40, width - 80, height - 80);
  ctx.restore();

  // 3. Nhãn phía trên
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('TRUYỆN NHÀ • TUYỂN CHỌN', width / 2, 100);
  ctx.restore();

  // 4. Tiêu đề tác phẩm
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;

  const displayTitle = (title.trim() || 'Tuyệt Phẩm Truyện').toUpperCase();
  // Tự động ngắt dòng nếu tiêu đề dài
  ctx.font = 'bold 36px "Segoe UI", Roboto, Georgia, serif';
  const words = displayTitle.split(' ');
  let line = '';
  const lines: string[] = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width - 120 && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const startY = height / 2 - (lines.length * 24);
  lines.forEach((l, idx) => {
    ctx.fillText(l.trim(), width / 2, startY + (idx * 48));
  });
  ctx.restore();

  // 5. Đường kẻ trang trí vàng kim
  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 80, height / 2 + (lines.length * 24) + 20);
  ctx.lineTo(width / 2 + 80, height / 2 + (lines.length * 24) + 20);
  ctx.stroke();
  ctx.restore();

  // 6. Tên tác giả
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'italic 500 20px "Segoe UI", serif';
  ctx.fillText(`Tác giả: ${author.trim() || 'Vô Danh'}`, width / 2, height - 120);

  // 7. Huy hiệu thể loại
  if (theme === '18plus') {
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('🔞 NỘI DUNG 18+ GIỚI HẠN', width / 2, height - 85);
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('BẢN QUYỀN XUẤT BẢN ĐỘC QUYỀN', width / 2, height - 85);
  }
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.88);
}
