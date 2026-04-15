import { useState, useMemo, useEffect } from "react";

// ===== DECISIONS =====
const ALL_DECISIONS = [
  { id: "respond",  label: "応答する",     desc: "同じ形式で信号を返す",               stance: "contact",  aggression: 0  },
  { id: "silence",  label: "沈黙する",     desc: "受信したことを隠し、観察を続ける",   stance: "isolate",  aggression: 0  },
  { id: "mimic",    label: "模倣する",     desc: "信号をそのままコピーして送り返す",   stance: "contact",  aggression: 1  },
  { id: "decode",   label: "解読を試みる", desc: "意味を探り、言語化しようとする",     stance: "explore",  aggression: 0  },
  { id: "warn",     label: "警告を発する", desc: "他の文明にこの信号の存在を知らせる", stance: "isolate",  aggression: 1  },
  { id: "welcome",  label: "歓迎を示す",   desc: "友好的なメッセージを添えて返信する", stance: "contact",  aggression: -1 },
  { id: "ignore",   label: "無視する",     desc: "信号は存在しないものとして扱う",     stance: "isolate",  aggression: -1 },
  { id: "destroy",  label: "遮断する",     desc: "信号の受信装置を意図的に停止させる", stance: "isolate",  aggression: 2  },
];

// ===== ROLES =====
const ROLES = [
  { id:"scientist",  name:"科学者",  icon:"⚗️",  filter:"論理と証拠で読む。感情は排除する。",                   allowed:["respond","silence","decode","mimic","warn"],          forbidden:["welcome","ignore","destroy"],      forbiddenReason:"感情的・非論理的な選択は取れない" },
  { id:"politician", name:"政治家",  icon:"🏛️",  filter:"脅威か、利益か。人類の安全を最優先に考える。",         allowed:["silence","warn","ignore","respond","welcome","destroy"],forbidden:["decode","mimic"],                  forbiddenReason:"意味不明な行動は政治的リスクが高すぎる" },
  { id:"poet",       name:"詩人",    icon:"🪶",   filter:"感情と美しさで読む。言葉の裏にある意志を感じる。",     allowed:["respond","decode","welcome","silence","mimic"],        forbidden:["destroy","warn","ignore"],         forbiddenReason:"美しい可能性を封じることはできない" },
  { id:"soldier",    name:"軍人",    icon:"⚔️",   filter:"敵か味方か。行動パターンに脅威の兆候を探す。",         allowed:["silence","warn","destroy","ignore","respond"],         forbidden:["welcome","decode","mimic"],        forbiddenReason:"未確認の脅威に友好的な態度は取れない" },
  { id:"child",      name:"子ども",  icon:"🌱",   filter:"純粋に問う。「なぜ」を繰り返す。大人が見落とすものを見る。", allowed:["respond","welcome","decode","mimic","ignore"],    forbidden:["destroy","warn","silence"],        forbiddenReason:"怖がって隠したり壊したりするのは嫌だ" },
  { id:"philosopher",name:"哲学者",  icon:"🔭",   filter:"存在の意味を問う。なぜ彼らは発信したのかを考える。",   allowed:["decode","silence","respond","ignore","welcome"],       forbidden:["destroy","warn","mimic"],          forbiddenReason:"軽率な行動は存在への冒涜になる" },
  { id:"doctor",     name:"医師",    icon:"🩺",   filter:"生命の観点で読む。これは苦しみのサインか、それとも健康の証か。", allowed:["respond","welcome","decode","silence","warn"], forbidden:["destroy","mimic","ignore"],        forbiddenReason:"生命の可能性を遮断・無視することはできない" },
];

// ===== SIGNAL CARD POOL =====
const SIGNAL_CARD_POOL = [
  { symbol:"◈",  title:"反復する幾何学",   desc:"同じ図形が螺旋状に縮小しながら中心へ消えていく。終端に何かがある。送ってきた者は、まだそこにいるのだろうか。" },
  { symbol:"∿",  title:"波形の変容",       desc:"規則的な波が一度だけ乱れ、また規則に戻る。その乱れた部分だけが、わずかに温かい。" },
  { symbol:"⊕",  title:"重なる円",         desc:"無数の円が重なり合い、交差点だけが異なる色を持つ。数えると素数になる。数えるほど、意味から遠ざかる気がする。" },
  { symbol:"⟁",  title:"方向のない矢印",   desc:"矢印のような形だが、すべての端が尖っている。どこにも向いていない。あるいは、すべてに向いている。" },
  { symbol:"⌘",  title:"接続の記号",       desc:"四方向に均等に伸びる線。その先端がそれぞれ異なるリズムで点滅している。何かが近づいている——あるいは、こちらが近づかされている。" },
  { symbol:"◯",  title:"完全な円",         desc:"完璧な真円がただ一つ。内側は空白。外側も空白。止まっているのか、動きが遅すぎて見えないだけなのか。" },
  { symbol:"∞",  title:"終わらない数列",   desc:"数列が送られてきたが、計算するとどこまでも収束しない。これは問いかけか。それとも、答えか。" },
  { symbol:"△▽", title:"鏡像の三角形",     desc:"上向きと下向きの三角形が重なる。重なった部分だけが振動している。対称に見えるが、片方だけが微かに震えている。" },
  { symbol:"░",  title:"ノイズの中の輪郭", desc:"ランダムなパターンの中に、人間に似た輪郭が浮かび上がる瞬間がある。こちらが読んでいることを、彼らは知っているのかもしれない。" },
  { symbol:"⊗",  title:"消去の印",         desc:"×印に見えるが、線が交差する前に止まっている。触れずに、ただ近づいている。解読できなくても、受け取ったという事実は残る。" },
  { symbol:"⟡",  title:"六角の残像",       desc:"六つの頂点を持つ形が、少しずつ回転している。一周するたびに、一頂点だけが消える。最後に何が残るのか。" },
  { symbol:"⌬",  title:"不完全な三角形",   desc:"三辺のうち一辺だけが描かれていない。閉じることを拒んでいるのか、閉じる方法を知らないのか。" },
  { symbol:"⍟",  title:"星の解体",         desc:"星形の図形が内側から崩れていく。崩れた破片は消えずに漂っている。一度だけ光った。それ以来、何も変わっていないように見える。" },
  { symbol:"◉",  title:"中心と外縁",       desc:"同心円の中心だけが、他と異なる密度を持つ。中心に向かうほど、静かになる。沈黙が濃くなる。" },
  { symbol:"⊛",  title:"重ねられた星",     desc:"複数の星形が重なり合い、どれが最初の形か判別できない。始まりと終わりが区別できない。あるいは、どちらも最初から存在しないのかもしれない。" },
  { symbol:"⋈",  title:"交差する弧",       desc:"二つの弧が交差するが、交点では互いをすり抜けている。形は読めるが、意図が読めない——意図があるとすれば、の話だが。" },
  { symbol:"⌀",  title:"直径の記号",       desc:"円を水平に貫く線。それ以上でも以下でもない。だが、その線がなければ円は円として成立しなかった。" },
  { symbol:"⊞",  title:"分割された正方形", desc:"四等分された正方形。各区画に異なる密度のノイズが満ちている。誰かが同じものを見て、同じ問いを持ったことがあるはずだ。" },
  { symbol:"⟐",  title:"非対称な菱形",     desc:"菱形に見えるが、左右の角度が微妙に異なる。意図的な誤差か、それとも彼らの空間では、これが完璧な菱形なのか。" },
  { symbol:"⊘",  title:"横断された円",     desc:"円の中を斜めに線が走っている。禁止の記号に似ているが、線の角度が人間の知る記号とは違う。美しいと思った。それが何を意味するのかはまだわからない。" },
];

