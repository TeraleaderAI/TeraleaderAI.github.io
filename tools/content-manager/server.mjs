// 로컬 브라우저에서 제품 데이터를 편집하는 관리 도구
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(toolDir, '..', '..');
const productsFile = path.join(rootDir, 'data', 'products.json');
const host = '127.0.0.1';
const port = Number(process.env.PORT || 5081);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    if (req.method === 'GET' && url.pathname === '/') return sendHtml(res, renderApp());
    if (req.method === 'GET' && url.pathname === '/api/products') return sendJson(res, readProducts());
    if (req.method === 'POST' && url.pathname === '/api/products') {
      const products = await readBody(req);
      writeProducts(products);
      return sendJson(res, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/build') {
      const result = await runBuild();
      return sendJson(res, result, result.code === 0 ? 200 : 500);
    }
    sendText(res, 'Not found', 404);
  } catch (error) {
    sendJson(res, { ok: false, error: error.message }, 500);
  }
});

server.listen(port, host, () => {
  console.log(`TeraLeader content manager: http://${host}:${port}/`);
});

function readProducts() {
  return JSON.parse(fs.readFileSync(productsFile, 'utf8').replace(/^\uFEFF/, ''));
}

function writeProducts(products) {
  if (!Array.isArray(products)) throw new Error('products must be an array');
  for (const product of products) {
    if (!product.id || !product.name) throw new Error('Every product needs id and name');
  }
  fs.writeFileSync(productsFile, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function runBuild() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(toolDir, 'build-static.mjs')], {
      cwd: rootDir,
      windowsHide: true
    });
    let output = '';
    child.stdout.on('data', (data) => output += data.toString());
    child.stderr.on('data', (data) => output += data.toString());
    child.on('close', (code) => resolve({ ok: code === 0, code, output }));
  });
}

