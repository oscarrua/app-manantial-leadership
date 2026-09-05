<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from '../supabase'
import { useMainStore } from '../stores/mainStore'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const props = defineProps(['visitorId'])
const emit = defineEmits(['close-detail'])
const store = useMainStore()
const { showToast } = useToast()
const { showConfirm } = useConfirm()
const isUpdatingLider = ref(false)

// Filtra manantiales según la tribu seleccionada
const availableWLeaders = computed(() => {
  if (!visitor.value?.lider_tribu || visitor.value.lider_tribu === 'Sin asignar') return []
  return store.lideres.allLeadersData
    .filter(r => (r[1] || 'Sin asignar') === visitor.value.lider_tribu)
    .map(r => r[0])
    .sort()
})

const updateLiderazgo = async (campo) => {
  isUpdatingLider.value = true
  if (campo === 'tribu') visitor.value.lider_manantial = 'Sin asignar'

  const payload = {
    lider_tribu: visitor.value.lider_tribu === 'Sin asignar' ? null : visitor.value.lider_tribu,
    lider_manantial: visitor.value.lider_manantial === 'Sin asignar' ? null : visitor.value.lider_manantial
  }

  const { error } = await supabase.from('consolidaciones').update(payload).eq('id', props.visitorId)
  
  if (!error) showToast('Liderazgo actualizado correctamente', 'success')
  else showToast(`Error: ${error.message}`, 'error')
  
  isUpdatingLider.value = false
}

const visitor = ref(null)
const history = ref([])
const isHistoryLoading = ref(false)
const isSaving = ref(false)
const isUpdatingEstado = ref(false)
const isFormVisible = ref(false)

const estadosAbiertos = ['Sin reporte', 'En proceso']
const estadosCierre = [
  'Consolidado', 
  'No consolidado', 
  'Asiste a otra iglesia', 
  'No localizado', 
  'Visita ocasional'
]
const estadosPermitidos = [...estadosAbiertos, ...estadosCierre]

const form = ref({
  fecha_gestion: new Date().toISOString().split('T')[0],
  tipo_gestion: '',
  resultado: ''
})

watch(() => props.visitorId, async (newId) => {
  if (!newId) return
  visitor.value = store.consolidaciones.find(r => r.id === newId)
  isFormVisible.value = false // Cerramos el formulario al abrir un nuevo detalle
  await loadHistory(newId)
})

const loadHistory = async (id) => {
  isHistoryLoading.value = true
  const { data } = await supabase
    .from('gestiones')
    .select('*')
    .eq('consolidacion_id', id)
    .order('fecha_gestion', { ascending: false })
  
  if (data) history.value = data
  isHistoryLoading.value = false
}

const isUpdatingObservacion = ref(false)

const updateObservacion = async () => {
  isUpdatingObservacion.value = true
  const { error } = await supabase
    .from('consolidaciones')
    .update({ observacion: visitor.value.observacion })
    .eq('id', props.visitorId)

  if (!error) showToast('Observación actualizada correctamente', 'success')
  else showToast(`Error al actualizar: ${error.message}`, 'error')
  
  isUpdatingObservacion.value = false
}

// NUEVO: Función para actualizar el estado reactivamente con Modal Nativo
const updateEstado = async (event) => {
  const newEstado = event.target.value
  // Como ya no hay v-model, visitor retiene el valor original de manera segura
  const oldEstado = visitor.value.estado 
  const isClosing = estadosCierre.includes(newEstado)

  if (isClosing) {
    const result = await showConfirm({
      title: '¿Cerrar consolidación?',
      message: `Estás a punto de cambiar el estado a <b>"${newEstado}"</b>.<br><br>Una vez guardado, este registro se considerará finalizado y <b>desaparecerá de tu lista principal</b>.`,
      confirmText: 'Sí, cerrar registro',
      cancelText: 'Cancelar'
    })

    if (!result) {
      // Revertimos visualmente el selector nativo al estado anterior
      event.target.value = oldEstado
      return
    }
  }

  isUpdatingEstado.value = true

  const { error } = await supabase
    .from('consolidaciones')
    .update({ estado: newEstado })
    .eq('id', props.visitorId)

  if (!error) {
    if (isClosing) {
      store.consolidaciones = store.consolidaciones.filter(c => c.id !== props.visitorId)
      showToast('Consolidación cerrada y archivada', 'success')
      emit('close-detail') 
    } else {
      showToast(`Estado actualizado a: ${newEstado}`, 'success')
      // Aplicamos la mutación en el modelo local tras el éxito en base de datos
      visitor.value.estado = newEstado
    }
  } else {
    showToast(`Error al actualizar estado: ${error.message}`, 'error')
    event.target.value = oldEstado 
  }
  
  isUpdatingEstado.value = false
}

