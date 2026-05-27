# TeraLeader Content Manager

로컬 전용 제품 정보 관리 도구입니다. GitHub Pages 배포 기준은 저장소 루트의 정적 파일이며, 이 도구는 루트 페이지를 재생성하는 보조 도구입니다.

## 실행

```bash
cd tools/content-manager
npm start
```

브라우저에서 `http://127.0.0.1:5081/`을 엽니다.

## 작업 흐름

1. 제품 정보를 수정한다.
2. 저장한다.
3. 정적 페이지 생성을 실행한다.
4. 루트 페이지를 확인한다.
5. Git 커밋과 푸시를 진행한다.

## 데이터 위치

- `data/products.json`
- `data/company.json`
- `data/notices.json`

## 주의

이 폴더는 저장소에 포함되므로 GitHub Pages에서 파일 접근이 가능할 수 있습니다. 내부 가격, 비밀번호, 고객 정보 등 비공개 정보는 넣지 않습니다.
