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
document.querySelector('nav [data-page=today]').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
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
 renderDayMacros();updateTodaySaveState();
}
document.querySelector('#add-task').addEventListener('submit',e=>{e.preventDefault();const input=document.querySelector('#task-input');const title=input.value.trim();if(!title)return;day.tasks.push({title,detail:'Op mijn eigen tempo',tag:'Mijn stap',done:false});save();renderTasks();input.value='';input.focus()});
document.querySelectorAll('[data-mood]').forEach(b=>{b.setAttribute('aria-label',b.dataset.mood);b.classList.toggle('selected',day.mood===b.dataset.mood);b.setAttribute('aria-pressed',String(day.mood===b.dataset.mood));b.onclick=()=>{day.mood=b.dataset.mood;save();updateTodaySaveState();document.querySelectorAll('[data-mood]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))})}});
state.savedDays??={};state.noteDrafts??={};
const dateInput=document.querySelector('#journal-date'),todayText=document.querySelector('#today-journal-text'),todayStatus=document.querySelector('#today-save-status');
let selectedNoteDate=today;
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const formatNoteDate=date=>new Intl.DateTimeFormat('nl-BE',{day:'numeric',month:'long',year:'numeric'}).format(new Date(date+'T12:00:00'));
function noteMeta(date){
 if(date===today)return day;
 if(date>today)return {mood:null,tasks:[]};
 return state.noteDrafts[date]??state.savedDays[date]??state.days[date]??{mood:null,tasks:[]};
}
function snapshotFor(date){const meta=noteMeta(date);return {mood:meta.mood||null,tasks:structuredClone(meta.tasks||[]),text:state.journal[date]??state.savedDays[date]?.text??'',kind:date>today?'plan':'day'}}
function dayChanged(date){const saved=state.savedDays[date];if(!saved)return false;const current=snapshotFor(date);return current.mood!==saved.mood||current.text!==saved.text||JSON.stringify(current.tasks)!==JSON.stringify(saved.tasks)}
function updateTodaySaveState(){
 const date=selectedNoteDate,saved=state.savedDays[date],current=snapshotFor(date),future=date>today;
 const name=date===today?'Vandaag':future?'Notitie':'Dag';
 document.querySelector('#save-today').textContent=name+(saved?' bijwerken':' opslaan');
 document.querySelector('#today-save-preview').textContent=future?'Notitie voor '+formatNoteDate(date):`Stemming: ${current.mood||'nog niet gekozen'} · ${current.tasks.filter(t=>t.done).length} van ${current.tasks.length} taken afgevinkt`;
 todayStatus.textContent=saved?(dayChanged(date)?'Je hebt wijzigingen. Werk deze dag bij.':'Opgeslagen voor '+formatNoteDate(date)+'.'):'Je tekst blijft als concept voor deze datum bewaard.';
}
function storeDay(date){
 const previous=state.savedDays[date];state.savedDays[date]={...snapshotFor(date),savedAt:new Date().toISOString()};
 if(!save()){if(previous)state.savedDays[date]=previous;else delete state.savedDays[date];return false}
 updateTodaySaveState();renderJournalHistory();renderSavedDay();return true;
}
function renderJournalHistory(){
 const history=document.querySelector('#journal-history');history.replaceChildren();
 const dates=[...new Set([...Object.keys(state.savedDays),...Object.keys(state.journal).filter(date=>state.journal[date]?.trim())])].filter(validDate).sort().reverse();
 if(!dates.length){history.append(note('Nog geen dagen opgeslagen. Kies een datum en bewaar je notitie.'));return}
 for(const date of dates){const entry=state.savedDays[date],b=button('',()=>selectNoteDate(date));b.className='saved-day-card';b.classList.toggle('selected',selectedNoteDate===date);b.setAttribute('aria-pressed',String(selectedNoteDate===date));b.append(el('strong',{},formatNoteDate(date)),el('span',{},!entry?'Concept':date>today?'Geplande notitie':`${entry.mood||'Geen stemming'} · ${entry.tasks.filter(t=>t.done).length}/${entry.tasks.length} taken`));history.append(b)}
}
function renderSavedDay(){
 const view=document.querySelector('#saved-day-view'),entry=state.savedDays[selectedNoteDate];view.replaceChildren();document.querySelector('#saved-note-details').hidden=!entry;
 if(!entry)return;
 const meta=el('div',{className:'saved-day-meta'});if(entry.kind!=='plan')meta.append(el('span',{},`Stemming: ${entry.mood||'Niet ingevuld'}`),el('span',{},`${entry.tasks.filter(t=>t.done).length} van ${entry.tasks.length} taken`));else meta.append(el('span',{},'Geplande notitie'));view.append(meta,el('p',{className:'saved-day-text'},entry.text||'Geen tekst toegevoegd.'));
 if(entry.tasks.length){const tasks=el('details',{className:'saved-day-tasks'});tasks.append(el('summary',{},'Taken van deze dag bekijken'));const list=el('ul');for(const task of entry.tasks){const li=el('li',{className:task.done?'done':''});li.append(el('span',{className:'saved-task-mark'},task.done?'✓':'○'),el('span',{},task.title));list.append(li)}tasks.append(list);view.append(tasks)}
 view.append(note('Opgeslagen op '+new Intl.DateTimeFormat('nl-BE',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(entry.savedAt))));
}
function editablePastMeta(){return state.noteDrafts[selectedNoteDate]??=structuredClone({mood:noteMeta(selectedNoteDate).mood||null,tasks:noteMeta(selectedNoteDate).tasks||[]})}
function renderPastMeta(){
 const past=selectedNoteDate<today;document.querySelector('#past-day-edit').hidden=!past;
 if(!past)return;
 const meta=noteMeta(selectedNoteDate);document.querySelector('#past-day-mood').value=meta.mood||'';
 const tasks=document.querySelector('#past-day-tasks');tasks.replaceChildren();
 if(!meta.tasks.length)tasks.append(note('Voor deze datum zijn nog geen taken geregistreerd. Je kunt ze hieronder aanvullen.'));
 meta.tasks.forEach((task,index)=>{const label=el('label',{className:'past-task'}),input=el('input',{type:'checkbox',checked:task.done});input.onchange=()=>{editablePastMeta().tasks[index].done=input.checked;save();updateTodaySaveState()};label.append(input,el('span',{},task.title));tasks.append(label)});
}
function selectNoteDate(date){
 if(!validDate(date)){dateInput.value=selectedNoteDate;return}
 selectedNoteDate=date;dateInput.value=date;todayText.value=state.journal[date]??state.savedDays[date]?.text??'';
 const future=date>today;document.querySelector('#note-heading').textContent=date===today?'Hoe was je dag?':future?'Wat staat er op de planning?':'Terugblik op je dag';
 document.querySelector('#note-date-context').textContent=date===today?'Vandaag':formatNoteDate(date);
 document.querySelector('#note-text-label').textContent=future?'Wat wil je voor deze dag noteren?':'Wat wil je onthouden?';
 todayText.placeholder=future?'Bijv. afspraak om 14 uur, boodschappen of iets dat je wilt voorbereiden…':'Wat ging goed? Wat was lastig? Of schrijf wat er in je hoofd zit…';
 document.querySelector('#past-day-edit').open=false;document.querySelector('#past-task-title').value='';document.querySelector('#saved-note-details').open=false;
 renderPastMeta();renderSavedDay();renderJournalHistory();updateTodaySaveState();
}
function initializeJournal(){
 selectNoteDate(today);
 dateInput.onchange=()=>selectNoteDate(dateInput.value);
 document.querySelector('#note-today').onclick=()=>selectNoteDate(today);
 function moveDate(offset){const date=new Date(selectedNoteDate+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+offset);selectNoteDate(date.toISOString().slice(0,10))}
 document.querySelector('#note-previous').onclick=()=>moveDate(-1);document.querySelector('#note-next').onclick=()=>moveDate(1);
 todayText.oninput=()=>{state.journal[selectedNoteDate]=todayText.value;const stored=save();updateTodaySaveState();renderJournalHistory();if(!stored)todayStatus.textContent='Opslaan mislukt. Kopieer je tekst voor je afsluit.'};
 document.querySelector('#past-day-mood').onchange=e=>{editablePastMeta().mood=e.target.value||null;save();updateTodaySaveState()};
 document.querySelector('#past-add-task').onsubmit=e=>{e.preventDefault();if(selectedNoteDate>=today)return;const input=document.querySelector('#past-task-title');if(!input.value.trim())return;editablePastMeta().tasks.push({title:input.value.trim(),detail:'Achteraf toegevoegd',tag:'Mijn stap',done:false,kind:'custom'});save();input.value='';renderPastMeta();updateTodaySaveState()};
 document.querySelector('#save-today').onclick=()=>{if(storeDay(selectedNoteDate))todayStatus.textContent=(selectedNoteDate===today?'Vandaag':formatNoteDate(selectedNoteDate))+' opgeslagen.';else todayStatus.textContent='Opslaan mislukt. Kopieer je tekst voor je afsluit.'};
 document.querySelector('#export').onclick=()=>{
  const dates=[...new Set([...Object.keys(state.journal),...Object.keys(state.savedDays)])].sort();
  const content=dates.map(date=>{const entry=state.savedDays[date];if(!entry)return `## ${date} (concept)\n\n${state.journal[date]||''}`;const lines=[`## ${date}`,entry.kind==='plan'?'Geplande notitie':`Stemming: ${entry.mood||'Niet ingevuld'}`,...entry.tasks.map(t=>`[${t.done?'x':' '}] ${t.title}`),'',entry.text||''];if((state.journal[date]??entry.text)!==entry.text)lines.push('','Conceptwijzigingen (nog niet opgeslagen):',state.journal[date]||'');return lines.join('\n')}).join('\n\n');
  const blob=new Blob([content||'Je notities zijn nog leeg.'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`training-palace-notities-${today}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
}

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
 finishDetail();activeTask=index;body.replaceChildren();body.classList.remove('meal-detail');message('');
 const task=day.tasks[index];document.querySelector('#detail-title').textContent=task.title;document.querySelector('#detail-category').textContent=task.tag;
 document.querySelector('#complete-task').textContent=task.done?'Vinkje ongedaan maken':'Taak afvinken';
 if(task.kind==='breathing')renderBreathing();else if(['breakfast','lunch','dinner'].includes(task.kind))renderMeal(task.kind);else if(task.kind==='workout')renderWorkout();else renderEditTask(task);
 if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
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

function totals(meal){const factor=meal.mode==='high'?1.15:meal.mode==='exact'?1:0.85;const total={protein:0,carbs:0,fat:0};for(const row of meal.items){for(const key of Object.keys(total))total[key]+=Number(row[key]||0)*Number(row.grams||0)/100}for(const key of Object.keys(total))total[key]*=factor;total.calories=total.protein*4+total.carbs*4+total.fat*9;return total}
function macroGrid(values){const grid=el('div',{className:'macro-grid'});[['calories','kcal'],['protein','g eiwit'],['carbs','g koolhydr.'],['fat','g vet']].forEach(([key,label])=>{const cell=el('div');cell.append(el('strong',{},String(Math.round(values[key]||0))),el('span',{},label));grid.append(cell)});return grid}
function renderDayMacros(){let card=document.querySelector('#daily-macros');if(!card){card=el('section',{className:'card daily-macros',id:'daily-macros'});document.querySelector('.secondary').append(card)}const total={calories:0,protein:0,carbs:0,fat:0};for(const meal of Object.values(day.meals||{})){const v=totals(meal);for(const k of Object.keys(total))total[k]+=v[k]}card.replaceChildren(el('span',{className:'section-kicker'},'VOEDING VANDAAG'),el('h2',{},'Mijn dagtotaal'),macroGrid(total),note('Totaal van je geregistreerde maaltijden. Lage of hoge schatting per maaltijd; geen exact gemeten waarden.'))}
function photoStore(mode,fn){return new Promise((resolve,reject)=>{const request=indexedDB.open('training-palace-photos',1);request.onupgradeneeded=()=>request.result.createObjectStore('photos');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result;const tx=db.transaction('photos',mode);let result;try{result=fn(tx.objectStore('photos'))}catch(error){db.close();reject(error);return}tx.oncomplete=()=>{db.close();resolve(result?.result)};tx.onerror=()=>{db.close();reject(tx.error)}}})}
async function compressPhoto(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Kies een JPG-, PNG- of WebP-foto. Zet HEIC zo nodig eerst om.');if(file.size>20*1024*1024)throw Error('Deze foto is te groot. Kies een bestand kleiner dan 20 MB.');const bitmap=await createImageBitmap(file);const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Foto verwerken lukt niet.')),'image/jpeg',0.8))}
function renderMeal(kind){
 const meal=day.meals[kind]??={description:'',mode:'high',items:[]};
 if(meal.items.length&&meal.estimatedDescription===undefined)meal.estimatedDescription=meal.description;
 let alive=true,generation=0;cleanDetail=()=>{alive=false};
 body.classList.add('meal-detail');
 const description=el('textarea',{id:'meal-description',rows:3,value:meal.description,placeholder:'Bijv. 2 eitjes met spek en een witte boterham',maxLength:2000});
 body.append(field('Wat heb je gegeten?',description));
 const photoKey=`${today}/${kind}`;
 const upload=el('input',{id:'meal-photo',type:'file',accept:'image/jpeg,image/png,image/webp',hidden:true});upload.setAttribute('capture','environment');
 const photo=el('img',{className:'meal-photo-preview compact-photo',alt:'Mijn maaltijdfoto',hidden:true});
 const photoTools=el('div',{className:'photo-tools'});
 const removePhoto=button('Verwijderen',async()=>{generation++;try{await photoStore('readwrite',s=>s.delete(photoKey));if(alive){displayPhoto(null);message('Foto verwijderd.')}}catch{if(alive)message('Verwijderen is mislukt.')}});removePhoto.hidden=true;
 const photoButton=button('＋ Foto toevoegen',()=>upload.click());
 const photoHint=el('span',{className:'photo-hint'},'optioneel');photoTools.append(photoButton,photoHint,removePhoto);body.append(photoTools,upload,photo);
 function displayPhoto(blob){if(!alive)return;if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=blob?URL.createObjectURL(blob):null;photo.hidden=!blob;removePhoto.hidden=!blob;photoHint.textContent=blob?'Lokaal bewaard · niet automatisch geanalyseerd':'optioneel';photoButton.textContent=blob?'Foto wijzigen':'＋ Foto toevoegen';if(blob)photo.src=photoUrl;else photo.removeAttribute('src')}
 photoStore('readonly',s=>s.get(photoKey)).then(blob=>{if(generation===0)displayPhoto(blob)}).catch(()=>{if(alive)photoHint.textContent='Foto-opslag niet beschikbaar.'});
 upload.onchange=async()=>{const file=upload.files[0];if(!file)return;const version=++generation;photoButton.disabled=true;try{const blob=await compressPhoto(file);if(!alive||version!==generation)return;await photoStore('readwrite',s=>s.put(blob,photoKey));if(alive&&version===generation){displayPhoto(blob);message('Foto bewaard. De snelle schatting gebruikt je tekst, niet de foto.')}}catch(error){if(alive)message(error.message)}finally{if(alive)photoButton.disabled=false;upload.value=''}};
 const actions=el('div',{className:'meal-actions'});
 const estimateButton=button('Schat mijn maaltijd',()=>{
  const estimate=MealEstimator.estimate(description.value);
  if(!estimate.complete){hint.textContent=estimate.issues.join(' · ');hint.classList.add('needs-attention');aiDetails.open=true;updatePrompt();return;}
  meal.items=estimate.items;meal.assumptions=estimate.assumptions;meal.source='local';meal.estimatedDescription=description.value;meal.description=description.value;
  const stored=save();update();message(stored?'Schatting bewaard.':'Opslaan lukt niet op dit toestel.');
 },'dark-button');
 const mode=el('select',{id:'meal-mode'});mode.setAttribute('aria-label','Lage of hoge schatting');
 mode.append(el('option',{value:'low'},'Laag'),el('option',{value:'high'},'Hoog'),el('option',{value:'exact'},'Basis'));mode.value=meal.mode;
 mode.onchange=()=>{meal.mode=mode.value;save();update();updatePrompt()};actions.append(estimateButton,mode);body.append(actions);
 const hint=el('p',{className:'detail-note',id:'meal-hint'},'Een snelle schatting met standaardporties. Je kunt ze daarna aanpassen.');hint.setAttribute('role','status');body.append(hint);
 const result=el('section',{id:'meal-totals',className:'meal-result'});body.append(result);
 const adjust=el('details',{className:'meal-more',id:'meal-adjust'});adjust.append(el('summary',{},'Porties bekijken of aanpassen'));
 const portions=el('div',{id:'food-items'});adjust.append(portions,note('Porties zijn aannames. Laag/hoog rekent −15%/+15%; verborgen bakvet en sauzen kunnen meer afwijken.'));body.append(adjust);
 function drawItems(){portions.replaceChildren();meal.items.forEach((item,i)=>{const row=el('div',{className:'food-row'});row.append(el('span',{},item.wholeMeal?item.name:item.name));if(!item.wholeMeal){const grams=el('input',{type:'number',min:1,max:5000,step:0.1,value:item.grams});grams.setAttribute('aria-label',item.name+' in gram');const unit=el('label',{className:'portion-grams'},'g');unit.prepend(grams);row.append(unit);grams.onchange=()=>{const value=Number(grams.value);if(!Number.isFinite(value)||value<1||value>5000){grams.value=item.grams;return}item.grams=value;save();update()}}row.append(button('×',()=>{meal.items.splice(i,1);save();update()}));row.lastChild.setAttribute('aria-label',item.name+' verwijderen');portions.append(row)});if(meal.source==='local')portions.append(note('Bekende voedingsmiddelen uit een kleine voedingslijst; geen AI-analyse. Gewichten voor rijst en pasta zijn bereid gewicht. Bakvet telt alleen mee als je het noemt.'))}
 function update(){
  const stale=meal.items.length&&meal.estimatedDescription!==undefined&&meal.estimatedDescription!==description.value;
  result.hidden=!meal.items.length;adjust.hidden=!meal.items.length;
  result.replaceChildren();
  if(meal.items.length){result.append(el('span',{className:'section-kicker'},stale?'VORIGE SCHATTING':meal.source==='chatgpt'?'OVERGENOMEN AI-SCHATTING':meal.source==='local'?'SNELLE TEKSTSCHATTING':'BEWAARDE SCHATTING'),macroGrid(totals(meal)));}
  hint.classList.remove('needs-attention');
  hint.textContent=stale?'Beschrijving gewijzigd. Klik op ‘Schat mijn maaltijd’ om je vorige schatting te vernieuwen.':meal.items.length?'Grove schatting · bewaard bij deze maaltijd.':'Een snelle schatting met standaardporties. Je kunt ze daarna aanpassen.';
  drawItems();renderDayMacros();
 }
 description.oninput=()=>{meal.description=description.value;save();update();updatePrompt();message('')};
 const aiDetails=el('details',{className:'meal-more',id:'meal-ai'});aiDetails.append(el('summary',{},'Liever door AI laten schatten?'));
 aiDetails.append(note('Open ChatGPT met je beschrijving. Voeg je foto daar zelf toe en plak het antwoord hieronder terug. Dit gebruikt geen betaalde API; de limieten van je ChatGPT-abonnement gelden.'));
 const prompt=el('textarea',{id:'ai-prompt',readOnly:true,rows:3});prompt.setAttribute('aria-label','Opdracht voor ChatGPT');
 function updatePrompt(){prompt.value='Schat de totale macro’s van deze maaltijd'+(meal.mode==='high'?' aan de hoge kant':meal.mode==='low'?' aan de lage kant':'')+'. Beschrijving: '+JSON.stringify(description.value)+'. Als ik een foto toevoeg, gebruik die als extra context. Neem redelijke porties aan als gewichten ontbreken. Geef alleen één JSON-object zonder opmaak: {"protein": getal in gram, "carbs": getal in gram, "fat": getal in gram}. Dit zijn TOTALEN voor de hele maaltijd, niet per 100 g.';chat.href='https://chatgpt.com/?q='+encodeURIComponent(prompt.value)}
 const chat=el('a',{className:'dark-button chat-link',target:'_blank',rel:'noopener noreferrer'},'Open ChatGPT ↗');
 const copy=button('Kopieer opdracht',async()=>{try{await navigator.clipboard.writeText(prompt.value);message('Opdracht gekopieerd.')}catch{prompt.hidden=false;prompt.select();message('Kopieer de geselecteerde opdracht.')}});
 const aiActions=el('div',{className:'button-row'});aiActions.append(chat,copy);aiDetails.append(aiActions);prompt.hidden=true;aiDetails.append(prompt);
 const paste=el('textarea',{id:'ai-answer',rows:2,placeholder:'Plak hier het antwoord uit ChatGPT…',maxLength:5000});aiDetails.append(field('AI-antwoord',paste),button('Gebruik AI-schatting',()=>{try{const values=MealEstimator.readMacros(paste.value);meal.items=[{name:'AI-schatting hele maaltijd',grams:100,wholeMeal:true,...values}];meal.source='chatgpt';meal.estimatedDescription=description.value;meal.mode='exact';mode.value='exact';const stored=save();update();aiDetails.open=false;message(stored?'AI-schatting overgenomen, zonder extra marge.':'Opslaan lukt niet op dit toestel.')}catch(error){message(error.message)}},'dark-button'));
 body.append(aiDetails);
 // Keep less-used manual controls accessible without crowding the main flow.
 const manual=el('details',{className:'meal-more',id:'meal-manual'});manual.append(el('summary',{},'Zelf macro’s invullen'));
 const transferForm=el('form'),inputs={},controls=el('div',{className:'transfer-grid'});
 for(const [key,label]of [['protein','Eiwit (g)'],['carbs','Koolhydraten (g)'],['fat','Vet (g)']]){inputs[key]=el('input',{type:'number',min:0,max:1000,step:0.1,required:true});controls.append(field(label,inputs[key]))}
 const useTotals=el('button',{type:'submit',className:'dark-button'},'Gebruik maaltijdtotalen');transferForm.append(controls,useTotals);
 transferForm.onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,Number(input.value)]));if(Object.values(values).some(v=>!Number.isFinite(v)||v<0||v>1000))return message('Vul geldige macro’s tussen 0 en 1000 gram in.');meal.items=[{name:'Ingevoerde maaltijdtotalen',grams:100,wholeMeal:true,...values}];meal.mode='exact';mode.value='exact';meal.source='manual';meal.estimatedDescription=description.value;save();update();manual.open=false;message('Maaltijdtotalen bewaard.');};manual.append(transferForm);body.append(manual);
 updatePrompt();update();
}

renderTasks();
initializeJournal();
// A page left open overnight must show the new day's empty checklist.
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&localDate()!==today)location.reload()});
