import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase'

export const useMainStore = defineStore('main', () => {
  const consolidaciones = ref([])
  const manantiales = ref([])
  const lideres = ref({ tleaders: [], wleaders: [], allLeadersData: [] })
  const isLoading = ref(false)

  async function fetchData() {
    isLoading.value = true
    
    // 1. Cargar Lideres
    const { data: dataLideres } = await supabase.from('lideres').select('id, lider_tribu, lider_manantial')
    if (dataLideres) {
      const tleaders = [...new Set(dataLideres.map(i => i.lider_tribu).filter(Boolean))].sort()
      const wleaders = [...new Set(dataLideres.map(i => i.lider_manantial).filter(Boolean))].sort()
      const allLeadersData = dataLideres
        .filter(i => i.lider_manantial && i.lider_tribu)
        .map(i => [i.lider_manantial, i.lider_tribu, i.id])
      
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

  return { consolidaciones, manantiales, lideres, isLoading, fetchData }
})