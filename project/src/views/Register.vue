<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const password = ref('')

const handleRegister = async () => {
  const result = await authStore.register(name.value, password.value)
  if (result.success) {
    alert('注册成功！')
    router.push('/login')
  } else {
    alert('注册失败：' + result.error)
  }
}
</script>

<template>
  <div class="bk">
  <div class="auth-container">
    <div class="auth-form">
      <div>
        <h2 class="auth-title">注册</h2>
      </div>
      <form @submit.prevent="handleRegister">
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
          注册
        </button>
      </form>
      <div class="text-center mt-4">
        <router-link to="/login" class="link">
          已有账号？点击登录
        </router-link>
      </div>
    </div>
  </div>
</div>
</template>