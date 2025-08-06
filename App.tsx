import React, { useState } from 'react';
import DatePicker, { DateObject } from 'react-multi-date-picker';

type Shift = 'E' | 'D' | 'DL' | 'N';
type Assignment = Shift | 'OFF' | '';

type Staff = {
  name: string;
  dayOffs: string[];
  days: string[];
  shifts: Shift[];
  maxPerWeek: number;
};

const daysOfWeek = ['月', '火', '水', '木', '金', '土', '日'];
const shiftOptions: Shift[] = ['E', 'D', 'DL', 'N'];
const shiftOrder: ('E' | 'D' | 'N')[] = ['E', 'D', 'N'];

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getWeekIndex = (date: Date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // 月曜=0
  return Math.floor((date.getDate() + offset - 1) / 7);
};

const formatLabel = (date: Date) => {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
};

function App() {
  const [name, setName] = useState('');
  const [dayOffs, setDayOffs] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([]);
  const [maxPerWeek, setMaxPerWeek] = useState(5);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const handleDayChange = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleShiftChange = (shift: Shift) => {
    setSelectedShifts(prev =>
      prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
    );
  };

  const handleDayOffChange = (dates: DateObject[] | DateObject | null) => {
    if (!dates) return setDayOffs([]);
    const arr = (Array.isArray(dates) ? dates : [dates]).map(d =>
      `${String(d.month.number).padStart(2, '0')}/${String(d.day).padStart(2, '0')}`
    );
    setDayOffs(arr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: Staff = {
      name,
      dayOffs,
      days: selectedDays,
      shifts: selectedShifts,
      maxPerWeek,
    };
    setStaffList(prev => [...prev, newStaff]);

    // reset
    setName('');
    setDayOffs([]);
    setSelectedDays([]);
    setSelectedShifts([]);
    setMaxPerWeek(5);
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

    const assignments: Record<string, Record<number, Assignment>> = {};
    const weeklyCounts: Record<string, Record<number, number>> = {};
    staffList.forEach(staff => {
      assignments[staff.name] = {};
      weeklyCounts[staff.name] = {};
      for (let d = 1; d <= daysInMonth; d++) {
        assignments[staff.name][d] = '';
      }
    });

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const weekIndex = getWeekIndex(date);
      const dayName = weekdays[date.getDay()];

      if (d > 1) {
        staffList.forEach(s => {
          if (assignments[s.name][d - 1] === 'N') {
            assignments[s.name][d] = 'OFF';
          }
        });
      }

      shiftOrder.forEach(shift => {
        const candidates = staffList.filter(s => {
          if (assignments[s.name][d] !== '') return false;
          if (!s.days.includes(dayName)) return false;
          const prev = assignments[s.name][d - 1];
          if (shift === 'E') {
            if (!s.shifts.includes('E')) return false;
            if (prev === 'D' || prev === 'DL') return false;
          } else if (shift === 'D') {
            if (!s.shifts.includes('D') && !s.shifts.includes('DL'))
              return false;
          } else if (shift === 'N') {
            if (!s.shifts.includes('N')) return false;
          }
          return (weeklyCounts[s.name][weekIndex] || 0) < s.maxPerWeek;
        });

        if (candidates.length > 0) {
          const chosen =
            candidates[Math.floor(Math.random() * candidates.length)];
          let assignedShift: Assignment = shift;
          if (shift === 'D') {
            assignedShift = chosen.shifts.includes('D') ? 'D' : 'DL';
          }
          assignments[chosen.name][d] = assignedShift;
          weeklyCounts[chosen.name][weekIndex] =
            (weeklyCounts[chosen.name][weekIndex] || 0) + 1;
        } else {
          console.warn(`${d}日 ${shift === 'D' ? 'D/DL' : shift} の候補者が0人です`);
        }
      });
    }

    return { assignments, labels };
  };

  const exportShiftCSV = (
    assignments: Record<string, Record<number, Assignment>>,
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
            <DatePicker
              multiple
              value={dayOffs}
              onChange={handleDayOffChange}
              format="MM/DD"
              style={{ width: '100%' }}
            />
          </label>
        </div>
        <div>
          <label>
            最大勤務回数/週:
            <input
              type="number"
              min={1}
              max={7}
              value={maxPerWeek}
              onChange={e => setMaxPerWeek(Number(e.target.value))}
            />
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
          {shiftOptions.map(shift => (
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
            {staff.name} (希望休: {staff.dayOffs.length ? staff.dayOffs.join('、') : 'なし'})<br />
            働ける曜日: {staff.days.join('、') || 'なし'}<br />
            働ける時間帯: {staff.shifts.join('、') || 'なし'}<br />
            最大勤務回数/週: {staff.maxPerWeek}
          </li>
        ))}
      </ul>
      <button onClick={handleExport}>シフト表CSV出力</button>
    </div>
  );
}

export default App;
