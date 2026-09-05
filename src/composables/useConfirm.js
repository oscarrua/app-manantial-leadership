import { ref } from 'vue'

const confirmState = ref({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Sí, confirmar',
  cancelText: 'Cancelar',
  resolvePromise: null
})

export function useConfirm() {
  const showConfirm = (options) => {
    return new Promise((resolve) => {
      confirmState.value = {
        isOpen: true,
        title: options.title || '¿Confirmar acción?',
        message: options.message || '',
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        resolvePromise: resolve
      }
    })
  }

  const resolve = (result) => {
    if (confirmState.value.resolvePromise) {
      confirmState.value.resolvePromise(result)
    }
    confirmState.value.isOpen = false
  }

  return { confirmState, showConfirm, resolve }
}