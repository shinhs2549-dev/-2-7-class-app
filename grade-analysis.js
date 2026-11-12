/* =========================================================
   성적 분석 탭 — 학생: 본인 분석 / 담임: 학생별 보기 + JSON 업로드
   데이터: Firestore gradeAnalysis/{uid} (학생은 본인 1건만 읽기, 목록·쓰기는 담임만)
   화면 그리기: ga-render.js 의 gaRender(box, data)
   ※ 성적 JSON 파일은 GitHub에 올리지 마세요 (저장소 공개)
   ========================================================= */
let gaRosterCache = null, gaAllCache = null;

function setupGradeTab(){
  const role = currentProfile && currentProfile.role;
  const btn = document.getElementById("tabBtnGrade");
  btn.style.display = role === "student" || role === "teacher" ? "" : "none";
}
function gaOnTabOpen(){
  if(currentProfile.role === "teacher") gaTeacherList();
  else gaStudentView();
}

async function gaStudentView(){
  const body = document.getElementById("gaBody");
  body.innerHTML = `<p class="hint">불러오는 중...</p>`;
  try{
    const d = await db.collection("gradeAnalysis").doc(currentUser.uid).get();
    const data = d.exists ? d.data() : { num: currentProfile.num, name: currentProfile.name, exams: [] };
    body.innerHTML = `<div id="gaBox"></div>`;
    gaRender(document.getElementById("gaBox"), data);
  }catch(e){
    console.error("성적 분석 불러오기 실패", e);
    body.innerHTML = `<p class="hint">불러오지 못했어요. 잠시 후 다시 열어주세요.</p>`;
  }
}

async function gaTeacherList(){
  const body = document.getElementById("gaBody");
  body.innerHTML = `<p class="hint">불러오는 중...</p>`;
  try{
    const [rs, gs] = await Promise.all([
      db.collection("students").where("role", "==", "student").get(),
      db.collection("gradeAnalysis").get() ]);
    gaRosterCache = rs.docs.map(d => ({ uid: d.id, ...d.data() })).sort((a, b) => a.num - b.num);
    gaAllCache = {}; gs.forEach(d => { gaAllCache[d.id] = d.data(); });
  }catch(e){
    console.error("성적 목록 실패", e);
    body.innerHTML = `<p class="hint">불러오지 못했어요 (${yajaEsc(e.code || e.message)}). 보안 규칙이 배포됐는지 확인해주세요.</p>`;
    return;
  }
  const labels = [...new Set(Object.values(gaAllCache).map(x => x.updatedLabel).filter(Boolean))];
  const summary = s => {
    const g = gaAllCache[s.uid]; if(!g) return `<span>자료 없음</span>`;
    const done = (g.exams || []).filter(e => !e.missing); if(!done.length) return `<span>시험 기록 없음</span>`;
    const last = done[done.length - 1];
    return `<span>${last.avg.toFixed(2)}등급 · ${yajaEsc((g.trend && g.trend.type) || "")}</span>`;
  };
  body.innerHTML = `<div class="group-block"><h3>📊 성적 분석</h3>
    <p class="hint" style="margin-top:4px;">${labels.length ? `현재 자료: <b>${labels.map(yajaEsc).join(", ")}</b> · ` : ""}학생을 누르면 그 학생이 보는 화면과 똑같이 보여요.</p>
    <div class="cd-roster" style="margin-top:8px;">${gaRosterCache.map(s => `<button class="cd-stu ${gaAllCache[s.uid] ? "done" : "none"}" data-uid="${s.uid}"><b>${Number(s.num) || ""}</b> ${yajaEsc(s.name)}${summary(s)}</button>`).join("")}</div>
  </div>
  <div class="group-block"><h3>⬆️ 성적 자료 올리기</h3>
    <p class="hint" style="margin-top:4px;">성적 분석 대화에서 만든 <b>grade-analysis-data.json</b> 파일을 고르세요. 번호와 이름이 둘 다 맞는 학생에게만 저장돼요. 같은 학생 자료는 새 파일로 덮어써요.<br>🔒 학생은 자기 것만 볼 수 있어요. 이 파일은 GitHub에 올리지 마세요.</p>
    <input type="file" id="gaFile" accept=".json,application/json" style="margin-top:8px;">
    <div id="gaUpMsg" class="hint"></div>
  </div>`;
  body.querySelectorAll(".cd-stu").forEach(b => b.onclick = () => gaTeacherView(b.dataset.uid));
  document.getElementById("gaFile").onchange = e => { const f = e.target.files[0]; if(f) gaUpload(f); };
}

