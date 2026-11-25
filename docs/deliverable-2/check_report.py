"""Verify report/source identity, requirement inventories and layout bounds; render QA PNGs."""
import argparse,hashlib,json,re
from pathlib import Path
import pymupdf

ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--render-dir',type=Path);args=parser.parse_args()
pdf=ROOT/'docs/deliverable-2/output/deliverable2_sec31_EN-003_P5_REVIEW.pdf'
manifest=json.loads(pdf.with_suffix('.manifest.json').read_text(encoding='utf-8'))
doc=pymupdf.open(pdf);text='\n'.join(page.get_text() for page in doc)
requirements={f'{p}-{i:02}' for p,n in [('FR',18),('BR',14),('NFR',8)]for i in range(1,n+1)}
contracts='\n'.join((ROOT/f'docs/sprints/sprint-{i}/contracts.md').read_text(encoding='utf-8')for i in [1,2,3])
acs=set(re.findall(r'AC-\d\d-\d\d',contracts))
assert requirements<=set(re.findall(r'(?:FR|BR|NFR)-\d\d',text))
assert acs<=set(re.findall(r'AC-\d\d-\d\d',text))
assert hashlib.sha256(pdf.read_bytes()).hexdigest()==manifest['pdfSha256']
for item in manifest['sourceFiles']:
 path=ROOT/item['path'];data=path.read_bytes()
 if path.suffix.lower() not in ['.png','.jpg','.jpeg','.pdf']:data=data.decode('utf-8-sig').replace('\r\n','\n').encode('utf-8')
 assert hashlib.sha256(data).hexdigest()==item['sha256'],item['path']
assert len(doc.get_toc())==len(manifest['sectionPages'])
assert '\ufffd' not in text and '\x00' not in text
bounds=[]
if args.render_dir:args.render_dir.mkdir(parents=True,exist_ok=True)
for i,page in enumerate(doc):
 if args.render_dir:page.get_pixmap().save(args.render_dir/f'page-{i+1:03}.png')
 for block in page.get_text('dict')['blocks']:
  for line in block.get('lines',[]):
   for span in line['spans']:
    x0,y0,x1,y1=span['bbox']
    if x0<35 or x1>page.rect.width-35 or y0<20 or y1>page.rect.height-15:bounds.append([i+1,span['text'][:60]])
assert not bounds,bounds
result={'pdfPages':len(doc),'requirementsPresent':len(requirements),'acceptanceCriteriaPresent':len(acs),'outlineEntries':len(doc.get_toc()),'allSourceHashesMatch':True,'pdfSha256':manifest['pdfSha256'],'textBoundsIssues':bounds,'renderedAllPages':bool(args.render_dir),'reviewStatus':'not submitted; peer review pending'}
(pdf.parent/'review-qa.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result,indent=2))