// ===== ALIEN REACTIONS =====
// Keyed by [dominant stance]_[unified|split]
const ALIEN_REACTIONS = {
  contact_unified: {
    symbol: "◈→◈", color: "#34d399",
    title: "信号が強くなった",
    desc: "送信の間隔が縮まり、パターンが変化した。こちらの動きに、何かが呼応している。引き寄せられているのか、招かれているのか——まだわからない。",
    hint: "彼らはこちらの存在を認識した。",
  },
  contact_split: {
    symbol: "∿≠∿", color: "#f59e0b",
    title: "信号が揺らいだ",
    desc: "受信パターンに乱れが生じた。統一されていない何かを察知したのか、信号は問いかけるように変容した。あなたたちの中の分裂が、宇宙に届いた。",
    hint: "彼らは人類の不一致を感じ取った。",
  },
  isolate_unified: {
    symbol: "◯　◯", color: "#7dd3fc",
    title: "信号が止まった",
    desc: "長い沈黙。観測機器はノイズさえ拾わなくなった。これは撤退か、それとも待機か。こちらの沈黙が、向こうの沈黙を呼んだのかもしれない。",
    hint: "彼らは距離を保った。",
  },
  isolate_split: {
    symbol: "⊗　∿", color: "#f87171",
    title: "信号が複雑化した",
    desc: "これまでとは異なる周波数帯で、複数の信号が同時に届いた。まるで、こちらの混乱に応じるかのように。彼らは何かを判断しようとしている。",
    hint: "彼らは人類の矛盾を観察している。",
  },
  explore_unified: {
    symbol: "⊕⟡⊕", color: "#a78bfa",
    title: "信号に新しい層が現れた",
    desc: "既存のパターンの下に、別の構造が隠されていたことが判明した。解読しようとした行為そのものが、次の層を開いた鍵だったのかもしれない。",
    hint: "彼らは人類の好奇心を歓迎した。",
  },
  explore_split: {
    symbol: "⊕?⊕", color: "#f59e0b",
    title: "信号が問い返してきた",
    desc: "解読の試みに対して、信号は新たなパターンを返してきた。しかし内容は一致していない。あなたたちが複数の解釈をしたことを、彼らは把握しているのか。",
    hint: "彼らはこちらの解釈の多様さに反応した。",
  },
};

// ===== FINAL DECISIONS =====
const FINAL_DECISIONS = [
  { id:"embassy",   label:"外交使節を送る",     desc:"人類の代表として、物理的な接触を試みる。最も積極的な意思表示。",   stance:"contact",  bonus: 15 },
  { id:"broadcast", label:"全人類に開示する",   desc:"この接触の事実を世界に公表し、人類全体の意思決定に委ねる。",     stance:"explore",  bonus: 10 },
  { id:"archive",   label:"記録として封印する", desc:"この接触を極秘記録として残し、次の世代の判断に委ねる。",         stance:"explore",  bonus: 8  },
  { id:"treaty",    label:"不干渉条約を結ぶ",   desc:"互いの領域に踏み込まないことを宣言し、距離を保つ。",             stance:"isolate",  bonus: 12 },
  { id:"silence",   label:"永久に沈黙する",     desc:"この接触はなかったものとして、一切の記録を消去する。",           stance:"isolate",  bonus: 10 },
];

// ===== ROUND NARRATIVES =====
const ROUND_NARRATIVES = [
  ["受信から72時間が経った。世界はまだ知らない。あなたたちだけが、この静寂の重さを知っている。","信号は繰り返し届く。同じパターン。同じ間隔。まるで、気づかれるのを静かに待っているかのように。","観測室の窓の外、夜明け前の空は異様なほど澄んでいた。こういう夜に、歴史は動く。"],
  ["解析が進むほど、わからなくなる。これは知性のパターンか、それとも宇宙の偶然が作り出した幻か。","二度目の受信。前回と微妙に違う。まるで、こちらの沈黙に対して何かを調整したかのように。","外では誰かが気づき始めている。時間がない。あなたたちは今、人類の代わりに考えなければならない。"],
  ["これが最後の信号だ。この決断は、記録に残る。あるいは、誰にも知られないまま終わるかもしれない。","信号の間隔が短くなっている。何かが変わろうとしている。あなたたちの応答が、その変化を決める。","この部屋で下された決断が、何千年後かに語られることになるかもしれない。あるいは、永遠に秘密のまま消えるか。"],
];

// ===== REVELATIONS =====
// context = 信号の正体（彼らが何者か）
// fate    = 人類の運命（あなたたちの選択が彼らにどう届いたか）
const REVELATIONS = [
  {
    id:"r1",
    context:"彼らは「約束」を持つ種族だった。遠い過去、別の知性体と「応答があれば還る」という契約を交わし、それ以来ずっと待ち続けていた。信号は攻撃でも調査でもなく、その約束を果たすための呼びかけだった。",
    fate:"あなたたちが何かを返したなら、彼らは還ってくる。返さなかったなら、彼らはまた待ち続ける——次の知性体が現れるまで、宇宙の果てで。どちらであれ、あなたたちは彼らの歴史に刻まれた最初の名前になった。",
    idealStance:"contact", idealAggression:0,
  },
  {
    id:"r2",
    context:"彼らの文明では、沈黙は最上位の敬意だった。知性体として理解できないものに出会ったとき、語ることをやめ、ただ観察し続けること——それが彼らの言う「対話の始まり」だった。言葉を返すほど、相手を軽く見ていることになった。",
    fate:"あなたたちが沈黙を選んだなら、彼らはそれを最高の敬意と受け取った。応答を返したなら、彼らはこちらをまだ未熟な知性体と判断し、観察リストの下位に移した。あなたたちの選択は、彼らの記録に残っている。",
    idealStance:"isolate", idealAggression:-1,
  },
  {
    id:"r3",
    context:"信号を送った者たちは、すでに存在していない。自分たちの文明が消える前に、宇宙のどこかへ「自分たちがいた証拠」を残したかった。これは救難信号でも脅威でもなく、消えゆく文明が刻んだ碑文だった。",
    fate:"あなたたちがその碑文を読もうとしたなら、彼らの願いは叶えられた。無視したなら、碑文はまた誰かが読むのを待ち続ける。どちらにせよ、あなたたちは宇宙に消えた文明の最後の証人になれる機会を持った唯一の種族だ。",
    idealStance:"explore", idealAggression:0,
  },
  {
    id:"r4",
    context:"彼らはかつて、別の種族に完全に「理解」された経験を持つ。その結果、その種族に吸収され、独自の文化と言語を失った。だから信号は試験だった——受け取った側が理解しようとするのか、距離を保つのかを見極めるための。",
    fate:"あなたたちが近づこうとしたなら、彼らは接触を断った。距離を保ったなら、彼らはあなたたちを「安全な知性体」として分類し、次のステップを検討し始めた。人類はまだ知らない——あの沈黙の裏で、何かが動き出したことを。",
    idealStance:"isolate", idealAggression:0,
  },
  {
    id:"r5",
    context:"彼らは宇宙に「感情を持つ知性体」が他に存在するかどうかを確かめたかった。論理的な応答には興味がなかった。怒り、歓喜、恐怖、好奇心——何であれ「感情から生まれた反応」こそが、彼らの探していたものだった。",
    fate:"あなたたちが感情のままに動いたなら、彼らはその信号を「発見」として記録した。冷静すぎる判断を返したなら、彼らは人類を「まだ感情を持たない段階の知性体」とみなし、リストから外した。感情こそが、通行証だった。",
    idealStance:"contact", idealAggression:1,
  },
  {
    id:"r6",
    context:"彼らの文化に「交換」という概念はなかった。何かを与えることは、見返りを前提としない行為だった。信号は贈り物だった——受け取った側が何かを返そうとすればするほど、贈り物の純粋さは損なわれていく。",
    fate:"あなたたちが何も返さず受け取ったなら、彼らは満足した。何かを返そうとしたなら、彼らは傷ついた——自分たちの贈り物が「取引」と受け取られたことに。人類は気づかないまま、何かを壊したかもしれない。",
    idealStance:"isolate", idealAggression:-1,
  },
  {
    id:"r7",
    context:"彼らは「解釈の多様性」を研究していた。同じ信号を受け取った異なる知性体が、どれだけ異なる意味を見出すか——その差異のパターンから、その種族の思考構造を読み解くことができると考えていた。",
    fate:"あなたたちが悩み、議論し、時に意見が割れた——そのすべてが記録された。彼らにとって、一致した答えより、多様な解釈の方がはるかに価値があった。あなたたちがバラバラだったほど、彼らは喜んだかもしれない。",
    idealStance:"explore", idealAggression:1,
  },
];

