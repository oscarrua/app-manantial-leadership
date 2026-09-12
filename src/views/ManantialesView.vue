<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMainStore } from '../stores/mainStore'
import { supabase } from '../supabase'
import { useToast } from '../composables/useToast'

const store = useMainStore()
const { showToast } = useToast()

onMounted(() => {
  store.fetchData()
})

const selectedTLeader = ref('')
const isFormOpen = ref(false)
const isSaving = ref(false)

const form = ref({
  id: null, lider_id: null, lider_manantial: '', celular_lider: '',
  direccion: '', barrio: '', anfitrion: '', celular_anfitrion: '',
  dia_reunion: '', hora_reunion: '', latitud: null, longitud: null, activo: true
})

const tribeWLeaders = computed(() => {
  if (!selectedTLeader.value) return []
  
  let filteredData = store.lideres.allLeadersData
  if (selectedTLeader.value !== 'Todas') {
    filteredData = filteredData.filter(r => r[1] === selectedTLeader.value)
  }
  
  return filteredData
    // Se mapea la "red" desde el índice 3 del arreglo de datos de líderes
    .map(r => ({ name: r[0], tribu: r[1], id: r[2], red: r[3] }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const getManantiales = (leaderId) => store.manantiales.filter(m => m.lider_id === leaderId)

const exportToExcel = () => {
  if (!selectedTLeader.value || tribeWLeaders.value.length === 0) {
    return showToast('No hay datos para exportar', 'error')
  }

  // MODIFICADO: Añadida la columna "Red" al inicio de las cabeceras
  let csv = 'Red,Tribu,Líder Asignado,Celular del Líder,Dirección,Barrio,Día\n'
  let hasData = false

  tribeWLeaders.value.forEach(wleader => {
    const manantiales = getManantiales(wleader.id)
    manantiales.forEach(m => {
      hasData = true
      const red = wleader.red || 'Sin asignar' // Nuevo campo
      const tribu = wleader.tribu || 'Sin asignar'
      const lider = wleader.name || 'Sin asignar'
      const celular = m.celular_lider || 'N/A'
      
      const dir = m.direccion ? `"${m.direccion.replace(/"/g, '""').replace(/\n/g, ' ')}"` : 'N/A'
      const barrio = m.barrio ? `"${m.barrio.replace(/"/g, '""').replace(/\n/g, ' ')}"` : 'N/A'
      const dia = m.dia_reunion || 'N/A'
      
      // MODIFICADO: Inyectando el campo Red en la fila del Excel
      csv += `"${red}","${tribu}","${lider}","${celular}",${dir},${barrio},"${dia}"\n`
    })
  })

  if (!hasData) {
    return showToast('No hay manantiales registrados para esta selección', 'error')
  }

  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  
  const fileName = selectedTLeader.value === 'Todas' ? 'Todas_Las_Tribus' : selectedTLeader.value
  link.setAttribute("download", `Manantiales_${fileName}.csv`)
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  showToast('Exportación completada exitosamente', 'success')
}

const openForm = (wleader, manantial = null) => {
  if (manantial) {
    form.value = { ...manantial, lider_manantial: wleader.name }
  } else {
    form.value = { 
      id: null, lider_id: wleader.id, lider_manantial: wleader.name, 
      celular_lider: '', direccion: '', barrio: '', anfitrion: '', 
      celular_anfitrion: '', dia_reunion: '', hora_reunion: '', 
      latitud: null, longitud: null, activo: true 
    }
  }
  isFormOpen.value = true
}

const updateLiderName = () => {
  const leader = tribeWLeaders.value.find(l => l.id === form.value.lider_id)
  if (leader) form.value.lider_manantial = leader.name
}

const capturarGPS = () => {
  if (!navigator.geolocation) {
    return showToast('GPS no soportado en este dispositivo', 'error')
  }
  
  showToast('Calculando ubicación...', 'success')
  
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.value.latitud = Number(pos.coords.latitude.toFixed(6))
      form.value.longitud = Number(pos.coords.longitude.toFixed(6))
      showToast('Ubicación exacta capturada', 'success')
    },
    (err) => {
      showToast('Permiso GPS denegado o señal débil', 'error')
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

const validatePhone = (e, field) => {
  let val = e.target.value.replace(/\D/g, '')
  if (val.length > 10) val = val.slice(0, 10)
  form.value[field] = val
}

const submitForm = async () => {
  if (isSaving.value) return 
  isSaving.value = true

  if (!form.value.latitud || !form.value.longitud) {
    const query = `${form.value.direccion}, Barrio ${form.value.barrio}, Palmira, Valle del Cauca, Colombia`
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY 

    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`)
      const geoData = await res.json()

      if (geoData.status === 'OK' && geoData.results.length > 0) {
        form.value.latitud = geoData.results[0].geometry.location.lat
        form.value.longitud = geoData.results[0].geometry.location.lng
      } else {
        showToast('Dirección no encontrada en el mapa. Intenta usar el botón "Usar mi GPS".', 'error')
      }
    } catch (error) {
      console.error('Fallo silencioso en geocodificación:', error)
    }
  }

  const payload = { ...form.value }
  delete payload.lider_manantial 
  
  if (!payload.id) {
    delete payload.id
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  payload.actualizado_por = user?.user_metadata?.full_name || user?.email || 'Sistema'

  const { error } = form.value.id 
    ? await supabase.from('manantiales').update(payload).eq('id', form.value.id)
    : await supabase.from('manantiales').insert(payload)

  if (!error) {
    await store.fetchData(true)
    isFormOpen.value = false
    const accion = form.value.id ? 'actualizado' : 'registrado'
    showToast(`Manantial ${accion} con éxito`, 'success')
  } else {
    showToast(`Error al guardar: ${error.message}`, 'error')
  }
  isSaving.value = false
}
</script>

<template>
  <div class="animate-[fadeInUp_0.4s_ease-out]">
    
    <!-- Hero Buscador y Botón de Excel -->
    <div class="bg-gradient-to-r from-corporate to-[#002244] p-6 rounded-2xl shadow-lg mb-8 text-white relative overflow-hidden">
      <div class="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div class="mb-2 md:mb-0">
          <h2 class="text-xl md:text-2xl font-extrabold mb-1">Directorio de Tribus</h2>
          <p class="text-white/80 text-sm">Selecciona una Tribu para gestionar sus líderes y locaciones.</p>
        </div>
        
        <div class="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <select v-model="selectedTLeader" class="w-full sm:w-[250px] bg-white/10 text-white font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-nav-accent-gold border border-white/20 backdrop-blur-sm transition-all appearance-none cursor-pointer">
            <option value="" class="text-gray-800">Seleccione una tribu...</option>
            <option value="Todas" class="text-gray-800">Todas las tribus</option>
            <option v-for="l in store.lideres.tleaders" :key="l" :value="l" class="text-gray-800">{{ l }}</option>
          </select>

          <button 
            v-if="selectedTLeader"
            @click="exportToExcel"
            class="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl shadow-md transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Exportar Excel
          </button>
        </div>
      </div>
    </div>

    <!-- Directorio de Tarjetas -->
    <div v-if="selectedTLeader" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="tribeWLeaders.length === 0" class="col-span-full text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500 font-medium">
        No hay líderes asignados a esta búsqueda.
      </div>
      
      <div v-for="wleader in tribeWLeaders" :key="wleader.id" class="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        
        <div class="p-4 border-b border-gray-50 flex justify-between items-center bg-gradient-to-b from-gray-50/50 to-white relative">
          
          <!-- MODIFICADO: Distintivo con Red y Tribu -->
          <div v-if="selectedTLeader === 'Todas'" class="absolute -top-0 -right-0 bg-corporate text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg opacity-80">
            {{ wleader.red || 'Sin Red' }} • {{ wleader.tribu }}
          </div>

          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-corporate/10 text-corporate font-bold flex items-center justify-center shrink-0">
              {{ wleader.name.charAt(0) }}
            </div>
            <h4 class="font-bold text-gray-800 leading-tight pr-2 m-0">{{ wleader.name }}</h4>
          </div>
          <button @click="openForm(wleader)" class="w-8 h-8 rounded-full bg-corporate text-white hover:bg-[#003366] flex items-center justify-center transition-colors shadow-sm shrink-0 mt-2" title="Nuevo Manantial">
            <span class="text-xl font-bold leading-none mb-0.5">+</span>
          </button>
        </div>

        <div class="p-3 flex-1 bg-white">
          <div v-if="getManantiales(wleader.id).length > 0" class="space-y-2.5">
            <div v-for="m in getManantiales(wleader.id)" :key="m.id" class="p-3 rounded-xl border border-gray-100 bg-gray-50/50 relative overflow-hidden transition-colors flex flex-col justify-between" :class="m.activo ? 'hover:border-green-200' : 'opacity-75 grayscale'">
              
              <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="m.activo ? 'bg-green-500' : 'bg-red-400'"></div>
              
              <div class="pl-2 flex justify-between items-start gap-3">
                <div class="overflow-hidden w-full">
                  <div class="flex items-center gap-2">
                    <div class="font-bold text-sm text-gray-800 leading-tight truncate">{{ m.direccion }}</div>
                    <a v-if="m.latitud && m.longitud" 
                       :href="`https://maps.google.com/?q=${m.latitud},${m.longitud}`" 
                       target="_blank" rel="noopener noreferrer"
                       class="text-blue-500 hover:text-blue-700 transition-colors shrink-0"
                       title="Ver en mapa">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </a>
                  </div>
                  <div class="text-[11px] text-gray-500 mt-0.5 font-medium truncate">B. {{ m.barrio }} • {{ m.dia_reunion }} {{ m.hora_reunion }}</div>
                  
                  <!-- SE ELIMINÓ: el indicador visual numérico de las coordenadas por requerimiento de la UX -->
                </div>
                
                <button @click="openForm(wleader, m)" class="text-corporate bg-corporate/10 hover:bg-corporate hover:text-white p-1.5 rounded-md transition-colors shrink-0 active:scale-95 shadow-sm" title="Editar Manantial">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-center p-4">
            <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 text-gray-300 text-lg">📍</div>
            <p class="text-xs text-gray-400 font-medium">Sin manantiales</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel Lateral Deslizante (Formulario) -->
    <div v-if="isFormOpen" class="fixed inset-0 z-[60] flex justify-end">
      <div @click="isFormOpen = false" class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"></div>
      
      <div class="w-full md:w-[500px] bg-[#f8f9fa] h-full shadow-2xl relative z-10 flex flex-col animate-[slideInRight_0.3s_ease-out]">
        
        <!-- MODIFICADO: Cabecera Hero estandarizada (Idéntica al de Registro de Consolidación) -->
        <div class="flex justify-between items-center p-5 bg-gradient-to-r from-corporate to-[#002244] shadow-md text-white relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <h5 class="font-bold text-lg flex items-center gap-2 m-0 relative z-10">
            {{ form.id ? 'Editar' : 'Nuevo' }} Manantial
          </h5>
          <button @click="isFormOpen = false" class="bg-white/10 text-white hover:bg-red-500 w-8 h-8 rounded-full flex justify-center items-center transition-colors shadow-sm relative z-10 backdrop-blur-sm active:scale-95">
            ✕
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 space-y-4 style-scrollbar">
          
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Líder Asignado</label>
              <select v-model="form.lider_id" @change="updateLiderName" class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 mt-1 bg-white transition-all">
                <option v-for="l in tribeWLeaders" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </div>
            
            <div>
              <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Celular Líder</label>
              <input 
                type="tel" 
                inputmode="numeric" 
                pattern="[0-9]*"
                v-model="form.celular_lider" 
                @input="validatePhone($event, 'celular_lider')"
                maxlength="10" 
                class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 mt-1 transition-all"
                placeholder="Ej: 3001234567"
              >
            </div>
            <div>
              <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Dirección Exacta</label>
              <input type="text" v-model="form.direccion" class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 mt-1 transition-all">
            </div>
            <div>
              <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Barrio</label>
              <input type="text" v-model="form.barrio" class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 mt-1 transition-all">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Día</label>
                <select v-model="form.dia_reunion" class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 mt-1 bg-white transition-all">
                  <option>Lunes</option><option>Martes</option><option>Miércoles</option><option>Jueves</option><option>Viernes</option><option>Sábado</option><option>Domingo</option>
                </select>
              </div>
              <div>
                <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Hora</label>
                <input type="time" v-model="form.hora_reunion" class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 mt-1 transition-all">
              </div>
            </div>
            
            <div class="pt-4 border-t border-gray-100">
              <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Nombre Anfitrión</label>
              <input type="text" v-model="form.anfitrion" class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 mt-1 transition-all">
            </div>
            <div>
              <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Celular Anfitrión</label>
              <input 
                type="tel" 
                inputmode="numeric" 
                pattern="[0-9]*"
                v-model="form.celular_anfitrion" 
                @input="validatePhone($event, 'celular_anfitrion')"
                maxlength="10" 
                class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 mt-1 transition-all"
                placeholder="Ej: 3001234567"
              >
            </div>

            <div class="pt-4 border-t border-gray-100">
              <div class="flex justify-between items-center mb-2">
                <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Coordenadas Mapas</span>
                <button type="button" @click="capturarGPS" class="flex items-center gap-1 text-[10px] bg-blue-50 text-corporate px-2 py-1 rounded font-bold border border-blue-100 hover:bg-corporate hover:text-white transition-colors active:scale-95 shadow-sm">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Usar mi GPS
                </button>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <input type="number" step="any" v-model="form.latitud" class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all text-sm" placeholder="Latitud">
                <input type="number" step="any" v-model="form.longitud" class="w-full border border-gray-200 rounded-lg focus:border-corporate focus:ring-1 focus:ring-corporate outline-none px-3 py-2 transition-all text-sm" placeholder="Longitud">
              </div>
            </div>

            <div v-if="form.id" class="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Estado del Manantial</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="form.activo" class="sr-only peer">
                <div class="w-11 h-6 bg-red-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                <span class="ml-3 text-xs font-bold" :class="form.activo ? 'text-green-600' : 'text-red-500'">{{ form.activo ? 'Activo' : 'Inactivo' }}</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="p-5 border-t bg-white">
          <button @click="submitForm" :disabled="isSaving" class="w-full bg-corporate text-white font-bold py-3.5 rounded-xl hover:bg-[#003366] transition-all shadow-[0_4px_12px_rgba(0,76,151,0.3)] hover:shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95">
            <div v-if="isSaving" class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            {{ isSaving ? 'Guardando...' : 'Guardar Manantial' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>