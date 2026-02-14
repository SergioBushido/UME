const { format, isWithinInterval, parseISO } = require('date-fns');

const day = new Date('2026-02-19T00:00:00.000Z'); // Mid-day in UTC? Or Local? 
// Supabase returns '2026-02-16'. 
const rStartStr = '2026-02-16';
const rEndStr = '2026-02-22';

const rStart = new Date(rStartStr);
const rEnd = new Date(rEndStr);

console.log('Day:', day.toISOString());
console.log('Request Start:', rStart.toISOString());
console.log('Request End:', rEnd.toISOString());

const within = isWithinInterval(day, { start: rStart, end: rEnd });
console.log('Is within?', within);

// Test with local time impact if 'new Date()' uses local
const localDay = new Date(2026, 1, 19);
console.log('Local Day:', localDay.toString());
console.log('Local within?', isWithinInterval(localDay, { start: rStart, end: rEnd }));
