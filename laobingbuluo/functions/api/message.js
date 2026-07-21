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
    // ===== 公共接口：获取留言列表 =====
    if (request.method === 'GET' && action === 'list') {
      const messages = await getMessages(env);
      return new Response(JSON.stringify({ success: true, messages }), { headers });
    }

    // ===== 公共接口：提交预约 =====
    if (request.method === 'POST' && action === 'visit') {
      const body = await request.json();
      const { name, time, contact } = body;
      const visitMsg = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: (name || '匿名').trim().slice(0, 30),
        time: (time || '未选择').trim(),
        contact: (contact || '').trim().slice(0, 50),
        date: new Date().toISOString(),
      };
      const visits = await getKV(env, 'visits', []);
      visits.push(visitMsg);
      await saveKV(env, 'visits', visits);
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

    // ===== 管理员接口：获取预约列表 =====
    if (action === 'admin-visits') {
      const auth = request.headers.get('X-Admin-Key');
      const ADMIN_KEY = env.ADMIN_KEY || 'laobing2024';
      if (auth !== ADMIN_KEY) {
        return new Response(JSON.stringify({ success: false, error: '未授权' }), { status: 401, headers });
      }
      const visits = await getKV(env, 'visits', []);
      return new Response(JSON.stringify({ success: true, data: visits }), { headers });
    }

    // ===== 管理员接口：删除预约 =====
    if (action === 'admin-delete-visit') {
      const auth = request.headers.get('X-Admin-Key');
      const ADMIN_KEY = env.ADMIN_KEY || 'laobing2024';
      if (auth !== ADMIN_KEY) {
        return new Response(JSON.stringify({ success: false, error: '未授权' }), { status: 401, headers });
      }
      const id = url.searchParams.get('id');
      if (!id) { return new Response(JSON.stringify({ success: false, error: '缺少ID' }), { status: 400, headers }); }
      let visits = await getKV(env, 'visits', []);
      visits = visits.filter(v => v.id !== id);
      await saveKV(env, 'visits', visits);
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
