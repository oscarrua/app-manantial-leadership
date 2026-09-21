<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '../../supabase'
import { useMainStore } from '../../stores/mainStore'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { useGeocoding } from '../../composables/useGeocoding'
import { getDistance } from '../../utils/helpers'

const props = defineProps({
  visitor: { type: Object, required: true }
})

const store = useMainStore()
const { showToast } = useToast()
const { showConfirm } = useConfirm()
const { getCoordinatesFromAddress } = useGeocoding()

const isUpdatingLider = ref(false)
const selectedRed = ref('')
const consolCoords = ref(null)

// === LÓGICA DE GEOLOCALIZACIÓN AISLADA ===
const loadCoordinates = async () => {
  if (!props.visitor?.direccion) return
  consolCoords.value = await getCoordinatesFromAddress(props.visitor.direccion, props.visitor.barrio)
}

// Cargar la red inicial y las coordenadas al montar el componente
onMounted(() => {
  if (props.visitor.lider_manantial && props.visitor.lider_manantial !== 'Sin asignar') {
    const liderInfo = store.lideres.allLeadersData.find(l => l[0] === props.visitor.lider_manantial)
    selectedRed.value = liderInfo ? liderInfo[3] : ''
  } else if (props.visitor.lider_tribu && props.visitor.lider_tribu !== 'Sin asignar') {
    const liderInfo = store.lideres.allLeadersData.find(l => l[1] === props.visitor.lider_tribu)
    selectedRed.value = liderInfo ? liderInfo[3] : ''
  }
  loadCoordinates()
})

// === CASCADAS REACTIVAS ===
const availableTribes = computed(() => {
  if (!selectedRed.value) return []
  return [...new Set(store.lideres.allLeadersData.filter(r => r[3] === selectedRed.value).map(r => r[1]))].sort()
})

