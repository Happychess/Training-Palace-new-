"""Exercise hold/release controls in a browser, then pass a bird using actual keys."""
import os
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright

url=os.environ.get('PALACE_TEST_URL','http://127.0.0.1:3003')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':1000})
 page.add_init_script('Math.random=()=>0.5')
 page.clock.install(time=datetime(2026,10,15,10,0,tzinfo=timezone.utc))
 errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(url,wait_until='networkidle')
 page.locator('nav [data-page=games]').click()
 stage=page.locator('#game-stage');duck=page.locator('#game-duck')
 page.locator('#game-start').click();page.clock.run_for(100)
 def crouched(value):
  assert stage.get_attribute('data-ducking')==str(value).lower()
  assert duck.get_attribute('aria-pressed')==str(value).lower()
 page.keyboard.down('ArrowDown');crouched(True)
 page.clock.run_for(100);page.keyboard.up('ArrowDown');crouched(False)
 # Captured mouse input must release even if the pointer leaves the button.
 duck.hover();page.mouse.down();crouched(True)
 page.mouse.move(5,5);page.mouse.up();crouched(False)
 # Separate sources: releasing a pointer must not cancel a held keyboard key.
 page.keyboard.down('ArrowDown');crouched(True)
 duck.dispatch_event('pointerdown',{'pointerId':31,'button':0,'pointerType':'touch'})
 duck.dispatch_event('pointercancel',{'pointerId':31,'pointerType':'touch'})
 crouched(True);page.keyboard.up('ArrowDown');crouched(False)
 duck.focus();page.keyboard.down('Enter');crouched(True)
 page.keyboard.up('Enter');crouched(False)
 stage.focus();page.keyboard.down('ArrowDown');page.locator('#game-pause').click()
 assert stage.get_attribute('data-state')=='paused';crouched(False)
 page.keyboard.up('ArrowDown');page.locator('#game-start').click();crouched(False)
 page.keyboard.down('ArrowDown');crouched(True)
 page.evaluate("window.dispatchEvent(new Event('blur'))")
 assert stage.get_attribute('data-state')=='paused';crouched(False)
 page.keyboard.up('ArrowDown');page.locator('#game-start').click()
 page.keyboard.down('ArrowDown');page.locator('nav [data-page=today]').click()
 page.keyboard.up('ArrowDown');page.locator('nav [data-page=games]').click()
 assert stage.get_attribute('data-state')=='paused';crouched(False)
 page.locator('[data-game=flappy]').click();assert duck.is_hidden()
 page.locator('[data-game=runner]').click();assert duck.is_visible()
 # Observe the simulation in this test only; all control still uses browser keys.
 page.evaluate('''() => {
  const step=PalaceGamesEngine.Runner.prototype.step;
  PalaceGamesEngine.Runner.prototype.step=function(dt){step.call(this,dt);window.testRunner=this};
 }''')
 page.locator('#game-start').click();page.clock.run_for(50)
 held=False;passed_bird=False;screenshot=False
 for _ in range(200):
  state=page.evaluate('''() => {
   const g=window.testRunner,p=g.player;
   return {over:g.over,obstacle:g.obstacles.find(o=>o.x+o.w>p.x+7),x:p.x};
  }''')
  assert not state['over'],'Runner collided during mixed jumping/ducking'
  obstacle=state.get('obstacle');want_duck=bool(obstacle and obstacle['type']=='bird' and obstacle['x']-state['x']<200)
  if want_duck!=held:
   (page.keyboard.down if want_duck else page.keyboard.up)('ArrowDown');held=want_duck
  if obstacle and obstacle['type']=='cactus' and obstacle['x']-state['x']<140:
   page.keyboard.press('Space')
  if want_duck:
   crouched(True)
   if not screenshot:
    page.screenshot(path='/workspace/artifacts/training-palace-dino-duck.png');screenshot=True
  elif screenshot:
   passed_bird=True;break
  page.clock.run_for(50)
 assert passed_bird and int(page.locator('#game-score').inner_text())>50
 # Mobile controls must fit and a cancelled touch must release the crouch.
 page.set_viewport_size({'width':390,'height':844})
 duck.dispatch_event('pointerdown',{'pointerId':55,'button':0,'pointerType':'touch'});crouched(True)
 duck.dispatch_event('pointercancel',{'pointerId':55,'pointerType':'touch'});crouched(False)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('.game-controls').scroll_into_view_if_needed()
 page.screenshot(path='/workspace/artifacts/training-palace-dino-duck-mobile.png')
 page.set_viewport_size({'width':320,'height':720})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS: duck keyboard/button/touch, independent held inputs, pointer release/cancel, pause/blur/tab clearing, Flappy controls, mixed cactus/bird play and 390/320px layouts.')
 browser.close()
