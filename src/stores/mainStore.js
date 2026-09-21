import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase'
import { computed } from 'vue'

export const useMainStore = defineStore('main', () => {
  const consolidaciones = ref([])
  const manantiales = ref([])
  const lideres = ref({ tleaders: [], wleaders: [], allLeadersData: [] })
  const isLoading = ref(false)  
  const userPermissions = ref({ puede_cerrar: false, puede_asignar: false, puede_crear: false, rol: 'lider_basico' })

  // GETTERS
  const getTribesByRed = computed(() => {
    return (red) => {
      if (!red) return []
      return [...new Set(lideres.value.allLeadersData
        .filter(r => r[3] === red)
        .map(r => r[1]))].sort()
    }
  })

  const getWLeadersByTribeAndRed = computed(() => {
    return (tribu, red) => {
      if (!tribu || tribu === 'Sin asignar') return []
      return lideres.value.allLeadersData
        .filter(r => (r[1] || 'Sin asignar') === tribu && r[3] === red)
        .map(r => ({ name: r[0], id: r[2] }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }
  })

  const getManantialesByLeader = computed(() => {
    return (leaderName) => {
      if (!leaderName || leaderName === 'Sin asignar') return []
      const currentLeader = lideres.value.allLeadersData.find(r => r[0] === leaderName)
      if (!currentLeader) return []
      return manantiales.value.filter(m => m.lider_id === currentLeader[2])
    }
  })

  async function loadUserPermissions(email) {
    const { data } = await supabase
      .from('roles_usuarios')
      .select('rol, puede_cerrar_consolidacion, puede_asignar, puede_crear')
      .eq('email', email)
      .single()
      
    if (data) {
      userPermissions.value = {
        puede_cerrar: data.puede_cerrar_consolidacion,
        puede_asignar: data.puede_asignar,
        puede_crear: data.puede_crear,
        rol: data.rol
      }
    }
  }

  async function fetchData() {
    isLoading.value = true
    
    // 1. Cargar Lideres (Filtrando inactivos e incluyendo "red")
    const { data: dataLideres } = await supabase
      .from('lideres')
      .select('id, lider_tribu, lider_manantial, red') // <-- MODIFICADO: Agregado campo 'red'
      .eq('estado', true)

    if (dataLideres) {
      const tleaders = [...new Set(dataLideres.map(i => i.lider_tribu).filter(Boolean))].sort()
      const wleaders = [...new Set(dataLideres.map(i => i.lider_manantial).filter(Boolean))].sort()
      
      const allLeadersData = dataLideres
        .filter(i => i.lider_manantial && i.lider_tribu)
        .map(i => [i.lider_manantial, i.lider_tribu, i.id, i.red]) // <-- MODIFICADO: Agregado i.red
      
      lideres.value = { tleaders, wleaders, allLeadersData }
    }

    // 2. Cargar Consolidaciones Abiertas
    const { data: dataConsol } = await supabase
      .from('consolidaciones')
      .select('*')
      .in('estado', ['En proceso', 'Sin reporte'])
      .order('id', { ascending: true })
    if (dataConsol) consolidaciones.value = dataConsol

    // 3. Cargar Manantiales
    const { data: dataManan } = await supabase.from('manantiales').select('*')
    if (dataManan) manantiales.value = dataManan

    isLoading.value = false
  }

  return { 
    consolidaciones, manantiales, lideres, isLoading, userPermissions, 
    loadUserPermissions, fetchData,
    getTribesByRed, getWLeadersByTribeAndRed, getManantialesByLeader
  }
})