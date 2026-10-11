import { AxiosError } from 'axios'

type Args = {
  name: string
  data: AxiosError | unknown
  type: 'request' | 'response' | 'catch'
  payload?: any
  isServer?: boolean
}

const logStyles = {
  request: 'background: #222; color: #00FFFF',
  response: 'background: #222; color: #00FF00',
  catch: 'background: #222; color: #dc3544'
}

const logEmojis = {
  request: '🚀',
  response: '📥',
  catch: '🚨',
  payload: '💾 '
}

const log = ({ name, data, type, payload, isServer }: Args) => {
  if (!data) return // Если данных нет, не логируем

  console.log('%c ', logStyles[type])
  {
    !isServer && console.log('%c ⬇⬇⬇......................................⬇⬇⬇', logStyles[type])
  }

  console.log(`%c ${logEmojis[type]} [${type}] ${name}`, logStyles[type])
  console.log(data)

  if (payload) {
    console.log(`%c ${logEmojis.payload} [payload]`, logStyles[type], payload)
  }

  {
    !isServer && console.log('%c ⬆⬆⬆......................................⬆⬆⬆', logStyles[type])
  }
  console.log('%c ', logStyles[type])
}

export default log
