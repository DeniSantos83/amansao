import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';

// Identifica imagens numeradas sem duplicá-las no build.
export default defineConfig(() => {
 const files = readdirSync(new URL('./public/assets/', import.meta.url)).sort();
 const images = {};
 for (const filename of files) {
  const match = filename.match(/^(\d+)\.(png|jpe?g|webp|avif)$/i);
  if (match && !images[Number(match[1])]) images[Number(match[1])] = filename;
 }
 // Compatibilidade com o arquivo enviado: os cães pertencem à cena 14.
 if (images[13] === '13.png' && !images[14]) {
  images[14] = images[13];
  delete images[13];
 }
 return { base: '/amansao/', define: { __SCENE_IMAGES__: JSON.stringify(images) } };
});
