export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const safeDate = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
  return new Date(safeDate).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
}

export const validatePhone = (value) => {
  let val = value.replace(/\D/g, '')
  if (val.length > 10) val = val.slice(0, 10)
  return val
}

export const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return (R * c).toFixed(1)
}