const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/estimate-meal');
const originalFetch = global.fetch;
const originalKey = process.env.MACRO_VISION_API_KEY;
afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.MACRO_VISION_API_KEY;
  else process.env.MACRO_VISION_API_KEY = originalKey;
});
async function call(method, body) {
  const res = { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(n) { this.code=n;return this; }, json(data) { this.data=data;return this; } };
  await handler({ method, body, headers: {'content-type':'application/json'} },res);
  return res;
}
const image = 'data:image/jpeg;base64,/9j/2Q==';
test('unconfigured service reports status and refuses analysis without calling a provider', async () => {
  delete process.env.MACRO_VISION_API_KEY;
  global.fetch = () => { throw Error('Unexpected request'); };
  assert.deepEqual((await call('GET')).data,{configured:false});
  assert.equal((await call('POST',{image})).code,503);
});
test('rejects invalid images and unsupported methods', async () => {
  process.env.MACRO_VISION_API_KEY='test-key';
  assert.equal((await call('POST',{image:'not an image'})).code,400);
  assert.equal((await call('POST',{image:'data:image/jpeg;base64,YWJjZA=='})).code,400);
  assert.equal((await call('POST',{image,description:'a'.repeat(2001)})).code,400);
  assert.equal((await call('DELETE')).code,405);
});
test('returns validated nutrition per 100g and sends the image to the provider', async () => {
  process.env.MACRO_VISION_API_KEY='test-key';
  const result={items:[{name:'Ei',grams:100,protein:13,carbs:1.1,fat:11}],notes:'Gewicht geschat; bakvet onbekend.'};
  global.fetch=async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/chat/completions');
    assert.equal(options.headers.Authorization,'Bearer test-key');
    const body=JSON.parse(options.body);
    assert.equal(body.messages[1].content[1].image_url.url,image);
    assert.equal(body.response_format.json_schema.strict,true);
    return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(result)}}]})};
  };
  const response=await call('POST',{image,description:'Twee eieren'});
  assert.equal(response.code,200);assert.deepEqual(response.data,result);
});
test('handles provider limits, refusals, invalid nutrition and timeouts without exposing secrets', async () => {
  process.env.MACRO_VISION_API_KEY='test-key';
  global.fetch=async()=>({ok:false,status:429});
  assert.equal((await call('POST',{image})).code,502);
  for(const content of ['null','not-json',JSON.stringify({items:[{name:'Ei',grams:-1,protein:13,carbs:1,fat:11}],notes:''}),JSON.stringify({items:[{name:'Ei',grams:100,protein:90,carbs:90,fat:90}],notes:''})]) {
    global.fetch=async()=>({ok:true,json:async()=>({choices:[{message:{content}}]})});
    const res=await call('POST',{image});assert.equal(res.code,502);assert.ok(!JSON.stringify(res.data).includes('test-key'));
  }
  global.fetch=async()=>{throw Error('test-key timeout')};
  assert.equal((await call('POST',{image})).code,502);
});
