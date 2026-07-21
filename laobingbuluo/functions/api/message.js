// Cloudflare Pages Functions — 留言板 + 管理后台 API
export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'list';

  try {
    const ip = request.headers.get('CF-Connecting-IP') || '未知';
    const ua = (request.headers.get('User-Agent') || '未知').slice(0, 200);
    const country = request.headers.get('CF-IPCountry') || '';

    // ===== 访客统计埋点 =====
    if (action === 'track') {
      const body = await request.json().catch(() => ({}));
      const visit = {
        ip, ua, country,
        path: body.path || '/',
        date: new Date().toISOString(),
      };
      const visits = await getKV(env, 'tracking', []);
      visits.push(visit);
      // KV 有 25MB 上限，留最近 50000 条
      if (visits.length > 50000) visits.splice(0, visits.length - 50000);
      await saveKV(env, 'tracking', visits);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ===== 管理员接口：获取统计数据 =====
    if (action === 'admin-stats') {
      const auth = request.headers.get('X-Admin-Key');
      const ADMIN_KEY = env.ADMIN_KEY || 'laobing2024';
      if (auth !== ADMIN_KEY) {
        return new Response(JSON.stringify({ success: false, error: '未授权' }), { status: 401, headers });
      }
      const visits = await getKV(env, 'tracking', []);
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      // 今日独立 IP
      const todayVisits = visits.filter(v => v.date?.slice(0, 10) === todayStr);
      const todayIps = new Set(todayVisits.map(v => v.ip));
      const totalIps = new Set(visits.map(v => v.ip));

      // 按国家（地区）统计
      const countryCount = {};
      visits.forEach(v => {
        const c = v.country || '未知';
        countryCount[c] = (countryCount[c] || 0) + 1;
      });
      const topCountries = Object.entries(countryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([code, count]) => ({ code, count }));

      // 按页面统计
      const pageCount = {};
      visits.forEach(v => {
        const p = v.path || '/';
        pageCount[p] = (pageCount[p] || 0) + 1;
      });
      const topPages = Object.entries(pageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }));

      // 近 7 天趋势
      const dayStats = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        const dayVisits = visits.filter(v => v.date?.slice(0, 10) === ds);
        const dayIps = new Set(dayVisits.map(v => v.ip));
        dayStats.push({ date: ds, pv: dayVisits.length, uv: dayIps.size });
      }

      // 浏览器/设备统计
      const browserCount = {};
      visits.forEach(v => {
        const u = v.ua || '';
        let name = '未知';
        if (u.includes('Chrome/') && !u.includes('Edg/')) name = 'Chrome';
        else if (u.includes('Firefox/')) name = 'Firefox';
        else if (u.includes('Safari/') && !u.includes('Chrome/')) name = 'Safari';
        else if (u.includes('Edg/')) name = 'Edge';
        else if (u.includes('MSIE') || u.includes('Trident/')) name = 'IE';
        else if (u.includes('Mobile')) name = '手机端';
        browserCount[name] = (browserCount[name] || 0) + 1;
      });
      const topBrowsers = Object.entries(browserCount)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

      return new Response(JSON.stringify({
        success: true,
        stats: {
          totalPv: visits.length,
          totalUv: totalIps.size,
          todayPv: todayVisits.length,
          todayUv: todayIps.size,
          topCountries,
          topPages,
          dayStats,
          topBrowsers,
        }
      }), { headers });
    }

    // ===== 公共接口：获取留言列表 =====
    if (request.method === 'GET' && action === 'list') {
      const messages = await getMessages(env);
      return new Response(JSON.stringify({ success: true, messages }), { headers });
    }

    // ===== 公共接口：私信老兵 =====
    if (request.method === 'POST' && action === 'mail') {
      const body = await request.json();
      const { name, message, contact } = body;
      const mail = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: (name || '匿名').trim().slice(0, 30),
        message: (message || '').trim().slice(0, 1000),
        contact: (contact || '').trim().slice(0, 100),
        ip, ua,
        date: new Date().toISOString(),
      };
      const mails = await getKV(env, 'mails', []);
      mails.push(mail);
      await saveKV(env, 'mails', mails);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ===== 公共接口：提交留言 =====
    if (request.method === 'POST' && action === 'add') {
      const body = await request.json();
      const { name, message } = body;

      if (!name || !message || name.trim().length === 0 || message.trim().length === 0) {
        return new Response(JSON.stringify({ success: false, error: '姓名和留言不能为空' }), {
          status: 400, headers,
        });
      }

      const newMsg = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name.trim().slice(0, 30),
        message: message.trim().slice(0, 500),
        ip, ua,
        date: new Date().toISOString(),
      };

      await addMessage(env, newMsg);
      return new Response(JSON.stringify({ success: true, message: newMsg }), { headers });
    }

    // ===== 管理员接口：验证密码 =====
    if (action === 'admin-login') {
      const auth = request.headers.get('X-Admin-Key');
      const ADMIN_KEY = env.ADMIN_KEY || 'laobing2024';
      if (auth !== ADMIN_KEY) {
        return new Response(JSON.stringify({ success: false, error: '密码错误' }), {
          status: 401, headers,
        });
      }
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ===== 管理员接口：获取私信列表 =====
    if (action === 'admin-mails') {
      const auth = request.headers.get('X-Admin-Key');
      const ADMIN_KEY = env.ADMIN_KEY || 'laobing2024';
      if (auth !== ADMIN_KEY) {
        return new Response(JSON.stringify({ success: false, error: '未授权' }), { status: 401, headers });
      }
      const mails = await getKV(env, 'mails', []);
      return new Response(JSON.stringify({ success: true, data: mails }), { headers });
    }

    // ===== 管理员接口：删除私信 =====
    if (action === 'admin-delete-mail') {
      const auth = request.headers.get('X-Admin-Key');
      const ADMIN_KEY = env.ADMIN_KEY || 'laobing2024';
      if (auth !== ADMIN_KEY) {
        return new Response(JSON.stringify({ success: false, error: '未授权' }), { status: 401, headers });
      }
      const id = url.searchParams.get('id');
      if (!id) { return new Response(JSON.stringify({ success: false, error: '缺少ID' }), { status: 400, headers }); }
      let mails = await getKV(env, 'mails', []);
      mails = mails.filter(m => m.id !== id);
      await saveKV(env, 'mails', mails);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ===== 管理员接口：获取全部留言 =====
    if (action === 'admin-messages') {
      const auth = request.headers.get('X-Admin-Key');
      const ADMIN_KEY = env.ADMIN_KEY || 'laobing2024';
      if (auth !== ADMIN_KEY) {
        return new Response(JSON.stringify({ success: false, error: '未授权' }), {
          status: 401, headers,
        });
      }
      const messages = await getMessages(env);
      return new Response(JSON.stringify({ success: true, data: messages }), { headers });
    }

    // ===== 管理员接口：删除留言 =====
    if (action === 'admin-delete') {
      const auth = request.headers.get('X-Admin-Key');
      const ADMIN_KEY = env.ADMIN_KEY || 'laobing2024';
      if (auth !== ADMIN_KEY) {
        return new Response(JSON.stringify({ success: false, error: '未授权' }), {
          status: 401, headers,
        });
      }
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ success: false, error: '缺少ID' }), { status: 400, headers });
      }
      let messages = await getMessages(env);
      messages = messages.filter(m => m.id !== id);
      await saveMessages(env, messages);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ success: false, error: '未知操作' }), { status: 400, headers });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: '服务器错误: ' + err.message }), {
      status: 500, headers,
    });
  }
}

async function getMessages(env) {
  return getKV(env, 'guestbook', []);
}

async function addMessage(env, msg) {
  const messages = await getKV(env, 'guestbook', []);
  messages.push(msg);
  await saveKV(env, 'guestbook', messages);
}

async function saveMessages(env, messages) {
  await saveKV(env, 'guestbook', messages);
}

async function getKV(env, key, defaultVal) {
  if (env?.MESSAGES_KV) {
    const raw = await env.MESSAGES_KV.get(key, 'json');
    return raw ?? defaultVal;
  }
  return defaultVal;
}

async function saveKV(env, key, val) {
  if (env?.MESSAGES_KV) {
    await env.MESSAGES_KV.put(key, JSON.stringify(val));
  }
}
