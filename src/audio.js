// Sons sintetizados localmente, sem arquivos extras ou serviços externos.
let context;
const settings=()=>{try{return JSON.parse(localStorage.getItem('casarao_audio'))||{}}catch{return {}}};
export function audioSettings(){return {enabled:false,volume:.25,...settings()}}
export async function enableEffects(enabled,volume){localStorage.setItem('casarao_audio',JSON.stringify({enabled,volume}));if(enabled){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;context=context||new AC();await context.resume();}return true}
export function playEffect(kind='step'){
 const pref=audioSettings();if(!pref.enabled||!context||context.state!=='running')return;
 const now=context.currentTime;
 function tone(freq,duration,delay=0,type='sine',end=freq){const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(freq,now+delay);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+delay+duration);g.gain.setValueAtTime(0,now+delay);g.gain.linearRampToValueAtTime(pref.volume*.15,now+delay+.02);g.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);o.connect(g);g.connect(context.destination);o.start(now+delay);o.stop(now+delay+duration+.03)}
 function noise(duration,filter=500){const n=context.createBuffer(1,context.sampleRate*duration,context.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const source=context.createBufferSource(),f=context.createBiquadFilter(),g=context.createGain();source.buffer=n;f.type='lowpass';f.frequency.value=filter;g.gain.setValueAtTime(pref.volume*.22,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(f);f.connect(g);g.connect(context.destination);source.start();}
 if(kind==='thunder')noise(1.4,250);
 else if(kind==='door')tone(220,.7,0,'triangle',65);
 else if(kind==='bell'){tone(660,.8);tone(990,.7,.06)}
 else if(kind==='whisper')noise(.8,1400);
 else if(kind==='hit'){noise(.16,800);tone(90,.18,0,'sine',35)}
 else if(kind==='victory'){tone(262,.22);tone(330,.22,.18);tone(392,.5,.36)}
 else if(kind==='dice'){noise(.09,1800);tone(320,.12,.1,'triangle',180)}
 else {tone(75,.13);tone(65,.13,.22)}
}
export function sceneSound(text){if(/relâmpago|trovão|tempestade/i.test(text))return 'thunder';if(/campainha|sino/i.test(text))return 'bell';if(/sussurr|fantasma|espectral/i.test(text))return 'whisper';if(/porta|rang/i.test(text))return 'door';if(/passos|caminh|escada/i.test(text))return 'step';return null}
