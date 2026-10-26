import {EngineSynth} from './engine-core.js';

class TeslaSoundPhysicsProcessor extends AudioWorkletProcessor {
  constructor(options){
    super();
    this.engine=new EngineSynth(sampleRate);
    this.port.onmessage=event=>{
      const next=event.data;
      if(next&&typeof next==='object')this.engine.setState(next);
    };
  }
  process(inputs,outputs){
    const channel=outputs[0];
    if(!channel||!channel.length)return true;
    if(channel.length>1){
      this.engine.render(channel[0],channel[1]);
    }else{
      const output=channel[0];
      const scratch=new Float32Array(output.length);
      this.engine.render(output,scratch);
      for(let i=0;i<output.length;i++)output[i]=(output[i]+scratch[i])*.5;
    }
    return true;
  }
}

registerProcessor('hijjawix-physics-engine-v3',TeslaSoundPhysicsProcessor);
