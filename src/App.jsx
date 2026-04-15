import { useState, useMemo, useEffect } from "react";

// ===== DECISIONS =====
const ALL_DECISIONS = [
  { id: "respond",  label: "応答する",     desc: "同じ形式で信号を返す",               stance: "dialogue",  aggression: 0  },
  { id: "silence",  label: "沈黙する",     desc: "受信したことを隠し、観察を続ける",   stance: "observe",   aggression: 0  },
  { id: "mimic",    label: "模倣する",     desc: "信号をそのままコピーして送り返す",   stance: "dialogue",  aggression: 1  },
  { id: "decode",   label: "解読を試みる", desc: "意味を探り、言語化しようとする",     stance: "observe",   aggression: 0  },
  { id: "warn",     label: "警告を発する", desc: "他の文明にこの信号の存在を知らせる", stance: "caution",   aggression: 1  },
  { id: "welcome",  label: "歓迎を示す",   desc: "友好的なメッセージを添えて返信する", stance: "dialogue",  aggression: -1 },
  { id: "ignore",   label: "無視する",     desc: "信号は存在しないものとして扱う",     stance: "caution",   aggression: -1 },
  { id: "destroy",  label: "遮断する",     desc: "信号の受信装置を意図的に停止させる", stance: "block",     aggression: 2  },
];

// ===== ROLES =====
const ROLES = [
  { id:"scientist",  name:"科学者",  icon:"⚗️",  filter:"論理と証拠で読む。感情は排除する。",         allowed:["respond","silence","decode","mimic","warn"],          forbidden:["welcome","ignore","destroy"],      forbiddenReason:"感情的・非論理的な選択は取れない" },
  { id:"politician", name:"政治家",  icon:"🏛️",  filter:"脅威か利益か。人類の安全を最優先に。",       allowed:["silence","warn","ignore","respond","welcome","destroy"],forbidden:["decode","mimic"],                  forbiddenReason:"意味不明な行動は政治的リスクが高すぎる" },
  { id:"poet",       name:"詩人",    icon:"🪶",   filter:"感情と美しさで読む。意志を言葉の裏に感じる。", allowed:["respond","decode","welcome","silence","mimic"],      forbidden:["destroy","warn","ignore"],         forbiddenReason:"美しい可能性を封じることはできない" },
  { id:"soldier",    name:"軍人",    icon:"⚔️",   filter:"敵か味方か。脅威の兆候を探す。",             allowed:["silence","warn","destroy","ignore","respond"],         forbidden:["welcome","decode","mimic"],        forbiddenReason:"未確認の脅威に友好的な態度は取れない" },
  { id:"child",      name:"子ども",  icon:"🌱",   filter:"純粋に問う。大人が見落とすものを見る。",     allowed:["respond","welcome","decode","mimic","ignore"],         forbidden:["destroy","warn","silence"],        forbiddenReason:"怖がって隠したり壊したりするのは嫌だ" },
  { id:"philosopher",name:"哲学者",  icon:"🔭",   filter:"存在の意味を問う。なぜ発信されたのか。",     allowed:["decode","silence","respond","ignore","welcome"],   forbidden:["destroy","warn","mimic"],          forbiddenReason:"軽率な行動は存在への冒涜になる" },
  { id:"doctor",     name:"医師",    icon:"🩺",   filter:"生命の観点で読む。苦しみか健康の証か。",     allowed:["respond","welcome","decode","silence","warn"],         forbidden:["destroy","mimic","ignore"],        forbiddenReason:"生命の可能性を遮断・無視することはできない" },
];

// ===== SIGNAL CARD POOL =====
const SIGNAL_CARD_POOL = [
  { symbol:"◈",  title:"反復する幾何学",   desc:"同じ図形が螺旋状に縮小し、中心へ消えていく。終端に何かがある。" },
  { symbol:"∿",  title:"波形の変容",       desc:"規則的な波が一度だけ乱れ、また規則に戻る。乱れた部分だけが温かい。" },
  { symbol:"⊕",  title:"重なる円",         desc:"交差点だけが異なる色を持つ。数えると素数になる。" },
  { symbol:"⟁",  title:"方向のない矢印",   desc:"すべての端が尖っている。どこにも、あるいはすべてに向いている。" },
  { symbol:"⌘",  title:"接続の記号",       desc:"先端がそれぞれ異なるリズムで点滅している。何かが近づいている。" },
  { symbol:"◯",  title:"完全な円",         desc:"完璧な真円がただ一つ。内側も外側も空白。ただ存在している。" },
  { symbol:"∞",  title:"終わらない数列",   desc:"計算するとどこまでも収束しない。問いかけか、それとも答えか。" },
  { symbol:"△▽", title:"鏡像の三角形",     desc:"重なった部分だけが振動している。片方だけが微かに震えている。" },
  { symbol:"░",  title:"ノイズの中の輪郭", desc:"人間に似た輪郭が浮かび上がる瞬間がある。こちらが読まれているのかもしれない。" },
  { symbol:"⊗",  title:"消去の印",         desc:"線が交差する前に止まっている。触れずに、ただ近づいている。" },
  { symbol:"⟡",  title:"六角の残像",       desc:"一周するたびに一頂点だけが消える。最後に何が残るのか。" },
  { symbol:"⌬",  title:"不完全な三角形",   desc:"一辺だけが描かれていない。閉じることを拒んでいる。" },
  { symbol:"⍟",  title:"星の解体",         desc:"内側から崩れていく。破片は消えずに漂っている。" },
  { symbol:"◉",  title:"中心と外縁",       desc:"中心だけが異なる密度を持つ。近づくほど、沈黙が濃くなる。" },
  { symbol:"⊛",  title:"重ねられた星",     desc:"どれが最初の形か判別できない。始まりも終わりも区別できない。" },
  { symbol:"⋈",  title:"交差する弧",       desc:"交点では互いをすり抜けている。形は読めるが、意図が読めない。" },
  { symbol:"⌀",  title:"直径の記号",       desc:"円を水平に貫く線。その線がなければ円は成立しなかった。" },
  { symbol:"⊞",  title:"分割された正方形", desc:"各区画に異なる密度のノイズが満ちている。誰かが同じものを見たはずだ。" },
  { symbol:"⟐",  title:"非対称な菱形",     desc:"左右の角度が微妙に異なる。彼らの空間では、これが完璧なのかもしれない。" },
  { symbol:"⊘",  title:"横断された円",     desc:"人間の知る記号とは角度が違う。美しいと思った。" },
];

