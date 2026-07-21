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

// ===== 标签切换（关于页 + 相册筛选） =====
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

// ===== 预约表单 =====
document.getElementById('visitForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('visitName').value.trim();
  const time = document.getElementById('visitTime').value;
  const contact = document.getElementById('visitContact').value.trim();
  if (!name) return;

  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = '提交中...';

  try {
    const res = await fetch('/api/message?action=visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, time, contact }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('visitResult').style.display = 'block';
      e.target.reset();
    }
  } catch (err) {
    alert('提交失败，请稍后重试');
  } finally {
    btn.disabled = false;
    btn.textContent = '提交预约';
  }
});