const availableWLeaders = computed(() => {
  if (!props.visitor?.lider_tribu || props.visitor.lider_tribu === 'Sin asignar') return []
  return store.lideres.allLeadersData
    .filter(r => (r[1] || 'Sin asignar') === props.visitor.lider_tribu && r[3] === selectedRed.value)
    .map(r => ({ name: r[0], id: r[2] }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const availableManantialesList = computed(() => {
  if (!props.visitor?.lider_manantial || props.visitor.lider_manantial === 'Sin asignar') return []
  const currentLeader = availableWLeaders.value.find(l => l.name === props.visitor.lider_manantial)
  if (!currentLeader) return []
  
  return store.manantiales
    .filter(m => m.lider_id === currentLeader.id)
    .map(m => {
      const dist = getDistance(consolCoords.value?.lat, consolCoords.value?.lng, m.latitud, m.longitud)
      return { ...m, distancia: dist }
    }).sort((a, b) => (parseFloat(a.distancia) || 999) - (parseFloat(b.distancia) || 999))
})

// Eventos
const onRedChange = () => {
  props.visitor.lider_tribu = 'Sin asignar'
  props.visitor.lider_manantial = 'Sin asignar'
  props.visitor.manantial_asignado_id = null
}
const onTribuChange = () => {
  props.visitor.lider_manantial = 'Sin asignar'
  props.visitor.manantial_asignado_id = null
}
const onManantialChange = () => {
  if (props.visitor.lider_manantial === 'Sin asignar') {
    props.visitor.manantial_asignado_id = null
  } else if (availableManantialesList.value.length > 0) {
    props.visitor.manantial_asignado_id = availableManantialesList.value[0].id
  }
}

// Guardado
const saveLiderazgo = async () => {
  if (props.visitor.lider_manantial !== 'Sin asignar' && !props.visitor.manantial_asignado_id) {
    return showToast('El líder debe tener un manantial asignado', 'error')
  }

  const isConfirmed = await showConfirm({
    title: '¿Guardar Asignación?',
    message: `¿Estás seguro de guardar esta configuración?`,
    confirmText: 'Sí, guardar'
  })
  if (!isConfirmed) return

  isUpdatingLider.value = true
  const payload = {
    lider_tribu: props.visitor.lider_tribu === 'Sin asignar' ? null : props.visitor.lider_tribu,
    lider_manantial: props.visitor.lider_manantial === 'Sin asignar' ? null : props.visitor.lider_manantial,
    manantial_asignado_id: props.visitor.manantial_asignado_id
  }

  const { error } = await supabase.from('consolidaciones').update(payload).eq('id', props.visitor.id)
  
  if (!error) showToast('Asignación guardada', 'success')
  else showToast(`Error: ${error.message}`, 'error')
  isUpdatingLider.value = false
}
</script>

<template>
  <details name="acordeon-detalle" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
    <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate group-open:hover:text-white">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        <span>Liderazgo</span>
      </div>
      <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    </summary>
    
    <div class="p-5 bg-white space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Select Red -->
        <div>
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Red</span>
          <select v-model="selectedRed" @change="onRedChange" :disabled="!store.userPermissions?.puede_asignar || isUpdatingLider" class="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-corporate transition-all">
            <option value="">Seleccione Red</option>
            <option>Niños</option><option>Jóvenes</option><option>Adultos</option>
          </select>
        </div>
        <!-- Select Tribu -->
        <div>
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tribu</span>
          <select v-model="visitor.lider_tribu" @change="onTribuChange" :disabled="!selectedRed || !store.userPermissions?.puede_asignar || isUpdatingLider" class="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-corporate transition-all">
            <option value="Sin asignar">Sin asignar</option>
            <option v-for="l in availableTribes" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
        <!-- Select Líder -->
        <div>
          <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Líder Manantial</span>
          <select v-model="visitor.lider_manantial" @change="onManantialChange" :disabled="visitor.lider_tribu === 'Sin asignar' || !store.userPermissions?.puede_asignar || isUpdatingLider" class="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-corporate transition-all">
            <option value="Sin asignar">Sin asignar</option>
            <option v-for="l in availableWLeaders" :key="l.id" :value="l.name">{{ l.name }}</option>
          </select>
        </div>
      </div>

      <!-- Lista de Manantiales (UI) -->
      <div v-if="visitor.lider_manantial !== 'Sin asignar'" class="pt-3 border-t border-gray-100">
        <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Manantiales (Cercanía)</span>
        <div class="space-y-2 max-h-48 overflow-y-auto style-scrollbar pr-1">
          <div v-for="m in availableManantialesList" :key="m.id" 
               class="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:shadow-sm"
               :class="visitor.manantial_asignado_id === m.id ? 'bg-blue-50 border-corporate shadow-sm ring-1' : 'bg-white border-gray-100'"
               @click="store.userPermissions?.puede_asignar && (visitor.manantial_asignado_id = m.id)">
            <div class="flex-1 overflow-hidden">
              <div class="text-xs font-bold text-gray-800 truncate">{{ m.direccion }} (B. {{ m.barrio }})</div>
              <div class="text-[10px] text-gray-500 mt-0.5">
                {{ m.dia_reunion }} {{ m.hora_reunion }}
                <span v-if="m.distancia" class="ml-2 font-bold text-corporate">📍 {{ m.distancia }} km</span>
              </div>
            </div>
            <div class="ml-3 shrink-0">
              <div v-if="visitor.manantial_asignado_id === m.id" class="w-5 h-5 bg-corporate text-white rounded-full flex items-center justify-center">✓</div>
              <div v-else class="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-gray-100" v-if="store.userPermissions?.puede_asignar">
        <button @click="saveLiderazgo" :disabled="isUpdatingLider" class="w-full bg-corporate text-white font-bold text-sm py-3 rounded-xl hover:bg-[#003366] transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
          <div v-if="isUpdatingLider" class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          {{ isUpdatingLider ? 'Guardando...' : 'Guardar Asignación' }}
        </button>
      </div>
    </div>
  </details>
</template>