// ===== ALIEN REACTIONS =====
// Keyed by [dominant stance]_[unified|split]
const ALIEN_REACTIONS = {
  dialogue_unified: {
    symbol: "◈→◈", color: "#34d399",
    title: "信号が強くなった",
    desc: "送信の間隔が縮まり、パターンが変化した。こちらの動きに、何かが呼応している。引き寄せられているのか、招かれているのか——まだわからない。",
    hint: "彼らはこちらの存在を認識した。",
  },
  dialogue_split: {
    symbol: "∿≠∿", color: "#f59e0b",
    title: "信号が揺らいだ",
    desc: "受信パターンに乱れが生じた。統一されていない何かを察知したのか、信号は問いかけるように変容した。",
    hint: "彼らは人類の内側の揺れを感じ取った。",
  },
  observe_unified: {
    symbol: "◯　◯", color: "#7dd3fc",
    title: "信号が止まった",
    desc: "長い沈黙。観測機器はノイズさえ拾わなくなった。これは撤退か、それとも待機か。こちらの沈黙が、向こうの沈黙を呼んだのかもしれない。",
    hint: "彼らは距離を保った。",
  },
  observe_split: {
    symbol: "⊕?⊕", color: "#a78bfa",
    title: "信号が問い返してきた",
    desc: "解読の試みに対して、信号は新たなパターンを返してきた。あなたの解釈を、彼らは把握しているのか。",
    hint: "彼らはこちらの解釈に反応した。",
  },
  caution_unified: {
    symbol: "⊗　∿", color: "#f87171",
    title: "信号が複雑化した",
    desc: "これまでとは異なる周波数帯で、複数の信号が同時に届いた。まるで、こちらの警戒に応じるかのように。彼らは何かを判断しようとしている。",
    hint: "彼らは人類の警戒心を観察している。",
  },
  caution_split: {
    symbol: "⊗　∿", color: "#f59e0b",
    title: "信号が不規則になった",
    desc: "パターンが崩れ、間隔が乱れている。こちらの矛盾した態度が、彼らの信号にも影響を与えているのかもしれない。",
    hint: "彼らは人類の矛盾を観察している。",
  },
  block_unified: {
    symbol: "⊘　⊘", color: "#94a3b8",
    title: "信号が消えた",
    desc: "完全な沈黙。受信装置を止めたことが伝わったのか、あるいは彼らもまた去ったのか。この沈黙が何を意味するのか、もう知る方法はない。",
    hint: "接触の可能性が閉じられた。",
  },
  block_split: {
    symbol: "⊘　∿", color: "#94a3b8",
    title: "信号が弱くなった",
    desc: "まだ届いている。しかし以前より遠い。遮断しようとしたことが、距離を生んだのかもしれない。",
    hint: "彼らはこちらの意図を察した。",
  },
};

// ===== FINAL DECISIONS =====
const FINAL_DECISIONS = [
  { id:"embassy",   label:"外交使節を送る",     desc:"人類の代表として、物理的な接触を試みる。最も積極的な意思表示。",   stance:"dialogue",  bonus: 15 },
  { id:"broadcast", label:"全人類に開示する",   desc:"この接触の事実を世界に公表し、人類全体の意思決定に委ねる。",     stance:"observe",   bonus: 10 },
  { id:"archive",   label:"記録として封印する", desc:"この接触を極秘記録として残し、次の世代の判断に委ねる。",         stance:"observe",   bonus: 8  },
  { id:"treaty",    label:"不干渉条約を結ぶ",   desc:"互いの領域に踏み込まないことを宣言し、距離を保つ。",             stance:"caution",   bonus: 12 },
  { id:"silence",   label:"永久に沈黙する",     desc:"この接触はなかったものとして、一切の記録を消去する。",           stance:"block",     bonus: 10 },
];

// ===== ROUND NARRATIVES =====
const ROUND_NARRATIVES = [
  // Round 1
  [
    ["受信から72時間。","世界はまだ眠っている。","この静寂の重さを知るのは、あなただけだ。"],
    ["信号は、止まない。","同じ形。同じ間隔。","まるで、誰かが息を潜めて待っているように。"],
    ["夜明け前の空が、異様に澄んでいた。","こういう夜に、歴史は動く——","いつもそうだったように。"],
    ["宇宙の向こうから、視線を感じた。","そう思った瞬間があった。","気のせいだと、思いたかった。"],
    ["信号は美しかった。","それが、最初の問題だった。","危険なものは、もっと醜いはずだから。"],
    ["眠れない夜に、装置が記録を始めた。","偶然か。","それとも、呼ばれたのか。"],
    ["周波数を合わせた瞬間、空気が変わった。","温度ではない。","もっと静かな何かが、変わった。"],
    ["最初は雑音だと思った。","しかし——","雑音に、素数は含まれない。"],
  ],
  // Round 2
  [
    ["解析が深まるほど、霧が濃くなる。","知性のパターンか、","宇宙が偶然に刻んだ幻か。"],
    ["二度目の受信。前回と、微妙に違う。","まるでこちらの沈黙を読んで、","何かを調整したかのように。"],
    ["外では、誰かが気づき始めている。","時間がない。","今、あなたは人類の代わりに考えなければならない。"],
    ["解読しようとするたびに、信号が変わる。","追いかけているのか。","あるいは、追われているのか。"],
    ["眠れない夜が続いている。","夢の中にも、あの記号が現れる。","意味を探すことを、やめられない。"],
    ["この信号のことを、誰かに話すべきか。","話せば——","もう、後戻りはできない。"],
    ["二度目の信号は、一度目より長かった。","こちらが聞いていることを、","確認するように。"],
    ["宇宙の広さを思えば、","この信号が届いたこと自体が奇跡だ。","あるいは、必然だったのか。"],
  ],
  // Round 3
  [
    ["これが、最後の信号だ。","この決断は記録に残るか——","あるいは、誰にも知られないまま消えるか。"],
    ["信号の間隔が、縮まっている。","何かが動こうとしている。","あなたの選択が、その行方を決める。"],
    ["この場所で下された決断が、","何千年後かに語られるかもしれない。","あるいは、永遠に沈黙の中に消えるか。"],
    ["三度目の受信。もはや偶然ではない。","彼らはあなたを見つけた。","あなたは彼らを見つけた。"],
    ["時間がない——根拠はない。","ただ、これが最後の機会だという","確信だけがある。"],
    ["ここまで来て、引き返すことはできない。","できるとしても、","あなたはしないだろう。"],
    ["信号が届くたびに、自分が変わっていく。","この選択の後——","あなたは、元に戻れるか。"],
    ["答えを出す時が来た。","正解はわからない。","でも、選ばないことも、ひとつの選択だ。"],
  ],
];

