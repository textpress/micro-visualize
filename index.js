const { json } = require('micro')
const chalk = require('chalk')
const jsome = require('jsome')

function logHeaders (prefix, requestIndex, opts, headers) {
  for (let h of opts.headers || []) {
    const v = headers[h]
    if (v) {
      console.log(`${prefix} #${requestIndex} Header ${chalk.bold(h)} ${v}`)
    }
  }
}

let requestCounter = 0
function visualize (fn, opts = 'dev') {
    if (opts !== 'dev' && !opts.on ) {
      return async function () {
        return await fn.apply(null, arguments)
      }
    }

  return async function logRequest (req, res) {
    const start = new Date()
    const requestIndex = ++requestCounter
    const dateString = `${chalk.grey(start.toLocaleTimeString())}`
    console.log(`${chalk.bold('>')} #${requestIndex} ${chalk.bold(req.method)} ${req.url}\t\t${dateString}`)
    logHeaders('>', requestIndex, opts, req.headers)

    const ret = await fn.apply(null, arguments)

    if (req.method !== 'GET' &&
      req.headers['content-type'] === 'application/json') {
      try {
        const parsedJson = await json(req)
        jsome(parsedJson)
      } catch (err) {
        console.log(`JSON body could not be parsed: ${err.message}`)
      }
    }

    res.once('finish', () => {
      const delta = new Date() - start
      const time = delta < 10000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`
      const endDateString = `${chalk.grey(new Date().toLocaleTimeString())}`

      console.log(`< #${requestIndex} ${chalk.bold(res.statusCode)} [+${time}]\t${endDateString}`)
      logHeaders('<', requestIndex, opts, res._headers)

      if (res._logBody) {
        jsome(res._logBody)
      }
    })

    res._logBody = ret
    return res._logBody
  }
}

module.exports = visualize
