const key='training-palace-v1';
let state={days:{},journal:{}};
try { const saved=JSON.parse(localStorage.getItem(key)); if(saved && typeof saved.days==='object' && saved.days && typeof saved.journal==='object' && saved.journal) state=saved; } catch { document.querySelector('#storage-error').hidden=false; }
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const today=localDate();
const defaults=[['Rustig aan mijn dag beginnen','Twee minuten rustig ademen, op mijn tempo','Rust'],['Ontbijten','Iets eenvoudigs is genoeg','Voeding'],['Middageten','Even pauzeren en iets eten','Voeding'],['Avondeten','Een maaltijd en een moment voor mezelf','Voeding'],['Even bewegen','Tien minuten wandelen of bewegen thuis','Beweging'],['Eén taak thuis volledig afronden','Zelf kiezen, uitvoeren en afwerken','Thuis']];
state.days[today]??={mood:null,tasks:defaults.map(([title,detail,tag])=>({title,detail,tag,done:false}))};
const day=state.days[today];
function save(){try{localStorage.setItem(key,JSON.stringify(state));return true}catch{document.querySelector('#storage-error').hidden=false;return false}}
document.querySelector('#date').textContent=new Intl.DateTimeFormat('nl-BE',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
function showPage(page){document.querySelector('#today').hidden=page!=='today';document.querySelector('#journal').hidden=page!=='journal';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));}
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
document.querySelector('#open-journal').onclick=()=>{showPage('journal');document.querySelector('#journal-text').focus()};
function renderTasks(){
 const list=document.querySelector('#task-list');list.replaceChildren();
 day.tasks.forEach((task,i)=>{
  const row=document.createElement('div');row.className='task';
  const check=document.createElement('input');check.type='checkbox';check.checked=task.done;check.setAttribute('aria-label',`${task.title} afvinken`);
  check.addEventListener('change',()=>{task.done=check.checked;save();renderTasks()});
  const button=document.createElement('button');button.className='task-open';button.setAttribute('aria-label',`${task.title}: openen`);
  const words=document.createElement('span');const title=document.createElement('span');title.className='task-title';title.textContent=task.title;
  const detail=document.createElement('span');detail.className='task-detail';detail.textContent=task.detail;words.append(title,detail);
  const tag=document.createElement('span');tag.className='tag';tag.textContent=task.tag;
  const arrow=document.createElement('span');arrow.className='task-arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
  button.append(words,tag,arrow);button.onclick=()=>openTask(i);row.append(check,button);list.append(row);
 });
 const done=day.tasks.filter(t=>t.done).length;document.querySelector('#count').textContent=`${done} van ${day.tasks.length}`;document.querySelector('#progress').style.width=`${done/day.tasks.length*100}%`;
 renderDayMacros();
}
document.querySelector('#add-task').addEventListener('submit',e=>{e.preventDefault();const input=document.querySelector('#task-input');const title=input.value.trim();if(!title)return;day.tasks.push({title,detail:'Op mijn eigen tempo',tag:'Mijn stap',done:false});save();renderTasks();input.value='';input.focus()});
document.querySelectorAll('[data-mood]').forEach(b=>{b.setAttribute('aria-label',b.dataset.mood);b.classList.toggle('selected',day.mood===b.dataset.mood);b.setAttribute('aria-pressed',String(day.mood===b.dataset.mood));b.onclick=()=>{day.mood=b.dataset.mood;save();document.querySelectorAll('[data-mood]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))})}});
const dateInput=document.querySelector('#journal-date'),textInput=document.querySelector('#journal-text'),status=document.querySelector('#save-status');dateInput.value=today;function loadEntry(){textInput.value=state.journal[dateInput.value]||'';status.textContent='Wordt automatisch op dit toestel bewaard.'}dateInput.addEventListener('change',()=>{if(!dateInput.value)dateInput.value=today;loadEntry()});loadEntry();textInput.addEventListener('input',()=>{state.journal[dateInput.value]=textInput.value;status.textContent=save()?'Opgeslagen op dit toestel.':'Opslaan mislukt. Exporteer je dagboek.'});
document.querySelector('#export').onclick=()=>{const entries=Object.entries(state.journal).sort(([a],[b])=>a.localeCompare(b));const content=entries.map(([date,text])=>`## ${date}\n\n${text}`).join('\n\n');const blob=new Blob([content||'Je dagboek is nog leeg.'],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`training-palace-dagboek-${today}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};


// Task details and meal data are additive: existing checkmarks and journal entries remain intact.
const kinds=['breathing','breakfast','lunch','dinner','workout','household'];
state.preferences??={};day.meals??={};day.workout??={};
day.tasks.forEach((task,i)=>{if(!task.kind)task.kind=i<6 && task.tag===['Rust','Voeding','Voeding','Voeding','Beweging','Thuis'][i]?kinds[i]:'custom'});
if(state.preferences.household){const task=day.tasks.find(t=>t.kind==='household');if(task){task.title=state.preferences.household;if(state.preferences.householdDetail!==undefined)task.detail=state.preferences.householdDetail}}
const dialog=document.querySelector('#task-dialog'),body=document.querySelector('#detail-body');
let activeTask=null,cleanDetail=()=>{},photoUrl=null;
const el=(tag,props={},text)=>{const node=document.createElement(tag);Object.assign(node,props);if(text!==undefined)node.textContent=text;return node};
function note(text){return el('p',{className:'detail-note'},text)}
function button(text,fn,cls='secondary-button'){const b=el('button',{type:'button',className:cls},text);b.onclick=fn;return b}
function field(label,node){const wrap=el('label',{className:'field-label'},label);wrap.append(node);return wrap}
function message(text){document.querySelector('#detail-status').textContent=text}
function finishDetail(){cleanDetail();cleanDetail=()=>{};if(photoUrl){URL.revokeObjectURL(photoUrl);photoUrl=null}}
dialog.addEventListener('close',finishDetail);
document.querySelector('#close-detail').onclick=()=>dialog.close();
document.querySelector('#complete-task').onclick=()=>{if(activeTask===null)return;day.tasks[activeTask].done=!day.tasks[activeTask].done;save();renderTasks();dialog.close()};
function openTask(index){
 finishDetail();activeTask=index;body.replaceChildren();message('');
 const task=day.tasks[index];document.querySelector('#detail-title').textContent=task.title;document.querySelector('#detail-category').textContent=task.tag;
 document.querySelector('#complete-task').textContent=task.done?'Vinkje ongedaan maken':'Taak afvinken';
 if(task.kind==='breathing')renderBreathing();else if(['breakfast','lunch','dinner'].includes(task.kind))renderMeal(task.kind);else if(task.kind==='workout')renderWorkout();else renderEditTask(task);
 if(!dialog.open)dialog.showModal();
}
function renderBreathing(){
 body.append(note('Kies een oefening. Adem zacht, zonder te forceren of je adem vast te houden. Je kunt op elk moment stoppen.'));
 const select=el('select',{id:'breathing-choice'});[['slow','Rustig ritme · 2 minuten · 4 sec in, 6 sec uit'],['short','Kleine pauze · 1 minuut · 3 sec in, 4 sec uit']].forEach(([value,text])=>select.append(el('option',{value},text)));
 body.append(field('Mijn oefening',select));
 const guide=el('div',{className:'breath-guide'}),phase=el('strong',{},'Klaar voor een rustig moment?'),clock=el('span',{},'2:00'),bar=el('progress',{max:120,value:0});guide.append(phase,clock,bar);body.append(guide);
 body.append(note('Zit comfortabel en ontspan je schouders. Adem door je neus in als dat prettig voelt; adem rustig uit. Word je duizelig of voelt het niet goed, stop dan en adem normaal.'));
 let running=false,elapsed=0,started=0,timer=null;
 const duration=()=>select.value==='short'?60:120;
 const tick=()=>{const seconds=elapsed+(running?(performance.now()-started)/1000:0);const remaining=Math.max(0,duration()-seconds);clock.textContent=`${Math.floor(Math.ceil(remaining)/60)}:${String(Math.ceil(remaining)%60).padStart(2,'0')}`;bar.max=duration();bar.value=Math.min(seconds,duration());const inhale=select.value==='short'?3:4,exhale=select.value==='short'?4:6;phase.textContent=seconds>=duration()?'Afgerond. Neem je tijd.':running?(seconds%(inhale+exhale)<inhale?'Adem rustig in':'Adem rustig uit'):seconds?'Gepauzeerd':'Klaar voor een rustig moment?';guide.classList.toggle('inhale',running && seconds%(inhale+exhale)<inhale);if(seconds>=duration()){running=false;elapsed=duration();clearInterval(timer);select.disabled=false;start.disabled=true;start.textContent='Afgerond';message('Oefening afgerond. Vink je taak af wanneer je wilt.')}};
 const start=button('Start oefening',()=>{if(running){elapsed+=(performance.now()-started)/1000;running=false;clearInterval(timer);start.textContent='Verdergaan';select.disabled=false}else{started=performance.now();running=true;select.disabled=true;start.textContent='Pauzeren';timer=setInterval(tick,200)}tick()},'dark-button');
 const reset=()=>{running=false;elapsed=0;clearInterval(timer);select.disabled=false;start.disabled=false;start.textContent='Start oefening';message('');tick()};
 const controls=el('div',{className:'button-row'});controls.append(start,button('Opnieuw',reset));body.append(controls);select.onchange=reset;cleanDetail=()=>clearInterval(timer);tick();
}
function renderEditTask(task){
 const title=el('input',{type:'text',value:task.title,maxLength:140,required:true,id:'edit-task-title'});
 const detail=el('textarea',{value:task.detail,maxLength:1000,rows:3,id:'edit-task-detail'});
 body.append(field('Wat wil je doen?',title),field('Notitie of uitleg',detail));
 if(task.kind==='household')body.append(note('Deze huishoudtaak komt elke dag terug. Morgen begint het vinkje opnieuw leeg. De naam blijft bewaard op dit toestel.'));
 body.append(button('Wijziging bewaren',()=>{if(!title.value.trim()){title.focus();return message('Geef je taak een naam.')}task.title=title.value.trim();task.detail=detail.value.trim();if(task.kind==='household'){state.preferences.household=task.title;state.preferences.householdDetail=task.detail;}save();renderTasks();document.querySelector('#detail-title').textContent=task.title;message('Taak bewaard.' )},'dark-button'));
}
function renderWorkout(){
 body.append(note('Een eenvoudige thuisworkout zonder materiaal. Begin klein; 50 keer pompen hoeft geen startdoel te zijn. Neem 45–90 seconden rust tussen setjes. Stop bij pijn.'));
 const select=el('select',{id:'workout-level'});[['gentle','Rustige start'],['normal','Gewone training']].forEach(([value,text])=>select.append(el('option',{value},text)));select.value=day.workout.level||'gentle';body.append(field('Mijn niveau',select));
 const list=el('div',{className:'exercise-list'});body.append(list);
 const exerciseData=[['Pompen','Tegen een stevige muur of aanrecht. Lichaam recht; zak gecontroleerd en duw terug omhoog.','5–8','8–12'],['Squats naar een stoel','Voeten op schouderbreedte. Zak rustig naar een stevige stoel en kom weer recht.','8','10–12'],['Heupbrug','Lig op je rug, knieën gebogen. Span je billen aan, til je heupen en laat rustig zakken.','10','12'],['Plank','Op knieën en onderarmen als start. Houd je romp stabiel en blijf normaal ademen.','15 sec','20–30 sec']];
 function draw(){list.replaceChildren();const easy=select.value==='gentle';exerciseData.forEach(([name,description,low,high],i)=>{const section=el('section',{className:'exercise'});section.append(el('h3',{},name),note(description));const key=`${select.value}-${i}`;day.workout[key]??={sets:easy?2:3,reps:easy?low:high,done:[]};const data=day.workout[key];const settings=el('div',{className:'exercise-settings'});const sets=el('input',{type:'number',min:1,max:10,value:data.sets});sets.setAttribute('aria-label',`${name}: aantal sets`);const reps=el('input',{type:'text',maxLength:30,value:data.reps});reps.setAttribute('aria-label',`${name}: herhalingen of seconden`);settings.append(field('Sets',sets),field('Herhalingen / tijd',reps));section.append(settings);const checks=el('div',{className:'set-checks'});function drawChecks(){checks.replaceChildren();for(let n=0;n<data.sets;n++){const c=el('input',{type:'checkbox',checked:!!data.done[n]});c.onchange=()=>{data.done[n]=c.checked;save()};const label=el('label',{},`Set ${n+1}`);label.prepend(c);checks.append(label)}}sets.onchange=()=>{const count=Number(sets.value);if(!Number.isInteger(count)||count<1||count>10){sets.value=data.sets;return}data.sets=count;data.done=data.done.slice(0,count);save();drawChecks()};reps.onchange=()=>{data.reps=reps.value.trim()||'5';save()};drawChecks();section.append(checks);list.append(section)})}
 select.onchange=()=>{day.workout.level=select.value;save();draw()};draw();body.append(note('Vooraf: 2 minuten rustig ter plaatse stappen en je gewrichten losmaken. Na afloop: even rustig uitwandelen. De hele dagtaak vink je zelf af.'));
}

// Indicative nutrition per 100 g. Labels on the actual product take precedence.
const foods=[['Ei',13,1.1,11],['Spek, gebakken',37,1.4,42],['Brood, volkoren',9,39,3.5],['Cornflakes',7,84,0.9],['Melk, halfvol',3.5,4.8,1.5],['Yoghurt, naturel halfvol',4,4.5,1.5],['Havermout, droog',13,60,7],['Banaan, zonder schil',1.1,20,0.3],['Appel',0.3,12,0.2],['Kipfilet, bereid',31,0,3.6],['Rijst, gekookt',2.7,28,0.3],['Pasta, gekookt',5,30,1.1],['Aardappel, gekookt',2,17,0.1],['Broccoli, bereid',2.8,4,0.4],['Olijfolie',0,0,100],['Boter',0.5,0.5,82],['Kaas, Gouda',25,0,30]];
function totals(meal){const factor=meal.mode==='high'?1.15:meal.mode==='exact'?1:0.85;const total={protein:0,carbs:0,fat:0};for(const row of meal.items){for(const key of Object.keys(total))total[key]+=Number(row[key]||0)*Number(row.grams||0)/100}for(const key of Object.keys(total))total[key]*=factor;total.calories=total.protein*4+total.carbs*4+total.fat*9;return total}
function macroGrid(values){const grid=el('div',{className:'macro-grid'});[['calories','kcal'],['protein','g eiwit'],['carbs','g koolhydr.'],['fat','g vet']].forEach(([key,label])=>{const cell=el('div');cell.append(el('strong',{},String(Math.round(values[key]||0))),el('span',{},label));grid.append(cell)});return grid}
function renderDayMacros(){let card=document.querySelector('#daily-macros');if(!card){card=el('section',{className:'card daily-macros',id:'daily-macros'});document.querySelector('.secondary').append(card)}const total={calories:0,protein:0,carbs:0,fat:0};for(const meal of Object.values(day.meals||{})){const v=totals(meal);for(const k of Object.keys(total))total[k]+=v[k]}card.replaceChildren(el('span',{className:'section-kicker'},'VOEDING VANDAAG'),el('h2',{},'Mijn dagtotaal'),macroGrid(total),note('Totaal van je geregistreerde maaltijden. Lage of hoge schatting per maaltijd; geen exact gemeten waarden.'))}
function photoStore(mode,fn){return new Promise((resolve,reject)=>{const request=indexedDB.open('training-palace-photos',1);request.onupgradeneeded=()=>request.result.createObjectStore('photos');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result;const tx=db.transaction('photos',mode);let result;try{result=fn(tx.objectStore('photos'))}catch(error){db.close();reject(error);return}tx.oncomplete=()=>{db.close();resolve(result?.result)};tx.onerror=()=>{db.close();reject(tx.error)}}})}
async function compressPhoto(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Kies een JPG-, PNG- of WebP-foto. Zet HEIC zo nodig eerst om.');if(file.size>20*1024*1024)throw Error('Deze foto is te groot. Kies een bestand kleiner dan 20 MB.');const bitmap=await createImageBitmap(file);const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Foto verwerken lukt niet.')),'image/jpeg',0.8))}
function renderMeal(kind){
 const meal=day.meals[kind]??={description:'',mode:'high',items:[]};
 body.append(note('Registreer voeding en porties, of neem een bestaande macroschatting over. Controleer de uitkomst: productetiketten en gewogen porties zijn nauwkeuriger.'));
 const description=el('textarea',{id:'meal-description',rows:2,value:meal.description,placeholder:'Bijvoorbeeld: twee eitjes, spek en een snee brood',maxLength:2000});description.oninput=()=>{meal.description=description.value;save()};body.append(field('Wat heb ik gegeten?',description));
 const mode=el('select',{id:'meal-mode'});mode.append(el('option',{value:'low'},'Lage schatting (−15%)'),el('option',{value:'high'},'Hoge schatting (+15%)'),el('option',{value:'exact'},'Overnemen zonder extra marge'));mode.value=meal.mode;body.append(field('Hoe wil ik schatten?',mode),note('Laag rekent 15% onder de basis, hoog 15% erboven. Porties, bakvet en sauzen kunnen meer afwijken.'));
 const result=el('div',{id:'meal-totals'});body.append(result);const update=()=>{result.replaceChildren(macroGrid(totals(meal)));renderDayMacros()};mode.onchange=()=>{meal.mode=mode.value;save();update()};
 const list=el('div',{id:'food-items'});body.append(list);
 const source=el('select',{id:'food-choice'});foods.forEach(([name],i)=>source.append(el('option',{value:i},name)));source.append(el('option',{value:'custom'},'Eigen product / etiket invoeren'));
 const grams=el('input',{id:'food-grams',type:'number',min:1,max:5000,step:1,value:100,required:true});
 const custom=el('div',{className:'custom-food',hidden:true});const product=el('input',{placeholder:'Productnaam',maxLength:100});custom.append(field('Eigen product',product));const customMacros={};for(const [key,label]of [['protein','Eiwit / 100 g'],['carbs','Koolhydraten / 100 g'],['fat','Vet / 100 g']]){customMacros[key]=el('input',{type:'number',min:0,max:100,step:0.1,value:0});custom.append(field(label,customMacros[key]))}
 source.onchange=()=>custom.hidden=source.value!=='custom';
 const form=el('form',{className:'food-form'});form.append(field('Voedingsmiddel',source),field('Portie in gram (melk: ongeveer ml)',grams),custom);const add=el('button',{type:'submit',className:'dark-button'},'Voedingsmiddel toevoegen');form.append(add);body.append(form);
 function drawItems(){list.replaceChildren();meal.items.forEach((item,i)=>{const row=el('div',{className:'food-row'});row.append(el('span',{},item.wholeMeal?`${item.name} · hele maaltijd`:`${item.name} · ${item.grams} g`),button('Verwijder',()=>{meal.items.splice(i,1);save();drawItems();update()}));list.append(row)})}
 form.onsubmit=e=>{e.preventDefault();const amount=Number(grams.value);if(!Number.isFinite(amount)||amount<=0||amount>5000)return message('Kies een portie tussen 1 en 5000 gram.');let item;if(source.value==='custom'){const values=Object.fromEntries(Object.entries(customMacros).map(([k,input])=>[k,Number(input.value)]));if(!product.value.trim()||Object.values(values).some(v=>!Number.isFinite(v)||v<0||v>100)||Object.values(values).reduce((a,b)=>a+b,0)>100.5)return message('Controleer de productnaam en macro’s per 100 gram.');item={name:product.value.trim(),...values}}else{const [name,protein,carbs,fat]=foods[Number(source.value)];item={name,protein,carbs,fat}}meal.items.push({...item,grams:amount});save();drawItems();update();message('Voeding toegevoegd.')};
 body.append(note('Handig: één ei zonder schaal weegt ongeveer 50 g. Gebruik voor rijst en pasta het gekookte gewicht. Vergeet bakvet, sauzen en drank niet.'));
 const photoSection=el('section',{className:'meal-photo'});photoSection.append(el('h3',{},'Foto van mijn maaltijd'),note('Neem op je telefoon een foto of kies een bestand. Je foto blijft op dit toestel. Automatische fotoanalyse is niet actief: zo maak je geen API-kosten. Je kunt de foto zelf in ChatGPT laten schatten, binnen de limieten van je abonnement, en hieronder de totalen overnemen.'));
 const upload=el('input',{id:'meal-photo',type:'file',accept:'image/jpeg,image/png,image/webp'});upload.setAttribute('capture','environment');
 const photo=el('img',{className:'meal-photo-preview',alt:'Mijn maaltijdfoto',hidden:true});
 const photoKey=`${today}/${kind}`;let alive=true;cleanDetail=()=>{alive=false};let generation=0;
 async function display(blob){if(!alive)return;if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=blob?URL.createObjectURL(blob):null;photo.hidden=!blob;if(blob)photo.src=photoUrl;else photo.removeAttribute('src')}
 photoStore('readonly',store=>store.get(photoKey)).then(blob=>{if(generation===0)display(blob)}).catch(()=>{if(alive)message('Foto-opslag is niet beschikbaar in deze browser.')});
 upload.onchange=async()=>{const file=upload.files[0];if(!file)return;const version=++generation;upload.disabled=true;try{const blob=await compressPhoto(file);if(!alive||version!==generation)return;await photoStore('readwrite',store=>store.put(blob,photoKey));if(alive&&version===generation){await display(blob);message('Foto lokaal bewaard. Vul voeding in of neem een macroschatting over.')}}catch(error){if(alive)message(error.message)}finally{if(alive)upload.disabled=false;upload.value=''}};
 photoSection.append(field('Foto nemen / kiezen',upload),photo,button('Foto verwijderen',async()=>{generation++;try{await photoStore('readwrite',store=>store.delete(photoKey));if(alive){display(null);message('Foto verwijderd.')}}catch{if(alive)message('Verwijderen is mislukt.')}}));body.append(photoSection);
 photoSection.append(note('Geen automatische AI-analyse of externe API-aanroepen. Een ChatGPT-abonnement omvat geen API-gebruik.'));
 const transfer=el('section',{className:'manual-transfer'});transfer.append(el('h3',{},'Macro’s voor de hele maaltijd overnemen'),note('Heb je een schatting uit ChatGPT of van een verpakking? Vul hier de totalen in, niet de waarden per 100 g. Calorieën worden berekend uit deze macro’s. Deze invoer vervangt de voedingsmiddelen hierboven.'));
 const transferForm=el('form');const inputs={};const controls=el('div',{className:'transfer-grid'});
 for(const [key,label]of [['protein','Eiwit (g)'],['carbs','Koolhydraten (g)'],['fat','Vet (g)']]){inputs[key]=el('input',{type:'number',min:0,max:1000,step:0.1,required:true});controls.append(field(label,inputs[key]))}
 const useTotals=el('button',{type:'submit',className:'dark-button'},'Gebruik maaltijdtotalen');transferForm.append(controls,useTotals);
 transferForm.onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,Number(input.value)]));if(Object.values(values).some(v=>!Number.isFinite(v)||v<0||v>1000))return message('Vul geldige macro’s tussen 0 en 1000 gram in.');meal.items=[{name:'Overgenomen maaltijdtotalen',grams:100,wholeMeal:true,...values}];meal.mode='exact';mode.value='exact';delete meal.photoNotes;delete meal.source;save();drawItems();update();message('Maaltijdtotalen overgenomen zonder extra marge. Je kunt hierboven alsnog laag of hoog kiezen.');};
 transfer.append(transferForm);body.append(transfer);
 drawItems();update();
}
renderTasks();
// A page left open overnight must show the new day's empty checklist.
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&localDate()!==today)location.reload()});
