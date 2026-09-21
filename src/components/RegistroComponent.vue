<script setup>
import { ref, computed } from 'vue'
import { supabase } from '../supabase'
import { useMainStore } from '../stores/mainStore'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'

const emit = defineEmits(['close'])
const store = useMainStore()
const { showToast } = useToast()
const { showConfirm } = useConfirm()

const isSaving = ref(false)
const selectedRed = ref('')

// Fecha actual con compensación local
const today = new Date()
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0]

const form = ref({
  fecha_visita: localDate,
  visitante: '',
  telefono: '',
  sexo: '',
  edad: null,
  estado_civil: '',
  direccion: '',
  barrio: '',
  quien_invita: '',
  peticion: '',
  observacion: '',
  lider_tribu: 'Sin asignar',
  lider_manantial: 'Sin asignar',
  manantial_asignado_id: null
})

// === CASCADAS REACTIVAS ===
const availableTribes = computed(() => {
  if (!selectedRed.value) return []
  return [...new Set(store.lideres.allLeadersData
    .filter(r => r[3] === selectedRed.value)
    .map(r => r[1]))].sort()
})

const availableWLeaders = computed(() => {
  if (form.value.lider_tribu === 'Sin asignar') return []
  return store.lideres.allLeadersData
    .filter(r => (r[1] || 'Sin asignar') === form.value.lider_tribu && r[3] === selectedRed.value)
    .map(r => r[0])
    .sort()
})

const availableManantialesList = computed(() => {
  if (form.value.lider_manantial === 'Sin asignar') return []
  const currentLeader = store.lideres.allLeadersData.find(r => r[0] === form.value.lider_manantial)
  if (!currentLeader) return []
  return store.manantiales.filter(m => m.lider_id === currentLeader[2])
})

// === EVENTOS ===
const onRedChange = () => {
  form.value.lider_tribu = 'Sin asignar'
  form.value.lider_manantial = 'Sin asignar'
  form.value.manantial_asignado_id = null
}

const onTribuChange = () => {
  form.value.lider_manantial = 'Sin asignar'
  form.value.manantial_asignado_id = null
}

const onManantialChange = () => {
  if (form.value.lider_manantial === 'Sin asignar') {
    form.value.manantial_asignado_id = null
  } else if (availableManantialesList.value.length > 0) {
    form.value.manantial_asignado_id = availableManantialesList.value[0].id 
  } else {
    form.value.manantial_asignado_id = null
  }
}

const validatePhone = (e) => {
  let val = e.target.value.replace(/\D/g, '')
  if (val.length > 10) val = val.slice(0, 10)
  form.value.telefono = val
}

const submitForm = async () => {
  if (form.value.telefono.length !== 10) {
    return showToast('El teléfono debe tener 10 dígitos', 'error')
  }

  if (form.value.lider_manantial !== 'Sin asignar' && !form.value.manantial_asignado_id) {
    return showToast('El líder seleccionado no tiene manantiales o falta asignar uno', 'error')
  }

  const isConfirmed = await showConfirm({
    title: '¿Crear nuevo registro?',
    message: `Estás a punto de registrar la visita de <b>${form.value.visitante}</b>.<br><br>¿Los datos ingresados son correctos?`,
    confirmText: 'Sí, crear registro',
    cancelText: 'Revisar'
  })

  if (!isConfirmed) return

  isSaving.value = true
  const { data: { user } } = await supabase.auth.getUser()
  
  const payload = {
    ...form.value,
    edad: form.value.edad || null,
    lider_tribu: form.value.lider_tribu === 'Sin asignar' ? null : form.value.lider_tribu,
    lider_manantial: form.value.lider_manantial === 'Sin asignar' ? null : form.value.lider_manantial,
    manantial_asignado_id: form.value.manantial_asignado_id, 
    estado: 'Sin reporte',
    registrado_por: user?.user_metadata?.full_name || user?.email || 'Sistema'
  }

  const { error } = await supabase.from('consolidaciones').insert(payload)

  if (!error) {
    showToast('Consolidación registrada exitosamente', 'success')
    await store.fetchData() 
    emit('close') 
  } else {
    showToast(`Error al guardar: ${error.message}`, 'error')
  }
  isSaving.value = false
}
</script>

