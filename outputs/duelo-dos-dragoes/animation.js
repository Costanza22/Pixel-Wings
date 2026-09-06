/* Estado visual puro: seleção de quadros testável sem navegador. */
(function(root){
  const frames=[
    [18,65,370,330],[400,140,364,255],[782,145,370,250],[1151,65,368,330],
    [18,435,364,463],[377,589,446,312],[827,684,300,222],[1148,584,371,318]
  ];
  function pose(a,time){
    let index=0,kind='idle',sx=1,sy=1,angle=0,offset=0;
    if(a.hp<=0){index=a.death<.45?7:6;kind='defeat';const fall=Math.min(1,a.death/1.05);const ease=fall*fall*(3-2*fall);angle=-Math.sin(fall*Math.PI)*.2;sy=1-ease*.62;sx=1+ease*.12;offset=-Math.sin(Math.min(1,a.death/.45)*Math.PI)*16;}
    else if(a.flash>0){index=7;kind='hit';offset=-Math.sin(a.flash*50)*5;angle=-.08;}
    else if(a.attack>0){index=5;kind=a.attackType||'claw';const duration=kind==='fire'?.36:.3;const phase=Math.max(0,Math.min(1,1-a.attack/duration));offset=Math.sin(phase*Math.PI)*18;sx=1+Math.sin(phase*Math.PI)*.1;}
    else if(a.y<490){index=4;kind='jump';sy=1+Math.sin(time*15)*.025;angle=Math.max(-.12,Math.min(.12,a.vy/3500));}
    else if(a.block){index=6;kind='block';sy=1+Math.sin(time*5)*.02;}
    else if(Math.abs(a.move)>1){index=Math.floor(a.stride)%4;kind='walk';offset=Math.sin(a.stride*Math.PI)*2;}
    else {sy=1+Math.sin(time*3)*.025;sx=1-Math.sin(time*3)*.01;}
    return {index,kind,sx,sy,angle,offset};
  }
  const api={frames,pose};root.DragonAnimation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
