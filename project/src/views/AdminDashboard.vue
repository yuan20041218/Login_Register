<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const users = ref([])
const showAddUserModal = ref(false)
const showEditUserModal = ref(false)
const formData = ref({
  id: null,
  name: '',
  password: '',
  role: 'user'
})

const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:3000/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    users.value = response.data
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

const handleAddUser = async () => {
  try {
    const token = localStorage.getItem('token')
    await axios.post('http://localhost:3000/api/users', formData.value, {
      headers: { Authorization: `Bearer ${token}` }
    })
    closeModal()
    fetchUsers()
  } catch (error) {
    alert('添加用户失败')
  }
}

const editUser = (user) => {
  formData.value = { ...user, password: '' }
  showEditUserModal.value = true
}

const handleEditUser = async () => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(`http://localhost:3000/api/users/${formData.value.id}`, formData.value, {
      headers: { Authorization: `Bearer ${token}` }
    })
    closeModal()
    fetchUsers()
  } catch (error) {
    alert('编辑用户失败')
  }
}

const deleteUser = async (id) => {
  if (confirm('确定要删除该用户吗？')) {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:3000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchUsers()
    } catch (error) {
      alert('删除用户失败')
    }
  }
}

const closeModal = () => {
  showAddUserModal.value = false
  showEditUserModal.value = false
  formData.value = {
    id: null,
    name: '',
    password: '',
    role: 'user'
  }
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div>
    <nav class="nav">
      <div class="container">
        <div class="nav-content">
          <h1 class="nav-title">管理员面板</h1>
          <button @click="logout" class="btn btn-danger">退出登录</button>
        </div>
      </div>
    </nav>

    <main class="container" style="padding-top: 2rem">
      <div style="margin-bottom: 1rem">
        <button @click="showAddUserModal = true" class="btn btn-primary">
          添加用户
        </button>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>角色</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.role }}</td>
              <td>
                <button
                  @click="editUser(user)"
                  class="btn btn-primary space-x-2"
                  style="margin-right: 0.5rem"
                >
                  编辑
                </button>
                <button
                  @click="deleteUser(user.id)"
                  class="btn btn-danger"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Add/Edit User Modal -->
    <div v-if="showAddUserModal || showEditUserModal" class="modal-overlay">
      <div class="modal">
        <h2 class="modal-title">{{ showEditUserModal ? '编辑用户' : '添加用户' }}</h2>
        <form @submit.prevent="showEditUserModal ? handleEditUser() : handleAddUser()">
          <div class="form-group">
            <label>用户名</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input
              v-model="formData.password"
              type="password"
              class="form-input"
              :required="!showEditUserModal"
            />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select
              v-model="formData.role"
              class="form-input"
            >
              <option value="user">用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem">
            <button
              type="button"
              @click="closeModal"
              class="btn"
              style="background-color: #e5e7eb"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn btn-primary"
            >
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>