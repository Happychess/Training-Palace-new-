const {test}=require('node:test');const assert=require('node:assert/strict');
const {calendarColor,getCalendarColor,getEventColor,pages,safeEventLink}=require('../calendar-google');
test('original coaching colors keep Google backgrounds with readable foregrounds',()=>{
 assert.deepEqual(calendarColor('#ffffff','#fffffe'),{background:'#ffffff',foreground:'#000000'});
 assert.deepEqual(calendarColor('#000000','#000001'),{background:'#000000',foreground:'#ffffff'});
 assert.equal(calendarColor('url(https://example.com)'),undefined);
 const palette={calendar:{'1':{background:'#4986e7',foreground:'#000000'}},event:{'3':{background:'#dbadff',foreground:'#000000'}}};
 const cal={backgroundColor:'#16a765',colorId:'1'};
 assert.equal(getCalendarColor(cal,palette).background,'#16a765');
 assert.equal(getCalendarColor({colorId:'1'},palette).background,'#4986e7');
 assert.equal(getEventColor({colorId:'3'},cal,palette).background,'#dbadff');
 assert.equal(getEventColor({colorId:'missing'},cal,palette).background,'#16a765');
});
test('all pages are fetched and page failures never return a partial agenda',async()=>{
 const seen=[];const items=await pages(async next=>{seen.push(next);return next?{items:[2]}:{items:[1],nextPageToken:'page-2'}});
 assert.deepEqual(items,[1,2]);assert.deepEqual(seen,[undefined,'page-2']);
 await assert.rejects(pages(async next=>{if(next)throw Error('Network error');return {items:[1],nextPageToken:'two'}}),/Network error/);
 await assert.rejects(pages(async()=>({items:[1],nextPageToken:'same'})),/herhaalt/);
});
test('event links accept only Google Calendar destinations',()=>{
 assert.ok(safeEventLink('https://www.google.com/calendar/event?eid=123'));
 assert.ok(safeEventLink('https://calendar.google.com/calendar/event?eid=123'));
 for(const input of ['javascript:alert(1)','https://www.google.com/url?target=other','https://calendar.google.com.example.com/'])assert.equal(safeEventLink(input),null);
});
