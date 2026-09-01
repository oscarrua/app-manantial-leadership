<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../supabase'
import { useMainStore } from '../stores/mainStore'

const props = defineProps(['visitorId'])
const emit = defineEmits(['close-detail'])
const store = useMainStore()

const visitor = ref(null)
const history = ref([])
const isHistoryLoading = ref(false)
const isSaving = ref(false)

const form = ref({
  fecha_gestion: new Date().toISOString().split('T')[0],
  tipo_gestion: '',
  resultado: ''
})

watch(() => props.visitorId, async (newId) => {
  if (!newId) return
  visitor.value = store.consolidaciones.find(r => r.id === newId)
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
    await loadHistory(props.visitorId)
  }
  isSaving.value = false
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
}
</script>

<template>
  <div>
    <!-- Fondo oscuro -->
    <div v-if="visitorId" @click="emit('close-detail')" class="fixed inset-0 bg-black/20 z-40 transition-opacity"></div>
    
    <!-- Panel Lateral -->
    <div class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#f8f9fa] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col"
         :class="visitorId ? 'translate-x-0' : 'translate-x-full'">
      
      <!-- Cabecera -->
      <div class="flex justify-between items-center p-4 border-b bg-white">
        <h5 class="font-bold text-corporate text-lg flex items-center gap-2 m-0">
          Detalle de Consolidación
        </h5>
        <button @click="emit('close-detail')" class="bg-red-500 text-white w-8 h-8 rounded-full flex justify-center items-center hover:bg-red-600 shadow-sm transition-colors">
          ✕
        </button>
      </div>

      <!-- Cuerpo -->
      <div v-if="visitor" class="p-4 overflow-y-auto flex-1 style-scrollbar space-y-3">
        
        <!-- Tarjeta Principal -->
        <div class="bg-white border-l-4 border-corporate p-4 rounded-xl shadow-sm flex items-center gap-4 mb-2">
          <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-corporate font-bold text-2xl border">
            {{ visitor.visitante.charAt(0) }}
          </div>
          <div>
            <h4 class="font-bold text-xl m-0 text-gray-800">{{ visitor.visitante }}</h4>
            <span class="bg-corporate text-white text-xs px-2 py-1 rounded-md inline-block mt-1 font-semibold">
              Líder: {{ visitor.lider_manantial || 'Sin asignar' }}
            </span>
          </div>
        </div>

        <!-- Acordeón 1: Consolidación -->
        <details name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Consolidación</span>
            </div>
            <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>
          <div class="p-5 bg-white space-y-4">
            <div>
              <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">ID Registro</span>
              <span class="text-sm font-medium text-gray-800">#{{ visitor.id }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Fecha de Visita</span>
              <span class="text-sm font-medium text-gray-800">{{ formatDate(visitor.fecha_visita) }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Estado Actual</span>
              <span class="bg-gray-500 text-white px-3 py-1 rounded-md text-xs font-bold shadow-sm">{{ visitor.estado }}</span>
            </div>
          </div>
        </details>

        <!-- Acordeón 2: Liderazgo -->
        <details name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span>Liderazgo</span>
            </div>
            <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>
          <div class="p-5 bg-white grid grid-cols-2 gap-4">
            <div>
              <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Tribu</span>
              <span class="text-sm font-medium text-gray-800">{{ visitor.lider_tribu }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Manantial</span>
              <span class="text-sm font-medium text-gray-800">{{ visitor.lider_manantial }}</span>
            </div>
          </div>
        </details>

        <!-- Acordeón 3: Datos del Visitante -->
        <details name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span>Datos del Visitante</span>
            </div>
            <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>
          <div class="p-5 bg-white grid grid-cols-2 gap-4">
            <div><span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Teléfono</span><a :href="'tel:'+ visitor.telefono" class="text-corporate font-bold">{{ visitor.telefono || 'N/A' }}</a></div>
            <div><span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Sexo / Edad</span><span class="text-sm font-medium text-gray-800">{{ visitor.sexo || '-' }} • {{ visitor.edad ? `${visitor.edad} años` : '-' }}</span></div>
            <div class="col-span-2"><span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Dirección</span><span class="text-sm font-medium text-gray-800">{{ visitor.direccion || 'N/A' }} ({{ visitor.barrio || 'N/A' }})</span></div>
            <div class="col-span-2 pt-2 border-t border-gray-100"><span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Invita</span><span class="text-sm font-medium text-gray-800">{{ visitor.quien_invita || 'N/A' }}</span></div>
            <div class="col-span-2 pt-2 border-t border-gray-100"><span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Petición</span><span class="text-sm font-medium italic text-gray-700">{{ visitor.peticion || 'N/A' }}</span></div>
          </div>
        </details>

        <!-- Acordeón 4: Observación -->
        <details name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              <span>Observación</span>
            </div>
            <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>
          <div class="p-5 bg-gray-50 text-sm italic text-gray-600">
            "{{ visitor.observacion || 'Sin observaciones adicionales.' }}"
          </div>
        </details>

        <!-- Acordeón 5: Historial y Gestiones (Mantén tu código interior de gestiones aquí) -->
        <details name="panel-visitante" class="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <summary class="p-4 font-bold text-gray-700 cursor-pointer flex justify-between items-center transition-all group-open:bg-corporate group-open:text-white hover:bg-gray-50 group-open:hover:bg-corporate">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Historial y Gestiones</span>
              <span v-if="history.length > 0" class="bg-corporate group-open:bg-white group-open:text-corporate text-white text-[10px] px-2 py-0.5 rounded-full transition-colors">{{ history.length }}</span>
            </div>
            <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>
          
          <div class="p-0 border-t bg-white">
            <!-- Lista de Historial -->
            <div v-if="isHistoryLoading" class="p-4 text-center text-sm text-gray-500">Cargando historial...</div>
            <div v-else-if="history.length === 0" class="p-4 text-center text-sm text-gray-400 italic">Sin registros previos.</div>
            <div v-else class="max-h-[250px] overflow-y-auto divide-y">
              <div v-for="rec in history" :key="rec.id" class="p-3 hover:bg-gray-50">
                <div class="flex justify-between items-start mb-1">
                  <div>
                    <div class="font-bold text-corporate text-xs">{{ formatDate(rec.fecha_gestion) }}</div>
                    <div class="text-[10px] text-gray-400 max-w-[100px] truncate" :title="rec.usuario">{{ rec.usuario }}</div>
                  </div>
                  <span class="bg-blue-50 text-corporate border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">{{ rec.tipo_gestion }}</span>
                </div>
                <p class="text-sm text-gray-700 m-0 leading-tight">{{ rec.resultado }}</p>
              </div>
            </div>

            <!-- Formulario Nueva Gestión -->
            <div class="p-4 bg-gray-50 border-t">
              <h6 class="font-bold text-sm text-corporate mb-3">Nueva Gestión</h6>
              <form @submit.prevent="saveManagement" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs text-gray-500 font-bold">Fecha</label>
                    <input type="date" v-model="form.fecha_gestion" class="w-full text-sm border p-2 rounded-lg outline-none focus:border-corporate" required>
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 font-bold">Tipo</label>
                    <select v-model="form.tipo_gestion" class="w-full text-sm border p-2 rounded-lg outline-none focus:border-corporate bg-white" required>
                      <option value="">Seleccione...</option>
                      <option>Llamada</option><option>Visita</option><option>Manantial</option><option>Iglesia</option><option>Encuentro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="text-xs text-gray-500 font-bold">Resultado</label>
                  <input type="text" v-model="form.resultado" class="w-full text-sm border p-2 rounded-lg outline-none focus:border-corporate" placeholder="Detalle de la gestión..." required>
                </div>
                <button type="submit" :disabled="isSaving" class="w-full bg-corporate text-white font-bold text-sm py-2 rounded-lg hover:bg-[#003366] transition disabled:opacity-50">
                  {{ isSaving ? 'Guardando...' : 'Guardar Gestión' }}
                </button>
              </form>
            </div>
          </div>
        </details>

      </div>
    </div>
  </div>
</template>

<style scoped>
.style-scrollbar::-webkit-scrollbar { width: 6px; }
.style-scrollbar::-webkit-scrollbar-track { background: #f8f9fa; }
.style-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.style-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-corporate); }
</style>