<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const userData = ref(null)

const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:3000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    userData.value = response.data
  } catch (error) {
    console.error('Error fetching user data:', error)
  }
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchUserData()
})
</script>

<template>
  <div>
    <nav class="nav">
      <div class="container">
        <div class="nav-content">
          <h1 class="nav-title">用户面板</h1>
          <button @click="logout" class="btn btn-danger">退出登录</button>
        </div>
      </div>
    </nav>

    <main class="container" style="padding-top: 2rem">
      <div class="card">
        <h2 style="margin-top: 0; margin-bottom: 1rem">个人信息</h2>
        <div v-if="userData">
          <p><strong>用户名：</strong>{{ userData.name }}</p>
          <p><strong>角色：</strong>{{ userData.role }}</p>
        </div>
        <div v-else>加载中...</div>
      </div>
    </main>
  </div>
</template>