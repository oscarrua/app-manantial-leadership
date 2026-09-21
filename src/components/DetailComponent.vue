<script setup>
import { ref, watch } from 'vue'
import { useMainStore } from '../stores/mainStore'

// Importamos los 3 subcomponentes que creamos en la carpeta Detail
import DetailDatos from './Detail/DetailDatos.vue'
import DetailLiderazgo from './Detail/DetailLiderazgo.vue'
import DetailHistorial from './Detail/DetailHistorial.vue'

const props = defineProps(['visitorId'])
const emit = defineEmits(['close-detail'])
const store = useMainStore()

const visitor = ref(null)

// El orquestador solo se encarga de buscar el visitante activo cuando cambia el ID
watch(() => props.visitorId, (newId) => {
  if (!newId) {
    visitor.value = null
    return
  }
  // Buscamos el visitante en el estado global (Pinia)
  visitor.value = store.consolidaciones.find(r => r.id === newId)
}, { immediate: true })
</script>

<template>
  <div>
    <!-- Fondo oscuro -->
    <div v-if="visitorId" @click="emit('close-detail')" class="fixed inset-0 bg-black/20 z-[55] transition-opacity backdrop-blur-sm"></div>
    
    <!-- Panel Lateral Deslizante -->
    <div class="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#f8f9fa] shadow-2xl z-[60] transform transition-transform duration-300 flex flex-col"
         :class="visitorId ? 'translate-x-0' : 'translate-x-full'">
      
      <!-- Cabecera Hero -->
      <div class="flex justify-between items-center p-5 bg-gradient-to-r from-corporate to-[#002244] shadow-md text-white relative overflow-hidden shrink-0">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <h5 class="font-bold text-lg flex items-center gap-2 m-0 relative z-10">
          Detalle de Consolidación
        </h5>
        <button @click="emit('close-detail')" class="bg-white/10 text-white hover:bg-red-500 w-8 h-8 rounded-full flex justify-center items-center transition-colors shadow-sm relative z-10 backdrop-blur-sm active:scale-95">
          ✕
        </button>
      </div>

      <!-- Cuerpo: Renderizado de Subcomponentes -->
      <div v-if="visitor" :key="visitorId" class="p-4 overflow-y-auto flex-1 style-scrollbar space-y-3 pb-10">
        
        <!-- Tarjeta Principal (Header del visitante) -->
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

        <!-- COMPONENTES HIJOS DESACOPLADOS -->
        <!-- 1. Datos Personales, Consolidación y Observaciones -->
        <DetailDatos :visitor="visitor" @close="emit('close-detail')" />
        
        <!-- 2. Asignación de Liderazgo -->
        <DetailLiderazgo :visitor="visitor" />
        
        <!-- 3. Historial de Gestiones -->
        <DetailHistorial :visitor="visitor" />

      </div>
    </div>
  </div>
</template>