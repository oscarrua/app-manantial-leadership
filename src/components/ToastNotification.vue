<script setup>
import { useToast } from '../composables/useToast'
const { toastState } = useToast()
</script>

<template>
  <!-- Contenedor posicionado en la parte superior central. 
       El pointer-events-none permite hacer clic a través del contenedor invisible -->
  <div class="fixed top-6 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
    <transition name="toast-slide">
      <div v-if="toastState.show" 
           class="pointer-events-auto px-6 py-3.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] font-bold text-sm flex items-center gap-3 border w-full sm:w-auto sm:min-w-[300px] justify-center"
           :class="toastState.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
        
        <span v-if="toastState.type === 'success'" class="text-lg leading-none">✓</span>
        <span v-else class="text-lg leading-none">⚠</span>
        
        <span class="text-center">{{ toastState.message }}</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Transición mejorada para que caiga desde arriba con un rebote suave (UX) */
.toast-slide-enter-active, .toast-slide-leave-active { 
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
}
.toast-slide-enter-from { 
  opacity: 0; 
  transform: translateY(-40px) scale(0.9); 
}
.toast-slide-leave-to { 
  opacity: 0; 
  transform: translateY(-20px) scale(0.9); 
}
</style>