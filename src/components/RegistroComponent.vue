<script setup>
import { ref, computed } from 'vue'
import { supabase } from '../supabase'
import { useMainStore } from '../stores/mainStore'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm' // Importamos useConfirm

const emit = defineEmits(['close'])
const store = useMainStore()
const { showToast } = useToast()
const { showConfirm } = useConfirm() // Inicializamos el confirmador

const isSaving = ref(false)

// Corrección de la fecha: Ajustamos la fecha actual con el Offset de la zona horaria local
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
  peticion: '',     // Nuevo campo
  observacion: '',  // Nuevo campo
  lider_tribu: 'Sin asignar',
  lider_manantial: 'Sin asignar'
})

// Filtra manantiales según la tribu seleccionada
const availableWLeaders = computed(() => {
  if (form.value.lider_tribu === 'Sin asignar') return []
  return store.lideres.allLeadersData
    .filter(r => (r[1] || 'Sin asignar') === form.value.lider_tribu)
    .map(r => r[0])
    .sort()
})

const validatePhone = (e) => {
  let val = e.target.value.replace(/\D/g, '')
  if (val.length > 10) val = val.slice(0, 10)
  form.value.telefono = val
}

const submitForm = async () => {
  if (form.value.telefono.length !== 10) {
    return showToast('El teléfono debe tener 10 dígitos', 'error')
  }

  // Cuadro de confirmación antes de guardar
  const isConfirmed = await showConfirm({
    title: '¿Crear nuevo registro?',
    message: `Estás a punto de registrar la visita de <b>${form.value.visitante}</b>.<br><br>¿Los datos ingresados son correctos?`,
    confirmText: 'Sí, crear registro',
    cancelText: 'Revisar'
  })

  if (!isConfirmed) return // Detenemos la ejecución si el usuario cancela

  isSaving.value = true
  const { data: { user } } = await supabase.auth.getUser()
  
  const payload = {
    ...form.value,
    edad: form.value.edad || null,
    lider_tribu: form.value.lider_tribu === 'Sin asignar' ? null : form.value.lider_tribu,
    lider_manantial: form.value.lider_manantial === 'Sin asignar' ? null : form.value.lider_manantial,
    estado: 'Sin reporte',
    registrado_por: user?.user_metadata?.full_name || user?.email || 'Sistema'
  }

  const { error } = await supabase.from('consolidaciones').insert(payload)

  if (!error) {
    showToast('Consolidación registrada exitosamente', 'success')
    await store.fetchData() // Recargar datos globales en la tabla de fondo
    emit('close') // Cerrar el panel
  } else {
    showToast(`Error al guardar: ${error.message}`, 'error')
  }
  isSaving.value = false
}
</script>

<template>
  <div>
    <!-- Fondo oscuro (backdrop) -->
    <div @click="emit('close')" class="fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-sm"></div>
    
    <!-- Panel Lateral Deslizante -->
    <div class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#f8f9fa] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col animate-[slideInRight_0.3s_ease-out]">
      
      <!-- Cabecera Tematizada (Estilo Hero) -->
      <div class="flex justify-between items-center p-5 bg-gradient-to-r from-corporate to-[#002244] shadow-md text-white relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <h5 class="font-bold text-lg flex items-center gap-2 m-0 relative z-10">
          Nuevo Registro
        </h5>
        <button @click="emit('close')" class="bg-white/10 text-white hover:bg-red-500 w-8 h-8 rounded-full flex justify-center items-center transition-colors shadow-sm relative z-10 backdrop-blur-sm active:scale-95">
          ✕
        </button>
      </div>

      <!-- Cuerpo del Formulario con Scroll Independiente -->
      <div class="p-4 overflow-y-auto flex-1 style-scrollbar">
        <form @submit.prevent="submitForm" class="space-y-4">
          
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <!-- (Campos Anteriores...) -->
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
              <input type="text" v-model="form.telefono" @input="validatePhone" placeholder="Ej: 3001234567" required class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all">
              
              <!-- Contador con retroalimentación de color dinámica -->
              <span 
                class="text-[10px] mt-1 block font-bold transition-colors duration-300"
                :class="{
                  'text-gray-400': form.telefono.length === 0,
                  'text-red-500': form.telefono.length > 0 && form.telefono.length < 10,
                  'text-green-600': form.telefono.length === 10
                }"
              >
                {{ form.telefono.length }}/10 dígitos
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Sexo *</label>
                <select v-model="form.sexo" required class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 bg-white transition-all">
                  <option value="" disabled>Seleccione...</option>
                  <option>Hombre</option>
                  <option>Mujer</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Edad</label>
                <input type="number" v-model="form.edad" min="1" max="120" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all">
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Estado Civil</label>
              <select v-model="form.estado_civil" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 bg-white transition-all">
                <option value="" disabled>Seleccione...</option>
                <option>Soltero</option>
                <option>Casado</option>
                <option>Divorciado</option>
                <option>Viudo</option>
                <option>Unión libre</option>
              </select>
            </div>
            
            <div>
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

            <!-- Nuevos campos: Petición y Observación -->
            <div>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Petición (Opcional)</label>
              <textarea v-model="form.peticion" rows="2" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all resize-none style-scrollbar" placeholder="Escribe aquí si hay alguna petición especial..."></textarea>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Observación (Opcional)</label>
              <textarea v-model="form.observacion" rows="2" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all resize-none style-scrollbar" placeholder="Notas adicionales..."></textarea>
            </div>
          </div>

          <!-- Liderazgo Opcional -->
          <div class="bg-gray-50 rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 class="text-xs font-bold text-corporate flex items-center gap-2 m-0">
              Asignación de Liderazgo (Opcional)
            </h3>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Tribu</label>
                <select v-model="form.lider_tribu" @change="form.lider_manantial = 'Sin asignar'" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 bg-white transition-all">
                  <option value="Sin asignar">Sin asignar</option>
                  <option v-for="l in store.lideres.tleaders" :key="l" :value="l">{{ l }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Manantial</label>
                <select v-model="form.lider_manantial" :disabled="form.lider_tribu === 'Sin asignar'" class="w-full text-sm border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 bg-white transition-all disabled:opacity-50">
                  <option value="Sin asignar">Sin asignar</option>
                  <option v-for="l in availableWLeaders" :key="l" :value="l">{{ l }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Botón flotante estilo nativo -->
          <div class="pt-4 pb-6">
            <button type="submit" :disabled="isSaving" class="w-full bg-corporate text-white font-bold py-3.5 rounded-xl hover:bg-[#003366] transition-all shadow-[0_4px_12px_rgba(0,76,151,0.3)] hover:shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95">
              <div v-if="isSaving" class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              {{ isSaving ? 'Guardando...' : 'Crear Registro' }}
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.style-scrollbar::-webkit-scrollbar { width: 6px; }
.style-scrollbar::-webkit-scrollbar-track { background: transparent; }
.style-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.style-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-corporate); }
</style>