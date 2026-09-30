// Reúne quebras da importação e divide sem cortar palavras ou frases.
export function readingBlocks(text, limit = 620) {
 const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
 if (!cleaned) return ['Cena não encontrada.'];
 const sentences = cleaned.split(/(?<=[.!?])\s+/);
 const blocks = []; let current = '';
 for (const sentence of sentences) {
  const value = sentence.trim();
  if (current && current.length + value.length > limit) { blocks.push(current); current = ''; }
  current += (current ? ' ' : '') + value;
 }
 if (current) blocks.push(current);
 return blocks;
}
export function foundClues(scene) {
 // Guarda somente trechos do texto, sem inventar ou revelar outras cenas.
 return readingBlocks(scene?.text).filter(block => /(?:bilhete|inscri[çc][ãa]o|mensagem|est[áa] escrito|palavras escritas|find shekou)/i.test(block));
}
