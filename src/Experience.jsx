import AudioControls from "./AudioControls.jsx";
import React, { useState } from "react";
import { readingBlocks } from "./reading.js";
export function RichText({ text }) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}
export function StoryReader({ text, onReady, onSave }) {
  const blocks = readingBlocks(text);
  const [index, setIndex] = useState(0),
    [full, setFull] = useState(false);
  const ready = full || index === blocks.length - 1;
  function choose(next, complete = full) {
    setIndex(next);
    onReady(complete || next === blocks.length - 1);
  }
  return (
    <section className="reader">
      <AudioControls text={full?blocks.join(" "):blocks[index]}/>
      <div className="reader-toolbar">
        <small>
          Trecho {index + 1} de {blocks.length}
        </small>
        <button
          onClick={() => {
            setFull(!full);
            onReady(!full || index === blocks.length - 1);
          }}
        >
          {full ? "Ler em blocos" : "Ver texto completo"}
        </button>
      </div>
      <article className="scene-text" aria-live="polite">
        {full ? (
          blocks.map((b, i) => (
            <p key={i}>
              <RichText text={b} />
            </p>
          ))
        ) : (
          <RichText text={blocks[index]} />
        )}
      </article>
      <div className="reader-actions">
        {!full && index > 0 && (
          <button onClick={() => choose(index - 1)}>← Anterior</button>
        )}
        {!full && !ready && (
          <button className="primary" onClick={() => choose(index + 1)}>
            Continuar →
          </button>
        )}
        <button onClick={() => onSave(blocks[index])}>
          Guardar trecho no diário
        </button>
      </div>
    </section>
  );
}
export function CombatVisual({ state, rolling }) {
  const c = state.combat;
  if (!c) return null;
  const enemy = c.enemies[c.index],
    r = c.lastRoll;
  return (
    <div className="combat-visual">
      <div
        className={"dice-pair" + (rolling ? " rolling" : "")}
        aria-label={rolling ? "Rolando dados" : "Resultado dos dados"}
      >
        {["Você", "Adversário"].map((label, i) => (
          <div key={label}>
            <small>{label}</small>
            <strong>
              {r
                ? (i ? r.foeDice : r.youDice)
                    .map((d) => "⚀⚁⚂⚃⚄⚅"[d - 1])
                    .join(" ")
                : "⚄ ⚂"}
            </strong>
            <span>
              {r ? `${i ? r.foe : r.you} de ataque` : "2d6 + Habilidade"}
            </span>
          </div>
        ))}
      </div>
      <label>
        {enemy.name} · {c.remaining} / {enemy.stam}
        <progress max={enemy.stam} value={c.remaining} />
      </label>
      <label>
        Sua Resistência · {state.stamCur} / {state.stamMax}
        <progress max={state.stamMax} value={state.stamCur} />
      </label>
      {r && <p role="status">{r.message}</p>}
    </div>
  );
}
export function AdventureJournal({ entries, clues }) {
  return (
    <section className="panel adventure-journal">
      <span className="eyebrow">PISTAS E DESCOBERTAS</span>
      <h2>Seu diário</h2>
      {clues.length ? (
        clues.map((c, i) => (
          <details key={i}>
            <summary>
              Cena {c.scene} ·{" "}
              {c.kind === "auto" ? "Possível pista" : "Trecho guardado"}
            </summary>
            <p>
              <RichText text={c.text} />
            </p>
          </details>
        ))
      ) : (
        <p className="hint">
          Guarde trechos durante a leitura. Mensagens e inscrições reconhecidas
          também ficam registradas.
        </p>
      )}
      <details>
        <summary>Cenas visitadas ({entries.length})</summary>
        {entries.map((e) => (
          <details key={e.id}>
            <summary>{e.title || `Cena ${e.id}`}</summary>
            <p>
              <RichText text={e.text} />
            </p>
          </details>
        ))}
      </details>
    </section>
  );
}
