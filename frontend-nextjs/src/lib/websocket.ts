/**
 * WebSocket客户端管理
 * 用于实时更新Agent状态、知识库变更等
 */

type MessageHandler = (data: any) => void

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isConnecting = false

  constructor(url: string) {
    this.url = url
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve()
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected')
          this.isConnecting = false
          this.stopHeartbeat()
          this.attemptReconnect()
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * 发送消息
   */
  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
      }
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  /**
   * 订阅消息类型
   */
  subscribe(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(type, handler)
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.handlers.delete(type)
      }
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage) {
    const handlers = this.handlers.get(message.type)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.data)
        } catch (error) {
          console.error(`Error in message handler for type ${message.type}:`, error)
        }
      })
    }

    // 处理所有消息的通用处理器
    const allHandlers = this.handlers.get('*')
    if (allHandlers) {
      allHandlers.forEach((handler) => {
        try {
          handler(message)
        } catch (error) {
          console.error('Error in wildcard message handler:', error)
        }
      })
    }
  }

  /**
   * 尝试重新连接
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnect failed:', error)
      })
    }, delay)
  }

  /**
   * 启动心跳
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() })
      }
    }, 30000) // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// 创建单例实例
let wsClient: WebSocketClient | null = null

/**
 * 获取WebSocket客户端实例
 */
export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    // 在生产环境中，这应该从环境变量读取
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'
    wsClient = new WebSocketClient(wsUrl)
  }
  return wsClient
}

/**
 * React Hook: 使用WebSocket
 */
export function useWebSocket(type: string, handler: MessageHandler) {
  const client = getWebSocketClient()

  // 在组件挂载时订阅，卸载时取消订阅
  if (typeof window !== 'undefined') {
    const unsubscribe = client.subscribe(type, handler)
    return unsubscribe
  }

  return () => {}
}

export default WebSocketClient

