const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const handler=require(root+'/api/estimate-meal');
http.createServer(async(req,res)=>{
 if(req.url==='/api/estimate-meal'){
  let body='';for await(const chunk of req)body+=chunk;req.body=body;
  res.status=n=>{res.statusCode=n;return res};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))};
  return handler(req,res);
 }
 const file=path.join(root,req.url==='/'?'index.html':req.url.split('?')[0]);
 if(!file.startsWith(root+'/')){res.writeHead(403);return res.end()}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end()};res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html');res.end(data)})
}).listen(Number(process.env.PALACE_TEST_PORT||3003),'127.0.0.1');
