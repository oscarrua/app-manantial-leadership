<script setup>
import { useConfirm } from '../composables/useConfirm'
const { confirmState, resolve } = useConfirm()
</script>

<template>
  <transition name="fade">
    <div v-if="confirmState.isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="resolve(false)"></div>
      
      <!-- Modal -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-[fadeInUp_0.2s_ease-out]">
        <h3 class="text-xl font-extrabold text-corporate mb-2">{{ confirmState.title }}</h3>
        <p class="text-gray-600 text-sm mb-6 whitespace-pre-wrap" v-html="confirmState.message"></p>
        
        <div class="flex gap-3 justify-end">
          <button @click="resolve(false)" class="px-4 py-2 rounded-lg font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95">
            {{ confirmState.cancelText }}
          </button>
          <button @click="resolve(true)" class="px-4 py-2 rounded-lg font-bold text-white bg-corporate hover:bg-[#003366] shadow-md transition-colors active:scale-95">
            {{ confirmState.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>