import { ref } from 'vue'

const toastState = ref({ show: false, message: '', type: 'success' })

export function useToast() {
  const showToast = (message, type = 'success') => {
    toastState.value = { show: true, message, type }
    setTimeout(() => {
      toastState.value.show = false
    }, 3000)
  }

  return { toastState, showToast }
}