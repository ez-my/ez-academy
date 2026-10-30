from pathlib import Path
import json,hashlib,collections,shutil,zipfile,xml.etree.ElementTree as ET
root=Path('/Users/shahril/.hermes/cache/scratch/ez-paper-rights');out=Path('/Users/shahril/Projects/ez-academy/docs/paper-rights');out.mkdir(exist_ok=True)
d=json.loads((root/'inventory.json').read_text());ocr={x['imageSha256']:x for x in json.loads((root/'ocr-results.json').read_text())};remote=json.loads((root/'remote-inspection.json').read_text());fetches=json.loads((root/'remote-results.json').read_text());jpg=json.loads((root/'image-ocr-results.json').read_text())[0]
for x in remote:
 if x.get('format')=='jpeg':
  x['pages'][0].update({k:jpg[k] for k in ['labelHits','observations']});x['pages'][0]['ocrStatus']='inspected';x['pages'][0].pop('error',None)
for t in d['reading']:
 for p in t['pages']:
  p['ocr']=ocr[p['imageSha256']];p['ocr'].pop('imageSha256',None);p.pop('imagePath',None)
 t['originalFiles']=[r for r in remote if r['skill']=='reading' and r['testId']==t['id']]
 if not t['originalFiles']:
  r=next(r for r in fetches if r['skill']=='reading' and r['testId']==t['id']);r.pop('error',None)
  with zipfile.ZipFile(r['path']) as z:
   names=[n for n in z.namelist() if n.startswith('word/') and n.endswith('.xml')]
   hits=[]
   for name in names:
    text=' '.join(ET.fromstring(z.read(name)).itertext())
    hits.extend({'part':name,'label':label} for label in ['SULIT','TERHAD'] if label in text)
  r['xmlLabelHits']=hits;r['inspectedXmlParts']=len(names);t['originalFiles']=[r]
for t in d['listening']:
 t['originalFiles']=[r for r in remote if r['skill']=='listening' and r['testId']==t['id']]
 t['remotePageCount']=next(r['pageCount'] for r in t['originalFiles'] if r['kind']=='questionFileId')
 t['remotePageInspection']='Every page rendered and OCR-inspected; whole document blocked irrespective of label detection.'
for t in d['reading']+d['listening']:
 for f in t['originalFiles']:
  f['blockedPages']=list(range(1,f['pageCount']+1)) if f.get('pageCount') else 'Entire DOCX; pagination depends on renderer'
  f['privateOriginalPath']=f.pop('path')
d['verification']={'readingSnapshotOcr':collections.Counter(x['status'] for x in ocr.values()),'sourceReferences':len(fetches),'uniqueSourceFiles':len({r['fileId'] for r in fetches}),'pdfDocuments':sum(r['status']=='downloaded' for r in fetches),'pdfPages':sum(r['pageCount'] for r in remote if r.get('format')!='jpeg'),'jpegDocuments':1,'docxDocuments':1,'sourceOcrStatus':collections.Counter(p['ocrStatus'] for r in remote for p in r['pages']),'readingSnapshotLabelImages':sum(bool(x.get('labelHits')) for x in ocr.values()),'readingSnapshotLabelOccurrences':sum(len(x.get('labelHits',[])) for x in ocr.values()),'rights':'No authorization/release evidence located; do not infer restricted legal status solely from labels or copyright. All supplied trial assets held for review.'}
(out/'inventory.json').write_text(json.dumps(d,indent=2))
lines=['# Exact affected source assets/pages','', 'All listed assets are held pending rights verification. OCR-positive pages are evidence, not the scope of the hold; every page is blocked. PDF page numbers are physical 1-based source pages; snapshot numbers are the existing app page numbers. Absence of an OCR hit is not clearance.','', '| Skill / test ID | Source kind / Drive ID | All blocked source pages | OCR or text label-positive source pages |','|---|---|---|---|']
for skill in ['reading','listening']:
 for t in d[skill]:
  for f in t['originalFiles']:
   positive=sorted({p['page'] for p in f.get('pages',[]) if p.get('labelHits') or p.get('textLabelHits')})
   lines.append(f"| {skill} / `{t['id']}` | {f['kind']} / `{f['fileId']}` | {'1–'+str(f['pageCount']) if f.get('pageCount') else 'Entire DOCX (layout-dependent)'} | {', '.join(map(str,positive)) or 'None detected (not permission)'} |")
(out/'AFFECTED_ASSETS.md').write_text('\n'.join(lines)+'\n')
for name in ['test-output.txt','render-results.json','ocr.swift','inspect-remote.swift','fetch-papers.py','retry-papers.py','check-render.py','notice-render.tsx','index.html']:
 shutil.copy(root/name,out/name)
print(json.dumps(d['verification'],indent=2));print('snapshot label-bearing papers',sum(any(p['ocr']['labelHits'] for p in t['pages']) for t in d['reading']))
