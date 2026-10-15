"""Calendar UI tests. OAuth and Google API responses are simulated, never live user data."""
import os,json
from pathlib import Path
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright
url=os.environ.get('PALACE_TEST_URL','http://127.0.0.1:3003')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':1000},timezone_id='Europe/Brussels')
 page.clock.install(time=datetime(2026,10,15,10,0,tzinfo=timezone.utc))
 errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(url,wait_until='networkidle')
 page.locator('#note-next').click();page.locator('#today-journal-text').fill('Voorbereiden voor vrijdag');page.locator('#save-today').click()
 page.locator('nav [data-page=agenda]').click()
 page.wait_for_function("document.querySelector('#calendar-status').textContent.includes('nog niet ingesteld')")
 assert page.locator('#agenda').is_visible() and page.locator('#today').is_hidden()
 assert page.locator('#calendar-connect').is_disabled()
 assert page.locator('.calendar-cell').count()==42
 page.locator('#calendar-day-input').fill('2026-10-16');page.locator('#calendar-day-input').dispatch_event('change')
 assert 'Voorbereiden voor vrijdag' in page.locator('#calendar-events').inner_text()
 page.get_by_role('button',name='Notitie bekijken / aanpassen').click()
 assert page.locator('#today').is_visible() and page.locator('#journal-date').input_value()=='2026-10-16'
 # Configured route with GIS simulated locally.
 page.route('**/api/calendar-config',lambda route:route.fulfill(json={'clientId':'test.apps.googleusercontent.com'}))
 gis='''window.google={accounts:{oauth2:{initTokenClient:config=>({requestAccessToken:()=>config.callback({access_token:'test-memory-only',expires_in:3600,scope:config.scope})}),hasGrantedAllScopes:()=>true,revoke:()=>{throw Error('Do not revoke a shared Google grant')}}}};'''
 page.route('https://accounts.google.com/gsi/client',lambda route:route.fulfill(body=gis,content_type='text/javascript'))
 api_requests=[]
 def api(route):
  api_requests.append(route.request)
  assert route.request.headers.get('authorization')=='Bearer test-memory-only'
  if route.request.url.endswith('/colors'):route.fulfill(json={'event':{'3':{'background':'#dbadff','foreground':'#000000'}}})
  elif '/calendarList?' in route.request.url:route.fulfill(json={'items':[{'id':'own@example.com','summary':'Mijn agenda','primary':True,'backgroundColor':'#16a765'},{'id':'work@example.com','summary':'Werk','backgroundColor':'#4986e7'}]})
  elif 'work%40' in route.request.url:route.fulfill(json={'items':[{'id':'work','summary':'Werkoverleg','start':{'dateTime':'2026-10-15T10:00:00+02:00'},'end':{'dateTime':'2026-10-15T11:00:00+02:00'}}]})
  else:route.fulfill(json={'items':[
   {'id':'one','colorId':'3','summary':'Schaaktraining <script>geen code</script>','start':{'dateTime':'2026-10-15T13:00:00+02:00'},'end':{'dateTime':'2026-10-15T14:00:00+02:00'},'htmlLink':'https://calendar.google.com/calendar/event?eid=one'},
   {'id':'two','summary':'Meerdaagse afspraak','start':{'date':'2026-10-15'},'end':{'date':'2026-10-17'}},
   {'id':'three','summary':'Nachtshift','start':{'dateTime':'2026-10-15T23:00:00+02:00'},'end':{'dateTime':'2026-10-16T02:00:00+02:00'},'htmlLink':'javascript:alert(1)'},
   {'id':'cancel','status':'cancelled','summary':'Geannuleerd','start':{'date':'2026-10-15'},'end':{'date':'2026-10-16'}}]})
 page.route('https://www.googleapis.com/calendar/v3/**',api)
 page.reload(wait_until='networkidle');page.locator('nav [data-page=agenda]').click()
 page.get_by_role('button',name='Koppel Google Calendar').click()
 page.get_by_text('Schaaktraining <script>geen code</script>',exact=True).wait_for()
 assert page.locator('#calendar-events .agenda-event').filter(has_text='Schaaktraining').evaluate('(el)=>el.style.backgroundColor')=='rgb(219, 173, 255)'
 assert page.locator('#calendar-events script').count()==0
 assert page.locator('#calendar-events a').count()==1
 assert 'Geannuleerd' not in page.locator('#calendar-events').inner_text()
 assert page.locator('#google-calendar-choice option').count()==2
 assert any('showHidden=true' in req.url and 'minAccessRole=reader' in req.url for req in api_requests)
 page.locator('#calendar-day-input').fill('2026-10-16');page.locator('#calendar-day-input').dispatch_event('change')
 assert 'Meerdaagse afspraak' in page.locator('#calendar-events').inner_text()
 assert 'Nachtshift' in page.locator('#calendar-events').inner_text()
 assert 'Voorbereiden voor vrijdag' in page.locator('#calendar-events').inner_text()
 page.locator('#calendar-day-input').fill('2026-10-17');page.locator('#calendar-day-input').dispatch_event('change')
 assert 'Meerdaagse afspraak' not in page.locator('#calendar-events').inner_text()
 page.locator('#google-calendar-choice').select_option('work@example.com')
 page.locator('#calendar-today').click()
 page.get_by_text('Werkoverleg',exact=True).wait_for()
 # Memory-only tokens and Google event bodies never enter persistent storage.
 stored=page.evaluate('JSON.stringify({...localStorage,...sessionStorage})')
 assert 'test-memory-only' not in stored and 'Werkoverleg' not in stored and 'Nachtshift' not in stored
 page.screenshot(path='/workspace/artifacts/training-palace-agenda.png')
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/workspace/artifacts/training-palace-agenda-mobile.png',full_page=True)
 page.locator('#calendar-disconnect').click()
 assert 'Werkoverleg' not in page.locator('#calendar-events').inner_text()
 assert page.locator('#calendar-disconnect').is_hidden()
 page.route('https://www.googleapis.com/calendar/v3/**',lambda route:route.fulfill(status=500,json={'error':{'message':'Unavailable'}}))
 page.get_by_role('button',name='Koppel Google Calendar').click()
 page.wait_for_function("document.querySelector('#calendar-events').textContent.includes('konden niet geladen worden')")
 assert 'Geen Google-afspraken voor deze dag.' not in page.locator('#calendar-events').inner_text()
 page.locator('#calendar-disconnect').click()
 # Expired/denied access is visible, never silently reported as an empty successful agenda.
 page.route('https://www.googleapis.com/calendar/v3/**',lambda route:route.fulfill(status=401,json={'error':{'message':'Expired'}}))
 page.get_by_role('button',name='Koppel Google Calendar').click()
 page.wait_for_function("document.querySelector('#calendar-status').textContent.includes('verlopen')")
 assert page.locator('#calendar-disconnect').is_hidden()
 page.evaluate('()=>{window.google.accounts.oauth2.hasGrantedAllScopes=()=>false}')
 page.get_by_role('button',name='Koppel Google Calendar').click()
 assert 'Niet alle leesrechten' in page.locator('#calendar-status').inner_text()
 assert page.locator('#calendar-disconnect').is_hidden()
 assert not errors,errors
 print('PASS: agenda tab, local notes, unconfigured state, mocked OAuth, calendar choice, events, all-day/cross-midnight dates, XSS safety, memory-only access, disconnect/expiry and mobile layout. No live OAuth was tested.')
 browser.close()
