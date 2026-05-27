// 제품과 회사 데이터에서 GitHub Pages용 정적 HTML을 생성하는 스크립트
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(toolDir, '..', '..');
const dataDir = path.join(rootDir, 'data');
const productsDir = path.join(rootDir, 'products');
const siteUrl = 'https://teraleaderai.github.io';

const products = readJson('products.json')
  .filter((product) => product.visible)
  .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
const company = readJson('company.json');
const notices = readJson('notices.json');

fs.mkdirSync(productsDir, { recursive: true });
for (const product of products) {
  fs.mkdirSync(path.join(productsDir, product.id), { recursive: true });
}

writeRoot('index.html', renderHome());
writeRoot('company/index.html', renderCompany());
writeRoot('technology/index.html', renderTechnology());
writeRoot('products/index.html', renderProductsIndex());
for (const product of products) {
  writeRoot(`products/${product.id}/index.html`, renderProductDetail(product));
}
writeRoot('sitemap.xml', renderSitemap());

console.log(`Generated ${products.length} products and company pages.`);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8').replace(/^\uFEFF/, ''));
}

function writeRoot(relativePath, content) {
  const target = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${content}\n`, 'utf8');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function attr(value) {
  return escapeHtml(value);
}

function pageShell({ title, description, current = '', body }) {
  const pageTitle = title === 'TeraLeader' ? `TeraLeader | ${company.tagline}` : `${title} | TeraLeader`;
  return `<!DOCTYPE html><html lang="ko"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="${attr(description || company.summary)}"><meta property="og:type" content="website"><meta property="og:title" content="${attr(pageTitle)}"><meta property="og:description" content="${attr(description || company.summary)}"><meta property="og:image" content="/images/main/hero-products.jpg"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><title>${escapeHtml(pageTitle)}</title><link rel="stylesheet" href="/_astro/company.CugoV6zA.css"></head> <body>${header(current)}${body}${footer()}${navScript()}</body> </html>`;
}

function header(current) {
  const items = [
    ['/', '홈', 'home'],
    ['/company/', '회사소개', 'company'],
    ['/products/', '제품안내', 'products'],
    ['/technology/', '기술정보', 'technology'],
    ['/support/', '문의/A/S', 'support']
  ];
  const nav = items.map(([href, label, key]) => `<li> <a href="${href === '/' ? '/index.html' : href}"${current === key ? ' aria-current="page"' : ''}>${label}</a> </li>`).join('');
  return `<header class="site-header"> <div class="container header-inner"> <a class="logo" href="/index.html" aria-label="TeraLeader home"> <img src="/images/common/logo.gif" alt="TeraLeader" width="151" height="42"> </a> <button class="nav-toggle" type="button" aria-label="메뉴 열기" aria-controls="main-nav" aria-expanded="false">≡</button> <nav id="main-nav" class="main-nav" data-open="false" aria-label="주요 메뉴"> <ul>${nav}</ul> </nav> </div> </header>`;
}

function footer() {
  return `<footer class="site-footer"> <div class="container footer-inner"> <img src="/images/common/footer-logo.gif" alt="TeraLeader" width="132"> <div class="footer-info"> <p><strong>${escapeHtml(company.legalName)}</strong></p> <p>${escapeHtml(company.address)}</p> <p>Tel. ${escapeHtml(company.tel)} | Fax. ${escapeHtml(company.fax)} | Email. <a href="mailto:${attr(company.email)}">${escapeHtml(company.email)}</a></p> <p>${escapeHtml(company.copyright)}</p> </div> </div> </footer>`;
}

function navScript() {
  return `<script type="module">const e=document.querySelector(".nav-toggle"),n=document.querySelector("#main-nav");e?.addEventListener("click",()=>{const t=n?.getAttribute("data-open")!=="true";n?.setAttribute("data-open",String(t)),e.setAttribute("aria-expanded",String(t))});</script>`;
}

function productCard(product, index) {
  const tags = (product.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  return `<article class="product-card"> <img class="product-card__image" src="${attr(product.cardImage || product.image)}" alt="${attr(product.name)} 제품 이미지" loading="lazy"> <div class="product-card__body"> <div class="product-card__topline"> <p class="product-card__meta">${escapeHtml(product.category)}</p> <span class="product-card__order">${String(index + 1).padStart(2, '0')}</span> </div> <h3>${escapeHtml(product.name)}</h3> <p class="product-card__subtitle">${escapeHtml(product.subtitle)}</p> <p>${escapeHtml(product.summary)}</p> <div class="tag-list" aria-label="${attr(product.name)} 태그">${tags}</div> <a class="btn btn-secondary" href="/products/${attr(product.id)}/">상세 보기</a> </div> </article>`;
}

function renderHome() {
  const cards = products.map(productCard).join('');
  const noticeCards = notices.map((notice) => `<a class="notice-card" href="/notices/${attr(notice.id)}/"> <time datetime="${attr(notice.date)}">${escapeHtml(notice.date)}</time> <strong>${escapeHtml(notice.title)}</strong> </a>`).join('');
  return pageShell({
    title: 'TeraLeader',
    description: company.summary,
    current: 'home',
    body: `<main> <section class="hero"> <div class="container hero-inner"> <div class="hero-copy"> <p class="eyebrow">TeraLeader Corporation</p> <h1>TeraLeader</h1> <p>${escapeHtml(company.tagline)}</p> <p>${escapeHtml(company.summary)}</p> <div class="hero-actions"> <a class="btn btn-primary" href="/products/">제품 보기</a> <a class="btn btn-secondary" href="/support/">문의/A/S</a> </div> <div class="hero-facts" aria-label="회사 주요 정보"> <div class="hero-fact"> <strong>${products.length}</strong> <span>공개 제품군</span> </div> <div class="hero-fact"> <strong>R&amp;D</strong> <span>연구 장비 설계 제작</span> </div> <div class="hero-fact"> <strong>메일</strong> <span>제품 문의와 A/S 접수</span> </div> </div> </div> <div class="hero-media"> <img src="/images/main/hero-products.jpg" alt="TeraLeader 대표 제품 이미지"> </div> </div> </section> <section class="section"> <div class="container"> <div class="section-header"> <div> <h2 class="section-title">대표 제품</h2> <p class="section-desc">배터리 소재 평가, 온도 제어, 압력 제어, 열분석 실험을 위한 연구 장비입니다.</p> </div> <a class="btn btn-secondary" href="/products/">전체 제품</a> </div> <div class="grid product-grid">${cards}</div> </div> </section> <section class="section" style="padding-top:0;"> <div class="container grid info-grid"> <article class="info-panel"> <div class="panel-heading"> <h3>공지사항</h3> <a href="/notices/">전체 보기</a> </div> <div class="notice-list">${noticeCards}</div> </article> <article class="info-panel"> <h3>회사소개</h3> <p>${escapeHtml(company.summary)}</p> <a class="btn btn-secondary" href="/company/">자세히</a> </article> <article class="info-panel"> <h3>제품 안내</h3> <p>제품 사양, 다운로드 자료, A/S 문의는 제품 상세와 문의 페이지에서 확인할 수 있습니다.</p> <a class="btn btn-secondary" href="/products/">제품 보기</a> </article> </div> </section> <section class="section contact-band"> <div class="container section-header"> <div> <h2 class="section-title">제품 문의와 A/S 접수</h2> <p class="section-desc">전화 또는 이메일로 문의해 주세요. 제품명, 증상, 연락처를 함께 남겨주시면 빠르게 확인하겠습니다.</p> </div> <a class="btn btn-primary" href="mailto:${attr(company.email)}">이메일 문의</a> </div> </section> </main>`
  });
}

function renderCompany() {
  const businessAreas = (company.businessAreas || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const historyCards = (company.history || []).map((entry) => `<article class="detail-card"> <h3>${escapeHtml(entry.year)}</h3> <ul>${(entry.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul> </article>`).join('');
  return pageShell({
    title: '회사소개',
    description: company.summary,
    current: 'company',
    body: `<main> <section class="page-hero"> <div class="container"> <p class="eyebrow">About Us</p> <h1>회사소개</h1> <p>${escapeHtml(company.summary)}</p> </div> </section> <section class="section"> <div class="container grid info-grid"> <article class="info-panel"> <h3>사업영역</h3> <ul>${businessAreas}</ul> </article> <article class="info-panel"> <h3>연락처</h3> <p>${escapeHtml(company.address)}</p> <p>Tel. ${escapeHtml(company.tel)}<br>Fax. ${escapeHtml(company.fax)}<br>Email. <a href="mailto:${attr(company.email)}">${escapeHtml(company.email)}</a></p> </article> <article class="info-panel"> <h3>운영 방향</h3> <p>제품 문의와 A/S 접수는 이메일과 전화로 통합해 빠르게 확인할 수 있도록 운영합니다.</p> </article> </div> </section> <section class="section" style="padding-top:0;"> <div class="container"> <div class="section-header"> <div> <h2 class="section-title">연혁</h2> <p class="section-desc">회사 주요 이력과 기술 개발 내역입니다.</p> </div> </div> <div class="grid">${historyCards}</div> </div> </section> </main>`
  });
}

function renderTechnology() {
  const technologyCards = (company.technologies || []).map((item) => `<article class="detail-card"> <h3>${escapeHtml(item)}</h3> <p>테라리더의 연구 장비 설계와 제작 경험을 기반으로 제품과 실험 환경에 적용됩니다.</p> </article>`).join('');
  return pageShell({
    title: '기술정보',
    description: '테라리더의 주요 기술 분야와 연구 장비 개발 경험을 확인할 수 있습니다.',
    current: 'technology',
    body: `<main> <section class="page-hero"> <div class="container"> <p class="eyebrow">Technology</p> <h1>기술정보</h1> <p>테라리더가 보유한 나노소재, 코팅, 열처리, 분석 장비 관련 기술 정보를 정리했습니다.</p> </div> </section> <section class="section"> <div class="container"> <div class="grid">${technologyCards}</div> </div> </section> </main>`
  });
}

function renderProductsIndex() {
  const cards = products.map(productCard).join('');
  return pageShell({
    title: '제품안내',
    description: '테라리더 제품 목록과 주요 사양을 확인할 수 있습니다.',
    current: 'products',
    body: `<main> <section class="page-hero"> <div class="container"> <p class="eyebrow">Products</p> <h1>제품안내</h1> <p>테라리더의 연구용 셀 지그, 온도 제어, 압력 제어, 열분석 장비를 확인할 수 있습니다.</p> </div> </section> <section class="section"> <div class="container"> <div class="grid product-grid">${cards}</div> </div> </section> </main>`
  });
}

function renderProductDetail(product) {
  const tags = (product.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  const features = (product.features || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const specs = (product.specs || []).map((spec) => `<tr> <th>${escapeHtml(spec.name)}</th> <td>${escapeHtml(spec.value)}</td> </tr>`).join('');
  const downloads = (product.downloads || []).map((download) => `<a class="btn btn-secondary" href="${attr(download.file)}">${escapeHtml(download.label)}</a>`).join('');
  const subject = encodeURIComponent(product.inquirySubject || `[TeraLeader] ${product.name} 제품 문의`);
  return pageShell({
    title: product.name,
    description: product.summary,
    current: 'products',
    body: `<main> <section class="page-hero"> <div class="container"> <p class="eyebrow">${escapeHtml(product.category)}</p> <h1>${escapeHtml(product.name)}</h1> <p>${escapeHtml(product.summary)}</p> </div> </section> <section class="section"> <div class="container detail-layout"> <div class="product-visual"> <img src="${attr(product.image || product.cardImage)}" alt="${attr(product.name)} 상세 이미지"> </div> <article class="detail-card"> <h2 class="section-title">제품 개요</h2> <p class="eyebrow">${escapeHtml(product.subtitle)}</p> <p>${escapeHtml(product.description)}</p> <div class="tag-list" aria-label="제품 태그">${tags}</div> <h3>특징</h3> <ul>${features}</ul> <div class="download-list">${downloads}</div> <div class="detail-actions"> <a class="btn btn-primary" href="mailto:${attr(company.email)}?subject=${subject}">제품 문의</a> <a class="btn btn-secondary" href="/products/">목록으로</a> </div> </article> </div> </section> <section class="section" style="padding-top:0;"> <div class="container detail-card"> <h2 class="section-title">주요 사양</h2> <table class="spec-table"> <tbody>${specs}</tbody> </table> </div> </section> </main>`
  });
}

function renderSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    '/',
    '/company/',
    '/products/',
    '/technology/',
    '/support/',
    '/notices/',
    ...products.map((product) => `/products/${product.id}/`),
    ...notices.map((notice) => `/notices/${notice.id}/`)
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${siteUrl}${url}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>`;
}
