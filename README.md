# Typop

팝송 가사 타이핑 연습과 아티스트 이름 맞추기 게임을 즐길 수 있는 Electron 데스크탑 앱입니다.

---

## 다운로드 및 설치 (macOS)

### 1. DMG 다운로드

[Releases](https://github.com/marchbom/Typop/releases) 페이지에서 최신 버전의 `Typop-x.x.x.dmg` 파일을 다운로드하세요.

### 2. 앱 설치

다운로드한 `.dmg` 파일을 열면 아래 창이 나타납니다.
`Typop.app`을 `Applications` 폴더로 드래그해서 설치하세요.

```
[ Typop.app ]  →→→  [ Applications ]
```

### 3. 보안 경고 해제 후 실행

macOS는 개발자 서명이 없는 앱을 기본 차단합니다. 처음 한 번만 아래 터미널 명령어를 실행하면 이후부터 일반 앱처럼 사용할 수 있어요.

**터미널을 열고 아래 명령어를 순서대로 실행하세요:**

```bash
xattr -cr /Applications/Typop.app
codesign --force --deep --sign - /Applications/Typop.app
open /Applications/Typop.app
```

> **터미널 여는 방법**: `Cmd + Space` → "터미널" 검색 → 엔터

이후부터는 Launchpad나 Applications 폴더에서 바로 실행할 수 있어요.

---

## 앱 사용 방법

### 가사 타이핑

1. 앱 실행 후 **가사 타이핑** 메뉴 선택
2. 아티스트 이름과 곡 제목을 입력해 가사 검색
3. 가사가 로드되면 타이핑 시작 — 실시간으로 정확도와 WPM이 표시됩니다
4. 하단 키보드 시각화로 현재 누른 키를 확인할 수 있어요

### 산성비 게임

1. **산성비 게임** 메뉴 선택
2. 화면 위에서 아티스트 이름이 떨어지면 타이핑해서 없애세요
3. 라운드가 올라갈수록 속도와 단어 수가 증가합니다
4. 한국 아티스트 이름을 맞추면 특별 효과 발동 (단어 정지 / 시간 정지)
5. Google 로그인 시 점수가 자동 저장되고 전체 랭킹에서 확인 가능합니다

### 랭킹

- Google 로그인한 유저의 점수를 실시간으로 확인
- 상위 20명의 점수, 라운드, 플레이 시간 표시

---

## 기능 요약

| 기능 | 설명 |
|---|---|
| 가사 타이핑 | lyrics.ovh API로 팝송 가사 검색 후 타이핑 연습 |
| WPM 측정 | 실시간 타이핑 속도(WPM) 및 정확도 표시 |
| 키보드 시각화 | 타이핑 중 누른 키를 화면 하단에 표시 |
| 산성비 게임 | 아티스트 이름 타이핑으로 단어 제거 |
| 특별 효과 | 한국 아티스트 입력 시 단어/시간 정지 효과 |
| 랭킹 시스템 | Google 로그인 후 점수 저장 및 전체 랭킹 확인 |

---

## 기술 스택

- **Frontend**: React 19, TypeScript
- **Desktop**: Electron 39
- **Build**: electron-vite
- **Auth & DB**: Supabase (Google OAuth, PostgreSQL)
- **Routing**: React Router v7

---

## 개발 환경 설정

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
