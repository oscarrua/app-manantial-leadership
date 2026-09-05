<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'

const isLoading = ref(false)

const loginWithGoogle = async () => {
  isLoading.value = true
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  
  if (error) {
    console.error("Error en autenticación:", error.message)
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex justify-center items-center p-5 bg-gradient-to-br from-bg-light to-[#dcecfc]">
    <div class="bg-white rounded-3xl shadow-[0_15px_35px_rgba(0,40,80,0.08)] p-12 text-center w-full max-w-md border-t-6 border-corporate animate-[fadeInUp_0.6s_ease-out]">
      
      <div class="mb-3 flex justify-center">
        <!-- Ajusta el nombre de tu archivo de logo aquí -->
        <img src="../assets/logo.png" class="w-[200px] h-auto mb-8 drop-shadow-md transition-transform duration-300" alt="Logo Manantial">
      </div>
      
      <h3 class="font-extrabold text-corporate text-2xl mb-2">Bienvenido Amado</h3>
      <p class="text-gray-500 mb-10 font-medium text-sm">Plataforma de Gestión de Liderazgo</p>

      <button 
        @click="loginWithGoogle" 
        :disabled="isLoading"
        class="w-full bg-white border border-gray-300 text-[#3c4043] font-bold rounded-full py-3 px-5 text-base transition-all duration-300 shadow-[0_4px_6px_rgba(50,50,93,0.11)] hover:shadow-lg active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
      >
        <span v-if="isLoading" class="animate-spin h-5 w-5 border-2 border-corporate border-t-transparent rounded-full"></span>
        <img v-else src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" class="w-6">
        {{ isLoading ? 'Conectando...' : 'Iniciar sesión con Google' }}
      </button>
    </div>
  </div>
</template>