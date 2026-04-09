module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { action, seller, offset = 0 } = req.query;
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) return res.status(500).json({ error: 'API keys not configured' });
  if (!seller) return res.status(400).json({ error: 'seller required' });
  try {
    const pageSize = 100;
    const page = Math.floor(parseInt(offset) / pageSize) + 1;
    const params = new URLSearchParams({
      'OPERATION-NAME': 'findItemsAdvanced',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'itemFilter(0).name': 'Seller',
      'itemFilter(0).value': seller.trim(),
      'itemFilter(1).name': 'ListingType',
      'itemFilter(1).value': 'FixedPrice',
      'paginationInput.entriesPerPage': String(pageSize),
      'paginationInput.pageNumber': String(page),
      'sortOrder': 'BestMatch',
      'outputSelector(0)': 'SellerInfo',
    });
    const url = 'https://svcs.ebay.com/services/search/FindingService/v1?' + params.toString();
    const r = await fetch(url);
    const d = await r.json();
    const keys = Object.keys(d);
    const resp = d[keys[0]]?.[0];
    if (!resp) return res.status(500).json({ error: 'No response', keys });
    const ack = resp.ack?.[0];
    if (ack !== 'Success') {
      return res.status(200).json({ total: 0, count: 0, offset: parseInt(offset), items: [],
        error: resp.errorMessage?.[0]?.error?.[0]?.message?.[0] || 'eBay error: ' + ack });
    }
    const total = parseInt(resp.paginationOutput?.[0]?.totalEntries?.[0] || 0);
    const rawItems = resp.searchResult?.[0]?.item || [];
    const items = rawItems.map(item => ({
      itemId: item.itemId?.[0] || '',
      title: item.title?.[0] || '',
      price: item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || null,
      currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
      image: item.galleryURL?.[0] || null,
      condition: item.condition?.[0]?.conditionDisplayName?.[0] || '',
      soldQuantity: 0,
      quantityLeft: null,
      itemUrl: item.viewItemURL?.[0] || '',
      seller: item.sellerInfo?.[0]?.sellerUserName?.[0] || seller.trim(),
      categories: item.primaryCategory?.[0]?.categoryName?.[0] || '',
      listingType: item.listingInfo?.[0]?.listingType?.[0] || '',
    }));
    return res.status(200).json({ total, count: items.length, offset: parseInt(offset), items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { action, seller, offset = 0 } = req.query;
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) return res.status(500).json({ error: 'API keys not configured' });
  if (!seller) return res.status(400).json({ error: 'seller required' });
  try {
    const pageSize = 100;
    const page = Math.floor(parseInt(offset) / pageSize) + 1;
    const params = new URLSearchParams({
      'OPERATION-NAME': 'findItemsAdvanced',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'itemFilter(0).name': 'Seller',
      'itemFilter(0).value': seller.trim(),
      'itemFilter(1).name': 'ListingType',
      'itemFilter(1).value': 'FixedPrice',
      'paginationInput.entriesPerPage': String(pageSize),
      'paginationInput.pageNumber': String(page),
      'sortOrder': 'BestMatch',
      'outputSelector(0)': 'SellerInfo',
    });
    const url = 'https://svcs.ebay.com/services/search/FindingService/v1?' + params.toString();
    const r = await fetch(url);
    const d = await r.json();
    // 응답 키 목록 확인용 디버그
    const keys = Object.keys(d);
    const firstKey = keys[0];
    const resp = d[firstKey]?.[0];
    if (!resp) return res.status(200).json({ debug_keys: keys, raw: JSON.stringify(d).slice(0, 500) });
    const ack = resp.ack?.[0];
    if (ack !== 'Success') {
      return res.status(200).json({ ack, keys, errMsg: resp.errorMessage?.[0]?.error?.[0]?.message?.[0] || 'error' });
    }
    const total = parseInt(resp.paginationOutput?.[0]?.totalEntries?.[0] || 0);
    const rawItems = resp.searchResult?.[0]?.item || [];
    const items = rawItems.map(item => ({
      itemId: item.itemId?.[0] || '',
      title: item.title?.[0] || '',
      price: item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || null,
      currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
      image: item.galleryURL?.[0] || null,
      condition: item.condition?.[0]?.conditionDisplayName?.[0] || '',
      soldQuantity: 0,
      quantityLeft: null,
      itemUrl: item.viewItemURL?.[0] || '',
      seller: item.sellerInfo?.[0]?.sellerUserName?.[0] || seller.trim(),
      categories: item.primaryCategory?.[0]?.categoryName?.[0] || '',
      listingType: item.listingInfo?.[0]?.listingType?.[0] || '',
    }));
    return res.status(200).json({ total, count: items.length, offset: parseInt(offset), items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { action, seller, offset = 0, limit = 100 } = req.query;
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) return res.status(500).json({ error: 'API keys not configured' });
  if (action !== 'seller_items') return res.status(400).json({ error: 'Unknown action' });
  if (!seller) return res.status(400).json({ error: 'seller required' });
  try {
    const pageSize = 100;
    const page = Math.floor(parseInt(offset) / pageSize) + 1;
    const params = new URLSearchParams({
      'OPERATION-NAME': 'findItemsAdvanced',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'itemFilter(0).name': 'Seller',
      'itemFilter(0).value': seller.trim(),
      'itemFilter(1).name': 'ListingType',
      'itemFilter(1).value': 'FixedPrice',
      'paginationInput.entriesPerPage': String(pageSize),
      'paginationInput.pageNumber': String(page),
      'sortOrder': 'BestMatch',
      'outputSelector(0)': 'SellerInfo',
    });
    const url = 'https://svcs.ebay.com/services/search/FindingService/v1?' + params.toString();
    const r = await fetch(url);
    const d = await r.json();
    const resp = d?.findItemsAdvancedResponse?.[0];
    if (!resp) return res.status(500).json({ error: 'No response from eBay' });
    if (resp.ack?.[0] !== 'Success') {
      const errMsg = resp.errorMessage?.[0]?.error?.[0]?.message?.[0] || 'eBay API error';
      return res.status(200).json({ total: 0, count: 0, offset: parseInt(offset), items: [], error: errMsg });
    }
    const total = parseInt(resp.paginationOutput?.[0]?.totalEntries?.[0] || 0);
    const rawItems = resp.searchResult?.[0]?.item || [];
    const items = rawItems.map(item => ({
      itemId: item.itemId?.[0] || '',
      title: item.title?.[0] || '',
      price: item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || null,
      currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
      image: item.galleryURL?.[0] || null,
      condition: item.condition?.[0]?.conditionDisplayName?.[0] || '',
      soldQuantity: 0,
      quantityLeft: null,
      itemUrl: item.viewItemURL?.[0] || '',
      seller: item.sellerInfo?.[0]?.sellerUserName?.[0] || seller.trim(),
      categories: item.primaryCategory?.[0]?.categoryName?.[0] || '',
      listingType: item.listingInfo?.[0]?.listingType?.[0] || '',
    }));
    return res.status(200).json({ total, count: items.length, offset: parseInt(offset), items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
