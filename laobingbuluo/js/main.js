// ===== 老兵部落 - 主 JS =====

// 导航汉堡菜单
document.querySelector('.hamburger')?.addEventListener('click', () => {
  document.querySelector('.nav-links')?.classList.toggle('open');
});

// 导航高亮当前页
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.href === location.href || a.href === location.href.replace(/\/$/, '')) {
    a.classList.add('active');
  }
});

// ===== 标签切换 =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    const filter = btn.dataset.filter;

    if (tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');
    }

    if (filter) {
      document.querySelectorAll('.tab-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (window.filterGallery) window.filterGallery(filter);
    }
  });
});

// ===== 私信表单 =====
document.getElementById('mailForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('mailName').value.trim();
  const message = document.getElementById('mailMessage').value.trim();
  const contact = document.getElementById('mailContact').value.trim();
  if (!name || !message) return;

  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = '发送中...';

  try {
    const res = await fetch('/api/message?action=mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message, contact }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('mailResult').style.display = 'block';
      e.target.reset();
    }
  } catch (err) {
    alert('发送失败，请稍后重试');
  } finally {
    btn.disabled = false;
    btn.textContent = '发送';
  }
});

// ===== 访客统计埋点 =====
(function() {
  const today = new Date().toISOString().slice(0, 10);
  const tracked = localStorage.getItem('laobing_tracked');
  if (tracked !== today) {
    localStorage.setItem('laobing_tracked', today);
    navigator.sendBeacon('/api/message?action=track',
      JSON.stringify({ path: location.pathname || '/' })
    );
  }
})();
