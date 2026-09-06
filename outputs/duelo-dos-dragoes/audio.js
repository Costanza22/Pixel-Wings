/* Trilha original sintetizada localmente: alaúde, flauta, bordão e tambor.
   Nenhum arquivo remoto ou música de terceiros. Inicia apenas por gesto. */
(function(root){
  const melody=[
    74,0,77,76,74,0,69,0,72,74,77,0,76,74,72,0,
    69,0,72,74,76,0,72,0,69,67,65,0,67,69,72,0,
    70,0,74,77,79,77,74,0,77,0,74,72,70,0,69,0,
    69,73,76,0,81,79,76,73,74,0,0,0,69,72,73,0,
    74,77,81,0,79,77,76,74,77,0,76,72,74,0,0,0,
    72,76,79,0,77,76,72,69,72,0,69,67,65,67,69,0,
    70,74,77,0,81,79,77,74,77,74,72,70,69,0,67,0,
    69,73,76,79,81,0,79,76,74,0,69,0,74,0,0,0
  ];
  const roots=[50,45,46,45,50,48,46,45];
  const hz=n=>440*Math.pow(2,(n-69)/12);
  class Soundtrack{
    constructor(){this.ctx=null;this.enabled=true;this.volume=.25;this.playing=false;this.step=0;this.nodes=new Set();this.run=0;}
    init(){if(this.ctx)return;const AC=root.AudioContext||root.webkitAudioContext;if(!AC)throw Error('Audio indisponível');this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.enabled?this.volume*.5:0;const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=4;this.master.connect(compressor);compressor.connect(this.ctx.destination);}
    tone(note,time,duration,volume,type='triangle',pluck=false){
      const o=this.ctx.createOscillator(),gain=this.ctx.createGain();o.type=type;o.frequency.value=hz(note);gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+(pluck?.009:.07));gain.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(gain);gain.connect(this.master);o.start(time);o.stop(time+duration+.03);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();gain.disconnect();};
    }
    drum(time,strong){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.setValueAtTime(strong?100:140,time);o.frequency.exponentialRampToValueAtTime(48,time+.16);g.gain.setValueAtTime(strong?.32:.12,time);g.gain.exponentialRampToValueAtTime(.0001,time+.2);o.connect(g);g.connect(this.master);o.start(time);o.stop(time+.22);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};}
    schedule(){if(!this.playing)return;const beat=60/88/2;while(this.next<this.ctx.currentTime+.12){const s=this.step%128,t=this.next,rootNote=roots[Math.floor(s/16)];if(melody[s]){this.tone(melody[s],t,beat*1.75,.17,'sine');this.tone(melody[s]+12,t,beat*1.4,.018,'sine');}this.tone(rootNote+12+[0,7,12,7][s%4],t,beat*1.3,.10,'triangle',true);if(s%8===0){this.tone(rootNote-12,t,beat*7.7,.15,'sine');this.tone(rootNote+7,t,beat*7.5,.028,'sine');}if(s%4===0)this.drum(t,s%8===0);this.next+=beat;this.step++;}}
    async start(reset=false){try{this.init();if(reset)this.step=0;if(this.playing)return;this.playing=true;const run=++this.run;await this.ctx.resume();if(!this.playing||run!==this.run)return;this.next=this.ctx.currentTime+.05;this.schedule();clearInterval(this.timer);this.timer=setInterval(()=>this.schedule(),25);}catch{this.playing=false;const b=document.querySelector('#music');if(b){b.textContent=root.MedievalI18n?root.MedievalI18n.t('audioError'):'Audio unavailable';b.disabled=true;}}}
    pause(){this.run++;this.playing=false;clearInterval(this.timer);for(const o of this.nodes){try{o.stop();}catch{}}this.nodes.clear();}
    setEnabled(value){this.enabled=value;this.applyVolume();}
    setVolume(value){this.volume=Math.max(0,Math.min(1,value));this.applyVolume();}
    applyVolume(){if(this.ctx){this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setTargetAtTime(this.enabled?this.volume*.5:0,this.ctx.currentTime,.03);}}
  }
  root.DragonSoundtrack=Soundtrack;
})(window);