// ===== RANK CALC =====
// スコア配分：信号との一致30点・人類の一貫性20点・最終決断50点
function calcRank(decisions, revelation, finalDecision) {
  const stances = decisions.map(d => ALL_DECISIONS.find(dc=>dc.id===d.decisionId)?.stance);
  const stanceCounts = stances.reduce((acc,s)=>{ acc[s]=(acc[s]||0)+1; return acc; },{});
  const maxCount = Math.max(...Object.values(stanceCounts));
  const consistencyScore = Math.round((maxCount/decisions.length)*20); // max 20
  const dominantStance = Object.entries(stanceCounts).sort((a,b)=>b[1]-a[1])[0][0];
  const aggrValues = decisions.map(d=>ALL_DECISIONS.find(dc=>dc.id===d.decisionId)?.aggression??0);
  const avgAggr = aggrValues.reduce((a,b)=>a+b,0)/aggrValues.length;

  // 信号との一致：max 30
  let alignScore = 0;
  if (dominantStance===revelation.idealStance) alignScore+=22;
  else if ((dominantStance==="contact"&&revelation.idealStance==="explore")||(dominantStance==="explore"&&revelation.idealStance==="contact")) alignScore+=10;
  const aggrDiff = Math.abs(avgAggr-revelation.idealAggression);
  alignScore += aggrDiff===0?8:aggrDiff<=1?4:0;

  // 最終決断：max 50
  const fd = FINAL_DECISIONS.find(f=>f.id===finalDecision);
  let finalBonus = 0;
  if (fd) {
    if (fd.stance===revelation.idealStance) finalBonus = 50;
    else if (
      (fd.stance==="contact"&&revelation.idealStance==="explore")||
      (fd.stance==="explore"&&revelation.idealStance==="contact")
    ) finalBonus = 25;
    else finalBonus = 5;
  }

  const total = Math.min(100, consistencyScore+alignScore+finalBonus);

  let rank,rankLabel,rankColor,rankDesc;
  if (total>=90){ rank="S"; rankColor="#fbbf24"; rankLabel="完全共鳴";    rankDesc="あなたたちの選択は、驚くほど彼らの意図と重なっていた。最終決断が、その確信を証明した。"; }
  else if(total>=75){ rank="A"; rankColor="#34d399"; rankLabel="深い理解";    rankDesc="一貫した意志で応じた。最終決断がその方向性を明確にした。彼らはそれを感じ取ったはずだ。"; }
  else if(total>=55){ rank="B"; rankColor="#7dd3fc"; rankLabel="不完全な接触"; rankDesc="届いた部分もあれば、すれ違った部分もある。最終決断が、その差を少し埋めた。"; }
  else if(total>=35){ rank="C"; rankColor="#f59e0b"; rankLabel="混乱した応答"; rankDesc="人類の声はひとつではなかった。最終決断だけが、唯一の統一点だったかもしれない。"; }
  else{ rank="D"; rankColor="#f87171"; rankLabel="完全な断絶";    rankDesc="行動は彼らの意図と真逆だった。最終決断も、その溝を埋めることはできなかった。"; }

  return { rank, rankLabel, rankColor, rankDesc, total, consistencyScore, alignScore, finalBonus, dominantStance };
}

// ===== UTILS =====
function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }
function generateSignalCards(){ return shuffle(SIGNAL_CARD_POOL).slice(0,9).map((c,i)=>({id:i+1,...c})); }
function getDominantStance(decisions){
  const counts = decisions.reduce((acc,d)=>{ const st=ALL_DECISIONS.find(dc=>dc.id===d.decisionId)?.stance; if(st) acc[st]=(acc[st]||0)+1; return acc; },{});
  return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||"explore";
}
function getAlienReaction(roundDecisions){
  const stances = roundDecisions.map(d=>ALL_DECISIONS.find(dc=>dc.id===d.decisionId)?.stance);
  const counts = stances.reduce((acc,s)=>{ acc[s]=(acc[s]||0)+1; return acc; },{});
  const dominant = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  const allSame = new Set(roundDecisions.map(d=>d.decisionId)).size===1;
  const unified = allSame || roundDecisions.length===1 ? "unified" : "split";
  return ALIEN_REACTIONS[`${dominant}_${unified}`] || ALIEN_REACTIONS[`${dominant}_unified`];
}

const PHASE = { INTRO:"intro", ROLE_SELECT:"role_select", SIGNAL:"signal", DECIDE:"decide", ALIEN:"alien", FINAL:"final", RESULT:"result", REVELATION:"revelation" };
const STANCE_LABEL = { contact:"接触志向", isolate:"孤立志向", explore:"探索志向" };

