// Shared by the customer checkout and the admin booking views (0024).
// The same rules are enforced by razorpay-create-order and
// create_pending_booking() — these are for immediate feedback and labels.

// Structured "interested in collaborating with Tangy?" options. Keys match the
// bookings_collab_interests_check constraint.
export const COLLAB_INTERESTS = [
  ['artist', 'Artist'], ['sponsor', 'Sponsor'], ['volunteer', 'Volunteer'], ['event_team', 'Event team'],
  ['sound_technical', 'Sound / technical'], ['video_photo', 'Video / photography'], ['editing', 'Editing'],
  ['graphic_design', 'Graphic design'], ['other', 'Other'],
];
export const collabLabel = (key) => COLLAB_INTERESTS.find(([k]) => k === key)?.[1] || key;

// Indian mobile / WhatsApp: 10 digits starting 6–9, optional +91 / 0 prefix.
export const validPhone = (v) => /^[6-9]\d{9}$/.test(String(v || '').replace(/[\s-]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, ''));
export const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

// Question presets for the admin booking-form editor. Each is a valid
// events.booking_questions entry (valid_booking_questions()).
export const QUESTION_PRESETS = [
  { key: 'chairs', label: 'Chair seating (count)', question: { id: 'chairs', type: 'number', label: 'How many people in your group need chair seating?', required: false, help: 'Seating is on mattresses — chairs for guests over 55 or anyone more comfortable on a chair.' } },
  { key: 'seating_note', label: 'Seating / accessibility note', question: { id: 'seating_note', type: 'long_text', label: 'Any seating or accessibility requirement?', required: false } },
  { key: 'area', label: 'Area of the city', question: { id: 'area', type: 'single_select', label: 'Which part of Hyderabad are you coming from?', required: false, help: 'Helps us plan parking and commute support — no address needed.', options: ['Banjara Hills / Jubilee Hills', 'Gachibowli / HITEC City', 'Kondapur / Madhapur', 'Secunderabad', 'Old City', 'Kukatpally / Miyapur', 'LB Nagar / Dilsukhnagar', 'Other'] } },
  { key: 'dob', label: 'Date of birth', question: { id: 'dob', type: 'date', label: 'Date of birth', required: false, help: 'Only used for seating comfort; visible to the Tangy team only.' } },
  { key: 'gender', label: 'Gender', question: { id: 'gender', type: 'single_select', label: 'Gender', required: false, options: ['Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Other'] } },
];
export const QUESTION_TYPES = [['text', 'Short text'], ['long_text', 'Long text'], ['number', 'Number (people in the booking)'], ['date', 'Date'], ['single_select', 'Single choice'], ['multi_select', 'Multiple choice'], ['boolean', 'Yes / no']];
