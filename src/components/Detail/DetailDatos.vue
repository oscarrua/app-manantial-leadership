<script setup>
import { ref } from 'vue'
import { supabase } from '../../supabase'
import { useMainStore } from '../../stores/mainStore'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { formatDate } from '../../utils/helpers'

const props = defineProps({
  visitor: { type: Object, required: true }
})
const emit = defineEmits(['close'])

const store = useMainStore()
const { showToast } = useToast()
const { showConfirm } = useConfirm()

// === ESTADO Y OPCIONES ===
const isUpdatingEstado = ref(false)
const isUpdatingObservacion = ref(false)

const estadosAbiertos = ['Sin reporte', 'En proceso']
const estadosCierre = [
  'Consolidado', 
  'No consolidado', 
  'Asiste a otra iglesia', 
  'No localizado', 
  'Visita ocasional'
]

// === FUNCIONES ===
const updateEstado = async (event) => {
  const newEstado = event.target.value
  const oldEstado = props.visitor.estado 
  const isClosing = estadosCierre.includes(newEstado)

  if (isClosing) {
    const result = await showConfirm({
      title: '¿Cerrar consolidación?',
      message: `Estás a punto de cambiar el estado a <b>"${newEstado}"</b>.<br><br>Una vez guardado, este registro se considerará finalizado y <b>desaparecerá de tu lista principal</b>.`,
      confirmText: 'Sí, cerrar registro',
      cancelText: 'Cancelar'
    })

    if (!result) {
      event.target.value = oldEstado
      return
    }
  }

  isUpdatingEstado.value = true

  const { error } = await supabase
    .from('consolidaciones')
    .update({ estado: newEstado })
    .eq('id', props.visitor.id)

  if (!error) {
    if (isClosing) {
      // Eliminar reactivamente de la lista principal (Pinia)
      store.consolidaciones = store.consolidaciones.filter(c => c.id !== props.visitor.id)
      showToast('Consolidación cerrada y archivada', 'success')
      emit('close') // Cierra todo el panel orquestador
    } else {
      showToast(`Estado actualizado a: ${newEstado}`, 'success')
      props.visitor.estado = newEstado
    }
  } else {
    showToast(`Error al actualizar estado: ${error.message}`, 'error')
    event.target.value = oldEstado 
  }
  
  isUpdatingEstado.value = false
}

const updateObservacion = async () => {
  isUpdatingObservacion.value = true
  const { error } = await supabase
    .from('consolidaciones')
    .update({ observacion: props.visitor.observacion })
    .eq('id', props.visitor.id)

  if (!error) {
    showToast('Observación actualizada correctamente', 'success')
    // Actualizamos la fecha de modificación global
    const now = new Date().toISOString()
    await supabase.from('consolidaciones').update({ updated_at: now }).eq('id', props.visitor.id)
    props.visitor.updated_at = now
  } else {
    showToast(`Error al actualizar: ${error.message}`, 'error')
  }
  
  isUpdatingObservacion.value = false
}
</script>

