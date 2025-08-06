import React, { useState } from 'react';

type Staff = {
  name: string;
  dayOff: string;
  days: string[];
  shifts: string[];
};

const daysOfWeek = ['月', '火', '水', '木', '金', '土', '日'];
const shifts = ['早番', '遅番', '夜勤'];

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const formatLabel = (date: Date) => {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
};

function App() {
  const [name, setName] = useState('');
  const [dayOff, setDayOff] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const handleDayChange = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleShiftChange = (shift: string) => {
    setSelectedShifts(prev =>
      prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: Staff = {
      name,
      dayOff,
      days: selectedDays,
      shifts: selectedShifts,
    };
    setStaffList(prev => [...prev, newStaff]);

    // reset
    setName('');
    setDayOff('');
    setSelectedDays([]);
    setSelectedShifts([]);
  };

  const generateShiftTable = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    const labels = Array.from({ length: daysInMonth }, (_, i) =>
      formatLabel(new Date(year, month, i + 1))
    );

    const assignments: Record<string, Record<number, string>> = {};
    staffList.forEach(staff => {
      assignments[staff.name] = {};
      for (let d = 1; d <= daysInMonth; d++) {
        assignments[staff.name][d] = '';
      }
    });

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayName = weekdays[date.getDay()];
      shifts.forEach(shift => {
        const candidates = staffList.filter(
          s =>
            s.days.includes(dayName) &&
            s.shifts.includes(shift) &&
            assignments[s.name][d] === ''
        );
        if (candidates.length > 0) {
          const chosen =
            candidates[Math.floor(Math.random() * candidates.length)];
          assignments[chosen.name][d] = shift;
        }
      });
    }

    return { assignments, labels };
  };

  const exportShiftCSV = (
    assignments: Record<string, Record<number, string>>,
    labels: string[]
  ) => {
    const header = ['名前', ...labels];
    const rows: string[][] = [header];
    staffList.forEach(staff => {
      const row = [
        staff.name,
        ...labels.map((_, idx) => assignments[staff.name]?.[idx + 1] || ''),
      ];
      rows.push(row);
    });

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shiftTable.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const { assignments, labels } = generateShiftTable();
    exportShiftCSV(assignments, labels);
  };

  return (
    <div>
      <h1>スタッフ情報入力</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            名前:
            <input value={name} onChange={e => setName(e.target.value)} />
          </label>
        </div>
        <div>
          <label>
            希望休:
            <input value={dayOff} onChange={e => setDayOff(e.target.value)} />
          </label>
        </div>
        <div>
          働ける曜日:
          {daysOfWeek.map(day => (
            <label key={day} style={{ marginRight: '4px' }}>
              <input
                type="checkbox"
                checked={selectedDays.includes(day)}
                onChange={() => handleDayChange(day)}
              />
              {day}
            </label>
          ))}
        </div>
        <div>
          働ける時間帯:
          {shifts.map(shift => (
            <label key={shift} style={{ marginRight: '4px' }}>
              <input
                type="checkbox"
                checked={selectedShifts.includes(shift)}
                onChange={() => handleShiftChange(shift)}
              />
              {shift}
            </label>
          ))}
        </div>
        <button type="submit">登録</button>
      </form>
      <h2>登録済みスタッフ一覧</h2>
      <ul>
        {staffList.map((staff, index) => (
          <li key={index}>
            {staff.name} (希望休: {staff.dayOff})<br />
            働ける曜日: {staff.days.join('、') || 'なし'}<br />
            働ける時間帯: {staff.shifts.join('、') || 'なし'}
          </li>
        ))}
      </ul>
      <button onClick={handleExport}>シフト表CSV出力</button>
    </div>
  );
}

export default App;
