# Typop

팝송 가사 타이핑 연습과 아티스트 이름 맞추기 게임을 즐길 수 있는 Electron 데스크탑 앱입니다.

## 기능

### 가사 타이핑
- lyrics.ovh API를 통해 팝송 가사를 검색
- 실시간 타이핑 정확도 및 WPM(분당 타수) 측정
- 하단 키보드 시각화로 현재 누른 키 확인

### 산성비 게임
- 화면 위에서 아티스트 이름이 떨어지면 타이핑해서 없애는 게임
- 라운드가 올라갈수록 속도가 빨라지고 단어 수가 증가
- 한국 아티스트 이름을 맞추면 특별 효과 발동 (단어 정지 / 시간 정지)
- Google 로그인 시 점수가 자동 저장되고 전체 랭킹 확인 가능

### 랭킹
- Google 로그인한 유저의 점수를 실시간으로 확인
- 상위 20명의 점수, 라운드, 플레이 시간 표시

## 기술 스택

- **Frontend**: React 19, TypeScript
- **Desktop**: Electron 39
- **Build**: electron-vite
- **Auth & DB**: Supabase (Google OAuth, PostgreSQL)
- **Routing**: React Router v7

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

Supabase 프로젝트를 생성하고 `.env` 파일을 만드세요.

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase DB 설정

Supabase SQL Editor에서 실행:

```sql
create table public.scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  user_name text not null,
  user_avatar text,
  score int not null,
  round int not null,
  total_time int not null,
  created_at timestamptz default now()
);

alter table scores enable row level security;

create policy "누구나 읽기 가능" on scores for select using (true);
create policy "본인만 점수 저장" on scores for insert with check (auth.uid() = user_id);
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. 빌드

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## 다운로드 및 설치 (macOS)

[Releases](https://github.com/marchbom/Typop/releases) 페이지에서 최신 버전의 `.dmg` 파일을 다운로드하세요.

> macOS는 미서명 앱에 대해 보안 경고가 발생할 수 있어요. 아래 방법으로 실행하세요.

### 방법 1: 터미널로 실행 (권장)

```bash
# 1. 앱을 /Applications 폴더로 이동 후 실행
xattr -cr /Applications/Typop.app
codesign --force --deep --sign - /Applications/Typop.app
open /Applications/Typop.app
```

### 방법 2: 시스템 설정에서 허용

1. Typop.app 실행 시도 → 경고 팝업에서 **무시** 클릭
2. **시스템 설정 → 개인 정보 보호 및 보안 → 보안** 항목에서
3. "Typop이 차단되었습니다" 옆 **확인 없이 열기** 클릭
