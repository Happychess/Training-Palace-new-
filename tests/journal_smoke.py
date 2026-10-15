"""Browser checks for the single dated-notes panel. Requires Playwright/Chromium."""
import os
from pathlib import Path
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright
url=os.environ.get('PALACE_TEST_URL','http://127.0.0.1:3003')
artifacts=Path('/workspace/artifacts');artifacts.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':1000},timezone_id='Europe/Brussels')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.clock.install(time=datetime(2026,10,15,10,0,tzinfo=timezone.utc))
 page.goto(url,wait_until='networkidle')
 assert page.locator('#journal').count()==0
 assert page.locator('nav [data-page=journal]').count()==0
 assert page.locator('#open-journal').count()==0
 page.evaluate("()=>localStorage.setItem('training-palace-v1',JSON.stringify({days:{},journal:{'2026-10-15':'Bestaande notitie','2026-10-01':'Oude dagboektekst'},savedDays:{'2026-10-02':{mood:'Goed',tasks:[{title:'Bestaande oude taak',done:true}],text:'Bestaande opgeslagen dag',savedAt:'2026-10-02T18:00:00Z'}}}))")
 page.reload(wait_until='networkidle')
 assert page.locator('#today-journal-text').input_value()=='Bestaande notitie'
 page.get_by_role('button',name='Goed',exact=True).click()
 page.locator('#task-list .task input').first.check()
 text='Vandaag een kleine stap gezet. <script>geen code</script>'
 page.locator('#today-journal-text').fill(text)
 page.locator('#save-today').click()
 saved=page.evaluate("JSON.parse(localStorage.getItem('training-palace-v1')).savedDays")
 assert saved['2026-10-15']['mood']=='Goed' and saved['2026-10-15']['tasks'][0]['done']
 page.get_by_role('button',name='Zwaar',exact=True).click()
 page.locator('#task-list .task input').first.uncheck()
 page.locator('#today-journal-text').fill('Nieuwe concepttekst')
 assert 'wijzigingen' in page.locator('#today-save-status').inner_text()
 page.locator('#saved-note-details > summary').click()
 assert 'Stemming: Goed' in page.locator('#saved-day-view').inner_text()
 assert text in page.locator('#saved-day-view').inner_text()
 assert page.locator('#saved-day-view script').count()==0
 with page.expect_download() as download:
  page.locator('#export').click()
 exported=Path(download.value.path()).read_text()
 assert 'Stemming: Goed' in exported and '[x] Rustig aan mijn dag beginnen' in exported
 assert text in exported and 'Nieuwe concepttekst' in exported and 'Oude dagboektekst' in exported
 page.locator('#save-today').click()
 page.locator('#note-previous').click() # Yesterday has no data: don't copy today's tasks or mood.
 assert page.locator('#journal-date').input_value()=='2026-10-14'
 assert page.locator('#today-journal-text').input_value()==''
 assert '0 van 0' in page.locator('#today-save-preview').inner_text()
 page.locator('#today-journal-text').fill('Gisteren vergeten op te schrijven.')
 page.locator('#past-day-edit summary').click()
 page.locator('#past-day-mood').select_option('Oké')
 page.locator('#past-task-title').fill('Kattenbakken gisteren')
 page.locator('#past-add-task button').click()
 page.locator('#past-day-tasks input').check()
 page.locator('#save-today').click()
 saved=page.evaluate("JSON.parse(localStorage.getItem('training-palace-v1')).savedDays")
 assert saved['2026-10-14']['mood']=='Oké'
 assert len(saved['2026-10-14']['tasks'])==1 and saved['2026-10-14']['tasks'][0]['done']
 assert saved['2026-10-15']['mood']=='Zwaar' and not saved['2026-10-15']['tasks'][0]['done']
 assert page.get_by_role('button',name='Zwaar',exact=True).get_attribute('aria-pressed')=='true'
 page.locator('#journal-date').fill('2026-10-01');page.locator('#journal-date').dispatch_event('change')
 assert page.locator('#today-journal-text').input_value()=='Oude dagboektekst'
 page.locator('#journal-date').fill('2026-10-02');page.locator('#journal-date').dispatch_event('change')
 assert page.locator('#today-journal-text').input_value()=='Bestaande opgeslagen dag'
 assert '1 van 1' in page.locator('#today-save-preview').inner_text()
 page.locator('#past-day-edit summary').click()
 assert page.locator('#past-day-tasks input').is_checked()
 page.locator('#note-today').click()
 assert page.locator('#today-journal-text').input_value()=='Nieuwe concepttekst'
 page.locator('#note-next').click()
 assert page.locator('#journal-date').input_value()=='2026-10-16'
 assert page.locator('#past-day-edit').is_hidden()
 page.locator('#today-journal-text').fill('Tandarts om 14 uur; trainingskleren klaarleggen.')
 page.locator('#save-today').click()
 saved=page.evaluate("JSON.parse(localStorage.getItem('training-palace-v1')).savedDays")
 assert saved['2026-10-16']['kind']=='plan' and saved['2026-10-16']['tasks']==[]
 assert saved['2026-10-16']['mood'] is None
 page.reload(wait_until='networkidle')
 page.locator('#note-next').click()
 assert 'Tandarts' in page.locator('#today-journal-text').input_value()
 page.locator('#journal-history-panel summary').click()
 assert page.locator('.saved-day-card').count()==5
 page.locator('.saved-day-card').filter(has_text='14 oktober 2026').click()
 assert page.locator('#journal-date').input_value()=='2026-10-14'
 assert page.locator('#today-journal-text').input_value()=='Gisteren vergeten op te schrijven.'
 assert '1 van 1' in page.locator('#today-save-preview').inner_text()
 page.locator('.today-journal').scroll_into_view_if_needed()
 page.screenshot(path=str(artifacts/'training-palace-dated-notes.png'))
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(artifacts/'training-palace-dated-notes-mobile.png'))
 # The next day loads its prewritten note; today's real tasks/mood stay separate from a planned note.
 page.clock.fast_forward(24*60*60*1000);page.reload(wait_until='networkidle')
 assert page.locator('#journal-date').input_value()=='2026-10-16'
 assert 'Tandarts' in page.locator('#today-journal-text').input_value()
 assert page.locator('#past-day-edit').is_hidden()
 assert '0 van 6' in page.locator('#today-save-preview').inner_text()
 page.locator('#save-today').click()
 saved=page.evaluate("JSON.parse(localStorage.getItem('training-palace-v1')).savedDays")
 assert saved['2026-10-16']['kind']=='day' and len(saved['2026-10-16']['tasks'])==6
 page.evaluate("()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')};}")
 page.locator('#today-journal-text').fill('Nog niet opgeslagen')
 page.locator('#save-today').click()
 assert 'mislukt' in page.locator('#today-save-status').inner_text()
 assert page.locator('#storage-error').is_visible()
 assert not errors,errors
 print('PASS: no separate journal, legacy text/snapshots, yesterday corrections isolated from today, future notes, date navigation/history, export, draft persistence, next-day plans, mobile layout and storage failures.')
 browser.close()
