// ===== 涂鸦画板 =====

const canvas = document.getElementById('graffitiCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let lastX = 0, lastY = 0;
  let undoStack = [];

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = Math.min(800, rect.width - 20);
    canvas.width = w;
    canvas.height = 500;

    // 恢复最后的状态
    if (undoStack.length > 0) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = undoStack[undoStack.length - 1];
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function saveState() {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 30) undoStack.shift();
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    saveState();
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = document.getElementById('penColor').value;
    ctx.lineWidth = document.getElementById('penWidth').value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  }

  function stopDrawing() {
    isDrawing = false;
  }

  // 鼠标事件
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  // 触屏事件
  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);

  // 清空
  document.getElementById('clearCanvas').addEventListener('click', () => {
    if (!confirm('确定清空画板吗？')) return;
    undoStack = [];
    saveState();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  // 撤销
  document.getElementById('undoCanvas').addEventListener('click', () => {
    if (undoStack.length <= 1) return;
    undoStack.pop();
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = undoStack[undoStack.length - 1];
  });

  // 保存
  document.getElementById('saveCanvas').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `老兵部落_涂鸦_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });

  resizeCanvas();
  saveState();
  window.addEventListener('resize', resizeCanvas);
}
