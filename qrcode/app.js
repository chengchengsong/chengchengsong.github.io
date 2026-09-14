(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const text = $('text'), canvas = $('qr');
  let transfer = null, index = 0, timer = null, playing = false, version = 0, loops = 1;
  let matrix = null;
  const formatBytes = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;
  function message(value, error = false) { $('message').textContent = value; $('message').classList.toggle('error', error); }
  function stop() { clearTimeout(timer); timer = null; playing = false; $('play').textContent = '继续播放'; if (transfer) $('state').textContent = '已暂停'; }
  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => {
      index = (index + 1) % transfer.parts.length;
      if (!index) loops++;
      render(); schedule();
    }, Number($('speed').value));
  }
  function start() {
    if (!transfer || transfer.parts.length < 2) return;
    playing = true; $('play').textContent = '暂停'; $('state').textContent = `循环播放 · 第 ${loops} 轮`; schedule();
  }
  function draw() {
    if (!matrix) return;
    const count = matrix.getModuleCount();
    const available = Math.min($('stage').clientWidth, $('stage').clientHeight) - 4;
    const scale = Math.max(1, Math.floor(available / (count + 8)));
    const size = (count + 8) * scale;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size); ctx.fillStyle = '#000';
    for (let y = 0; y < count; y++) for (let x = 0; x < count; x++) {
      if (matrix.isDark(y, x)) ctx.fillRect((x + 4) * scale, (y + 4) * scale, scale, scale);
    }
  }
  function render() {
    matrix = qrcode(0, 'M'); matrix.addData(transfer.parts[index], 'Byte'); matrix.make();
    canvas.hidden = false; $('empty').hidden = true; draw();
    $('frame').textContent = `第 ${index + 1} / ${transfer.parts.length} 片`;
    $('progress').max = transfer.parts.length; $('progress').value = index + 1;
    $('state').textContent = transfer.parts.length === 1 ? '单片 · 保持显示' : playing ? `循环播放 · 第 ${loops} 轮` : '已暂停';
    $('transfer-info').textContent = `${formatBytes(transfer.rawBytes)} 文字${transfer.compressed ? ` · 压缩至 ${formatBytes(transfer.packedBytes)}` : ''} · 每轮约 ${(transfer.parts.length * Number($('speed').value) / 1000).toFixed(1)} 秒`;
  }
  function reset() {
    version++; stop(); transfer = null; matrix = null;
    canvas.hidden = true; canvas.width = canvas.height = 0; $('empty').hidden = false;
    $('frame').textContent = '等待生成'; $('state').textContent = '尚未开始'; $('progress').value = 0;
    for (const id of ['previous', 'play', 'next', 'fullscreen']) $(id).disabled = true;
    $('play').textContent = '暂停'; $('generate').disabled = false; $('generate').textContent = '生成并播放 ↗';
    $('transfer-info').textContent = '保持二维码完整入镜；漏扫的分片会在下一轮补齐。';
  }
  text.addEventListener('input', () => {
    reset();
    const bytes = new TextEncoder().encode(text.value).length;
    $('size').textContent = `${text.value.length.toLocaleString()} 字符 · ${formatBytes(bytes)}`;
    message(bytes > OQProtocol.MAX_BYTES ? '文字超过 2 MB，请缩短后重新生成。' : '文字已更新，点击生成开始传输。', bytes > OQProtocol.MAX_BYTES);
  });
  $('clear').addEventListener('click', () => { text.value = ''; text.dispatchEvent(new Event('input')); text.focus(); });
  $('generate').addEventListener('click', async () => {
    reset(); const request = version;
    $('generate').disabled = true; message('正在生成，请稍候…');
    try {
      const next = await OQProtocol.encode(text.value);
      if (request !== version) return;
      transfer = next; index = 0; loops = 1; render();
      $('fullscreen').disabled = false;
      for (const id of ['previous', 'play', 'next']) $(id).disabled = next.parts.length < 2;
      $('generate').textContent = '重新生成 ↗';
      message('已生成。请用 OfflineQR.exe 扫描，等待接收端显示校验通过。'); start();
    } catch (error) { if (request === version) { reset(); message(error.message || '生成失败，请重试。', true); } }
    finally { if (request === version) $('generate').disabled = false; }
  });
  $('play').addEventListener('click', () => { if (playing) stop(); else start(); });
  for (const [id, step] of [['previous', -1], ['next', 1]]) $(id).addEventListener('click', () => {
    if (!transfer) return; stop(); index = (index + step + transfer.parts.length) % transfer.parts.length; render();
  });
  $('speed').addEventListener('change', () => { if (transfer) { render(); schedule(); } });
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ($('viewer').requestFullscreen) await $('viewer').requestFullscreen();
      else message('当前浏览器不支持全屏，请使用浏览器缩放或横屏显示。');
    } catch { message('无法进入全屏，请使用浏览器缩放或横屏显示。'); }
  });
  document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? '退出放大' : '放大显示'; draw(); });
  new ResizeObserver(draw).observe($('stage'));
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) { stop(); message('页面已切到后台，播放已暂停；返回后点击继续播放。'); } });
  window.addEventListener('pagehide', stop);
})();