// ===== MAIN =====
export default function SignalGame() {
  const [phase, setPhase]                       = useState(PHASE.INTRO);
  const [selectedRole, setSelectedRole]         = useState(null);
  const [role, setRole]                         = useState(null);
  const [signalDeck, setSignalDeck]             = useState([]);
  const [signalSet, setSignalSet]               = useState([]);
  const [round, setRound]                       = useState(1);
  const [decisions, setDecisions]               = useState([]);
  const [currentDecision, setCurrentDecision]   = useState(null);
  const [alienReaction, setAlienReaction]       = useState(null);
  const [finalDecision, setFinalDecision]       = useState(null);
  const [revelation, setRevelation]             = useState(null);
  const [rankResult, setRankResult]             = useState(null);
  const [narrative, setNarrative]               = useState("");
  const totalRounds = 3;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [phase]);

  function goToRoleSelect(){ setSelectedRole(null); setPhase(PHASE.ROLE_SELECT); }

  function startGame(){
    const chosen = ROLES.find(r=>r.id===selectedRole);
    const deck = generateSignalCards();
    setRole(chosen); setSignalDeck(deck);
    setSignalSet(deck.slice(0,3));
    setNarrative(shuffle(ROUND_NARRATIVES[0])[0]);
    setRound(1); setDecisions([]); setCurrentDecision(null);
    setPhase(PHASE.SIGNAL);
  }

  function submitRound(){
    if(!currentDecision||!role) return;
    const newDecision = { round, role, decisionId: currentDecision };
    const updated = [...decisions, newDecision];
    setDecisions(updated);
    setAlienReaction(getAlienReaction([newDecision]));
    setPhase(PHASE.ALIEN);
    if(round<totalRounds){
      setSignalSet(signalDeck.slice(round*3, round*3+3));
      setNarrative(shuffle(ROUND_NARRATIVES[round])[0]);
    }
  }

  function proceedFromAlien(){
    if(round<totalRounds){
      setRound(round+1); setCurrentDecision(null);
      setPhase(PHASE.SIGNAL);
    } else {
      setPhase(PHASE.FINAL);
    }
  }

  function submitFinal(){
    if(!finalDecision) return;
    const rev = shuffle(REVELATIONS)[0];
    setRevelation(rev);
    setRankResult(calcRank(decisions, rev, finalDecision));
    setPhase(PHASE.RESULT);
  }

  function openRevelation(){ setPhase(PHASE.REVELATION); }
  const overallStance = getDominantStance(decisions);

  return (
    <div style={s.root}>
      <StarField />
      <div style={s.container}>
        {phase===PHASE.INTRO       && <IntroScreen onNext={goToRoleSelect} />}
        {phase===PHASE.ROLE_SELECT && <RoleSelectScreen selectedRole={selectedRole} setSelectedRole={setSelectedRole} onStart={startGame} />}
        {phase===PHASE.SIGNAL      && <SignalScreen signals={signalSet} round={round} totalRounds={totalRounds} narrative={narrative} onNext={()=>{setCurrentDecision(null);setPhase(PHASE.DECIDE);}} />}
        {phase===PHASE.DECIDE      && <DecideScreen role={role} currentDecision={currentDecision} onSelect={setCurrentDecision} onSubmit={submitRound} round={round} totalRounds={totalRounds} />}
        {phase===PHASE.ALIEN       && <AlienReactionScreen reaction={alienReaction} round={round} totalRounds={totalRounds} onNext={proceedFromAlien} />}
        {phase===PHASE.FINAL       && <FinalDecisionScreen decisions={decisions} overallStance={overallStance} finalDecision={finalDecision} setFinalDecision={setFinalDecision} onSubmit={submitFinal} />}
        {phase===PHASE.RESULT      && <ResultScreen decisions={decisions} finalDecision={finalDecision} onReveal={openRevelation} />}
        {phase===PHASE.REVELATION  && <RevelationScreen revelation={revelation} rankResult={rankResult} onRestart={()=>setPhase(PHASE.INTRO)} />}
      </div>
    </div>
  );
}

// ===== STAR FIELD =====
function StarField(){
  const stars = useMemo(()=>Array.from({length:80},(_,i)=>({ id:i,x:Math.random()*100,y:Math.random()*100,size:Math.random()*2+.5,opacity:Math.random()*.5+.2,dur:Math.random()*3+2 })),[]);
  // 大きめの光点（nebula orbs）
  const orbs = useMemo(()=>Array.from({length:5},(_,i)=>({ id:i,x:10+i*18+Math.random()*10,y:10+Math.random()*80,size:80+Math.random()*120,dur:8+Math.random()*6,delay:i*1.5 })),[]);
  return (
    <div style={s.starField}>
      {/* nebula orbs */}
      {orbs.map(o=>(
        <div key={`orb-${o.id}`} style={{
          position:"absolute",left:`${o.x}%`,top:`${o.y}%`,
          width:o.size,height:o.size,borderRadius:"50%",
          background:"radial-gradient(circle, rgba(56,189,248,.06) 0%, transparent 70%)",
          animation:`orbDrift ${o.dur}s ease-in-out ${o.delay}s infinite alternate`,
          pointerEvents:"none",
        }} />
      ))}
      {/* stars */}
      {stars.map(st=>(
        <div key={st.id} style={{
          position:"absolute",left:`${st.x}%`,top:`${st.y}%`,
          width:st.size,height:st.size,borderRadius:"50%",
          background:"white",opacity:st.opacity,
          animation:`twinkle ${st.dur}s ease-in-out infinite alternate`,
        }} />
      ))}
      <style>{`
        @keyframes twinkle{from{opacity:.1}to{opacity:.85}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{text-shadow:0 0 20px #7dd3fc}50%{text-shadow:0 0 40px #38bdf8,0 0 60px #0ea5e9}}
        @keyframes symbolFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.04)}}
        @keyframes pulseRing{0%{transform:scale(1);opacity:1}100%{transform:scale(1.6);opacity:0}}
        @keyframes orbDrift{
          0%{transform:translate(0,0) scale(1);opacity:.6}
          50%{transform:translate(12px,-18px) scale(1.12);opacity:1}
          100%{transform:translate(-8px,10px) scale(.92);opacity:.5}
        }
        @keyframes signalPulse{
          0%,100%{box-shadow:0 0 0 0 rgba(125,211,252,.0)}
          50%{box-shadow:0 0 0 8px rgba(125,211,252,.08)}
        }
        @keyframes rippleExpand{
          0%{transform:translate(-50%,-50%) scale(0);opacity:.5}
          100%{transform:translate(-50%,-50%) scale(3);opacity:0}
        }
        @keyframes iconBreath{
          0%,100%{opacity:.65;filter:drop-shadow(0 0 3px rgba(56,189,248,.2))}
          50%{opacity:1;filter:drop-shadow(0 0 14px rgba(56,189,248,.9))}
        }
        @keyframes iconRipple{
          0%{transform:scale(1);opacity:.5}
          100%{transform:scale(2.4);opacity:0}
        }
        @keyframes titleGlow{
          0%,100%{color:#7dd3fc;text-shadow:none}
          50%{color:#bae6fd;text-shadow:0 0 8px rgba(125,211,252,.5)}
        }
        @keyframes lineBreath{
          0%,100%{opacity:.15;transform:scaleY(1)}
          50%{opacity:.6;transform:scaleY(.85)}
        }
        @keyframes particleDrift{
          0%{transform:translate(0,0);opacity:.2}
          50%{opacity:.7}
          100%{transform:translate(var(--dx,12px),var(--dy,-15px));opacity:.1}
        }
      `}</style>
    </div>
  );
}

// ===== INTRO =====
function IntroScreen({onNext}){
  return (
    <div style={{...s.card,animation:"fadeIn .8s ease"}}>
      <div style={s.signalSymbol}>◈</div>
      <h1 style={s.title}>SIGNAL</h1>
      <p style={s.subtitle}>
        宇宙から信号が届いた。<br/>
        解読できない。<br/>
        でも、何かを求めている。
      </p>
      <p style={{...s.body,textAlign:"center",color:"#b8c8da",fontSize:13,letterSpacing:".02em"}}>
        あなたは人類の代表として、<br/>
        この信号にどう応答するかを決めなければならない。
      </p>
      <button style={s.primaryBtn} onClick={onNext}>役割を選ぶ →</button>
    </div>
  );
}