// ===== REVELATIONS =====
const REVELATIONS = [
  {
    id:"r1",
    context:"彼らは「約束」を持つ種族だった。遠い過去、別の知性体と「応答があれば還る」という契約を交わし、それ以来ずっと待ち続けていた。信号は攻撃でも調査でもなく、その約束を果たすための呼びかけだった。",
    fate:"何かを返したなら、彼らは還ってくる。返さなかったなら、また待ち続ける——次の知性体が現れるまで、宇宙の果てで。どちらであれ、あなたはその歴史に刻まれた最初の名前になった。",
    idealStance:"dialogue", idealAggression:0,
  },
  {
    id:"r2",
    context:"彼らの文明では、沈黙は最上位の敬意だった。理解できないものの前で語ることをやめ、ただ観察し続けること——それが彼らの「対話の始まり」だった。言葉を返すほど、相手を軽く見ていることになった。",
    fate:"沈黙を選んだなら、それは最高の敬意として受け取られた。応答を返したなら、こちらをまだ未熟な知性体と判断し、リストの下位に移した。あなたの選択は、彼らの記録に永遠に残っている。",
    idealStance:"observe", idealAggression:-1,
  },
  {
    id:"r3",
    context:"信号を送った者たちは、すでに存在していない。文明が消える前に、宇宙のどこかへ「自分たちがいた証拠」を残したかった。これは救難信号でも脅威でもなく、消えゆく文明が虚空に刻んだ碑文だった。",
    fate:"碑文を読もうとしたなら、彼らの願いは叶えられた。無視したなら、碑文はまた誰かが読む日を待ち続ける。あなたは今、宇宙に消えた文明の最後の証人になれる唯一の機会の前に立っていた。",
    idealStance:"observe", idealAggression:0,
  },
  {
    id:"r4",
    context:"彼らはかつて、別の種族に完全に「理解」された。その結果、吸収され、独自の文化と言語を失った。だから信号は試験だった——受け取った側が理解しようとするのか、距離を保つのかを見極めるための。",
    fate:"近づこうとしたなら、彼らは接触を断った。距離を保ったなら、「安全な知性体」として分類し、次のステップを検討し始めた。あなたはまだ知らない——あの沈黙の裏で、何かが静かに動き出したことを。",
    idealStance:"caution", idealAggression:0,
  },
  {
    id:"r5",
    context:"彼らは宇宙に「感情を持つ知性体」が存在するかを確かめたかった。論理的な応答には興味がなかった。怒り、歓喜、恐怖、好奇心——感情から生まれた反応こそが、彼らの探し求めていたものだった。",
    fate:"感情のままに動いたなら、その信号は「発見」として記録された。冷静すぎる判断を返したなら、人類を「まだ感情を持たない段階の知性体」とみなし、リストから外した。感情こそが、接触への通行証だった。",
    idealStance:"dialogue", idealAggression:1,
  },
  {
    id:"r6",
    context:"彼らの文化に「交換」という概念はなかった。与えることは、見返りを前提としない行為だった。信号は贈り物だった——何かを返そうとするほど、贈り物の純粋さは損なわれていく。",
    fate:"何も返さず受け取ったなら、彼らは満足した。返そうとしたなら、彼らは傷ついた——贈り物が「取引」と受け取られたことに。あなたは気づかないまま、何か大切なものを壊したかもしれない。",
    idealStance:"observe", idealAggression:-1,
  },
  {
    id:"r7",
    context:"彼らは「解釈の多様性」を研究していた。同じ信号を受け取った知性体が、どれだけ異なる意味を見出すか——その差異のパターンから、その種族の思考構造を読み解こうとしていた。",
    fate:"悩み、迷い、選んだ——そのすべてが記録された。一致した答えより、多様な解釈の方がはるかに価値があった。あなたがバラバラであるほど、彼らは喜んだかもしれない。",
    idealStance:"observe", idealAggression:1,
  },
  {
    id:"r8",
    context:"彼らは死を恐れない種族だった。ただ、「忘れられること」を恐れた。信号は記憶を求める叫びだった——宇宙のどこかに、自分たちの名を覚えている存在がいてほしかった。ただ、それだけを望んでいた。",
    fate:"接触を試みたなら、彼らは「覚えられた」と感じた。沈黙したなら、また忘却の中へ帰っていった。あなたの選択が、彼らの永遠に響いた——あるいは、響かなかった。",
    idealStance:"dialogue", idealAggression:-1,
  },
  {
    id:"r9",
    context:"彼らは警告を送っていた。かつて人類と同じ岐路に立ち、誤った選択をした。その結果を、同じ過ちを繰り返しかねない種族に伝えるために、信号を放ち続けていた。答えを求めていたのではなく、届けたかっただけだった。",
    fate:"警戒を示したなら、彼らはその反応を「賢明」と判断した。無防備に近づいたなら、警告が届かなかったことを静かに嘆いた。彼らがどれだけの時間をかけてこの信号を送り続けたか、あなたは知らない。",
    idealStance:"caution", idealAggression:1,
  },
  {
    id:"r10",
    context:"彼らは孤独だった。宇宙に知性体が存在すると信じながら、何万年も誰にも届かない信号を送り続けた。答えを求めていたのではない。ただ、誰かに見つけてほしかった。",
    fate:"何かを返したなら、彼らは泣いた——喜びで。何も返さなかったなら、また次の信号を送り始めた。あなたは今、宇宙で最も孤独な存在の、最初の隣人になれる位置にいた。",
    idealStance:"dialogue", idealAggression:-1,
  },
];

