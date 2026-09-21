export function getRomeDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const read = (type) => Number(parts.find((part) => part.type === type)?.value || 0)

  return new Date(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour'),
    read('minute'),
    0,
    0
  )
}

function toDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getPickupDays(now = new Date(), maxDays = 7) {
  const romeNow = getRomeDate(now)
  const days = []

  for (let offset = 0; offset < 14 && days.length < maxDays; offset += 1) {
    const date = new Date(romeNow)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + offset)

    // Domenica chiuso per il ritiro.
    if (date.getDay() === 0) continue

    const prefix = offset === 0 ? 'Oggi' : offset === 1 ? 'Domani' : ''
    const formatted = new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    }).format(date)

    days.push({
      value: toDateValue(date),
      label: prefix ? `${prefix} · ${formatted}` : formatted,
    })
  }

  return days
}

export function getPickupTimes(selectedDay, now = new Date()) {
  if (!selectedDay) return []

  const romeNow = getRomeDate(now)
  const selectedDate = new Date(`${selectedDay}T00:00:00`)
  const preparationLimit = new Date(romeNow.getTime() + 30 * 60 * 1000)
  const ranges = [
    [8 * 60, 13 * 60],
    [17 * 60, 20 * 60],
  ]
  const times = []

  for (const [start, end] of ranges) {
    for (let minutes = start; minutes <= end; minutes += 30) {
      const slotDate = new Date(selectedDate)
      slotDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

      if (slotDate < preparationLimit) continue

      times.push(
        `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      )
    }
  }

  return times
}

export function formatPickupSelection(days, selectedDay, selectedTime) {
  const day = days.find((item) => item.value === selectedDay)
  return day && selectedTime ? `${day.label} · ${selectedTime}` : ''
}
