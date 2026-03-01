
const STORAGE_KEY="fxJournalTradesV3",BALANCE_KEY="fxJournalStartingBalanceV3",MAX_RISK_RULE_KEY="fxJournalMaxRiskRuleV1",BACKUP_KEY="fxJournalBackupsV1",THEME_KEY="fxJournalThemeV1";
const els={tabs:document.querySelectorAll("[data-nav]"),views:document.querySelectorAll("[data-view]"),homeNavCards:document.querySelectorAll("[data-home-nav]"),form:document.getElementById("tradeForm"),tradeId:document.getElementById("tradeId"),formTitle:document.getElementById("formTitle"),submitBtn:document.getElementById("submitBtn"),resetBtn:document.getElementById("resetBtn"),direction:document.getElementById("direction"),segmentButtons:document.querySelectorAll("[data-direction]"),screenshot:document.getElementById("screenshot"),screenshotPreview:document.getElementById("screenshotPreview"),statusBar:document.getElementById("statusBar"),toast:document.getElementById("toast"),quickAddBtn:document.getElementById("quickAddBtn"),themeToggle:document.getElementById("themeToggle"),installBtn:document.getElementById("installBtn"),startingBalance:document.getElementById("startingBalance"),maxRiskRule:document.getElementById("maxRiskRule"),saveBalanceBtn:document.getElementById("saveBalanceBtn"),todayBadge:document.getElementById("todayBadge"),tradesCountBadge:document.getElementById("tradesCountBadge"),netBadge:document.getElementById("netBadge"),searchText:document.getElementById("searchText"),fromDate:document.getElementById("fromDate"),toDate:document.getElementById("toDate"),filterAsset:document.getElementById("filterAsset"),filterDirection:document.getElementById("filterDirection"),filterStrategy:document.getElementById("filterStrategy"),filterMarket:document.getElementById("filterMarket"),filterWeekday:document.getElementById("filterWeekday"),filterHour:document.getElementById("filterHour"),sortBy:document.getElementById("sortBy"),tradesBody:document.getElementById("tradesBody"),tradesCards:document.getElementById("tradesCards"),stats:document.getElementById("stats"),statCardTpl:document.getElementById("statCardTpl"),equityChart:document.getElementById("equityChart"),monthlyChart:document.getElementById("monthlyChart"),assetChart:document.getElementById("assetChart"),strategyChart:document.getElementById("strategyChart"),emotionChart:document.getElementById("emotionChart"),riskChart:document.getElementById("riskChart"),advancedInsights:document.getElementById("advancedInsights"),riskSummary:document.getElementById("riskSummary"),mistakeStats:document.getElementById("mistakeStats"),homeTradesCount:document.getElementById("homeTradesCount"),homeWinRate:document.getElementById("homeWinRate"),homeNetPnl:document.getElementById("homeNetPnl"),riskAmountView:document.getElementById("riskAmountView"),pnlView:document.getElementById("pnlView"),plannedRRView:document.getElementById("plannedRRView"),actualRRView:document.getElementById("actualRRView"),returnPctLabel:document.getElementById("returnPctLabel"),moveLabel:document.getElementById("moveLabel"),rMultipleLabel:document.getElementById("rMultipleLabel"),rrTargetLabel:document.getElementById("rrTargetLabel"),riskAlertLabel:document.getElementById("riskAlertLabel"),exportJsonBtn:document.getElementById("exportJsonBtn"),exportCsvBtn:document.getElementById("exportCsvBtn"),exportExcelBtn:document.getElementById("exportExcelBtn"),downloadBackupBtn:document.getElementById("downloadBackupBtn"),restoreBackupBtn:document.getElementById("restoreBackupBtn"),backupStatus:document.getElementById("backupStatus"),importBtn:document.getElementById("importBtn"),importInput:document.getElementById("importInput"),clearAllBtn:document.getElementById("clearAllBtn")};
const formIds=["entryDate","asset","assetType","direction","entryPrice","stopLoss","takeProfit","exitPrice","positionSize","riskPercent","strategy","marketCondition","emotionBefore","emotionAfter","discipline","notes"];
let trades=loadTrades(),startingBalance=loadStartingBalance(),maxRiskRule=loadMaxRiskRule(),theme=loadTheme(),screenshotDataUrl="",installPromptEvent=null,swReloadTriggered=false;
init();
function init(){applyTheme();fillHourFilter();els.startingBalance.value=String(startingBalance);els.maxRiskRule.value=String(maxRiskRule);els.todayBadge.textContent=`היום: ${new Date().toLocaleDateString("he-IL")}`;setDefaultForm();bindEvents();setupPwa();refreshCalculationPreview();refreshUI()}
function bindEvents(){els.tabs.forEach((b)=>b.addEventListener("click",()=>activateView(b.dataset.nav||"home")));els.homeNavCards.forEach((b)=>b.addEventListener("click",()=>activateView(b.dataset.homeNav||"home")));els.segmentButtons.forEach((b)=>b.addEventListener("click",()=>setDirection(b.dataset.direction||"Long")));els.form.addEventListener("submit",onSubmit);els.resetBtn.addEventListener("click",resetForm);els.saveBalanceBtn.addEventListener("click",saveRiskSettings);els.screenshot.addEventListener("change",onScreenshotChange);els.quickAddBtn.addEventListener("click",()=>{activateView("journal");document.getElementById("asset").focus()});els.themeToggle.addEventListener("click",toggleTheme);els.installBtn.addEventListener("click",installApp);formIds.forEach((id)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener("input",refreshCalculationPreview);el.addEventListener("change",refreshCalculationPreview)});document.querySelectorAll(".mistake").forEach((m)=>m.addEventListener("change",refreshCalculationPreview));document.getElementById("followedPlan").addEventListener("change",refreshCalculationPreview);[els.searchText,els.fromDate,els.toDate,els.filterAsset,els.filterDirection,els.filterStrategy,els.filterMarket,els.filterWeekday,els.filterHour,els.sortBy].forEach((el)=>{el.addEventListener("input",refreshUI);el.addEventListener("change",refreshUI)});els.exportJsonBtn.addEventListener("click",exportJson);els.exportCsvBtn.addEventListener("click",exportCsv);els.exportExcelBtn.addEventListener("click",exportExcel);els.downloadBackupBtn.addEventListener("click",downloadLatestBackup);els.restoreBackupBtn.addEventListener("click",restoreLatestBackup);els.importBtn.addEventListener("click",()=>els.importInput.click());els.importInput.addEventListener("change",importData);els.clearAllBtn.addEventListener("click",clearAllData)}
function fillHourFilter(){for(let h=0;h<24;h+=1){const o=document.createElement("option");o.value=String(h);o.textContent=`${String(h).padStart(2,"0")}:00`;els.filterHour.appendChild(o)}}
function activateView(view){els.tabs.forEach((t)=>t.classList.toggle("active",t.dataset.nav===view));els.views.forEach((s)=>s.classList.toggle("active",s.dataset.view===view))}
function setDirection(direction){const nrm=normalizeDirection(direction);els.direction.value=nrm;els.segmentButtons.forEach((b)=>b.classList.toggle("active",b.dataset.direction===nrm))}
function setDefaultForm(){document.getElementById("entryDate").value=toLocalDateTime(new Date());document.getElementById("discipline").value="3";document.getElementById("emotionBefore").value="ניטרלי";document.getElementById("emotionAfter").value="ניטרלי";document.getElementById("assetType").value="פורקס";setDirection("Long");clearScreenshotPreview()}
function readForm(){const d={};formIds.forEach((id)=>{d[id]=document.getElementById(id).value});d.direction=normalizeDirection(d.direction);d.followedPlan=document.getElementById("followedPlan").checked;d.mistakes=[...document.querySelectorAll(".mistake:checked")].map((x)=>x.value);d.screenshot=screenshotDataUrl;return d}
function onScreenshotChange(event){const f=event.target.files?.[0];if(!f)return clearScreenshotPreview();const r=new FileReader();r.onload=()=>{screenshotDataUrl=String(r.result||"");if(!screenshotDataUrl)return clearScreenshotPreview();els.screenshotPreview.src=screenshotDataUrl;els.screenshotPreview.classList.remove("hidden")};r.readAsDataURL(f)}
function clearScreenshotPreview(){screenshotDataUrl="";els.screenshot.value="";els.screenshotPreview.src="";els.screenshotPreview.classList.add("hidden")}
function refreshCalculationPreview(){const d=readForm();const m=calculateMetrics({direction:d.direction,asset:d.asset,assetType:d.assetType,entryPrice:d.entryPrice,stopLoss:d.stopLoss,takeProfit:d.takeProfit,exitPrice:d.exitPrice,positionSize:d.positionSize,balance:startingBalance});els.riskAmountView.value=fmtMoney(m.riskAmount);els.pnlView.value=fmtMoney(m.pnl);els.plannedRRView.value=fmtNum(m.plannedRR,2);els.actualRRView.value=fmtNum(m.actualRR,2);els.returnPctLabel.textContent=`${fmtNum(m.returnPct,2)}%`;els.moveLabel.textContent=m.moveLabel;els.rMultipleLabel.textContent=fmtNum(m.rMultiple,2);els.rrTargetLabel.textContent=m.hitPlannedRR?"כן":"לא";const v=m.riskPct>maxRiskRule;els.riskAlertLabel.textContent=v?`חריגה (${fmtNum(m.riskPct,2)}%)`:"תקין";els.riskAlertLabel.className=v?"bad":"good"}
function calculateMetrics(i0){const dir=normalizeDirection(i0.direction),entry=n(i0.entryPrice),stop=n(i0.stopLoss),take=n(i0.takeProfit),exit=n(i0.exitPrice),size=n(i0.positionSize),bal=n(i0.balance),asset=String(i0.asset||""),type=String(i0.assetType||"פורקס");if([entry,stop,take,exit,size].some((x)=>Number.isNaN(x)))return zeroMetrics();const riskUnit=Math.abs(entry-stop),plannedReward=dir==="Long"?take-entry:entry-take,actualMove=dir==="Long"?exit-entry:entry-exit,riskAmount=riskUnit*size,pnl=actualMove*size,plannedRR=riskUnit>0?plannedReward/riskUnit:0,actualRR=riskUnit>0?actualMove/riskUnit:0,returnPct=bal>0?(pnl/bal)*100:0,riskPct=bal>0?(riskAmount/bal)*100:0,movePercent=entry?(actualMove/entry)*100:0,movePips=type==="פורקס"?actualMove*(asset.includes("JPY")?100:10000):0,moveLabel=type==="פורקס"?`${fmtNum(movePips,1)} pips`:`${fmtNum(movePercent,2)}%`,rMultiple=riskAmount>0?pnl/riskAmount:0;return{riskAmount,pnl,plannedRR,actualRR,returnPct,riskPct,movePercent,movePips,moveLabel,rMultiple,hitPlannedRR:plannedRR>0?actualRR>=plannedRR:actualRR>0}}
function zeroMetrics(){return{riskAmount:0,pnl:0,plannedRR:0,actualRR:0,returnPct:0,riskPct:0,movePercent:0,movePips:0,moveLabel:"0",rMultiple:0,hitPlannedRR:false}}
function onSubmit(event){event.preventDefault();const t=collectTrade();if(!t)return;if(els.tradeId.value){const i=trades.findIndex((x)=>x.id===els.tradeId.value);if(i>=0)trades[i]=t}else trades.push(t);persistAll();resetForm();refreshUI();flash("העסקה נשמרה")}
function collectTrade(){const d=readForm();const m=calculateMetrics({direction:d.direction,asset:d.asset,assetType:d.assetType,entryPrice:d.entryPrice,stopLoss:d.stopLoss,takeProfit:d.takeProfit,exitPrice:d.exitPrice,positionSize:d.positionSize,balance:startingBalance});const req=[d.entryDate,d.asset,d.entryPrice,d.stopLoss,d.takeProfit,d.exitPrice,d.positionSize];if(req.some((x)=>String(x??"").trim()==="")){alert("יש למלא את כל שדות העסקה הראשיים.");return null}return{id:els.tradeId.value||createId(),entryDate:d.entryDate,asset:String(d.asset).trim().toUpperCase(),assetType:d.assetType,direction:d.direction,entryPrice:n(d.entryPrice),stopLoss:n(d.stopLoss),takeProfit:n(d.takeProfit),exitPrice:n(d.exitPrice),positionSize:n(d.positionSize),riskPercentPlan:Math.max(0,n(d.riskPercent)||0),riskAmount:m.riskAmount,pnl:m.pnl,returnPct:m.returnPct,plannedRR:m.plannedRR,actualRR:m.actualRR,movePips:m.movePips,movePercent:m.movePercent,rMultiple:m.rMultiple,strategy:String(d.strategy||"").trim(),marketCondition:String(d.marketCondition||""),emotionBefore:String(d.emotionBefore||"ניטרלי"),emotionAfter:String(d.emotionAfter||"ניטרלי"),followedPlan:Boolean(d.followedPlan),discipline:clamp(i(d.discipline),1,5),mistakes:d.mistakes,notes:String(d.notes||"").trim(),screenshot:d.screenshot||"",updatedAt:new Date().toISOString()}}
function resetForm(){els.form.reset();els.tradeId.value="";els.formTitle.textContent="עסקה חדשה";els.submitBtn.textContent="שמירת עסקה";document.querySelectorAll(".mistake").forEach((m)=>{m.checked=false});setDefaultForm();refreshCalculationPreview()}
function loadTradeToForm(id){const t=trades.find((x)=>x.id===id);if(!t)return;els.tradeId.value=t.id;document.getElementById("entryDate").value=t.entryDate||"";document.getElementById("asset").value=t.asset||"";document.getElementById("assetType").value=t.assetType||"פורקס";setDirection(t.direction||"Long");document.getElementById("entryPrice").value=String(t.entryPrice??"");document.getElementById("stopLoss").value=String(t.stopLoss??"");document.getElementById("takeProfit").value=String(t.takeProfit??"");document.getElementById("exitPrice").value=String(t.exitPrice??"");document.getElementById("positionSize").value=String(t.positionSize??"");document.getElementById("riskPercent").value=String(t.riskPercentPlan??"");document.getElementById("strategy").value=t.strategy||"";document.getElementById("marketCondition").value=t.marketCondition||"";document.getElementById("emotionBefore").value=t.emotionBefore||"ניטרלי";document.getElementById("emotionAfter").value=t.emotionAfter||"ניטרלי";document.getElementById("discipline").value=String(t.discipline??3);document.getElementById("followedPlan").checked=!!t.followedPlan;document.getElementById("notes").value=t.notes||"";const set=new Set(t.mistakes||[]);document.querySelectorAll(".mistake").forEach((m)=>{m.checked=set.has(m.value)});if(t.screenshot){screenshotDataUrl=t.screenshot;els.screenshotPreview.src=t.screenshot;els.screenshotPreview.classList.remove("hidden")}else clearScreenshotPreview();els.formTitle.textContent="עריכת עסקה";els.submitBtn.textContent="עדכון עסקה";activateView("journal");refreshCalculationPreview()}
function deleteTrade(id){if(!confirm("למחוק עסקה?"))return;trades=trades.filter((t)=>t.id!==id);persistAll();refreshUI();flash("עסקה נמחקה")}
function saveRiskSettings(){const b=n(els.startingBalance.value),m=n(els.maxRiskRule.value);if(Number.isNaN(b)||b<0||Number.isNaN(m)||m<=0){alert("הזן הון וסיכון מקסימלי תקינים.");return}startingBalance=b;maxRiskRule=m;persistAll();refreshCalculationPreview();refreshUI();flash("הגדרות נשמרו")}
function persistAll(){localStorage.setItem(STORAGE_KEY,JSON.stringify(trades));localStorage.setItem(BALANCE_KEY,String(startingBalance));localStorage.setItem(MAX_RISK_RULE_KEY,String(maxRiskRule));saveAutoBackup()}
function refreshUI(){const v=filteredTrades();renderStats(v);renderTradeList(v);renderDashboard(v);renderAdvanced(v);updateBadges();updateHome();updateBackupStatus()}
function filteredTrades(){const search=els.searchText.value.trim().toLowerCase(),from=els.fromDate.value?new Date(`${els.fromDate.value}T00:00:00`):null,to=els.toDate.value?new Date(`${els.toDate.value}T23:59:59`):null,asset=els.filterAsset.value.trim().toLowerCase(),direction=els.filterDirection.value,strategy=els.filterStrategy.value.trim().toLowerCase(),market=els.filterMarket.value,weekday=els.filterWeekday.value,hour=els.filterHour.value,sort=els.sortBy.value;const out=trades.filter((t)=>{const dt=new Date(t.entryDate),txt=[t.asset,t.strategy,t.notes].join(" ").toLowerCase();if(search&&!txt.includes(search))return false;if(from&&dt<from)return false;if(to&&dt>to)return false;if(asset&&!String(t.asset||"").toLowerCase().includes(asset))return false;if(direction&&t.direction!==direction)return false;if(strategy&&!String(t.strategy||"").toLowerCase().includes(strategy))return false;if(market&&t.marketCondition!==market)return false;if(weekday&&dt.getDay()!==Number(weekday))return false;if(hour&&dt.getHours()!==Number(hour))return false;return true});out.sort((a,b)=>{if(sort==="entryDateAsc")return new Date(a.entryDate)-new Date(b.entryDate);if(sort==="entryDateDesc")return new Date(b.entryDate)-new Date(a.entryDate);if(sort==="pnlAsc")return(a.pnl||0)-(b.pnl||0);if(sort==="pnlDesc")return(b.pnl||0)-(a.pnl||0);if(sort==="rDesc")return(b.rMultiple||0)-(a.rMultiple||0);return 0});return out}
function renderTradeList(list){els.tradesBody.innerHTML="";els.tradesCards.innerHTML="";if(!list.length){const tr=document.createElement("tr");tr.innerHTML='<td colspan="8">אין עסקאות להצגה</td>';els.tradesBody.appendChild(tr);const c=document.createElement("article");c.className="trade-card";c.textContent="אין עסקאות להצגה";els.tradesCards.appendChild(c);return}list.forEach((t)=>{const tr=document.createElement("tr");tr.innerHTML=`<td>${fmtDate(t.entryDate)}</td><td class="mono">${escapeHtml(t.asset)}</td><td>${directionLabel(t.direction)}</td><td>${escapeHtml(t.strategy||"-")}</td><td>${fmtMoney(t.riskAmount||0)}</td><td class="${(t.pnl||0)>=0?"good":"bad"}">${fmtMoney(t.pnl||0)}</td><td>${fmtNum(t.rMultiple||0,2)}</td><td><button data-edit="${t.id}" type="button">עריכה</button> <button data-del="${t.id}" class="danger" type="button">מחיקה</button></td>`;tr.querySelector("[data-edit]").addEventListener("click",()=>loadTradeToForm(t.id));tr.querySelector("[data-del]").addEventListener("click",()=>deleteTrade(t.id));els.tradesBody.appendChild(tr);const card=document.createElement("article");card.className="trade-card";card.innerHTML=`<div class="trade-head"><strong class="mono">${escapeHtml(t.asset)}</strong><span class="${(t.pnl||0)>=0?"good":"bad"}">${fmtMoney(t.pnl||0)}</span></div><div class="trade-meta"><span>${fmtDate(t.entryDate)} | ${directionLabel(t.direction)}</span><span>אסטרטגיה: ${escapeHtml(t.strategy||"-")} | R: ${fmtNum(t.rMultiple||0,2)}</span><span>מצב שוק: ${escapeHtml(t.marketCondition||"-")} | משמעת: ${t.discipline||0}/5</span></div><div class="trade-actions"><button data-ce="${t.id}" type="button">עריכה</button><button data-cd="${t.id}" class="danger" type="button">מחיקה</button></div>`;card.querySelector("[data-ce]").addEventListener("click",()=>loadTradeToForm(t.id));card.querySelector("[data-cd]").addEventListener("click",()=>deleteTrade(t.id));els.tradesCards.appendChild(card)})}
function renderStats(list){const total=list.length,wins=list.filter((t)=>(t.pnl||0)>0),losses=list.filter((t)=>(t.pnl||0)<0),grossProfit=sum(wins.map((t)=>t.pnl||0)),grossLoss=Math.abs(sum(losses.map((t)=>t.pnl||0))),net=sum(list.map((t)=>t.pnl||0)),winRate=total?(wins.length/total)*100:0,avgWin=wins.length?grossProfit/wins.length:0,avgLoss=losses.length?sum(losses.map((t)=>t.pnl||0))/losses.length:0,expectancy=total?net/total:0,pf=grossLoss>0?grossProfit/grossLoss:grossProfit>0?Infinity:0;const items=[["עסקאות",String(total)],["אחוז הצלחה",`${fmtNum(winRate,1)}%`],["ממוצע רווח לעסקה",fmtMoney(avgWin)],["ממוצע הפסד לעסקה",fmtMoney(avgLoss)],["Expectancy",fmtMoney(expectancy)],["Profit Factor",Number.isFinite(pf)?fmtNum(pf,2):"∞"],["סך רווחים",fmtMoney(grossProfit)],["סך הפסדים",fmtMoney(-grossLoss)],["רווח נקי",fmtMoney(net)]];els.stats.innerHTML="";items.forEach(([k,v])=>{const card=els.statCardTpl.content.firstElementChild.cloneNode(true);card.querySelector("h3").textContent=k;const p=card.querySelector("p");p.textContent=v;if(k==="רווח נקי")p.className=net>=0?"good":"bad";if(k==="ממוצע רווח לעסקה"||k==="סך רווחים")p.className="good";if(k==="ממוצע הפסד לעסקה"||k==="סך הפסדים")p.className="bad";els.stats.appendChild(card)})}
function renderDashboard(list){drawEquity(list);drawMonthly(list);drawByKey(list,"asset",els.assetChart);drawByKey(list,"strategy",els.strategyChart,"ללא");drawEmotion(list)}
function drawEquity(list){const ordered=[...list].sort((a,b)=>new Date(a.entryDate)-new Date(b.entryDate));const points=[startingBalance];let eq=startingBalance;ordered.forEach((t)=>{eq+=t.pnl||0;points.push(eq)});drawLineChart(els.equityChart,points,"#0a84ff")}
function drawMonthly(list){const map=new Map();list.forEach((t)=>{const d=new Date(t.entryDate);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;map.set(key,(map.get(key)||0)+(t.pnl||0))});const rows=[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).slice(-8);drawBarChart(els.monthlyChart,rows.map((r)=>r[0].slice(2)),rows.map((r)=>r[1]))}
function drawByKey(list,key,canvas,fallback="-"){const map=new Map();list.forEach((t)=>{const k=String(t[key]||fallback);map.set(k,(map.get(k)||0)+(t.pnl||0))});const rows=[...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);drawBarChart(canvas,rows.map((r)=>r[0]),rows.map((r)=>r[1]))}
function drawEmotion(list){const map=new Map();list.forEach((t)=>{const k=t.emotionBefore||"ניטרלי";if(!map.has(k))map.set(k,{pnl:0,count:0});const row=map.get(k);row.pnl+=t.pnl||0;row.count+=1});const rows=[...map.entries()].map(([k,v])=>[k,v.count?v.pnl/v.count:0]).sort((a,b)=>b[1]-a[1]);drawBarChart(els.emotionChart,rows.map((x)=>x[0]),rows.map((x)=>x[1]))}
function renderAdvanced(list){const byHour=new Map(),byStrategy=new Map(),mistakeMap=new Map();list.forEach((t)=>{const h=new Date(t.entryDate).getHours();byHour.set(h,(byHour.get(h)||0)+(t.pnl||0));const s=t.strategy||"ללא";byStrategy.set(s,(byStrategy.get(s)||0)+(t.pnl||0));(t.mistakes||[]).forEach((m)=>mistakeMap.set(m,(mistakeMap.get(m)||0)+1))});const topHours=[...byHour.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3),bestStrategy=[...byStrategy.entries()].sort((a,b)=>b[1]-a[1])[0],wins=list.filter((t)=>(t.pnl||0)>0),losses=list.filter((t)=>(t.pnl||0)<0),avgRWin=wins.length?sum(wins.map((t)=>t.rMultiple||0))/wins.length:0,avgRLoss=losses.length?sum(losses.map((t)=>t.rMultiple||0))/losses.length:0,streaks=calcStreaks(list);const rows=[["שעות הכי רווחיות",topHours.length?topHours.map(([h,p])=>`${String(h).padStart(2,"0")}:00 (${fmtMoney(p)})`).join(" | "):"אין נתונים"],["אסטרטגיה מובילה",bestStrategy?`${bestStrategy[0]} (${fmtMoney(bestStrategy[1])})`:"אין נתונים"],["ממוצע R במנצחות",fmtNum(avgRWin,2)],["ממוצע R במפסידות",fmtNum(avgRLoss,2)],["רצף רווחים מקס'",String(streaks.maxWin)],["רצף הפסדים מקס'",String(streaks.maxLoss)]];els.advancedInsights.innerHTML="";rows.forEach(([k,v])=>{const row=document.createElement("div");row.className="list-row";row.innerHTML=`<span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span>`;els.advancedInsights.appendChild(row)});els.mistakeStats.innerHTML="";const mistakes=[...mistakeMap.entries()].sort((a,b)=>b[1]-a[1]);if(!mistakes.length)els.mistakeStats.textContent="אין טעויות מתועדות";mistakes.forEach(([m,c])=>{const row=document.createElement("div");row.className="list-row";row.innerHTML=`<span>${escapeHtml(m)}</span><span>${c}</span>`;els.mistakeStats.appendChild(row)});drawRisk(list)}
function drawRisk(list){const values=list.slice(-12).map((t)=>startingBalance>0?((t.riskAmount||0)/startingBalance)*100:0),labels=values.map((_,i)=>String(i+1));drawBarChart(els.riskChart,labels,values,maxRiskRule);const avgRisk=values.length?sum(values)/values.length:0,violations=list.filter((t)=>startingBalance>0?((t.riskAmount||0)/startingBalance)*100:0>maxRiskRule).length;els.riskSummary.innerHTML="";[["סיכון ממוצע",`${fmtNum(avgRisk,2)}%`],["כלל מקסימום",`${fmtNum(maxRiskRule,2)}%`],["כמות חריגות",String(violations)]].forEach(([k,v])=>{const row=document.createElement("div");row.className="list-row";row.innerHTML=`<span>${k}</span><span>${v}</span>`;els.riskSummary.appendChild(row)})}
function calcStreaks(list){const ordered=[...list].sort((a,b)=>new Date(a.entryDate)-new Date(b.entryDate));let maxWin=0,maxLoss=0,curWin=0,curLoss=0;ordered.forEach((t)=>{const pnl=t.pnl||0;if(pnl>0){curWin+=1;curLoss=0;maxWin=Math.max(maxWin,curWin)}else if(pnl<0){curLoss+=1;curWin=0;maxLoss=Math.max(maxLoss,curLoss)}});return{maxWin,maxLoss}}
function drawLineChart(canvas,points,color){const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);if(!points.length)return;const min=Math.min(...points),max=Math.max(...points),range=Math.max(1,max-min);ctx.strokeStyle="#4f637d";ctx.lineWidth=1;for(let i=0;i<=4;i+=1){const y=16+((h-34)*i)/4;ctx.beginPath();ctx.moveTo(36,y);ctx.lineTo(w-10,y);ctx.stroke()}ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.beginPath();points.forEach((v,i)=>{const x=36+((w-50)*i)/Math.max(1,points.length-1),y=16+(h-34)*(1-(v-min)/range);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.stroke()}
function drawBarChart(canvas,labels,values,threshold=null){const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);if(!labels.length){ctx.fillStyle="#7a8ca5";ctx.font="14px SF Pro Text";ctx.fillText("אין נתונים",20,24);return}const maxAbs=Math.max(1,...values.map((x)=>Math.abs(x)),threshold===null?0:Math.abs(threshold)),top=18,bottom=h-34,mid=top+(bottom-top)/2,bw=(w-56)/labels.length;ctx.strokeStyle="#4f637d";ctx.beginPath();ctx.moveTo(28,mid);ctx.lineTo(w-10,mid);ctx.stroke();if(threshold!==null){const y=mid-((bottom-top)/2)*(threshold/maxAbs);ctx.setLineDash([4,4]);ctx.strokeStyle="#f59e0b";ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(w-10,y);ctx.stroke();ctx.setLineDash([])}labels.forEach((label,i)=>{const v=values[i],bh=((bottom-top)/2)*(Math.abs(v)/maxAbs),x=32+i*bw,y=v>=0?mid-bh:mid;ctx.fillStyle=v>=0?"#0fa15f":"#d43737";ctx.fillRect(x,y,bw*0.62,bh);ctx.fillStyle="#7a8ca5";ctx.font="11px SF Pro Text";ctx.fillText(String(label).slice(0,8),x,h-10)})}
function updateBadges(){const net=sum(trades.map((t)=>t.pnl||0));els.tradesCountBadge.textContent=`${trades.length} עסקאות`;els.netBadge.textContent=`נטו: ${fmtMoney(net)}`;els.netBadge.classList.toggle("good",net>=0);els.netBadge.classList.toggle("bad",net<0)}
function updateHome(){const total=trades.length,wins=trades.filter((t)=>(t.pnl||0)>0).length,net=sum(trades.map((t)=>t.pnl||0)),winRate=total?(wins/total)*100:0;els.homeTradesCount.textContent=String(total);els.homeWinRate.textContent=`${fmtNum(winRate,1)}%`;els.homeNetPnl.textContent=fmtMoney(net);els.homeNetPnl.className=net>=0?"good":"bad"}
function exportJson(){const payload={version:3,exportedAt:new Date().toISOString(),startingBalance,maxRiskRule,trades};download(`trading-journal-${stamp()}.json`,JSON.stringify(payload,null,2),"application/json;charset=utf-8")}
function exportCsv(){const headers=["id","entryDate","asset","assetType","direction","entryPrice","stopLoss","takeProfit","exitPrice","positionSize","riskPercentPlan","riskAmount","pnl","returnPct","plannedRR","actualRR","movePips","movePercent","rMultiple","strategy","marketCondition","emotionBefore","emotionAfter","followedPlan","discipline","mistakes","notes"];const rows=trades.map((t)=>headers.map((h)=>h==="mistakes"?(t.mistakes||[]).join("|"):(t[h]??"")));const csv=[headers.join(","),...rows.map((r)=>r.map(csvCell).join(","))].join("\n");download(`trading-journal-${stamp()}.csv`,csv,"text/csv;charset=utf-8")}
function exportExcel(){const headers=["Date","Asset","Type","Direction","Entry","Stop","Take","Exit","Size","Risk$","PnL$","R","Strategy","Market","Emotion Before","Emotion After","Plan","Discipline","Notes"],rows=trades.map((t)=>[t.entryDate,t.asset,t.assetType,t.direction,t.entryPrice,t.stopLoss,t.takeProfit,t.exitPrice,t.positionSize,t.riskAmount,t.pnl,t.rMultiple,t.strategy,t.marketCondition,t.emotionBefore,t.emotionAfter,t.followedPlan?"Yes":"No",t.discipline,t.notes]);const table=`<table border="1"><tr>${headers.map((h)=>`<th>${escapeHtml(h)}</th>`).join("")}</tr>${rows.map((r)=>`<tr>${r.map((c)=>`<td>${escapeHtml(String(c??""))}</td>`).join("")}</tr>`).join("")}</table>`,html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body>${table}</body></html>`;download(`trading-journal-${stamp()}.xls`,html,"application/vnd.ms-excel;charset=utf-8")}
function importData(event){const file=event.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const c=String(r.result||"");if(file.name.toLowerCase().endsWith(".json"))importJson(c);else importCsv(c);persistAll();refreshUI();flash("ייבוא הושלם")}catch(e){alert(`שגיאת ייבוא: ${e.message}`)}finally{els.importInput.value=""}};r.readAsText(file,"utf-8")}
function importJson(content){const parsed=JSON.parse(content),list=Array.isArray(parsed)?parsed:parsed.trades;if(!Array.isArray(list))throw new Error("JSON לא תקין");trades=dedupe(list.map(normalizeTrade).filter(Boolean));if(!Array.isArray(parsed)&&typeof parsed.startingBalance==="number")startingBalance=parsed.startingBalance;if(!Array.isArray(parsed)&&typeof parsed.maxRiskRule==="number")maxRiskRule=parsed.maxRiskRule;els.startingBalance.value=String(startingBalance);els.maxRiskRule.value=String(maxRiskRule)}
function importCsv(content){const lines=content.split(/\r?\n/).filter((x)=>x.trim());if(lines.length<2)throw new Error("CSV ריק");const headers=parseCsvLine(lines[0]);const data=lines.slice(1).map((line)=>{const values=parseCsvLine(line),obj={};headers.forEach((h,i)=>{obj[h]=values[i]??""});return normalizeTrade(obj)}).filter(Boolean);trades=dedupe(data)}
function normalizeTrade(raw){if(!raw)return null;const entryDate=String(raw.entryDate||raw.date||""),asset=String(raw.asset||raw.pair||"").toUpperCase();if(!entryDate||!asset)return null;const direction=normalizeDirection(raw.direction||"Long"),entryPrice=numberOrZero(raw.entryPrice),stopLoss=numberOrZero(raw.stopLoss),takeProfit=numberOrZero(raw.takeProfit),exitPrice=numberOrZero(raw.exitPrice),positionSize=numberOrZero(raw.positionSize),m=calculateMetrics({direction,asset,assetType:raw.assetType||"פורקס",entryPrice,stopLoss,takeProfit,exitPrice,positionSize,balance:startingBalance}),importedPnl=Number(raw.pnl);return{id:String(raw.id||createId()),entryDate,asset,assetType:String(raw.assetType||"פורקס"),direction,entryPrice,stopLoss,takeProfit,exitPrice,positionSize,riskPercentPlan:numberOrZero(raw.riskPercentPlan||raw.riskPercent),riskAmount:numberOr(raw.riskAmount,m.riskAmount),pnl:Number.isNaN(importedPnl)?m.pnl:importedPnl,returnPct:numberOr(raw.returnPct,m.returnPct),plannedRR:numberOr(raw.plannedRR,m.plannedRR),actualRR:numberOr(raw.actualRR,m.actualRR),movePips:numberOr(raw.movePips,m.movePips),movePercent:numberOr(raw.movePercent,m.movePercent),rMultiple:numberOr(raw.rMultiple,m.rMultiple),strategy:String(raw.strategy||""),marketCondition:String(raw.marketCondition||""),emotionBefore:String(raw.emotionBefore||raw.emotion||"ניטרלי"),emotionAfter:String(raw.emotionAfter||"ניטרלי"),followedPlan:Boolean(raw.followedPlan),discipline:clamp(numberOrZero(raw.discipline||raw.setupScore||3),1,5),mistakes:String(raw.mistakes||"").split(/[|,]/).map((x)=>x.trim()).filter(Boolean),notes:String(raw.notes||""),screenshot:String(raw.screenshot||""),updatedAt:String(raw.updatedAt||new Date().toISOString())}}
function clearAllData(){if(!confirm("למחוק את כל הנתונים?"))return;trades=[];persistAll();refreshUI();flash("הנתונים נמחקו")}
function saveAutoBackup(){const backups=loadBackups();backups.push({at:new Date().toISOString(),startingBalance,maxRiskRule,trades});while(backups.length>30)backups.shift();localStorage.setItem(BACKUP_KEY,JSON.stringify(backups))}
function loadBackups(){try{const raw=localStorage.getItem(BACKUP_KEY);if(!raw)return[];const p=JSON.parse(raw);return Array.isArray(p)?p:[]}catch{return[]}}
function updateBackupStatus(){const b=loadBackups();if(!b.length){els.backupStatus.textContent="אין גיבויים";return}const last=b[b.length-1];els.backupStatus.textContent=`גיבויים: ${b.length} | אחרון: ${fmtDate(last.at)}`}
function downloadLatestBackup(){const b=loadBackups();if(!b.length)return flash("אין גיבוי");const last=b[b.length-1];download(`journal-backup-${stamp()}.json`,JSON.stringify(last,null,2),"application/json;charset=utf-8")}
function restoreLatestBackup(){const b=loadBackups();if(!b.length)return flash("אין גיבוי");if(!confirm("לשחזר את הגיבוי האחרון?"))return;const last=b[b.length-1];trades=(last.trades||[]).map(normalizeTrade).filter(Boolean);startingBalance=numberOrZero(last.startingBalance);maxRiskRule=numberOr(last.maxRiskRule,2);els.startingBalance.value=String(startingBalance);els.maxRiskRule.value=String(maxRiskRule);persistAll();refreshUI();flash("בוצע שחזור")}
function applyTheme(){document.documentElement.dataset.theme=theme;els.themeToggle.textContent=theme==="dark"?"Light Mode":"Dark Mode"}
function toggleTheme(){theme=theme==="dark"?"light":"dark";localStorage.setItem(THEME_KEY,theme);applyTheme()}
function loadTheme(){const raw=localStorage.getItem(THEME_KEY);return raw==="dark"?"dark":"light"}
function setupPwa(){if("serviceWorker"in navigator){window.addEventListener("load",async()=>{try{const reg=await navigator.serviceWorker.register("./sw.js");const act=(w)=>{if(w)w.postMessage({type:"SKIP_WAITING"})};if(reg.waiting)act(reg.waiting);reg.addEventListener("updatefound",()=>{const w=reg.installing;if(!w)return;w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller)act(w)})});navigator.serviceWorker.addEventListener("controllerchange",()=>{if(swReloadTriggered)return;swReloadTriggered=true;window.location.reload()});setInterval(()=>reg.update().catch(()=>{}),60000)}catch{}})}window.addEventListener("beforeinstallprompt",(e)=>{e.preventDefault();installPromptEvent=e;els.installBtn.classList.remove("hidden")});window.addEventListener("appinstalled",()=>{installPromptEvent=null;els.installBtn.classList.add("hidden");flash("האפליקציה הותקנה")})}
async function installApp(){if(!installPromptEvent)return flash("התקנה לא זמינה כרגע");installPromptEvent.prompt();await installPromptEvent.userChoice}
function loadTrades(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw){const old=localStorage.getItem("fxJournalTradesV2");if(!old)return[];return JSON.parse(old).map(normalizeTrade).filter(Boolean)}const list=JSON.parse(raw);return Array.isArray(list)?list.map(normalizeTrade).filter(Boolean):[]}catch{return[]}}
function loadStartingBalance(){const raw=Number(localStorage.getItem(BALANCE_KEY));if(!Number.isNaN(raw)&&raw>=0)return raw;const old=Number(localStorage.getItem("fxJournalStartingBalanceV2"));return Number.isNaN(old)||old<0?10000:old}
function loadMaxRiskRule(){const raw=Number(localStorage.getItem(MAX_RISK_RULE_KEY));return Number.isNaN(raw)||raw<=0?2:raw}
function dedupe(list){const map=new Map();list.forEach((t)=>map.set(t.id,t));return[...map.values()]}
function normalizeDirection(v){const x=String(v||"").toLowerCase().trim();if(x==="short"||x==="שורט")return"Short";return"Long"}
function directionLabel(v){return normalizeDirection(v)==="Short"?"שורט":"לונג"}
function flash(message){els.statusBar.textContent=message;els.toast.textContent=message;els.toast.classList.add("show");clearTimeout(flash.timer);flash.timer=setTimeout(()=>{els.statusBar.textContent="";els.toast.classList.remove("show")},2200)}
function csvCell(value){const s=String(value??"");if(/[",\n]/.test(s))return `"${s.replace(/"/g,'""')}"`;return s}
function parseCsvLine(line){const out=[];let cur="",q=false;for(let i=0;i<line.length;i+=1){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){cur+='"';i+=1}else q=!q}else if(ch===","&&!q){out.push(cur);cur=""}else cur+=ch}out.push(cur);return out}
function download(filename,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}
function toLocalDateTime(date){const tz=date.getTimezoneOffset()*60000;return new Date(date.getTime()-tz).toISOString().slice(0,16)}
function fmtDate(v){return new Date(v).toLocaleString("he-IL",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}
function fmtMoney(v){return Number(v||0).toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2})}
function fmtNum(v,d=2){return Number(v||0).toLocaleString("he-IL",{minimumFractionDigits:d,maximumFractionDigits:d})}
function sum(arr){return arr.reduce((a,n2)=>a+Number(n2||0),0)}
function n(v){return Number(v)}
function i(v){return Math.round(Number(v))}
function numberOrZero(v){const num=Number(v);return Number.isNaN(num)?0:num}
function numberOr(v,fallback){const num=Number(v);return Number.isNaN(num)?fallback:num}
function clamp(v,min,max){return Number.isNaN(v)?min:Math.max(min,Math.min(max,v))}
function createId(){return `${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function stamp(){return new Date().toISOString().slice(0,10)}
function escapeHtml(v){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

// Override: compact dashboard behavior with real empty-state handling.
function renderDashboard(list){
  const empty=document.getElementById("dashboardEmpty");
  const details=document.getElementById("dashboardDetails");
  const hasData=Array.isArray(list)&&list.length>0;
  if(empty) empty.classList.toggle("hidden",hasData);
  if(details) details.classList.toggle("hidden",!hasData);
  if(!hasData) return;
  drawEquity(list);
  drawMonthly(list);
  drawByKey(list,"asset",els.assetChart);
  drawByKey(list,"strategy",els.strategyChart,"ללא");
  drawEmotion(list);
}

// Interface productivity layer
(() => {
  const DRAFT_KEY = "fxJournalDraftV1";
  const QUICK_KEY = "fxJournalQuickModeV1";
  const draftHint = document.getElementById("draftHint");
  const quickMode = document.getElementById("quickMode");
  const duplicateLastBtn = document.getElementById("duplicateLastBtn");
  const form = document.getElementById("tradeForm");
  const basicsStep = document.querySelector('[data-step="basics"]');
  const pricingStep = document.querySelector('[data-step="pricing"]');
  const disciplineStep = document.querySelector('[data-step="discipline"]');

  let lastSnapshotBeforeSubmit = null;

  function setDraftHint(text) {
    if (draftHint) draftHint.textContent = `טיוטה: ${text}`;
  }

  function requiredFilled(ids) {
    return ids.every((id) => String(document.getElementById(id)?.value || "").trim() !== "");
  }

  function saveDraft() {
    if (!form) return;
    const payload = {
      data: readForm(),
      quick: !!quickMode?.checked,
      at: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    setDraftHint(`נשמרה ${fmtDate(payload.at)}`);
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setDraftHint("אין טיוטה");
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return setDraftHint("אין טיוטה");
      const parsed = JSON.parse(raw);
      const data = parsed?.data || {};

      Object.keys(data).forEach((key) => {
        const el = document.getElementById(key);
        if (!el) return;
        if (el.type === "checkbox") el.checked = !!data[key];
        else el.value = data[key] ?? "";
      });

      setDirection(data.direction || "Long");
      document.getElementById("followedPlan").checked = !!data.followedPlan;
      document.querySelectorAll(".mistake").forEach((box) => {
        box.checked = (data.mistakes || []).includes(box.value);
      });

      if (quickMode && typeof parsed.quick === "boolean") quickMode.checked = parsed.quick;
      setDraftHint(`שוחזרה ${fmtDate(parsed.at || new Date().toISOString())}`);
      refreshCalculationPreview();
    } catch {
      setDraftHint("שגיאת טיוטה");
    }
  }

  function applyQuickModeDefaults(snapshot) {
    if (!quickMode?.checked || !snapshot) return;
    const carry = ["asset", "assetType", "direction", "strategy", "riskPercent", "marketCondition", "positionSize"];
    carry.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = snapshot[id] ?? "";
    });
    setDirection(snapshot.direction || "Long");
    document.getElementById("entryDate").value = toLocalDateTime(new Date());
    refreshCalculationPreview();
  }

  function openStep(stepEl, focusId) {
    if (!stepEl) return;
    stepEl.open = true;
    if (focusId) document.getElementById(focusId)?.focus();
  }

  function stepAutoAdvance() {
    if (requiredFilled(["entryDate", "asset", "assetType", "direction", "strategy"])) {
      if (basicsStep) basicsStep.open = false;
      openStep(pricingStep, "entryPrice");
    }
    if (requiredFilled(["entryPrice", "stopLoss", "takeProfit", "exitPrice", "positionSize"])) {
      if (pricingStep) pricingStep.open = false;
      openStep(disciplineStep, "marketCondition");
    }
  }

  function bindShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.altKey && ["1", "2", "3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        const map = { "1": "home", "2": "journal", "3": "dashboard", "4": "analytics", "5": "settings" };
        activateView(map[e.key]);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        activateView("journal");
        document.getElementById("asset")?.focus();
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName || "")) {
        e.preventDefault();
        activateView("journal");
        document.getElementById("searchText")?.focus();
      }
    });
  }

  function bindContinuousMode() {
    if (quickMode) {
      quickMode.checked = localStorage.getItem(QUICK_KEY) === "1";
      quickMode.addEventListener("change", () => {
        localStorage.setItem(QUICK_KEY, quickMode.checked ? "1" : "0");
      });
    }

    form?.addEventListener("submit", () => {
      lastSnapshotBeforeSubmit = readForm();
    });

    form?.addEventListener("submit", () => {
      const before = trades.length;
      setTimeout(() => {
        const after = trades.length;
        if (after !== before || !document.getElementById("tradeId")?.value) {
          applyQuickModeDefaults(lastSnapshotBeforeSubmit);
          clearDraft();
        }
      }, 0);
    });
  }

  function bindDuplicateLast() {
    duplicateLastBtn?.addEventListener("click", () => {
      if (!Array.isArray(trades) || !trades.length) return flash("אין עסקה לשכפול");
      const last = [...trades].sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))[0];
      const fieldMap = {
        asset: last.asset,
        assetType: last.assetType,
        strategy: last.strategy,
        entryPrice: last.entryPrice,
        stopLoss: last.stopLoss,
        takeProfit: last.takeProfit,
        exitPrice: last.exitPrice,
        positionSize: last.positionSize,
        riskPercent: last.riskPercentPlan,
        marketCondition: last.marketCondition,
        emotionBefore: last.emotionBefore,
        emotionAfter: last.emotionAfter,
        discipline: last.discipline,
        notes: last.notes,
      };
      Object.entries(fieldMap).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value ?? "";
      });
      setDirection(last.direction || "Long");
      document.getElementById("entryDate").value = toLocalDateTime(new Date());
      document.getElementById("followedPlan").checked = !!last.followedPlan;
      document.querySelectorAll(".mistake").forEach((box) => { box.checked = (last.mistakes || []).includes(box.value); });
      refreshCalculationPreview();
      flash("עסקה אחרונה שוכפלה");
    });
  }

  function bindDraftAutosave() {
    if (!form) return;
    let timer = null;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(saveDraft, 250);
    };

    form.addEventListener("input", schedule);
    form.addEventListener("change", schedule);
  }

  ["entryDate", "asset", "strategy", "entryPrice", "stopLoss", "takeProfit", "exitPrice", "positionSize"].forEach((id) => {
    document.getElementById(id)?.addEventListener("blur", stepAutoAdvance);
  });

  bindShortcuts();
  bindContinuousMode();
  bindDuplicateLast();
  bindDraftAutosave();
  restoreDraft();
})();

// Interface upgrade: quick/full modes, recent assets, step navigation, one-click filter reset
(() => {
  const UI_MODE_KEY = "fxJournalUiModeV1";
  const quickBtn = document.getElementById("quickTradeModeBtn");
  const fullBtn = document.getElementById("fullTradeModeBtn");
  const nextStepBtn = document.getElementById("nextStepBtn");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  const recentAssetsEl = document.getElementById("recentAssets");

  const basicsStep = document.querySelector('[data-step="basics"]');
  const pricingStep = document.querySelector('[data-step="pricing"]');
  const disciplineStep = document.querySelector('[data-step="discipline"]');
  const stepOrder = [basicsStep, pricingStep, disciplineStep].filter(Boolean);

  function setUiMode(mode) {
    const isQuick = mode === "quick";
    document.body.classList.toggle("ui-quick", isQuick);
    if (quickBtn) quickBtn.classList.toggle("is-active", isQuick);
    if (fullBtn) fullBtn.classList.toggle("is-active", !isQuick);

    if (isQuick) {
      basicsStep && (basicsStep.open = true);
      pricingStep && (pricingStep.open = true);
      disciplineStep && (disciplineStep.open = false);
    }

    localStorage.setItem(UI_MODE_KEY, mode);
  }

  function getUiMode() {
    const mode = localStorage.getItem(UI_MODE_KEY);
    return mode === "quick" ? "quick" : "full";
  }

  function goToNextStep() {
    const currentIndex = stepOrder.findIndex((step) => step?.open);
    const index = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, stepOrder.length - 1);
    stepOrder.forEach((step, i) => { if (step) step.open = i === index; });

    const focusMap = ["entryDate", "entryPrice", "marketCondition"];
    document.getElementById(focusMap[index])?.focus();
  }

  function clearFilters() {
    const ids = [
      "searchText", "fromDate", "toDate", "filterAsset", "filterDirection",
      "filterStrategy", "filterMarket", "filterWeekday", "filterHour", "sortBy"
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === "sortBy") el.value = "entryDateDesc";
      else el.value = "";
    });

    refreshUI();
    flash("הפילטרים נוקו");
  }

  function renderRecentAssets() {
    if (!recentAssetsEl) return;
    const unique = [...new Set((trades || []).map((t) => String(t.asset || "").trim()).filter(Boolean))].slice(-6).reverse();

    recentAssetsEl.innerHTML = "";
    if (!unique.length) return;

    const label = document.createElement("span");
    label.className = "chip-btn";
    label.textContent = "נכסים אחרונים:";
    label.style.cursor = "default";
    recentAssetsEl.appendChild(label);

    unique.forEach((asset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip-btn";
      btn.textContent = asset;
      btn.addEventListener("click", () => {
        const input = document.getElementById("asset");
        if (input) {
          input.value = asset;
          input.focus();
          refreshCalculationPreview();
        }
      });
      recentAssetsEl.appendChild(btn);
    });
  }

  quickBtn?.addEventListener("click", () => setUiMode("quick"));
  fullBtn?.addEventListener("click", () => setUiMode("full"));
  nextStepBtn?.addEventListener("click", goToNextStep);
  clearFiltersBtn?.addEventListener("click", clearFilters);

  document.getElementById("tradeForm")?.addEventListener("submit", () => {
    setTimeout(renderRecentAssets, 0);
  });

  setUiMode(getUiMode());
  renderRecentAssets();
})();

// Cinematic glass click effect on every button
(() => {
  const SHARDS = 14;

  function spawnShatter(button, clientX, clientY) {
    const rect = button.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const burst = document.createElement("span");
    burst.className = "glass-shatter-burst";

    const ring = document.createElement("span");
    ring.className = "glass-ring";
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    burst.appendChild(ring);

    for (let i = 0; i < SHARDS; i += 1) {
      const shard = document.createElement("span");
      shard.className = "glass-shard";
      shard.style.left = `${x}px`;
      shard.style.top = `${y}px`;

      const angle = (Math.PI * 2 * i) / SHARDS + (Math.random() * 0.35 - 0.175);
      const distance = 10 + Math.random() * 24;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const rot = -160 + Math.random() * 320;
      const size = 5 + Math.random() * 7;

      shard.style.setProperty("--dx", `${dx.toFixed(2)}px`);
      shard.style.setProperty("--dy", `${dy.toFixed(2)}px`);
      shard.style.setProperty("--rot", `${rot.toFixed(1)}deg`);
      shard.style.width = `${size.toFixed(1)}px`;
      shard.style.height = `${size.toFixed(1)}px`;

      burst.appendChild(shard);
    }

    button.appendChild(burst);
    setTimeout(() => burst.remove(), 560);
  }

  function spawnScreenWave(clientX, clientY) {
    const wave = document.createElement("span");
    wave.className = "screen-wave";
    wave.style.left = `${clientX}px`;
    wave.style.top = `${clientY}px`;
    document.body.appendChild(wave);
    setTimeout(() => wave.remove(), 540);
  }

  function popButton(button) {
    button.classList.remove("btn-press-pop");
    // force reflow to restart animation
    void button.offsetWidth;
    button.classList.add("btn-press-pop");
    setTimeout(() => button.classList.remove("btn-press-pop"), 380);
  }

  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button) return;

    const x = typeof event.clientX === "number" ? event.clientX : button.getBoundingClientRect().left + button.offsetWidth / 2;
    const y = typeof event.clientY === "number" ? event.clientY : button.getBoundingClientRect().top + button.offsetHeight / 2;

    popButton(button);
    spawnShatter(button, x, y);
    spawnScreenWave(x, y);
  });
})();
