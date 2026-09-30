// Adaptação narrativa: os golpes nunca matam e todo confronto tem fim.
export const dice = () => 1 + Math.floor(Math.random() * 6);
export function hurt(state, amount) {
  const before = state.stamCur;
  state.stamCur = Math.max(1, before - amount);
  return before - state.stamCur;
}
export function settle(c) {
  if (c.remaining > 0) return;
  c.lastHit = null;
  if (c.index + 1 < c.enemies.length) {
    c.index++;
    c.remaining = c.enemies[c.index].stam;
    c.rounds = 0;
  } else {
    c.active = false;
    c.won = true;
  }
}
export function round(state, roll = dice) {
  const c = state.combat;
  if (!c?.active) return "";
  const e = c.enemies[c.index];
  c.rounds = (c.rounds || 0) + 1;
  const youDice = [roll(), roll()],
    foeDice = [roll(), roll()];
  const you = youDice[0] + youDice[1] + state.skillCur;
  const foe = foeDice[0] + foeDice[1] + e.skill;
  c.lastHit = null;
  let message;
  if (c.rounds >= 12) {
    c.remaining = 0;
    message = "Você encontra uma abertura decisiva e supera o adversário!";
  } else if (you > foe) {
    c.remaining = Math.max(0, c.remaining - 2);
    c.lastHit = "player";
    message = `Ataque ${you} × ${foe}: você causou 2 de dano.`;
  } else if (foe > you) {
    c.damageTaken = hurt(state, 2);
    c.lastHit = "enemy";
    message = `Ataque ${you} × ${foe}: perdeu ${c.damageTaken} de Resistência.${state.stamCur === 1 ? " Você resiste por um fio!" : ""}`;
  } else message = `Ataque ${you} × ${foe}: empate.`;
  // Estes encontros terminam no primeiro ferimento, conforme o texto.
  if (c.firstWound && c.lastHit === "player") c.remaining = 0;
  c.lastRoll = { youDice, foeDice, you, foe, message };
  settle(c);
  return message;
}
export function luck(state, roll = dice) {
  const c = state.combat;
  if (!c?.active || !c.lastHit || state.luckCur <= 0) return "";
  const target = state.luckCur,
    value = roll() + roll(),
    ok = value <= target;
  state.luckCur--;
  if (c.lastHit === "player")
    c.remaining = ok
      ? Math.max(0, c.remaining - 2)
      : Math.min(c.enemies[c.index].stam, c.remaining + 1);
  else if (ok)
    state.stamCur = Math.min(
      state.stamMax,
      state.stamCur + Math.max(0, (c.damageTaken || 0) - 1),
    );
  else hurt(state, 1);
  c.lastHit = null;
  settle(c);
  return `Sorte no combate: ${value} × ${target} — ${ok ? "sucesso" : "falha"}.`;
}
