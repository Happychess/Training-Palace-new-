"""Play both canvas games through actual keyboard, pointer, pause and browser storage flows."""
import os
from pathlib import Path
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright
url=os.environ.get('PALACE_TEST_URL','http://127.0.0.1:3003')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1280,'height':1000},timezone_id='Europe/Brussels')
 page=context.new_page();page.add_init_script('Math.random=()=>0.5')
 page.clock.install(time=datetime(2026,10,15,10,0,tzinfo=timezone.utc))
 errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(url,wait_until='networkidle')
 page.locator('#today-journal-text').fill('Mijn notitie blijft behouden tijdens het spelen.')
 page.locator('#save-today').click()
 page.locator('nav [data-page=games]').click()
 assert page.locator('#games').is_visible() and page.locator('#today').is_hidden()
 assert page.locator('[data-game]').count()==2
 assert page.locator('#game-stage').get_attribute('data-state')=='ready'
 page.locator('#game-start').click();page.clock.run_for(600)
 assert int(page.locator('#game-score').inner_text())>0
 page.keyboard.press('Space');page.clock.run_for(100)
 page.screenshot(path='/workspace/artifacts/training-palace-games-runner.png')
 page.locator('#game-pause').click()
 frozen=page.locator('#game-score').inner_text();page.clock.run_for(1500)
 assert page.locator('#game-score').inner_text()==frozen
 assert page.locator('#game-stage').get_attribute('data-state')=='paused'
 page.locator('nav [data-page=today]').click();page.locator('nav [data-page=games]').click()
 assert page.locator('#game-stage').get_attribute('data-state')=='paused'
 page.locator('#game-start').click();page.clock.run_for(6000)
 assert page.locator('#game-stage').get_attribute('data-state')=='over'
 assert int(page.locator('#runner-record').inner_text())>0
 record=page.locator('#runner-record').inner_text()
 page.reload(wait_until='networkidle');page.locator('nav [data-page=games]').click()
 assert page.locator('#runner-record').inner_text()==record
 page.locator('#game-start').click();page.clock.run_for(200)
 page.locator('nav [data-page=today]').click();page.locator('nav [data-page=games]').click()
 assert page.locator('#game-stage').get_attribute('data-state')=='paused'
 page.locator('[data-game=flappy]').click()
 assert page.locator('#game-title').inner_text()=='Flappy Palace'
 # All assets are already loaded; neither game needs a network while playing.
 context.set_offline(True)
 for _ in range(8):
  page.locator('#game-canvas').dispatch_event('pointerdown',{'pointerType':'touch'})
  page.clock.run_for(650)
 assert page.locator('#game-stage').get_attribute('data-state')=='running'
 assert int(page.locator('#game-score').inner_text())>=1
 page.screenshot(path='/workspace/artifacts/training-palace-games-flappy.png')
 page.clock.run_for(3000)
 assert page.locator('#game-stage').get_attribute('data-state')=='over'
 assert int(page.locator('#flappy-record').inner_text())>=1
 context.set_offline(False)
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#game-start').click();page.clock.run_for(200)
 page.evaluate("()=>window.dispatchEvent(new Event('blur'))")
 assert page.locator('#game-stage').get_attribute('data-state')=='paused'
 page.locator('#game-stage').scroll_into_view_if_needed()
 page.screenshot(path='/workspace/artifacts/training-palace-games-mobile.png')
 page.locator('nav [data-page=today]').click()
 assert page.locator('#today-journal-text').input_value()=='Mijn notitie blijft behouden tijdens het spelen.'
 assert not errors,errors
 print('PASS: playable runner and flappy, keyboard/touch, scoring and game over, pause/resume, tab/window auto-pause, persistent records, offline play after loading, note isolation and mobile layout.')
 browser.close()
