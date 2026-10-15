"""Browser validation for daily journal snapshots. Requires Playwright and Chromium."""
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
 today=page.evaluate("(()=>{let d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})()")
 page.evaluate("([today])=>localStorage.setItem('training-palace-v1',JSON.stringify({days:{},journal:{[today]:'Bestaande notitie','2026-10-01':'Oude dagboektekst'}}))",[today])
 page.reload(wait_until='networkidle')
 assert page.locator('#today-journal-text').input_value()=='Bestaande notitie'
 page.get_by_role('button',name='Goed',exact=True).click()
 page.locator('#task-list .task input').first.check()
 text='Vandaag een kleine stap gezet. <script>geen code</script>'
 page.locator('#today-journal-text').fill(text)
 page.reload(wait_until='networkidle')
 assert page.locator('#today-journal-text').input_value()==text
 page.locator('#save-today').click()
 assert 'Vandaag opgeslagen' in page.locator('#today-save-status').inner_text()
 saved=page.evaluate("JSON.parse(localStorage.getItem('training-palace-v1')).savedDays")
 assert saved[today]['mood']=='Goed'
 assert saved[today]['tasks'][0]['done']
 assert saved[today]['text']==text
 # Later changes remain drafts until explicitly updating today's saved snapshot.
 page.get_by_role('button',name='Zwaar',exact=True).click()
 page.locator('#task-list .task input').first.uncheck()
 page.locator('#today-journal-text').fill('Nieuwe concepttekst')
 assert 'wijzigingen' in page.locator('#today-save-status').inner_text()
 page.locator('nav [data-page=journal]').click()
 assert page.locator('#saved-day-view').inner_text().find('Stemming: Goed')>=0
 assert text in page.locator('#saved-day-view').inner_text()
 assert page.locator('#saved-day-view script').count()==0
 assert page.locator('#journal-text').input_value()=='Nieuwe concepttekst'
 with page.expect_download() as download:
  page.locator('#export').click()
 exported=Path(download.value.path()).read_text()
 assert 'Stemming: Goed' in exported and '[x] Rustig aan mijn dag beginnen' in exported
 assert text in exported and 'Nieuwe concepttekst' in exported and 'Oude dagboektekst' in exported
 page.locator('#journal-date').fill('2026-10-01');page.locator('#journal-date').dispatch_event('change')
 assert page.locator('#journal-text').input_value()=='Oude dagboektekst'
 page.locator('nav [data-page=today]').click()
 page.locator('#save-today').click() # Must save today even while journal selected another date.
 saved=page.evaluate("JSON.parse(localStorage.getItem('training-palace-v1')).savedDays")
 assert saved[today]['mood']=='Zwaar' and not saved[today]['tasks'][0]['done']
 assert saved[today]['text']=='Nieuwe concepttekst' and '2026-10-01' not in saved
 page.locator('#open-journal').click()
 assert 'Stemming: Zwaar' in page.locator('#saved-day-view').inner_text()
 page.locator('#journal-edit summary').click()
 page.locator('#journal-text').fill('Via dagboek bijgewerkt')
 assert page.locator('#today-journal-text').input_value()=='Via dagboek bijgewerkt'
 page.locator('#save-journal-day').click()
 page.reload(wait_until='networkidle')
 assert page.locator('#today-journal-text').input_value()=='Via dagboek bijgewerkt'
 page.clock.fast_forward(24*60*60*1000)
 page.reload(wait_until='networkidle')
 assert page.locator('#today-journal-text').input_value()==''
 page.locator('#today-journal-text').fill('Een nieuwe dag')
 page.locator('#save-today').click() # No mood selected: valid entry with empty mood.
 page.locator('nav [data-page=journal]').click()
 assert page.locator('.saved-day-card').count()==2
 assert 'Niet ingevuld' in page.locator('#saved-day-view').inner_text()
 page.locator('.saved-day-card').nth(1).click()
 assert 'Via dagboek bijgewerkt' in page.locator('#saved-day-view').inner_text()
 assert 'Stemming: Zwaar' in page.locator('#saved-day-view').inner_text()
 page.screenshot(path=str(artifacts/'training-palace-saved-day.png'))
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('nav [data-page=today]').click()
 page.locator('.today-journal').scroll_into_view_if_needed()
 page.screenshot(path=str(artifacts/'training-palace-daily-journal-mobile.png'))
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # A storage failure must never report a successful daily save or keep a phantom snapshot.
 page.evaluate("() => { Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')}; }")
 page.locator('#today-journal-text').fill('Nog niet opgeslagen')
 page.locator('#save-today').click()
 assert 'mislukt' in page.locator('#today-save-status').inner_text()
 assert page.locator('#storage-error').is_visible()
 assert not errors,errors
 print('PASS: legacy journal preserved, local drafts, mood/task/text snapshots, explicit updates, date selection, export, next-day history, mobile layout, and storage failures.')
 browser.close()
