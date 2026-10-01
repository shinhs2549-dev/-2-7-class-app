// 야자 블록 시간표 — yaja-scanner.html, index.html(관리자모드)에서 공통으로 사용합니다.
// 요일: 0=일 1=월 2=화 3=수 4=목 5=금 6=토

const YAJA_ALL_BLOCKS = [
  { key: "p7", label: "7교시", start: "15:40", end: "16:30" },
  { key: "p8", label: "8교시", start: "16:40", end: "17:30" },
  { key: "night1", label: "야간1블록", start: "18:30", end: "20:00" },
  { key: "night2", label: "야간2블록", start: "20:00", end: "21:30" },
];

function yajaDefaultBlocksForDay(dow) {
  const common = YAJA_ALL_BLOCKS.filter(b => b.key !== "p7");
  if (dow === 1 || dow === 3) return YAJA_ALL_BLOCKS.slice(); // 월, 수: 7·8교시+야간
  if (dow >= 2 && dow <= 5) return common;                    // 화목금: 8교시+야간
  return []; // 주말 기본 미운영
}

function yajaToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function yajaDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// override: yajaCalendarOverrides 문서의 operating 필드값 (true/false/undefined)
function yajaEffectiveBlocks(dow, override) {
  if (override === false) return [];
  if (override === true) {
    const def = yajaDefaultBlocksForDay(dow);
    return def.length ? def : YAJA_ALL_BLOCKS.slice();
  }
  return yajaDefaultBlocksForDay(dow);
}

// 학생의 요일별 야자 신청 여부 확인
// enrollMap 형태: { "1": {p7:true,p8:false,...}, "2": {...}, ... } (요일 1=월 ~ 5=금)
function yajaIsEnrolled(enrollMap, dow, blockKey) {
  return !!(enrollMap && enrollMap[dow] && enrollMap[dow][blockKey]);
}

// 블록이 이미 끝났는지 (아직 안 끝난 블록은 결석으로 세지 않음)
function yajaBlockIsPast(dateObj, block, now) {
  now = now || new Date();
  const todayKey = yajaDateKey(now);
  const key = yajaDateKey(dateObj);
  if (key < todayKey) return true;
  if (key > todayKey) return false;
  return now.getHours() * 60 + now.getMinutes() > yajaToMinutes(block.end) + 15;
}

// 출석률 공통 계산
// students: [{num, yajaEnroll}], overrides: {dateKey: true/false}
// attendance: yajaAttendance 문서 배열, excuses: yajaExcuses 문서 배열
// 반환: { [num]: {total, attended, excused, absent} }
// 판정 우선순위: 출석(스캔) > 사유(담임 인정 또는 학생 신청 중 반려 안 된 것) > 결석
function yajaComputeStats(students, startStr, endStr, overrides, attendance, excuses) {
  const att = {}, exc = {};
  attendance.forEach(r => {
    const k = `${r.date}_${r.num}_${r.block}`;
    if (r.checkInAt) att[k] = true;
    if (r.excused) exc[k] = true;
  });
  excuses.forEach(r => {
    if (r.status !== "rejected") exc[`${r.date}_${r.num}_${r.block}`] = true;
  });

  const out = {};
  students.forEach(s => { out[s.num] = { total: 0, attended: 0, excused: 0, absent: 0 }; });
  const now = new Date();
  const cursor = new Date(startStr + "T00:00:00");
  const endDate = new Date(endStr + "T00:00:00");
  while (cursor <= endDate) {
    const key = yajaDateKey(cursor);
    const dow = cursor.getDay();
    const blocks = yajaEffectiveBlocks(dow, overrides[key] === undefined ? null : overrides[key]);
    blocks.forEach(b => {
      if (!yajaBlockIsPast(cursor, b, now)) return;
      students.forEach(s => {
        if (!yajaIsEnrolled(s.yajaEnroll, dow, b.key)) return;
        const k = `${key}_${s.num}_${b.key}`;
        const o = out[s.num];
        o.total++;
        if (att[k]) o.attended++;
        else if (exc[k]) o.excused++;
        else o.absent++;
      });
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// 출석률(%) — 사유 인정분은 분모에서 제외
function yajaRate(o) {
  const denom = o.total - o.excused;
  if (denom <= 0) return null;
  return Math.round((o.attended / denom) * 100);
}

function yajaEsc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