<template>
  <div class="space-y-3">
    <!-- Acordeón 1: Consolidación y Estado -->
    <details name="acordeon-detalle" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate group-open:hover:text-white">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Consolidación</span>
        </div>
        <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </summary>
      
      <div class="p-5 bg-white grid grid-cols-2 gap-4 items-end">
        <div>
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">ID Registro</span>
          <span class="text-sm font-medium text-gray-800">#{{ visitor.id }}</span>
        </div>
        <div>
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Fecha de Visita</span>
          <span class="text-sm font-medium text-gray-800">{{ formatDate(visitor.fecha_visita) }}</span>
        </div>
        
        <div class="col-span-2 pt-2 border-t border-gray-50">
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Registrado por</span>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <span class="text-sm font-medium text-gray-800 truncate" :title="visitor.registrado_por">{{ visitor.registrado_por || 'No especificado' }}</span>
          </div>
        </div>
        
        <div class="col-span-2 pt-2 border-t border-gray-50">
          <div class="flex justify-between items-center mb-1">
            <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actualizar Estado</span>
            <span v-if="!store.userPermissions.puede_cerrar" class="text-[9px] bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100 font-bold shadow-sm">Solo lectura</span>
          </div>
          <div class="relative">
            <select 
              :value="visitor.estado" 
              @change="updateEstado" 
              :disabled="isUpdatingEstado || !store.userPermissions.puede_cerrar" 
              class="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg focus:ring-2 focus:ring-corporate focus:border-corporate block p-2.5 appearance-none pr-8 transition-all shadow-sm outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              :class="{'border-blue-300 bg-blue-50': visitor.estado === 'En proceso', 'border-green-300 bg-green-50': visitor.estado === 'Consolidado'}">
              <optgroup label="Abiertas">
                <option v-for="est in estadosAbiertos" :key="est" :value="est">{{ est }}</option>
              </optgroup>
              <optgroup label="Finalizadas (Cierran proceso)">
                <option v-for="est in estadosCierre" :key="est" :value="est">{{ est }}</option>
              </optgroup>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg v-if="isUpdatingEstado" class="animate-spin h-4 w-4 text-corporate" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <svg v-else class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>
    </details>

    <!-- Acordeón 2: Datos Personales -->
    <details name="acordeon-detalle" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate group-open:hover:text-white">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span>Datos del Visitante</span>
        </div>
        <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </summary>
      
      <div class="p-5 bg-white grid grid-cols-2 gap-4">
        <div>
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Teléfono</span>
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-gray-800">{{ visitor.telefono || 'N/A' }}</span>
            <a v-if="visitor.telefono" :href="'tel:'+ visitor.telefono" class="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all shadow-sm active:scale-95" aria-label="Llamar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            </a>
          </div>
        </div>
        <div>
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Sexo / Edad</span>
          <span class="text-sm font-medium text-gray-800">{{ visitor.sexo || '-' }} • {{ visitor.edad ? `${visitor.edad} años` : '-' }}</span>
        </div>
        <div class="col-span-2 pt-2 border-t border-gray-100">
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Estado Civil</span>
          <span class="text-sm font-medium text-gray-800">{{ visitor.estado_civil || 'No especificado' }}</span>
        </div>
        <div class="col-span-2 pt-2 border-t border-gray-100">
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Dirección</span>
          <span class="text-sm font-medium text-gray-800">{{ visitor.direccion || 'N/A' }} ({{ visitor.barrio || 'N/A' }})</span>
        </div>
        <div class="col-span-2 pt-2 border-t border-gray-100">
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Invita</span>
          <span class="text-sm font-medium text-gray-800">{{ visitor.quien_invita || 'N/A' }}</span>
        </div>
        <div class="col-span-2 pt-2 border-t border-gray-100">
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Petición</span>
          <span class="text-sm font-medium italic text-gray-700">{{ visitor.peticion || 'N/A' }}</span>
        </div>
      </div>
    </details>

    <!-- Acordeón 3: Observación -->
    <details name="acordeon-detalle" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate group-open:hover:text-white">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <span>Observación</span>
        </div>
        <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </summary>
      
      <div class="p-5 bg-gray-50 border-t border-gray-100">
        <textarea
          v-model="visitor.observacion"
          rows="3"
          class="w-full text-sm border border-gray-200 p-3 rounded-lg outline-none focus:border-corporate focus:ring-1 focus:ring-corporate bg-white resize-none style-scrollbar shadow-sm mb-3 transition-colors"
          placeholder="Escribe o actualiza la observación interna del visitante..."
        ></textarea>
        <button
          @click="updateObservacion"
          :disabled="isUpdatingObservacion"
          class="w-full bg-corporate text-white font-bold text-sm py-2.5 rounded-lg hover:bg-[#003366] transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm active:scale-95"
        >
          <div v-if="isUpdatingObservacion" class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          {{ isUpdatingObservacion ? 'Guardando...' : 'Actualizar Observación' }}
        </button>
      </div>
    </details>
  </div>
</template>