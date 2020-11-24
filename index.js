require('dotenv').config()
const ccxt = require('ccxt')
const axios = require('axios')

const tick = async (config, poloniexClient) => {
  const { asset, base, allocation, spread } = config
  const market = `${asset}/${base}`

  const orders = await poloniexClient.fetchOpenOrders()
  console.log(`${market} Orders: ${orders.length}`)
  orders.forEach((order) => {
    poloniexClient.cancelOrder(order.id)
  })

  const results = await Promise.all([
    axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
    axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd')
  ])

  const marketPrice = results[0].data.bitcoin.usd / results[1].data.tether.usd
  const sellPrice = marketPrice * (1 + spread)
  const buyPrice = marketPrice * (1 - spread)

  console.log('Market Price: ', marketPrice)

  const balances = await poloniexClient.fetchBalance();
  const assetBalance = balances.free[asset]; // e.g. 0.01 BTC
  const baseBalance = balances.free[base]; // e.g. 20 USDT
}

const run = () => {
  const config = {
    asset: "BTC",
    base: "USDT",
    allocation: 0.25,    // % of available funds for trading
    spread: 0.2,         // % margin around market price for sell and buy orders
    interval: 3000       // Tick duration (ms)
  }
  const poloniexClient = new ccxt.poloniex({
    apiKey: process.env.API_KEY,
    secret: process.env.API_SECRET
  })
  tick(config, poloniexClient)
  setTimeout(tick, config.interval, config, poloniexClient)
}

run()