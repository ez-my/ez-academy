from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path('/Users/shahril/.hermes/cache/scratch/ez-paper-rights');out=Path('/Users/shahril/Projects/ez-academy/docs/paper-rights/screenshots');out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for skill in ['Reading','Listening']:
  for width,height in [(1440,900),(390,844),(320,740)]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.goto('http://127.0.0.1:4817/?skill='+skill)
   page.get_by_role('heading',name='Materials pending rights verification').wait_for()
   assert page.locator('iframe,audio,video,img').count()==0
   assert page.locator('a').count()==1
   assert page.locator('a').get_attribute('href')=='/app'
   assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
   page.keyboard.press('Tab');assert page.evaluate("document.activeElement.tagName")=='A'
   assert not errors,errors
   file=out/f'{skill.lower()}-{width}.png';page.screenshot(path=str(file),full_page=True)
   results.append({'skill':skill,'viewport':[width,height],'noOverflow':True,'mediaOrDownloadLinks':0,'consoleErrors':errors,'screenshot':str(file)})
   page.close()
 browser.close()
(root/'render-results.json').write_text(json.dumps({'scope':'Isolated real production component with built app CSS, not authenticated end-to-end routes; no production deployment','results':results},indent=2))
print(json.dumps(results,indent=2))
