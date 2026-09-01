<script setup>
import { useToast } from '../composables/useToast'
const { toastState } = useToast()
</script>

<template>
  <transition name="toast-slide">
    <div v-if="toastState.show" 
         class="fixed bottom-5 right-5 z-[9999] px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 border"
         :class="toastState.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
      
      <span v-if="toastState.type === 'success'" class="text-lg">✓</span>
      <span v-else class="text-lg">⚠</span>
      
      {{ toastState.message }}
    </div>
  </transition>
</template>

<style scoped>
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s ease; }
.toast-slide-enter-from { opacity: 0; transform: translateY(20px) scale(0.95); }
.toast-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }
</style>