/* Google Identity Services: access tokens stay in memory, never in browser storage. */
(function(){
 const scope='https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.calendarlist.readonly';
 const $=selector=>document.querySelector(selector);
 const node=(tag,props={},text)=>{const n=document.createElement(tag);Object.assign(n,props);if(text!==undefined)n.textContent=text;return n};
 const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 let options,selected=iso(new Date()),month=new Date(new Date().getFullYear(),new Date().getMonth(),1),client=null,token=null,expiresAt=0,expiryTimer=null,events=[],calendars=[],calendarId='primary',loading=false,initializing=null,requestVersion=0,controller=null;
 const dates=new Intl.DateTimeFormat('nl-BE',{weekday:'long',day:'numeric',month:'long'});
 function message(text){$('#calendar-status').textContent=text}
 function setConnected(connected){$('#calendar-connect').hidden=connected;$('#calendar-disconnect').hidden=!connected;$('#google-calendar-choice').hidden=!connected;$('#calendar-refresh').hidden=!connected;$('#calendar-account-state').textContent=connected?'Google Calendar gekoppeld':'Alleen je eigen notities';}
 function loseAccess(text){$('#calendar-connect').disabled=!client;token=null;expiresAt=0;clearTimeout(expiryTimer);requestVersion++;controller?.abort();events=[];calendars=[];calendarId='primary';$('#google-calendar-choice').replaceChildren();loading=false;setConnected(false);message(text);render()}
 function eventOnDate(event,date){
  if(event.start?.date){return event.start.date<=date&&date<(event.end?.date||event.start.date+'x')}
  const start=new Date(event.start?.dateTime),end=new Date(event.end?.dateTime||event.start?.dateTime),from=new Date(date+'T00:00:00'),to=new Date(from);to.setDate(to.getDate()+1);
  return !Number.isNaN(start.getTime())&&start<to&&(end>from||start.getTime()===from.getTime());
 }
 function render(){
  $('#calendar-month').textContent=new Intl.DateTimeFormat('nl-BE',{month:'long',year:'numeric'}).format(month);
  $('#calendar-selected-date').textContent=dates.format(new Date(selected+'T12:00:00'));
  $('#calendar-day-input').value=selected;
  const grid=$('#calendar-grid');grid.replaceChildren();const start=new Date(month);start.setDate(1-(month.getDay()+6)%7);
  const notes=options.getNotes();
  for(let i=0;i<42;i++){
   const date=new Date(start);date.setDate(start.getDate()+i);const key=iso(date),b=node('button',{type:'button',className:'calendar-cell'},String(date.getDate()));
   b.classList.toggle('outside',date.getMonth()!==month.getMonth());b.classList.toggle('is-today',key===iso(new Date()));b.classList.toggle('selected',key===selected);b.setAttribute('aria-label',dates.format(date));b.setAttribute('aria-pressed',String(key===selected));
   if(notes[key]?.text||notes[key]?.saved){b.append(node('span',{className:'calendar-dot local-dot'}));b.setAttribute('aria-label',b.getAttribute('aria-label')+', eigen notitie')}
   if(events.some(e=>eventOnDate(e,key)))b.append(node('span',{className:'calendar-dot google-dot'}));
   b.onclick=()=>selectDate(key);grid.append(b);
  }
  const list=$('#calendar-events');list.replaceChildren();
  const local=notes[selected];if(local&&(local.text||local.saved)){
   const card=node('article',{className:'agenda-event own-note'});card.append(node('span',{className:'section-kicker'},'MIJN NOTITIE'),node('p',{className:'agenda-note-text'},local.text||'Dagoverzicht opgeslagen.'));
   if(local.mood)card.append(node('span',{className:'agenda-event-meta'},'Stemming: '+local.mood));
   const edit=node('button',{type:'button',className:'secondary-button'},'Notitie bekijken / aanpassen');edit.onclick=()=>options.openNote(selected);card.append(edit);list.append(card);
  }
  const dayEvents=events.filter(e=>eventOnDate(e,selected)).sort((a,b)=>(a.start.dateTime||a.start.date).localeCompare(b.start.dateTime||b.start.date));
  for(const event of dayEvents){
   const card=node('article',{className:'agenda-event'});
   let time='Hele dag';if(event.start.dateTime){const format=new Intl.DateTimeFormat('nl-BE',{hour:'2-digit',minute:'2-digit'});time=format.format(new Date(event.start.dateTime));if(event.end?.dateTime)time+=' – '+format.format(new Date(event.end.dateTime))}
   card.append(node('span',{className:'agenda-event-time'},time),node('h3',{},event.summary||'(Zonder titel)'));
   if(event.location)card.append(node('p',{className:'agenda-event-meta'},event.location));
   // Never turn an arbitrary API value into an executable link.
   try{const url=new URL(event.htmlLink);if(url.protocol==='https:'&&['calendar.google.com','www.google.com'].includes(url.hostname))card.append(node('a',{href:url.href,target:'_blank',rel:'noopener noreferrer',className:'agenda-google-link'},'Open in Google Calendar ↗'))}catch{}
   list.append(card);
  }
  if(!dayEvents.length)list.append(node('p',{className:'detail-note'},loading?'Google-afspraken laden…':token?'Geen Google-afspraken voor deze dag.':'Koppel Google Calendar om je afspraken erbij te zien.'));
  $('#calendar-loading').hidden=!loading;
 }
 function selectDate(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00')))return;
  const next=new Date(date+'T12:00:00'),changed=next.getMonth()!==month.getMonth()||next.getFullYear()!==month.getFullYear();
  selected=date;month=new Date(next.getFullYear(),next.getMonth(),1);render();if(changed&&token)loadEvents();
 }
 async function google(path,signal){
  if(!token||Date.now()>=expiresAt){loseAccess('Je Google-sessie is verlopen. Koppel opnieuw om je afspraken te verversen.');throw Error('Sessie verlopen.')}
  const response=await fetch('https://www.googleapis.com/calendar/v3/'+path,{headers:{Authorization:'Bearer '+token},signal,cache:'no-store'});
  if(response.status===401){loseAccess('Je Google-sessie is verlopen. Koppel opnieuw.');throw Error('Sessie verlopen.')}
  if(!response.ok){let reason;try{const data=await response.json();reason=data.error?.errors?.[0]?.reason}catch{}if(reason==='accessNotConfigured')throw Error('De Google Calendar API is nog niet ingeschakeld voor deze koppeling.');if(response.status===403)throw Error('Google geeft geen toegang tot deze agenda. Controleer de verleende toestemming.');throw Error('Google Calendar is nu niet beschikbaar. Probeer opnieuw.')}
  return response.json();
 }
 async function loadEvents(){
  if(!token)return;controller?.abort();controller=new AbortController();const signal=controller.signal,version=++requestVersion;loading=true;events=[];render();message('Afspraken laden…');
  try{
   const from=new Date(month);from.setDate(1-(month.getDay()+6)%7);const to=new Date(from);to.setDate(to.getDate()+42);
   const query=new URLSearchParams({timeMin:from.toISOString(),timeMax:to.toISOString(),singleEvents:'true',orderBy:'startTime',maxResults:'2500'});
   let items=[],pageToken='';
   do{if(pageToken)query.set('pageToken',pageToken);const data=await google('calendars/'+encodeURIComponent(calendarId)+'/events?'+query,signal);items.push(...(data.items||[]));pageToken=data.nextPageToken||''}while(pageToken&&version===requestVersion);
   if(version!==requestVersion)return;events=items.filter(e=>e.status!=='cancelled'&&(e.start?.date||e.start?.dateTime));message('Afspraken bijgewerkt. Alleen lezen; er wordt niets aan Google gewijzigd.');
  }catch(error){if(error.name!=='AbortError'&&version===requestVersion)message(error.message)}finally{if(version===requestVersion){loading=false;render()}}
 }
 async function loadCalendarList(){
  const version=requestVersion;try{
   let items=[],pageToken='';do{const query=new URLSearchParams({maxResults:'250'});if(pageToken)query.set('pageToken',pageToken);const data=await google('users/me/calendarList?'+query);items.push(...(data.items||[]));pageToken=data.nextPageToken||''}while(pageToken&&version===requestVersion);
   if(version!==requestVersion||!token)return;calendars=items;const select=$('#google-calendar-choice');select.replaceChildren();
   if(!calendars.some(c=>c.primary))select.append(node('option',{value:'primary'},'Mijn primaire agenda'));
   for(const calendar of calendars)select.append(node('option',{value:calendar.id},calendar.summary||'Agenda'));
   calendarId=calendars.find(c=>c.primary)?.id||'primary';select.value=calendarId;loadEvents();
  }catch(error){if(version===requestVersion&&token){message(error.message);loading=false;render()}}
 }
 function handleToken(response){
  $('#calendar-connect').disabled=false;
  if(response.error||!response.access_token){loseAccess('Koppelen is niet gelukt of werd geannuleerd. Je kunt het opnieuw proberen.');return}
  if(!window.google.accounts.oauth2.hasGrantedAllScopes(response,...scope.split(' '))){loseAccess('Niet alle leesrechten zijn verleend. Koppel opnieuw en geef toegang tot je agenda’s en afspraken.');return}
  token=response.access_token;expiresAt=Date.now()+Number(response.expires_in||3600)*1000;clearTimeout(expiryTimer);expiryTimer=setTimeout(()=>loseAccess('Je Google-sessie is verlopen. Koppel opnieuw om afspraken op te halen.'),Math.max(1000,expiresAt-Date.now()));setConnected(true);requestVersion++;loadCalendarList();
 }
 async function prepareGoogle(){
  if(initializing)return initializing;
  initializing=(async()=>{
   const connect=$('#calendar-connect');connect.disabled=true;connect.textContent='Koppeling controleren…';
   try{
    const response=await fetch('/api/calendar-config',{cache:'no-store'});if(!response.ok)throw Error('De Google-koppeling kan hier niet geladen worden. Je eigen notities blijven beschikbaar.');
    const config=await response.json();if(!config.clientId){message('Google Calendar is nog niet ingesteld voor deze app. Je eigen notities kun je al bekijken.');$('#calendar-setup-note').hidden=false;connect.textContent='Google nog niet ingesteld';return}
    await new Promise((resolve,reject)=>{if(window.google?.accounts?.oauth2)return resolve();const script=node('script',{src:'https://accounts.google.com/gsi/client',async:true});const timeout=setTimeout(()=>reject(Error('Google laden duurt te lang. Probeer opnieuw.')),15000);script.onload=()=>{clearTimeout(timeout);resolve()};script.onerror=()=>{clearTimeout(timeout);script.remove();reject(Error('Google kon niet geladen worden. Controleer je verbinding.'))};document.head.append(script)});
    client=window.google.accounts.oauth2.initTokenClient({client_id:config.clientId,scope,callback:handleToken,error_callback:()=>{connect.disabled=false;message('Het Google-venster is gesloten of geblokkeerd. Probeer opnieuw.')}});
    connect.disabled=false;connect.textContent='Koppel Google Calendar';message('Je agenda wordt alleen gelezen. Alleen na jouw toestemming worden afspraken opgehaald.');
   }catch(error){initializing=null;connect.disabled=false;connect.textContent='Opnieuw proberen';message(error.message)}
  })();return initializing;
 }
 window.CalendarApp={
  init(config){
   options=config;$('#calendar-connect').onclick=()=>{if(!client){prepareGoogle();return}$('#calendar-connect').disabled=true;try{client.requestAccessToken({prompt:token?'':'consent'})}catch{$('#calendar-connect').disabled=false;message('Google kon niet geopend worden. Sta pop-ups toe en probeer opnieuw.')}};
   $('#calendar-disconnect').onclick=()=>{const previous=token;loseAccess('Google Calendar ontkoppeld. Je lokale notities zijn behouden.');if(previous)window.google?.accounts?.oauth2?.revoke(previous,()=>{})};
   $('#calendar-refresh').onclick=loadEvents;
   $('#google-calendar-choice').onchange=e=>{calendarId=e.target.value;loadEvents()};
   $('#calendar-day-input').onchange=e=>selectDate(e.target.value);
   $('#calendar-today').onclick=()=>selectDate(iso(new Date()));
   for(const [selector,offset]of [['#calendar-prev',-1],['#calendar-next',1]])$(selector).onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+offset,1);selected=iso(month);render();if(token)loadEvents()};
   $('#calendar-add-note').onclick=()=>options.openNote(selected);setConnected(false);render();
  },
  show(){render();prepareGoogle()},
  refreshNotes(){if(options)render()}
 };
})();
