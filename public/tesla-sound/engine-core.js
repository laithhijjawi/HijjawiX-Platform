/**
 * Tesla Sound X / Physics Engine v3.0
 * Independent browser audio model inspired by combustion and exhaust acoustics.
 * No recordings, third-party DSP code or branded OEM audio files.
 * Four-stroke firing event timing -> exhaust pressure -> bank-specific resonances,
 * tube reflections, intake noise, mechanical motion, overrun crackle and whine.
 */
export const ENGINE_PRESETS = Object.freeze({
  v8: {
    name:'MUSCLE V8',detail:'6.2L CROSSPLANE · DUAL OPEN HEADERS',
    cylinders:8,banks:[0,1,0,1,1,0,1,0],idle:760,limit:6800,
    type:'combustion',tone:[76,168,355,710],decay:[.035,.026,.012,.007],
    pipes:[333,391],ratios:[178,105,72,52,40,33],gears:6,
    exhaust:1.3,intake:.55,rough:.47,whine:.02,crackle:.75
  },
  v10: {
    name:'SUPERCAR V10',detail:'5.2L · EVEN-FIRE HIGH-REV',
    cylinders:10,banks:[0,1,0,1,0,1,0,1,0,1],idle:1020,limit:8700,
    type:'combustion',tone:[110,260,660,1280],decay:[.025,.022,.013,.009],
    pipes:[275,315],ratios:[205,126,88,64,49,38,30],gears:7,
    exhaust:.9,intake:.95,rough:.16,whine:.13,crackle:.37
  },
  v12: {
    name:'ITALIAN V12',detail:'6.5L · NATURALLY ASPIRATED',
    cylinders:12,banks:[0,1,0,1,0,1,0,1,0,1,0,1],idle:900,limit:8900,
    type:'combustion',tone:[130,330,820,1530],decay:[.031,.024,.015,.009],
    pipes:[251,280],ratios:[188,122,85,64,50,39,30],gears:7,
    exhaust:.91,intake:1.05,rough:.07,whine:.15,crackle:.31
  },
  flat6: {
    name:'GT3 FLAT-SIX',detail:'4.0L · BOXER SIX · 9,000 RPM',
    cylinders:6,banks:[0,1,1,0,0,1],idle:960,limit:9000,
    type:'combustion',tone:[135,400,1000,1780],decay:[.022,.023,.012,.007],
    pipes:[225,264],ratios:[215,132,93,67,50,39,31],gears:7,
    exhaust:.76,intake:1.25,rough:.12,whine:.13,crackle:.45
  },
  supercharged: {
    name:'SUPERCHARGED V8',detail:'6.2L · SUPERCHARGER · LONG-TUBE',
    cylinders:8,banks:[0,1,0,1,1,0,1,0],idle:800,limit:6500,
    type:'combustion',tone:[81,185,430,900],decay:[.041,.03,.014,.01],
    pipes:[386,430],ratios:[170,103,71,51,40,31],gears:6,
    exhaust:1.15,intake:.72,rough:.35,whine:1.0,crackle:.67
  },
  taycan: {
    name:'ELECTRIC SPORT',detail:'TAYCAN-INSPIRED · ORIGINAL EV SOUND DESIGN',
    cylinders:0,banks:[],idle:0,limit:9000,
    type:'electric',tone:[110,230,540,1320],decay:[.03,.02,.01,.008],
    pipes:[180,200],ratios:[64],gears:1,
    exhaust:0,intake:.18,rough:0,whine:1.0,crackle:0
  }
});
const TWO_PI=Math.PI*2;
const cap=(x,min,max)=>Math.min(max,Math.max(min,x));
class ModalResonator{
  constructor(sr,hz,seconds){
    const r=Math.exp(-1/(sr*seconds));
    this.a=2*r*Math.cos(TWO_PI*hz/sr);this.b=r*r;
    this.y1=0;this.y2=0;
  }
  next(x){const y=.018*x+this.a*this.y1-this.b*this.y2;this.y2=this.y1;this.y1=y;return y}
}
export class EngineSynth {
  constructor(sr=48000){
    this.sr=sr;this.dt=1/sr;this.profile='v8';this.preset=ENGINE_PRESETS.v8;
    this.desired={rpm:760,load:0,character:.76,crackle:.34,whine:.38,active:false};
    this.rpm=0;this.load=0;this.rotorPhase=0;this.whinePhase=0;this.whinePhase2=0;
    this.fireFraction=0;this.firingIndex=0;this.seed=0x1d5a44e9;this.noiseLow=0;this.noiseFast=0;
    this.bankEnv=[0,0];this.bankScratch=[0,0];this.lastIn=[0,0];this.lastOut=[0,0];
    this.pressure=[0,0];this.lowpass=[0,0];this.overrun=0;this.pop=0;this.popBursts=0;
    this.shiftTime=0;this.shiftMode=0;this.lastDemand=0;
    this.configure('v8');
  }
  random(){
    let x=this.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;
    this.seed=x>>>0;return (this.seed>>>0)/4294967296;
  }
  configure(id){
    if(!ENGINE_PRESETS[id])return;
    this.profile=id;this.preset=ENGINE_PRESETS[id];
    const p=this.preset;
    this.modes=[
      [new ModalResonator(this.sr,p.tone[0],p.decay[0]),new ModalResonator(this.sr,p.tone[1],p.decay[1]),new ModalResonator(this.sr,p.tone[2],p.decay[2]),new ModalResonator(this.sr,p.tone[3],p.decay[3])],
      [new ModalResonator(this.sr,p.tone[0]*1.026,p.decay[0]),new ModalResonator(this.sr,p.tone[1]*.971,p.decay[1]),new ModalResonator(this.sr,p.tone[2]*1.04,p.decay[2]),new ModalResonator(this.sr,p.tone[3]*.98,p.decay[3])]
    ];
    this.pipes=[new Float32Array(p.pipes[0]),new Float32Array(p.pipes[1])];
    this.pipePosition=[0,0];this.fireFraction=0;this.firingIndex=0;
    this.bankEnv=[0,0];this.pressure=[0,0];this.lowpass=[0,0];
    this.pop=0;this.overrun=0;this.shiftTime=0;
  }
  setState(data={}){
    if(data.profile&&data.profile!==this.profile)this.configure(data.profile);
    for(const key of ['rpm','load','character','crackle','whine']){
      if(typeof data[key]==='number'&&Number.isFinite(data[key])){
        this.desired[key]=key==='rpm'?cap(data[key],0,11000):cap(data[key],0,1);
      }
    }
    if(typeof data.active==='boolean')this.desired.active=data.active;
    if(data.shift==='up'){this.shiftTime=.10;this.shiftMode=1}
    else if(data.shift==='down'){this.shiftTime=.14;this.shiftMode=2}
  }
  fire(){
    const p=this.preset;
    const n=p.cylinders;
    const idx=this.firingIndex++%n;
    const bank=p.banks[idx];
    const idleFraction=cap((p.idle*1.9-this.rpm)/(p.idle*1.2),0,1);
    const loose=(.12+.25*this.desired.character)*p.rough*idleFraction;
    const wobble=1+loose*Math.sin(idx*2.6+this.rotorPhase*.2)+(this.random()-.5)*(.05+loose*.18);
    const fired=cap(wobble,.45,1.6)*(.44+this.load*.90);
    this.bankEnv[bank]+=fired;
    this.pressure[bank]+=fired*(.48+.50*this.load);
  }
  render(left,right){
    const p=this.preset,sr=this.sr,dt=this.dt,desired=this.desired;
    const isEV=p.type==='electric';
    const ownL=this.modes[0],ownR=this.modes[1];
    const pipeA=this.pipes[0],pipeB=this.pipes[1];
    const max=Math.min(left.length,right.length);
    for(let i=0;i<max;i++){
      const targetRpm=desired.active?desired.rpm:0;
      this.rpm+=(targetRpm-this.rpm)*.0005;
      const targetLoad=desired.active?desired.load:0;
      this.load+=(targetLoad-this.load)*.0015;
      const rpm=cap(this.rpm,0,p.limit*1.05);
      const load=this.load;
      this.rotorPhase+=TWO_PI*rpm/(60*sr);if(this.rotorPhase>TWO_PI)this.rotorPhase-=TWO_PI;
      const rnd=this.random()*2-1;
      this.noiseLow+=(rnd-this.noiseLow)*.018;
      const hiss=rnd-this.noiseLow;
      let l=0,r=0;
      if(isEV){
        // Original electric-motor design: inverter carrier + rotor harmonics + load noise.
        const base=55+rpm*.16;
        this.whinePhase+=TWO_PI*base/sr;
        this.whinePhase2+=TWO_PI*(base*2.02+38)/sr;
        if(this.whinePhase>=TWO_PI)this.whinePhase-=TWO_PI;
        if(this.whinePhase2>=TWO_PI)this.whinePhase2-=TWO_PI;
        const mod=Math.sin(this.whinePhase*.5)*.5+.5;
        const torque=.22+.78*load;
        const motor=(Math.sin(this.whinePhase)+.39*Math.sin(3*this.whinePhase+.5*Math.sin(this.whinePhase2))+
          .21*Math.sin(this.whinePhase2))*.17*torque;
        const air=(hiss*.025*this.desired.whine*load*(.1+mod));
        l=motor+air;
        r=motor*.93+Math.sin(this.whinePhase2+.2)*.03*torque-air*.4;
      }else{
        this.fireFraction+=rpm*p.cylinders/(120*sr);
        if(this.fireFraction>=1){
          const count=Math.min(3,Math.floor(this.fireFraction));
          for(let q=0;q<count;q++)this.fire();
          this.fireFraction-=count;
        }
        // Four-stroke exhaust blowdown: asymmetric impulse, bank-specific pressure pulses.
        const pressureDecay=.976;
        const envDecay=.956;
        const openness=this.desired.character;
        const cutoff=360+openness*4100+Math.min(rpm,8000)*.18;
        const filterAlpha=cap(TWO_PI*cutoff/sr,.02,.87);
        for(let bank=0;bank<2;bank++){
          this.pressure[bank]*=pressureDecay;this.bankEnv[bank]*=envDecay;
          const env=this.bankEnv[bank];
          const raw=(this.pressure[bank]*.20+env*.26+(hiss*.052+this.noiseLow*.1)*env)*(p.exhaust);
          const filtered=bank===0?ownL:ownR;
          const low=filtered[0].next(raw);
          const mid=filtered[1].next(raw);
          const high=filtered[2].next(raw);
          const zing=filtered[3].next(raw);
          const pipe=bank===0?pipeA:pipeB;
          const pos=this.pipePosition[bank];
          const bounce=pipe[pos];
          pipe[pos]=Math.tanh(raw*.24+bounce*(.55+openness*.24));
          this.pipePosition[bank]=(pos+1)%pipe.length;
          const character=(low*.85+mid*(.53+openness*.5)+high*(.14+openness*.64)+
             zing*(.035+openness*.35)+bounce*(.27+openness*.37));
          this.lowpass[bank]+=(character-this.lowpass[bank])*filterAlpha;
          this.bankScratch[bank]=this.lowpass[bank];
        }
        const intake=hiss*p.intake*(.018+.044*load)*(rpm>p.idle?1: .4);
        this.whinePhase+=TWO_PI*(100+rpm*(.09+p.whine*.09))/sr;
        if(this.whinePhase>TWO_PI)this.whinePhase-=TWO_PI;
        const supercharger=Math.sin(this.whinePhase)*(.011*p.whine*this.desired.whine*load*(rpm/p.limit));
        // A falling throttle after a loaded run creates non-repeating overrun pops.
        if(load+.16<this.lastDemand&&rpm>2200&&this.desired.crackle>.07)this.overrun=.28+this.desired.crackle*.60;
        this.lastDemand=Math.max(load,this.lastDemand-.00022);
        if(load>this.lastDemand)this.lastDemand=load;
        if(this.overrun>0){
          this.overrun-=dt;
          if(this.random()<dt*(3+this.desired.crackle*21)*p.crackle){
            this.pop+=(.22+this.random()*.65)*this.desired.crackle;
          }
        }
        this.pop*=.972;
        const popping=(this.pop*(.3+.5*hiss))*this.desired.character*.24;
        const body=(this.bankScratch[0]+this.bankScratch[1])*.54;
        const pipeLeft=this.bankScratch[0]*.25+this.bankScratch[1]*.06;
        const pipeRight=this.bankScratch[1]*.25+this.bankScratch[0]*.06;
        const mechanical=Math.sin(this.rotorPhase*2)*(.012+.018*load)*(.2+.8*rpm/p.limit);
        let shiftGain=1;
        if(this.shiftTime>0){
          this.shiftTime-=dt;
          shiftGain=this.shiftMode===1?.52:1.22;
          if(this.shiftTime<=0&&this.shiftMode===1)this.pop+=.12*this.desired.crackle;
        }
        l=(body+pipeLeft+intake+supercharger+mechanical+popping)*shiftGain;
        r=(body+pipeRight-intake*.3+supercharger*.94+mechanical+popping*.85)*shiftGain;
      }
      // Gentle output saturation and DC-blocking for speaker safety.
      const sides=[l,r];
      for(let ch=0;ch<2;ch++){
        const n=sides[ch];
        const hp=n-this.lastIn[ch]+.997*this.lastOut[ch];
        this.lastIn[ch]=n;this.lastOut[ch]=hp;
        const out=Math.tanh(hp*1.5)*.43;
        (ch===0?left:right)[i]=Number.isFinite(out)?out:0;
      }
    }
  }
}
