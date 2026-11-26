import { formatChatTimestamp, OrbitChatTimePipe } from './orbit-chat-time.pipe';

describe('OrbitChatTimePipe', () => {
  const pipe = new OrbitChatTimePipe();
  // Thursday, Nov 26, 2026 15:50 local time
  const fixedNow = new Date(2026, 10, 26, 15, 50, 0);

  it('should return HH:mm when the message is from today', () => {
    const todayMorning = new Date(2026, 10, 26, 9, 5, 0);
    expect(formatChatTimestamp(todayMorning, fixedNow)).toBe('09:05');

    const todayAfternoon = new Date(2026, 10, 26, 14, 42, 0);
    expect(formatChatTimestamp(todayAfternoon, fixedNow)).toBe('14:42');
  });

  it('should return the Spanish day name when the message is from within the last week (1-6 days ago)', () => {
    // 1 day ago: Wednesday Nov 25, 2026
    const yesterday = new Date(2026, 10, 25, 20, 15, 0);
    expect(formatChatTimestamp(yesterday, fixedNow)).toBe('Miércoles');

    // 6 days ago: Friday Nov 20, 2026
    const sixDaysAgo = new Date(2026, 10, 20, 10, 0, 0);
    expect(formatChatTimestamp(sixDaysAgo, fixedNow)).toBe('Viernes');
  });

  it('should return dd/MM/yyyy when the message is 7 or more days old', () => {
    // 7 days ago: Thursday Nov 19, 2026
    const sevenDaysAgo = new Date(2026, 10, 19, 10, 0, 0);
    expect(formatChatTimestamp(sevenDaysAgo, fixedNow)).toBe('19/11/2026');

    // Over a month ago: Oct 5, 2026
    const older = new Date(2026, 9, 5, 8, 30, 0);
    expect(formatChatTimestamp(older, fixedNow)).toBe('05/10/2026');
  });

  it('should return empty string for empty or invalid dates', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform('invalid-date')).toBe('');
  });
});
