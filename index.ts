import express from 'express';
const app = express();
app.use(express.json());

// 直接读取 Railway 注入的环境变量，不使用 dotenv
const CURRENCY_API_KEY = process.env.CURRENCY_API_KEY;
const SB_ANON = process.env.SB_ANON;
const API_SECRET = process.env.API_SECRET;

// 必须监听 Railway 提供的 PORT，默认是 8080
const PORT = process.env.PORT || 8080;
const SB_URL = 'https://rhyjuyvipbjtttmeqtdq.supabase.co';

// 密码验证
function auth(req, res, next) {
  const { secret } = req.body;
  if (!secret || secret !== API_SECRET) {
    return res.status(403).json({ ok: false, error: '无权访问' });
  }
  next();
}

// 抓取汇率并存数据库
async function fetchAndSaveRates() {
  const url = `https://api.currencyapi.com/v3/latest?apikey=${CURRENCY_API_KEY}&base_currency=USD&currencies=CNY,EUR,GBP,CAD,XAU`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`CurrencyAPI 请求失败 ${resp.status}`);

  const json = await resp.json();
  const r = json.data;

  const rates = {
    usd_cny: r.CNY.value,
    eur_cny: r.CNY.value / r.EUR.value,
    gbp_cny: r.CNY.value / r.GBP.value,
    cad_cny: r.CNY.value / r.CAD.value,
    usd_cad: r.CAD.value,
    gold_cny: r.CNY.value / r.XAU.value / 31.1035,
    timestamp: json.meta.last_updated_at,
  };

  const sbResp = await fetch(`${SB_URL}/rest/v1/exchanges`, {
    method: 'POST',
    headers: {
      apikey: SB_ANON,
      Authorization: `Bearer ${SB_ANON}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify([rates]),
  });

  if (!sbResp.ok) {
    const txt = await sbResp.text();
    throw new Error(`Supabase 错误 ${sbResp.status}: ${txt}`);
  }

  return rates;
}

// 调试接口（Railway 日志里直接看）
app.get('/env', (req, res) => {
  res.json({
    API_SECRET: !!API_SECRET,
    CURRENCY_API_KEY: !!CURRENCY_API_KEY,
    SB_ANON: !!SB_ANON,
    port: PORT,
  });
});

// 接口
app.post('/api/update', auth, async (req, res) => {
  try {
    const data = await fetchAndSaveRates();
    res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 启动监听
app.listen(PORT, () => {
  console.log(`✅ 服务已启动，监听端口: ${PORT}`);
});
