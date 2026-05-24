import express from 'express';
const app = express();

// ❶ 线上绝对不要 dotenv！注释掉或删掉
// import 'dotenv/config';

// ❷ 直接读 process.env，不做任何默认值
const CURRENCY_API_KEY = process.env.CURRENCY_API_KEY;
const SB_ANON = process.env.SB_ANON;
const API_SECRET = process.env.API_SECRET;

const PORT = process.env.PORT || 5899;

// ❸ 专门做一个 /env 接口，把所有相关变量打出来
app.get('/env', (req, res) => {
  res.json({
    CURRENCY_API_KEY: !!CURRENCY_API_KEY,
    SB_ANON: !!SB_ANON,
    API_SECRET: !!API_SECRET,
    // 把 process.env 所有 key 列出来，看有没有你要的
    allKeys: Object.keys(process.env)
  });
});

app.listen(PORT, () => {
  console.log('Listening on', PORT);
});