// ===== ROLE SELECT =====
function RoleSelectScreen({selectedRole,setSelectedRole,onStart}){
  return (
    <div style={{...s.card,animation:"fadeIn .6s ease"}}>
      <h2 style={s.heading}>役割を選ぶ</h2>
      <p style={s.body}>あなたはどの立場から、この信号と向き合いますか。</p>
      <div style={s.roleSelectGrid}>
        {ROLES.map(r=>{
          const selected = selectedRole===r.id;
          return (
            <button key={r.id}
              style={selected?s.roleSelectCardActive:s.roleSelectCard}
              onClick={()=>setSelectedRole(r.id)}>
              <span style={s.roleSelectIcon}>{r.icon}</span>
              <div style={{flex:1}}>
                <span style={s.roleSelectName}>{r.name}</span>
                <span style={selected?s.roleSelectFilterActive:s.roleSelectFilter}>{r.filter}</span>
                <span style={s.roleSelectForbidden}>選択不可：{r.forbiddenReason}</span>
              </div>
              {selected&&<span style={s.roleCheck}>✓</span>}
            </button>
          );
        })}
      </div>
      <button style={selectedRole?s.primaryBtn:s.disabledBtn} onClick={selectedRole?onStart:undefined}>
        信号を受信する
      </button>
    </div>
  );
}

