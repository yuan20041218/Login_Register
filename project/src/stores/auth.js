import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token')
  }),
  
  actions: {
    async login(name, password) {
      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          name,
          password
        })
        
        const { token, user } = response.data
        this.token = token
        this.user = user
        localStorage.setItem('token', token)
        localStorage.setItem('userRole', user.role)
        
        return { success: true }
      } catch (error) {
        return { success: false, error: 'Invalid credentials' }
      }
    },

    async register(name, password) {
      try {
        await axios.post('http://localhost:3000/api/auth/register', {
          name,
          password
        })
        return { success: true }
      } catch (error) {
        return { success: false, error: 'Registration failed' }
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
    }
  }
})