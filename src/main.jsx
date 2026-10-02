import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import scenes from "./cenas.json";
import "./style.css";
import { StoryReader, CombatVisual, AdventureJournal } from "./Experience.jsx";
import { readingBlocks, foundClues } from "./reading.js";
import {
  round as combatRound,
  luck as resolveCombatLuck,
  hurt,
} from "./combat.js";

import AudioControls from "./AudioControls.jsx";
import {playEffect} from "./audio.js";
const KEY = "o_casarao_react_v1";
const roll = () => 1 + Math.floor(Math.random() * 6);
const twoDice = () => roll() + roll();
const clamp = (n, max) => Math.max(0, Math.min(max, Number(n) || 0));
// A lista é gerada pelo Vite a partir dos arquivos em public/assets.
const sceneImages = Object.fromEntries(
  Object.entries(__SCENE_IMAGES__).map(([id, filename]) => [
    id,
    `${import.meta.env.BASE_URL}assets/${filename}`,
  ]),
);
function SceneImage({ id, title }) {
  const src = sceneImages[String(id)];
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <figure className="scene-image">
      <img
        src={src}
        alt={title || `Ilustração da cena ${id}`}
        onError={() => setFailed(true)}
        decoding="async"
      />
    </figure>
  );
}
const fresh = () => ({
  name: "",
  scene: 0,
  skillMax: 0,
  skillCur: 0,
  stamMax: 0,
  stamCur: 0,
  luckMax: 0,
  luckCur: 0,
  fearMax: 0,
  fearCur: 0,
  weaponBonus: 0,
  inventory: [],
  history: [],
  clues: [],
  log: [],
  combat: null,
});
function initial() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.scene != null) return { ...fresh(), ...saved };
    const old = JSON.parse(localStorage.getItem("a_mansao_state_v4"));
    if (old?.scene != null && old.name)
      return {
        ...fresh(),
        ...old,
        scene: Number(old.scene),
        inventory: [],
        history: [],
        combat: null,
      };
  } catch {}
  return fresh();
}
const special = {
  236: { enemies: [{ name: "ZUMBI", skill: 7, stam: 6 }] },
  14: { enemies: [{ name: "DOGUE ALEMÃO", skill: 7, stam: 5 }] },
  30: { enemies: [{ name: "O CONDE DE DRUMER", skill: 9, stam: 10 }] },
  41: {
    enemies: [
      { name: "Primeiro ESQUELETO", skill: 6, stam: 6 },
      { name: "Segundo ESQUELETO", skill: 7, stam: 6 },
    ],
  },
  43: {
    enemies: [
      { name: "Primeiro ESQUELETO", skill: 6, stam: 6 },
      { name: "Segundo ESQUELETO", skill: 7, stam: 6 },
    ],
  },
  78: {
    enemies: [
      { name: "Segundo DOGUE ALEMÃO", skill: 6, stam: 6 },
      { name: "Terceiro DOGUE ALEMÃO", skill: 6, stam: 5 },
    ],
  },
  142: { enemies: [{ name: "INIMIGO INVISÍVEL", skill: 10, stam: 4 }] },
  170: {
    enemies: [
      { name: "Primeiro DOGUE ALEMÃ", skill: 7, stam: 6 },
      { name: "Segundo DOGUE ALEMÃ", skill: 6, stam: 6 },
    ],
  },
  189: {
    enemies: [
      { name: "Primeiro ZUMBI", skill: 7, stam: 6 },
      { name: "Seu Segundo ZUMBI", skill: 6, stam: 6 },
    ],
  },
  191: { enemies: [{ name: "CORRUGA", skill: 7, stam: 7 }] },
  336: { enemies: [{ name: "FRANKLINS", skill: 8, stam: 8 }] },
  343: { enemies: [{ name: "MORCEGOS", skill: 4, stam: 4 }] },
};
special[9] = {
  enemies: [
    { name: "Primeiro Espírito do Fogo", skill: 7, stam: 4 },
    { name: "Segundo Espírito do Fogo", skill: 7, stam: 3 },
  ],
  win: 375,
  flee: 218,
  fire: true,
};

