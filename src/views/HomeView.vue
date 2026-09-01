<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMainStore } from '../stores/mainStore'
import DetailComponent from '../components/DetailComponent.vue'

const store = useMainStore()

const filters = ref({ tleader: '', wleader: '' })
const selectedVisitorId = ref(null)

onMounted(() => {
  store.fetchData()
})

const filteredConsolidations = computed(() => {
  return store.consolidaciones.filter(row => {
    const tribu = row.lider_tribu || 'Sin asignar'
    const manantial = row.lider_manantial || 'Sin asignar'

    const matchT = !filters.value.tleader || tribu === filters.value.tleader
    const matchW = !filters.value.wleader || manantial.toLowerCase().includes(filters.value.wleader.toLowerCase())
    
    return matchT && matchW
  })
})

const availableWLeaders = computed(() => {
  if(!filters.value.tleader || filters.value.tleader === 'Sin asignar') return []
  return store.lideres.allLeadersData
    .filter(r => (r[1] || 'Sin asignar') === filters.value.tleader)
    .map(r => r[0])
    .sort()
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
}
</script>

<template>
  <div class="animate-[fadeInUp_0.4s_ease-out]">
    
    <!-- Hero Buscador de Consolidaciones (Optimizado para Móvil) -->
    <div class="bg-gradient-to-r from-corporate to-[#002244] p-4 sm:p-6 rounded-2xl shadow-lg mb-6 text-white relative overflow-hidden">
      <!-- Efecto de luz de fondo -->
      <div class="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div class="flex flex-col xl:flex-row justify-between xl:items-center gap-4 relative z-10">
        
        <!-- Título y Contador -->
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-xl md:text-2xl font-extrabold m-0">Consolidaciones abiertas</h2>
            <span class="bg-accent-gold text-accent-text rounded-full px-2.5 py-0.5 text-xs shadow-sm font-extrabold">
              {{ filteredConsolidations.length }}
            </span>
          </div>
          <!-- Oculto en móvil (hidden) para ahorrar espacio vertical -->
          <p class="text-white/80 text-sm mt-1 hidden md:block">
            Filtra y gestiona los visitantes asignados por tribu o manantial.
          </p>
        </div>

        <!-- Filtros Rápidos (Tribus y Manantiales) -->
        <div class="w-full xl:w-auto flex flex-col sm:flex-row gap-2.5">
          <select 
            v-model="filters.tleader" 
            @change="filters.wleader = ''" 
            class="w-full sm:w-auto min-w-[200px] bg-white/10 text-white font-bold rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-gold border border-white/20 backdrop-blur-sm transition-all appearance-none cursor-pointer"
          >
            <option value="" class="text-gray-800">Todas las Tribus</option>
            <option value="Sin asignar" class="text-gray-800">Sin asignar</option>
            <option v-for="l in store.lideres.tleaders" :key="l" :value="l" class="text-gray-800">{{ l }}</option>
          </select>
          
          <select 
            v-model="filters.wleader" 
            :disabled="!filters.tleader" 
            class="w-full sm:w-auto min-w-[200px] bg-white/10 text-white font-bold rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-gold border border-white/20 backdrop-blur-sm transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" class="text-gray-800">{{ filters.tleader ? 'Todos los Manantiales' : 'Seleccione Tribu...' }}</option>
            <option value="Sin asignar" class="text-gray-800">Sin asignar</option>
            <option v-for="l in availableWLeaders" :key="l" :value="l" class="text-gray-800">{{ l }}</option>
          </select>
        </div>

      </div>
    </div>

    <!-- Contenedor de Tabla con Scroll Horizontal y Columna Fija -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative">
      <div class="max-h-[65vh] overflow-auto style-scrollbar">
        <table class="w-full text-sm text-left border-collapse">
          
          <!-- Cabecera -->
          <thead class="sticky top-0 bg-white text-corporate font-extrabold border-b border-gray-200 z-20 shadow-sm">
            <tr>
              <!-- Columna Acción Fija en Cabecera (sticky left-0) -->
              <th class="p-3.5 whitespace-nowrap sticky left-0 bg-white z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">Acción</th>
              <th class="p-3.5 whitespace-nowrap">Visita</th>
              <th class="p-3.5 whitespace-nowrap">Actualiz.</th>
              <th class="p-3.5 whitespace-nowrap">Estado</th>
              <th class="p-3.5 whitespace-nowrap">Tribu</th>
              <th class="p-3.5 whitespace-nowrap">Manantial</th>
              <th class="p-3.5 whitespace-nowrap">Visitante</th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-gray-100">
            
            <!-- Estado de Carga -->
            <tr v-if="store.isLoading">
              <td colspan="7" class="p-12 text-center">
                <div class="flex flex-col items-center justify-center gap-3">
                  <div class="animate-spin rounded-full h-8 w-8 border-3 border-gray-200 border-t-corporate"></div>
                  <span class="text-corporate font-bold text-xs animate-pulse">Sincronizando registros...</span>
                </div>
              </td>
            </tr>
            
            <tr v-else-if="filteredConsolidations.length === 0">
              <td colspan="7" class="p-12 text-center text-gray-400 italic">No hay consolidaciones que coincidan con la búsqueda.</td>
            </tr>
            
            <!-- Filas con Columna Fija -->
            <tr v-for="row in filteredConsolidations" :key="row.id" class="group hover:bg-blue-50/40 transition-colors duration-200">
              
              <!-- Columna Acción Fija en Cuerpo (sticky left-0) -->
              <td class="p-3.5 sticky left-0 bg-white group-hover:bg-[#f4f8fc] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] transition-colors">
                <button 
                  @click="selectedVisitorId = row.id" 
                  class="text-corporate bg-corporate/10 font-bold px-3 py-1.5 rounded-lg hover:bg-corporate hover:text-white transition-all shadow-sm text-xs active:scale-95"
                >
                  Ver
                </button>
              </td>

              <td class="p-3.5 text-gray-500 font-medium whitespace-nowrap">{{ formatDate(row.fecha_visita) }}</td>
              <td class="p-3.5 text-gray-400 text-xs whitespace-nowrap">{{ formatDate(row.updated_at) }}</td>
              <td class="p-3.5 whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold border" 
                      :class="row.estado === 'En proceso' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'">
                  {{ row.estado }}
                </span>
              </td>
              <td class="p-3.5 font-bold text-gray-700 whitespace-nowrap">{{ row.lider_tribu || 'Sin asignar' }}</td>
              <td class="p-3.5 text-gray-500 text-xs font-medium whitespace-nowrap">{{ row.lider_manantial || 'Sin asignar' }}</td>
              <td class="p-3.5 font-bold text-corporate whitespace-nowrap">{{ row.visitante }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Componente Modal Deslizante -->
    <DetailComponent :visitor-id="selectedVisitorId" @close-detail="selectedVisitorId = null" />
  </div>
</template>

<style scoped>
.style-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.style-scrollbar::-webkit-scrollbar-track { background: #f8f9fa; }
.style-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.style-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-corporate); }
</style>