function sendJson(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function sendHtml(res, body) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function sendText(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function renderApp() {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TeraLeader Content Manager</title>
  <style>
    :root { color-scheme: light; font-family: "Segoe UI", "Malgun Gothic", sans-serif; color: #1f2933; background: #f5f7fa; }
    body { margin: 0; }
    header { position: sticky; top: 0; z-index: 2; display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #d8dee6; background: #ffffff; }
    h1 { margin: 0; font-size: 20px; }
    main { display: grid; grid-template-columns: minmax(260px, 360px) 1fr; min-height: calc(100vh - 61px); }
    aside { border-right: 1px solid #d8dee6; background: #ffffff; overflow: auto; }
    section { padding: 20px; }
    button, input, textarea { font: inherit; }
    button { border: 1px solid #b8c2cc; border-radius: 6px; background: #ffffff; padding: 9px 12px; cursor: pointer; }
    button.primary { border-color: #123c69; background: #123c69; color: #ffffff; }
    button.danger { border-color: #b42318; color: #b42318; }
    .toolbar { display: flex; gap: 8px; flex-wrap: wrap; }
    .list { display: grid; gap: 6px; padding: 12px; }
    .item { text-align: left; border-radius: 6px; }
    .item[data-active="true"] { border-color: #123c69; background: #e8f1fb; }
    .item small { display: block; color: #667085; margin-top: 4px; }
    form { display: grid; gap: 14px; max-width: 980px; }
    label { display: grid; gap: 6px; font-weight: 700; }
    input, textarea { border: 1px solid #c7d0da; border-radius: 6px; padding: 10px; background: #ffffff; }
    textarea { min-height: 76px; resize: vertical; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .full { grid-column: 1 / -1; }
    .hint { color: #667085; font-size: 13px; font-weight: 400; }
    .status { white-space: pre-wrap; color: #344054; }
    @media (max-width: 820px) { main { grid-template-columns: 1fr; } aside { border-right: 0; border-bottom: 1px solid #d8dee6; } .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>TeraLeader Content Manager</h1>
    <div class="toolbar">
      <button id="add">제품 추가</button>
      <button id="save" class="primary">저장</button>
      <button id="build">정적 페이지 생성</button>
    </div>
  </header>
  <main>
    <aside><div id="list" class="list"></div></aside>
    <section>
      <form id="form"></form>
      <p id="status" class="status"></p>
    </section>
  </main>
  <script>
    let products = [];
    let current = 0;
    const list = document.querySelector('#list');
    const form = document.querySelector('#form');
    const status = document.querySelector('#status');

    const fields = [
      ['id', 'URL ID', 'cell-jig'],
      ['name', '제품명', 'CELL JIG'],
      ['subtitle', '부제', 'Evaluate a new material'],
      ['category', '분류', 'Cell fixture'],
      ['summary', '요약', '목록과 헤더에 표시됩니다.'],
      ['description', '상세 설명', '제품 상세 페이지 본문입니다.'],
      ['image', '상세 이미지 경로', '/images/products/cell-jig-clean.png'],
      ['cardImage', '카드 이미지 경로', '/images/products/cell-jig-card.gif'],
      ['inquirySubject', '문의 메일 제목', '[TeraLeader] 제품 문의']
    ];

    load();

    async function load() {
      products = await fetch('/api/products').then((res) => res.json());
      current = 0;
      renderList();
      renderForm();
    }

    function renderList() {
      list.innerHTML = products.map((product, index) => '<button class="item" data-index="' + index + '" data-active="' + (index === current) + '"><strong>' + escapeHtml(product.name || product.id) + '</strong><small>' + escapeHtml(product.visible ? '공개' : '숨김') + ' · order ' + escapeHtml(product.order || '') + '</small></button>').join('');
      list.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => {
          syncForm();
          current = Number(button.dataset.index);
          renderList();
          renderForm();
        });
      });
    }

    function renderForm() {
      const product = products[current];
      if (!product) {
        form.innerHTML = '<p>제품을 추가해 주세요.</p>';
        return;
      }
      form.innerHTML = '<div class="grid">' +
        '<label>공개 여부<select name="visible"><option value="true">공개</option><option value="false">숨김</option></select></label>' +
        '<label>정렬 순서<input name="order" type="number" value="' + escapeAttr(product.order || 0) + '"></label>' +
        fields.map(([key, label, placeholder]) => '<label class="' + (key === 'summary' || key === 'description' ? 'full' : '') + '">' + label + fieldInput(key, product[key], placeholder) + '</label>').join('') +
        '<label class="full">태그<span class="hint">한 줄에 하나씩 입력합니다.</span><textarea name="tags">' + escapeHtml((product.tags || []).join('\\n')) + '</textarea></label>' +
        '<label class="full">특징<span class="hint">한 줄에 하나씩 입력합니다.</span><textarea name="features">' + escapeHtml((product.features || []).join('\\n')) + '</textarea></label>' +
        '<label class="full">사양<span class="hint">이름 | 값 형식으로 한 줄에 하나씩 입력합니다.</span><textarea name="specs">' + escapeHtml((product.specs || []).map((item) => item.name + ' | ' + item.value).join('\\n')) + '</textarea></label>' +
        '<label class="full">다운로드<span class="hint">버튼명 | 파일경로 형식으로 한 줄에 하나씩 입력합니다.</span><textarea name="downloads">' + escapeHtml((product.downloads || []).map((item) => item.label + ' | ' + item.file).join('\\n')) + '</textarea></label>' +
        '</div><div class="toolbar"><button type="button" id="hide">공개 전환</button><button type="button" id="remove" class="danger">제품 삭제</button></div>';
      form.elements.visible.value = String(Boolean(product.visible));
      form.querySelector('#hide').addEventListener('click', () => {
        product.visible = !product.visible;
        renderList();
        renderForm();
      });
      form.querySelector('#remove').addEventListener('click', () => {
        if (!confirm('현재 제품을 삭제할까요?')) return;
        products.splice(current, 1);
        current = Math.max(0, current - 1);
        renderList();
        renderForm();
      });
    }

    function fieldInput(key, value, placeholder) {
      const text = escapeHtml(value || '');
      if (key === 'summary' || key === 'description') return '<textarea name="' + key + '" placeholder="' + escapeAttr(placeholder) + '">' + text + '</textarea>';
      return '<input name="' + key + '" value="' + escapeAttr(value || '') + '" placeholder="' + escapeAttr(placeholder) + '">';
    }

    function syncForm() {
      const product = products[current];
      if (!product || !form.elements.id) return;
      product.visible = form.elements.visible.value === 'true';
      product.order = Number(form.elements.order.value || 0);
      for (const [key] of fields) product[key] = form.elements[key].value.trim();
      product.status = product.visible ? 'active' : 'hidden';
      product.tags = lines(form.elements.tags.value);
      product.features = lines(form.elements.features.value);
      product.specs = pairs(form.elements.specs.value, 'name', 'value');
      product.downloads = pairs(form.elements.downloads.value, 'label', 'file');
    }

    document.querySelector('#add').addEventListener('click', () => {
      syncForm();
      products.push({ id: 'new-product-' + Date.now(), visible: false, status: 'hidden', order: products.length + 1, name: 'NEW PRODUCT', subtitle: '', category: '', tags: [], inquirySubject: '[TeraLeader] 제품 문의', summary: '', description: '', image: '', cardImage: '', features: [], specs: [], downloads: [] });
      current = products.length - 1;
      renderList();
      renderForm();
    });

    document.querySelector('#save').addEventListener('click', async () => {
      syncForm();
      products.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(products) });
      status.textContent = '저장했습니다.';
      await load();
    });

    document.querySelector('#build').addEventListener('click', async () => {
      syncForm();
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(products) });
      status.textContent = '정적 페이지를 생성하는 중입니다.';
      const result = await fetch('/api/build', { method: 'POST' }).then((res) => res.json());
      status.textContent = result.output || (result.ok ? '생성했습니다.' : '생성에 실패했습니다.');
    });

    function lines(value) {
      return value.split('\\n').map((line) => line.trim()).filter(Boolean);
    }

    function pairs(value, first, second) {
      return lines(value).map((line) => {
        const parts = line.split('|').map((part) => part.trim());
        return { [first]: parts[0] || '', [second]: parts.slice(1).join(' | ') || '' };
      }).filter((item) => item[first] || item[second]);
    }

    function escapeHtml(value) {
      return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
    }

    function escapeAttr(value) {
      return escapeHtml(value).replaceAll("'", '&#39;');
    }
  </script>
</body>
</html>`;
}
