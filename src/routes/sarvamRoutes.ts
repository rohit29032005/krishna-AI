import {Router} from 'express';
import {createHash} from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {apiLimiter} from '../middleware/rateLimiter';
const router=Router();
const cache=new Map<string,{audio:string;time:number}>();
let busy=false;
const ledgerPath=path.join(os.tmpdir(),`krishna-tts-${createHash('sha256').update(process.cwd()).digest('hex').slice(0,12)}.json`);
router.post('/synthesize',apiLimiter,async(req,res) => {
  res.setHeader('Cache-Control','no-store');
  const fail=(status:number,code:string) => res.status(status).json({success:false,code});
  // Explicit opt-in for the owner-authorized guest trial; this is not authentication.
  if(process.env.NODE_ENV==='production' && process.env.ALLOW_GUEST_TTS!=='true') {fail(503,'TTS_PROTOTYPE_ONLY');return;}
  const {text,language}=req.body || {};
  if(typeof text!=='string'||!text.trim()||text.length>2500||!['hi','en'].includes(language)){fail(400,'TTS_INVALID_INPUT');return;}
  const apiKey=process.env.SARVAM_API_KEY?.trim();
  if(!apiKey){fail(503,'TTS_NOT_CONFIGURED');return;}
  const speaker=process.env.SARVAM_SPEAKER?.trim() || 'shubh';
  const model='bulbul:v3';
  const key=createHash('sha256').update(JSON.stringify([text,language,speaker,model])).digest('hex');
  const hit=cache.get(key);
  if(hit && Date.now()-hit.time<300000){res.json({success:true,audio:hit.audio,cached:true});return;}
  if(busy){fail(429,'TTS_BUSY');return;}
  busy=true;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25000);
  const close=()=>{if(!res.writableEnded)controller.abort();};res.on('close',close);
  try {
    const cap=Number(process.env.SARVAM_CHARACTER_CAP || 30000);
    if(!Number.isSafeInteger(cap)||cap<1||cap>1000000)throw Error('invalid cap');
    const ledger=fs.existsSync(ledgerPath)?JSON.parse(fs.readFileSync(ledgerPath,'utf8')):{characters:0};
    if(!Number.isSafeInteger(ledger.characters)||ledger.characters<0)throw Error('invalid ledger');
    if(ledger.characters+text.length>cap){fail(429,'TTS_LOCAL_BUDGET');return;}
    // Reserve before sending, including failed/aborted requests to avoid optimistic accounting.
    fs.writeFileSync(ledgerPath,JSON.stringify({characters:ledger.characters+text.length}));
    const response=await fetch('https://api.sarvam.ai/text-to-speech',{
      method:'POST',headers:{'Content-Type':'application/json','api-subscription-key':apiKey},signal:controller.signal,
      body:JSON.stringify({text,language_code:language==='hi'?'hi-IN':'en-IN',model,speaker,pace:0.9,speech_sample_rate:24000,output_audio_codec:'wav'}),
    });
    if(!response.ok){fail(response.status===402||response.status===429?429:502,response.status===402?'TTS_CREDITS_EXHAUSTED':response.status===429?'TTS_RATE_LIMIT':response.status===401||response.status===403?'TTS_AUTH_ERROR':'TTS_PROVIDER_ERROR');return;}
    const result=await response.json() as {audios?:unknown[]};
    const audio=result.audios?.[0];
    if(result.audios?.length!==1||typeof audio!=='string'||audio.length>12000000||! /^[A-Za-z0-9+/]+={0,2}$/.test(audio))throw Error('invalid audio');
    const bytes=Buffer.from(audio,'base64');
    if(bytes.length<44||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error('invalid WAV');
    if(cache.size>=8)cache.delete(cache.keys().next().value!);
    cache.set(key,{audio,time:Date.now()});
    if(!res.destroyed)res.json({success:true,audio,cached:false});
  } catch {if(!res.destroyed)fail(503,controller.signal.aborted?'TTS_TIMEOUT':'TTS_UNAVAILABLE');}
  finally {busy=false;clearTimeout(timer);res.off('close',close);}
});
export default router;
