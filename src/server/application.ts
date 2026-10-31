import {registerAffiliateRoutes} from './affiliateRoutes';
import {registerRewardRoutes} from './rewardRoutes';
import {registerDashboardRoutes} from './dashboardRoutes';
import {registerDailyReportRoutes} from './dailyReportRoutes';
import {registerMUETBankRoutes} from './muetBankRoutes';
import {registerPracticeRoutes} from './practiceRoutes';
import {registerMarketingRoutes} from './marketingRoutes';
import {registerPricingRoutes} from './pricingRoutes';
import {registerCommunityRoutes} from './communityRoutes';
import {ADMIN_EMAIL} from '../constants';
import {registerOperationsRoutes} from './operationsRoutes';
import {reserveMonitoredCall} from './operations';
import { WARMUP_VOICE } from '../speakingWarmup';
import {registerAchievementRoutes} from './achievementRoutes';
import { aiAllowance, aiCallUnits, reservePackageCall } from './packageBudget';
import express from 'express';
import cors from 'cors';
import { createHash } from 'node:crypto';
import OpenAI from 'openai';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, Timestamp, type Firestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import { initializeExistingFirebase } from './firebaseAdmin';
import { registerListeningRoutes } from './listeningRoutes';
import { registerPaymentRoutes } from './paymentRoutes';
import { registerTaskRoutes } from './taskRoutes';
import { previewAllows, reserveAIRequest } from './aiBudget';
import { paymentsEnabled } from './paymentAvailability';

