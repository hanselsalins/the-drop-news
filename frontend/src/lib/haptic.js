const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

/** Light tap — reactions, nav presses, tab switches */
export function light() {
  if (canVibrate) navigator.vibrate(10);
}

/** Medium tap — card opens, toggles */
export function medium() {
  if (canVibrate) navigator.vibrate(20);
}

/** Heavy — streak milestones, celebrations */
export function heavy() {
  if (canVibrate) navigator.vibrate([10, 50, 20]);
}
