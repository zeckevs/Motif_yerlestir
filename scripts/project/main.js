// 5x5 motif oyunu: zorluk secim layoutundaki butonlarla seçilir.
const MOTIF_NAMES=["a","b","c","d","e"], GRID_SIZE=5, SNAP_DISTANCE=82;
const DIFFICULTY={1:{name:"Kolay",prefilled:15},2:{name:"Orta",prefilled:10},3:{name:"Zor",prefilled:5}};
let selectedDifficulty=2, gameStarted=false, selectionBound=false;
const soundUrls={};
async function playSound(runtime, tag){
 try{
  // Construct exportlarında sesler media klasörüne taşınabildiği için URL'yi asset yöneticisinden al.
  const url=soundUrls[tag]||await runtime.assets.getMediaFileUrl(`${tag}.webm`);
  const audio=new globalThis.Audio(url);
  audio.volume=1;
  await audio.play();
 }catch(error){console.warn(`Ses oynatılamadı: ${tag}.webm`,error);}
}

runOnStartup(async runtime=>{
 for(const tag of ["click","correct","wrong","tebrikler"]){try{soundUrls[tag]=await runtime.assets.getMediaFileUrl(`${tag}.webm`);}catch(error){console.warn(`Ses URL'si alınamadı: ${tag}`);}}
 runtime.addEventListener("beforeanylayoutstart",e=>{
  if(e.layout.name==="secim") bindDifficultyButtons(runtime);
  if(e.layout.name==="video") setupVideo(runtime);
  if(e.layout.name==="secim" || e.layout.name==="oyun") setupInstructions(runtime);
  if(e.layout.name==="final") setupFinal(runtime);
  if(e.layout.name==="bilgi"){
   const info=runtime.objects.bilgi?.getFirstInstance();
   if(info) info.animationFrame=0;
   updateInfoButtons(runtime);
  }
  if(e.layout.name==="oyun"){gameStarted=false;startMotifGame(runtime);}
 });
 runtime.addEventListener("pointerup",event=>handleNavigation(runtime,event));
});

function handleNavigation(runtime,event){
 const layout=runtime.layout;
 if(!layout)return;
 const layer=layout.getLayer(0), position=layer.cssPxToLayer(event.clientX,event.clientY);
 const hit=(name)=>{const type=runtime.objects[name],button=type?.getFirstInstance();return button&&button.containsPoint(position[0],position[1]);};
 if(hit("btn_basla")){playSound(runtime,"click");runtime.goToLayout("video");return;}
 if(layout.name==="bilgi" && hit("btn_kaynakca")){
  const info=runtime.objects.bilgi?.getFirstInstance();
  if(info){playSound(runtime,"click");info.animationFrame=1;updateInfoButtons(runtime);}
  return;
 }
 if(layout.name==="video"){
  const video=runtime.objects.bg_video?.getFirstInstance();
  if(video && hit("btn_ileri")){playSound(runtime,"click");video.animationFrame=Math.min(5,video.animationFrame+1);updateVideoStart(runtime);return;}
  if(video && hit("btn_geri")){playSound(runtime,"click");video.animationFrame=Math.max(0,video.animationFrame-1);updateVideoStart(runtime);return;}
  if(video && hit("btn_basla2") && video.animationFrame===5){playSound(runtime,"click");runtime.goToLayout("secim");return;}
 }
 if(hit("btn_nasil_oynanir")){playSound(runtime,"click");showInstructions(runtime);return;}
 if(layout.name==="secim" && hit("bg_info")){playSound(runtime,"click");hideInstructions(runtime);return;}
 if(hit("btn_cikis")){playSound(runtime,"click");hideInstructions(runtime);return;}
 if(layout.name==="bilgi" && hit("btn_bilgi")){
  const info=runtime.objects.bilgi?.getFirstInstance();
  if(info){playSound(runtime,"click");info.animationFrame=info.animationFrame===0?1:0;updateInfoButtons(runtime);}
  return;
 }
 if(hit("btn_bilgi")){
  runtime.goToLayout("bilgi");
  return;
 }
 if(hit("btn_anasayfa")){playSound(runtime,"click");runtime.goToLayout("kapak");}
}