// ===== SIGNAL =====
function SignalScreen({signals,round,totalRounds,narrative,onNext}){
  const [tick, setTick] = useState(0);
  useEffect(()=>{
    const id = setInterval(()=>setTick(t=>t+1), 50);
    return ()=>clearInterval(id);
  },[]);

  // ランダムな浮遊粒子（画面内に常時漂う）
  const particles = useMemo(()=>Array.from({length:18},(_,i)=>({
    id:i,
    x: 5 + Math.random()*90,
    y: 5 + Math.random()*90,
    size: 1.5 + Math.random()*2.5,
    dur: 5 + Math.random()*7,
    delay: Math.random()*6,
    driftX: (Math.random()-.5)*30,
    driftY: (Math.random()-.5)*30,
  })),[]);

  return (
    <div style={{...s.card,position:"relative",overflow:"hidden",animation:"fadeIn .6s ease"}}>

      {/* 常時漂う粒子層 */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}>
        {particles.map(p=>(
          <div key={p.id} style={{
            position:"absolute",
            left:`${p.x}%`, top:`${p.y}%`,
            width:p.size, height:p.size,
            borderRadius:"50%",
            background:"rgba(125,211,252,.6)",
            animation:`particleDrift ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* 中央から広がる同心円波 */}
      <div style={{position:"absolute",top:"28%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",zIndex:0}}>
        {[0,1.4,2.8].map((delay,i)=>(
          <div key={i} style={{
            position:"absolute",
            width:180,height:180,
            borderRadius:"50%",
            border:`1px solid rgba(125,211,252,${.15-i*.04})`,
            top:"50%",left:"50%",
            transform:"translate(-50%,-50%)",
            animation:`rippleExpand 4.2s ease-out ${delay}s infinite`,
          }} />
        ))}
      </div>

      {/* コンテンツ（z-index 1以上） */}
      <div style={{position:"relative",zIndex:1}}>
        <p style={s.roundBadge}>ROUND {round} / {totalRounds} — 受信</p>
        <h2 style={s.heading}>信号を受信</h2>
        <p style={s.narrative}>{narrative}</p>

        <div style={s.signalList}>
          {signals.map((sig,i)=>(
            <div key={sig.id} style={{
              ...s.signalCard,
              animation:`fadeIn .8s ease ${i*.3}s both`,
            }}>
              {/* アイコン：個別に呼吸する速度 */}
              <div style={{position:"relative",flexShrink:0,width:40,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{
                  fontSize:26,
                  color:"#38bdf8",
                  display:"block",
                  position:"relative",
                  zIndex:1,
                  animation:`iconBreath ${3.2+i*.7}s ease-in-out ${i*.5}s infinite`,
                }}>{sig.symbol}</span>
                {/* アイコン周囲のリング */}
                <div style={{
                  position:"absolute",
                  width:32,height:32,
                  borderRadius:"50%",
                  border:"1px solid rgba(56,189,248,.4)",
                  animation:`iconRipple ${2.8+i*.4}s ease-out ${i*.6+.3}s infinite`,
                }} />
              </div>

              <div style={{flex:1}}>
                <p style={{
                  ...s.signalTitle,
                  animation:`titleGlow ${4+i*.8}s ease-in-out ${i*.3}s infinite`,
                }}>{sig.title}</p>
                <p style={s.signalDesc}>{sig.desc}</p>
              </div>

              {/* カード右端の縦ライン（呼吸） */}
              <div style={{
                position:"absolute",right:0,top:0,bottom:0,width:2,borderRadius:"0 10px 10px 0",
                background:`rgba(125,211,252,.15)`,
                animation:`lineBreath ${3.5+i*.6}s ease-in-out ${i*.4}s infinite`,
              }} />
            </div>
          ))}
        </div>

        <button style={s.primaryBtn} onClick={onNext}>決断する</button>
      </div>
    </div>
  );
}

// ===== DECIDE =====
function DecideScreen({role,currentDecision,onSelect,onSubmit,round,totalRounds}){
  const roleData = ROLES.find(r=>r.id===role?.id);
  return (
    <div style={{...s.card,animation:"fadeIn .6s ease"}}>
      <p style={s.roundBadge}>ROUND {round} / {totalRounds} — 決断</p>
      <h2 style={s.heading}>応答を選ぶ</h2>
      {role&&roleData&&(
        <div>
          <p style={s.filterNote}>{role.icon} {role.name}として：「{roleData.filter}」</p>
          <div style={s.decisionGrid}>
            {ALL_DECISIONS.map(d=>{
              const forbidden=roleData.forbidden.includes(d.id);
              const selected=currentDecision===d.id;
              return (
                <button key={d.id}
                  style={forbidden?s.decisionBtnForbidden:selected?s.decisionBtnActive:s.decisionBtn}
                  onClick={()=>!forbidden&&onSelect(d.id)}>
                  <span style={forbidden?s.decisionLabelForbidden:s.decisionLabel}>{d.label}</span>
                  <span style={s.decisionDesc}>{forbidden?"— 選択不可 —":d.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <button style={currentDecision?s.primaryBtn:s.disabledBtn} onClick={currentDecision?onSubmit:undefined}>
        決断を送信する
      </button>
    </div>
  );
}

// ===== ALIEN REACTION =====
function AlienReactionScreen({reaction,round,totalRounds,onNext}){
  if(!reaction) return null;
  const isLast = round>=totalRounds;
  return (
    <div style={{...s.card,animation:"fadeIn .6s ease"}}>
      <p style={s.roundBadge}>ROUND {round} / {totalRounds} — 応答</p>
      <h2 style={s.heading}>彼らが反応した</h2>
      <div style={{...s.alienBox, borderColor:`${reaction.color}44`}}>
        <div style={{...s.alienSymbolRow}}>
          <span style={{...s.alienSymbol, color:reaction.color}}>{reaction.symbol}</span>
          <div style={{...s.alienPulse, background:reaction.color}} />
        </div>
        <p style={{...s.alienTitle, color:reaction.color}}>{reaction.title}</p>
        <p style={s.alienDesc}>{reaction.desc}</p>
        <p style={{...s.alienHint, borderLeftColor:reaction.color}}>
          <span style={{color:reaction.color}}>観測メモ：</span>{reaction.hint}
        </p>
      </div>
      <button style={{...s.primaryBtn, borderColor:`${reaction.color}88`, color:reaction.color, background:`${reaction.color}18`}} onClick={onNext}>
        {isLast ? "最終決断へ →" : `ROUND ${round+1}へ →`}
      </button>
    </div>
  );
}

// ===== FINAL DECISION =====
function FinalDecisionScreen({decisions,overallStance,finalDecision,setFinalDecision,onSubmit}){
  const stanceCounts = decisions.reduce((acc,d)=>{ const st=ALL_DECISIONS.find(dc=>dc.id===d.decisionId)?.stance; if(st) acc[st]=(acc[st]||0)+1; return acc; },{});
  return (
    <div style={{...s.card,animation:"fadeIn .6s ease"}}>
      <div style={s.finalHeader}>
        <span style={s.finalBadge}>FINAL</span>
        <h2 style={{...s.heading,margin:0,whiteSpace:"nowrap"}}>最終決断</h2>
      </div>
      <p style={s.body}>3ラウンドの応答が積み重なった。今、人類を代表して最後の意思表示をする時だ。</p>

      <div style={s.stanceBar}>
        {Object.entries(stanceCounts).sort((a,b)=>b[1]-a[1]).map(([stance,count])=>(
          <div key={stance} style={s.stanceBarItem}>
            <span style={{...s.stanceBarLabel, color: stance==="contact"?"#34d399":stance==="explore"?"#a78bfa":"#7dd3fc"}}>{STANCE_LABEL[stance]}</span>
            <div style={s.stanceBarTrack}>
              <div style={{...s.stanceBarFill, width:`${(count/decisions.length)*100}%`, background: stance==="contact"?"#34d399":stance==="explore"?"#a78bfa":"#7dd3fc"}} />
            </div>
            <span style={s.stanceBarCount}>{count}</span>
          </div>
        ))}
      </div>

      <div style={s.finalDecisionList}>
        {FINAL_DECISIONS.map(fd=>{
          const selected = finalDecision===fd.id;
          return (
            <button key={fd.id} style={selected?s.finalBtnActive:s.finalBtn} onClick={()=>setFinalDecision(fd.id)}>
              <span style={s.finalBtnLabel}>{fd.label}</span>
              <span style={s.finalBtnDesc}>{fd.desc}</span>
            </button>
          );
        })}
      </div>
      <button style={finalDecision?s.revelationBtn:s.disabledBtn} onClick={finalDecision?onSubmit:undefined}>
        この決断で封印する
      </button>
    </div>
  );
}

// ===== RESULT =====
function ResultScreen({decisions,finalDecision,onReveal}){
  const fd = FINAL_DECISIONS.find(f=>f.id===finalDecision);
  return (
    <div style={{...s.card,animation:"fadeIn .6s ease"}}>
      <h2 style={s.heading}>あなたの軌跡</h2>
      <div style={s.timeline}>
        {decisions.map((d,i)=>{
          const dec=ALL_DECISIONS.find(dc=>dc.id===d.decisionId);
          return (
            <div key={i} style={s.timelineRound}>
              <p style={s.timelineLabel}>ROUND {d.round}</p>
              <div style={s.timelineItem}>
                <span style={s.timelineRole}>{d.role.icon} {d.role.name}</span>
                <span style={s.timelineArrow}>→</span>
                <span style={s.timelineDecision}>{dec?.label}</span>
              </div>
            </div>
          );
        })}
        {fd&&(
          <div style={{...s.timelineRound,borderColor:"rgba(251,191,36,.3)",background:"rgba(251,191,36,.05)"}}>
            <p style={{...s.timelineLabel,color:"#fbbf24"}}>FINAL</p>
            <div style={s.timelineItem}>
              <span style={{...s.timelineRole,color:"#fde68a"}}>最終決断</span>
              <span style={s.timelineArrow}>→</span>
              <span style={{...s.timelineDecision,color:"#fbbf24"}}>{fd.label}</span>
            </div>
          </div>
        )}
      </div>
      <p style={s.body}>封印された啓示を開く準備はできているか。</p>
      <button style={s.revelationBtn} onClick={onReveal}>啓示を開封する</button>
    </div>
  );
}

// ===== REVELATION =====
function RevelationScreen({revelation,rankResult,onRestart}){
  const [step,setStep] = useState(0);
  if(!revelation||!rankResult) return null;
  return (
    <div style={{...s.card,animation:"fadeIn .8s ease"}}>
      <div style={{...s.signalSymbol,animation:"glow 2s ease-in-out infinite"}}>✦</div>
      <h2 style={s.heading}>啓示</h2>

      {/* STEP 1: 信号の正体 */}
      <div style={s.revSection}>
        <p style={s.revSectionLabel}>I. 信号の正体</p>
        <p style={s.revSectionText}>{revelation.context}</p>
      </div>

      {/* STEP 2: 人類の運命 */}
      {step>=1&&(
        <div style={{...s.revSection,...s.revSectionFate,animation:"fadeIn .7s ease"}}>
          <p style={{...s.revSectionLabel,color:"#fbbf24"}}>II. 人類の運命</p>
          <p style={{...s.revSectionText,color:"#fde68a"}}>{revelation.fate}</p>
        </div>
      )}

      {/* STEP 3: 判定 */}
      {step>=2&&(
        <div style={{animation:"fadeIn .6s ease"}}>
          <p style={{...s.revSectionLabel,color:"#a78bfa",marginBottom:12}}>III. 判定</p>
          <div style={s.rankBadgeWrapper}>
            <div style={{...s.rankBadge,borderColor:rankResult.rankColor,boxShadow:`0 0 30px ${rankResult.rankColor}44`}}>
              <span style={{...s.rankLetter,color:rankResult.rankColor}}>{rankResult.rank}</span>
            </div>
            <p style={{...s.rankLabelText,color:rankResult.rankColor}}>{rankResult.rankLabel}</p>
          </div>
          <div style={s.scoreGrid}>
            <div style={s.scoreItem}><span style={s.scoreLabel}>信号との一致</span><span style={s.scoreValue}>{rankResult.alignScore}<span style={s.scoreMax}>/30</span></span></div>
            <div style={s.scoreItem}><span style={s.scoreLabel}>人類の一貫性</span><span style={s.scoreValue}>{rankResult.consistencyScore}<span style={s.scoreMax}>/20</span></span></div>
            <div style={{...s.scoreItem,...s.scoreBonusItem}}><span style={s.scoreLabel}>最終決断</span><span style={{...s.scoreValue,color:"#fbbf24"}}>{rankResult.finalBonus}<span style={s.scoreMax}>/50</span></span></div>
          </div>
          <div style={{...s.scoreGrid,gridTemplateColumns:"1fr",marginTop:0}}>
            <div style={{...s.scoreItem,...s.scoreTotalItem}}><span style={s.scoreLabel}>合計</span><span style={{...s.scoreValue,color:rankResult.rankColor,fontSize:28}}>{rankResult.total}<span style={s.scoreMax}>/100</span></span></div>
          </div>
          <div style={s.rankDescBox}>
            <p style={s.rankDesc}>{rankResult.rankDesc}</p>
            <p style={s.rankSubDesc}>人類の姿勢：<span style={{color:"#7dd3fc"}}>{STANCE_LABEL[rankResult.dominantStance]}</span>　／　彼らが求めていたもの：<span style={{color:"#fbbf24"}}>{STANCE_LABEL[revelation.idealStance]}</span></p>
          </div>
        </div>
      )}

      {step===0&&<button style={s.revelationBtn} onClick={()=>setStep(1)}>人類の運命を知る</button>}
      {step===1&&<button style={s.rankRevealBtn} onClick={()=>setStep(2)}>判定を見る</button>}
      {step>=2&&<button style={s.secondaryBtn} onClick={onRestart}>もう一度プレイする</button>}
    </div>
  );
}

// ===== STYLES =====
const s = {
  root:{minHeight:"100vh",background:"radial-gradient(ellipse at 20% 50%,#0c1a3a 0%,#050a18 60%,#000 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Georgia',serif",color:"#e2e8f0",padding:"20px",position:"relative",overflow:"hidden"},
  starField:{position:"fixed",inset:0,pointerEvents:"none",zIndex:0},
  container:{position:"relative",zIndex:1,width:"100%",maxWidth:580},
  card:{background:"rgba(8,20,50,.88)",border:"1px solid rgba(125,211,252,.18)",borderRadius:16,padding:"64px 40px",backdropFilter:"blur(12px)",boxShadow:"0 0 60px rgba(14,165,233,.08),0 4px 32px rgba(0,0,0,.5)",animation:"signalPulse 6s ease-in-out infinite"},
  signalSymbol:{fontSize:52,textAlign:"center",marginBottom:28,marginTop:16,animation:"symbolFloat 3s ease-in-out infinite",display:"block",letterSpacing:".05em"},
  title:{fontSize:44,letterSpacing:".45em",textAlign:"center",color:"#7dd3fc",margin:"0 0 32px",fontWeight:300,animation:"glow 3s ease-in-out infinite",textWrap:"balance",paddingLeft:".45em"},
  subtitle:{textAlign:"center",color:"#c8d8e8",fontSize:14,lineHeight:2.1,margin:"0 0 24px",textWrap:"balance",letterSpacing:".04em"},
  heading:{fontSize:22,color:"#7dd3fc",margin:"0 0 12px",fontWeight:400,letterSpacing:".05em",textWrap:"balance"},
  body:{color:"#dde6f0",fontSize:14,lineHeight:2,margin:"0 0 20px",textWrap:"pretty"},
  narrative:{color:"#c8d8e8",fontSize:14,lineHeight:2,margin:"0 0 20px",fontStyle:"italic",padding:"12px 16px",borderLeft:"2px solid rgba(125,211,252,.25)",background:"rgba(14,165,233,.04)",borderRadius:"0 8px 8px 0",textWrap:"pretty"},
  badge:{marginLeft:10,fontSize:12,padding:"2px 10px",background:"rgba(125,211,252,.12)",border:"1px solid rgba(125,211,252,.3)",borderRadius:20,color:"#7dd3fc"},
  label:{color:"#7dd3fc",fontSize:12,letterSpacing:".1em",textTransform:"uppercase",marginBottom:10},
  section:{marginBottom:24},
  countRow:{display:"flex",gap:10},
  countBtn:{width:44,height:44,border:"1px solid rgba(125,211,252,.25)",borderRadius:8,background:"transparent",color:"#dde6f0",fontSize:16,cursor:"pointer"},
  countBtnActive:{width:44,height:44,border:"1px solid #7dd3fc",borderRadius:8,background:"rgba(125,211,252,.15)",color:"#7dd3fc",fontSize:16,cursor:"pointer"},
  primaryBtn:{width:"100%",padding:"14px",background:"rgba(14,165,233,.18)",border:"1px solid rgba(125,211,252,.45)",borderRadius:10,color:"#7dd3fc",fontSize:15,letterSpacing:".05em",cursor:"pointer",marginTop:8},
  disabledBtn:{width:"100%",padding:"14px",background:"rgba(30,41,59,.4)",border:"1px solid rgba(100,116,139,.2)",borderRadius:10,color:"#5a6a7a",fontSize:15,cursor:"not-allowed",marginTop:8},
  revelationBtn:{width:"100%",padding:"14px",background:"rgba(251,191,36,.12)",border:"1px solid rgba(251,191,36,.45)",borderRadius:10,color:"#fbbf24",fontSize:15,letterSpacing:".05em",cursor:"pointer",marginTop:8},
  rankRevealBtn:{width:"100%",padding:"14px",background:"rgba(167,139,250,.12)",border:"1px solid rgba(167,139,250,.45)",borderRadius:10,color:"#a78bfa",fontSize:15,letterSpacing:".05em",cursor:"pointer",marginTop:8},
  secondaryBtn:{width:"100%",padding:"12px",background:"transparent",border:"1px solid rgba(125,211,252,.25)",borderRadius:10,color:"#b8c8da",fontSize:14,cursor:"pointer",marginTop:12},
  roundBadge:{fontSize:11,letterSpacing:".15em",color:"#b8c8da",textTransform:"uppercase",marginBottom:12},
  roleSelectGrid:{display:"flex",flexDirection:"column",gap:8,marginBottom:24},
  roleSelectCard:{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",borderRadius:10,cursor:"pointer",textAlign:"left",background:"rgba(255,255,255,.03)",border:"1px solid rgba(125,211,252,.12)",position:"relative"},
  roleSelectCardActive:{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",borderRadius:10,cursor:"pointer",textAlign:"left",background:"rgba(14,165,233,.12)",border:"1px solid rgba(125,211,252,.55)",position:"relative"},
  roleSelectCardDisabled:{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",borderRadius:10,cursor:"not-allowed",textAlign:"left",background:"rgba(255,255,255,.01)",border:"1px solid rgba(125,211,252,.05)",position:"relative",opacity:.35},
  roleSelectIcon:{fontSize:22,flexShrink:0,marginTop:2},
  roleSelectName:{color:"#e8f0f8",fontSize:15,fontWeight:600,display:"block",marginBottom:3},
  roleSelectFilter:{color:"#b8c8da",fontSize:13,lineHeight:1.6,display:"block",marginBottom:4,textWrap:"pretty"},
  roleSelectFilterActive:{color:"#dde6f0",fontSize:13,lineHeight:1.6,display:"block",marginBottom:4,textWrap:"pretty"},
  roleSelectForbidden:{color:"#8899aa",fontSize:11,display:"block",fontStyle:"italic"},
  roleCheck:{position:"absolute",top:12,right:14,color:"#34d399",fontSize:15,fontWeight:700},
  signalList:{display:"flex",flexDirection:"column",gap:12,marginBottom:24},
  signalCard:{display:"flex",alignItems:"flex-start",gap:16,background:"rgba(14,165,233,.06)",border:"1px solid rgba(125,211,252,.15)",borderRadius:10,padding:"14px 16px",position:"relative",overflow:"hidden"},
  signalTitle:{color:"#7dd3fc",fontSize:14,margin:"0 0 6px",letterSpacing:".03em"},
  signalDesc:{color:"#c8d8e8",fontSize:13,margin:0,lineHeight:1.8},
  tabRow:{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"},
  tab:{padding:"8px 14px",border:"1px solid rgba(125,211,252,.18)",borderRadius:8,background:"transparent",color:"#b8c8da",fontSize:13,cursor:"pointer"},
  tabActive:{padding:"8px 14px",border:"1px solid rgba(125,211,252,.55)",borderRadius:8,background:"rgba(125,211,252,.12)",color:"#7dd3fc",fontSize:13,cursor:"pointer"},
  checkMark:{color:"#34d399",fontSize:11},
  filterNote:{color:"#c8d8e8",fontSize:13,fontStyle:"italic",marginBottom:14,lineHeight:1.7,padding:"10px 14px",background:"rgba(255,255,255,.03)",borderRadius:8,borderLeft:"2px solid rgba(125,211,252,.3)"},
  decisionGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20},
  decisionBtn:{padding:"12px 10px",border:"1px solid rgba(125,211,252,.15)",borderRadius:8,background:"transparent",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5},
  decisionBtnActive:{padding:"12px 10px",border:"1px solid rgba(125,211,252,.6)",borderRadius:8,background:"rgba(14,165,233,.14)",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5},
  decisionBtnForbidden:{padding:"12px 10px",border:"1px solid rgba(255,255,255,.05)",borderRadius:8,background:"rgba(0,0,0,.2)",cursor:"not-allowed",textAlign:"left",display:"flex",flexDirection:"column",gap:5,opacity:.4},
  decisionLabel:{color:"#e8f0f8",fontWeight:600,fontSize:14},
  decisionLabelForbidden:{color:"#5a6070",fontWeight:600,fontSize:14},
  decisionDesc:{color:"#b8c8da",fontSize:12,lineHeight:1.5,textWrap:"pretty"},
  // Alien reaction
  alienBox:{padding:"24px 20px",background:"rgba(255,255,255,.03)",border:"2px solid",borderRadius:14,marginBottom:20},
  alienSymbolRow:{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:12,position:"relative"},
  alienSymbol:{fontSize:32,letterSpacing:".1em",fontWeight:300},
  alienPulse:{width:8,height:8,borderRadius:"50%",animation:"pulseRing 1.5s ease-out infinite"},
  alienTitle:{fontSize:18,fontWeight:600,letterSpacing:".05em",margin:"0 0 10px",textAlign:"center",textWrap:"balance"},
  alienDesc:{color:"#c8d8e8",fontSize:14,lineHeight:1.9,margin:"0 0 14px",textWrap:"pretty"},
  alienHint:{color:"#dde6f0",fontSize:13,lineHeight:1.7,margin:0,padding:"10px 14px",background:"rgba(255,255,255,.03)",borderRadius:8,borderLeft:"3px solid",textWrap:"pretty"},
  // Final decision
  finalHeader:{display:"flex",alignItems:"center",gap:12,marginBottom:8},
  finalBadge:{fontSize:11,padding:"3px 10px",background:"rgba(251,191,36,.15)",border:"1px solid rgba(251,191,36,.4)",borderRadius:20,color:"#fbbf24",letterSpacing:".1em"},
  stanceBar:{display:"flex",flexDirection:"column",gap:8,marginBottom:20,padding:"14px 16px",background:"rgba(255,255,255,.03)",borderRadius:10,border:"1px solid rgba(125,211,252,.1)"},
  stanceBarItem:{display:"flex",alignItems:"center",gap:10},
  stanceBarLabel:{fontSize:12,minWidth:64,color:"#b8c8da"},
  stanceBarTrack:{flex:1,height:6,background:"rgba(255,255,255,.08)",borderRadius:3,overflow:"hidden"},
  stanceBarFill:{height:"100%",borderRadius:3,transition:"width .5s ease"},
  stanceBarCount:{fontSize:12,color:"#b8c8da",minWidth:16,textAlign:"right"},
  finalDecisionList:{display:"flex",flexDirection:"column",gap:8,marginBottom:20},
  finalBtn:{padding:"14px 16px",border:"1px solid rgba(125,211,252,.15)",borderRadius:10,background:"transparent",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5},
  finalBtnAligned:{padding:"14px 16px",border:"1px solid rgba(125,211,252,.3)",borderRadius:10,background:"rgba(14,165,233,.06)",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5},
  finalBtnActive:{padding:"14px 16px",border:"1px solid rgba(251,191,36,.6)",borderRadius:10,background:"rgba(251,191,36,.1)",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5},
  finalBtnTop:{display:"flex",alignItems:"center",gap:8},
  finalBtnLabel:{color:"#e8f0f8",fontWeight:600,fontSize:14},
  finalBtnBadge:{fontSize:10,padding:"2px 8px",background:"rgba(52,211,153,.15)",border:"1px solid rgba(52,211,153,.4)",borderRadius:10,color:"#34d399"},
  finalBtnDesc:{color:"#b8c8da",fontSize:12,lineHeight:1.5,textWrap:"pretty"},
  // Timeline
  timeline:{display:"flex",flexDirection:"column",gap:10,marginBottom:20},
  timelineRound:{padding:"12px 16px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(125,211,252,.1)",borderRadius:10},
  timelineLabel:{fontSize:11,letterSpacing:".12em",color:"#b8c8da",textTransform:"uppercase",margin:"0 0 8px"},
  timelineItem:{display:"flex",alignItems:"center",gap:8,marginBottom:4},
  timelineRole:{color:"#c8d8e8",fontSize:13,minWidth:100},
  timelineArrow:{color:"#5a7080",fontSize:12},
  timelineDecision:{color:"#7dd3fc",fontSize:13},
  // Revelation
  revSection:{padding:"16px 18px",background:"rgba(125,211,252,.04)",border:"1px solid rgba(125,211,252,.18)",borderRadius:12,marginBottom:12},
  revSectionFate:{background:"rgba(251,191,36,.05)",border:"1px solid rgba(251,191,36,.22)"},
  revSectionLabel:{fontSize:11,letterSpacing:".18em",textTransform:"uppercase",color:"#7dd3fc",margin:"0 0 10px"},
  revSectionText:{color:"#dde6f0",fontSize:14,lineHeight:1.95,margin:0,textWrap:"pretty"},
  rankBadgeWrapper:{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:14},
  rankBadge:{width:90,height:90,borderRadius:"50%",border:"3px solid",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8},
  rankLetter:{fontSize:48,fontWeight:700,lineHeight:1},
  rankLabelText:{fontSize:16,letterSpacing:".08em",fontWeight:600,margin:0,textWrap:"balance"},
  scoreGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8},
  scoreItem:{background:"rgba(255,255,255,.03)",border:"1px solid rgba(125,211,252,.1)",borderRadius:10,padding:"12px",display:"flex",flexDirection:"column",alignItems:"center",gap:4},
  scoreTotalItem:{background:"rgba(125,211,252,.05)",border:"1px solid rgba(125,211,252,.2)"},
  scoreBonusItem:{background:"rgba(251,191,36,.05)",border:"1px solid rgba(251,191,36,.2)"},
  scoreLabel:{color:"#b8c8da",fontSize:11,letterSpacing:".05em",textAlign:"center"},
  scoreValue:{color:"#e8f0f8",fontSize:22,fontWeight:700},
  scoreMax:{color:"#5a7080",fontSize:12,fontWeight:400},
  rankDescBox:{background:"rgba(255,255,255,.03)",border:"1px solid rgba(125,211,252,.1)",borderRadius:10,padding:"16px",marginBottom:14},
  rankDesc:{color:"#dde6f0",fontSize:14,lineHeight:1.8,margin:"0 0 8px",textWrap:"pretty"},
  rankSubDesc:{color:"#b8c8da",fontSize:12,lineHeight:1.6,margin:0,textWrap:"pretty"},
};
