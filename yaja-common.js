// 야자 블록 시간표 — yaja-scanner.html, index.html(관리자모드)에서 공통으로 사용합니다.
// 요일: 0=일 1=월 2=화 3=수 4=목 5=금 6=토

const YAJA_ALL_BLOCKS = [
  { key: "p7", label: "7교시", start: "15:40", end: "16:30" },
  { key: "p8", label: "8교시", start: "16:40", end: "17:30" },
  { key: "night", label: "야간자율학습", start: "18:30", end: "21:30" },
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
