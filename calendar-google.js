/* Adapted from Happychess/Happychess-Website-, branch heropbouw, commit 16270541:
 * lib/happychess-coaching/calendar/colors.ts and google.ts.
 * Framework-independent read helpers only; no server auth, secrets, storage or writes copied.
 */
(function(root){
 function hex(value){return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value.toLowerCase():undefined}
 function luminance(color){const [r,g,b]=[1,3,5].map(i=>{const channel=parseInt(color.slice(i,i+2),16)/255;return channel<=0.04045?channel/12.92:((channel+0.055)/1.055)**2.4});return 0.2126*r+0.7152*g+0.0722*b}
 function contrast(a,b){return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)}
 function calendarColor(background,foreground){const bg=hex(background);if(!bg)return undefined;const fg=hex(foreground),light=luminance(bg);return {background:bg,foreground:fg&&contrast(light,luminance(fg))>=4.5?fg:contrast(light,0)>=contrast(light,1)?'#000000':'#ffffff'}}
 function getCalendarColor(calendar,palette={}){const indexed=palette.calendar?.[calendar?.colorId];return calendarColor(calendar?.backgroundColor,calendar?.foregroundColor)||calendarColor(indexed?.background,indexed?.foreground)}
 function getEventColor(event,calendar,palette={}){const override=palette.event?.[event?.colorId];return calendarColor(override?.background,override?.foreground)||getCalendarColor(calendar,palette)}
 async function pages(getPage){const items=[],seen=new Set();let next;do{const response=await getPage(next);items.push(...response.items||[]);next=response.nextPageToken;if(next&&seen.has(next))throw Error('Google herhaalt een resultatenpagina. Probeer opnieuw.');if(next)seen.add(next);if(seen.size>200)throw Error('Deze agenda bevat te veel resultaten om nu volledig op te halen.')}while(next);return items}
 function safeEventLink(value){try{const url=new URL(value);if(url.protocol==='https:'&&(url.hostname==='calendar.google.com'||url.hostname==='www.google.com'&&url.pathname.startsWith('/calendar/')))return url.href}catch{}return null}
 const api={calendarColor,getCalendarColor,getEventColor,pages,safeEventLink};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CalendarGoogle=api;
})(typeof window!=='undefined'?window:globalThis);