export function createApplication() {
  const { database: adminDb } = initializeExistingFirebase();
  const app = express();
  app.set('trust proxy', 1);

  // CORS — allow only our own domains
  const allowedOrigins = [
    'https://ez-academy.my',
    'https://app.ez-academy.my',
    'https://www.ez-academy.my',
  ];
  app.use(cors({
    origin: (origin, callback) => {
      // CORS limits which browsers can read cross-origin responses; it does
      // not replace token checks or server-side authorization.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-EZ-Request-ID'],
  }));

  // Request quotas are enforced durably for paid operations in Firestore.
  // An in-process IP limiter would bucket different users together behind
  // Netlify's adapter, so add any global IP limits at the edge instead.

  // Domain Normalization
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    const xForwardedHost = req.get('x-forwarded-host');
    const currentHost = (xForwardedHost || host).toLowerCase();
    const xForwardedProto = req.get('x-forwarded-proto');
    const protocol = xForwardedProto || req.protocol;
    


    next();
  });

  app.get('/api/payments/status', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ enabled: paymentsEnabled() });
  });
  // Fail closed until payment configuration and verification are complete.
  app.use((req, res, next) => {
    if (!paymentsEnabled() && (req.path === '/api/checkout' || req.path.startsWith('/api/payment/') || req.path === '/api/tx/callback' || req.path.startsWith('/api/admin/payments/'))) {
      return res.status(503).json({ success: false, code: 'PAYMENTS_UNDER_CONSTRUCTION', message: 'Payments are under construction. Please try again later.' });
    }
    next();
  });

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  registerDashboardRoutes(app,adminDb);
  registerDailyReportRoutes(app,adminDb);
  registerAchievementRoutes(app,adminDb);
  registerOperationsRoutes(app,adminDb);
  registerMarketingRoutes(app,adminDb);
  registerPricingRoutes(app,adminDb);

  app.get('/api/migration/access', async (req, res) => {
    const token = req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'Sign in required' });
    try {
      const identity = await getAuth().verifyIdToken(token, true);
      return res.status(previewAllows(identity.uid) ? 200 : 403).json({ allowed: previewAllows(identity.uid) });
    } catch { return res.status(401).json({ error: 'Sign in required' }); }
  });
  app.get('/api/packages/allowance', async (req,res)=>{
    res.set('Cache-Control','no-store');
    const token=req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if(!token) return res.status(401).json({error:'Sign in required'});
    try {const identity=await getAuth().verifyIdToken(token,true);return res.json(await aiAllowance(adminDb,identity.uid));}
    catch {return res.status(503).json({error:'AI balance unavailable'});}
  });
  app.use(async (req, res, next) => {
    if (process.env.MIGRATION_MODE === 'production' || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.path === '/api/tx/callback') return res.status(503).json({ error: 'Payment callbacks are disabled in staging.' });
    const token = req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'Sign in required' });
    try {
      const identity = await getAuth().verifyIdToken(token, true);
      if (!previewAllows(identity.uid)) return res.status(403).json({ error: 'This preview is for designated test accounts only.' });
      if ((req.path.startsWith('/api/payment/') || req.path === '/api/checkout') && process.env.PAYMENT_SANDBOX !== 'true') return res.status(503).json({ error: 'Payments are disabled in staging until sandbox settings are configured.' });
      return next();
    } catch { return res.status(401).json({ error: 'Sign in required' }); }
  });

  registerAffiliateRoutes(app, adminDb);
  registerRewardRoutes(app, adminDb);
  registerMUETBankRoutes(app, adminDb);
  registerPracticeRoutes(app, adminDb);
  registerListeningRoutes(app, adminDb);

  // Examiner voice is delivered in memory and cached on the learner device.
  // Only the server can access OPENAI_API_KEY. A daily budget caps new clips.
  const voiceRequests = new Map<string, Promise<Buffer>>();
  app.post('/api/speakez/voice', async (req, res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim().replace(/\s+/g, ' ') : '';
    if (!text || text.length > 500) return res.status(400).json({ error: 'Invalid examiner line' });

    const bearer = req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!bearer) return res.status(401).json({ error: 'Sign in required' });
    let uid: string;
    try {
      uid = (await getAuth().verifyIdToken(bearer)).uid;
    } catch {
      return res.status(401).json({ error: 'Sign in required' });
    }

    const warmup = req.body?.warmup === true;
    const key = createHash('sha256').update(`${uid}:${warmup ? WARMUP_VOICE.version : 'marin:v1'}:${text}`).digest('hex');
    try {
      if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Natural voice is not configured' });

      let pending = voiceRequests.get(key);
      if (!pending) {
        pending = (async () => {
          const day = new Date().toISOString().slice(0, 10);
          const totalRef = adminDb.collection('speakezVoiceUsage').doc(day);
          const userRef = totalRef.collection('users').doc(uid);
          const refundPackage = await reserveMonitoredCall(adminDb,uid,aiCallUnits('speech',text.length),'speak');
          let dailyReserved=false;
          try {
          await adminDb.runTransaction(async transaction => {
            const [total, user] = await Promise.all([transaction.get(totalRef), transaction.get(userRef)]);
            if ((total.data()?.count || 0) >= 150 || (user.data()?.count || 0) >= 30) {
              throw new Error('VOICE_DAILY_LIMIT');
            }
            transaction.set(totalRef, { count: (total.data()?.count || 0) + 1 }, { merge: true });
            transaction.set(userRef, { count: (user.data()?.count || 0) + 1 }, { merge: true });
          });
          dailyReserved=true;
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000, maxRetries: 0 });
            const speech = await openai.audio.speech.create({
              model: 'gpt-4o-mini-tts',
              voice: warmup ? WARMUP_VOICE.voice : 'marin',
              input: text,
              instructions: warmup ? WARMUP_VOICE.instructions : 'Speak as a warm, clear English speaking-test examiner. Use natural, gentle intonation and a calm pace. Do not add or change any words.',
              response_format: 'mp3',
            });
            const audio = Buffer.from(await speech.arrayBuffer());
            if (!audio.length || audio.length > 650_000) throw new Error('VOICE_CLIP_TOO_LARGE');
            await refundPackage.complete();
            return audio;
          } catch (error) {
            await refundPackage();
            if(dailyReserved) await Promise.allSettled([
              totalRef.update({ count: FieldValue.increment(-1) }),
              userRef.update({ count: FieldValue.increment(-1) }),
            ]);
            throw error;
          }
        })();
        voiceRequests.set(key, pending);
        void pending.finally(() => voiceRequests.delete(key)).catch(() => {});
      }
      const audio = await pending;
      res.set('Cache-Control', 'private, max-age=86400');
      res.type('audio/mpeg').send(audio);
    } catch (error: any) {
      if (error?.code === 'free_template') return res.status(403).json({code:error.code,error:error.message});
      if (error?.code === 'package_quota') return res.status(429).json({code:error.code,error:error.message});
      if (error?.message === 'VOICE_DAILY_LIMIT') return res.status(429).json({ error: 'Natural voice daily limit reached' });
      console.error('[SpeakEZ voice]', error?.status || error?.code || error?.message || 'Unknown error');
      return res.status(503).json({ error: 'Natural voice unavailable' });
    }
  });

  // The old generic prompt endpoint is replaced by trusted task contracts.
  app.post('/api/chatgpt', (_req, res) => res.status(410).json({ code: 'task_required', error: 'Please refresh the app to use the current assessment service.' }));
  registerTaskRoutes(app, adminDb);
  app.post('/api/ai/upload', (_req, res) => res.status(410).json({ error: 'Please refresh the app. Audio is now processed without cloud storage.' }));

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy",
      migrationMode: process.env.MIGRATION_MODE || "staging",
      readyForCutover: process.env.CUTOVER_VERIFIED === "true", 
      timestamp: new Date().toISOString()
    });
  });

  registerCommunityRoutes(app, adminDb, ADMIN_EMAIL);

  registerPaymentRoutes(app, adminDb);

  app.use('/api', (_req, res) => res.status(404).json({ code: 'not_found', error: 'This API endpoint was not found.' }));
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) return;
    const status = error?.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 503;
    res.status(status).json({ error: status === 413 ? 'This upload is too large. Please use a smaller recording.' : status === 400 ? 'Invalid request.' : 'The service is temporarily unavailable.' });
  });
  return app;
}
