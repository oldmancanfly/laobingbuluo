// ===== 相册 - 用占位图展示，你后续替换 =====

const photos = [
  { title: '小院正门', cat: 'yard', color: '#2d5a27' },
  { title: '院子的角落', cat: 'yard', color: '#4a7c3f' },
  { title: '院子里喝茶', cat: 'yard', color: '#6b9e5e' },
  { title: '小菜园', cat: 'yard', color: '#c9783b' },
  { title: '院子里吃饭', cat: 'food', color: '#8b2500' },
  { title: '一桌家常菜', cat: 'food', color: '#5c3d2e' },
  { title: '老兵在厨房', cat: 'food', color: '#8b2500' },
  { title: '小院一角', cat: 'view', color: '#6b9e5e' },
  { title: '院子里的花', cat: 'view', color: '#c9783b' },
  { title: '门口的路', cat: 'view', color: '#2d5a27' },
  { title: '晚上的院子', cat: 'view', color: '#8b8b8b' },
  { title: '老兵和他的狗', cat: 'yard', color: '#5c3d2e' },
];

const grid = document.getElementById('galleryGrid');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

let currentFilter = 'all';

function renderGallery(filter) {
  if (!grid) return;
  grid.innerHTML = '';
  const filtered = filter === 'all' ? photos : photos.filter(p => p.cat === filter);

  filtered.forEach((photo, i) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.dataset.cat = photo.cat;

    // 生成带文字的花色占位
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // 渐变背景
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, photo.color);
    grad.addColorStop(1, lightenColor(photo.color, 30));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // 装饰纹理
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let r = 0; r < 10; r++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 400, Math.random() * 300, Math.random() * 60 + 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 图标
    const icons = { yard: '🏡', food: '🍳', view: '⛰️' };
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(icons[photo.cat] || '📷', 200, 120);

    // 文字
    ctx.font = 'bold 20px "华文楷体","KaiTi",serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(photo.title, 200, 200);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('点击替换为照片', 200, 240);

    div.innerHTML = `<img src="${canvas.toDataURL()}" alt="${photo.title}" loading="lazy">`;
    div.title = photo.title;

    div.addEventListener('click', () => {
      // 打开灯箱，显示占位信息
      lightboxImg.src = canvas.toDataURL();
      lightboxImg.alt = photo.title;
      lightbox.classList.add('open');
    });

    grid.appendChild(div);
  });
}

function lightenColor(hex, amt) {
  let r = parseInt(hex.slice(1,3), 16);
  let g = parseInt(hex.slice(3,5), 16);
  let b = parseInt(hex.slice(5,7), 16);
  r = Math.min(255, r + amt);
  g = Math.min(255, g + amt);
  b = Math.min(255, b + amt);
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

window.filterGallery = (filter) => {
  currentFilter = filter;
  renderGallery(filter);
};

lightboxClose?.addEventListener('click', () => {
  lightbox.classList.remove('open');
});

lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.remove('open');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') lightbox?.classList.remove('open');
});

renderGallery('all');
