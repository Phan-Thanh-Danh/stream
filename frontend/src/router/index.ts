import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const auth = useAuthStore()
        if (!auth.isAuthenticated) return '/login'
        return auth.isSharer ? '/sharer' : '/viewer'
      }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/sharer',
      name: 'sharer',
      component: () => import('@/views/SharerView.vue'),
      meta: { requiresAuth: true, role: 'Sharer' }
    },
    {
      path: '/viewer',
      name: 'viewer',
      component: () => import('@/views/ViewerDashboard.vue'),
      meta: { requiresAuth: true, role: 'Viewer' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

// Navigation guard
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.role === 'Sharer' && !auth.isSharer && auth.isAuthenticated) {
    return { name: 'viewer' }
  }

  if (to.meta.role === 'Viewer' && !auth.isViewer && auth.isAuthenticated) {
    return { name: 'sharer' }
  }
})

export default router
