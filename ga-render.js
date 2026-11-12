/* ===== 성적 분석 화면 그리기 (학급 앱 · 미리보기 공용) ===== */
const GA_AREAS=[["all","전과목","#1d2330"],["kor","국어","#e8590c"],["eng","영어","#1971c2"],["mat","수학","#7048e8"],["soc","사회","#2b8a3e"],["sci","과학","#c2255c"]];
const GA_CSS=`
.ga{--ga-ink:#1d2330;--ga-sub:#6b7280;--ga-line:#e5e7eb;--ga-card:#fff;--ga-accent:#2f5bea;color:var(--ga-ink);line-height:1.55}
.ga *{box-sizing:border-box}
.ga .gc{background:var(--ga-card);border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.ga .gc h2{font-size:14px;margin:0 0 12px;color:var(--ga-sub);font-weight:600}
.ga .nm{font-size:13px;color:var(--ga-sub)}
.ga .row{display:flex;align-items:flex-end;gap:18px;margin-top:6px}
.ga .big{font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1}
.ga .big small{font-size:14px;font-weight:600;margin-left:2px}
.ga .lbl{font-size:12px;color:var(--ga-sub);margin-top:4px}
.ga .dl{font-size:13px;font-weight:700;margin-top:10px}
.ga .badge{display:inline-block;margin-top:14px;padding:6px 12px;border-radius:999px;background:rgba(47,91,234,.1);color:var(--ga-accent);font-weight:700;font-size:13px}
.ga .tgs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.ga .tg{border:1px solid var(--ga-line);background:transparent;color:var(--ga-ink);border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px}
.ga .tg i{width:8px;height:8px;border-radius:50%;display:inline-block}
.ga .tg.off{opacity:.35}
.ga table{width:100%;border-collapse:collapse;font-size:12px;text-align:center}
.ga th,.ga td{padding:6px 2px;border-bottom:1px solid var(--ga-line)}
.ga th{color:var(--ga-sub);font-weight:600}
.ga td.k{font-weight:700;text-align:left;padding-left:4px;white-space:nowrap}
.ga .chip{display:inline-block;min-width:26px;padding:2px 4px;border-radius:6px;font-weight:700}
.ga .na{color:var(--ga-sub);font-size:11px}
.ga .pc td{color:var(--ga-sub)}
.ga .scroll{overflow-x:auto}
.ga .pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ga .pill{border-radius:12px;padding:12px}
.ga .pill.good{background:rgba(43,138,62,.1)}
.ga .pill.bad{background:rgba(224,49,49,.09)}
.ga .pill b{display:block;font-size:12px;color:var(--ga-sub);margin-bottom:4px}
.ga .pill .s{font-size:17px;font-weight:800}
.ga .pill p{margin:6px 0 0;font-size:12px;color:var(--ga-sub)}
.ga .ai h3{font-size:14px;margin:16px 0 6px}
.ga .ai h3:first-of-type{margin-top:0}
.ga .ai p{margin:0;font-size:14px}
.ga .ai ol{margin:0;padding-left:20px;font-size:14px}
.ga .ai li{margin-bottom:6px}
.ga .foot{font-size:11px;color:var(--ga-sub);text-align:center;margin-top:8px}
.ga svg text{font-family:inherit}
`;
function gaEsc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function gaPct(p){return Math.max(1,Math.round(p));}
function gaInjectCss(){if(document.getElementById("ga-css"))return;const s=document.createElement("style");s.id="ga-css";s.textContent=GA_CSS;document.head.appendChild(s);}
function gaRender(box,d){
  gaInjectCss();
  const ex=d.exams||[];const done=ex.filter(e=>!e.missing);
  if(!done.length||!d.ai){box.innerHTML=`<div class="ga"><div class="gc"><p style="margin:0">아직 분석할 시험 기록이 없어요. 다음 시험이 끝나면 성적 분석이 제공돼요.</p></div></div>`;return;}
  const last=done[done.length-1],prev=done.length>1?done[done.length-2]:null;
  let dl="";
  if(prev){const g=+(prev.avg-last.avg).toFixed(2);const up=g>0;
    dl=`<div class="dl" style="color:${g===0?"#6b7280":up?"#d9480f":"#1c7ed6"}">직전 시험 대비 ${g===0?"변화 없음":(up?"▲ ":"▼ ")+Math.abs(g).toFixed(2)+"등급"} · 상위 ${gaPct(prev.pct)}% → ${gaPct(last.pct)}%</div>`;}
  const gcol=g=>g<=1.5?["#2b8a3e","#fff"]:g<=2.5?["#74b816","#fff"]:g<=3.5?["#f2c94c","#1d2330"]:g<=4.5?["#f08c00","#fff"]:["#e03131","#fff"];
  const chip=g=>{const c=gcol(g);return `<span class="chip" style="background:${c[0]};color:${c[1]}">${Number.isInteger(g)?g:g.toFixed(1)}</span>`;};
  let th=`<tr><th></th>${ex.map(e=>`<th>${gaEsc(e.label).replace(" ","<br>")}</th>`).join("")}</tr>`;
  th+=`<tr class="pc"><td class="k">상위</td>${ex.map(e=>`<td>${e.missing?"–":gaPct(e.pct)+"%"}</td>`).join("")}</tr>`;
  th+=`<tr><td class="k">전과목</td>${ex.map(e=>`<td>${e.missing?"–":"<b>"+e.avg.toFixed(2)+"</b>"}</td>`).join("")}</tr>`;
  GA_AREAS.slice(1).forEach(([k,n])=>{th+=`<tr><td class="k">${n}</td>${ex.map(e=>`<td>${e.missing?'<span class="na">–</span>':e[k]==null?'<span class="na">미수강</span>':chip(e[k])}</td>`).join("")}</tr>`;});
  const ai=d.ai;
  box.innerHTML=`<div class="ga">
  <div class="gc"><div class="nm">${gaEsc(d.num)}번 ${gaEsc(d.name)}</div>
    <div class="row"><div><div class="big">${last.avg.toFixed(2)}<small>등급</small></div><div class="lbl">전과목 평균</div></div>
    <div><div class="big">${gaPct(last.pct)}<small>%</small></div><div class="lbl">학년 상위 비율</div></div></div>
    ${dl}<div class="badge">${gaEsc(d.trend.type)}</div></div>
  <div class="gc"><h2>성적 변화 (${done.length}회)</h2><div class="tgs"></div><svg viewBox="0 0 400 230" width="100%"></svg></div>
  <div class="gc"><h2>교과군별 등급</h2><div class="scroll"><table>${th}</table></div></div>
  <div class="gc"><h2>장점 과목 · 단점 과목</h2><div class="pair">
    <div class="pill good"><b>장점 과목</b><div class="s">${gaEsc(d.strengths.subjects)}</div><p>${gaEsc(d.strengths.reason)}</p></div>
    <div class="pill bad"><b>단점 과목</b><div class="s">${gaEsc(d.weaknesses.subjects)}</div><p>${gaEsc(d.weaknesses.reason)}</p></div></div></div>
  <div class="gc"><h2>추세 유형</h2><p style="margin:0;font-size:14px"><b>${gaEsc(d.trend.type)}</b> · ${gaEsc(d.trend.desc)}</p></div>
  <div class="gc ai"><h2>AI 분석</h2>
    <h3>💪 강점</h3><p>${gaEsc(ai.strength)}</p>
    <h3>🔍 약점</h3><p>${gaEsc(ai.weakness)}</p>
    <h3>📍 현재 상황</h3><p>${gaEsc(ai.situation)}</p>
    <h3>✅ 다음 시험 실천 제안</h3><ol>${ai.actions.map(a=>`<li><b>${gaEsc(a.area)}</b> — ${gaEsc(a.text)}</li>`).join("")}</ol></div>
  <div class="foot">정기고사 예상등급 기준 · 학기말 공식 등급과 다를 수 있어요${d.updatedLabel?" · "+gaEsc(d.updatedLabel):""}</div></div>`;
  const svg=box.querySelector("svg"),tg=box.querySelector(".tgs");
  const on={all:true};const NS="http://www.w3.org/2000/svg";
  const el=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e;};
  const X0=40,X1=388,Y0=14,Y1=190,n=ex.length;
  const x=i=>X0+(X1-X0)*i/Math.max(1,n-1),y=g=>Y0+(Y1-Y0)*(g-1)/4;
  const firstY2=ex.findIndex(e=>e.key&&e.key[0]==="2");
  function draw(){svg.innerHTML="";
    for(let g=1;g<=5;g++){el("line",{x1:X0,x2:X1,y1:y(g),y2:y(g),stroke:"#e5e7eb"},svg);el("text",{x:X0-8,y:y(g)+4,"text-anchor":"end","font-size":11,fill:"#6b7280"},svg).textContent=g+"등급";}
    ex.forEach((e,i)=>{const [a,b]=e.label.split(" ");el("text",{x:x(i),y:Y1+16,"text-anchor":"middle","font-size":10,fill:"#6b7280"},svg).textContent=a;el("text",{x:x(i),y:Y1+29,"text-anchor":"middle","font-size":10,fill:"#6b7280"},svg).textContent=b;});
    if(firstY2>0){const mx=(x(firstY2-1)+x(firstY2))/2;el("line",{x1:mx,x2:mx,y1:Y0,y2:Y1,stroke:"#d0d4da","stroke-dasharray":"3 3"},svg);}
    GA_AREAS.forEach(([k,nm,col])=>{if(!on[k])return;const v=ex.map(e=>e.missing?null:(k==="all"?e.avg:e[k]));
      let dd="";v.forEach((g,i)=>{if(g==null)return;dd+=(dd&&v[i-1]!=null?"L":"M")+x(i)+" "+y(g);});
      el("path",{d:dd,fill:"none",stroke:col,"stroke-width":k==="all"?3:2,"stroke-linejoin":"round","stroke-linecap":"round"},svg);
      v.forEach((g,i)=>{if(g==null)return;el("circle",{cx:x(i),cy:y(g),r:k==="all"?4:3,fill:col},svg);
        if(k==="all")el("text",{x:x(i),y:y(g)-9,"text-anchor":"middle","font-size":10,"font-weight":700,fill:col},svg).textContent=g.toFixed(2);});});}
  GA_AREAS.forEach(([k,nm,col])=>{if(k!=="all"&&!ex.some(e=>!e.missing&&e[k]!=null))return;const b=document.createElement("button");b.type="button";b.className="tg"+(on[k]?"":" off");b.innerHTML=`<i style="background:${col}"></i>${nm}`;b.onclick=()=>{on[k]=!on[k];b.classList.toggle("off",!on[k]);draw();};tg.appendChild(b);});
  draw();
}
