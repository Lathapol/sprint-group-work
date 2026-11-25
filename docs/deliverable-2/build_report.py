"""Build the self-contained review PDF from retained repository documents/evidence.
Requires reportlab, pypdf, Pillow. Output is a review artifact, never auto-submitted.
"""
from pathlib import Path
import argparse, hashlib, html, json, re, textwrap, io
from PIL import Image as PILImage
from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, Preformatted, KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
import reportlab

ROOT=Path(__file__).resolve().parents[2]
HERE=ROOT/'docs/deliverable-2'
CAND=HERE/'evidence/candidate'
SHA='0334c966c396912dfaf2e309e044753f11d4e47c'
TAG='deliverable2-candidate-2026-11-25'
WIDTH,HEIGHT=A4; MARGIN=43; BODY=WIDTH-2*MARGIN
INPUTS=set()
def source_hash(path):
    data=path.read_bytes()
    if path.suffix.lower() not in ['.png','.jpg','.jpeg','.pdf']:
        data=data.decode('utf-8-sig').replace('\r\n','\n').encode('utf-8')
    return hashlib.sha256(data).hexdigest()
fontroot=Path(reportlab.__file__).parent/'fonts'
for n,f in [('Body','Vera.ttf'),('BodyBold','VeraBd.ttf'),('BodyItalic','VeraIt.ttf')]:
    pdfmetrics.registerFont(TTFont(n,str(fontroot/f)))
pdfmetrics.registerFont(pdfmetrics.Font('Mono','Courier','WinAnsiEncoding'))
pdfmetrics.registerFontFamily('Mono',normal='Mono',bold='Mono',italic='Mono',boldItalic='Mono')
pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='BodyItalic',boldItalic='BodyBold')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle('Text',fontName='Body',fontSize=9.2,leading=13,spaceAfter=6,splitLongWords=True))
styles.add(ParagraphStyle('SmallText',parent=styles['Text'],fontSize=8.3,leading=11,spaceAfter=4))
styles.add(ParagraphStyle('Card',parent=styles['Text'],fontSize=8.7,leading=12,spaceAfter=3))
styles.add(ParagraphStyle('Part',fontName='BodyBold',fontSize=20,leading=25,textColor=colors.HexColor('#163b55'),spaceAfter=14,keepWithNext=True))
styles.add(ParagraphStyle('Section',parent=styles['Part'],fontSize=14,leading=18,spaceBefore=10,spaceAfter=9))
styles.add(ParagraphStyle('Sub',parent=styles['Section'],fontSize=11,leading=15,spaceBefore=7,spaceAfter=6))
styles.add(ParagraphStyle('Caption',parent=styles['SmallText'],textColor=colors.HexColor('#3a5367'),spaceBefore=5,spaceAfter=10))
styles.add(ParagraphStyle('Cover',parent=styles['Part'],fontSize=30,leading=37,spaceAfter=20))
styles.add(ParagraphStyle('CodeText',fontName='Mono',fontSize=8,leading=11,spaceAfter=6))
styles.add(ParagraphStyle('TOCMain',fontName='BodyBold',fontSize=10,leading=14,spaceBefore=9,leftIndent=0,firstLineIndent=0))
styles.add(ParagraphStyle('TOCSub',fontName='Body',fontSize=8.7,leading=12,spaceBefore=3,leftIndent=13,firstLineIndent=0))

def clean(s):
    for a,b in [('→',' -> '),('–','-'),('—','-'),('≥','>='),('≤','<='),('…','...'),('ℹ','INFO'),('✔','PASS'),('✓','PASS'),('✖','FAIL'),('’',"'"),('‘',"'"),('“','"'),('”','"'),('\u00a0',' '),('\ufeff','')]:s=s.replace(a,b)
    return s
def inline(s):
    s=html.escape(clean(s))
    s=s.replace('&lt;br/&gt;','<br/>')
    s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lambda m: (f'<link href="{m[2]}">{m[1]}</link>' if m[2].startswith(('https://','#')) else m[1]),s)
    s=re.sub(r'`([^`]+)`',r'<font name="Mono">\1</font>',s)
    s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
    return s
