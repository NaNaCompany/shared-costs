# 자취 비용 분배 / Shared Living Costs

S039. `dist/`를 그대로 정적 호스팅하는 브라우저 앱입니다. 한국어 `/` 및 `/en/`, `/es/`, `/zh/`, `/ja/`, `/de/`, 모든 경로의 언어 메뉴를 지원합니다. 사용자 입력은 번역하지 않습니다. 외부 전송·저장·결제·추적·광고 없음. 모든 경로 `noindex,nofollow`.

## 기능과 가정

- 정산 기간, 통화 표시명, 소수 자리 0·2·3 직접 설정. 한 통화로 입력하며 환율 변환하지 않습니다.
- 사람별 입주일·퇴거일·면적(m²)·사용량·가중치. 양 끝을 포함한 달력 일수이며 정산 기간과 겹친 날만 사용합니다. 빈 입퇴거일은 기간 경계값을 사용합니다.
- 지출별 결제자 및 거주일수 / 면적×거주일수 / 입력 사용량 / 입력 가중치 / 개인 비용 분담 방식. 개인 비용은 지정 부담자 한 명이 전액 부담합니다.
- 사용량·가중치는 기간 중 하루 이상 거주한 사람의 입력값을 사용합니다. 면적·사용량·가중치는 각각 같은 단위를 사용해야 합니다.
- 최소 통화 단위를 `BigInt` 정수로 계산합니다. 금액×가중치÷총가중치의 정수 몫을 먼저 배정한 뒤 나머지가 큰 순서로 1단위씩 배정합니다. 동률은 사람 입력 순서입니다. 지출별 배분 합계를 원래 금액과 정확히 일치시킵니다.
- 결제액−부담액이 양수면 받을 돈, 음수면 보낼 돈입니다. 채무자와 수취자를 사람 입력 순서대로 연결합니다. 송금 횟수 최적화를 보장하지 않습니다.
- 사람별 결제·부담·잔액, 송금 제안, 항목별 부담 상세. CSV 전체 다운로드, 요약 클립보드 복사.
- CSV는 인용부호·줄바꿈을 이스케이프하고 수식 시작값에 작은따옴표를 추가합니다. 음수 잔액 등 내보낸 값 앞에도 작은따옴표가 붙을 수 있습니다. 스프레드시트 재저장 이후까지 보호를 보장하지 않습니다.

## 제한

1~12명, 지출 1~40개, 최대 3,661일. 지출 금액은 0 초과~999,999,999,999. 면적·사용량·가중치는 0~1,000,000 및 소수 3자리까지. 빈/중복 이름, 잘못된 날짜, 역순 날짜, 음수·무한대·지수·쉼표 숫자, 통화 소수 초과, 분담 가중치 합계 0을 거부합니다. 원래 입력은 유지합니다. 입력한 가정의 산술 계산이며 실제 송금이나 법적 청구를 수행하지 않습니다. 브라우저 시각 QA는 수행하지 않았습니다.

## 실제 검증

앱 루트 PowerShell에서 실행했습니다.

```powershell
$node = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
foreach ($file in @('dist/app.js','dist/core.js','dist/i18n.js','dist/common-i18n.js')) {
  & '..\..\.tools\rtk\rtk.exe' proxy $node --check $file
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
& '..\..\.tools\rtk\rtk.exe' proxy $node tests.mjs
```

결과: JS 4파일 구문 검사 exit 0, 10개 fixture 그룹 통과. 불균등 반올림 100→17/33/50 및 동률 100→34/33/33, 합계 0, 순환 결제 상쇄, 입주일수, 면적·사용량·개인 비용, 정산기간 밖 제외, 송금 후 잔액 0, 소수/최소 단위, 윤년·유효성 오류, CSV 이스케이프, 6개 언어 카탈로그 및 전체 route 검증을 포함합니다.

## 출처와 재사용

- 정수 연산 API: [ECMAScript BigInt](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-bigint-objects)
- CSV 인용: [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180)
- 내보내기 보호와 한계: [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)

배분 규칙은 앱에 명시한 사용자 가정입니다. 법정 분담 기준을 주장하지 않습니다. 코드·스타일·예시는 직접 작성했으며 외부 라이브러리·폰트·이미지를 쓰지 않습니다.

## Public GitHub Pages release

Launch: https://nanalab.kr/shared-costs/

Korean is at the root. English, Spanish, Chinese, Japanese and German use `/en/`, `/es/`, `/zh/`, `/ja/`, `/de/`.
GitHub Pages serves `main` → `/docs` using the branch build. No project CNAME is used.

Build: `node scripts/build-public.mjs`. The `dist/` snapshot and its original generators/tests are preserved as the application source. The public build adds metadata, six-locale sitemaps, original JPEG cards, More Apps styling and the existing NaNa publisher integrations. It does not upload selected user files.

Publisher integrations: AdSense, Google Tag Manager, Google Analytics and Cloudflare Web Analytics, with the same publisher settings as the NaNa Lab homepage. These scripts can make network requests independently of local file processing.

Original JPEG cards are rendered from original text and geometry using an installed system font; no font files are redistributed. Existing source references and third-party notices remain applicable.