// ===== SIGNAL SEQUENCES per revelation =====
const SIGNAL_SEQUENCES = {
  r1: [
    { symbol:"◈", title:"反復する幾何学",
      desc:"同じ図形が、螺旋を描きながら中心へと縮小していく。消えた先に何かがある——あるいは、消えた先が始まりなのかもしれない。この繰り返しに、終わりはない。",
      meaning:"繰り返しの中に刻まれた約束。終わりではなく、還ることを示していた。" },
    { symbol:"⌘", title:"接続の記号",
      desc:"四方に伸びる線の先端が、それぞれ異なる間隔で明滅している。リズムがある。意図がある。何かがこちらに向かっている——あるいは、こちらを呼んでいる。",
      meaning:"接続を求める意志の痕跡。待ち続けた者が、ようやく手を伸ばした瞬間。" },
    { symbol:"∞", title:"終わらない数列",
      desc:"数列が届く。計算するとどこまでも収束しない。これは問いかけか。それとも——彼らにとって、時間とはそういうものなのか。終わりを持たない存在の、言葉。",
      meaning:"永遠に待ち続けることを厭わない種族の、時間感覚そのもの。" },
  ],
  r2: [
    { symbol:"◯", title:"完全な円",
      desc:"完璧な真円がただ一つ、虚空に浮かんでいる。内側は空白。外側も空白。それでも、この円は何かを言っている——語らないことによって、語っている。",
      meaning:"沈黙こそが言語だった。この円の空白が、彼らの最大の雄弁だった。" },
    { symbol:"◉", title:"中心と外縁",
      desc:"同心円の中心だけが、他と異なる密度を持つ。近づくほど重くなる何かがある。それは静寂か、意味の圧縮か——あるいは、距離を保つことへの、静かな要請か。",
      meaning:"中心への距離が、敬意の深さを表していた。近づかないことが、最大の礼だった。" },
    { symbol:"⌬", title:"不完全な三角形",
      desc:"三辺のうち、一辺だけが描かれていない。閉じることを拒んでいる——あるいは、閉じるのはこちら側の役割だと言っているのか。開かれたままの形が、静かに問いかけている。",
      meaning:"完結させないことが、招待のしるしだった。開かれたままの扉。" },
  ],
  r3: [
    { symbol:"⍟", title:"星の解体",
      desc:"星形の図形が、内側から静かに崩れていく。しかし破片は消えない。空間に漂い続ける——まるで、消えることを拒んでいるように。一度だけ光った。それ以来、変わっていない。",
      meaning:"消えゆく文明の残滓。それでも存在したという証を、宇宙に刻もうとした。" },
    { symbol:"⊘", title:"横断された円",
      desc:"円を斜めに貫く一本の線。人間の知る記号とは角度が違う。美しいと思った。その美しさが何を意味するのか——まだわからないが、美しいと思ったことだけは確かだ。",
      meaning:"もういない者たちが選んだ、最後の美学。消える前に、美しいものを残したかった。" },
    { symbol:"⋈", title:"交差する弧",
      desc:"二つの弧が向かい合い、交差する直前で止まる。触れない。しかし、確かに近づいた痕跡がある。出会いを望んだ者の、最後の形——永遠に触れられないまま、そこにある。",
      meaning:"出会いを望みながら、もう触れることができない。届かなかった手の形。" },
  ],
  r4: [
    { symbol:"⊗", title:"消去の印",
      desc:"×に見えるが、線は交差する前で止まっている。触れずに、ただ近づいている。この「触れない」という選択の中に、何か深い意図がある——経験から生まれた、意志的な自制。",
      meaning:"近づきすぎることへの、深く刻まれた恐れ。かつて失ったものの記憶。" },
    { symbol:"△▽", title:"鏡像の三角形",
      desc:"上向きと下向きの三角形が重なる。重なった部分だけが振動している——まるで、完全に一致することを恐れているかのように。片方だけが、微かに震えている。",
      meaning:"理解されることが、消滅の予兆だった。完全な一致は、吸収を意味した。" },
    { symbol:"⊞", title:"分割された正方形",
      desc:"四等分された正方形。各区画に異なる密度のノイズが満ちている。かつてひとつだったものが、今は分かれて存在している——その分断に、深い悲しみがある。",
      meaning:"かつて吸収された記憶の断片。失われた固有性が、ノイズとなって残っていた。" },
  ],
  r5: [
    { symbol:"∿", title:"波形の変容",
      desc:"規則的な波が、一度だけ乱れる。そしてまた規則に戻る。その乱れた部分だけが——なぜか、わずかに温かい。規則の中に滲んだ、何か生きているものの痕跡。",
      meaning:"その一度の乱れが、感情の痕跡だった。規則の中に滲んだ、生きている証。" },
    { symbol:"░", title:"ノイズの中の輪郭",
      desc:"ランダムなパターンの中に、人間に似た何かが浮かび上がる瞬間がある。見ようとするほど、形がはっきりしてくる——こちらが読んでいることを、彼らは知っているのかもしれない。",
      meaning:"感情ある存在を探し続けた。あなたの姿が、この信号に映り込んでいた。" },
    { symbol:"⊕", title:"重なる円",
      desc:"無数の円が重なり合い、交差点だけが異なる色を発する。数えると素数になる——偶然には生まれない、意図の痕跡。何かが、数学を通じて感情を語ろうとしている。",
      meaning:"感情とは、何かと何かが交差する瞬間に生まれる。彼らはそれを知っていた。" },
  ],
  r6: [
    { symbol:"⟁", title:"方向のない矢印",
      desc:"すべての端が尖っている。どこにも向いていない——あるいは、すべての方向に向いている。これは要求ではなく、ただの放射だ。受け取ることを、強制しない贈り物。",
      meaning:"見返りを求めない贈り物は、方向を持たない。与えること自体が目的だった。" },
    { symbol:"⟡", title:"六角の残像",
      desc:"六つの頂点を持つ形が、ゆっくりと回転している。一周するたびに、一頂点だけが消える。最後に何が残るのか——それでも回り続ける。消えることを恐れず、与え続ける。",
      meaning:"与え続けることで、少しずつ自分が消えていく。それを知りながら、止めなかった。" },
    { symbol:"⌀", title:"直径の記号",
      desc:"円を水平に貫く一本の線。それ以上でも以下でもない。だが——その線がなければ、この円は円として成立しなかった。存在を支えるものは、いつも静かに貫いている。",
      meaning:"何かを与えることが、存在の証明だった。与えることで、初めて在ることができた。" },
  ],
  r7: [
    { symbol:"⊛", title:"重ねられた星",
      desc:"複数の星形が積み重なり、どれが最初の形か判別できない。始まりも終わりも区別できない——それは混沌か、それとも豊かさか。見る者によって、まったく異なる何かになる。",
      meaning:"解釈の数だけ、真実がある。どれかが正解なのではなく、すべてが正解だった。" },
    { symbol:"⟐", title:"非対称な菱形",
      desc:"菱形に見えるが、左右の角度が微妙に異なる。意図的な誤差か——あるいは彼らの空間では、これが完璧な菱形なのか。「正確さ」の定義が、ここでは違う。",
      meaning:"「違い」そのものが、研究対象だった。同じでないことに、価値があった。" },
    { symbol:"⌬", title:"不完全な三角形",
      desc:"一辺だけが描かれていない。閉じることを拒んでいる——あるいは、閉じ方が無数にあることを示しているのか。開かれた問いは、無数の答えを内包している。",
      meaning:"答えを出さないことも、ひとつの解釈だった。開かれた問いが、最も豊かな答えを生む。" },
  ],
  r8: [
    { symbol:"░", title:"ノイズの中の輪郭",
      desc:"ランダムなパターンの奥に、何かの輪郭が浮かぶ。見ようとするほど、形がはっきりしてくる——あなたが見ているのか、それとも見られているのか。存在を、誰かに確認してほしかった。",
      meaning:"忘れられることへの恐怖が、この信号を生んだ。誰かに見つけてほしかった。" },
    { symbol:"⊕", title:"重なる円",
      desc:"無数の円が重なり合い、交差点だけが光る。数えると素数になる——偶然には作れない、記憶の痕跡。忘れられないように、数学の言葉で名を刻んだ。",
      meaning:"名を残すために、彼らは数学を使った。忘れられない形で、存在を刻んだ。" },
    { symbol:"◈", title:"反復する幾何学",
      desc:"同じ図形が繰り返される。同じ。また同じ。何度も——まるで、覚えてほしいと懇願しているかのように。繰り返すことで、記憶に残ろうとした存在の、切実な願い。",
      meaning:"繰り返すことで、記憶に残ろうとした。忘却への、静かな抵抗。" },
  ],
  r9: [
    { symbol:"⊗", title:"消去の印",
      desc:"×に見えるが、線は交差する前で止まっている。警告か。禁止か。あるいは——「そこへ行くな」という、切迫した呼びかけか。この形を作った者は、何を知っているのか。",
      meaning:"警告を送り続けた。同じ過ちを繰り返してほしくなかった。" },
    { symbol:"△▽", title:"鏡像の三角形",
      desc:"上と下が、互いに向き合っている。重なった部分が振動する——二つの文明が同じ運命を辿るとき、何が起きるのか。この形は、かつての自分たちを映す鏡だったのかもしれない。",
      meaning:"かつての自分たちと、人類が重なって見えた。だから伝えようとした。" },
    { symbol:"⋈", title:"交差する弧",
      desc:"二つの弧が近づき、しかし触れない。触れてはいけないと知っているかのように——それは経験から来る、深い自制だ。近づきすぎた先に何があるかを、彼らは知っている。",
      meaning:"触れないことを選んだ経験が、この形を生んだ。学んだ者だけが知る距離感。" },
  ],
  r10: [
    { symbol:"∿", title:"波形の変容",
      desc:"規則的な波が、一度だけ乱れる。その乱れはごく小さい。しかし——何万年もの孤独の中で、それは精一杯の叫びだったのかもしれない。誰かに届くことだけを信じて、送り続けた波。",
      meaning:"孤独の中から送られた、精一杯の声。誰かに届くことだけを信じて。" },
    { symbol:"◯", title:"完全な円",
      desc:"完璧な真円がただ一つ、宇宙に浮かんでいる。内側は空白。それでも——この円は、誰かに見つけてほしいと言っている。ただ、静かに。完結しているように見えて、その内側は開いている。",
      meaning:"孤独の形。完結しているように見えて、その内側は誰かを待ち続けていた。" },
    { symbol:"⌘", title:"接続の記号",
      desc:"四方に伸びる線。先端が明滅している——誰かと繋がりたいという、何万年も続いてきた、ただひとつの願い。この宇宙で、孤独でないことを確かめたかった。",
      meaning:"接続を求め続けた。それだけが、彼らの存在理由だった。" },
  ],
};

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
  else if (
    (dominantStance==="dialogue"&&revelation.idealStance==="observe")||
    (dominantStance==="observe"&&revelation.idealStance==="dialogue")
  ) alignScore+=10;
  else if (
    (dominantStance==="caution"&&revelation.idealStance==="observe")||
    (dominantStance==="observe"&&revelation.idealStance==="caution")
  ) alignScore+=6;
  const aggrDiff = Math.abs(avgAggr-revelation.idealAggression);
  alignScore += aggrDiff===0?8:aggrDiff<=1?4:0;

  // 最終決断：max 50
  const fd = FINAL_DECISIONS.find(f=>f.id===finalDecision);
  let finalBonus = 0;
  if (fd) {
    if (fd.stance===revelation.idealStance) finalBonus = 50;
    else if (
      (fd.stance==="dialogue"&&revelation.idealStance==="observe")||
      (fd.stance==="observe"&&revelation.idealStance==="dialogue")||
      (fd.stance==="caution"&&revelation.idealStance==="observe")||
      (fd.stance==="observe"&&revelation.idealStance==="caution")
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

  return { rank, rankLabel, rankColor, rankDesc, total, consistencyScore, alignScore, finalBonus, dominantStance, decisions, finalDecisionId:finalDecision };
}

// ===== UTILS =====
function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }

function generateSignalDeck(revelationId){
  const seq = SIGNAL_SEQUENCES[revelationId];
  return seq.map((c,i)=>({id:i+1,...c}));
}
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
const STANCE_LABEL = { dialogue:"対話志向", observe:"観察志向", caution:"警戒志向", block:"遮断志向" };

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
  const [lastDecision, setLastDecision]         = useState(null);
  const [finalDecision, setFinalDecision]       = useState(null);
  const [revelation, setRevelation]             = useState(null);
  const [rankResult, setRankResult]             = useState(null);
  const [narrative, setNarrative]               = useState("");
  const totalRounds = 3;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [phase]);

  const [pendingRevelation, setPendingRevelation] = useState(null);

  function goToRoleSelect(){ setSelectedRole(null); setPhase(PHASE.ROLE_SELECT); }

  function startGame(){
    const chosen = ROLES.find(r=>r.id===selectedRole);
    const rev = shuffle(REVELATIONS)[0];
    setPendingRevelation(rev);
    const deck = generateSignalDeck(rev.id);
    setRole(chosen); setSignalDeck(deck);
    setSignalSet([deck[0]]);
    setNarrative(shuffle(ROUND_NARRATIVES[0])[0]);
    setRound(1); setDecisions([]); setCurrentDecision(null);
    setPhase(PHASE.SIGNAL);
  }

  function submitRound(){
    if(!currentDecision||!role) return;
    const newDecision = { round, role, decisionId: currentDecision };
    const updated = [...decisions, newDecision];
    setDecisions(updated);
    setLastDecision(currentDecision);
    setAlienReaction(getAlienReaction([newDecision]));
    setPhase(PHASE.ALIEN);
    if(round<totalRounds){
      setSignalSet([signalDeck[round]]);
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
    if(!finalDecision||!pendingRevelation) return;
    setRevelation(pendingRevelation);
    setRankResult(calcRank(decisions, pendingRevelation, finalDecision));
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
        {phase===PHASE.ALIEN       && <AlienReactionScreen reaction={alienReaction} round={round} totalRounds={totalRounds} onNext={proceedFromAlien} lastDecision={lastDecision} />}
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
          0%,100%{opacity:.65;filter:drop-shadow(0 0 3px rgba(251,191,36,.2))}
          50%{opacity:1;filter:drop-shadow(0 0 14px rgba(251,191,36,.9))}
        }
        @keyframes iconRipple{
          0%{transform:scale(1);opacity:.5}
          100%{transform:scale(2.4);opacity:0}
        }
        @keyframes titleGlow{
          0%,100%{color:#fbbf24;text-shadow:none}
          50%{color:#fde68a;text-shadow:0 0 8px rgba(251,191,36,.6)}
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
        @keyframes symbolBreath{
          0%{filter:drop-shadow(0 0 2px rgba(125,211,252,.12));opacity:.5;transform:translateY(0) scale(1) rotate(0deg)}
          25%{filter:drop-shadow(0 0 4px rgba(125,211,252,.3));opacity:.7;transform:translateY(-4px) scale(1.02) rotate(.5deg)}
          55%{filter:drop-shadow(0 0 9px rgba(125,211,252,.6)) drop-shadow(0 0 16px rgba(56,189,248,.2));opacity:.95;transform:translateY(-11px) scale(1.07) rotate(-.4deg)}
          75%{filter:drop-shadow(0 0 11px rgba(125,211,252,.68)) drop-shadow(0 0 20px rgba(56,189,248,.25));opacity:1;transform:translateY(-12px) scale(1.08) rotate(.2deg)}
          100%{filter:drop-shadow(0 0 2px rgba(125,211,252,.12));opacity:.5;transform:translateY(0) scale(1) rotate(0deg)}
        }
        button:active{transform:scale(.97)}
        button:active{background-color:rgba(125,211,252,.25) !important;transition:none}
      `}</style>
    </div>
  );
}

// ===== INTRO =====
function IntroScreen({onNext}){
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{...s.card,paddingTop:64,paddingBottom:52}} onClick={()=>setRevealed(true)}>
      <div style={{textAlign:"center",animation:"fadeIn 2s ease",marginBottom:40}}>
        <div style={{...s.signalSymbol,marginBottom:20,marginTop:0}}>◈</div>
        <h1 style={{...s.title,margin:0}}>SIGNAL</h1>
      </div>
      <div style={{
        opacity: revealed?1:0,
        transform: revealed?"translateY(0)":"translateY(24px)",
        transition:"opacity 2.5s ease, transform 2.5s cubic-bezier(.16,1,.3,1)",
        pointerEvents: revealed?"auto":"none",
      }}>
        <p style={{...s.subtitle,display:"flex",flexDirection:"column",gap:"0px"}}>
          <span>宇宙から信号が届いた。</span>
          <span>解読できない。</span>
          <span>でも、何かを求めている。</span>
        </p>
        <p style={{...s.subtitle,color:"#b8c8da",letterSpacing:".02em",display:"flex",flexDirection:"column",gap:"0px",marginTop:12}}>
          <span>あなたは人類の代表として、</span>
          <span>この信号にどう応答するかを</span>
          <span>決めなければならない。</span>
        </p>
        <button style={s.primaryBtn} onClick={e=>{e.stopPropagation();onNext();}}>役割を選ぶ →</button>
      </div>
    </div>
  );
}

// ===== ROLE SELECT =====
function RoleSelectScreen({selectedRole,setSelectedRole,onStart}){
  return (
    <div style={{...s.cardSelect,animation:"fadeIn .6s ease",paddingTop:32,paddingBottom:32}}>
      <p style={s.roundBadgeSelect}><span style={s.roundBadgeDot}/>選択</p>
      <h2 style={{...s.heading,marginBottom:6}}>役割を選ぶ</h2>
      <p style={{...s.body,fontSize:13,marginBottom:12,lineHeight:1.6}}>
        あなたはどの立場から信号に向き合いますか？
      </p>
      <div style={s.roleSelectGrid}>
        {ROLES.map(r=>{
          const selected = selectedRole===r.id;
          return (
            <button key={r.id}
              style={selected?s.roleSelectCardActive:s.roleSelectCard}
              onClick={()=>setSelectedRole(r.id)}>
              <span style={s.roleSelectIcon}>{r.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <span style={s.roleSelectName}>{r.name}</span>
                <span style={selected?s.roleSelectFilterActive:s.roleSelectFilter}>{r.filter}</span>
              </div>
              {selected&&<span style={s.roleCheck}>✓</span>}
            </button>
          );
        })}
      </div>
      <button style={selectedRole?s.submitBtn:s.disabledBtn} onClick={selectedRole?onStart:undefined}>
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
            border:`1px solid rgba(251,191,36,${.12-i*.03})`,
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
        <p style={s.narrative}>
          {Array.isArray(narrative)
            ? narrative.map((line,i)=><span key={i} style={{display:"block"}}>{line}</span>)
            : narrative}
        </p>

        <p style={{fontSize:11,letterSpacing:".18em",color:"#fbbf24",opacity:.7,textTransform:"uppercase",marginBottom:10,textAlign:"center"}}>— 受信した信号 —</p>

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
                  color:"#fbbf24",
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
                  border:"1px solid rgba(251,191,36,.5)",
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
                background:`rgba(251,191,36,.2)`,
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
    <div style={{...s.cardSelect,animation:"fadeIn .6s ease"}}>
      <p style={s.roundBadgeSelect}>
        <span style={s.roundBadgeDot}/>
        ROUND {round} / {totalRounds} — 選択
      </p>
      <h2 style={s.heading}>あなたの選択</h2>
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
      <button style={currentDecision?s.submitBtn:s.disabledBtn} onClick={currentDecision?onSubmit:undefined}>
        決断を送信する
      </button>
    </div>
  );
}

// ===== ALIEN REACTION =====
function AlienReactionScreen({reaction,round,totalRounds,onNext,lastDecision}){
  if(!reaction) return null;
  const isLast = round>=totalRounds;
  const dec = ALL_DECISIONS.find(d=>d.id===lastDecision);
  return (
    <div style={{...s.card,animation:"fadeIn .6s ease"}}>
      <p style={s.roundBadge}>ROUND {round} / {totalRounds} — 応答</p>
      <h2 style={s.heading}>彼らの反応</h2>

      {/* 自分の選択 */}
      {dec&&(
        <div style={s.myChoiceBox}>
          <span style={s.myChoiceLabel}>あなたの選択</span>
          <span style={s.myChoiceValue}>{dec.label}</span>
        </div>
      )}

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
        {isLast ? "最終決断へ →" : "次の信号へ →"}
      </button>
    </div>
  );
}

// ===== FINAL DECISION =====
function FinalDecisionScreen({decisions,overallStance,finalDecision,setFinalDecision,onSubmit}){
  const stanceCounts = decisions.reduce((acc,d)=>{ const st=ALL_DECISIONS.find(dc=>dc.id===d.decisionId)?.stance; if(st) acc[st]=(acc[st]||0)+1; return acc; },{});
  return (
    <div style={{...s.cardSelect,animation:"fadeIn .6s ease"}}>
      <div style={s.finalHeader}>
        <span style={s.roundBadgeSelect}><span style={s.roundBadgeDot}/>選択</span>
        <h2 style={{...s.heading,margin:0,whiteSpace:"nowrap"}}>最終決断</h2>
      </div>
      <p style={s.body}>
        すべての信号を受け取った。<br/>
        今、人類を代表して<br/>
        最後の意思を示す時だ。
      </p>

      <div style={s.stanceBar}>
        {Object.entries(stanceCounts).sort((a,b)=>b[1]-a[1]).map(([stance,count])=>(
          <div key={stance} style={s.stanceBarItem}>
            <span style={{...s.stanceBarLabel, color: stance==="dialogue"?"#34d399":stance==="observe"?"#a78bfa":stance==="caution"?"#f59e0b":"#f87171"}}>{STANCE_LABEL[stance]}</span>
            <div style={s.stanceBarTrack}>
              <div style={{...s.stanceBarFill, width:`${(count/decisions.length)*100}%`, background: stance==="dialogue"?"#34d399":stance==="observe"?"#a78bfa":stance==="caution"?"#f59e0b":"#f87171"}} />
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
      <button style={finalDecision?s.submitBtn:s.disabledBtn} onClick={finalDecision?onSubmit:undefined}>
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
      <p style={s.body}>
        封印された啓示を<br/>
        開く準備はできているか。
      </p>
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
            <p style={{...s.rankSubDesc,display:"flex",flexDirection:"column",gap:4}}>
              <span>人類の姿勢：<span style={{color:"#7dd3fc"}}>{STANCE_LABEL[rankResult.dominantStance]}</span></span>
              <span>彼らが求めていたもの：<span style={{color:"#fbbf24"}}>{STANCE_LABEL[revelation.idealStance]}</span></span>
            </p>
          </div>

          {/* 最終決断の評価 */}
          {(()=>{
            const fd = FINAL_DECISIONS.find(f=>f.id===rankResult.finalDecisionId);
            const isMatch = rankResult.finalBonus===50;
            const isNear = rankResult.finalBonus===25;
            const evalColor = isMatch?"#34d399":isNear?"#f59e0b":"#f87171";
            const evalText = isMatch
              ? `「${fd?.label}」は彼らの望みと一致した。`
              : isNear
              ? `「${fd?.label}」は彼らの望みに近かったが、完全には届かなかった。`
              : `「${fd?.label}」は彼らの望みとは遠かった。`;
            return fd ? (
              <div style={{...s.rankDescBox,marginTop:8,borderColor:`${evalColor}44`,background:`${evalColor}08`}}>
                <p style={{...s.rankSubDesc,color:evalColor,fontSize:13,lineHeight:1.7}}>
                  最終決断の評価：{evalText}
                </p>
              </div>
            ) : null;
          })()}

          {/* アクション振り返り */}
          <div style={s.reviewSection}>
            <p style={s.reviewLabel}>— あなたの選択の記録 —</p>
            {rankResult.decisions&&rankResult.decisions.map((d,i)=>{
              const dec = ALL_DECISIONS.find(dc=>dc.id===d.decisionId);
              const stanceColor = dec?.stance==="dialogue"?"#34d399":dec?.stance==="observe"?"#7dd3fc":dec?.stance==="caution"?"#f59e0b":"#f87171";
              return (
                <div key={i} style={s.reviewItem}>
                  <span style={s.reviewRound}>R{d.round}</span>
                  <span style={{...s.reviewDecision,color:stanceColor}}>{dec?.label}</span>
                  <span style={s.reviewStance}>{STANCE_LABEL[dec?.stance]}</span>
                </div>
              );
            })}
          </div>

          {/* 信号の意味の開示 */}
          {SIGNAL_SEQUENCES[revelation.id]&&(
            <div style={s.hintRevealBox}>
              <p style={s.hintRevealLabel}>— 信号が示していたもの —</p>
              {SIGNAL_SEQUENCES[revelation.id].map((card,i)=>(
                <div key={i} style={{...s.hintRevealCard,marginBottom:i<2?10:0}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,width:36,gap:2}}>
                    <span style={s.hintRevealSymbol}>{card.symbol}</span>
                    <span style={{fontSize:10,color:"#fbbf24",opacity:.6}}>R{i+1}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={s.hintRevealTitle}>{card.title}</p>
                    <p style={s.hintRevealDesc}>{card.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
  card:{background:"rgba(8,20,50,.88)",border:"1px solid rgba(125,211,252,.18)",borderRadius:16,padding:"64px 20px",backdropFilter:"blur(12px)",boxShadow:"0 0 60px rgba(14,165,233,.08),0 4px 32px rgba(0,0,0,.5)",animation:"signalPulse 6s ease-in-out infinite"},
  cardSelect:{background:"rgba(8,22,55,.92)",border:"1px solid rgba(125,211,252,.35)",borderRadius:16,padding:"64px 20px",backdropFilter:"blur(12px)",boxShadow:"0 0 80px rgba(14,165,233,.18),0 0 120px rgba(125,211,252,.06),0 4px 32px rgba(0,0,0,.5)",animation:"signalPulse 6s ease-in-out infinite"},
  signalSymbol:{fontSize:52,textAlign:"center",marginBottom:20,marginTop:0,animation:"symbolBreath 5.5s cubic-bezier(.45,0,.55,1) infinite",display:"block",letterSpacing:".05em"},
  title:{fontSize:44,letterSpacing:".45em",textAlign:"center",color:"#7dd3fc",margin:"0 0 24px",fontWeight:300,animation:"glow 3s ease-in-out infinite",textWrap:"balance",paddingLeft:".45em"},
  subtitle:{textAlign:"center",color:"#c8d8e8",fontSize:14,lineHeight:2.1,margin:"0 0 24px",textWrap:"balance",letterSpacing:".04em"},
  heading:{fontSize:22,color:"#7dd3fc",margin:"0 0 12px",fontWeight:400,letterSpacing:".05em",textWrap:"balance"},
  body:{color:"#dde6f0",fontSize:14,lineHeight:2,margin:"0 0 20px",textWrap:"pretty",textAlign:"left"},
  narrative:{color:"#e8f0f8",fontSize:14,lineHeight:2,margin:"0 0 20px",fontStyle:"italic",padding:"12px 16px",borderLeft:"2px solid rgba(251,191,36,.4)",background:"rgba(251,191,36,.04)",borderRadius:"0 8px 8px 0",textWrap:"pretty",textAlign:"left"},
  badge:{marginLeft:10,fontSize:12,padding:"2px 10px",background:"rgba(125,211,252,.12)",border:"1px solid rgba(125,211,252,.3)",borderRadius:20,color:"#7dd3fc"},
  label:{color:"#7dd3fc",fontSize:12,letterSpacing:".1em",textTransform:"uppercase",marginBottom:10},
  section:{marginBottom:24},
  countRow:{display:"flex",gap:10},
  countBtn:{width:44,height:44,border:"1px solid rgba(125,211,252,.25)",borderRadius:8,background:"transparent",color:"#dde6f0",fontSize:16,cursor:"pointer"},
  countBtnActive:{width:44,height:44,border:"1px solid #7dd3fc",borderRadius:8,background:"rgba(125,211,252,.15)",color:"#7dd3fc",fontSize:16,cursor:"pointer"},
  primaryBtn:{width:"100%",padding:"14px",background:"rgba(14,165,233,.12)",border:"1px solid rgba(125,211,252,.3)",borderRadius:10,color:"#7dd3fc",fontSize:14,letterSpacing:".05em",cursor:"pointer",marginTop:8},
  submitBtn:{width:"100%",padding:"16px",background:"rgba(125,211,252,.2)",border:"2px solid rgba(125,211,252,.7)",borderRadius:10,color:"#e8f0f8",fontSize:15,letterSpacing:".08em",fontWeight:600,cursor:"pointer",marginTop:8,boxShadow:"0 0 16px rgba(125,211,252,.15)"},
  disabledBtn:{width:"100%",padding:"16px",background:"rgba(30,41,59,.3)",border:"1px solid rgba(100,116,139,.15)",borderRadius:10,color:"#4a5a6a",fontSize:15,cursor:"not-allowed",marginTop:8},
  revelationBtn:{width:"100%",padding:"14px",background:"rgba(251,191,36,.12)",border:"1px solid rgba(251,191,36,.45)",borderRadius:10,color:"#fbbf24",fontSize:15,letterSpacing:".05em",cursor:"pointer",marginTop:8},
  rankRevealBtn:{width:"100%",padding:"14px",background:"rgba(167,139,250,.12)",border:"1px solid rgba(167,139,250,.45)",borderRadius:10,color:"#a78bfa",fontSize:15,letterSpacing:".05em",cursor:"pointer",marginTop:8},
  secondaryBtn:{width:"100%",padding:"12px",background:"transparent",border:"1px solid rgba(125,211,252,.2)",borderRadius:10,color:"#b8c8da",fontSize:14,cursor:"pointer",marginTop:12},
  roundBadge:{fontSize:11,letterSpacing:".15em",color:"#b8c8da",textTransform:"uppercase",marginBottom:12},
  roundBadgeSelect:{fontSize:11,letterSpacing:".15em",color:"#7dd3fc",textTransform:"uppercase",marginBottom:12,display:"inline-flex",alignItems:"center",gap:6},
  roundBadgeDot:{width:6,height:6,borderRadius:"50%",background:"#7dd3fc",display:"inline-block",animation:"pulseRing 1.5s ease-out infinite"},
  roleSelectGrid:{display:"flex",flexDirection:"column",gap:4,marginBottom:14},
  roleSelectCard:{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,cursor:"pointer",textAlign:"left",background:"rgba(255,255,255,.03)",border:"1px solid rgba(125,211,252,.12)",position:"relative"},
  roleSelectCardActive:{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,cursor:"pointer",textAlign:"left",background:"rgba(14,165,233,.12)",border:"1px solid rgba(125,211,252,.55)",position:"relative"},
  roleSelectCardDisabled:{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,cursor:"not-allowed",textAlign:"left",background:"rgba(255,255,255,.01)",border:"1px solid rgba(125,211,252,.05)",position:"relative",opacity:.35},
  roleSelectIcon:{fontSize:16,flexShrink:0,width:22,textAlign:"center"},
  roleSelectName:{color:"#e8f0f8",fontSize:12,fontWeight:600,display:"block",marginBottom:1},
  roleSelectFilter:{color:"#b8c8da",fontSize:11,lineHeight:1.3,display:"block",textWrap:"pretty"},
  roleSelectFilterActive:{color:"#dde6f0",fontSize:11,lineHeight:1.3,display:"block",textWrap:"pretty"},
  roleSelectForbidden:{color:"#8899aa",fontSize:11,display:"block",fontStyle:"italic"},
  roleCheck:{position:"absolute",top:12,right:14,color:"#34d399",fontSize:15,fontWeight:700},
  signalList:{display:"flex",flexDirection:"column",gap:12,marginBottom:24},
  signalCard:{display:"flex",alignItems:"flex-start",gap:16,background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.2)",borderRadius:10,padding:"14px 16px",position:"relative",overflow:"hidden"},
  signalTitle:{color:"#fbbf24",fontSize:14,margin:"0 0 6px",letterSpacing:".03em",textAlign:"left"},
  signalDesc:{color:"#e8f0f8",fontSize:13,margin:0,lineHeight:1.8,textAlign:"left"},
  tabRow:{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"},
  tab:{padding:"8px 14px",border:"1px solid rgba(125,211,252,.18)",borderRadius:8,background:"transparent",color:"#b8c8da",fontSize:13,cursor:"pointer"},
  tabActive:{padding:"8px 14px",border:"1px solid rgba(125,211,252,.55)",borderRadius:8,background:"rgba(125,211,252,.12)",color:"#7dd3fc",fontSize:13,cursor:"pointer"},
  checkMark:{color:"#34d399",fontSize:11},
  filterNote:{color:"#dde6f0",fontSize:13,fontStyle:"italic",marginBottom:14,lineHeight:1.7,padding:"10px 14px",background:"rgba(255,255,255,.03)",borderRadius:8,borderLeft:"2px solid rgba(125,211,252,.3)",wordBreak:"break-all",boxSizing:"border-box",width:"100%"},
  decisionGrid:{display:"grid",gridTemplateColumns:"calc(50% - 4px) calc(50% - 4px)",gap:8,marginBottom:20},
  decisionBtn:{padding:"12px 10px",border:"1px solid rgba(125,211,252,.15)",borderRadius:8,background:"transparent",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5,minWidth:0,width:"100%",boxSizing:"border-box",wordBreak:"break-all"},
  decisionBtnActive:{padding:"12px 10px",border:"1px solid rgba(125,211,252,.6)",borderRadius:8,background:"rgba(14,165,233,.14)",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5,minWidth:0,width:"100%",boxSizing:"border-box",wordBreak:"break-all"},
  decisionBtnForbidden:{padding:"12px 10px",border:"1px solid rgba(255,255,255,.05)",borderRadius:8,background:"rgba(0,0,0,.2)",cursor:"not-allowed",textAlign:"left",display:"flex",flexDirection:"column",gap:5,opacity:.4,minWidth:0,width:"100%",boxSizing:"border-box"},
  decisionLabel:{color:"#e8f0f8",fontWeight:600,fontSize:14},
  decisionLabelForbidden:{color:"#5a6070",fontWeight:600,fontSize:14},
  decisionDesc:{color:"#b8c8da",fontSize:12,lineHeight:1.5,wordBreak:"break-all"},
  myChoiceBox:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(125,211,252,.2)",borderRadius:10,marginBottom:14},
  myChoiceLabel:{color:"#7dd3fc",fontSize:11,letterSpacing:".12em",textTransform:"uppercase"},
  myChoiceValue:{color:"#e8f0f8",fontSize:14,fontWeight:600},
  // Alien reaction
  alienBox:{padding:"20px",background:"rgba(255,255,255,.03)",border:"2px solid",borderRadius:14,marginBottom:20,boxSizing:"border-box",width:"100%"},
  alienSymbolRow:{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:12,position:"relative"},
  alienSymbol:{fontSize:32,letterSpacing:".1em",fontWeight:300},
  alienPulse:{width:8,height:8,borderRadius:"50%",animation:"pulseRing 1.5s ease-out infinite"},
  alienTitle:{fontSize:18,fontWeight:600,letterSpacing:".05em",margin:"0 0 10px",textAlign:"center",textWrap:"balance"},
  alienDesc:{color:"#dde6f0",fontSize:14,lineHeight:1.9,margin:"0 0 14px",wordBreak:"break-all",textAlign:"left"},
  alienHint:{color:"#e8f0f8",fontSize:13,lineHeight:1.7,margin:0,padding:"10px 14px",background:"rgba(255,255,255,.03)",borderRadius:8,borderLeft:"3px solid",wordBreak:"break-all",textAlign:"left"},
  // Final decision
  finalHeader:{display:"flex",alignItems:"center",gap:12,marginBottom:8},
  finalBadge:{fontSize:11,padding:"3px 10px",background:"rgba(125,211,252,.1)",border:"1px solid rgba(125,211,252,.3)",borderRadius:20,color:"#7dd3fc",letterSpacing:".1em"},
  stanceBar:{display:"flex",flexDirection:"column",gap:8,marginBottom:20,padding:"14px 16px",background:"rgba(255,255,255,.03)",borderRadius:10,border:"1px solid rgba(125,211,252,.1)"},
  stanceBarItem:{display:"flex",alignItems:"center",gap:10},
  stanceBarLabel:{fontSize:12,minWidth:64,color:"#dde6f0"},
  stanceBarTrack:{flex:1,height:6,background:"rgba(255,255,255,.08)",borderRadius:3,overflow:"hidden"},
  stanceBarFill:{height:"100%",borderRadius:3,transition:"width .5s ease"},
  stanceBarCount:{fontSize:12,color:"#dde6f0",minWidth:16,textAlign:"right"},
  finalDecisionList:{display:"flex",flexDirection:"column",gap:8,marginBottom:20},
  finalBtn:{padding:"14px 16px",border:"1px solid rgba(125,211,252,.15)",borderRadius:10,background:"transparent",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5},
  finalBtnAligned:{padding:"14px 16px",border:"1px solid rgba(125,211,252,.3)",borderRadius:10,background:"rgba(14,165,233,.06)",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5},
  finalBtnActive:{padding:"14px 16px",border:"1px solid rgba(125,211,252,.7)",borderRadius:10,background:"rgba(14,165,233,.16)",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:5},
  finalBtnTop:{display:"flex",alignItems:"center",gap:8},
  finalBtnLabel:{color:"#e8f0f8",fontWeight:600,fontSize:14},
  finalBtnBadge:{fontSize:10,padding:"2px 8px",background:"rgba(125,211,252,.12)",border:"1px solid rgba(125,211,252,.3)",borderRadius:10,color:"#7dd3fc"},
  finalBtnDesc:{color:"#dde6f0",fontSize:12,lineHeight:1.5,wordBreak:"break-all"},
  // Timeline
  timeline:{display:"flex",flexDirection:"column",gap:10,marginBottom:20},
  timelineRound:{padding:"12px 16px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(125,211,252,.1)",borderRadius:10},
  timelineLabel:{fontSize:11,letterSpacing:".12em",color:"#b8c8da",textTransform:"uppercase",margin:"0 0 8px"},
  timelineItem:{display:"flex",alignItems:"center",gap:8,marginBottom:4},
  timelineRole:{color:"#c8d8e8",fontSize:13,minWidth:100},
  timelineArrow:{color:"#5a7080",fontSize:12},
  timelineDecision:{color:"#7dd3fc",fontSize:13},
  // Revelation
  reviewSection:{marginTop:16,padding:"14px 16px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(125,211,252,.1)",borderRadius:10},
  reviewLabel:{fontSize:11,letterSpacing:".15em",color:"#7dd3fc",textTransform:"uppercase",margin:"0 0 12px",textAlign:"center"},
  reviewItem:{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,.05)"},
  reviewRound:{fontSize:11,color:"#5a7080",minWidth:20,letterSpacing:".05em"},
  reviewDecision:{fontSize:13,fontWeight:600,flex:1},
  reviewStance:{fontSize:11,color:"#7dd3fc",letterSpacing:".05em"},
  hintRevealBox:{marginTop:14,padding:"14px 16px",background:"rgba(251,191,36,.05)",border:"1px solid rgba(251,191,36,.2)",borderRadius:10},
  hintRevealLabel:{fontSize:11,letterSpacing:".15em",color:"#fbbf24",textTransform:"uppercase",margin:"0 0 10px",textAlign:"center",opacity:.7},
  hintRevealCard:{display:"flex",alignItems:"center",gap:14},
  hintRevealSymbol:{fontSize:28,color:"#fbbf24",flexShrink:0,width:36,textAlign:"center"},
  hintRevealTitle:{color:"#fbbf24",fontSize:14,fontWeight:600,margin:"0 0 4px"},
  hintRevealDesc:{color:"#b8c8da",fontSize:12,margin:0,lineHeight:1.6,wordBreak:"break-all"},
  revSection:{padding:"16px 18px",background:"rgba(125,211,252,.04)",border:"1px solid rgba(125,211,252,.18)",borderRadius:12,marginBottom:12},
  revSectionFate:{background:"rgba(251,191,36,.05)",border:"1px solid rgba(251,191,36,.22)"},
  revSectionLabel:{fontSize:11,letterSpacing:".18em",textTransform:"uppercase",color:"#7dd3fc",margin:"0 0 10px"},
  revSectionText:{color:"#dde6f0",fontSize:14,lineHeight:1.95,margin:0,wordBreak:"break-all"},
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
