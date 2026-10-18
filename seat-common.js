// 자리 신청·배정 공통 로직 — index.html(학급 앱)과 seat.html(자리배치 도구)에서 함께 사용
// 좌석 키: "분단_행_열" (분단 0~2, 행 0~4 앞→뒤, 열 0=좌 1=우)

const SEAT_SECTIONS = 3, SEAT_ROWS = 5, SEAT_COLS = 2;

function seatKeyOf(s, r, c) { return `${s}_${r}_${c}`; }
function seatAllKeys() {
  const out = [];
  for (let s = 0; s < SEAT_SECTIONS; s++) for (let r = 0; r < SEAT_ROWS; r++) for (let c = 0; c < SEAT_COLS; c++) out.push(seatKeyOf(s, r, c));
  return out;
}
function seatLabelOf(key) {
  const [s, r, c] = key.split("_").map(Number);
  return `${s + 1}분단 ${r + 1}줄 ${c === 0 ? "왼쪽" : "오른쪽"}`;
}
function seatPartnerKey(key) {
  const [s, r, c] = key.split("_").map(Number);
  return seatKeyOf(s, r, c === 0 ? 1 : 0);
}

// 학습계획서 한 주 점수 (회고까지 제출해 '확정'된 주만 인정)
function seatWeekScore(plan) {
  if (!plan || !plan.reflectSubmitted) return 0;
  const checks = (plan.days || []).filter(d => d && d.checked).length;
  return (plan.planSubmitted ? 2 : 0) + checks + 2;
}

