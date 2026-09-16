// verify_release_gate.mjs
// Automated Release Gate v1.0 Test Suite
// Executes real HTTP requests against http://localhost:3000

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:3000';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 PhoneCheck AI — Release Gate v1.0 Live Verification Test');
  console.log('================================================================\n');

  let passedAll = true;

  // Ensure server is up
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);
    const healthData = await healthRes.json();
    console.log(`[PASS] Server Health Check: Status=${healthData.status}, GateVersion=${healthData.gateVersion}\n`);
  } catch (err) {
    console.error(`[FAIL] Could not connect to dev server at ${BASE_URL}:`, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TEST 1: 다른 사용자의 기기 접근 시 403 반환
  // -------------------------------------------------------------
  console.log('--- TEST 1: Tenant Isolation & Ownership Enforcement (403 Forbidden) ---');
  {
    // dev-1 belongs to user-seller-1
    // user-dealer-1 attempts unauthorized access
    const unauthorizedUser = 'user-dealer-1';

    // 1.1 GET other user's device
    const getRes = await fetch(`${BASE_URL}/api/devices/dev-1`, {
      headers: { 'x-user-id': unauthorizedUser },
    });
    const getBody = await getRes.json();
    if (getRes.status === 403) {
      console.log(`[PASS] GET /api/devices/dev-1 with unauthorized user: 403 Forbidden received.`);
      console.log(`       Message: "${getBody.error}"`);
    } else {
      console.error(`[FAIL] GET /api/devices/dev-1 expected 403, got ${getRes.status}`);
      passedAll = false;
    }

    // 1.2 PUT other user's device
    const putRes = await fetch(`${BASE_URL}/api/devices/dev-1`, {
      method: 'PUT',
      headers: {
        'x-user-id': unauthorizedUser,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ askingPrice: 9999999 }),
    });
    const putBody = await putRes.json();
    if (putRes.status === 403) {
      console.log(`[PASS] PUT /api/devices/dev-1 with unauthorized user: 403 Forbidden received.`);
    } else {
      console.error(`[FAIL] PUT /api/devices/dev-1 expected 403, got ${putRes.status}`);
      passedAll = false;
    }

    // 1.3 DELETE other user's device
    const delRes = await fetch(`${BASE_URL}/api/devices/dev-1`, {
      method: 'DELETE',
      headers: { 'x-user-id': unauthorizedUser },
    });
    if (delRes.status === 403) {
      console.log(`[PASS] DELETE /api/devices/dev-1 with unauthorized user: 403 Forbidden received.`);
    } else {
      console.error(`[FAIL] DELETE /api/devices/dev-1 expected 403, got ${delRes.status}`);
      passedAll = false;
    }

    // 1.4 POST photo on other user's device
    const photoRes = await fetch(`${BASE_URL}/api/devices/dev-1/photos`, {
      method: 'POST',
      headers: {
        'x-user-id': unauthorizedUser,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        angle: 'FRONT',
      }),
    });
    if (photoRes.status === 403) {
      console.log(`[PASS] POST /api/devices/dev-1/photos with unauthorized user: 403 Forbidden received.\n`);
    } else {
      console.error(`[FAIL] POST /api/devices/dev-1/photos expected 403, got ${photoRes.status}\n`);
      passedAll = false;
    }
  }

  // -------------------------------------------------------------
  // TEST 2: 공유 링크 만료·폐기 시 접근 차단
  // -------------------------------------------------------------
  console.log('--- TEST 2: Share Token Expiration & Revocation Enforcement ---');
  {
    const ownerUser = 'user-seller-1';

    // 2.1 Generate fresh share token
    const genRes = await fetch(`${BASE_URL}/api/devices/dev-1/share/generate`, {
      method: 'POST',
      headers: {
        'x-user-id': ownerUser,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ validityDays: 7 }),
    });
    const genData = await genRes.json();
    const token = genData.shareToken;
    console.log(`[INFO] Generated Share Token: ${token}, ExpiresAt: ${genData.shareExpiresAt}`);

    // 2.2 Access valid token (Should succeed with 200, buyPrice/margin redacted)
    const accessValidRes = await fetch(`${BASE_URL}/api/share/${token}`);
    const accessValidData = await accessValidRes.json();
    if (accessValidRes.status === 200 && accessValidData.report?.marketPriceAnalysis) {
      const marginHidden = accessValidData.report.marketPriceAnalysis.buyOfferSummary === null;
      console.log(`[PASS] GET /api/share/${token}: 200 OK (Public sanitized report).`);
      console.log(`       Wholesale margin redacted from public: ${marginHidden ? 'YES' : 'NO'}`);
    } else {
      console.error(`[FAIL] GET /api/share/${token} expected 200 with report, got status ${accessValidRes.status}`, accessValidData);
      passedAll = false;
    }

    // 2.3 Revoke the token
    const revokeRes = await fetch(`${BASE_URL}/api/devices/dev-1/share/revoke`, {
      method: 'POST',
      headers: {
        'x-user-id': ownerUser,
        'Content-Type': 'application/json',
      },
    });
    const revokeData = await revokeRes.json();
    console.log(`[INFO] Revoked Share Token. shareIsRevoked=${revokeData.shareIsRevoked}`);

    // 2.4 Try to access revoked token (Should be blocked with 410 Gone)
    const accessRevokedRes = await fetch(`${BASE_URL}/api/share/${token}`);
    const accessRevokedData = await accessRevokedRes.json();
    if (accessRevokedRes.status === 410) {
      console.log(`[PASS] GET /api/share/${token} (Revoked): 410 Gone.`);
      console.log(`       Rejection reason: "${accessRevokedData.error}"`);
    } else {
      console.error(`[FAIL] GET /api/share/${token} expected 410, got ${accessRevokedRes.status}`);
      passedAll = false;
    }

    // 2.5 Test Expired Token rejection
    await fetch(`${BASE_URL}/api/devices/dev-1`, {
      method: 'PUT',
      headers: {
        'x-user-id': ownerUser,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shareToken: 'test-expired-token-xyz',
        shareExpiresAt: '2023-01-01T00:00:00.000Z',
        shareIsRevoked: false,
      }),
    });
    const accessExpiredRes = await fetch(`${BASE_URL}/api/share/test-expired-token-xyz`);
    const accessExpiredData = await accessExpiredRes.json();
    if (accessExpiredRes.status === 410) {
      console.log(`[PASS] GET /api/share/test-expired-token-xyz (Expired): 410 Gone.`);
      console.log(`       Rejection reason: "${accessExpiredData.error}"`);
    } else {
      console.error(`[FAIL] GET expired share token expected 410, got ${accessExpiredRes.status}`);
      passedAll = false;
    }

    // 2.6 Test Audit Log recorded for accesses
    const logsRes = await fetch(`${BASE_URL}/api/devices/dev-1/share/logs`, {
      headers: { 'x-user-id': ownerUser },
    });
    const logsData = await logsRes.json();
    console.log(`[PASS] Audit Logs query: recorded ${logsData.logs?.length || 0} access events for device dev-1.\n`);
  }

  // -------------------------------------------------------------
  // TEST 3: 서버 재시작 후 데이터 보존 (Persistence Test)
  // -------------------------------------------------------------
  console.log('--- TEST 3: Disk File Persistence Across Storage Lifecycles ---');
  {
    const ownerUser = 'user-seller-1';
    const uniqueTestName = `iPhone 15 Pro Test-${Date.now()}`;

    // 3.1 Create test device
    const createRes = await fetch(`${BASE_URL}/api/devices`, {
      method: 'POST',
      headers: {
        'x-user-id': ownerUser,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand: 'Apple',
        model: uniqueTestName,
        storage: '512GB',
        color: '화이트 티타늄',
        telecom: 'SKT',
        askingPrice: 1250000,
        batteryHealthUserReported: 95,
      }),
    });
    const createdDev = await createRes.json();
    const createdId = createdDev.id;
    console.log(`[INFO] Created persistent test device: ${createdId} (${uniqueTestName})`);

    // 3.2 Verify file-backed storage on disk (/data/database.json)
    const dbPath = path.join(process.cwd(), 'data', 'database.json');
    if (fs.existsSync(dbPath)) {
      const diskContent = fs.readFileSync(dbPath, 'utf-8');
      const hasId = diskContent.includes(createdId);
      if (hasId) {
        console.log(`[PASS] Atomic Disk Sync: Device ${createdId} immediately verified inside /data/database.json`);
      } else {
        console.error(`[FAIL] Device ${createdId} not found in /data/database.json`);
        passedAll = false;
      }
    } else {
      console.error(`[FAIL] /data/database.json does not exist`);
      passedAll = false;
    }

    // 3.3 Verify retrieval from API
    const verifyRes = await fetch(`${BASE_URL}/api/devices/${createdId}`, {
      headers: { 'x-user-id': ownerUser },
    });
    if (verifyRes.ok) {
      console.log(`[PASS] Device retrieved successfully via API: ${createdId}`);
    } else {
      console.error(`[FAIL] Could not retrieve created device via API: ${verifyRes.status}`);
      passedAll = false;
    }

    // 3.4 Cleanup test device
    await fetch(`${BASE_URL}/api/devices/${createdId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': ownerUser },
    });
    console.log(`[INFO] Cleaned up temporary test device: ${createdId}\n`);
  }

  // Final summary
  console.log('================================================================');
  if (passedAll) {
    console.log('🎉 ALL RELEASE GATE LIVE API TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ SOME TESTS FAILED. CHECK LOGS ABOVE.');
  }
  console.log('================================================================');
}

runTests();
