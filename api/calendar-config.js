// OAuth web client IDs are public identifiers. No client secret is needed for GIS token flow.
module.exports = function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Gebruik GET.'})}
 const candidate=(process.env.GOOGLE_CALENDAR_CLIENT_ID||'').trim();
 const clientId=/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(candidate)?candidate:null;
 return res.status(200).json({clientId});
};
