export function startOfWeek(d: Date) {
  //monday-start week
  const x = new Date(d);
  const day = x.getDay(); // 0 sun and 6 is sat
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDate(date: Date) {
  //^js date object to datetime string for backend
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");//using pastart sp it's like 01 or 03 instead of 1 or 3
  const day = String(date.getDate()).padStart(2, "0");
  //^this also padded to 2 digits

  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  const secs = "00";//seconds dont matter

  return `${year}-${month}-${day}T${hours}:${mins}:${secs}`;
}

export function formatTime(date: Date) {
  //only time portion of date for ui
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${mins}`;
}
