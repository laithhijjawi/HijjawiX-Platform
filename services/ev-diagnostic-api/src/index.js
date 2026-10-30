const te = new TextEncoder();

function corsHeaders(extra={}) {
  return {
    "access-control-allow-origin":"*",
    "access-control-allow-headers":"content-type,authorization,x-setup-key,x-device-id",
    "access-control-allow-methods":"GET,POST,OPTIONS",
    "access-control-max-age":"86400",
    ...extra
  };
}
function json(data, status=200, extra={}) {
  const noBody = status === 204 || status === 205 || status === 304;
  return new Response(noBody ? null : JSON.stringify(data), {
    status,
    headers: {
      ...(noBody ? {} : {"content-type":"application/json; charset=utf-8"}),
      "cache-control":"no-store",
      ...corsHeaders(extra)
    }
  });
}
async function body(req){ try{return await req.json();}catch{return {};} }
function bearer(req){
  const h=req.headers.get("authorization")||"";
  return h.startsWith("Bearer ")?h.slice(7).trim():"";
}
async function callRegistry(env,path,payload={},method="POST"){
  const id=env.REGISTRY.idFromName("global");
  return env.REGISTRY.get(id).fetch("https://registry.internal"+path,{
    method,headers:{"content-type":"application/json"},body:method==="GET"?undefined:JSON.stringify(payload)
  });
}
async function registryJson(env,path,payload={},method="POST"){
  const r=await callRegistry(env,path,payload,method);
  const j=await r.json().catch(()=>({}));
  return {ok:r.ok,status:r.status,data:j};
}
async function requireUser(req,env,roles=[]){
  const token=bearer(req);
  if(!token)return {error:json({error:"Unauthorized"},401)};
  const a=await registryJson(env,"/session/user",{token});
  if(!a.ok)return {error:json({error:"Unauthorized"},401)};
  if(roles.length&&!roles.includes(a.data.account.role))return {error:json({error:"Forbidden"},403)};
  return {account:a.data.account,token};
}
async function requireDevice(req,env){
  const token=bearer(req),deviceId=req.headers.get("x-device-id")||"";
  if(!token||!deviceId)return {error:json({error:"Device authentication required"},401)};
  const a=await registryJson(env,"/session/device",{token,deviceId});
  if(!a.ok)return {error:json({error:"Device authentication failed"},401)};
  return {device:a.data.device};
}

