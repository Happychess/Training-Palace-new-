/* Small, offline Dutch food/portion estimator. This is a lookup-based estimate, not AI. */
(function (root) {
  const catalogue = [
    {name:'Ei', re:/\b(?:eieren|eitjes?|eier|ei)\b/g, portion:50, piece:50, p:13,c:1.1,f:11},
    {name:'Spek, gebakken', re:/\b(?:spek(?:jes|reepjes)?|bacon)\b/g, portion:30, piece:15, p:37,c:1.4,f:42},
    {name:'Wit brood', re:/\b(?:witt?e?\s+(?:boterham(?:men)?|botherham(?:men)?|brood|toast)|witbrood)\b/g, portion:35,piece:35,p:8,c:47,f:3},
    {name:'Volkorenbrood', re:/\b(?:volkoren(?:brood)?|bruin(?:e)?\s+(?:brood|boterham(?:men)?))\b/g,portion:35,piece:35,p:9,c:39,f:3.5},
    {name:'Brood', re:/\b(?:brood|boterham(?:men)?|botherham(?:men)?|toast)\b/g,portion:35,piece:35,p:8.5,c:43,f:3.2},
    {name:'Cornflakes', re:/\b(?:cornflakes|cornflaks)\b/g,portion:40,p:7,c:84,f:0.9},
    {name:'Melk, halfvol', re:/\b(?:(?:halfvolle?|volle?|magere)\s+)?melk\b/g,portion:200,piece:200,p:3.5,c:4.8,f:1.5},
    {name:'Yoghurt, naturel', re:/\b(?:yoghurt|yogurt)\b/g,portion:150,piece:150,p:4,c:4.5,f:1.5},
    {name:'Skyr, naturel',re:/\bskyr\b/g,portion:150,piece:150,p:11,c:4,f:0.2},
    {name:'Havermout, droog', re:/\b(?:havermout|oats)\b/g,portion:50,p:13,c:60,f:7},
    {name:'Banaan', re:/\b(?:bananen|banaan)\b/g,portion:120,piece:120,p:1.1,c:20,f:0.3},
    {name:'Appel', re:/\bappels?\b/g,portion:150,piece:150,p:0.3,c:12,f:0.2},
    {name:'Kipfilet, bereid', re:/\b(?:kipfilet|kippenfilet|kip)\b/g,portion:150,p:31,c:0,f:3.6},
    {name:'Rijst, gekookt', re:/\b(?:rijst|rice)\b/g,portion:150,p:2.7,c:28,f:0.3},
    {name:'Pasta, gekookt',re:/\b(?:pasta|spaghetti|penne|macaroni)\b/g,portion:200,p:5,c:30,f:1.1},
    {name:'Aardappelen, gekookt',re:/\b(?:aardappelen|aardappels|aardappel)\b/g,portion:200,p:2,c:17,f:0.1},
    {name:'Broccoli, bereid',re:/\bbroccoli\b/g,portion:150,p:2.8,c:4,f:0.4},
    {name:'Olijfolie',re:/\b(?:olijfolie|olie)\b/g,portion:10,spoon:13.5,p:0,c:0,f:100},
    {name:'Boter',re:/\bboter\b/g,portion:5,spoon:14,p:0.5,c:0.5,f:82},
    {name:'Kaas, Gouda',re:/\b(?:(?:goudse?|gouda)\s+)?kaas\b/g,portion:20,piece:20,p:25,c:0,f:30},
    {name:'Pindakaas',re:/\bpindakaas\b/g,portion:15,spoon:15,p:25,c:12,f:50},
    {name:'Water',re:/\bwater\b/g,portion:250,piece:250,p:0,c:0,f:0},
    {name:'Koffie, zwart',re:/\b(?:zwarte?\s+)?koffie\b/g,portion:150,piece:150,p:0.1,c:0,f:0},
    {name:'Thee, zonder suiker',re:/\bthee\b/g,portion:200,piece:200,p:0,c:0,f:0}
  ];
  const unitPattern='kilogram|milliliter|eetlepels?|theelepels?|sneetjes?|boterham(?:men)?|plakjes?|plakken|kopjes?|glazen|glas|sne[eë]n|sneden|snee|stuks?|gram|liter|bakjes?|borden?|porties?|schaaltjes?|stukken|kg|ml|el|tl|g|l|x';
  const amountRE=new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})?(?![a-z0-9])`,'g');
  function normalize(text) {
    const numbers={een:1,twee:2,drie:3,vier:4,vijf:5,zes:6,zeven:7,acht:8,negen:9,tien:10,halve:0.5,half:0.5};
    return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/(\d),(\d)/g,'$1.$2').replace(/\b(een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|halve|half)\b/g,m=>numbers[m]);
  }
  function estimate(text) {
    const normalized=normalize(text); const matches=[];
    for(const food of catalogue){food.re.lastIndex=0;for(const m of normalized.matchAll(food.re))matches.push({food,start:m.index,end:m.index+m[0].length})}
    // Prefer specific matches ("wit brood") over overlapping generic matches ("brood").
    matches.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));
    const found=[];for(const m of matches)if(!found.some(f=>m.start<f.end&&m.end>f.start))found.push(m);
    const masked=normalized.split(''),items=[],assumptions=[],issues=[];
    for(let i=0;i<found.length;i++){
      const m=found[i],from=i?found[i-1].end:0,to=i+1<found.length?found[i+1].start:normalized.length;
      // A connector starts a new ingredient; numbers must belong to this ingredient.
      const pre=normalized.slice(from,m.start).split(/[,;\n&+]|\b(?:en|met)\b/).pop();
      const post=normalized.slice(m.end,to).split(/[,;\n&+]|\b(?:en|met)\b/)[0];
      const negated=/\b(?:zonder|geen)\b/.test(pre);
      const amounts=[...pre.matchAll(amountRE)];
      let amount=amounts.at(-1);
      // Also accept "kip 150 g"; avoid stealing a quantity preceding the next food.
      if(!amount && !found[i+1]?.start && /^\s*\d/.test(post))amount=[...post.matchAll(amountRE)][0];
      const unit=amount?.[2]||'',count=amount?Number(amount[1]):null;
      let grams=m.food.portion;
      if(count!==null){
        if(/^(?:kg|kilogram)$/.test(unit))grams=count*1000;
        else if(/^(?:g|gram|ml|milliliter)$/.test(unit))grams=count;
        else if(/^(?:l|liter)$/.test(unit))grams=count*1000;
        else if(/^(?:el|eetlepel)/.test(unit))grams=count*(m.food.spoon||15);
        else if(/^(?:tl|theelepel)/.test(unit))grams=count*(m.food.spoon||15)/3;
        else grams=count*(m.food.piece||m.food.portion);
      }
      if(!negated){
        if(grams<=0||grams>5000){issues.push('Controleer de hoeveelheid '+m.food.name.toLowerCase());}
        else {
          let {p,c,f,name}=m.food;
          if(name.startsWith('Melk')){const phrase=normalized.slice(m.start,m.end);if(/\bvolle?\b/.test(phrase)){name='Melk, vol';p=3.4;c=4.7;f=3.5}else if(/\bmagere\b/.test(phrase)){name='Melk, mager';p=3.5;c=5;f=0.1}}
          items.push({name,grams:Math.round(grams*10)/10,protein:p,carbs:c,fat:f});
          assumptions.push(`${name}: ${Math.round(grams*10)/10} g${amount?'':' (standaardportie)'}`);
        }
      }
      for(let j=m.start;j<m.end;j++)masked[j]=' ';
    }
    let rest=masked.join('').replace(amountRE,' ').replace(/\b(?:ik|heb|had|at|gegeten|ontbijt|ontbijten|lunch|avondeten|vandaag|vanmorgen|vanavond|als|voor|en|met|van|een|de|het|erbij|op|in|of|zonder|geen|wel|ook|nog|wat|beetje|klein|kleine|groot|grote|lekker|gebakken|gekookt|gekookte|bereid|bereide|naturel|stukjes|stukje)\b/g,' ').replace(/[^a-z]+/g,' ').trim().replace(/\s+/g,' ');
    if(rest)issues.push('Niet herkend: '+rest);
    if(!items.length&&!issues.length)issues.push('Beschrijf wat je gegeten hebt.');
    return {items,assumptions,issues,complete:items.length>0&&issues.length===0};
  }
  function readMacros(text){
    let data;
    try{const s=text.slice(text.indexOf('{'),text.lastIndexOf('}')+1);data=JSON.parse(s)}catch{
      data={};for(const [key,aliases]of Object.entries({protein:'eiwit(?:ten)?|protein',carbs:'koolhydraten|carbs|carbohydrates',fat:'vet(?:ten)?|fat'})){
        const match=text.match(new RegExp(`(?:${aliases})\\s*[:=]?\\s*(\\d+(?:[.,]\\d+)?)`,'i'));if(match)data[key]=Number(match[1].replace(',','.'));
      }
    }
    const values={protein:data?.protein??data?.eiwit,carbs:data?.carbs??data?.koolhydraten,fat:data?.fat??data?.vet};
    if(Object.values(values).some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1000))throw Error('Plak een antwoord met eiwit, koolhydraten en vet in gram.');
    return values;
  }
  const api={estimate,readMacros};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MealEstimator=api;
})(typeof window!=='undefined'?window:globalThis);