function setupInstructions(runtime){
 const info=runtime.objects.bg_info?.getFirstInstance();
 const help=runtime.objects.btn_nasil_oynanir?.getFirstInstance();
 const exit=runtime.objects.btn_cikis?.getFirstInstance();
 if(info) info.isVisible=false;
 if(help) help.isVisible=true;
 if(exit) exit.isVisible=false;
}

function showInstructions(runtime){
 const info=runtime.objects.bg_info?.getFirstInstance();
 const help=runtime.objects.btn_nasil_oynanir?.getFirstInstance();
 const exit=runtime.objects.btn_cikis?.getFirstInstance();
 if(info){info.setPosition(960,540);info.isVisible=true;info.moveToTop();}
 if(help) help.isVisible=false;
 if(exit){exit.isVisible=true;exit.moveToTop();}
}

function hideInstructions(runtime){
 const info=runtime.objects.bg_info?.getFirstInstance();
 const help=runtime.objects.btn_nasil_oynanir?.getFirstInstance();
 const exit=runtime.objects.btn_cikis?.getFirstInstance();
 if(info) info.isVisible=false;
 if(help) help.isVisible=true;
 if(exit) exit.isVisible=false;
}

function setupFinal(runtime){
 playSound(runtime,"tebrikler");
 const names=["yildiz","yildizz","yildizzz","yildizzzz"];
 const sparkles=[];
 const relocate=star=>{
  star.setPosition(960+(Math.random()-.5)*1650,540+(Math.random()-.5)*900);
  star.angle=Math.random()*Math.PI*2;
 };
 for(const name of names){
  const star=runtime.objects[name]?.getFirstInstance();
  if(!star)continue;
  star.isVisible=true; relocate(star); star.opacity=0;
  sparkles.push({star,phase:Math.random()*Math.PI*2,speed:1.4+Math.random()*1.2,age:0});
 }
 runtime.addEventListener("tick",()=>{
  for(const sparkle of sparkles){
   sparkle.age+=runtime.dt;
   const wave=(Math.sin(sparkle.phase+sparkle.age*sparkle.speed)+1)/2;
   sparkle.star.opacity=wave;
   if(sparkle.age>=(Math.PI*2)/sparkle.speed){sparkle.age=0;sparkle.phase=0;relocate(sparkle.star);}
  }
 });
}

function setupVideo(runtime){
 const video=runtime.objects.bg_video?.getFirstInstance();
 if(!video)return;
 video.animationFrame=0;
 updateVideoStart(runtime);
}

function updateVideoStart(runtime){
 const video=runtime.objects.bg_video?.getFirstInstance();
 const start=runtime.objects.btn_basla2?.getFirstInstance();
 const ileri=runtime.objects.btn_ileri?.getFirstInstance();
 const geri=runtime.objects.btn_geri?.getFirstInstance();
 if(!video)return;
 if(start){
  start.isVisible=video.animationFrame===5;
  start.isCollisionEnabled=start.isVisible;
 }
 if(geri) geri.isVisible=video.animationFrame!==0;
 if(ileri) ileri.isVisible=video.animationFrame!==5;
}

function updateInfoButtons(runtime){
 const info=runtime.objects.bilgi?.getFirstInstance();
 const kaynakca=runtime.objects.btn_kaynakca?.getFirstInstance();
 const bilgi=runtime.objects.btn_bilgi?.getFirstInstance();
 if(!info||!kaynakca||!bilgi)return;
 if(info.animationFrame===0){
  kaynakca.setPosition(600,970);
  bilgi.setPosition(2000,2000);
 }else{
  kaynakca.setPosition(2000,2000);
  bilgi.setPosition(994,1012);
 }
}

