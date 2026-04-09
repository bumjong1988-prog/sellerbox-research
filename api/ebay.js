const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  const seller = (req.query.seller || '').trim();
  const offset = parseInt(req.query.offset || '0');
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) { res.status(500).json({ error: 'API keys not configured' }); return; }
  if (!seller) { res.status(400).json({ error: 'seller required' }); return; }
  const page = Math.floor(offset / 100) + 1;
  const params = new URLSearchParams();
  params.set('OPERATION-NAME', 'findItemsAdvanced');
  params.set('SERVICE-VERSION', '1.13.0');
  params.set('SECURITY-APPNAME', appId);
  params.set('RESPONSE-DATA-FORMAT', 'JSON');
  params.set('REST-PAYLOAD', '');
  params.set('itemFilter(0).name', 'Seller');
  params.set('itemFilter(0).value', seller);
  params.set('itemFilter(1).name', 'ListingType');
  params.set('itemFilter(1).value', 'FixedPrice');
  params.set('paginationInput.entriesPerPage', '100');
  params.set('paginationInput.pageNumber', String(page));
  params.set('sortOrder', 'BestMatch');
  params.set('outputSelector(0)', 'SellerInfo');
  const url = 'https://svcs.ebay.com/services/search/FindingService/v1?' + params.toString();
  try {
    const r = await fetch(url);
    const d = await r.json();
    const keys = Object.keys(d);
    const resp = d[keys[0]] && d[keys[0]][0];
    if (!resp) { res.status(500).json({ error: 'No response', keys }); return; }
    const ack = resp.ack && resp.ack[0];
    if (ack !== 'Success') {
      let errMsg = 'eBay error'; let rawErr = JSON.stringify(resp.errorMessage || resp);
      try { errMsg = resp.errorMessage[0].error[0].message[0]; } catch(e) {}
      res.status(200).json({ total: 0, count: 0, offset, items: [], error: errMsg, rawErr });
      return;
    }
      let errMsg = 'eBay error';
      try { errMsg = resp.errorMessage[0].error[0].message[0]; } catch(e) {}
      res.status(200).json({ total: 0, count: 0, offset, items: [], error: errMsg });
      return;
    }
    let total = 0;
    try { total = parseInt(resp.paginationOutput[0].totalEntries[0]); } catch(e) {}
    let rawItems = [];
    try { rawItems = resp.searchResult[0].item || []; } catch(e) {}
    const items = rawItems.map(item => {
      let price=null,currency='USD',image=null,condition='',sName=seller,cat='',listing='',itemUrl='',itemId='',title='';
      try{price=item.sellingStatus[0].currentPrice[0].__value__;}catch(e){}
      try{currency=item.sellingStatus[0].currentPrice[0]['@currencyId'];}catch(e){}
      try{image=item.galleryURL[0];}catch(e){}
      try{condition=item.condition[0].conditionDisplayName[0];}catch(e){}
      try{sName=item.sellerInfo[0].sellerUserName[0];}catch(e){}
      try{cat=item.primaryCategory[0].categoryName[0];}catch(e){}
      try{listing=item.listingInfo[0].listingType[0];}catch(e){}
      try{itemUrl=item.viewItemURL[0];}catch(e){}
      try{itemId=item.itemId[0];}catch(e){}
      try{title=item.title[0];}catch(e){}
      return {itemId,title,price,currency,image,condition,soldQuantity:0,quantityLeft:null,itemUrl,seller:sName,categories:cat,listingType:listing};
    });
    res.status(200).json({ total, count: items.length, offset, items });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = handler;
