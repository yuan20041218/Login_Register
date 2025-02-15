<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const password = ref('')

const handleLogin = async () => {
  const result = await authStore.login(name.value, password.value)
  if (result.success) {
    const userRole = localStorage.getItem('userRole')
    router.push(userRole === 'admin' ? '/admin' : '/dashboard')
  } else {
    alert('登录失败：' + result.error)
  }
}
</script>

<template>
  <div class="bk">
  <div class="auth-container">
    <div class="auth-form">
      <div>
        <h2 class="auth-title">登录</h2>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="name" class="sr-only">用户名</label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            class="form-input"
            placeholder="用户名"
          />
        </div>
        <div class="form-group">
          <label for="password" class="sr-only">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="form-input"
            placeholder="密码"
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%">
          登录
        </button>
      </form>
      <div class="text-center mt-4">
        <router-link to="/register" class="link">
          还没有账号？点击注册
        </router-link>
      </div>
    </div>
  </div>
</div>
</template>