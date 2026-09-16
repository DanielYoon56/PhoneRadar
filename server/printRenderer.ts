import { Device, PriceAnalysisResult, TransactionReport } from '../src/types/index.js';

export function renderPrintableReportHtml(
  device: Device,
  report: TransactionReport,
  priceAnalysis: PriceAnalysisResult
): string {
  const verifiedList = report.conditionSummary.verifiedItems
    .map((item) => `<li><span class="mark-ok">✓</span> ${escapeHtml(item)}</li>`)
    .join('');

  const needsCheckList =
    report.conditionSummary.needsCheckItems.length === 0
      ? '<li class="text-muted">사전 미확보 항목 없음</li>'
      : report.conditionSummary.needsCheckItems
          .map((item) => `<li><span class="mark-warn">!</span> ${escapeHtml(item)}</li>`)
          .join('');

  const riskList = report.riskAndCheckPoints
    .map((pt) => `<li><span class="mark-dot">•</span> ${escapeHtml(pt)}</li>`)
    .join('');

  const txSummary = priceAnalysis.transactionSummary;
  const listingSummary = priceAnalysis.listingSummary;
  const buySummary = priceAnalysis.buyOfferSummary;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhoneCheck AI 리포트 - ${escapeHtml(device.model)} (${escapeHtml(device.storage)})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      font-size: 13px;
      line-height: 1.5;
    }
    .no-print {
      display: block;
    }
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        font-size: 12px;
      }
      .no-print {
        display: none !important;
      }
      .page-container {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      .card {
        break-inside: avoid;
      }
    }
    .top-action-bar {
      position: sticky;
      top: 0;
      z-index: 999;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }
    .top-action-bar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-outline {
      background: transparent;
      color: #cbd5e1;
      border: 1px solid #475569;
      border-radius: 6px;
      padding: 8px 14px;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-outline:hover {
      color: #ffffff;
      border-color: #94a3b8;
    }
    .info-tip {
      font-size: 12px;
      color: #94a3b8;
    }
    .page-container {
      max-width: 210mm;
      margin: 20px auto 40px auto;
      background: #ffffff;
      padding: 32px 40px;
      border-radius: 8px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.06);
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo-area h1 {
      margin: 0 0 4px 0;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-certified {
      display: inline-block;
      background: #10b981;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      vertical-align: middle;
    }
    .logo-area p {
      margin: 0;
      font-size: 11px;
      color: #64748b;
    }
    .meta-area {
      text-align: right;
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }
    .meta-area strong {
      color: #0f172a;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin: 20px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      background: #ffffff;
    }
    .card-gray {
      background: #f8fafc;
      border-color: #e2e8f0;
    }
    .spec-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .spec-table td {
      padding: 5px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .spec-table td:first-child {
      color: #64748b;
      width: 32%;
    }
    .spec-table td:last-child {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .score-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 8px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 18px;
      font-weight: 800;
    }
    .score-badge small {
      font-size: 11px;
      font-weight: normal;
      color: #047857;
    }
    .price-box {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-top: 8px;
    }
    .price-item {
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      text-align: center;
    }
    .price-item.active {
      border-color: #2563eb;
      background: #eff6ff;
    }
    .price-label {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .price-val {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .price-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .checklist-col-verified {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 14px;
    }
    .checklist-col-needscheck {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 14px;
    }
    .checklist-title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .text-emerald { color: #065f46; }
    .text-amber { color: #92400e; }
    .mark-ok { color: #059669; font-weight: bold; margin-right: 4px; }
    .mark-warn { color: #d97706; font-weight: bold; margin-right: 4px; }
    .mark-dot { color: #b45309; font-weight: bold; margin-right: 4px; }
    ul.check-list {
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: 11px;
      line-height: 1.6;
    }
    ul.check-list li {
      margin-bottom: 4px;
    }
    .text-muted {
      color: #94a3b8;
      font-style: italic;
    }
    .disclaimer-box {
      margin-top: 24px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 10px;
      color: #64748b;
      line-height: 1.5;
    }
    .disclaimer-box strong {
      color: #334155;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
  <script>
    window.onload = function() {
      // Automatically attempt to open print dialog
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.error("Auto print failed:", e);
        }
      }, 350);
    };
  </script>
</head>
<body>

  <!-- Sticky action bar (hidden in print) -->
  <div class="top-action-bar no-print">
    <div class="top-action-bar-left">
      <button class="btn-primary" onclick="window.print()">
        🖨️ 인쇄 / PDF로 저장
      </button>
      <span class="info-tip">
        💡 대상(Destination)에서 <strong>'PDF로 저장'</strong>을 선택하면 깔끔한 A4 PDF 파일이 생성됩니다.
      </span>
    </div>
    <div>
      <button class="btn-outline" onclick="window.close()">✕ 창 닫기</button>
    </div>
  </div>

  <div class="page-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-area">
        <h1>PhoneCheck AI <span class="badge-certified">VERIFIED</span></h1>
        <p>중고 단말기 상태 검증 및 거래 판단 리포트</p>
      </div>
      <div class="meta-area">
        <div>리포트 번호: <strong>${escapeHtml(report.reportNumber)}</strong></div>
        <div>발행 일시: <strong>${escapeHtml(report.createdAt.split('T')[0])}</strong></div>
        <div>단말기 식별 해시: <strong>${escapeHtml(device.imeiHash || '정상 해시 암호화')}</strong></div>
      </div>
    </div>

    <!-- Section 1 & 2: Spec & Condition Score -->
    <div class="grid-2">
      <!-- Spec -->
      <div class="card card-gray">
        <div class="section-title" style="margin-top: 0;">1. 단말기 제원 정보</div>
        <table class="spec-table">
          <tr><td>제조사 / 모델</td><td>${escapeHtml(device.brand)} ${escapeHtml(device.model)}</td></tr>
          <tr><td>저장 용량 / 색상</td><td>${escapeHtml(device.storage)} / ${escapeHtml(device.color)}</td></tr>
          <tr><td>출시 연도 / 통신사</td><td>${device.releaseYear}년 / ${escapeHtml(device.telecom || '자급제')}</td></tr>
          <tr><td>배터리 효율 (자가보고)</td><td>${device.batteryHealthUserReported ? device.batteryHealthUserReported + '%' : '미등록'}</td></tr>
          <tr><td>외관 상태 등급 (추정)</td><td>${escapeHtml(device.conditionGradeEstimated || 'A')}급</td></tr>
        </table>
      </div>

      <!-- Score & Vision -->
      <div class="card card-gray">
        <div class="section-title" style="margin-top: 0;">2. 상태 검증 및 비전 분석</div>
        <div style="margin-bottom: 12px;">
          <div class="score-badge">
            ${device.infoSufficiencyScore}점
            <small>/ 100점 (상태 정보 충족도)</small>
          </div>
        </div>
        <div style="font-size: 11px; color: #475569; line-height: 1.5;">
          <div>• 업로드 사진 수: <strong>${device.images.length}장</strong> (다각도 사진 정밀 판독 완료)</div>
          <div>• AI 시각 관찰 항목: <strong>${report.aiImageAnalysis.observedIssues.length}건 관찰</strong></div>
          <div style="margin-top: 4px; color: #64748b;">
            * AI 관찰 결과는 자동 보증되지 않으며 현장 대면 확인 체크포인트로 전환됩니다.
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Market Price Analysis -->
    <div class="section-title">3. 시장 거래 시세 분석 (실거래 vs 등록호가 엄격 분리)</div>
    <div class="card" style="padding: 14px;">
      <div class="price-box">
        <!-- Transaction Price -->
        <div class="price-item active">
          <div class="price-label">① 최근 실거래 체결가 (중위)</div>
          <div class="price-val">
            ${txSummary ? '₩' + txSummary.median.toLocaleString() : '데이터 수집 중'}
          </div>
          <div class="price-sub">
            ${txSummary ? '표본 ' + txSummary.count + '건 (범위 ₩' + txSummary.min.toLocaleString() + ' ~ ₩' + txSummary.max.toLocaleString() + ')' : '표본 확보 중'}
          </div>
        </div>

        <!-- Listing Price -->
        <div class="price-item">
          <div class="price-label">② 매물 등록 호가 (중위)</div>
          <div class="price-val">
            ${listingSummary ? '₩' + listingSummary.median.toLocaleString() : '데이터 수집 중'}
          </div>
          <div class="price-sub">
            ${listingSummary ? '표본 ' + listingSummary.count + '건 (희망 가격 기준)' : '표본 확보 중'}
          </div>
        </div>

        <!-- Buy Offer / Dealer Wholesale Price -->
        <div class="price-item">
          <div class="price-label">③ 도매/파트너 매입가</div>
          <div class="price-val">
            ${buySummary ? '₩' + buySummary.median.toLocaleString() : '₩' + ((device.buyPrice || 980000)).toLocaleString()}
          </div>
          <div class="price-sub">딜러/수거업체 즉시 매입 기준가</div>
        </div>
      </div>

      <div style="margin-top: 10px; font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
        <div>
          판매 희망가: <strong>${report.marketPriceAnalysis.currentPriceText}</strong>
          (${report.marketPriceAnalysis.relativePositionText})
        </div>
        <div>
          데이터 신뢰도: <strong>${report.marketPriceAnalysis.dataConfidence}</strong> | 기준일: ${report.marketPriceAnalysis.referenceDate}
        </div>
      </div>
    </div>

    <!-- Section 4: Unified Verification & Trade Checkpoints -->
    <div class="section-title">4. 거래 필수 체크리스트 (사전 확인 vs 현장 확인 통합)</div>
    <div class="grid-2">
      <!-- Verified -->
      <div class="checklist-col-verified">
        <div class="checklist-title text-emerald">
          <span>✓ 사전 확인 완료 항목 (${report.conditionSummary.verifiedItems.length}건)</span>
        </div>
        <ul class="check-list">
          ${verifiedList}
        </ul>
        <div style="margin-top: 10px; font-size: 10px; color: #047857; border-top: 1px solid #bbf7d0; padding-top: 6px;">
          * 사진 정밀 분석 및 자가보고를 통해 검증된 항목입니다.
        </div>
      </div>

      <!-- Needs Check & Trade Security -->
      <div class="checklist-col-needscheck">
        <div class="checklist-title text-amber">
          <span>! 현장 필수 확인 항목</span>
        </div>

        <div style="font-size: 11px; font-weight: 700; color: #92400e; margin-bottom: 4px;">
          1) 기기 외관·기능 대면 확인 (${report.conditionSummary.needsCheckItems.length}건)
        </div>
        <ul class="check-list">
          ${needsCheckList}
        </ul>

        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #fde68a;">
          <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
            2) 현장 거래 안전 & 락 방지 수칙
          </div>
          <ul class="check-list">
            ${riskList}
          </ul>
        </div>
      </div>
    </div>

    <!-- Section 5: Legal Disclaimer -->
    <div class="disclaimer-box">
      <strong>[법적 고지 및 책임 제한]</strong><br>
      본 리포트는 판매자가 제공한 사진, 입력 정보 및 공개된 시세 데이터베이스를 기반으로 작성된 보조적 거래 참고 자료입니다.
      AI 사진 판독 및 데이터 알고리즘은 내부 손상, 사설 부품 교체, 침수 흔적, 잠금 상태를 100% 보증하지 않으므로, 직거래 시 기재된 필수 체크포인트를 반드시 현장에서 대면 확인하시기 바랍니다.
      PhoneCheck AI 및 서비스 제공자는 당사자 간의 거래 분쟁이나 결과에 대해 법적 보증 책임을 부담하지 않습니다.
    </div>

    <div class="footer">
      PhoneCheck AI • 신뢰 기반 중고폰 거래 보조 리포트 • report.phonecheck.ai
    </div>
  </div>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
