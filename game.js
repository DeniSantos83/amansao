// =====================
// MÁSCARAS DA VINGANÇA
// Tela inicial + criação de personagem
// =====================

const CHARACTERS = {
  fernanda: {
    id: "fernanda",
    name: "Fernanda Sena",
    role: "Jornalista investigativa",
    stats: { life: 10, sanity: 12, focus: 10, rep: 8 },
    skills: [
      { key: "persuasao", label: "Persuasão (+2) — extrai informação em conversa/pressão social" },
      { key: "observacao", label: "Observação (+2) — percebe detalhes e inconsistências" },
      { key: "fontes", label: "Rede de Fontes (+2) — consegue contatos e vazamentos" },
      { key: "instinto", label: "Instinto de Notícia (+1) — fareja o que dá manchete e o que dá morte" }
    ],
    startingItems: ["gravador", "caderno"]
  },

  messias: {
    id: "messias",
    name: "Messias Santos",
    role: "Perícia / TI forense",
    stats: { life: 12, sanity: 10, focus: 12, rep: 6 },
    skills: [
      { key: "pericia", label: "Perícia (+2) — lê cena do crime como um mapa" },
      { key: "analise", label: "Análise (+2) — conecta dados e padrões" },
      { key: "rastreio", label: "Rastreamento (+2) — pega rastro digital e físico" },
      { key: "procedimento", label: "Procedimento (+1) — reduz riscos ao agir com método" }
    ],
    startingItems: ["kit_pericia", "pendrive"]
  }
};

// Estado base do jogo (vai crescer quando a gente colocar cenas/pistas/casos)
const DEFAULT_STATE = {
  player: null,            // { id, name, role, stats, skills, items }
  case: {
    id: "case01",
    title: "Praça Fausto Cardoso",
    day: 1,
    suspects: 2,           // 2 assassinos na lore
    flags: {}              // decisões persistentes
  },
  log: [],                 // registro de eventos
  sceneId: null
};

let state = structuredClone(DEFAULT_STATE);

// ------------------
// Elementos da UI
// ------------------
const screenStart = document.getElementById("screenStart");
const screenGame  = document.getElementById("screenGame");

const panelSelect = document.getElementById("panelSelect");
const btnChoose   = document.getElementById("btnChoose");
const btnClose    = document.getElementById("btnClose");
const btnConfirm  = document.getElementById("btnConfirm");
const btnContinue = document.getElementById("btnContinue");

const pillName  = document.getElementById("pillName");
const pillRole  = document.getElementById("pillRole");
const stLife    = document.getElementById("stLife");
const stSanity  = document.getElementById("stSanity");
const stFocus   = document.getElementById("stFocus");
const stRep     = document.getElementById("stRep");
const skillsList= document.getElementById("skillsList");
const startHint = document.getElementById("startHint");

const hudChar   = document.getElementById("hudChar");
const hudStats  = document.getElementById("hudStats");
const btnRestart= document.getElementById("btnRestart");

// placeholder (a gente vai preencher depois com cenas reais)
const sceneTitle = document.getElementById("sceneTitle");
const sceneText  = document.getElementById("sceneText");
const choicesEl  = document.getElementById("choices");

// ------------------
// Seleção
// ------------------
let selectedCharId = null;

btnChoose.addEventListener("click", () => {
  panelSelect.setAttribute("aria-hidden", "false");
});

btnClose.addEventListener("click", () => {
  panelSelect.setAttribute("aria-hidden", "true");
});

document.querySelectorAll(".charCard").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.char;
    selectedCharId = id;

    document.querySelectorAll(".charCard").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");

    renderSheet(id);
    btnConfirm.disabled = false;
  });
});

btnConfirm.addEventListener("click", () => {
  if (!selectedCharId) return;

  const base = CHARACTERS[selectedCharId];

  state.player = {
    id: base.id,
    name: base.name,
    role: base.role,
    stats: { ...base.stats },
    skills: base.skills.map(s => ({...s})),
    items: [...base.startingItems],
    clues: [],     // pistas coletadas
    heat: 0        // nível de risco/“estão atrás de você”
  };

  state.sceneId = "case01_intro";
  state.log.push(`Personagem escolhido: ${state.player.name}`);

  // libera continuar e fecha painel
  btnContinue.disabled = false;
  panelSelect.setAttribute("aria-hidden", "true");

  startHint.textContent = "Escolha confirmada. Você pode continuar.";
  btnContinue.focus();
});

btnContinue.addEventListener("click", () => {
  if (!state.player) return;
  startGame();
});

btnRestart.addEventListener("click", () => {
  state = structuredClone(DEFAULT_STATE);
  selectedCharId = null;

  // reset UI seleção
  btnContinue.disabled = true;
  btnConfirm.disabled = true;
  document.querySelectorAll(".charCard").forEach(b => b.classList.remove("selected"));
  renderSheet(null);

  // volta pra tela inicial
  screenGame.hidden = true;
  screenStart.hidden = false;
});