const saveManagement = async () => {
  if (!form.value.tipo_gestion || !form.value.resultado) return
  isSaving.value = true
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const payload = {
    consolidacion_id: props.visitorId,
    fecha_gestion: form.value.fecha_gestion,
    tipo_gestion: form.value.tipo_gestion,
    resultado: form.value.resultado,
    usuario: user?.email || 'Usuario'
  }

  const { error } = await supabase.from('gestiones').insert(payload)
  
  if (!error) {
    form.value.tipo_gestion = ''
    form.value.resultado = ''
    isFormVisible.value = false // Oculta el form al guardar exitosamente
    showToast('Gestión registrada correctamente', 'success')
    await loadHistory(props.visitorId)
  } else {
    showToast(`Error al guardar gestión: ${error.message}`, 'error')
  }
  isSaving.value = false
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const safeDate = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  return new Date(safeDate).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
}
</script>

<template>
  <div>
    <!-- Fondo oscuro -->
    <div v-if="visitorId" @click="emit('close-detail')" class="fixed inset-0 bg-black/20 z-[55] transition-opacity backdrop-blur-sm"></div>
    
    <!-- Panel Lateral -->
    <div class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#f8f9fa] shadow-2xl z-[60] transform transition-transform duration-300 flex flex-col"
         :class="visitorId ? 'translate-x-0' : 'translate-x-full'">
      
      <!-- Cabecera -->
      <!-- Cabecera Tematizada (Estilo Hero) -->
      <div class="flex justify-between items-center p-5 bg-gradient-to-r from-corporate to-[#002244] shadow-md text-white relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <h5 class="font-bold text-lg flex items-center gap-2 m-0 relative z-10">
          Detalle de Consolidación
        </h5>
        <button @click="emit('close-detail')" class="bg-white/10 text-white hover:bg-red-500 w-8 h-8 rounded-full flex justify-center items-center transition-colors shadow-sm relative z-10 backdrop-blur-sm active:scale-95">
          ✕
        </button>
      </div>

      <!-- Cuerpo -->
      <div v-if="visitor" :key="visitorId" class="p-4 overflow-y-auto flex-1 style-scrollbar space-y-3">
        
        <!-- Tarjeta Principal -->
        <div class="bg-white border-l-4 border-corporate p-4 rounded-xl shadow-sm flex items-center gap-4 mb-2">
          <div class="w-14 h-14 rounded-full bg-corporate/10 flex items-center justify-center text-corporate font-bold text-2xl border border-corporate/20 shrink-0">
            {{ visitor.visitante.charAt(0) }}
          </div>
          <div class="overflow-hidden">
            <h4 class="font-bold text-xl m-0 text-gray-800 truncate">{{ visitor.visitante }}</h4>
            <span class="bg-corporate text-white text-[10px] px-2 py-1 rounded-md inline-block mt-1 font-bold tracking-wide">
              Líder: {{ visitor.lider_manantial || 'Sin asignar' }}
            </span>
          </div>
        </div>

        <!-- Acordeón 1: Consolidación -->
        <details :key="`acc1-${visitor.id}`" name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
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

            <!-- NUEVO CAMPO: Registrado por -->
            <div class="col-span-2 pt-2 border-t border-gray-50">
              <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Registrado por</span>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                <span class="text-sm font-medium text-gray-800 truncate" :title="visitor.registrado_por">{{ visitor.registrado_por || 'No especificado' }}</span>
              </div>
            </div>

            <!-- Continuación: Selector de Estado -->
            <div class="col-span-2 pt-2 border-t border-gray-50">
              <div class="flex justify-between items-center mb-1">
                <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actualizar Estado</span>
                <!-- Indicador visual si no tiene permisos -->
                <span v-if="!store.userPermissions.puede_cerrar" class="text-[9px] bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100 font-bold">
                  Solo lectura
                </span>
              </div>
              
              <div class="relative">
                <select
                  :value="visitor.estado"
                  @change="updateEstado"
                  :disabled="isUpdatingEstado || !store.userPermissions.puede_cerrar"
                  class="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg focus:ring-2 focus:ring-corporate focus:border-corporate block p-2.5 appearance-none pr-8 transition-all shadow-sm outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="{'border-blue-300 bg-blue-50': visitor.estado === 'En proceso', 'border-green-300 bg-green-50': visitor.estado === 'Consolidado'}"
                >
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

        <!-- Acordeón 2: Liderazgo -->
        <details :key="`acc2-${visitor.id}`" name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span>Liderazgo</span>
            </div>
            <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>
          
          <div class="p-5 bg-white space-y-4">
            <div class="flex justify-between items-center border-b border-gray-50 pb-2">
              <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Asignación Directa</span>
              <span v-if="!store.userPermissions?.puede_asignar" class="text-[9px] bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100 font-bold">
                Solo lectura
              </span>
              <span v-else-if="isUpdatingLider" class="text-[9px] text-corporate font-bold">Guardando...</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tribu</span>
                <select v-model="visitor.lider_tribu" @change="updateLiderazgo('tribu')" :disabled="isUpdatingLider || !store.userPermissions?.puede_asignar" class="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg focus:ring-2 focus:ring-corporate focus:border-corporate block p-2.5 outline-none disabled:opacity-50">
                  <option value="Sin asignar">Sin asignar</option>
                  <option v-for="l in store.lideres.tleaders" :key="l" :value="l">{{ l }}</option>
                </select>
              </div>

              <div>
                <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Manantial</span>
                <select v-model="visitor.lider_manantial" @change="updateLiderazgo('manantial')" :disabled="isUpdatingLider || !store.userPermissions?.puede_asignar || visitor.lider_tribu === 'Sin asignar'" class="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg focus:ring-2 focus:ring-corporate focus:border-corporate block p-2.5 outline-none disabled:opacity-50">
                  <option value="Sin asignar">Sin asignar</option>
                  <option v-for="l in availableWLeaders" :key="l" :value="l">{{ l }}</option>
                </select>
              </div>
            </div>
          </div>
        </details>

        <!-- Acordeón 3: Datos del Visitante -->
        <details :key="`acc3-${visitor.id}`" name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
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
            
            <!-- NUEVO CAMPO: Estado Civil -->
            <div class="col-span-2 pt-2 border-t border-gray-100">
              <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Estado Civil</span>
              <span class="text-sm font-medium text-gray-800">{{ visitor.estado_civil || 'No especificado' }}</span>
            </div>

            <!-- Ajuste en Dirección para mantener el ritmo visual (se le agrega el border-t) -->
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

        <!-- Acordeón 4: Observación -->
        <details :key="`acc4-${visitor.id}`" name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <!-- Cabecera del acordeón (Summary) -->
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              <span>Observación</span>
            </div>
            <!-- Icono de flecha (chevron) restaurado para mantener consistencia UX -->
            <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>

          <!-- Contenido del acordeón (Fuera del Summary) -->
          <div class="p-5 bg-gray-50 border-t border-gray-100">
            <textarea
              v-model="visitor.observacion"
              rows="3"
              class="w-full text-sm border border-gray-200 p-3 rounded-lg outline-none focus:border-corporate focus:ring-1 focus:ring-corporate bg-white resize-none style-scrollbar shadow-sm mb-3 transition-colors"
              placeholder="Escribe o actualiza la observación..."
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

        <!-- Acordeón 5: Historial y Gestiones -->
        <details :key="`acc5-${visitor.id}`" name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Historial y Gestiones</span>
              <span v-if="history.length > 0" class="bg-corporate group-open:bg-white group-open:text-corporate text-white text-[10px] px-2 py-0.5 rounded-full transition-colors">{{ history.length }}</span>
            </div>
            <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>
          
          <div class="p-0 border-t bg-white relative">
            
            <!-- Barra Sticky para Control de Formulario -->
            <div class="flex justify-between items-center p-3 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
              <span class="text-xs font-bold text-gray-500 uppercase">Registro de Actividad</span>
              <button 
                @click="isFormVisible = !isFormVisible" 
                type="button"
                class="text-corporate bg-corporate/10 hover:bg-corporate hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors active:scale-95"
              >
                {{ isFormVisible ? '✕ Cancelar' : '+ Nueva Gestión' }}
              </button>
            </div>

            <!-- Formulario Nueva Gestión (Transición) -->
            <transition name="slide-fade">
              <div v-show="isFormVisible" class="p-4 bg-blue-50/50 border-b border-blue-100">
                <form @submit.prevent="saveManagement" class="space-y-4">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs text-gray-500 font-bold">Fecha</label>
                      <input type="date" v-model="form.fecha_gestion" class="w-full text-sm border border-gray-200 p-2.5 rounded-lg outline-none focus:border-corporate focus:ring-1 focus:ring-corporate bg-white shadow-sm" required>
                    </div>
                    <div>
                      <label class="text-xs text-gray-500 font-bold">Tipo</label>
                      <select v-model="form.tipo_gestion" class="w-full text-sm border border-gray-200 p-2.5 rounded-lg outline-none focus:border-corporate focus:ring-1 focus:ring-corporate bg-white shadow-sm" required>
                        <option value="">Seleccione...</option>
                        <option>Llamada</option><option>Visita</option><option>Manantial</option><option>Iglesia</option><option>Encuentro</option>
                      </select>
                    </div>
                  </div>
                  
                  <!-- NUEVO: Textarea para el resultado -->
                  <div>
                    <label class="text-xs text-gray-500 font-bold block mb-1">Resultado / Detalles</label>
                    <textarea 
                      v-model="form.resultado" 
                      rows="3" 
                      class="w-full text-sm border border-gray-200 p-3 rounded-lg outline-none focus:border-corporate focus:ring-1 focus:ring-corporate bg-white resize-none style-scrollbar shadow-sm" 
                      placeholder="Describe los detalles de la interacción..." 
                      required
                    ></textarea>
                  </div>
                  
                  <button type="submit" :disabled="isSaving" class="w-full bg-corporate text-white font-bold text-sm py-2.5 rounded-lg hover:bg-[#003366] transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-md">
                    <div v-if="isSaving" class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    {{ isSaving ? 'Guardando...' : 'Guardar Gestión' }}
                  </button>
                </form>
              </div>
            </transition>

            <!-- Lista de Historial -->
            <div v-if="isHistoryLoading" class="p-6 text-center text-sm text-gray-500">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-corporate mx-auto mb-2"></div>
              Cargando historial...
            </div>
            <div v-else-if="history.length === 0 && !isFormVisible" class="p-8 text-center text-sm text-gray-400 italic">
              Sin registros previos. Presiona "+ Nueva Gestión" para iniciar.
            </div>
            <div v-else class="max-h-[300px] overflow-y-auto divide-y style-scrollbar">
              <div v-for="rec in history" :key="rec.id" class="p-4 hover:bg-gray-50 transition-colors">
                <div class="flex justify-between items-start mb-1.5">
                  <div>
                    <div class="font-bold text-corporate text-xs">{{ formatDate(rec.fecha_gestion) }}</div>
                    <div class="text-[10px] text-gray-400 max-w-[150px] truncate" :title="rec.usuario">{{ rec.usuario }}</div>
                  </div>
                  <span class="bg-blue-50 text-corporate border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">{{ rec.tipo_gestion }}</span>
                </div>
                <!-- El texto se ajusta perfectamente a las líneas generadas por el textarea -->
                <p class="text-sm text-gray-700 m-0 leading-relaxed whitespace-pre-wrap">{{ rec.resultado }}</p>
              </div>
            </div>

          </div>
        </details>

      </div>
    </div>
  </div>
</template>