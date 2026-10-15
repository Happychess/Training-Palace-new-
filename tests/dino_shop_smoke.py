"""Earn coins through actual gameplay and exercise skin purchases and durable progress."""
import os
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright

url=os.environ.get('PALACE_TEST_URL','http://127.0.0.1:3003')
key='training-palace-games-v1'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1280,'height':1100},timezone_id='Europe/Brussels',has_touch=True)
 page=context.new_page();page.add_init_script('Math.random=()=>0.5')
 page.clock.install(time=datetime(2026,10,15,10,0,tzinfo=timezone.utc))
 errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(url,wait_until='networkidle')
 page.evaluate('(key)=>localStorage.setItem(key,JSON.stringify({runner:123,flappy:7}))',key)
 page.reload(wait_until='networkidle')
 page.locator('#today-journal-text').fill('Mijn notities blijven van mij.')
 page.locator('#save-today').click();page.locator('nav [data-page=games]').click()
 assert page.locator('#runner-record').inner_text()=='123'
 assert page.locator('#flappy-record').inner_text()=='7'
 assert page.locator('#shop-wallet').inner_text()=='0'
 assert page.locator('[data-skin-action=mint]').is_disabled()
 # Five new runs, three real pickups each; pause/resume must not bank them twice.
 for run in range(5):
  if run:page.locator('[data-game=runner]').click()
  page.locator('#game-start').click();page.clock.run_for(1250)
  assert page.locator('#game-coins').inner_text()=='3'
  assert page.locator('#shop-wallet').inner_text()==str((run+1)*3)
  page.locator('#game-pause').click();page.locator('#game-start').click();page.clock.run_for(80)
  page.locator('#game-pause').click()
  assert page.locator('#shop-wallet').inner_text()==str((run+1)*3)
 assert page.locator('[data-skin-action=mint]').is_enabled()
 page.locator('#dino-shop').scroll_into_view_if_needed()
 page.screenshot(path='/workspace/artifacts/training-palace-skin-shop.png')
 page.locator('[data-skin-action=mint]').click()
 assert page.locator('#shop-wallet').inner_text()=='0'
 assert 'Mint Move gekocht' in page.locator('#shop-status').inner_text()
 assert 'equipped' in page.locator('[data-skin=mint]').get_attribute('class')
 # The rendered dinosaur uses the purchased color, not just the card preview.
 pixel=page.evaluate("Array.from(document.querySelector('#game-canvas').getContext('2d').getImageData(112,282,1,1).data)")
 assert pixel[:3]==[119,210,184],pixel
 page.reload(wait_until='networkidle');page.locator('nav [data-page=games]').click()
 assert page.locator('#shop-wallet').inner_text()=='0'
 assert page.locator('[data-skin-action=mint]').is_disabled()
 assert page.locator('#runner-record').inner_text()=='123'
 assert page.locator('#flappy-record').inner_text()=='7'
 page.locator('[data-skin-action=classic]').click();page.locator('[data-skin-action=mint]').click()
 assert page.locator('#shop-wallet').inner_text()=='0'
 assert page.locator('[data-skin-action=royal]').is_disabled()
 # A key-held crouch plus jump produces a super jump and still lands normally.
 page.locator('#game-start').click();page.clock.run_for(100)
 page.keyboard.down('ArrowDown');assert page.locator('#game-action').inner_text()=='Super ↑'
 page.keyboard.press('Space');assert page.locator('#game-stage').get_attribute('data-super-jump')=='true'
 page.keyboard.up('ArrowDown');page.clock.run_for(450)
 page.screenshot(path='/workspace/artifacts/training-palace-dino-super-jump.png')
 page.clock.run_for(550)
 assert page.locator('#game-stage').get_attribute('data-super-jump')=='false'
 # Real two-finger input on a mobile viewport: hold crouch and tap jump.
 page.set_viewport_size({'width':390,'height':844})
 page.locator('#game-pause').click();page.locator('[data-game=runner]').click()
 page.locator('#game-start').click();page.clock.run_for(100)
 page.locator('.game-controls').scroll_into_view_if_needed()
 duck=page.locator('#game-duck').bounding_box();jump=page.locator('#game-action').bounding_box()
 first={'x':duck['x']+duck['width']/2,'y':duck['y']+duck['height']/2,'id':1}
 second={'x':jump['x']+jump['width']/2,'y':jump['y']+jump['height']/2,'id':2}
 cdp=context.new_cdp_session(page)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[first]})
 assert page.locator('#game-stage').get_attribute('data-ducking')=='true'
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[first,second]})
 assert page.locator('#game-stage').get_attribute('data-super-jump')=='true'
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[first]})
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert page.locator('#game-duck').get_attribute('aria-pressed')=='false'
 page.locator('#game-pause').click()
 page.locator('#dino-shop').scroll_into_view_if_needed()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/workspace/artifacts/training-palace-skin-shop-mobile.png')
 page.set_viewport_size({'width':320,'height':720})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # Progress changes from a second tab appear here without losing the wallet.
 sibling=context.new_page();sibling.goto(url,wait_until='networkidle')
 sibling.evaluate('(key)=>{const p=JSON.parse(localStorage.getItem(key));p.coins=40;localStorage.setItem(key,JSON.stringify(p))}',key)
 page.wait_for_function("document.querySelector('#shop-wallet').textContent==='40'")
 sibling.close();page.bring_to_front()
 page.locator('[data-skin-action=royal]').click()
 assert page.locator('#shop-wallet').inner_text()=='0'
 profile=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',key)
 assert profile['ownedSkins']==['classic','mint','royal'] and profile['equippedSkin']=='royal'
 page.locator('[data-game=flappy]').click()
 assert page.locator('#dino-shop').is_hidden() and page.locator('#game-run-coins-group').is_hidden()
 page.locator('[data-game=runner]').click();assert page.locator('#shop-wallet').inner_text()=='0'
 page.locator('nav [data-page=today]').click()
 assert page.locator('#today-journal-text').input_value()=='Mijn notities blijven van mij.'
 # A failed storage write must not charge coins or grant a skin in memory.
 page.evaluate('(key)=>localStorage.setItem(key,JSON.stringify({runner:123,flappy:7,coins:15}))',key)
 page.reload(wait_until='networkidle');page.locator('nav [data-page=games]').click()
 page.evaluate("""() => {const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='training-palace-games-v1')throw new DOMException('Full','QuotaExceededError');return original.call(this,k,v)}}""")
 page.locator('[data-skin-action=mint]').click()
 assert 'geen coins uitgegeven' in page.locator('#shop-status').inner_text()
 assert page.locator('#shop-wallet').inner_text()=='15'
 assert 'equipped' not in page.locator('[data-skin=mint]').get_attribute('class')
 assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).coins',key)==15
 page.reload(wait_until='networkidle');page.locator('nav [data-page=games]').click()
 assert page.locator('#shop-wallet').inner_text()=='15'
 # Invalid currency and unowned skins never unlock a paid cosmetic.
 page.evaluate('(key)=>localStorage.setItem(key,JSON.stringify({runner:123,coins:-10,ownedSkins:["fake"],equippedSkin:"pink"}))',key)
 page.reload(wait_until='networkidle');page.locator('nav [data-page=games]').click()
 assert page.locator('#shop-wallet').inner_text()=='0'
 assert page.locator('[data-skin-action=classic]').is_disabled()
 assert page.locator('[data-skin-action=pink]').is_disabled()
 assert not errors,errors
 print('PASS: real pickups, no duplicate banking, record migration, skin purchase/equip/color/persistence, insufficient funds, keyboard super jump, real mobile multitouch, 390/320px shop, cross-tab progress, storage failure rollback and note isolation.')
 browser.close()
