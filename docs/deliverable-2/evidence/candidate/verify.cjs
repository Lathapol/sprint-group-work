// Intentional demo-only live verification: creates and RETAINS two synthetic requests.
// Never run automatically in CI or against another service. Credential is environment-only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium, expect } = require('@playwright/test');
const base = 'https://approvals-389973748230.asia-southeast1.run.app';
const source = '0334c966c396912dfaf2e309e044753f11d4e47c';
const out = __dirname, calls = [], sessions = [], captures = [];
const digest = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function main() {
  assert.ok(process.env.SEED_PASSWORD);
  const version = await (await fetch(base + '/api/version')).json();
  assert.equal(version.data.commit, source, 'Wait for exact candidate before creating fixtures');
  async function login(username) {
    const r = await fetch(base + '/api/auth/login', { method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({username,password:process.env.SEED_PASSWORD}) });
    assert.equal(r.status,200); const cookie=r.headers.get('set-cookie')?.split(';')[0]; assert.ok(cookie);
    const actor={username,cookie}; sessions.push(actor); return actor;
  }
  async function call(actor,method,url,body,status=200) {
    const r=await fetch(base+url,{method,headers:{...(actor?{cookie:actor.cookie}:{}),...(body!==undefined?{'content-type':'application/json'}:{})},
      ...(body!==undefined?{body:JSON.stringify(body)}:{})});
    const payload=await r.json(); calls.push({actor:actor?.username??'anonymous',method,path:url,status:r.status});
    assert.equal(r.status,status,method+' '+url); if(status>=400)assert.equal(payload.data,undefined); return payload.data;
  }
  const owner=await login('requester1'),other=await login('requester2'),reviewer=await login('reviewer1'),unrelated=await login('reviewer2');
  let browser;
  try {
    const old=JSON.parse(fs.readFileSync(path.join(__dirname,'../F10-release/predeploy.json'),'utf8'));
    async function retained() {
      const records=[];for(const row of old.records){const id=row.request.id;records.push({request:await call(reviewer,'GET','/api/requests/'+id),history:await call(reviewer,'GET','/api/requests/'+id+'/history')});}
      assert.deepEqual(records,old.records,'Controlled resources and full histories survive actual new deployment');return digest(records);
    }
    const retainedHash=await retained();
    await call(null,'GET','/api/requests',undefined,401);
    await call(other,'GET','/api/requests/13',undefined,404);
    await call(other,'GET','/api/requests/13/history',undefined,404);
    await call(other,'POST','/api/requests/13/claim',{},403);
    await call(other,'GET','/api/reports/summary',undefined,403);
    await call(null,'GET','/api/reports/summary',undefined,401);
    const before=await call(reviewer,'GET','/api/reports/summary');
    const stamp=new Date().toISOString();
    const fields={title:'D2 candidate original '+stamp,category:'PURCHASE',amount:'19.25',justification:'Synthetic candidate verification; no real spending.'};
    await call(owner,'POST','/api/requests',{...fields,amount:'0'},400);
    const first=await call(owner,'POST','/api/requests',fields,201),p='/api/requests/'+first.id;
    await call(reviewer,'POST',p+'/claim',{});
    await call(reviewer,'POST',p+'/reject',{reason:' '},400);
    await call(reviewer,'POST',p+'/reject',{reason:'Synthetic budget rejection'});
    const final1=await call(owner,'GET',p);assert.equal(final1.state,'REJECTED');
    const history1=await call(owner,'GET',p+'/history');assert.equal(history1.length,3);
    const second=await call(owner,'POST','/api/requests',{...fields,title:'D2 candidate returned '+stamp,justification:'Candidate literal 100%_\\ evidence'},201),q='/api/requests/'+second.id;
    await call(reviewer,'POST',q+'/claim',{});
    await call(reviewer,'POST',q+'/return',{reason:' '},400);
    await call(reviewer,'POST',q+'/return',{reason:'Synthetic receipt correction'});
    await call(other,'PATCH',q,{amount:'20.50'},404);
    await call(owner,'PATCH',q,{amount:'0'},400);
    await call(owner,'PATCH',q,{amount:'20.50'});
    const contenders=await Promise.all([0,1].map(()=>fetch(base+q+'/resubmit',{method:'POST',headers:{cookie:owner.cookie,'content-type':'application/json'},body:'{}'})));
    assert.deepEqual(contenders.map(r=>r.status).sort(),[200,409]);
    for(const r of contenders)calls.push({actor:owner.username,method:'POST',path:q+'/resubmit',status:r.status});
    const resubmitted=await call(owner,'GET',q);assert.equal(resubmitted.state,'IN_REVIEW');assert.equal(resubmitted.reviewerId,first.reviewerId??(await call(reviewer,'GET',p)).reviewerId);
    await call(unrelated,'POST',q+'/approve',{},403);
    await call(reviewer,'POST',q+'/approve',{});
    const fresh=await login('requester1'),final2=await call(fresh,'GET',q),history2=await call(fresh,'GET',q+'/history');
    assert.equal(final2.state,'APPROVED');assert.equal(Number(final2.amount),20.5);assert.equal(history2.length,6);
    const found=await call(owner,'GET','/api/requests?state=APPROVED&category=PURCHASE&q='+encodeURIComponent('Candidate literal 100%_\\'));
    assert.ok(found.some(r=>r.id===second.id));
    const after=await call(reviewer,'GET','/api/reports/summary');assert.equal(after.total,before.total+2);
    // Independent oracle from stable authorized list + terminal history, not report SQL.
    const inventory=await call(reviewer,'GET','/api/requests'),byState={},byCategory={},actors={};let unattributed=0;
    for(const row of after.byState)byState[row.state]=0;for(const row of after.byCategory)byCategory[row.category]=0;
    for(const row of inventory){byState[row.state]++;byCategory[row.category]++;
      if(['APPROVED','REJECTED'].includes(row.state)){
        const events=await call(reviewer,'GET','/api/requests/'+row.id+'/history');
        const event=events.filter(e=>e.toState===row.state&&e.fromState!==e.toState).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||b.id-a.id)[0];
        if(!event||event.actor.role!=='REVIEWER')unattributed++;else{const a=actors[event.actor.id]??={reviewer:{id:event.actor.id,username:event.actor.username},approved:0,rejected:0,total:0};a[row.state==='APPROVED'?'approved':'rejected']++;a.total++;}
      }
    }
    assert.equal(digest(await call(reviewer,'GET','/api/requests')),digest(inventory),'Inventory stable during independent oracle');
    assert.equal(after.total,inventory.length);assert.deepEqual(Object.fromEntries(after.byState.map(r=>[r.state,r.count])),byState);
    assert.deepEqual(Object.fromEntries(after.byCategory.map(r=>[r.category,r.count])),byCategory);
    assert.deepEqual(after.byReviewer,Object.values(actors).sort((a,b)=>a.reviewer.id-b.reviewer.id));assert.equal(after.unattributedDecisions,unattributed);
    assert.deepEqual(await call(reviewer,'GET','/api/reports/summary'),after);
    assert.equal(await retained(),retainedHash);
    // Headless browser capture touches no desktop/second monitor and mocks no response.
    browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:1000}});const page=await context.newPage();
    async function signIn(username){await page.goto(base+'/');await page.getByLabel('Username',{exact:true}).fill(username);await page.getByLabel('Password',{exact:true}).fill(process.env.SEED_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();}
    async function capture(name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});fs.writeFileSync(path.join(out,name+'.txt'),await page.locator('body').innerText());captures.push({name,observedAt:new Date().toISOString(),url:page.url()});}
    await signIn('requester1');await page.goto(base+'/requests/'+second.id);await expect(page.getByRole('heading',{name:final2.title,exact:true})).toBeVisible();await expect(page.getByRole('region',{name:'Request history',exact:true})).toContainText('Synthetic receipt correction');await capture('candidate-returned-history');
    await page.getByRole('button',{name:'Sign out',exact:true}).click();await signIn('reviewer1');await page.goto(base+'/summary');await expect(page.getByTestId('summary-total')).toHaveText(String(after.total));await capture('candidate-summary');await page.reload();await expect(page.getByTestId('summary-total')).toHaveText(String(after.total));
    await page.getByRole('button',{name:'Sign out',exact:true}).click();await context.close();
    fs.writeFileSync(path.join(out,'live-verification.json'),JSON.stringify({observedAt:new Date().toISOString(),kind:'Agent-executed developer checks, not independent UAT',source,base,calls,retainedIds:[13,16,17],retainedHash,retainedResourcesAndHistoryUnchanged:true,original:{request:final1,history:history1},returned:{request:final2,history:history2},summaryBefore:before,summaryAfter:after,independentOracleMatches:true,captures,noResetReseedOrDeletion:true},null,2));
    console.log(JSON.stringify({source,apiCalls:calls.length,ids:[first.id,second.id],historyLengths:[history1.length,history2.length],retainedHash,summaryTotal:after.total,captures:captures.length,result:'PASS'}));
  } finally {if(browser)await browser.close();for(const actor of sessions)await fetch(base+'/api/auth/logout',{method:'POST',headers:{cookie:actor.cookie,'content-type':'application/json'},body:'{}'});}
}
main().catch(e=>{console.error('Candidate verification failed:',e.name,e.message.replaceAll(process.env.SEED_PASSWORD??'DO_NOT_MATCH','[redacted]'));process.exitCode=1;});
