"""Run against the static UI, e.g. PALACE_TEST_URL=http://127.0.0.1:3003 python tests/browser_smoke.py.
Requires Python Playwright and Chromium. No external AI service is used.
"""
import json
import os
from pathlib import Path
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright

url = os.environ.get('PALACE_TEST_URL', 'http://127.0.0.1:3003')
artifacts = Path('/workspace/artifacts')
artifacts.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1100}, timezone_id='Europe/Brussels')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.clock.install(time=datetime(2026,10,15,10,0,tzinfo=timezone.utc))
    page.goto(url, wait_until='networkidle')
    rows = page.locator('#task-list > .task')
    assert rows.count() == 6
    rows.nth(0).locator('.task-open').click()
    assert page.locator('#task-dialog').is_visible()
    assert not rows.nth(0).locator('input').is_checked()
    page.get_by_role('button', name='Start oefening', exact=True).click()
    page.clock.fast_forward(10000)
    page.get_by_role('button', name='Pauzeren', exact=True).click()
    paused = page.locator('.breath-guide > span').inner_text()
    page.clock.fast_forward(10000)
    assert page.locator('.breath-guide > span').inner_text() == paused
    page.get_by_role('button', name='Verdergaan', exact=True).click()
    page.clock.fast_forward(120000)
    assert page.locator('.breath-guide strong').inner_text() == 'Afgerond. Neem je tijd.'
    page.screenshot(path=str(artifacts/'training-palace-breathing.png'))
    page.get_by_role('button', name='Taak afvinken', exact=True).click()
    assert rows.nth(0).locator('input').is_checked()
    assert not page.locator('#task-dialog').is_visible()
    rows.nth(0).locator('input').uncheck()
    assert not page.locator('#task-dialog').is_visible()
    rows.nth(1).locator('.task-open').click()
    assert page.locator('#meal-totals').is_hidden()
    assert page.locator('#meal-adjust').is_hidden()
    assert not page.locator('#meal-ai').get_attribute('open')
    page.locator('#meal-description').fill('2x eitjes, met spek en een witte botherham')
    page.get_by_role('button', name='Schat mijn maaltijd', exact=True).click()
    assert page.locator('#meal-totals strong').first.inner_text() == '462'
    assert page.locator('#food-items .food-row').count() == 3
    page.locator('#meal-mode').select_option('low')
    assert page.locator('#meal-totals strong').first.inner_text() == '341'
    assert page.locator('#daily-macros strong').first.inner_text() == '341'
    page.screenshot(path=str(artifacts/'training-palace-simple-meal.png'))
    # A screenshot is a valid PNG upload; no external service is contacted.
    page.locator('#meal-photo').set_input_files(str(artifacts/'training-palace-breathing.png'))
    page.wait_for_function("!document.querySelector('.meal-photo-preview').hidden")
    assert page.locator('#detail-status').inner_text().startswith('Foto bewaard')
    page.reload(wait_until='networkidle')
    rows.nth(1).locator('.task-open').click()
    assert page.locator('#meal-description').input_value() == '2x eitjes, met spek en een witte botherham'
    assert page.locator('#meal-mode').input_value() == 'low'
    assert page.locator('#meal-totals strong').first.inner_text() == '341'
    page.wait_for_function("!document.querySelector('.meal-photo-preview').hidden")
    page.locator('#close-detail').click()
    rows.nth(2).locator('.task-open').click()
    assert page.locator('#food-items .food-row').count() == 0
    page.locator('#close-detail').click()
    rows.nth(3).locator('.task-open').click()
    page.locator('#meal-manual summary').click()
    dinner_inputs = page.locator('.transfer-grid input')
    for i, value in enumerate(['40','60','20']):
        dinner_inputs.nth(i).fill(value)
    page.get_by_role('button', name='Gebruik maaltijdtotalen').click()
    page.locator('#meal-mode').select_option('high')
    assert page.locator('#meal-totals strong').first.inner_text() == '667'
    assert page.locator('#daily-macros strong').first.inner_text() == '1008'
    page.locator('#close-detail').click()
    rows.nth(4).locator('.task-open').click()
    assert page.locator('.exercise').count() == 4
    assert page.locator('.set-checks input').count() == 8
    page.get_by_role('spinbutton', name='Pompen: aantal sets').fill('3')
    page.get_by_role('spinbutton', name='Pompen: aantal sets').dispatch_event('change')
    page.locator('.set-checks input').first.check()
    page.locator('#close-detail').click()
    rows.nth(4).locator('.task-open').click()
    assert page.locator('.set-checks input').count() == 9
    assert page.locator('.set-checks input').first.is_checked()
    page.locator('#close-detail').click()
    rows.nth(5).locator('.task-open').click()
    page.locator('#edit-task-title').fill('Kattenbakken')
    page.locator('#edit-task-detail').fill('Uitscheppen, afval wegdoen en vloer vegen.')
    page.get_by_role('button', name='Wijziging bewaren').click()
    page.locator('#close-detail').click()
    assert rows.nth(5).locator('.task-title').inner_text() == 'Kattenbakken'
    rows.nth(5).locator('input').check()
    page.locator('#task-input').fill('<img src=x onerror=alert(1)>')
    page.locator('#add-task button').click()
    assert page.locator('#task-list img').count() == 0
    rows.nth(1).locator('.task-open').click()
    # Unknown food must not replace a previous saved estimate with partial nutrition.
    page.locator('#meal-description').fill('pizza met kip')
    page.get_by_role('button', name='Schat mijn maaltijd', exact=True).click()
    assert page.locator('#meal-ai').get_attribute('open') is not None
    assert 'pizza' in page.locator('#meal-hint').inner_text()
    assert page.locator('#meal-totals strong').first.inner_text() == '341'
    assert 'pizza%20met%20kip' in page.locator('.chat-link').get_attribute('href')
    page.locator('#ai-answer').fill('{"protein":25,"carbs":30,"fat":15}')
    page.get_by_role('button', name='Gebruik AI-schatting').click()
    assert page.locator('#meal-totals strong').first.inner_text() == '355'
    assert page.locator('#meal-mode').input_value() == 'exact'
    page.locator('#meal-manual summary').click()
    inputs = page.locator('.transfer-grid input')
    for i, value in enumerate(['25', '30', '15']):
        inputs.nth(i).fill(value)
    page.get_by_role('button', name='Gebruik maaltijdtotalen').click()
    assert page.locator('#meal-mode').input_value() == 'exact'
    assert page.locator('#meal-totals strong').first.inner_text() == '355'
    assert page.locator('#food-items .food-row').count() == 1
    page.locator('#meal-mode').select_option('high')
    assert page.locator('#meal-totals strong').first.inner_text() == '408'
    page.screenshot(path=str(artifacts/'training-palace-meal.png'))
    page.set_viewport_size({'width':390,'height':844})
    assert page.locator('#task-dialog').evaluate('(d)=>d.scrollWidth<=d.clientWidth')
    page.screenshot(path=str(artifacts/'training-palace-meal-mobile.png'))
    page.locator('#close-detail').click()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    # New day: recurring household text survives; progress and meals reset.
    page.clock.fast_forward(24*60*60*1000)
    page.reload(wait_until='networkidle')
    assert rows.count() == 6
    assert rows.nth(5).locator('.task-title').inner_text() == 'Kattenbakken'
    assert not rows.nth(5).locator('input').is_checked()
    assert page.locator('#count').inner_text() == '0 van 6'
    assert page.locator('#daily-macros strong').first.inner_text() == '0'
    rows.nth(5).locator('.task-open').click()
    assert page.locator('#edit-task-detail').input_value() == 'Uitscheppen, afval wegdoen en vloer vegen.'
    assert not errors, errors
    print('PASS: separate row/checkbox actions; breathing timer and pause; free-text food estimates, unknown-food fallback, AI-answer import and bounds; independent meals/day total; photo persistence; manual whole-meal macro transfer; workouts; recurring household task; new-day reset; mobile layout.')
    browser.close()