/*
  눈치게임식 배정 (1지망 라운드 → 2지망 라운드 → 3지망 라운드 → 나머지 무작위)
  - 각 라운드에서 같은 자리를 고른 학생끼리만 겨룸: 포인트 → 회고 제출 횟수 → 무작위
  - 앞 라운드에서 이미 찬 자리는 뒤 라운드에서 고를 수 없음 (그래서 눈치게임)
  ctx = {
    students: [{num, name, gender}],          // gender: "남"|"여"|"" (모르면 빈칸)
    apps: {num: [key1, key2, key3]},           // 신청
    points: {num: {pts, refl}},
    seatGender: {seatKey: "무관"|"남"|"여"},
    forbiddenPairs: [[numA, numB]],             // 짝 금지 (숨김)
    pinned: {num: seatKey},                     // 고정 좌석
    prevSeat: {num: seatKey},                   // 직전 자리 (다시 지망 불가)
    prevPartner: {num: num},                    // 직전 짝 (무작위 배정 때만 회피)
    avoidRepeat: bool,
    rand: () => number                          // 테스트용 (기본 Math.random)
  }
  반환: { ok, error, assignment: {seatKey: num}, how: {num: 문자열}, order: [...] }
*/
function seatRunAssignment(ctx) {
  const rand = ctx.rand || Math.random;
  const keys = seatAllKeys();
  const nums = ctx.students.map(s => s.num);
  const genderOf = {}; ctx.students.forEach(s => { genderOf[s.num] = s.gender || ""; });
  const forb = new Set((ctx.forbiddenPairs || []).map(([a, b]) => `${Math.min(a, b)}_${Math.max(a, b)}`));
  const isForbidden = (a, b) => forb.has(`${Math.min(a, b)}_${Math.max(a, b)}`);
  const seatGender = ctx.seatGender || {};
  const prevSeat = ctx.prevSeat || {};
  const pts = n => (ctx.points && ctx.points[n]) || { pts: 0, refl: 0 };
  const tie = {}; nums.forEach(n => { tie[n] = rand(); });
  const rankCmp = (a, b) => (pts(b).pts - pts(a).pts) || (pts(b).refl - pts(a).refl) || (tie[a] - tie[b]);

  if (nums.length > keys.length) return { ok: false, error: `학생 수(${nums.length})가 좌석 수(${keys.length})보다 많아요.` };

  const assignment = {}, seatOf = {}, how = {};
  const genderOk = (n, k) => { const g = seatGender[k] || "무관"; return g === "무관" || !genderOf[n] || g === genderOf[n]; };
  const canSit = (n, k, asg, avoidPrevPartner) => {
    if (!keys.includes(k) || asg[k] !== undefined) return false;
    if (!genderOk(n, k)) return false;
    const p = asg[seatPartnerKey(k)];
    if (p !== undefined && isForbidden(n, p)) return false;
    if (avoidPrevPartner && p !== undefined && ctx.prevPartner && ctx.prevPartner[n] === p) return false;
    return true;
  };

  // 0) 고정 좌석
  for (const [nStr, k] of Object.entries(ctx.pinned || {})) {
    const n = Number(nStr);
    if (!nums.includes(n) || !keys.includes(k)) continue;
    if (assignment[k] !== undefined) return { ok: false, error: `고정 좌석이 겹쳐요 (${seatLabelOf(k)}).` };
    assignment[k] = n; seatOf[n] = k; how[n] = "고정";
  }

  // 1~3) 지망 라운드
  const applicants = nums.filter(n => seatOf[n] === undefined && Array.isArray(ctx.apps && ctx.apps[n]) && ctx.apps[n].length);
  const order = applicants.slice().sort(rankCmp);
  for (let round = 0; round < 3; round++) {
    const bySeat = {};
    applicants.forEach(n => {
      if (seatOf[n] !== undefined) return;
      const k = ctx.apps[n][round];
      if (!k || prevSeat[n] === k) return;
      (bySeat[k] = bySeat[k] || []).push(n);
    });
    // 같은 책상 두 자리가 한 라운드에 함께 정해질 때 짝 금지 판정이 순서에 흔들리지 않도록 좌석 순서는 고정
    keys.forEach(k => {
      const cands = bySeat[k];
      if (!cands) return;
      cands.sort(rankCmp);
      for (const n of cands) {
        if (canSit(n, k, assignment, false)) { assignment[k] = n; seatOf[n] = k; how[n] = `${round + 1}지망`; break; }
      }
    });
  }

  // 4) 나머지 무작위 (신청 안 한 학생 + 지망 실패 학생)
  const rest = nums.filter(n => seatOf[n] === undefined);
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let filled = null;
  for (const avoid of (ctx.avoidRepeat ? [true, false] : [false])) {
    for (let attempt = 0; attempt < 500 && !filled; attempt++) {
      const asg = Object.assign({}, assignment);
      const free = shuffle(keys.filter(k => asg[k] === undefined));
      let ok = true;
      for (const n of shuffle(rest)) {
        const idx = free.findIndex(k => canSit(n, k, asg, avoid));
        if (idx === -1) { ok = false; break; }
        asg[free[idx]] = n; free.splice(idx, 1);
      }
      if (ok) filled = asg;
    }
    if (filled) break;
  }
  if (!filled) return { ok: false, error: "남/여 전용 책상·짝 금지 조건 때문에 남은 학생을 배치할 수 없어요. 좌석 설정을 확인해주세요." };
  rest.forEach(n => { how[n] = applicants.includes(n) ? "지망 실패 → 무작위" : "미신청 → 무작위"; });

  return {
    ok: true, assignment: filled, how,
    order: order.map(n => ({ num: n, pts: pts(n).pts, refl: pts(n).refl, choices: ctx.apps[n] })),
  };
}

// 짝 금지 목록 저장 형식 변환 (Firestore는 배열 안의 배열을 못 담아서 [{a,b}]로 저장)
function seatPairsFromDb(list) { return (list || []).map(x => Array.isArray(x) ? [Number(x[0]), Number(x[1])] : [Number(x.a), Number(x.b)]).filter(([a, b]) => a && b); }
function seatPairsToDb(pairs) { return (pairs || []).map(([a, b]) => ({ a: Number(a), b: Number(b) })); }

if (typeof module !== "undefined") module.exports = { SEAT_SECTIONS, SEAT_ROWS, SEAT_COLS, seatKeyOf, seatAllKeys, seatLabelOf, seatPartnerKey, seatWeekScore, seatRunAssignment, seatPairsFromDb, seatPairsToDb };