def p(s,style='Text'):return Paragraph(inline(s),styles[style])
def heading(text,key=None,level=1):
    item=p(text,'Part' if level==0 else 'Section')
    if key:item._toc=(level,text,key)
    return item
def read(rel):
    path=ROOT/rel;INPUTS.add(path);return path.read_text(encoding='utf-8-sig')
def code(s):
    lines=[]
    for line in clean(s).expandtabs(2).splitlines():
        lines.extend(textwrap.wrap(line, width=100,replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False) or [''])
    return Preformatted('\n'.join(lines),styles['CodeText'])
def table(headers,rows):
    if len(headers)>4:
        result=[]
        for row in rows:
            cells=[p(f'**{headers[0]}: {row[0]}**','Card')]
            cells.extend(p(f'**{h}:** {v}','Card') for h,v in zip(headers[1:],row[1:]))
            card=Table([[x] for x in cells],colWidths=[BODY-14])
            card.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8f0f5')),('BOX',(0,0),(-1,-1),.4,colors.HexColor('#bacbd6')),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),3)]))
            result.append(KeepTogether([card,Spacer(1,8)]))
        return result
    ratios={2:[.29,.71],3:[.16,.21,.63],4:[.14,.23,.27,.36]}[len(headers)]
    data=[[p(x,'SmallText') for x in headers]]+[[p(x,'SmallText') for x in r] for r in rows]
    t=Table(data,colWidths=[BODY*x for x in ratios],repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8f0f5')),('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.3,colors.HexColor('#c1ced7')),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    return [t,Spacer(1,8)]
def markdown(rel,title,key,notice=None):
    text=read(rel);out=[heading(title,key)]
    if notice:out.append(p(notice,'Caption'))
    lines=text.splitlines();i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line:i+=1;continue
        if line.startswith('```'):
            lang=line[3:];block=[];i+=1
            while i<len(lines) and not lines[i].strip().startswith('```'):block.append(lines[i]);i+=1
            if lang=='mermaid':out.append(p('Diagram definition (complete source; actual architecture/workflow also described in prose).','SmallText'))
            out.extend([code('\n'.join(block)),Spacer(1,6)]);i+=1;continue
        if line.startswith('|') and i+1<len(lines) and re.match(r'^\|\s*[-:]',lines[i+1]):
            def cells(x):return [v.strip() for v in x.strip().strip('|').split('|')]
            headers=cells(line);rows=[];i+=2
            while i<len(lines) and lines[i].strip().startswith('|'):
                row=cells(lines[i]);assert len(row)==len(headers),(rel,row);rows.append(row);i+=1
            out.extend(table(headers,rows));continue
        h=re.match(r'^(#{1,6})\s+(.*)',line)
        if h:
            # First source title is represented by the report section title.
            if i>0:out.append(p(h[2],'Sub'))
            i+=1;continue
        if line.startswith(('- ','* ')) or re.match(r'^\d+\. ',line):out.append(p(line,'Text'));i+=1;continue
        paragraph=[line];i+=1
        while i<len(lines) and lines[i].strip() and not lines[i].lstrip().startswith(('#','|','```','- ','* ')):
            paragraph.append(lines[i].strip());i+=1
        out.append(p(' '.join(paragraph)))
    return out
def image(rel,caption,crop=None):
    path=ROOT/rel;INPUTS.add(path)
    if crop:
        original=PILImage.open(path);panel=original.crop(crop);buffer=io.BytesIO();panel.save(buffer,format='PNG');buffer.seek(0);im=Image(buffer)
    else:im=Image(str(path))
    scale=min(BODY/im.imageWidth,520/im.imageHeight);im.drawWidth=im.imageWidth*scale;im.drawHeight=im.imageHeight*scale
    return [KeepTogether([im,p(caption,'Caption')])]