export default {
  async fetch(req,env){
    if(req.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders()});
    const u=new URL(req.url), p=u.pathname;
    if(p==="/api/ev/health")return json({ok:true,service:"hijjawi-x-ev-api",version:"1.0.0"});

    if(p==="/api/ev/setup/owner"&&req.method==="POST"){
      if((req.headers.get("x-setup-key")||"")!==env.OWNER_SETUP_KEY)return json({error:"Invalid setup key"},403);
      const r=await registryJson(env,"/setup-owner",await body(req));
      return json(r.data,r.status);
    }

    if(p==="/api/ev/auth/login"&&req.method==="POST"){
      const r=await registryJson(env,"/login",await body(req));
      return json(r.data,r.status);
    }

    if(p==="/api/ev/device/bootstrap"&&req.method==="POST"){
      const b=await body(req);
      if(!env.DEVICE_ENROLLMENT_CODE||b.claimCode!==env.DEVICE_ENROLLMENT_CODE)return json({error:"Invalid enrollment code"},403);
      const r=await registryJson(env,"/device/bootstrap",b);
      return json(r.data,r.status);
    }

    if(p==="/api/ev/device/heartbeat"&&req.method==="POST"){
      const auth=await requireDevice(req,env); if(auth.error)return auth.error;
      const b=await body(req);
      const r=await registryJson(env,"/device/heartbeat",{deviceId:auth.device.id,firmware:b.firmware||"",ipHint:b.ipHint||"",rssi:b.rssi??null,framesPerSecond:b.framesPerSecond??0,freeHeap:b.freeHeap??0});
      return json(r.data,r.status);
    }

    if(p==="/api/ev/device/telemetry"&&req.method==="POST"){
      const auth=await requireDevice(req,env); if(auth.error)return auth.error;
      if(auth.device.status!=="active")return json({error:"Device is not approved",status:auth.device.status},403);
      const payload=await body(req);
      const id=env.DEVICE_HUBS.idFromName(auth.device.id);
      await env.DEVICE_HUBS.get(id).fetch("https://hub.internal/telemetry",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({deviceId:auth.device.id,serial:auth.device.serial,profile:auth.device.profileId||"tesla.model3y.battery.v1",receivedAt:Date.now(),data:payload})});
      await registryJson(env,"/device/touch",{deviceId:auth.device.id});
      return json({ok:true});
    }

    if(p==="/api/ev/me"&&req.method==="GET"){
      const auth=await requireUser(req,env); if(auth.error)return auth.error;
      const r=await registryJson(env,"/me",{accountId:auth.account.id});
      return json(r.data,r.status);
    }

    if(p==="/api/ev/live/latest"&&req.method==="GET"){
      const auth=await requireUser(req,env); if(auth.error)return auth.error;
      const deviceId=u.searchParams.get("deviceId")||"";
      const access=await registryJson(env,"/access",{accountId:auth.account.id,deviceId});
      if(!access.ok)return json(access.data,access.status);
      const id=env.DEVICE_HUBS.idFromName(deviceId);
      const r=await env.DEVICE_HUBS.get(id).fetch("https://hub.internal/latest");
      return new Response(r.body,{status:r.status,headers:{...Object.fromEntries(r.headers),"access-control-allow-origin":"*","cache-control":"no-store"}});
    }

    if(p==="/api/ev/feedback"&&req.method==="POST"){
      const auth=await requireUser(req,env); if(auth.error)return auth.error;
      const r=await registryJson(env,"/feedback/create",{accountId:auth.account.id,...await body(req)});
      return json(r.data,r.status);
    }

    if(p==="/api/ev/owner/devices"&&req.method==="GET"){
      const auth=await requireUser(req,env,["OWNER"]); if(auth.error)return auth.error;
      const r=await registryJson(env,"/owner/devices",{});
      return json(r.data,r.status);
    }

    const approve=p.match(/^\/api\/ev\/owner\/devices\/([^/]+)\/approve$/);
    if(approve&&req.method==="POST"){
      const auth=await requireUser(req,env,["OWNER"]); if(auth.error)return auth.error;
      const r=await registryJson(env,"/owner/device/approve",{deviceId:decodeURIComponent(approve[1]),actorId:auth.account.id,...await body(req)});
      return json(r.data,r.status);
    }
    const suspend=p.match(/^\/api\/ev\/owner\/devices\/([^/]+)\/suspend$/);
    if(suspend&&req.method==="POST"){
      const auth=await requireUser(req,env,["OWNER"]); if(auth.error)return auth.error;
      const r=await registryJson(env,"/owner/device/suspend",{deviceId:decodeURIComponent(suspend[1]),actorId:auth.account.id});
      return json(r.data,r.status);
    }

    if(p==="/api/ev/owner/accounts"&&req.method==="GET"){
      const auth=await requireUser(req,env,["OWNER"]); if(auth.error)return auth.error;
      const r=await registryJson(env,"/owner/accounts",{});
      return json(r.data,r.status);
    }
    if(p==="/api/ev/owner/accounts"&&req.method==="POST"){
      const auth=await requireUser(req,env,["OWNER"]); if(auth.error)return auth.error;
      const r=await registryJson(env,"/owner/account/create",{actorId:auth.account.id,...await body(req)});
      return json(r.data,r.status);
    }
    if(p==="/api/ev/owner/feedback"&&req.method==="GET"){
      const auth=await requireUser(req,env,["OWNER"]); if(auth.error)return auth.error;
      const r=await registryJson(env,"/owner/feedback",{});
      return json(r.data,r.status);
    }

    return json({error:"Not found"},404);
  }
};

function b64(bytes){let s="";for(const x of bytes)s+=String.fromCharCode(x);return btoa(s);}
function unb64(s){const x=atob(s);return Uint8Array.from(x,c=>c.charCodeAt(0));}
function randomToken(bytes=32){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return b64(a).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");}
async function sha256(s){const d=await crypto.subtle.digest("SHA-256",te.encode(s));return Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,"0")).join("");}
async function passwordHash(password,saltB64,iterations=180000){
  const base=await crypto.subtle.importKey("raw",te.encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:unb64(saltB64),iterations,hash:"SHA-256"},base,256);
  return b64(new Uint8Array(bits));
}
async function makePassword(password){
  const salt=new Uint8Array(16);crypto.getRandomValues(salt);
  const saltB64=b64(salt),iterations=180000;
  return {salt:saltB64,iterations,hash:await passwordHash(password,saltB64,iterations)};
}
async function verifyPassword(password,rec){return (await passwordHash(password,rec.passwordSalt,rec.passwordIterations))===rec.passwordHash;}

export class Registry {
  constructor(ctx,env){this.ctx=ctx;this.env=env;}
  out(x,s=200){return json(x,s);}
  async getAccount(id){return id?await this.ctx.storage.get("account:"+id):null;}
  async getDevice(id){return id?await this.ctx.storage.get("device:"+id):null;}
  async listPrefix(prefix){const m=await this.ctx.storage.list({prefix});return [...m.values()];}
  async audit(action,detail={}){const id=crypto.randomUUID();await this.ctx.storage.put("audit:"+Date.now()+":"+id,{id,action,detail,createdAt:Date.now()});}
  async tokenHash(token){return sha256(token+"|"+(this.env.SESSION_PEPPER||"dev"));}

