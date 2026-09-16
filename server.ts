import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';
import { analyzeDeviceImageWithGemini } from './server/aiService.js';
import { analyzeDevicePrice, validatePriceRecord } from './server/priceEngine.js';
import { generateTransactionReport } from './server/reportService.js';
import { renderPrintableReportHtml } from './server/printRenderer.js';
import { resolveCanonicalModel } from './src/config/appConfig.js';
import { UserProfile, Device, UserRole } from './src/types/index.js';

dotenv.config();

// Custom type augmentation for Request
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
      device?: Device;
    }
  }
}

// In-memory rate limiter per IP / route (Requirement 9)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function rateLimiter(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${ip}:${req.baseUrl || ''}${req.path}`;
    const now = Date.now();
    let bucket = rateLimitBuckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + windowMs };
      rateLimitBuckets.set(key, bucket);
      return next();
    }

    bucket.count++;
    if (bucket.count > maxRequests) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      return res.status(429).json({
        error: '요청 호출량 제한(Rate Limit)을 초과했습니다. 잠시 후 다시 시도해주세요.',
        retryAfter,
      });
    }

    next();
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parser with higher limit for photo base64 uploads (Requirement 9)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Global General Rate Limiter: 120 requests per minute per IP
  app.use('/api', rateLimiter(120, 60 * 1000));

  // --- AUTHENTICATION & AUTHORIZATION MIDDLEWARES (Requirement 1, 2, 3) ---

  // Middleware to identify current user from header or query (defaults to user-seller-1 for demo sessions)
  const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const headerUserId = req.headers['x-user-id'];
    const queryUserId = req.query.userId;
    const requestedId =
      typeof headerUserId === 'string'
        ? headerUserId
        : typeof queryUserId === 'string'
        ? queryUserId
        : 'user-seller-1';

    const user = store.getUser(requestedId);
    if (!user) {
      return res.status(401).json({ error: '인증되지 않은 사용자입니다. 올바른 사용자 ID를 제공하세요.' });
    }

    req.user = user;
    next();
  };

  // Middleware to require device ownership or ADMIN role (Requirement 2)
  const requireDeviceOwner = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const deviceId = req.params.id;
    const dev = store.getDevice(deviceId);
    if (!dev) {
      return res.status(404).json({ error: '기기를 찾을 수 없습니다.' });
    }

    // Admins have universal inspection privileges; normal users only own their devices
    if (req.user?.role !== 'ADMIN' && dev.userId !== req.user?.id) {
      return res.status(403).json({
        error: '해당 기기에 대한 접근 또는 수정 권한이 없습니다. (소유자 불일치)',
        deviceOwnerId: dev.userId,
        currentUserId: req.user?.id,
      });
    }

    req.device = dev;
    next();
  };

  // Middleware to require ADMIN role (Requirement 3)
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: '관리자(ADMIN) 권한이 필요합니다. 관리자 계정으로 전환 후 이용해주세요.',
        requiredRole: 'ADMIN',
        currentRole: req.user?.role,
      });
    }
    next();
  };

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PhoneCheck AI API',
      gateVersion: 'v1.0-release-gate',
      timestamp: new Date().toISOString(),
    });
  });

  // User Profile & Accounts (Requirement 1)
  app.get('/api/auth/me', authenticateUser, (req, res) => {
    res.json(req.user);
  });

  app.get('/api/auth/users', (req, res) => {
    const users = store.getAllUsers();
    res.json(users);
  });

  app.post('/api/auth/role', authenticateUser, (req, res) => {
    const { role } = req.body;
    const validRoles: UserRole[] = ['SELLER', 'DEALER', 'EXPORTER', 'BUYER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: '올바르지 않은 사용자 역할입니다. (SELLER, DEALER, EXPORTER, BUYER, ADMIN)' });
    }
    const updated = store.updateUserRole(req.user!.id, role);
    res.json(updated);
  });

  // Device CRUD with Strict User Isolation & Ownership Check (Requirement 1, 2, 9, 10)
  app.get('/api/devices', authenticateUser, (req, res) => {
    // Isolated tenant devices: standard users see only their own devices; admins see all
    const devices = store.getDevices(req.user!.id, req.user!.role);
    res.json(devices);
  });

  app.post('/api/devices', authenticateUser, (req, res) => {
    const {
      brand,
      model,
      storage,
      color,
      releaseYear,
      telecom,
      askingPrice,
      buyPrice,
      referencePrice,
      batteryHealthUserReported,
    } = req.body;

    // Schema Validation (Requirement 9)
    if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
      return res.status(400).json({ error: '제조사(brand)는 필수 입력 항목입니다.' });
    }
    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      return res.status(400).json({ error: '모델명(model)은 필수 입력 항목입니다.' });
    }
    if (!storage || typeof storage !== 'string') {
      return res.status(400).json({ error: '저장용량(storage)은 필수 입력 항목입니다. (예: 128GB, 256GB)' });
    }

    if (askingPrice !== undefined && (isNaN(Number(askingPrice)) || Number(askingPrice) < 0 || Number(askingPrice) > 50000000)) {
      return res.status(400).json({ error: '희망 판매가격이 유효 범위를 벗어났습니다.' });
    }
    if (buyPrice !== undefined && (isNaN(Number(buyPrice)) || Number(buyPrice) < 0 || Number(buyPrice) > 50000000)) {
      return res.status(400).json({ error: '매입 가격이 유효 범위를 벗어났습니다.' });
    }
    if (batteryHealthUserReported !== undefined) {
      const bh = Number(batteryHealthUserReported);
      if (isNaN(bh) || bh < 1 || bh > 100) {
        return res.status(400).json({ error: '배터리 성능 상태는 1%에서 100% 사이여야 합니다.' });
      }
    }

    // Canonical normalization
    const canonical = resolveCanonicalModel(model);
    const canonicalId = canonical ? canonical.canonicalId : `${brand.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}`;

    const newDevice = store.createDevice({
      userId: req.user!.id, // Enforce current authenticated user as owner
      brand: canonical ? canonical.brand : brand.trim(),
      model: canonical ? canonical.model : model.trim(),
      canonicalId,
      storage: storage.trim(),
      color: color ? String(color).trim() : '기본 색상',
      releaseYear: releaseYear ? Number(releaseYear) : canonical ? canonical.releaseYear : 2023,
      telecom: telecom ? String(telecom).trim() : '자급제',
      status: 'DRAFT',
      askingPrice: askingPrice ? Number(askingPrice) : undefined,
      buyPrice: buyPrice ? Number(buyPrice) : undefined,
      referencePrice: referencePrice ? Number(referencePrice) : undefined,
      batteryHealthUserReported: batteryHealthUserReported ? Number(batteryHealthUserReported) : undefined,
    });

    res.status(201).json(newDevice);
  });

  app.get('/api/devices/:id', authenticateUser, requireDeviceOwner, (req, res) => {
    res.json(req.device);
  });

  app.put('/api/devices/:id', authenticateUser, requireDeviceOwner, (req, res) => {
    // Prevent client from maliciously transferring ownership through raw PUT
    const updates = { ...req.body };
    delete updates.id;
    delete updates.userId;

    const updated = store.updateDevice(req.params.id, updates);
    res.json(updated);
  });

  app.delete('/api/devices/:id', authenticateUser, requireDeviceOwner, (req, res) => {
    store.deleteDevice(req.params.id);
    res.json({ success: true, id: req.params.id });
  });

  // Condition checklist updates with ownership check (Requirement 2)
  app.put('/api/devices/:id/conditions/:itemId', authenticateUser, requireDeviceOwner, (req, res) => {
    const updated = store.updateConditionItem(req.params.id, req.params.itemId, req.body);
    res.json(updated);
  });

  // Photos & AI Analysis with Rate Limit and Ownership Check (Requirement 2, 4, 5, 9)
  // Dedicated rate limiter: max 15 AI analyses per minute per IP
  app.post(
    '/api/devices/:id/photos',
    rateLimiter(15, 60 * 1000),
    authenticateUser,
    requireDeviceOwner,
    async (req, res) => {
      const dev = req.device!;
      const { url, angle = 'OTHER' } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: '사진 데이터(base64 또는 URL)가 필요합니다.' });
      }

      // Step 1: Run AI analysis with transparent method logging (Gemini Vision vs Fallback)
      const aiResult = await analyzeDeviceImageWithGemini(dev, url, angle);

      // Step 2: Store image with its explicit analysisMethod and isFallback flags (Requirement 4)
      const newImg = store.addDeviceImage(dev.id, {
        url,
        angle,
        analysisMethod: aiResult.analysisMethod,
        isFallback: aiResult.isFallback,
        qualityAnalysis: aiResult.photoQuality,
        visualObservations: aiResult.observations,
      });

      // Step 3: CONSTITUTIONAL RULE (Requirement 5)
      // AI analysis observations MUST NEVER automatically set condition items to 'VERIFIED'!
      // They are marked 'NEEDS_CHECK' with evidenceSource 'AI_OBSERVED' for in-person verification.
      for (const obs of aiResult.observations) {
        if (obs.category === 'screen') {
          store.updateConditionItem(dev.id, 'display_glass', {
            status: 'NEEDS_CHECK',
            evidenceSource: 'AI_OBSERVED',
            detail: `AI 관찰 (${aiResult.analysisMethod}): ${obs.observation} (실물 터치/번인 확인 필요)`,
          });
        } else if (obs.category === 'frame') {
          store.updateConditionItem(dev.id, 'frame_dents', {
            status: 'NEEDS_CHECK',
            evidenceSource: 'AI_OBSERVED',
            detail: `AI 관찰 (${aiResult.analysisMethod}): ${obs.observation} (육안 확인 필요)`,
          });
        } else if (obs.category === 'back') {
          store.updateConditionItem(dev.id, 'back_glass', {
            status: 'NEEDS_CHECK',
            evidenceSource: 'AI_OBSERVED',
            detail: `AI 관찰 (${aiResult.analysisMethod}): ${obs.observation}`,
          });
        } else if (obs.category === 'camera_lens') {
          store.updateConditionItem(dev.id, 'camera_lens', {
            status: 'NEEDS_CHECK',
            evidenceSource: 'AI_OBSERVED',
            detail: `AI 관찰 (${aiResult.analysisMethod}): ${obs.observation}`,
          });
        }
      }

      // Refresh device status
      const refreshed = store.getDevice(dev.id);
      if (refreshed) {
        store.updateDevice(refreshed.id, {
          status: refreshed.images.length > 0 ? 'ANALYZED' : 'DRAFT',
        });
      }

      res.status(201).json({
        image: newImg,
        aiAnalysis: aiResult,
        device: store.getDevice(dev.id),
      });
    }
  );

  app.delete(
    '/api/devices/:id/photos/:photoId',
    authenticateUser,
    requireDeviceOwner,
    (req, res) => {
      const success = store.deleteDeviceImage(req.params.id, req.params.photoId);
      if (!success) return res.status(404).json({ error: '사진을 삭제할 수 없습니다.' });
      res.json({ success: true, device: store.getDevice(req.params.id) });
    }
  );

  // Price Analysis with Strict Metric Separation (Requirement 6)
  app.get(
    '/api/devices/:id/price-analysis',
    authenticateUser,
    requireDeviceOwner,
    (req, res) => {
      const dev = req.device!;
      const records = store.getPriceRecords(dev.canonicalId, dev.model, dev.storage);
      const analysis = analyzeDevicePrice(dev, records);
      res.json(analysis);
    }
  );

  // Price Records Repository with Validation, Deduplication, and Expiration (Requirement 6, 7)
  app.get('/api/prices/records', (req, res) => {
    const { productId, model, storage, type } = req.query;
    let records = store.getPriceRecords(
      typeof productId === 'string' ? productId : undefined,
      typeof model === 'string' ? model : undefined,
      typeof storage === 'string' ? storage : undefined
    );

    if (typeof type === 'string' && type) {
      records = records.filter((r) => r.listingOrTransaction === type);
    }

    res.json(records);
  });

  app.post('/api/prices/records', authenticateUser, (req, res) => {
    // Validate schema, duplicate detection, and expiration (Requirement 7)
    const existingRecords = store.getAllPriceRecords();
    const validation = validatePriceRecord(req.body, existingRecords);

    if (!validation.valid || !validation.sanitized) {
      return res.status(400).json({
        error: '가격 데이터 검증 실패',
        details: validation.errors,
      });
    }

    const newRecord = store.addPriceRecord(validation.sanitized as any);
    res.status(201).json(newRecord);
  });

  // Report Generation with Ownership Check
  app.get('/api/devices/:id/report', authenticateUser, requireDeviceOwner, (req, res) => {
    const dev = req.device!;
    const records = store.getPriceRecords(dev.canonicalId, dev.model, dev.storage);
    const priceAnalysis = analyzeDevicePrice(dev, records);
    const report = generateTransactionReport(dev, priceAnalysis);

    store.saveReport(report);
    store.updateDevice(dev.id, { status: 'REPORT_READY' });

    res.json(report);
  });

  // Share Token Lifecycle Management (Requirement 8)
  app.post('/api/devices/:id/share/generate', authenticateUser, requireDeviceOwner, (req, res) => {
    const validityDays = Number(req.body.validityDays) || 7;
    const updated = store.generateShareToken(req.params.id, Math.min(validityDays, 90));
    res.json({
      success: true,
      shareToken: updated?.shareToken,
      shareExpiresAt: updated?.shareExpiresAt,
      device: updated,
    });
  });

  app.post('/api/devices/:id/share/revoke', authenticateUser, requireDeviceOwner, (req, res) => {
    const updated = store.revokeShareToken(req.params.id);
    res.json({
      success: true,
      shareIsRevoked: true,
      device: updated,
    });
  });

  app.get('/api/devices/:id/share/logs', authenticateUser, requireDeviceOwner, (req, res) => {
    const logs = store.getShareAccessLogs(req.params.id);
    res.json({
      deviceId: req.params.id,
      totalAccessCount: req.device?.shareAccessCount || 0,
      logs,
    });
  });

  // Public Share Endpoint with Expiration, Revocation, and Access Logging (Requirement 8)
  app.get('/api/share/:shareToken', (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Client';

    const accessResult = store.recordShareAccess(req.params.shareToken, {
      ip: clientIp,
      userAgent,
    });

    if (!accessResult.valid || !accessResult.device) {
      return res.status(accessResult.status).json({
        error: accessResult.error || '공유된 리포트를 이용할 수 없습니다.',
        status: accessResult.status,
      });
    }

    const dev = accessResult.device;
    const records = store.getPriceRecords(dev.canonicalId, dev.model, dev.storage);
    const priceAnalysis = analyzeDevicePrice(dev, records);
    const report = generateTransactionReport(dev, priceAnalysis);

    // Sanitize internal dealer profit margins for the buyer view
    const sanitizedReport = {
      ...report,
      marketPriceAnalysis: {
        ...report.marketPriceAnalysis,
        buyOfferSummary: null, // Redact wholesale buy price from public view
        marginEstimate: undefined,
      },
    };

    res.json({
      device: {
        id: dev.id,
        brand: dev.brand,
        model: dev.model,
        storage: dev.storage,
        color: dev.color,
        releaseYear: dev.releaseYear,
        telecom: dev.telecom,
        askingPrice: dev.askingPrice,
        images: dev.images,
        conditions: dev.conditions,
        infoSufficiencyScore: dev.infoSufficiencyScore,
        shareExpiresAt: dev.shareExpiresAt,
      },
      report: sanitizedReport,
      isSharedView: true,
    });
  });

  // Dedicated Print & PDF Document Endpoints (Accessible via new tab, immune to iframe sandboxing)
  app.get('/api/devices/:id/print', (req, res) => {
    const dev = store.getDevice(req.params.id) || store.getDevices().find((d) => d.id === req.params.id);
    if (!dev) {
      return res.status(404).send('<!DOCTYPE html><html><body><h3>단말기 정보를 찾을 수 없습니다.</h3></body></html>');
    }

    const records = store.getPriceRecords(dev.canonicalId, dev.model, dev.storage);
    const priceAnalysis = analyzeDevicePrice(dev, records);
    const report = generateTransactionReport(dev, priceAnalysis);
    const html = renderPrintableReportHtml(dev, report, priceAnalysis);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  app.get('/api/share/:shareToken/print', (req, res) => {
    const accessResult = store.recordShareAccess(req.params.shareToken, {
      ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown Client',
    });

    if (!accessResult.valid || !accessResult.device) {
      return res.status(404).send('<!DOCTYPE html><html><body><h3>유효하지 않거나 만료된 공유 링크입니다.</h3></body></html>');
    }

    const dev = accessResult.device;
    const records = store.getPriceRecords(dev.canonicalId, dev.model, dev.storage);
    const priceAnalysis = analyzeDevicePrice(dev, records);
    const report = generateTransactionReport(dev, priceAnalysis);
    const html = renderPrintableReportHtml(dev, report, priceAnalysis);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  // Admin Metrics & Management (Requirement 3)
  app.get('/api/admin/stats', authenticateUser, requireAdmin, (req, res) => {
    const stats = store.getAdminStats();
    res.json(stats);
  });

  app.get('/api/admin/devices', authenticateUser, requireAdmin, (req, res) => {
    // Admin can inspect all devices across tenants
    const allDevices = store.getDevices(undefined, 'ADMIN');
    res.json(allDevices);
  });

  app.get('/api/admin/users', authenticateUser, requireAdmin, (req, res) => {
    const allUsers = store.getAllUsers();
    res.json(allUsers);
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PhoneCheck AI Server running on http://0.0.0.0:${PORT} (Release Gate v1.0 Active)`);
  });
}

startServer();

