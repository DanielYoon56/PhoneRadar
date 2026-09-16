import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';
import { analyzeDeviceImageWithGemini } from './server/aiService.js';
import { analyzeDevicePrice } from './server/priceEngine.js';
import { generateTransactionReport } from './server/reportService.js';
import { resolveCanonicalModel } from './src/config/appConfig.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parser with higher limit for photo base64 uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'PhoneCheck AI API', timestamp: new Date().toISOString() });
  });

  // User Profile & Role Switcher
  app.get('/api/auth/me', (req, res) => {
    const user = store.getUser('user-seller-1');
    res.json(user);
  });

  app.post('/api/auth/role', (req, res) => {
    const { role } = req.body;
    if (!['SELLER', 'DEALER', 'EXPORTER', 'BUYER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    const updated = store.updateUserRole('user-seller-1', role);
    res.json(updated);
  });

  // Device CRUD
  app.get('/api/devices', (req, res) => {
    const devices = store.getDevices();
    res.json(devices);
  });

  app.post('/api/devices', (req, res) => {
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

    if (!brand || !model || !storage) {
      return res.status(400).json({ error: '제조사, 모델명, 저장용량은 필수 입력 항목입니다.' });
    }

    // Canonical normalization
    const canonical = resolveCanonicalModel(model);
    const canonicalId = canonical ? canonical.canonicalId : `${brand.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}`;

    const newDevice = store.createDevice({
      userId: 'user-seller-1',
      brand: canonical ? canonical.brand : brand,
      model: canonical ? canonical.model : model,
      canonicalId,
      storage,
      color: color || '기본 색상',
      releaseYear: releaseYear || (canonical ? canonical.releaseYear : 2023),
      telecom: telecom || '자급제',
      status: 'DRAFT',
      askingPrice: askingPrice ? Number(askingPrice) : undefined,
      buyPrice: buyPrice ? Number(buyPrice) : undefined,
      referencePrice: referencePrice ? Number(referencePrice) : undefined,
      batteryHealthUserReported: batteryHealthUserReported ? Number(batteryHealthUserReported) : undefined,
    });

    res.status(201).json(newDevice);
  });

  app.get('/api/devices/:id', (req, res) => {
    const dev = store.getDevice(req.params.id);
    if (!dev) return res.status(404).json({ error: '기기를 찾을 수 없습니다.' });
    res.json(dev);
  });

  app.put('/api/devices/:id', (req, res) => {
    const updated = store.updateDevice(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: '기기를 찾을 수 없습니다.' });
    res.json(updated);
  });

  app.delete('/api/devices/:id', (req, res) => {
    const deleted = store.deleteDevice(req.params.id);
    if (!deleted) return res.status(404).json({ error: '기기를 찾을 수 없습니다.' });
    res.json({ success: true, id: req.params.id });
  });

  // Condition item updates
  app.put('/api/devices/:id/conditions/:itemId', (req, res) => {
    const updated = store.updateConditionItem(req.params.id, req.params.itemId, req.body);
    if (!updated) return res.status(404).json({ error: '기기 또는 상태 항목을 찾을 수 없습니다.' });
    res.json(updated);
  });

  // Photos & AI Analysis
  app.post('/api/devices/:id/photos', async (req, res) => {
    const dev = store.getDevice(req.params.id);
    if (!dev) return res.status(404).json({ error: '기기를 찾을 수 없습니다.' });

    const { url, angle = 'OTHER' } = req.body;
    if (!url) return res.status(400).json({ error: '사진 데이터가 필요합니다.' });

    // Step 1: Run AI analysis on the uploaded photo
    const aiResult = await analyzeDeviceImageWithGemini(dev, url, angle);

    // Step 2: Store image with its AI observations and quality score
    const newImg = store.addDeviceImage(req.params.id, {
      url,
      angle,
      qualityAnalysis: aiResult.photoQuality,
      visualObservations: aiResult.observations,
    });

    // Step 3: Automatically update relevant condition checklist items based on AI observation
    for (const obs of aiResult.observations) {
      if (obs.category === 'screen') {
        store.updateConditionItem(dev.id, 'display_glass', {
          status: obs.severity === 'NONE' ? 'VERIFIED' : 'NEEDS_CHECK',
          evidenceSource: 'AI_OBSERVED',
          detail: `AI 관찰: ${obs.observation}`,
          verifiedAt: new Date().toISOString(),
        });
      } else if (obs.category === 'frame') {
        store.updateConditionItem(dev.id, 'frame_dents', {
          status: obs.severity === 'NONE' ? 'VERIFIED' : 'NEEDS_CHECK',
          evidenceSource: 'AI_OBSERVED',
          detail: `AI 관찰: ${obs.observation}`,
          verifiedAt: new Date().toISOString(),
        });
      } else if (obs.category === 'back') {
        store.updateConditionItem(dev.id, 'back_glass', {
          status: obs.severity === 'NONE' ? 'VERIFIED' : 'NEEDS_CHECK',
          evidenceSource: 'AI_OBSERVED',
          detail: `AI 관찰: ${obs.observation}`,
          verifiedAt: new Date().toISOString(),
        });
      } else if (obs.category === 'camera_lens') {
        store.updateConditionItem(dev.id, 'camera_lens', {
          status: obs.severity === 'NONE' ? 'VERIFIED' : 'NEEDS_CHECK',
          evidenceSource: 'AI_OBSERVED',
          detail: `AI 관찰: ${obs.observation}`,
          verifiedAt: new Date().toISOString(),
        });
      }
    }

    // Refresh device status
    const refreshed = store.getDevice(req.params.id);
    if (refreshed) {
      store.updateDevice(refreshed.id, {
        status: refreshed.images.length > 0 ? 'ANALYZED' : 'DRAFT',
      });
    }

    res.status(201).json({ image: newImg, aiAnalysis: aiResult, device: store.getDevice(req.params.id) });
  });

  app.delete('/api/devices/:id/photos/:photoId', (req, res) => {
    const success = store.deleteDeviceImage(req.params.id, req.params.photoId);
    if (!success) return res.status(404).json({ error: '사진을 삭제할 수 없습니다.' });
    res.json({ success: true, device: store.getDevice(req.params.id) });
  });

  // Price Analysis
  app.get('/api/devices/:id/price-analysis', (req, res) => {
    const dev = store.getDevice(req.params.id);
    if (!dev) return res.status(404).json({ error: '기기를 찾을 수 없습니다.' });

    const records = store.getPriceRecords(dev.canonicalId, dev.model, dev.storage);
    const analysis = analyzeDevicePrice(dev, records);
    res.json(analysis);
  });

  // Price Records repository (Section 57: Support adding user & partner price records)
  app.get('/api/prices/records', (req, res) => {
    const { productId, model, storage } = req.query;
    const records = store.getPriceRecords(
      typeof productId === 'string' ? productId : undefined,
      typeof model === 'string' ? model : undefined,
      typeof storage === 'string' ? storage : undefined
    );
    res.json(records);
  });

  app.post('/api/prices/records', (req, res) => {
    const {
      source = '판매자 직접 입력',
      sourceType = 'USER_INPUT',
      productId,
      model,
      storage,
      conditionGrade = 'A',
      price,
      listingOrTransaction = 'LISTING',
      region,
      notes,
    } = req.body;

    if (!model || !price) {
      return res.status(400).json({ error: '모델명과 가격은 필수입니다.' });
    }

    const newRecord = store.addPriceRecord({
      source,
      sourceType,
      productId: productId || 'custom-model',
      model,
      storage: storage || '256GB',
      conditionGrade,
      price: Number(price),
      currency: 'KRW',
      listingOrTransaction,
      region: region || '전국',
      dataConfidence: 'MEDIUM',
      notes,
    });

    res.status(201).json(newRecord);
  });

  // Report Generation & Retrieval
  app.get('/api/devices/:id/report', (req, res) => {
    const dev = store.getDevice(req.params.id);
    if (!dev) return res.status(404).json({ error: '기기를 찾을 수 없습니다.' });

    const records = store.getPriceRecords(dev.canonicalId, dev.model, dev.storage);
    const priceAnalysis = analyzeDevicePrice(dev, records);
    const report = generateTransactionReport(dev, priceAnalysis);

    store.saveReport(report);
    store.updateDevice(dev.id, { status: 'REPORT_READY' });

    res.json(report);
  });

  // Public Share Endpoint (Sanitizes dealer buy prices and private info for buyers)
  app.get('/api/share/:shareToken', (req, res) => {
    const dev = store.getDeviceByShareToken(req.params.shareToken);
    if (!dev) return res.status(404).json({ error: '공유된 리포트를 찾을 수 없거나 만료되었습니다.' });

    const records = store.getPriceRecords(dev.canonicalId, dev.model, dev.storage);
    const priceAnalysis = analyzeDevicePrice(dev, records);
    const report = generateTransactionReport(dev, priceAnalysis);

    // Hide internal buy prices and margin estimates from the buyer view
    const sanitizedReport = {
      ...report,
      marketPriceAnalysis: {
        ...report.marketPriceAnalysis,
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
      },
      report: sanitizedReport,
      isSharedView: true,
    });
  });

  // Admin Metrics
  app.get('/api/admin/stats', (req, res) => {
    const stats = store.getAdminStats();
    res.json(stats);
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
    console.log(`PhoneCheck AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
