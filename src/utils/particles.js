// 粒子系统工具函数
export class ParticleSystem {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.particles = []
    
    // 默认配置
    this.config = {
      particleCount: 50,
      particleSize: 2,
      particleSpeed: 0.5,
      particleColor: '#00FFFF',
      connectionDistance: 100,
      connectionOpacity: 0.3,
      ...options
    }
    
    this.init()
  }
  
  init() {
    this.resizeCanvas()
    this.createParticles()
    this.animate()
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => this.resizeCanvas())
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }
  
  createParticles() {
    this.particles = []
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.particleSpeed,
        vy: (Math.random() - 0.5) * this.config.particleSpeed,
        size: Math.random() * this.config.particleSize + 1,
        opacity: Math.random() * 0.5 + 0.3
      })
    }
  }
  
  updateParticles() {
    this.particles.forEach(particle => {
      // 更新位置
      particle.x += particle.vx
      particle.y += particle.vy
      
      // 边界检测
      if (particle.x < 0 || particle.x > this.canvas.width) {
        particle.vx *= -1
      }
      if (particle.y < 0 || particle.y > this.canvas.height) {
        particle.vy *= -1
      }
      
      // 保持在画布内
      particle.x = Math.max(0, Math.min(this.canvas.width, particle.x))
      particle.y = Math.max(0, Math.min(this.canvas.height, particle.y))
    })
  }
  
  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(0, 255, 255, ${particle.opacity})`
      this.ctx.fill()
      
      // 添加发光效果
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = this.config.particleColor
      this.ctx.fill()
      this.ctx.shadowBlur = 0
    })
  }
  
  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const particle1 = this.particles[i]
        const particle2 = this.particles[j]
        
        const distance = Math.sqrt(
          Math.pow(particle1.x - particle2.x, 2) + 
          Math.pow(particle1.y - particle2.y, 2)
        )
        
        if (distance < this.config.connectionDistance) {
          const opacity = (1 - distance / this.config.connectionDistance) * this.config.connectionOpacity
          
          this.ctx.beginPath()
          this.ctx.moveTo(particle1.x, particle1.y)
          this.ctx.lineTo(particle2.x, particle2.y)
          this.ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`
          this.ctx.lineWidth = 1
          this.ctx.stroke()
        }
      }
    }
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.updateParticles()
    this.drawConnections()
    this.drawParticles()
    
    requestAnimationFrame(() => this.animate())
  }
  
  // 添加鼠标交互
  addMouseInteraction() {
    let mouseX = 0
    let mouseY = 0
    
    this.canvas.addEventListener('mousemove', (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      
      // 鼠标附近的粒子会被吸引
      this.particles.forEach(particle => {
        const distance = Math.sqrt(
          Math.pow(particle.x - mouseX, 2) + 
          Math.pow(particle.y - mouseY, 2)
        )
        
        if (distance < 100) {
          const force = (100 - distance) / 100 * 0.01
          const angle = Math.atan2(mouseY - particle.y, mouseX - particle.x)
          particle.vx += Math.cos(angle) * force
          particle.vy += Math.sin(angle) * force
        }
      })
    })
  }
  
  // 销毁粒子系统
  destroy() {
    window.removeEventListener('resize', this.resizeCanvas)
    this.particles = []
  }
}

// 创建粒子背景的便捷函数
export function createParticleBackground(containerId, options = {}) {
  const container = document.getElementById(containerId)
  if (!container) return null
  
  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '-1'
  canvas.style.opacity = '0.3'
  
  container.appendChild(canvas)
  
  const particleSystem = new ParticleSystem(canvas, options)
  particleSystem.addMouseInteraction()
  
  return particleSystem
}

// 赛博风格的数据流动画
export class DataFlowAnimation {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.dataPoints = []
    
    this.config = {
      flowSpeed: 2,
      pointCount: 20,
      lineColor: '#00FFFF',
      pointColor: '#FF3300',
      ...options
    }
    
    this.init()
  }
  
  init() {
    this.resizeCanvas()
    this.createDataFlow()
    this.animate()
    
    window.addEventListener('resize', () => this.resizeCanvas())
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth
    this.canvas.height = this.canvas.offsetHeight
  }
  
  createDataFlow() {
    this.dataPoints = []
    for (let i = 0; i < this.config.pointCount; i++) {
      this.dataPoints.push({
        x: -50,
        y: Math.random() * this.canvas.height,
        speed: Math.random() * this.config.flowSpeed + 1,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        delay: Math.random() * 2000
      })
    }
  }
  
  updateDataFlow() {
    this.dataPoints.forEach(point => {
      if (Date.now() > point.delay) {
        point.x += point.speed
        
        if (point.x > this.canvas.width + 50) {
          point.x = -50
          point.y = Math.random() * this.canvas.height
          point.delay = Date.now() + Math.random() * 1000
        }
      }
    })
  }
  
  drawDataFlow() {
    // 绘制流动线条
    this.ctx.strokeStyle = this.config.lineColor
    this.ctx.lineWidth = 1
    this.ctx.globalAlpha = 0.3
    
    for (let i = 0; i < 5; i++) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, (this.canvas.height / 5) * i)
      this.ctx.lineTo(this.canvas.width, (this.canvas.height / 5) * i)
      this.ctx.stroke()
    }
    
    // 绘制数据点
    this.dataPoints.forEach(point => {
      if (Date.now() > point.delay) {
        this.ctx.globalAlpha = point.opacity
        this.ctx.fillStyle = this.config.pointColor
        this.ctx.beginPath()
        this.ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2)
        this.ctx.fill()
        
        // 添加拖尾效果
        const gradient = this.ctx.createLinearGradient(point.x - 20, point.y, point.x, point.y)
        gradient.addColorStop(0, 'rgba(255, 51, 0, 0)')
        gradient.addColorStop(1, 'rgba(255, 51, 0, 0.8)')
        
        this.ctx.fillStyle = gradient
        this.ctx.fillRect(point.x - 20, point.y - 1, 20, 2)
      }
    })
    
    this.ctx.globalAlpha = 1
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.updateDataFlow()
    this.drawDataFlow()
    
    requestAnimationFrame(() => this.animate())
  }
  
  destroy() {
    window.removeEventListener('resize', this.resizeCanvas)
    this.dataPoints = []
  }
}