function gaTeacherView(uid){
  const s = gaRosterCache.find(x => x.uid === uid);
  const data = gaAllCache[uid] || { num: s.num, name: s.name, exams: [] };
  const body = document.getElementById("gaBody");
  body.innerHTML = `<button class="link-btn" id="gaBack">← 목록</button>
    <p class="hint" style="margin:6px 0 10px;">👀 ${Number(s.num) || ""}번 ${yajaEsc(s.name)} 학생이 보는 화면이에요.</p><div id="gaBox"></div>`;
  document.getElementById("gaBack").onclick = gaTeacherList;
  gaRender(document.getElementById("gaBox"), data);
  window.scrollTo(0, 0);
}

async function gaUpload(file){
  const msg = document.getElementById("gaUpMsg");
  let json;
  try{ json = JSON.parse(await file.text()); }catch(e){ msg.innerHTML = `<span style="color:var(--danger);">JSON 파일을 읽지 못했어요.</span>`; return; }
  const list = Array.isArray(json.students) ? json.students : null;
  if(!list || !list.length){ msg.innerHTML = `<span style="color:var(--danger);">students 목록이 없는 파일이에요.</span>`; return; }
  const byNum = {}; gaRosterCache.forEach(s => { byNum[Number(s.num)] = s; });
  const matched = [], skipped = [];
  list.forEach(x => {
    const s = byNum[Number(x.num)];
    if(s && String(s.name).trim() === String(x.name || "").trim()) matched.push({ s, x });
    else skipped.push(`${x.num}번 ${x.name}${s ? ` (앱 명단: ${s.name})` : " (앱 명단에 없음)"}`);
  });
  if(!matched.length){ msg.innerHTML = `<span style="color:var(--danger);">명단과 맞는 학생이 없어요.</span>`; return; }
  if(!confirm(`${json.updatedLabel || "성적 자료"}\n${matched.length}명에게 저장할까요?${skipped.length ? `\n(맞지 않아 건너뛸 학생 ${skipped.length}명)` : ""}`)) return;
  msg.textContent = "저장 중...";
  const clean = v => JSON.parse(JSON.stringify(v ?? null)); // undefined 제거
  try{
    for(let i = 0; i < matched.length; i += 400){
      const batch = db.batch();
      matched.slice(i, i + 400).forEach(({ s, x }) => batch.set(db.collection("gradeAnalysis").doc(s.uid), {
        uid: s.uid, num: Number(x.num), name: x.name,
        exams: clean(x.exams || []), trend: clean(x.trend || { type: "", desc: "" }),
        strengths: clean(x.strengths || { subjects: "", reason: "" }), weaknesses: clean(x.weaknesses || { subjects: "", reason: "" }),
        ai: clean(x.ai), updatedLabel: json.updatedLabel || "", version: json.version || "",
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp() }));
      await batch.commit();
    }
    alert(`${matched.length}명 저장했어요.${skipped.length ? `\n\n건너뛴 학생:\n${skipped.join("\n")}` : ""}`);
    gaTeacherList();
  }catch(e){
    console.error("성적 업로드 실패", e);
    msg.innerHTML = `<span style="color:var(--danger);">저장하지 못했어요 (${yajaEsc(e.code || e.message)}). 보안 규칙 배포를 확인해주세요.</span>`;
  }
}
