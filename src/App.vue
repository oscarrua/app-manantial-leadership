<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './supabase'
import { useMainStore } from './stores/mainStore' // Nuevo
import ToastNotification from './components/ToastNotification.vue'

const router = useRouter()
const store = useMainStore() // Nuevo
const session = ref(null)
const userProfile = ref({ name: '', email: '', picture: '' })

// NUEVO: Estado para el menú móvil
const isMobileMenuOpen = ref(false)

onMounted(() => {
  // Verificar sesión activa
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
    if (data.session) extractProfile(data.session.user)
  })

  // Escuchar cambios de autenticación
  supabase.auth.onAuthStateChange((_event, _session) => {
    session.value = _session
    if (_session) {
      extractProfile(_session.user)
    } else {
      router.push('/login')
    }
  })
})

const extractProfile = async (user) => {
  userProfile.value = {
    name: user.user_metadata?.full_name || 'Usuario',
    email: user.email,
    picture: user.user_metadata?.avatar_url || ''
  }
  
  // Llamada al store para cargar roles usando el email autenticado
  await store.loadUserPermissions(user.email)
}

const logout = async () => {
  await supabase.auth.signOut()
}

// NUEVO: Función para alternar el menú y cerrarlo al navegar
const toggleMenu = () => isMobileMenuOpen.value = !isMobileMenuOpen.value
const closeMenu = () => isMobileMenuOpen.value = false
</script>

<template>
  <div v-if="session" class="min-h-screen bg-bg-light">
    
    <nav class="bg-gradient-to-r from-corporate to-[#003366] shadow-md px-4 py-3 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto flex justify-between items-center relative">
        
        <button 
          @click="toggleMenu" 
          class="md:hidden text-white p-2 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-gold z-50 relative"
          aria-label="Alternar menú"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <div class="hidden md:flex gap-3 items-center">
          <router-link to="/" class="bg-white/10 text-white hover:bg-white hover:text-corporate px-5 py-2 rounded-full font-bold transition-all shadow-sm" active-class="!bg-[#ffb700] !text-[#002244] shadow-md">
            Consolidaciones
          </router-link>
          <router-link to="/manantiales" class="bg-white/10 text-white hover:bg-white hover:text-corporate px-5 py-2 rounded-full font-bold transition-all shadow-sm" active-class="!bg-[#ffb700] !text-[#002244] shadow-md">
            Manantiales
          </router-link>
        </div>

        <div class="flex items-center gap-3 relative z-50">
          <div class="flex items-center gap-2 bg-white/10 md:px-4 px-2 py-1.5 rounded-full border border-white/30 transition-all">
            <img v-if="userProfile.picture" :src="userProfile.picture" referrerpolicy="no-referrer" class="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-white object-cover shadow-sm" alt="Avatar">
            <div v-else class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white text-corporate font-bold flex items-center justify-center shadow-sm text-sm">
              {{ userProfile.name.charAt(0) }}
            </div>
            <div class="hidden md:block text-white text-left leading-tight pr-2">
              <div class="text-sm font-bold truncate max-w-[150px]">{{ userProfile.name }}</div>
              <div class="text-[10px] opacity-80 truncate max-w-[150px]">{{ userProfile.email }}</div>
            </div>
          </div>
          <!-- Botón de Salir (Rojo optimizado para UX) -->
          <button 
            @click="logout" 
            class="flex items-center gap-2 text-white bg-red-500/20 border border-red-400/50 hover:bg-red-600 hover:border-red-600 hover:shadow-md px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
            aria-label="Cerrar sesión"
          >
            <span class="hidden md:inline">Salir</span>
            <span class="md:hidden">Salir</span>
            <!-- Icono SVG de "Log out" (opcional, ayuda visualmente) -->
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>

        <transition name="slide-fade">
          <div v-if="isMobileMenuOpen" class="md:hidden absolute top-full left-0 w-full bg-[#003366]/95 backdrop-blur-md p-4 shadow-xl rounded-b-xl border-t border-white/10 flex flex-col gap-4 z-40">
            <router-link 
              to="/" 
              @click="closeMenu"
              class="bg-white/10 text-white hover:bg-white hover:text-corporate px-5 py-3 rounded-xl font-bold transition-all text-center w-full shadow-sm" 
              active-class="!bg-[#ffb700] !text-[#002244] shadow-md scale-[1.02]"
            >
              Consolidaciones
            </router-link>
            
            <router-link 
              to="/manantiales" 
              @click="closeMenu"
              class="bg-white/10 text-white hover:bg-white hover:text-corporate px-5 py-3 rounded-xl font-bold transition-all text-center w-full shadow-sm" 
              active-class="!bg-[#ffb700] !text-[#002244] shadow-md scale-[1.02]"
            >
              Manantiales
            </router-link>
          </div>
        </transition>

      </div>
    </nav>

    <div class="max-w-7xl mx-auto p-4">
      <router-view></router-view>
    </div>
  </div>

  <router-view v-else></router-view>

  <ToastNotification />
</template>

<style scoped>
/* Transición para el menú móvil */
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-15px);
  opacity: 0;
}
</style>