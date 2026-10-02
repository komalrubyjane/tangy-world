// How an availability answer looks everywhere it appears (event editor,
// artist directory, admin calendar, artist pages). The answer itself always
// comes from the server (find_available_artists / artist_calendar, 0034).
// Every state has a text label and a symbol, never colour alone.
export const AVAILABILITY = {
  available: { label: 'Available', symbol: '✓', cls: 'text-[#5fd3a0] border-[#1f8a5b]/50 bg-[#1f8a5b]/15' },
  tentative: { label: 'Tentative', symbol: '◐', cls: 'text-[#f5b544] border-[#d4911c]/50 bg-[#d4911c]/15' },
  busy: { label: 'Busy', symbol: '×', cls: 'text-[#ef6b5e] border-[#a8322a]/55 bg-[#a8322a]/15' },
  unavailable: { label: 'Unavailable', symbol: '×', cls: 'text-[#f08a6a] border-[#B5532A]/55 bg-[#B5532A]/15' },
  unknown: { label: 'Not set', symbol: '–', cls: 'text-[#E7D5A4]/70 border-[#E7D5A4]/25 bg-[#E7D5A4]/5' },
};
export const AVAILABILITY_ORDER = ['available', 'tentative', 'unknown', 'busy', 'unavailable'];

// Calendar entry kinds (artist_calendar).
export const ENTRY = {
  confirmed: { label: 'Booked', cls: 'bg-[#3E8E5E]/25 border-l-4 border-[#3E8E5E] text-[#CDEBD8]' },
  pending: { label: 'Request', cls: 'bg-[#C99A2E]/15 border-l-4 border-dashed border-[#C99A2E] text-[#F3E0B0]' },
  tentative: { label: 'Tentative', cls: 'bg-[#4F6D8A]/20 border-l-4 border-[#4F6D8A] text-[#CFE0F0]' },
  unavailable: { label: 'Unavailable', cls: 'bg-[#B5532A]/15 border-l-4 border-[#B5532A] text-[#F5C2B0]' },
  available: { label: 'Available', cls: 'bg-[#1f8a5b]/10 border-l-4 border-[#1f8a5b]/70 text-[#BFE6D2]' },
  cancelled: { label: 'Cancelled', cls: 'bg-[#E7D5A4]/5 border-l-4 border-[#E7D5A4]/30 text-[#E7D5A4]/70 line-through decoration-[#E7D5A4]/40' },
};

