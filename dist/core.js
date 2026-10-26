export function fail(code,vars={}){const e=Error(code);Object.assign(e,vars);throw e;}
export function dateDay(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number(s.slice(0,4))<1000)fail('dateError');const n=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==s)fail('dateError');return n/86400000;}
export function decimal(s,digits,max=999999999999n){s=String(s).trim();if(s.length>30)fail('largeError');if(!/^\d+(?:\.\d+)?$/.test(s))fail('numberError');const [whole,frac='']=s.split('.');if(frac.length>digits)fail('precisionError',{n:digits});const n=BigInt(whole)*10n**BigInt(digits)+BigInt(frac.padEnd(digits,'0')||'0');if(n>max*10n**BigInt(digits))fail('largeError');return n;}
export function money(n,digits){const sign=n<0n?'-':'';n=n<0n?-n:n;if(!digits)return sign+String(n);const s=String(n).padStart(digits+1,'0');return sign+s.slice(0,-digits)+'.'+s.slice(-digits);}
export function allocate(total,weights){const sum=weights.reduce((a,b)=>a+b,0n);if(sum<=0n)fail('zeroWeight');const shares=weights.map(w=>total*w/sum);let left=total-shares.reduce((a,b)=>a+b,0n);const order=weights.map((w,i)=>({i,remainder:total*w%sum})).sort((a,b)=>a.remainder===b.remainder?a.i-b.i:a.remainder>b.remainder?-1:1);for(const item of order){if(left<=0n)break;shares[item.i]++;left--;}return shares;}
export function settle({start,end,decimals,people,expenses}){
 if(![0,2,3].includes(decimals))fail('precisionChoice');const a=dateDay(start),b=dateDay(end);if(b<a||b-a>3660)fail('periodError');if(!people.length||people.length>12)fail('peopleLimit');if(!expenses.length||expenses.length>40)fail('expenseLimit');
 const names=new Set();const members=people.map((p,i)=>{const name=p.name.trim();if(!name||name.length>60||names.has(name))fail('nameError',{n:i+1});names.add(name);const from=dateDay(p.start||start),to=dateDay(p.end||end);if(to<from)fail('memberDate',{n:i+1});const days=Math.max(0,Math.min(to,b)-Math.max(from,a)+1);return {name,days,area:decimal(p.area,3,1000000n),usage:decimal(p.usage,3,1000000n),weight:decimal(p.weight,3,1000000n),paid:0n,due:0n};});
 const details=[];let total=0n;
 expenses.forEach((e,i)=>{if(!e.label.trim()||e.label.length>120)fail('labelError',{n:i+1});const amount=decimal(e.amount,decimals);if(amount<=0n)fail('positiveAmount',{n:i+1});const payer=Number(e.payer);if(!Number.isInteger(payer)||!members[payer])fail('payerError',{n:i+1});let weights;
 if(e.rule==='personal'){const person=Number(e.person);if(!Number.isInteger(person)||!members[person])fail('personError',{n:i+1});weights=members.map((_,j)=>j===person?1n:0n);}
 else if(e.rule==='days')weights=members.map(p=>BigInt(p.days));
 else if(e.rule==='area')weights=members.map(p=>p.area*BigInt(p.days));
 else if(e.rule==='usage')weights=members.map(p=>p.days?p.usage:0n);
 else if(e.rule==='weight')weights=members.map(p=>p.days?p.weight:0n);
 else fail('ruleError');
 const shares=allocate(amount,weights);members[payer].paid+=amount;members.forEach((p,j)=>p.due+=shares[j]);total+=amount;details.push({label:e.label,amount,payer,rule:e.rule,shares});});
 members.forEach(p=>p.balance=p.paid-p.due);const debts=members.map((p,i)=>({i,n:p.balance<0n?-p.balance:0n})).filter(p=>p.n),credits=members.map((p,i)=>({i,n:p.balance>0n?p.balance:0n})).filter(p=>p.n);const transfers=[];let x=0,y=0;while(x<debts.length&&y<credits.length){const amount=debts[x].n<credits[y].n?debts[x].n:credits[y].n;transfers.push({from:debts[x].i,to:credits[y].i,amount});debts[x].n-=amount;credits[y].n-=amount;if(!debts[x].n)x++;if(!credits[y].n)y++;}
 return {members,details,total,transfers,decimals,balanceSum:members.reduce((n,p)=>n+p.balance,0n)};
}
export function csv(rows){return rows.map(row=>row.map(v=>{let s=String(v);if(/^[\s]*[=+\-@＝＋－＠]/u.test(s)||/^[\r\n\t]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
