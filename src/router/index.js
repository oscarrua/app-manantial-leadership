import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase' // <- 1. Importamos Supabase aquí

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/manantiales',
      name: 'manantiales',
      component: () => import('../views/ManantialesView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// 2. NUEVO: Guardián Global de Navegación (Navigation Guard)
router.beforeEach(async (to, from, next) => {
  // Verificamos si la ruta a la que intenta ir requiere autenticación
  if (to.meta.requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession()
    
    // Si no hay sesión válida, lo enviamos al login inmediatamente
    if (!session) {
      return next('/login')
    }
  }
  // Si todo está bien (o la ruta es pública), permitimos el paso
  next()
})

export default router