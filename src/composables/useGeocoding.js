import { ref } from 'vue'

export function useGeocoding() {
  const isLocating = ref(false)

  const getCoordinatesFromAddress = async (direccion, barrio) => {
    isLocating.value = true
    const query = `${direccion}, Barrio ${barrio || ''}, Palmira, Valle del Cauca, Colombia`
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`)
      const geoData = await res.json()
      
      if (geoData.status === 'OK' && geoData.results.length > 0) {
        isLocating.value = false
        return {
          lat: geoData.results[0].geometry.location.lat,
          lng: geoData.results[0].geometry.location.lng
        }
      }
    } catch (error) {
      console.error('Error en geocodificación:', error)
    }
    isLocating.value = false
    return null
  }

  return { isLocating, getCoordinatesFromAddress }
}