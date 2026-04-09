// Vercel Serverless Function - eBay API 프록시
// 환경변수: EBAY_APP_ID, EBAY_CERT_ID

export default async function handler(req, res) {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, seller, offset = 0, limit = 200 } = req.query;

  try {
    // 1. Client Credentials로 Access Token 발급
    const appId   = process.env.EBAY_APP_ID;
    const certId  = process.env.EBAY_CERT_ID;

    if (!appId || !certId) {
      return res.status(500).json({ error: 'eBay API keys not configured' });
    }

    const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${appId}:${certId}`).toString('base64'),
      },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Token failed', detail: tokenData });
    }
    const token = tokenData.access_token;

    // 2. 셀러 상품 목록 조회
    if (action === 'seller_items') {
      if (!seller) return res.status(400).json({ error: 'seller param required' });

      const sellerName = seller.trim().toLowerCase();
      const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?filter=sellers%3A%7B${encodeURIComponent(sellerName)}%7D&sort=newlyListed&limit=${limit}&offset=${offset}&fieldgroups=EXTENDED`;

      const apiRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' }
      });
      const data = await apiRes.json();

      // sold 수 파싱 + 정제
      const items = (data.itemSummaries || []).map(item => ({
        itemId:       item.itemId,
        title:        item.title,
        price:        item.price?.value,
        currency:     item.price?.currency,
        image:        item.image?.imageUrl,
        condition:    item.condition,
        soldQuantity: item.soldQuantity || 0,
        quantityLeft: item.estimatedAvailabilities?.[0]?.estimatedAvailableQuantity || null,
        itemUrl:      item.itemWebUrl,
        seller:       item.seller?.username,
        categories:   item.categories?.map(c => c.categoryName).join(' > '),
        shippingCost: item.shippingOptions?.[0]?.shippingCost?.value || null,
        listingType:  item.buyingOptions?.[0],
      }));

      return res.status(200).json({
        total: data.total || 0,
        count: items.length,
        offset: parseInt(offset),
        items,
      });
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
