from pathlib import Path
import json,subprocess,hashlib,zipfile,xml.etree.ElementTree as ET
root=Path('/Users/shahril/.hermes/cache/scratch/ez-paper-rights');p=root/'remote-results.json';rows=json.loads(p.read_text())
for r in rows:
 if r['status']=='downloaded':continue
 f=root/'remote'/(r['fileId']+'.pdf')
 if 'curl:' in r.get('error',''):
  proc=subprocess.run(['curl','-sS','-L','--fail','--retry','2','--max-time','90','--max-filesize','83886080','-o',str(f),'https://drive.usercontent.google.com/download?id='+r['fileId']+'&export=download&confirm=t'],capture_output=True,text=True)
  if proc.returncode:r['error']=proc.stderr.strip();continue
 b=f.read_bytes();r.update(path=str(f),bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
 if b.startswith(b'%PDF'):r.update(status='downloaded');r.pop('error',None)
 elif b.startswith(b'PK'):
  with zipfile.ZipFile(f) as z:
   xml=ET.fromstring(z.read('word/document.xml'));text=' '.join(xml.itertext());r.update(status='downloaded-docx',format='docx',labelHits=[s for s in ['SULIT','TERHAD'] if s in text],pageCount=None,pageNote='DOCX: layout-dependent pagination; all content held')
 elif b.startswith(b'\xff\xd8'):r.update(status='downloaded-image',format='jpeg',pageCount=1)
 else:r.update(status='unavailable',error='Unknown response format')
p.write_text(json.dumps(rows,indent=2));print(json.dumps([r for r in rows if r.get('format') or r['status']=='unavailable'],indent=2))
