const enemy = (name, skill, stam) => ({ name, skill, stam });
export const encounters = {
  9: { enemies: [enemy('Primeiro Espírito do Fogo',7,4),enemy('Segundo Espírito do Fogo',7,3)], win:375, flee:218, fire:true },
  14: { enemies:[enemy('DOGUE ALEMÃO',7,5)] },
  17: { enemies:[enemy('SERVO DO MESTRE',8,9)] },
  30: { enemies:[enemy('CONDE DE DRUMER',9,10)], krisBonus:3 },
  41: { enemies:[enemy('Primeiro ESQUELETO',6,6),enemy('Segundo ESQUELETO',7,6)] },
  43: { enemies:[enemy('Primeiro ESQUELETO',6,6),enemy('Segundo ESQUELETO',7,6)] },
  56: { enemies:[enemy('CORCUNDA',7,7)], group:'hunchback', roundLimit:3 },
  78: { enemies:[enemy('Segundo DOGUE ALEMÃO',6,6),enemy('Terceiro DOGUE ALEMÃO',6,5)] },
  87: { enemies:[enemy('ADORADOR DO DIABO',8,7)] },
  109: { enemies:[enemy('DEMÔNIO INFERNAL',14,12)], skillBonus:6 },
  126: { enemies:[enemy('CARNIÇAL',8,7)], group:'ghoul', warnAfterHits:2, warning:186 },
  127: { enemies:[enemy('HOMEM DE BRANCO',7,9)], spare:359, spareAt:2, endAt:2 },
  142: { enemies:[enemy('INIMIGO INVISÍVEL',10,4)] },
  143: { enemies:[enemy('LÍDER',8,9)] },
  154: { enemies:[enemy('HOMEM DE CABELOS BRANCOS',7,9)], group:'whitehair', firstWound:true },
  164: { enemies:[enemy('CORCUNDA',7,7)], group:'hunchback', openingDamage:2 },
  170: { enemies:[enemy('Primeiro DOGUE ALEMÃO',7,6),enemy('Segundo DOGUE ALEMÃO',6,6)] },
  189: { enemies:[enemy('Primeiro ZUMBI',7,6),enemy('Segundo ZUMBI',6,6)] },
  191: { enemies:[enemy('CORRUGA',7,7)], firstWound:true },
  215: { enemies:[enemy('Primeiro HOMEM',7,8),enemy('Segundo HOMEM',8,9)], flee:160, fleeAfter:4 },
  236: { enemies:[enemy('ZUMBI',7,6)] },
  271: { enemies:[enemy('HOMEM DE CABELOS BRANCOS',7,9)], group:'whitehair' },
  302: { enemies:[enemy('CORCUNDA',7,7)] },
  336: { enemies:[enemy('FRANKLINS',8,8)], firstWound:true, krisBonus:3 },
  343: { enemies:[enemy('MORCEGOS',4,4)] },
  399: { enemies:[enemy('CORCUNDA',7,7)], endAt:4 },
};
export function choiceLocked(state, choice) {
  const config = encounters[state.scene];
  if (!config) return false;
  const c = state.combat;
  if (choice.to === config.flee) return !c?.active || (c.totalRounds || 0) < (config.fleeAfter || 0);
  if (choice.to === config.spare) return !c || c.remaining > config.spareAt;
  if (choice.to === config.warning) return !c?.paused;
  return !c?.won;
}
export function rememberCombat(state, nextScene) {
  const c = state.combat;
  const group = encounters[state.scene]?.group;
  if (c && group) {
    state.combatMemory ||= {};
    state.combatMemory[group] = structuredClone(c);
  }
  if (state.scene === 186 && nextScene === 126 && state.combatMemory?.ghoul)
    state.combatMemory.ghoul.warned = true;
}
export function createCombat(state) {
  const config = encounters[state.scene];
  const previous = config.group && state.combatMemory?.[config.group];
  const c = previous ? structuredClone(previous) : {
    enemies:structuredClone(config.enemies), index:0, remaining:config.enemies[0].stam,
    rounds:0,totalRounds:0,hitsTaken:0,
  };
  if (!previous && state.scene === 56 && state.history?.at(-2) === 183) c.remaining -= 2;
  if (config.openingDamage) c.remaining = Math.max(0,c.remaining-config.openingDamage);
  if (!previous && state.scene === 78 && state.history?.at(-2) === 31) { c.attackPenalty = 2; c.penaltyUntil = 4; }
  const kris = state.inventory?.some((item) => /kris/i.test(item));
  Object.assign(c, {active:c.remaining>0,won:c.remaining<=0,paused:false,lastHit:null,lastRoll:null,
    firstWound:!!config.firstWound,roundLimit:config.roundLimit,endAt:config.endAt,
    warnAfterHits:config.warnAfterHits,fire:!!config.fire,
    skillBonus:config.skillBonus || (kris ? config.krisBonus || 0 : 0)});
  return c;
}
