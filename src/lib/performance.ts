// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  timestamp: number
  operation: string
  duration: number
  success: boolean
  error?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private readonly maxMetrics = 100

  startTimer(operation: string): (success?: boolean, error?: string) => void {
    const start = performance.now()
    
    return (success: boolean = true, error?: string) => {
      const duration = performance.now() - start
      this.recordMetric({
        timestamp: Date.now(),
        operation,
        duration,
        success,
        error
      })
    }
  }

  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation)
    }
    return [...this.metrics]
  }

  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetrics(operation)
    if (operationMetrics.length === 0) return 0
    
    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0)
    return totalDuration / operationMetrics.length
  }

  getSuccessRate(operation: string): number {
    const operationMetrics = this.getMetrics(operation)
    if (operationMetrics.length === 0) return 0
    
    const successCount = operationMetrics.filter(m => m.success).length
    return (successCount / operationMetrics.length) * 100
  }

  clear() {
    this.metrics = []
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Utility function for measuring async operations
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const endTimer = performanceMonitor.startTimer(operation)
  
  try {
    const result = await fn()
    endTimer()
    return result
  } catch (error) {
    endTimer(false, error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecution = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastExecution >= delay) {
      lastExecution = now
      func(...args)
    }
  }
}

// Memory usage monitoring
export function getMemoryUsage(): any | null {
  if ('memory' in performance) {
    return (performance as any).memory
  }
  return null
}

// Network connectivity check
export function isOnline(): boolean {
  return navigator.onLine
}

// Basic logging for performance issues
export function logPerformanceIssue(operation: string, duration: number, threshold: number = 1000) {
  if (duration > threshold) {
    console.warn(`Performance issue detected: ${operation} took ${duration}ms (threshold: ${threshold}ms)`)
  }
}