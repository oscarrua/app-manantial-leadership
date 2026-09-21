<script setup>
import { ref, watch, onMounted } from 'vue'
import { supabase } from '../../supabase'
import { useToast } from '../../composables/useToast'
import { formatDate } from '../../utils/helpers'

const props = defineProps({
  visitor: { type: Object, required: true }
})

const { showToast } = useToast()

// === ESTADO DEL COMPONENTE ===
const history = ref([])
const isHistoryLoading = ref(false)
const isSaving = ref(false)
const isFormVisible = ref(false)

// Manejo de la fecha actual con compensación de zona horaria local
const today = new Date()
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0]

const form = ref({
  fecha_gestion: localDate,
  tipo_gestion: '',
  resultado: ''
})

// === FUNCIONES PRINCIPALES ===
const loadHistory = async (id) => {
  if (!id) return
  isHistoryLoading.value = true
  const { data, error } = await supabase
    .from('gestiones')
    .select('*')
    .eq('consolidacion_id', id)
    .order('fecha_gestion', { ascending: false })
  
  if (!error && data) {
    history.value = data
  } else if (error) {
    console.error('Error cargando historial:', error)
  }
  isHistoryLoading.value = false
}

const saveManagement = async () => {
  if (!form.value.tipo_gestion || !form.value.resultado) return
  isSaving.value = true
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const payload = {
    consolidacion_id: props.visitor.id,
    fecha_gestion: form.value.fecha_gestion,
    tipo_gestion: form.value.tipo_gestion,
    resultado: form.value.resultado,
    usuario: user?.user_metadata?.full_name || user?.email || 'Usuario'
  }

  const { error } = await supabase.from('gestiones').insert(payload)
  
  if (!error) {
    // Actualizamos la fecha de última modificación del visitante
    const now = new Date().toISOString()
    await supabase.from('consolidaciones').update({ updated_at: now }).eq('id', props.visitor.id)
      
    // Reactividad: Actualizamos el prop localmente para que se refleje en la tabla de fondo
    if (props.visitor) props.visitor.updated_at = now

    // Limpieza de formulario
    form.value.tipo_gestion = ''
    form.value.resultado = ''
    isFormVisible.value = false
    
    showToast('Gestión registrada correctamente', 'success')
    await loadHistory(props.visitor.id) // Recargamos la lista
  } else {
    showToast(`Error al guardar gestión: ${error.message}`, 'error')
  }
  isSaving.value = false
}

// === CICLO DE VIDA Y REACTIVIDAD ===
// Cargar historial al montar si ya hay un ID
onMounted(() => {
  loadHistory(props.visitor?.id)
})

// Si el usuario cambia de visitante sin cerrar el panel modal, recargamos el historial y cerramos el form
watch(() => props.visitor?.id, (newId) => {
  isFormVisible.value = false
  loadHistory(newId)
})
</script>

<template>
  <details name="acordeon-detalle" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <!-- Resumen del Acordeón -->
    <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate group-open:hover:text-white">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Historial y Gestiones</span>
        <!-- Badge dinámico de cantidad -->
        <span v-if="history.length > 0" class="bg-corporate group-open:bg-white group-open:text-corporate text-white text-[10px] px-2 py-0.5 rounded-full transition-colors font-extrabold shadow-sm">
          {{ history.length }}
        </span>
      </div>
      <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    </summary>
    
    <div class="p-0 border-t border-gray-100 bg-white relative">
      <!-- Header fijo del panel de gestiones -->
      <div class="flex justify-between items-center p-3 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Registro de Actividad</span>
        <button 
          @click="isFormVisible = !isFormVisible" 
          type="button"
          class="text-corporate bg-corporate/10 hover:bg-corporate hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors active:scale-95 flex items-center gap-1"
        >
          {{ isFormVisible ? '✕ Cancelar' : '+ Nueva Gestión' }}
        </button>
      </div>

      <!-- Formulario Deslizante -->
      <transition name="slide-fade">
        <div v-show="isFormVisible" class="p-4 bg-blue-50/50 border-b border-blue-100">
          <form @submit.prevent="saveManagement" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1 block">Fecha</label>
                <input type="date" v-model="form.fecha_gestion" class="w-full text-sm border border-gray-200 p-2.5 rounded-lg outline-none focus:border-corporate focus:ring-1 focus:ring-corporate bg-white shadow-sm transition-all" required>
              </div>
              <div>
                <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1 block">Tipo</label>
                <select v-model="form.tipo_gestion" class="w-full text-sm border border-gray-200 p-2.5 rounded-lg outline-none focus:border-corporate focus:ring-1 focus:ring-corporate bg-white shadow-sm transition-all" required>
                  <option value="" disabled>Seleccione...</option>
                  <option>Llamada</option>
                  <option>Visita</option>
                  <option>Manantial</option>
                  <option>Iglesia</option>
                  <option>Encuentro</option>
                  <option>Seguimiento consolidación</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-[10px] text-gray-500 font-bold uppercase tracking-wide block mb-1">Resultado / Detalles</label>
              <textarea v-model="form.resultado" rows="3" class="w-full text-sm border border-gray-200 p-3 rounded-lg outline-none focus:border-corporate focus:ring-1 focus:ring-corporate bg-white resize-none style-scrollbar shadow-sm transition-all" placeholder="Describe los detalles de la interacción..." required></textarea>
            </div>
            <button type="submit" :disabled="isSaving" class="w-full bg-corporate text-white font-bold text-sm py-3 rounded-xl hover:bg-[#003366] transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md active:scale-95">
              <div v-if="isSaving" class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              {{ isSaving ? 'Guardando...' : 'Guardar Gestión' }}
            </button>
          </form>
        </div>
      </transition>

      <!-- Lista de Gestiones (Historial) -->
      <div v-if="isHistoryLoading" class="p-8 text-center text-sm text-gray-500">
        <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-corporate mx-auto mb-3"></div>
        <span class="font-medium animate-pulse">Cargando historial...</span>
      </div>
      
      <div v-else-if="history.length === 0 && !isFormVisible" class="p-8 text-center text-sm text-gray-400 italic">
        Sin registros previos. Presiona <b class="text-corporate">"+ Nueva Gestión"</b> para iniciar.
      </div>
      
      <div v-else class="max-h-[300px] overflow-y-auto divide-y divide-gray-100 style-scrollbar">
        <div v-for="rec in history" :key="rec.id" class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="font-extrabold text-corporate text-xs">{{ formatDate(rec.fecha_gestion) }}</div>
              <div class="text-[10px] text-gray-400 max-w-[150px] truncate font-medium mt-0.5" :title="rec.usuario">
                👤 {{ rec.usuario }}
              </div>
            </div>
            <span class="bg-blue-50 text-corporate border border-blue-100 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide">
              {{ rec.tipo_gestion }}
            </span>
          </div>
          <p class="text-sm text-gray-700 m-0 leading-relaxed whitespace-pre-wrap">{{ rec.resultado }}</p>
        </div>
      </div>
    </div>
  </details>
</template>