  async fetch(req){
    const p=new URL(req.url).pathname,b=await body(req),now=Date.now();

    if(p==="/setup-owner"){
      const existing=await this.listPrefix("account:");
      if(existing.some(x=>x.role==="OWNER"))return this.out({error:"Owner already exists"},409);
      if(!b.email||!b.password||String(b.password).length<10)return this.out({error:"Email and password (10+ chars) required"},400);
      const pw=await makePassword(String(b.password));
      const id=crypto.randomUUID();
      const a={id,email:String(b.email).trim().toLowerCase(),displayName:b.displayName||"Platform Owner",role:"OWNER",locale:b.locale==="en"?"en":"ar",status:"active",passwordSalt:pw.salt,passwordHash:pw.hash,passwordIterations:pw.iterations,createdAt:now,updatedAt:now};
      await this.ctx.storage.put("account:"+id,a);await this.ctx.storage.put("email:"+a.email,id);await this.audit("owner.created",{accountId:id});
      return this.out({ok:true,account:{...a,passwordHash:undefined,passwordSalt:undefined}});
    }

    if(p==="/login"){
      const email=String(b.email||"").trim().toLowerCase(),password=String(b.password||"");
      const id=await this.ctx.storage.get("email:"+email),a=await this.getAccount(id);
      if(!a||a.status!=="active"||!await verifyPassword(password,a))return this.out({error:"Invalid email or password"},401);
      const token=randomToken(32),hash=await this.tokenHash(token),exp=now+12*60*60*1000;
      await this.ctx.storage.put("usession:"+hash,{accountId:a.id,exp});
      const me=await this.me(a.id);
      return this.out({token,...me});
    }

    if(p==="/session/user"){
      const hash=await this.tokenHash(String(b.token||"")),s=await this.ctx.storage.get("usession:"+hash);
      if(!s||s.exp<now)return this.out({error:"Unauthorized"},401);
      const a=await this.getAccount(s.accountId);
      if(!a||a.status!=="active")return this.out({error:"Unauthorized"},401);
      return this.out({account:this.safeAccount(a)});
    }

    if(p==="/device/bootstrap"){
      const deviceId=String(b.deviceId||"").trim();
      if(!/^HXD-[A-F0-9]{6,16}$/i.test(deviceId))return this.out({error:"Invalid device id"},400);
      let d=await this.getDevice(deviceId);
      if(d&&d.status==="active")return this.out({error:"Already enrolled. Use stored device token."},409);
      const token=randomToken(32),hash=await this.tokenHash(token),exp=now+365*24*60*60*1000;
      if(!d)d={id:deviceId,serial:deviceId,hardwareFamily:b.hardwareFamily||"T-CAN485",hardwareRevision:b.hardwareRevision||"dev",status:"pending",profileId:"tesla.model3y.battery.v1",assignedAccountId:null,assignedGarageId:null,createdAt:now};
      d.firmwareVersion=b.firmware||"";d.lastSeenAt=now;d.updatedAt=now;
      await this.ctx.storage.put("device:"+deviceId,d);
      await this.ctx.storage.put("dsession:"+hash,{deviceId,exp});
      await this.audit("device.bootstrap",{deviceId,firmware:d.firmwareVersion});
      return this.out({ok:true,status:d.status,deviceId,deviceToken:token,profileId:d.profileId});
    }

    if(p==="/session/device"){
      const hash=await this.tokenHash(String(b.token||"")),s=await this.ctx.storage.get("dsession:"+hash);
      if(!s||s.exp<now||s.deviceId!==b.deviceId)return this.out({error:"Unauthorized"},401);
      const d=await this.getDevice(s.deviceId);if(!d||["revoked","retired"].includes(d.status))return this.out({error:"Unauthorized"},401);
      return this.out({device:d});
    }

    if(p==="/device/heartbeat"){
      const d=await this.getDevice(b.deviceId);if(!d)return this.out({error:"Unknown device"},404);
      Object.assign(d,{firmwareVersion:b.firmware||d.firmwareVersion,lastSeenAt:now,lastRssi:b.rssi,lastFps:b.framesPerSecond,lastFreeHeap:b.freeHeap,updatedAt:now});
      await this.ctx.storage.put("device:"+d.id,d);
      return this.out({ok:true,status:d.status,profileId:d.profileId,serverTime:now});
    }
    if(p==="/device/touch"){
      const d=await this.getDevice(b.deviceId);if(d){d.lastSeenAt=now;d.updatedAt=now;await this.ctx.storage.put("device:"+d.id,d);}return this.out({ok:true});
    }

    if(p==="/me")return this.out(await this.me(b.accountId));

    if(p==="/access"){
      const a=await this.getAccount(b.accountId),d=await this.getDevice(b.deviceId);
      if(!a||!d)return this.out({error:"Not found"},404);
      if(a.role==="OWNER"||d.assignedAccountId===a.id)return this.out({ok:true});
      return this.out({error:"Forbidden"},403);
    }

    if(p==="/feedback/create"){
      if(!String(b.message||"").trim())return this.out({error:"Message required"},400);
      const id=crypto.randomUUID(),f={id,accountId:b.accountId,deviceId:b.deviceId||null,garageId:b.garageId||null,category:b.category||"other",language:b.language==="en"?"en":"ar",message:String(b.message).trim().slice(0,4000),status:"new",adminNotes:"",createdAt:now,updatedAt:now};
      await this.ctx.storage.put("feedback:"+String(now).padStart(16,"0")+":"+id,f);return this.out({ok:true,id});
    }

    if(p==="/owner/devices"){
      const devices=await this.listPrefix("device:");devices.sort((a,b)=>(b.lastSeenAt||0)-(a.lastSeenAt||0));return this.out({devices});
    }
    if(p==="/owner/device/approve"){
      const d=await this.getDevice(b.deviceId);if(!d)return this.out({error:"Device not found"},404);
      d.status="active";d.assignedAccountId=b.accountId||b.actorId;d.profileId=b.profileId||d.profileId||"tesla.model3y.battery.v1";d.updatedAt=now;
      await this.ctx.storage.put("device:"+d.id,d);await this.audit("device.approved",{deviceId:d.id,accountId:d.assignedAccountId,actorId:b.actorId});return this.out({ok:true,device:d});
    }
    if(p==="/owner/device/suspend"){
      const d=await this.getDevice(b.deviceId);if(!d)return this.out({error:"Device not found"},404);
      d.status="suspended";d.updatedAt=now;await this.ctx.storage.put("device:"+d.id,d);await this.audit("device.suspended",{deviceId:d.id,actorId:b.actorId});return this.out({ok:true,device:d});
    }

    if(p==="/owner/accounts"){
      const xs=(await this.listPrefix("account:")).map(x=>this.safeAccount(x));return this.out({accounts:xs});
    }
    if(p==="/owner/account/create"){
      const email=String(b.email||"").trim().toLowerCase();
      if(!email||!b.password||String(b.password).length<10)return this.out({error:"Email and password (10+ chars) required"},400);
      if(await this.ctx.storage.get("email:"+email))return this.out({error:"Email already exists"},409);
      const role=["GARAGE_ADMIN","TECHNICIAN","VEHICLE_OWNER"].includes(b.role)?b.role:"TECHNICIAN",pw=await makePassword(String(b.password)),id=crypto.randomUUID();
      const a={id,email,displayName:b.displayName||email,role,locale:b.locale==="en"?"en":"ar",status:"active",passwordSalt:pw.salt,passwordHash:pw.hash,passwordIterations:pw.iterations,createdAt:now,updatedAt:now};
      await this.ctx.storage.put("account:"+id,a);await this.ctx.storage.put("email:"+email,id);await this.audit("account.created",{accountId:id,actorId:b.actorId,role});return this.out({ok:true,account:this.safeAccount(a)});
    }
    if(p==="/owner/feedback"){
      const xs=await this.listPrefix("feedback:");xs.sort((a,b)=>b.createdAt-a.createdAt);return this.out({feedback:xs});
    }
    return this.out({error:"Not found"},404);
  }
  safeAccount(a){if(!a)return null;const {passwordHash,passwordSalt,passwordIterations,...safe}=a;return safe;}
  async me(accountId){
    const a=await this.getAccount(accountId);if(!a)return {error:"Not found"};
    const devices=await this.listPrefix("device:");
    const device=a.role==="OWNER"?(devices.find(d=>d.status==="active")||devices[0]||null):(devices.find(d=>d.assignedAccountId===a.id&&d.status==="active")||null);
    return {account:this.safeAccount(a),device};
  }
}

export class DeviceHub {
  constructor(ctx,env){this.ctx=ctx;this.env=env;}
  async fetch(req){
    const p=new URL(req.url).pathname;
    if(p==="/telemetry"&&req.method==="POST"){
      const x=await body(req);await this.ctx.storage.put("latest",x);return json({ok:true});
    }
    if(p==="/latest"){
      const x=await this.ctx.storage.get("latest");
      return x?json({type:"telemetry",...x}):json({type:"telemetry",data:null},200);
    }
    return json({error:"Not found"},404);
  }
}
