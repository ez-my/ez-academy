from pathlib import Path
import json, subprocess, concurrent.futures, hashlib
root=Path('/Users/shahril/.hermes/cache/scratch/ez-paper-rights')
d=json.loads((root/'inventory.json').read_text()); out=root/'remote';out.mkdir(exist_ok=True)
items=[]
for cat in ('reading','listening'):
 for t in d[cat]:
  for kind in (('questionFileId',) if cat=='reading' else ('questionFileId','answerFileId')):
   if t.get(kind):items.append({'skill':cat,'testId':t['id'],'kind':kind,'fileId':t[kind]})
def fetch(i):
 p=out/(i['fileId']+'.pdf')
 try:
  r=subprocess.run(['curl','-sS','-L','--fail','--max-time','45','--max-filesize','20971520','-o',str(p),'https://drive.usercontent.google.com/download?id='+i['fileId']+'&export=download&confirm=t'],capture_output=True,text=True)
  if r.returncode:raise RuntimeError(r.stderr.strip())
  b=p.read_bytes()
  if not b.startswith(b'%PDF'):raise RuntimeError('Response was not a PDF')
  return {**i,'status':'downloaded','path':str(p),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
 except Exception as e:return {**i,'status':'unavailable','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 results=list(pool.map(fetch,items))
(root/'remote-results.json').write_text(json.dumps(results,indent=2))
print(json.dumps({'requested':len(items),'downloaded':sum(r['status']=='downloaded' for r in results),'unavailable':[r for r in results if r['status']!='downloaded']},indent=2))
