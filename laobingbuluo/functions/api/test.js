export async function onRequest(context) {
  return new Response(JSON.stringify({ status: 'ok', message: '函数运行正常' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
