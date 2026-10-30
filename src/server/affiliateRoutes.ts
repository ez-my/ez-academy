import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { authenticateFirebaseUser, isAuthorizedAdmin, validateReceipt } from './payments';
import { ensureAffiliate, submitClaim, updateClaim } from './affiliates';
export function registerAffiliateRoutes(app: Express, db: Firestore, authenticate = authenticateFirebaseUser) {
  const route = (admin: boolean, handler: any) => async (req: any, res: any) => {
    res.set('Cache-Control','no-store');
    const identity=await authenticate(req);
    if (!identity) return res.status(401).json({error:'Sign in required.'});
    if (admin && !isAuthorizedAdmin(identity)) return res.status(403).json({error:'Admin access required.'});
    try { return res.json(await handler(req,identity)); }
    catch (error) { return res.status(400).json({error:error instanceof Error ? error.message : 'Affiliate request failed.'}); }
  };
  app.post('/api/affiliate/account',route(false,async (_req:any,user:any) => {
    const account=await ensureAffiliate(db,user.uid);
    const claims=await db.collection('affiliate_claims').where('uid','==',user.uid).get();
    return {...account,claims:claims.docs.map(d=>{const {qr,duitNowId,...data}=d.data();return {id:d.id,...data};}).sort((a:any,b:any)=>b.submittedAt-a.submittedAt)};
  }));
  app.post('/api/affiliate/claims',route(false,async (req:any,user:any) => {
    if (req.body.method === 'Touch n Go eWallet QR' && (typeof req.body.qr !== 'string' || req.body.qr.length > 600000 || !validateReceipt(req.body.qr))) throw Error('Upload a PNG, JPG or WebP QR image smaller than 440 KB.');
    return submitClaim(db,user.uid,req.body,user);
  }));
  app.get('/api/admin/affiliate/claims',route(true,async (req:any) => {
    let query=db.collection('affiliate_claims').orderBy('submittedAt','desc').orderBy('__name__','desc').limit(50);
    if (req.query.before && req.query.id) query=query.startAfter(Number(req.query.before),String(req.query.id));
    const result=await query.get();
    const claims=await Promise.all(result.docs.map(async d=>{const claim=d.data();const account=await db.collection('affiliate_accounts').doc(claim.uid).get();return {id:d.id,...claim,availableCents:account.data()?.availableCents || 0};}));
    return {claims,more:result.size===50};
  }));
  app.post('/api/admin/affiliate/claims/:id',route(true,async(req:any,user:any)=>{
    await updateClaim(db,req.params.id,req.body.status,user.uid);return {success:true};
  }));
}