// ------------------
// Render da ficha
// ------------------
function renderSheet(id){
  if (!id){
    pillName.textContent = "Nome: —";
    pillRole.textContent = "Profissão: —";
    stLife.textContent = "—";
    stSanity.textContent = "—";
    stFocus.textContent = "—";
    stRep.textContent = "—";
    skillsList.innerHTML = `<span class="chip">—</span>`;
    startHint.textContent = "Selecione um personagem para liberar “Continuar”.";
    return;
  }

  const c = CHARACTERS[id];
  pillName.textContent = `Nome: ${c.name}`;
  pillRole.textContent = `Profissão: ${c.role}`;
  stLife.textContent = c.stats.life;
  stSanity.textContent = c.stats.sanity;
  stFocus.textContent = c.stats.focus;
  stRep.textContent = c.stats.rep;

  skillsList.innerHTML = "";
  for (const sk of c.skills){
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = sk.label;
    skillsList.appendChild(span);
  }
  startHint.textContent = "Dica: suas skills abrem opções exclusivas durante a investigação.";
}

// ------------------
// Início do jogo (placeholder)
// ------------------
function startGame(){
  screenStart.hidden = true;
  screenGame.hidden = false;

  hudChar.textContent = `${state.player.name} • ${state.player.role}`;
  updateHudStats();

  // aqui a gente ainda não montou o motor de cenas completo;
  // mas já inicia um “intro” do Caso 01:
  sceneTitle.textContent = "Caso 01 — Praça Fausto Cardoso";
  sceneText.textContent =
`Manhã em Aracaju. O centro acorda com pressa e calor.
A Praça Fausto Cardoso não é só passagem — é vitrine de poder antigo.
Hoje, ela vai virar palco.

Um homem é encontrado desacordado em um banco. No começo, pensam ser um morador de rua.
As roupas desmentem. A cidade segura a respiração.

Você chega e sente: isso não é só um crime.
É uma mensagem.`;

  // escolhas iniciais (depois a gente conecta com cenas reais e consequências)
  choicesEl.innerHTML = "";

  addChoice("Isolar a área e observar a cena primeiro", () => {
    gainClue("Primeiro olhar: mãos amarradas com palha de cana seca.");
    state.player.stats.focus = clamp(state.player.stats.focus + 1, 0, 20);
    state.player.heat = clamp(state.player.heat + 1, 0, 10);
    updateHudStats();
    softNarrate("Você foca na cena. Palha de cana seca não aparece por acaso no centro.");
  });

  addChoice("Falar com testemunhas próximas", () => {
    // bônus por Persuasão/Fontes/Procedimento etc
    const bonus = skillBonus(["persuasao", "fontes"]);
    if (bonus > 0){
      gainClue("Uma testemunha viu um carro parar rápido e sair sem faróis.");
      softNarrate("Com as palavras certas, uma boca que estava fechada se abre.");
    } else {
      state.player.stats.rep = clamp(state.player.stats.rep - 1, 0, 20);
      state.player.heat = clamp(state.player.heat + 1, 0, 10);
      updateHudStats();
      softNarrate("As pessoas falam pouco. Aqui, medo e sobrenome andam juntos.");
    }
  });

  addChoice("Checar sinais técnicos imediatos (roupas, resíduos, odores)", () => {
    const bonus = skillBonus(["pericia", "analise"]);
    if (bonus > 0){
      gainClue("Odor forte de cachaça e marcas de arrasto: ele não morreu aqui.");
      softNarrate("Você enxerga o que a pressa da cidade ignora: deslocamento.");
    } else {
      state.player.stats.sanity = clamp(state.player.stats.sanity - 1, 0, 20);
      updateHudStats();
      softNarrate("Você tenta, mas falta ferramenta/tempo. O detalhe escapa.");
    }
  });

  addChoice("Aproximar demais para ver o rosto (arriscado)", () => {
    // exemplo de consequência perigosa
    state.player.stats.life = clamp(state.player.stats.life - 2, 0, 20);
    state.player.heat = clamp(state.player.heat + 2, 0, 10);
    updateHudStats();
    softNarrate("Você sente o estômago virar. O erro custa caro — e chama atenção.");
    if (state.player.stats.life <= 0) hardFail("Você desmaia. Quando acorda… o caso já mudou sem você.");
  }, "danger");
}

function addChoice(label, onClick, style){
  const b = document.createElement("button");
  b.textContent = label;
  if (style === "danger") b.className = "danger";
  else b.className = "primary";
  b.addEventListener("click", onClick);
  choicesEl.appendChild(b);
}

function updateHudStats(){
  const { life, sanity, focus } = state.player.stats;
  hudStats.textContent = `Vida ${life} | Sanidade ${sanity} | Foco ${focus} | Calor ${state.player.heat}`;
}

// ------------------
// Utilidades / mecânica simples
// ------------------
function skillBonus(keys){
  // se o personagem tiver alguma das skills, concede 1 (pode evoluir pra rolagem)
  const owned = new Set(state.player.skills.map(s => s.key));
  return keys.some(k => owned.has(k)) ? 1 : 0;
}

function gainClue(text){
  if (!state.player.clues.includes(text)){
    state.player.clues.push(text);
    state.log.push(`Pista: ${text}`);
  }
}

function softNarrate(msg){
  // sem motor de cena ainda: só acrescenta feedback no texto
  sceneText.textContent += `\n\n— ${msg}`;
}

function hardFail(msg){
  sceneText.textContent += `\n\n☠️ ${msg}`;
  choicesEl.innerHTML = "";
  addChoice("Recomeçar", () => btnRestart.click());
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// inicial
renderSheet(null);