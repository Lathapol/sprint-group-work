// Read-only business-data capture at a narrower viewport for readable PDF panels.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,expect}=require('@playwright/test');
async function main(){
 const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'live-verification.json'),'utf8'));
 const version=await(await fetch(baseline.base+'/api/version')).json();assert.equal(version.data.commit,baseline.source);
 assert.ok(process.env.SEED_PASSWORD);const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:800,height:900}}),page=await context.newPage();
 const captures=[];
 async function login(username){await page.goto(baseline.base);await page.getByLabel('Username',{exact:true}).fill(username);await page.getByLabel('Password',{exact:true}).fill(process.env.SEED_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();}
 async function save(name){await page.screenshot({path:path.join(__dirname,name+'.png'),fullPage:true});captures.push({name,time:new Date().toISOString(),url:page.url(),width:800});}
 try{
  await login('requester1');await page.goto(baseline.base+'/requests/'+baseline.returned.request.id);
  await expect(page.getByRole('region',{name:'Request history',exact:true})).toContainText('Synthetic receipt correction');await save('owner-readable-full');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await login('reviewer1');await page.goto(baseline.base+'/summary');
  await expect(page.getByTestId('summary-total')).toHaveText(String(baseline.summaryAfter.total));await save('summary-readable');
  await page.goto(baseline.base+'/');await page.getByRole('button',{name:'Mine',exact:true}).click();
  await page.getByLabel('Filter state',{exact:true}).selectOption('APPROVED');await page.getByLabel('Filter category',{exact:true}).selectOption('PURCHASE');
  await page.getByLabel('Search title or justification',{exact:true}).fill(baseline.returned.request.title);
  const day=baseline.returned.request.createdAt.slice(0,10);await page.getByLabel('Created from (UTC)',{exact:true}).fill(day);await page.getByLabel('Created through (UTC)',{exact:true}).fill(day);
  await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByRole('link',{name:baseline.returned.request.title,exact:true})).toBeVisible();
  await save('filters-readable');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  fs.writeFileSync(path.join(__dirname,'readable-ui-captures.json'),JSON.stringify({source:baseline.source,captures,kind:'Real browser, no mocks, no business-data mutation'},null,2));
  console.log('Readable UI captures PASS; signed out.');
 }finally{await context.close();await browser.close();}
}
main().catch(()=>{console.error('Read-only UI capture failed; credential omitted.');process.exitCode=1;});
