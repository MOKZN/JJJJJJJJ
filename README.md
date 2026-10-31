# 중고거래 정보 재인 실험 — GitHub Pages + Supabase

**GitHub Pages는 화면을 게시하고, Supabase가 응답을 저장합니다.** Java/Render 불필요. 현재 주소 `https://mokzn.github.io/1/`에 사용 가능하도록 상대 경로를 사용했습니다. 다만 외부 Supabase 프로젝트 생성과 설정은 연구자 계정에서 직접 한 번 진행해야 합니다. 아직 실제 DB나 라이브 URL을 개설한 것은 아닙니다.

## 1. Supabase 준비 (필수)
1. https://supabase.com 에 로그인하여 **새 프로젝트** 생성. 프로젝트 비밀번호를 안전하게 보관.
2. SQL Editor > New query에 `schema.sql` **전체** 붙여넣기 > Run. 새 프로젝트 권장.
3. Project Settings > API (또는 Connect/API Keys)에서 **Project URL**과 **publishable key/legacy anon key** 복사. `service_role` / `secret` 키는 절대 웹 파일에 넣지 마세요.
4. `config.js`의 두 `PASTE_...` 값을 복사한 URL/공개 키로 교체. 예: `https://xxxx.supabase.co`.
5. Authentication > Providers > Email에서 이메일 인증 사용. 연구자 계정은 Authentication > Users에서 생성하거나 초대. 이메일 확인 후 비밀번호 로그인 가능한 계정으로 설정.
6. Authentication > Users의 **연구자 UUID**를 복사하고 SQL Editor에서 아래 실행 (UUID는 실제 값으로 교체):
   ```sql
   insert into public.study_admins(user_id) values ('연구자-UUID-여기에-입력');
   ```
   이 계정만 `admin.html`에서 전체 응답을 조회할 수 있습니다. 관리자 계정의 회원가입을 참여자에게 열어둘 필요는 없습니다. Supabase의 Authentication URL Configuration에 배포 URL을 설정하는 것이 좋습니다.

## 2. GitHub Pages 업로드
1. GitHub `mokzn/1` 저장소의 최상위에 **이 ZIP 안의 파일들 자체**를 업로드: `index.html`, `admin.html`, `app.js`, `admin.js`, `style.css`, `config.js`, `schema.sql`, `assets/product.png`, `README.md`, `.nojekyll`. 바깥 폴더째 넣지 마세요.
2. Settings > Pages > Deploy from a branch > main > /(root) > Save.
3. 몇 분 후 **참여자 주소** `https://mokzn.github.io/1/` / **관리자 주소** `https://mokzn.github.io/1/admin.html`.
4. `README.md`가 표시되면 `index.html`이 저장소 최상위에 있는지, Pages 설정이 root인지 확인.

## 3. 실험 및 안전 점검
- 연구자/지인 계정으로 사전 테스트: A/B 배정, 새로고침, 뒤로 가기, 재인 7문항, 책임 귀인 6문항, 서술형 3문항, 관리자 로그인/CSV.
- SQL Editor에서 테스트 데이터 삭제는 실제 조사 **시작 전에만**: `truncate table public.participants;` (모든 응답이 영구 삭제됩니다).
- `participants` 테이블은 RLS 및 테이블 권한으로 공개 읽기/쓰기가 차단되어 있고, 지정된 RPC로만 상태 변경. 참여자 토큰은 `sessionStorage`에 저장. 브라우저 탭을 완전히 닫거나 다른 기기로 바꾸면 진행 중인 응답 복구가 불가능할 수 있습니다. 동일 탭 새로고침은 복구됩니다.
- 이전 단계는 **서버 상태(stage) 기준으로 재제출·재진입 불가**. 다만 GitHub Pages 정적 자극물은 개발자 도구/캐시/스크린샷으로 재열람 가능하며 완전한 기술적 차단은 불가능합니다. 엄격한 실험 통제가 필요하면 서버에서 자극물까지 인증하여 제공하는 구조를 선택해야 합니다.
- 외부 Supabase 프로젝트의 무료 플랜 정책, 백업/보존 정책을 확인하고 주기적으로 CSV를 백업하세요. 서비스 설정 전에는 실제 설문을 시작하지 마세요.
- **중요 연구 설계:** A/B가 동일한 문구·사진·가격을 갖는지 최종 검토하고, 표본수와 제외기준을 사전 결정하세요. 책임 귀인은 가상 상황에 대한 판단이지 실제 분쟁 감소를 입증하는 지표가 아닙니다. 미성년자 참여 시 보호자 동의, 연구자 연락처, 데이터 보존 기간과 철회 방법을 실제 연구 안내문에 명시해야 합니다.
- 사진 `assets/product.png`는 연구용 합성 이미지입니다. 참가자에게 직접 사진/화면을 기록하지 않도록 안내하세요.

## 구성
- `index.html` / `app.js`: 참가자 화면과 A/B 자극물, 단계별 설문
- `admin.html` / `admin.js`: Supabase 이메일 로그인, 관리자 통계, CSV
- `schema.sql`: PostgreSQL 데이터 구조, 제한된 RPC, 관리자 접근 검사
- `config.js`: 공개 API URL/key만 입력 (관리자 비밀번호/secret key 저장 금지)
