// Firebase ID token validation, best-effort per-user daily KV quota, Gemini proxy.
const respond=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json; charset=utf-8",...headers}});
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(s.length/4)*4,"=")),c=>c.charCodeAt(0));
async function verify(token,project){
 const parts=token.split(".");if(parts.length!==3)throw Error("token");
 const head=JSON.parse(new TextDecoder().decode(decode(parts[0]))),p=JSON.parse(new TextDecoder().decode(decode(parts[1])));
 const now=Date.now()/1000;
 if(head.alg!=="RS256"||!head.kid||p.aud!==project||p.iss!=="https://securetoken.google.com/"+project||typeof p.sub!=="string"||!p.sub||p.sub.length>128||!Number.isFinite(p.exp)||p.exp<=now||!Number.isFinite(p.iat)||p.iat>now||!Number.isFinite(p.auth_time)||p.auth_time>now)throw Error("claims");
 const r=await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");if(!r.ok)throw Error("keys");
 const key=(await r.json()).keys.find(k=>k.kid===head.kid);if(!key)throw Error("kid");
 const cryptoKey=await crypto.subtle.importKey("jwk",key,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
 if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",cryptoKey,decode(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1])))throw Error("signature");
 return p.sub;
}
export default {async fetch(req,env){
 const origin=req.headers.get("Origin");
 if(!env.ALLOWED_ORIGIN||origin!==env.ALLOWED_ORIGIN)return respond({error:"Origin not allowed"},403);
 const cors={"Access-Control-Allow-Origin":env.ALLOWED_ORIGIN,"Vary":"Origin","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS"};
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(new URL(req.url).pathname!=="/ask"||req.method!=="POST")return respond({error:"Not found"},404,cors);
 if(!env.GEMINI_API_KEY||!env.FIREBASE_PROJECT_ID||!env.GEMINI_MODEL||!env.QUOTA)return respond({error:"Not configured"},503,cors);
 try{
  const token=(req.headers.get("Authorization")||"").match(/^Bearer (.+)$/)?.[1];
  if(!token)return respond({error:"Login required"},401,cors);
  const uid=await verify(token,env.FIREBASE_PROJECT_ID);
  const body=await req.text();if(body.length>2000)return respond({error:"Too large"},413,cors);
  let question;try{question=JSON.parse(body).question}catch{return respond({error:"Invalid JSON"},400,cors)}
  if(typeof question!=="string"||question.trim().length<1||question.length>500)return respond({error:"Question must be 1-500 characters"},400,cors);
  const quotaKey=new Date().toISOString().slice(0,10)+":"+uid;
  const count=Number(await env.QUOTA.get(quotaKey)||0);
  if(count>=5)return respond({error:"오늘의 AI 질문 5회를 모두 사용했어요."},429,cors);
  // KV is eventually consistent; not a strict atomic rate limiter.
  await env.QUOTA.put(quotaKey,String(count+1),{expirationTtl:172800});
  const url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(env.GEMINI_MODEL)+":generateContent";
  const upstream=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:"초등학생에게 쉬운 한국어로 답하세요. 개인정보를 요구하지 말고 간결하게 설명하세요."}]},contents:[{parts:[{text:question}]}],generationConfig:{maxOutputTokens:350}})});
  if(!upstream.ok)return respond({error:"AI 서비스를 지금 사용할 수 없어요."},503,cors);
  const data=await upstream.json(),answer=data.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
  if(!answer)return respond({error:"답변을 받지 못했어요."},503,cors);
  return respond({answer},200,cors);
 }catch{return respond({error:"인증 또는 요청 처리에 실패했어요."},401,cors)}
}};