def part(title,key):return [PageBreak(),heading(title,key,0)]
class Report(BaseDocTemplate):
    def __init__(self,filename):
        super().__init__(filename,pagesize=A4,leftMargin=MARGIN,rightMargin=MARGIN,topMargin=46,bottomMargin=43,title='CPE334 Deliverable 2 - Cache Me if you can',author='Lathapol Srikhiao and Kittakorn Poungpien')
        frame=Frame(MARGIN,43,BODY,HEIGHT-89,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
        self.addPageTemplates(PageTemplate('report',frames=[frame],onPage=self.footer));self.pages_by_key={}
    def footer(self,c,doc):
        c.saveState();c.setStrokeColor(colors.HexColor('#c8d4dd'));c.line(MARGIN,32,WIDTH-MARGIN,32);c.setFont('Body',7);c.setFillColor(colors.HexColor('#456276'))
        c.drawString(MARGIN,22,'CPE334 / Section 31 / EN-003_P5 / Review copy - not submitted')
        c.drawRightString(WIDTH-MARGIN,22,f'{doc.page}');c.restoreState()
    def afterFlowable(self,item):
        if hasattr(item,'_toc'):
            level,text,key=item._toc;self.canv.bookmarkPage(key);self.canv.addOutlineEntry(clean(text),key,level,False);self.notify('TOCEntry',(level,clean(text),self.page,key));self.pages_by_key[key]=self.page

def build(output):
    live=json.loads(read('docs/deliverable-2/evidence/candidate/live-verification.json'))
    reviews=json.loads(read('docs/deliverable-2/evidence/candidate/review-chains.json'))
    story=[Spacer(1,40),p('CPE 334<br/>Project Deliverable 2','Cover'),p('Sprint 2 completion and Sprint 3 progress','Section'),p('**Cache Me if you can - Theme 5: Workflow and Approval System**'),Spacer(1,15)]
    story+=table(['Student','Student ID'],[['Lathapol Srikhiao','67070503475'],['Kittakorn Poungpien','67070503401']])
    story+=[p('**Section:** 31 | **Team:** EN-003_P5 | **Prepared:** 25 November 2026 (Asia/Bangkok)'),p('**Due:** 29 November 2026,23:59 | **Assessment:**70 points (Parts A-E)'),p('**Repository:** https://github.com/Lathapol/sprint-group-work'),p('**Immutable application candidate:** '+TAG+' at '+SHA),p('**App:** https://approvals-389973748230.asia-southeast1.run.app'),p('**Deployment:** run 45650095303 / approvals-r45650095303-1 /100% traffic'),Spacer(1,10),p('**REVIEW COPY:** complete assessed documents and selected actual evidence are embedded. Team report review/approval and submission remain outstanding. This checkpoint is not full product completion or independent UAT acceptance. F-09, F-11 and verification gaps are disclosed.','Caption'),p('Source/evidence provenance: app candidate above; report generation/source manifest accompanies this PDF in the repository. Later report-only commits do not replace the identified application source. No real credentials/tokens are included.','SmallText'),PageBreak(),heading('Contents and rubric navigation','contents',0)]
    toc=TableOfContents();toc.levelStyles=[styles['TOCMain'],styles['TOCSub']];story+=[toc,Spacer(1,12),p('Rubric: A5 + B25 + C15 + D10 + E15 =70 points. Page numbers above are internal PDF navigation. Source files are reproduced below; repository links are supplementary. Historical source documents retain their original date/status wording; current completion tables supersede their then-planned status.','SmallText')]
    story+=part('Part A - Sprint 1 continuity and changes (5)','part-a')
    story+=markdown('docs/deliverable-2/continuity-register.md','A1. Complete continuity/change register','a-register')
    story+=markdown('docs/labs/lab-06/retest-60.md','A2. Case-specific independent UAT disposition','a-uat')
    story+=[p('Other partner cases and whole-product acceptance remain incomplete; this report does not sign for the partner or claim two independent student sessions from automated execution.','Caption')]
    story+=part('Part B - Completed Sprint 2 expansion (25)','part-b')
    story+=table(['Feature','AC scope','Implemented / verified / reviewed release'],[['F-06 history','AC-06-01..04','Implemented; Node/API and selected browser assertions pass; #78 reviewed, releasef9; preserved under current 0334.'],['F-07 return/resubmit','AC-07-01..05','Implemented; owner/state/reason/races and migration preservation pass; #79 reviewed, releasef9; current#20 actual saved cycle.'],['F-08 filters','AC-08-01..04','Implemented; exact sets/literals/UTC/scopes/UI retry pass; #81 reviewed, releasef9; current literal/category/state retrieval also passes.']])
    story+=markdown('docs/sprints/sprint-2/contracts.md','B1. Complete Sprint 2 contracts, AC, STS and DoD','b-contracts','Historical versioned contract text is reproduced unchanged. Its opening pending/not-run statement describes preimplementation24Nov. Contract #77 subsequently approved/merged before implementation; current status/results are in B completion, D matrix and evidence below. Inline Return panel clarification was reviewed with #79.')
    for feature in ['F06','F07','F08']:
        story+=markdown(f'docs/deliverable-2/evidence/{feature}/README.md',f'B2. {feature} genuine RED/GREEN and completion record',f'b-{feature}')
    story+=markdown('docs/deliverable-2/evidence/sprint-2-release/README.md','B3. Preserved identifiable Sprint 2 release evidence','b-release','Historical f9 evidence is retained as executed; later status paragraphs do not override current F10/candidate results. Original release tag is unchanged.')
    story+=image('docs/deliverable-2/evidence/candidate/owner-readable-full.png','B-DEMO-01a | F-06/F-07 AC06-01/AC07-03,05 | Current 0334/revision45650095303-1, owner requester1. #20 was claimed, returned with reason, edited19.25->20.50, resubmitted to same Reviewer and approved. Expected/actual saved Approved20.50. Top panel of unchanged full real screenshot; capture time in readable-ui-captures.json. [API persistence/access evidence](#e-api).',crop=(0,0,800,610))
    story+=image('docs/deliverable-2/evidence/candidate/owner-readable-full.png','B-DEMO-01b | Same #20, lower panel overlaps the previous panel. Six ordered persisted events retain the original return reason, effective edit and same-reviewer resubmit/final approval. Original full screenshot retained; panels are crops for readability, no content changed. Fresh-login resource/history reads in [Part E2](#e-api) provide independent backend evidence.',crop=(0,480,800,1315))
    story+=image('docs/deliverable-2/evidence/candidate/filters-readable.png','B-DEMO-02 | F-08 AC08-01,03,04 | Current0334/revision45650095303-1, reviewer1 Mine. Both25Nov UTC dates + Approved/Purchase/exact unique title return saved#20. Expected/actual narrowed assigned set; candidate API literal search and historical exact-set/ownership regressions independently pass. Real browser capture, no response mocks. [API evidence](#e-api); full timing/viewport metadata retained.')
    story+=part('Part C - Sprint 3 contracts and working progress (15)','part-c')
    story+=markdown('docs/sprints/sprint-3/contracts.md','C1. All remaining Sprint 3 contracts, AC, STS and DoD','c-contracts','Historical preimplementation contract text/clarifications are preserved. #77 reviewed the baseline; #85 reviewed F10 clarification. F09 remains unimplemented, F10 implemented/tested/deployed, F11 partial. Future second-stage fixtures have not run.')
    story+=markdown('docs/deliverable-2/evidence/F10/README.md','C2. F-10 genuine RED/GREEN and actual AC verification','c-tdd')
    story+=markdown('docs/deliverable-2/evidence/F10-release/README.md','C3. F-10 first working main release, independent count checks','c-release','Historical0877808 release evidence; current 0334 was independently checked again as described in Part E. Snapshot totals are time-specific, not permanent fixture counts.')
    story+=image('docs/deliverable-2/evidence/candidate/summary-readable.png',f'C-DEMO-01 | F-10 AC10-01..04 | Current 0334/revision45650095303-1, reviewer1. After two real domain decisions, expected total {live["summaryBefore"]["total"]}+2; actual {live["summaryAfter"]["total"]}. Independent authorized list/history calculation matches all state/category/final-actor totals; saved count remains after UI reload. No mocked response. [Part E2 API evidence](#e-api).')
    story+=markdown('docs/deliverable-2/finish-plan.md','C4. Explicit remaining AC, owners, dependencies and dates','c-plan')
    story+=part('Part D - Complete current baseline and results (10)','part-d')
    for rel,title,key in [('docs/srs.md','D1. Complete current SRS','d-srs'),('docs/features.md','D2. Complete feature inventory','d-features'),('docs/system-sds.md','D3. Complete System-Level SDS','d-sds'),('docs/traceability.md','D4. All-requirement and every-AC actual-result matrix','d-matrix'),('docs/deliverable-2/baseline-audit.md','D5. Baseline revisions, source provenance and gaps','d-audit')]:
        story+=markdown(rel,title,key,'Baseline v0.3 was reviewed in #88 and integrated in0334. Its runtime implementation reference0877808 is tree-identical to0334; Part E binds new candidate CI/live results to0334. No missing requirement is silently removed.')
    story+=part('Part E - Integrated candidate and readiness (15)','part-e')
    story+=markdown('docs/deliverable-2/evidence/candidate/README.md','E1. Exact current candidate, actual live results and persistence','e-candidate')
    story+=[heading('E2. Actual current API evidence and summary reconciliation','e-api')]
    story+=table(['Actor / method / path','Observed status'],[[f'{x["actor"]} {x["method"]} {x["path"]}',str(x['status'])] for x in live['calls']])
    story+=[p('Expected and actual:401 anonymous,403 forbidden role/unrelated Reviewer,404 other owner,400 invalid amount/reason, competing resubmit200/409; authorized reads200/create201. Failed responses assert data absent. Source0334 for all 59 calls; sessions not exported. Controlled old records/history compared equal before/after.','Caption'),code(json.dumps({'retainedIds':live['retainedIds'],'retainedHash':live['retainedHash'],'unchanged':live['retainedResourcesAndHistoryUnchanged'],'before':live['summaryBefore'],'after':live['summaryAfter'],'independentOracleMatches':live['independentOracleMatches']},indent=2))]
    log=read('docs/deliverable-2/evidence/candidate/ci-deployment-excerpts.log')
    display_log='\n'.join(line.split('\t',3)[-1] for line in log.splitlines())
    story+=[heading('E3. Actual build, test, Docker and deployment output','e-ci'),p('Actual selected output. Job/timestamp prefixes omitted here for readability; original prefixed lines are retained in ci-deployment-excerpts.log. No result content is rewritten.','SmallText'),code(display_log)]
    story+=[p('Actual command chain: npm ci; npx prisma generate; npx prisma migrate deploy; npm test; npx prisma db seed (isolated CI DB); npx playwright install --with-deps chromium; npm run test:e2e; docker build; existing main WIF release; migration job; smoke. Main source 0334.27 reported Node tests include parent/subtest counts, not27 unique UI scenarios;5 browser tests,0 failure/skip reported.','SmallText')]
    story+=[heading('E4. Two actual automated test excerpts','e-excerpts'),p('Excerpt1 domain rule: test/returns.test.cjs, real isolated PostgreSQL, unique Requester/Reviewer sessions, submitted/claimed fixtures. TEST-07-04 verifies duplicate resubmit and edit/resubmit locking. Exact relevant helper/assertion source follows; same assertion was RED atf1fac68 (missing endpoint) and GREEN66c5d54; current 0334 Node regression passes.','Caption')]
    returns=read('test/returns.test.cjs').splitlines();story+=[code('\n'.join(returns[8:12])),code('\n'.join(returns[21:50])),code('\n'.join(returns[129:148]))]
    story+=[p('Excerpt2 access restriction: test/summary.test.cjs. Private migrated schema; actual database sessions for Requester/Reviewer, including expired session. TEST-10-03 requires401/403 and no private data, denies forged role/scope. REDc2367f2 (missing protected endpoint), GREENa089d15/clean7b26ca2; current 0334 regression passes. Fixture/session setup and unchanged assertion follow.','Caption')]
    summary=read('test/summary.test.cjs').splitlines();story+=[code('\n'.join(summary[9:17])),code('\n'.join(summary[26:44])),code('\n'.join(summary[109:125]))]
    story+=[heading('E5. Actual Issue/PR/review and integration chains','e-reviews'),p('Selected chain1: issue#70/F07 -> contract#77 -> REDf1fac68/UI71a1008 -> implementation66c5d54 + statea86ea85 -> feature#79 -> reviewed Sprint 2 release#82 -> mainf9 -> evidence#84 -> F10/current regression. Selected chain2: issue#71/F08 -> contract#77 -> REDd81325e -> first failing implementation519c492 -> date fix f93e156 -> UI regression07a9720 -> feature#81 -> release#82 -> mainf9 -> evidence#84 -> current regression. Third progress chain #73/F10 -> #85 -> #86 ->087 -> evidence#87 -> baseline#88 -> integrated release#89 ->0334.','Text')]
    for pr in reviews:
        if pr['number'] not in [77,79,81,85,89]:continue
        story+=[p(f'**PR #{pr["number"]}: {pr["title"]}**','Sub')]
        rows=[['Author',pr['author']['login']],['Branch / base',pr['headRefName']+' -> '+pr['baseRefName']],['Created / merged (UTC)',str(pr['createdAt'])+' / '+str(pr['mergedAt'])],['Reviewed head',pr['headRefOid']],['Merge SHA',pr['mergeCommit']['oid']]]
        rows.extend([[f'Review {r["author"]["login"]} / {r["submittedAt"]}',r['state']+': '+r['body']] for r in pr['reviews']])
        story+=table(['Record','Actual GitHub value'],rows)
    story+=[p('Process limitation: actual peer approvals/merges are evidenced, but brief Approve comments do not demonstrate the substantive review discussion requested by the rubric. No discussion, student execution or acceptance is invented. Team must supply genuine substantive walkthrough/review evidence if required before submission.','Caption')]
    story+=[heading('E6. Safe setup and reproduction summary','e-setup')]
    story+=markdown('README.md','Complete repository setup and delivery guidance','e-readme','Current repository README is reproduced for self-contained setup. Its original project title refers to Sprint 1; appended sections document expanded behavior. Use only isolated local/test databases for seeds/tests. Never reset or seed deployed shared data.')
    story+=[p('Deployment summary: retain Node24/PostgreSQL18/Prisma dependencies, install/generate/build, migrate committed schema, synthetic seed locally, run app and tests. Docker multi-stage runtime is non-root; GitHub main pipeline uses WIF/Artifact Registry and migrate-before-Cloud Run. Managed private DATABASE_URL and synthetic SEED_PASSWORD are handed off privately or seeded locally. No real password/token/connection string is in this PDF. Keep deployment/repository available through grading and preserve submitted source identity.','Text')]
    story+=[heading('E7. Readiness and submission decision','e-readiness'),p('Technical integrated candidate: READY as a tested checkpoint with explicit gaps, not fully complete product. All Sprint 2 features and meaningful F10 progress are implemented/reviewed/deployed. F09 is absent; F11/performance/comprehensive usability and several verification/human acceptance tasks remain. No Lab 7 approval/handout is supplied. Planned completion dates/owners/dependencies are embedded in C4.','Text'),p('Report status: REVIEW COPY, not submitted to LEB2. Both students must check the contents/IDs, real contributions and review evidence, confirm proposed ownership and ensure this accurately represents the checkpoint before submission. Full product, final video/release and remaining acceptance are planned by 13 Dec with exams 1-11 Dec accounted for. This report does not award points or declare course acceptance.','Text')]
    story+=markdown('docs/ai_use.md','E8. Complete AI-use and responsibility declaration','e-ai')
    doc=Report(str(output));doc.multiBuild(story)
    manifest={'candidateSource':SHA,'candidateTag':TAG,'revision':'approvals-r45650095303-1','reportStatus':'review copy, not submitted','pdf':output.name,'pdfSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'sectionPages':doc.pages_by_key,'sourceHashEncoding':'UTF-8 text normalized to LF with BOM removed; binary bytes unchanged','sourceFiles':[{'path':str(x.relative_to(ROOT)).replace('\\','/'),'sha256':source_hash(x)} for x in sorted(INPUTS)],'generatorSha256':source_hash(Path(__file__))}
    output.with_suffix('.manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    return manifest
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=HERE/'output/deliverable2_sec31_EN-003_P5_REVIEW.pdf');args=parser.parse_args();args.output.parent.mkdir(parents=True,exist_ok=True);manifest=build(args.output);print(json.dumps({'pdf':str(args.output),'sectionPages':manifest['sectionPages'],'sha256':manifest['pdfSha256']},indent=2))