function App() {
  const [readReady, setReadReady] = useState(false),
    [rolling, setRolling] = useState(false);
  const rollTimer = useRef(null);
  useEffect(() => () => clearTimeout(rollTimer.current), []);
  const [s, setS] = useState(initial),
    [name, setName] = useState(s.scene === 0 ? s.name : ""),
    [message, setMessage] = useState(""),
    [enemy, setEnemy] = useState({ name: "", skill: 7, stam: 6 }),
    [item, setItem] = useState(""),
    [sound, setSound] = useState(false);
  const audio = useRef(null),
    scene = scenes[String(s.scene)],
    dead = s.scene > 0 && (s.stamCur <= 0 || s.fearCur >= s.fearMax);
  useEffect(() => {
    setReadReady(readingBlocks(scene?.text).length <= 1);
    setRolling(false);
    clearTimeout(rollTimer.current);
    if (s.scene > 0) {
      const clues = foundClues(scene);
      if (clues.length)
        setS((old) => ({
          ...old,
          clues: [
            ...(old.clues || []),
            ...clues
              .filter(
                (text) =>
                  !(old.clues || []).some(
                    (c) => c.scene === old.scene && c.text === text,
                  ),
              )
              .map((text) => ({ scene: old.scene, text, kind: "auto" })),
          ],
        }));
    }
  }, [s.scene]);
  function saveClue(text) {
    mutate((p) => {
      p.clues = p.clues || [];
      if (!p.clues.some((c) => c.scene === p.scene && c.text === text))
        p.clues.push({ scene: p.scene, text, kind: "saved" });
    });
    setMessage("Trecho guardado no diário.");
  }
  const mutate = (fn) =>
    setS((old) => {
      const next = structuredClone(old);
      fn(next);
      return next;
    });
  const note = (p, t) => (p.log = [...p.log.slice(-39), t]);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(s));
  }, [s]);
  useEffect(() => {
    if (!audio.current) return;
    audio.current.volume = 0.35;
    if (sound) audio.current.play().catch(() => setSound(false));
    else audio.current.pause();
  }, [sound]);
  function start() {
    const n = name.trim();
    if (!n) {
      setMessage("Digite o nome do personagem.");
      return;
    }
    const skill = roll() + 6,
      stam = roll() + roll() + 12,
      luck = roll() + 6,
      fear = roll() + 6;
    setS({
      ...fresh(),
      name: n,
      scene: 0,
      skillMax: skill,
      skillCur: skill - 3,
      stamMax: stam,
      stamCur: stam,
      luckMax: luck,
      luckCur: luck,
      fearMax: fear,
      history: [],
      log: ["Ficha criada com dados."],
    });
    setMessage("");
  }
  function goto(id, manual = false) {
    const n = Number(id);
    if (!scenes[String(n)]) {
      setMessage("Essa cena não existe.");
      return;
    }
    if (dead) {
      setMessage("A aventura terminou. Recomece para jogar novamente.");
      return;
    }
    mutate((p) => {
      p.scene = n;
      p.history = [...p.history.slice(-99), n];
      p.combat = null;
      note(p, `${manual ? "Consulta manual" : "Escolha"}: cena ${n}`);
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function test(type) {
    if (dead) return;
    let result = "";
    mutate((p) => {
      const value = twoDice(),
        target = type === "luck" ? p.luckCur : p.skillMax,
        success = value <= target;
      if (type === "luck") p.luckCur = clamp(p.luckCur - 1, p.luckMax);
      result = `${type === "luck" ? "Sorte" : "Habilidade"}: 2d6 = ${value}; alvo ${target}. ${success ? "Sucesso" : "Falha"}.`;
      note(p, result);
    });
    setMessage(result);
  }
  function adjust(key, delta) {
    mutate((p) => {
      const max = {
        stamCur: "stamMax",
        luckCur: "luckMax",
        fearCur: "fearMax",
        skillCur: "skillMax",
      }[key];
      p[key] = clamp(p[key] + delta, p[max]);
      note(p, `${key} ${delta > 0 ? "+" : ""}${delta}`);
    });
  }
  function beginCombat(custom = false) {
    if (dead) return;
    const config = !custom && special[s.scene];
    const first = config?.enemies[0];
    const e = first || {
      name: enemy.name.trim() || "Criatura",
      skill: Number(enemy.skill),
      stam: Number(enemy.stam),
    };
    if (!Number.isFinite(e.skill) || !Number.isFinite(e.stam) || e.stam < 1) {
      setMessage("Informe os valores da criatura.");
      return;
    }
    mutate((p) => {
      p.combat = {
        enemies: config?.enemies || [e],
        index: 0,
        remaining: e.stam,
        active: true,
        won: false,
        lastHit: null,
        rounds: 0,
        firstWound: [191, 336].includes(p.scene),
        fire: !!config?.fire,
      };
      note(p, `Combate iniciado: ${e.name}`);
    });
    setMessage("");
  }
  function attack() {
    if (!s.combat?.active || dead || rolling) return;
    setRolling(true);
    playEffect("dice");
    rollTimer.current = setTimeout(() => {
      mutate((p) => {
        if (!p.combat?.active) return;
        note(p, combatRound(p));
        playEffect(p.combat.won ? "victory" : "hit");
        if (p.combat.won) note(p, "Combate vencido. Você sobreviveu.");
      });
      setRolling(false);
    }, 450);
  }
  function combatLuck() {
    if (dead) return;
    mutate((p) => {
      const result = resolveCombatLuck(p);
      if (result) note(p, result);
    });
  }
  function flee() {
    if (!s.combat?.active || dead) return;
    const dest = special[s.scene]?.flee;
    if (!dest) {
      setMessage("Esta cena não oferece fuga.");
      return;
    }
    mutate((p) => {
      const damage = hurt(p, 2);
      p.scene = dest;
      p.history = [...p.history, dest];
      p.combat = null;
      note(p, `Fuga: perdeu ${damage} de Resistência. Cena ${dest}.`);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function restart() {
    if (!confirm("Apagar o progresso e começar outra aventura?")) return;
    localStorage.removeItem(KEY);
    setS(fresh());
    setName("");
    setMessage("");
  }
  const isWinChoice = (choice) =>
    s.scene === 9 ? choice.to === 375 : !!special[s.scene] && s.scene !== 142;
  return (
    <>
      <audio
        ref={audio}
        src={`${import.meta.env.BASE_URL}assets/chuva.mp3`}
        loop
        preload="none"
      />
      <header className="header">
        <div className="brand">
          <span className="eyebrow">LIVRO-JOGO · TERROR</span>
          <strong>O CASARÃO</strong>
        </div>
        <div className="head-actions">
          <button
            onClick={() => setSound(!sound)}
            aria-label={sound ? "Desligar chuva" : "Ligar chuva"}
          >
            {sound ? "◖ Som ligado" : "◗ Som desligado"}
          </button>
          {s.name && <button onClick={restart}>Recomeçar</button>}
        </div>
      </header>
      <main className="layout">
        <section className="story">
          {s.scene === 0 ? (
            <div className="intro creation">
              <span className="eyebrow">ANTES DE ENTRAR</span>
              <h1>
                Quem vai enfrentar
                <br />
                <em>o casarão?</em>
              </h1>
              <p>
                Dê um nome ao personagem e role os dados para criar sua ficha.
              </p>
              <div className="start">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && start()}
                  placeholder="Nome do personagem"
                  aria-label="Nome do personagem"
                />
                <button className="primary" onClick={start}>
                  {s.name ? "Rolar novamente" : "Rolar os dados 🎲"}
                </button>
              </div>
              {s.name && (
                <>
                  <div className="creation-stats">
                    {[
                      ["Habilidade", s.skillMax, "1d6 + 6"],
                      ["Resistência", s.stamMax, "2d6 + 12"],
                      ["Sorte", s.luckMax, "1d6 + 6"],
                      ["Medo máximo", s.fearMax, "1d6 + 6"],
                    ].map(([label, value, formula]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <small>{formula}</small>
                      </div>
                    ))}
                  </div>
                  <p className="hint">
                    Seu medo começa em 0. Ao atingir o máximo, a aventura
                    termina.
                  </p>
                  <button
                    className="primary"
                    disabled={name.trim() !== s.name}
                    onClick={() => {
                      mutate((p) => {
                        p.scene = -1;
                        note(p, "Introdução: Uma luz na escuridão.");
                      });
                      setMessage("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Começar aventura →
                  </button>
                </>
              )}
            </div>
          ) : s.scene === -1 ? (
            <div className="intro narrative">
              <span className="eyebrow">A AVENTURA COMEÇA</span>
              <h1>
                Uma luz
                <br />
                <em>na escuridão</em>
              </h1>
              <AudioControls text={"Uma tempestade castiga a estrada deserta. Seguindo as indicações\n                de um velho de cabelos brancos, você tomou um caminho errado e\n                agora mal consegue enxergar além dos faróis. De repente, uma figura surge diante do carro. Você desvia por\n                instinto e cai numa vala. Ao sair para procurar a pessoa, não\n                encontra ninguém. Mas a lembrança daquele rosto faz seu coração\n                disparar: parecia ser o mesmo velho que lhe indicou o caminho. O carro não liga. Você está sozinho, encharcado e longe de\n                qualquer ajuda. Então, uma luz aparece na janela de uma casa antiga, no alto de\n                uma estrada próxima. Talvez ali você encontre abrigo e um\n                telefone. Você atravessa a chuva em direção ao casarão. Um relâmpago\n                revela suas paredes deterioradas, mas a esperança de conseguir\n                ajuda afasta suas dúvidas. Ao subir os degraus até a porta, você ainda não sabe o que o\n                espera lá dentro. Esta será uma noite inesquecível."}/>
              <p>
                Uma tempestade castiga a estrada deserta. Seguindo as indicações
                de um velho de cabelos brancos, você tomou um caminho errado e
                agora mal consegue enxergar além dos faróis.
              </p>
              <p>
                De repente, uma figura surge diante do carro. Você desvia por
                instinto e cai numa vala. Ao sair para procurar a pessoa, não
                encontra ninguém. Mas a lembrança daquele rosto faz seu coração
                disparar: parecia ser o mesmo velho que lhe indicou o caminho.
              </p>
              <p>
                O carro não liga. Você está sozinho, encharcado e longe de
                qualquer ajuda.
              </p>
              <p>
                Então, uma luz aparece na janela de uma casa antiga, no alto de
                uma estrada próxima. Talvez ali você encontre abrigo e um
                telefone.
              </p>
              <p>
                Você atravessa a chuva em direção ao casarão. Um relâmpago
                revela suas paredes deterioradas, mas a esperança de conseguir
                ajuda afasta suas dúvidas.
              </p>
              <p>
                Ao subir os degraus até a porta, você ainda não sabe o que o
                espera lá dentro.
              </p>
              <p>
                <strong>Esta será uma noite inesquecível.</strong>
              </p>
              <button className="primary" onClick={() => goto(1)}>
                Continuar →
              </button>
            </div>
          ) : (
            <>
              <div className="scene-head">
                <span className="eyebrow">CAPÍTULO INTERATIVO</span>
                <h1>
                  {scene?.title || (
                    <>
                      Cena <span>{s.scene}</span>
                    </>
                  )}
                </h1>
                <small>
                  {s.name} · {s.history.length} cenas visitadas
                </small>
              </div>
              {dead ? (
                <div className="alert">
                  Sua aventura terminou. Recomece para tentar outro caminho.
                </div>
              ) : null}
              <SceneImage key={`image-${s.scene}`} id={s.scene} title={scene?.title} />
              <StoryReader
                key={`reader-${s.scene}`}
                text={scene?.text}
                onReady={setReadReady}
                onSave={saveClue}
              />
              {scene?.reviewStatus === "pending_text_review" && (
                <small className="editor-note">
                  Texto importado: esta cena ainda aguarda revisão editorial.
                </small>
              )}
              {special[s.scene] && !s.combat?.won && !dead && (
                <section className="combat special">
                  <h2>Confronto</h2>
                  <p>
                    {special[s.scene].enemies.map((e) => e.name).join(" · ")}
                  </p>
                  <p>
                    Role as rodadas. Você pode passar sufoco, mas os golpes não
                    encerram sua aventura.
                  </p>
                  {!s.combat?.active && (
                    <button
                      className="primary"
                      onClick={() => beginCombat(false)}
                    >
                      Iniciar combate
                    </button>
                  )}
                </section>
              )}
              <nav
                hidden={!readReady}
                className="choices"
                aria-label="Escolhas"
              >
                <h2>O que você fará?</h2>
                {scene?.choices?.length ? (
                  scene.choices.map((c, i) => (
                    <button
                      key={`${c.to}-${i}`}
                      disabled={dead || (isWinChoice(c) && !s.combat?.won)}
                      onClick={() => goto(c.to)}
                    >
                      <span>{c.text}</span>
                      <b>→ {c.to}</b>
                    </button>
                  ))
                ) : (
                  <p>Esta cena não tem escolhas disponíveis.</p>
                )}
              </nav>
            </>
          )}
        </section>
        <aside className="sidebar">
          {s.scene > 0 && (
            <>
              <section className="panel">
                <span className="eyebrow">FICHA DO PERSONAGEM</span>
                <h2>{s.name}</h2>
                {[
                  ["Habilidade", "skillCur", "skillMax"],
                  ["Resistência", "stamCur", "stamMax"],
                  ["Sorte", "luckCur", "luckMax"],
                  ["Medo", "fearCur", "fearMax"],
                ].map(([label, key, max]) => (
                  <div className="stat" key={key}>
                    <span>
                      {label}{" "}
                      <b>
                        {s[key]} / {s[max]}
                      </b>
                    </span>
                    <div className="meter">
                      <i
                        style={{
                          width: `${s[max] ? (100 * s[key]) / s[max] : 0}%`,
                        }}
                      />
                    </div>
                    <div className="controls">
                      <button
                        onClick={() => adjust(key, -1)}
                        aria-label={`Diminuir ${label}`}
                      >
                        −
                      </button>
                      <button
                        onClick={() => adjust(key, 1)}
                        aria-label={`Aumentar ${label}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <p className="hint">
                  Ajuste os pontos quando o texto da cena pedir.
                </p>
                <div className="tools">
                  <button onClick={() => test("skill")} disabled={dead}>
                    Testar Habilidade
                  </button>
                  <button
                    onClick={() => test("luck")}
                    disabled={dead || s.luckCur <= 0}
                  >
                    Testar Sorte
                  </button>
                </div>
              </section>
              <section className="panel">
                <span className="eyebrow">INVENTÁRIO</span>
                <div className="add-item">
                  <input
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && item.trim()) {
                        mutate((p) => p.inventory.push(item.trim()));
                        setItem("");
                      }
                    }}
                    placeholder="Adicionar item"
                    aria-label="Adicionar item"
                  />
                  <button
                    onClick={() => {
                      if (item.trim()) {
                        mutate((p) => p.inventory.push(item.trim()));
                        setItem("");
                      }
                    }}
                  >
                    +
                  </button>
                </div>
                {s.inventory.length ? (
                  <ul className="inventory">
                    {s.inventory.map((v, i) => (
                      <li key={i}>
                        {v}
                        <button
                          aria-label={`Remover ${v}`}
                          onClick={() =>
                            mutate((p) => p.inventory.splice(i, 1))
                          }
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="hint">Nenhum item anotado.</p>
                )}
              </section>
              <section className="panel">
                <span className="eyebrow">COMBATE</span>
                <CombatVisual state={s} rolling={rolling} />
                {s.combat?.won && (
                  <p className="combat-victory" role="status">
                    Vitória! Você sobreviveu ao confronto.
                  </p>
                )}
                {s.combat?.active ? (
                  <>
                    <h2>{s.combat.enemies[s.combat.index].name}</h2>
                    <p>
                      Habilidade {s.combat.enemies[s.combat.index].skill} ·
                      Resistência {s.combat.remaining}
                    </p>
                    <div className="tools">
                      <button
                        className="primary"
                        onClick={attack}
                        disabled={dead || rolling}
                      >
                        {rolling ? "Rolando…" : "Próxima rodada"}
                      </button>
                      <button
                        onClick={combatLuck}
                        disabled={
                          rolling || !s.combat.lastHit || s.luckCur <= 0 || dead
                        }
                      >
                        Testar Sorte no golpe
                      </button>
                      <button
                        onClick={flee}
                        disabled={rolling || dead || !special[s.scene]?.flee}
                      >
                        Fugir (−2)
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="hint">
                      Você sempre supera os adversários. Os golpes podem reduzir
                      sua Resistência até 1. Informe os atributos descritos na
                      cena.
                    </p>
                    <input
                      value={enemy.name}
                      onChange={(e) =>
                        setEnemy({ ...enemy, name: e.target.value })
                      }
                      placeholder="Nome do inimigo"
                      aria-label="Nome do inimigo"
                    />
                    <div className="enemy-stats">
                      <label>
                        Habilidade
                        <input
                          type="number"
                          min="1"
                          value={enemy.skill}
                          onChange={(e) =>
                            setEnemy({ ...enemy, skill: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Resistência
                        <input
                          type="number"
                          min="1"
                          value={enemy.stam}
                          onChange={(e) =>
                            setEnemy({ ...enemy, stam: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    {!s.combat?.won && (
                      <button
                        onClick={() => beginCombat(!special[s.scene])}
                        disabled={dead}
                      >
                        {special[s.scene]
                          ? "Iniciar combate da cena"
                          : "Iniciar combate manual"}
                      </button>
                    )}
                  </>
                )}
              </section>
              <AdventureJournal
                clues={s.clues || []}
                entries={[...new Set(s.history)]
                  .filter((id) => id > 0 && scenes[String(id)])
                  .map((id) => ({ id, ...scenes[String(id)] }))}
              />
              <section className="panel journal">
                <span className="eyebrow">DIÁRIO</span>
                <ol>
                  {s.log
                    .slice(-8)
                    .reverse()
                    .map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                </ol>
              </section>
            </>
          )}
        </aside>
      </main>
      {message && (
        <div className="toast" role="status" onClick={() => setMessage("")}>
          {message} <span>×</span>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