<template>
  <div>
    <!-- Backdrop oscuro -->
    <div @click="emit('close')" class="fixed inset-0 bg-black/40 z-[55] transition-opacity backdrop-blur-sm"></div>
    
    <!-- Panel Lateral -->
    <div class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#f8f9fa] shadow-2xl z-[60] transform transition-transform duration-300 flex flex-col animate-[slideInRight_0.3s_ease-out]">
      
      <!-- Cabecera Hero -->
      <div class="flex justify-between items-center p-5 bg-gradient-to-r from-corporate to-[#002244] shadow-md text-white relative overflow-hidden shrink-0">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <h5 class="font-bold text-lg flex items-center gap-2 m-0 relative z-10">Nuevo Registro</h5>
        <button @click="emit('close')" class="bg-white/10 text-white hover:bg-red-500 w-8 h-8 rounded-full flex justify-center items-center transition-colors shadow-sm relative z-10 backdrop-blur-sm active:scale-95">✕</button>
      </div>

      <!-- Formulario con Scroll Interno -->
      <div class="p-4 overflow-y-auto flex-1 style-scrollbar">
        <form @submit.prevent="submitForm" class="space-y-4 pb-20">
          
          <!-- Bloque 1: Datos Principales -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h3 class="text-xs font-bold text-corporate flex items-center gap-2 border-b border-gray-100 pb-2 m-0">Datos Personales</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Fecha de Visita *</label>
                <input type="date" v-model="form.fecha_visita" required class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 bg-gray-50 transition-all font-medium text-gray-700">
              </div>
              
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Nombre Completo *</label>
                <input type="text" v-model="form.visitante" required class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all">
              </div>

              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Teléfono *</label>
                <input type="tel" inputmode="numeric" pattern="[0-9]*" v-model="form.telefono" @input="validatePhone" placeholder="Ej: 3001234567" required class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all">
                <span class="text-[10px] mt-1 block font-bold transition-colors duration-300" :class="{'text-gray-400': form.telefono.length === 0, 'text-red-500': form.telefono.length > 0 && form.telefono.length < 10, 'text-green-600': form.telefono.length === 10}">
                  {{ form.telefono.length }}/10 dígitos
                </span>
              </div>

              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Sexo *</label>
                <select v-model="form.sexo" required class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 bg-white transition-all">
                  <option value="" disabled>Seleccione...</option>
                  <option>Hombre</option><option>Mujer</option>
                </select>
              </div>

              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Edad</label>
                <input type="number" v-model="form.edad" min="1" max="120" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all">
              </div>

              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Estado Civil</label>
                <select v-model="form.estado_civil" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 bg-white transition-all">
                  <option value="" disabled>Seleccione...</option>
                  <option>Soltero</option><option>Casado</option><option>Divorciado</option><option>Viudo</option><option>Unión libre</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Bloque 2: Ubicación y Detalles -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h3 class="text-xs font-bold text-corporate flex items-center gap-2 border-b border-gray-100 pb-2 m-0">Ubicación y Detalles</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Dirección *</label>
                <input type="text" v-model="form.direccion" required class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all">
              </div>
              
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Barrio *</label>
                <input type="text" v-model="form.barrio" required class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all">
              </div>

              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Quien Invita *</label>
                <input type="text" v-model="form.quien_invita" required class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all">
              </div>

              <div class="md:col-span-2">
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Petición (Opcional)</label>
                <textarea v-model="form.peticion" rows="2" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all resize-none style-scrollbar" placeholder="Escribe aquí si hay alguna petición especial..."></textarea>
              </div>

              <div class="md:col-span-2">
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Observación (Opcional)</label>
                <textarea v-model="form.observacion" rows="2" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all resize-none style-scrollbar" placeholder="Notas adicionales..."></textarea>
              </div>
            </div>
          </div>

          <!-- Bloque 3: Liderazgo -->
          <div class="bg-gray-50 rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 class="text-xs font-bold text-corporate flex items-center gap-2 border-b border-gray-200 pb-2 m-0">Asignación de Liderazgo (Opcional)</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase block mb-1">Red</label>
                <select v-model="selectedRed" @change="onRedChange" class="w-full text-sm border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-corporate bg-white">
                  <option value="">Seleccione Red</option>
                  <option>Niños</option><option>Jóvenes</option><option>Adultos</option>
                </select>
              </div>
              
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase block mb-1">Tribu</label>
                <select v-model="form.lider_tribu" @change="onTribuChange" :disabled="!selectedRed" class="w-full text-sm border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-corporate bg-white disabled:opacity-50">
                  <option value="Sin asignar">Sin asignar</option>
                  <option v-for="l in availableTribes" :key="l" :value="l">{{ l }}</option>
                </select>
              </div>
              
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase block mb-1">Líder Manantial</label>
                <select v-model="form.lider_manantial" @change="onManantialChange" :disabled="form.lider_tribu === 'Sin asignar'" class="w-full text-sm border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-corporate bg-white disabled:opacity-50">
                  <option value="Sin asignar">Sin asignar</option>
                  <option v-for="l in availableWLeaders" :key="l" :value="l">{{ l }}</option>
                </select>
              </div>
            </div>

            <!-- Lista de Manantiales -->
            <div v-if="form.lider_manantial !== 'Sin asignar'" class="pt-2">
              <label class="text-[10px] font-bold text-gray-500 uppercase block mb-2">Manantial Asignado</label>
              <div class="space-y-2">
                <div v-for="m in availableManantialesList" :key="m.id" 
                    @click="form.manantial_asignado_id = m.id"
                    class="p-2.5 rounded-lg border cursor-pointer flex justify-between items-center transition-all"
                    :class="form.manantial_asignado_id === m.id ? 'bg-blue-50 border-corporate ring-1 ring-corporate shadow-sm' : 'bg-white border-gray-100 hover:shadow-sm'">
                  <div class="text-xs">
                    <div class="font-bold text-gray-800">{{ m.direccion }}</div>
                    <div class="text-[10px] text-gray-500 mt-0.5">B. {{ m.barrio }} • {{ m.dia_reunion }} {{ m.hora_reunion }}</div>
                  </div>
                  <div class="ml-3 shrink-0">
                    <div v-if="form.manantial_asignado_id === m.id" class="w-5 h-5 bg-corporate text-white rounded-full flex items-center justify-center">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div v-else class="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  </div>
                </div>
                <div v-if="!availableManantialesList.length" class="text-xs text-gray-400 italic text-center p-4 border border-dashed border-gray-200 rounded-lg bg-white">
                  Este líder no tiene manantiales registrados.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Botón Pegajoso en el Pie del Panel -->
      <div class="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <button @click="submitForm" :disabled="isSaving" class="w-full bg-corporate text-white font-bold py-3.5 rounded-xl hover:bg-[#003366] transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95">
          <div v-if="isSaving" class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
          {{ isSaving ? 'Guardando...' : 'Crear Registro' }}
        </button>
      </div>

    </div>
  </div>
</template>