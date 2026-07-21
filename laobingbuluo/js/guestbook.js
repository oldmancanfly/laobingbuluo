// ===== 留言板（Cloudflare Functions + 后端存储） =====
// 部署后所有人共享留言，真后端持久化

(function() {
  const API_BASE = '/api/message';
  const form = document.getElementById('guestbookForm');
  const entries = document.getElementById('guestbookEntries');

  // 加载留言列表
  async function loadMessages() {
    if (!entries) return;
    try {
      entries.innerHTML = '<p style="text-align:center;color:var(--text-light);font-size:0.9rem;">加载中...</p>';
      const res = await fetch(API_BASE + '?action=list');
      const data = await res.json();

      if (!data.success || !data.messages || data.messages.length === 0) {
        entries.innerHTML = '<p style="text-align:center;color:var(--text-light);font-size:0.9rem;">还没有留言，来写第一条吧 👆</p>';
        return;
      }

      // 按时间倒序排列
      const msgs = [...data.messages].reverse();
      entries.innerHTML = msgs.map(m => `
        <div class="guest-entry">
          <span class="name">${escapeHtml(m.name || '匿名')}</span>
          <span class="date">${formatDate(m.date)}</span>
          <p class="msg">${escapeHtml(m.message)}</p>
        </div>
      `).join('');
    } catch (err) {
      entries.innerHTML = '<p style="text-align:center;color:var(--orange);font-size:0.9rem;">⚠️ 留言加载失败，请刷新重试</p>';
      console.error('留言加载失败:', err);
    }
  }

  // 提交留言
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('gbName').value.trim();
    const message = document.getElementById('gbMessage').value.trim();
    if (!name || !message) return;

    // 禁用按钮防止重复提交
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '提交中...';

    try {
      const res = await fetch(API_BASE + '?action=add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json();

      if (data.success) {
        form.reset();
        await loadMessages();
      } else {
        alert('提交失败: ' + (data.error || '未知错误'));
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
      console.error('留言提交失败:', err);
    } finally {
      btn.disabled = false;
      btn.textContent = '发布留言';
    }
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day} ${h}:${min}`;
    } catch { return iso; }
  }

  // 页面加载时读取留言
  loadMessages();
})();