function bindDifficultyButtons(runtime){
 if(selectionBound)return;
 selectionBound=true;
 runtime.addEventListener("pointerup",event=>{
  const layout=runtime.layout;
  if(!layout||layout.name!=="secim")return;
  const layer=layout.getLayer(0);
  const position=layer.cssPxToLayer(event.clientX,event.clientY);
  const buttons={1:runtime.objects.btn_kolay,2:runtime.objects.btn_orta,3:runtime.objects.btn_zor};
  for(const [level,type] of Object.entries(buttons)){
   const button=type?.getFirstInstance();
   if(button&&button.containsPoint(position[0],position[1])){
    selectedDifficulty=Number(level);
    runtime.goToLayout("oyun");
    return;
   }
  }
 });
}

function startMotifGame(runtime){
 if(gameStarted)return; gameStarted=true;
 const board=runtime.objects.bg_oyun.getFirstInstance(); if(!board)throw new Error("bg_oyun bulunamadı.");
 const cells=Array.from({length:25},(_,i)=>({x:board.getImagePointX(i+1),y:board.getImagePointY(i+1)}));
 const occupied=Array(25).fill(null); let completed=false;
 const usedCount=Object.fromEntries(MOTIF_NAMES.map(name=>[name,0]));
 const falling=[];
 runtime.addEventListener("tick",()=>{
  for(let i=falling.length-1;i>=0;i--){const item=falling[i];item.elapsed+=runtime.dt;if(item.elapsed<item.delay)continue;const t=Math.min(1,(item.elapsed-item.delay)/item.duration),ease=1-Math.pow(1-t,3);item.p.setPosition(item.x,item.startY+(item.y-item.startY)*ease);if(t>=1){item.p.isCollisionEnabled=true;falling.splice(i,1);}}
 });
 const closest=(x,y)=>{let b=-1,d0=SNAP_DISTANCE*SNAP_DISTANCE;for(let i=0;i<25;i++){let dx=x-cells[i].x,dy=y-cells[i].y,d=dx*dx+dy*dy;if(d<=d0){b=i;d0=d;}}return b;};
 function canPlace(index,motif,moving=-1){if(index<0||(occupied[index]&&index!==moving))return false;const r=Math.floor(index/5),c=index%5;return occupied.every((v,i)=>i===moving||!v||v.motif!==motif||(Math.floor(i/5)!==r&&i%5!==c));}
 function check(){if(occupied.every(Boolean)&&!completed){completed=true;console.info("Tebrikler! Bulmaca tamamlandı.");runtime.goToLayout("final");}}
 function addPiece(type,motif,index,animate=false){const source=type.getFirstInstance(),target=cells[index],startY=animate?target.y-420:target.y,p=type.createInstance(source.layer.name,target.x,startY);p.width=source.width;p.height=source.height;p.moveToTop();p.isCollisionEnabled=!animate;if(animate)falling.push({p,x:target.x,y:target.y,startY,elapsed:0,delay:falling.length*.16,duration:.65});occupied[index]={motif,p};usedCount[motif]++;if(usedCount[motif]>=5)source.isVisible=false;let cur=index;p.behaviors.DragDrop.addEventListener("drop",()=>{const t=closest(p.x,p.y);if(canPlace(t,motif,cur)){playSound(runtime,"correct");occupied[cur]=null;occupied[t]={motif,p};cur=t;}else playSound(runtime,"wrong");p.setPosition(cells[cur].x,cells[cur].y);check();});return p;}
 const solution=Array.from({length:25},(_,i)=>MOTIF_NAMES[(i+Math.floor(i/5))%5]);
 const shuffled=[...Array(25).keys()];
 for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 const exampleCount=DIFFICULTY[selectedDifficulty]?.prefilled??10;
 for(const i of shuffled.slice(0,exampleCount))addPiece(runtime.objects[solution[i]],solution[i],i,true);
 for(const motif of MOTIF_NAMES){const type=runtime.objects[motif],source=type.getFirstInstance(),home={x:source.x,y:source.y};source.behaviors.DragDrop.addEventListener("drop",()=>{const t=closest(source.x,source.y);if(usedCount[motif]<5&&canPlace(t,motif)){playSound(runtime,"correct");addPiece(type,motif,t,false);check();}else playSound(runtime,"wrong");source.setPosition(home.x,home.y);});}
}
