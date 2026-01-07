/**
 * HTTP请求工具类
 * 封装axios，提供统一的请求处理
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳
    config.headers['X-Request-Time'] = Date.now()
    
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const { data } = response
    
    // 统一处理响应格式
    if (data && typeof data === 'object') {
      // 如果后端返回的是标准格式 { success, data, message }
      if (data.hasOwnProperty('success')) {
        if (data.success) {
          return data
        } else {
          ElMessage.error(data.message || '请求失败')
          return Promise.reject(new Error(data.message || '请求失败'))
        }
      }
      
      // 如果后端返回的是直接数据
      return {
        success: true,
        data: data,
        message: 'success'
      }
    }
    
    return response
  },
  error => {
    console.error('响应拦截器错误:', error)
    
    let message = '网络错误'
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          message = data?.message || '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 清除token并跳转到登录页
          localStorage.removeItem('token')
          // router.push('/login')
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = data?.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      message = '网络连接失败'
    } else {
      message = error.message || '请求配置错误'
    }
    
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  }
)

/**
 * GET请求
 */
export const get = (url, params = {}) => {
  return request({
    method: 'GET',
    url,
    params
  })
}

/**
 * POST请求
 */
export const post = (url, data = {}) => {
  return request({
    method: 'POST',
    url,
    data
  })
}

/**
 * PUT请求
 */
export const put = (url, data = {}) => {
  return request({
    method: 'PUT',
    url,
    data
  })
}

/**
 * DELETE请求
 */
export const del = (url, params = {}) => {
  return request({
    method: 'DELETE',
    url,
    params
  })
}

/**
 * 文件上传
 */
export const upload = (url, formData, onProgress) => {
  return request({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress
  })
}

/**
 * 文件下载
 */
export const download = (url, params = {}, filename) => {
  return request({
    method: 'GET',
    url,
    params,
    responseType: 'blob'
  }).then(response => {
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  })
}

export { request }
export default request
