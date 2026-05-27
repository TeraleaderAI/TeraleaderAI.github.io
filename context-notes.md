# Context Notes

## 2026-05-27

- GitHub Pages 배포 기준은 저장소 루트의 `index.html`과 루트 하위 정적 폴더로 유지한다.
- 이전에 만들었던 로컬 콘텐츠 관리 도구는 초기 커밋 `11bb741`의 `tools/content-manager`에 있었다.
- 이전 도구의 접속 주소는 `http://127.0.0.1:5081/`였고, `site/src/data/products.json`, `site/src/data/notices.json`, `site/src/data/company.json`를 직접 수정하는 방식이었다.
- 현재 방향은 DB 없이 구조화 데이터 파일을 원본으로 두고, 로컬 도구가 정적 HTML을 재생성한 뒤 Git 커밋과 푸시로 배포하는 방식이다.
- `tools` 폴더를 저장소에 포함하면 GitHub Pages에서 URL 접근이 가능할 수 있다. 따라서 이 폴더에는 비밀번호, 내부 가격, 비공개 고객 정보 같은 민감한 내용을 넣지 않는다.
- 구버전 ASP 관리자 흔적은 `reset/wwhome/Artyboard/Admin`에 있으나, 새 방향에서는 사용하지 않는다.
- 공개 콘텐츠 원본은 루트의 `data/products.json`, `data/company.json`, `data/notices.json`로 둔다.
- `tools/content-manager`는 로컬 HTTP 도구로 유지하고 `http://127.0.0.1:5081/`에서 제품 정보를 편집한다.
- 정적 생성 스크립트는 `tools/content-manager/build-static.mjs`이며 루트의 `index.html`, `products/index.html`, 제품 상세 페이지, `sitemap.xml`을 다시 쓴다.
- 현재 관리 도구는 제품 추가, 삭제, 공개 전환, 주요 필드, 태그, 특징, 사양, 다운로드 항목 편집을 지원한다.
- 루트의 `start-content-manager.cmd`를 더블클릭하면 `http://127.0.0.1:5081/`을 열고 `tools/content-manager/server.mjs`를 실행한다.
- 회사 기본 정보, 연혁, 사업영역, 기술 정보도 `data/company.json`을 원본으로 유지하고 로컬 콘텐츠 관리 도구에서 편집한다.
- 콘텐츠 관리 도구는 제품 정보와 회사 정보 탭을 제공한다. 회사 정보 탭에서 기본 정보, 사업영역, 기술 정보, 연혁을 저장할 수 있다.
- 정적 생성 스크립트는 회사소개 페이지와 기술정보 페이지도 `data/company.json` 기준으로 다시 생성한다.
