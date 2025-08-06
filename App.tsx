import React, { useState, useEffect } from 'react';
import DatePicker, { DateObject } from 'react-multi-date-picker';

type Shift = 'E' | 'D' | 'DL' | 'N';
type Assignment = Shift | 'AK' | 'OFF' | '';

type Staff = {
  name: string;
  dayOffs: string[];
  days: string[];
  shifts: Shift[];
  maxPerWeek: number;
  exactPerMonth: number;
};

const daysOfWeek = ['月', '火', '水', '木', '金', '土', '日'];
const shiftOptions: Shift[] = ['E', 'D', 'DL', 'N'];
const shiftOrder: ('E' | 'D' | 'N')[] = ['E', 'D', 'N'];

const demandPerWeekday: Record<string, { E: number; D: number; N: number }> = {
  月: { E: 1, D: 3, N: 2 },
  火: { E: 1, D: 3, N: 2 },
  水: { E: 1, D: 1, N: 2 },
  木: { E: 1, D: 3, N: 2 },
  金: { E: 1, D: 3, N: 2 },
  土: { E: 1, D: 3, N: 2 },
  日: { E: 1, D: 3, N: 2 },
};

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
  const [dayOffDates, setDayOffDates] = useState<DateObject[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([]);
  const [maxPerWeek, setMaxPerWeek] = useState(5);
  const [exactPerMonth, setExactPerMonth] = useState(20);
  const [staffList, setStaffList] = useState<Staff[]>(() => {
    const stored = localStorage.getItem('staffList');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse staffList from localStorage', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('staffList', JSON.stringify(staffList));
  }, [staffList]);

  const today = new Date();
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const [targetYear, setTargetYear] = useState(nextMonthDate.getFullYear());
  const [targetMonth, setTargetMonth] = useState(nextMonthDate.getMonth());

  const checkSupplyDemand = () => {
    const year = targetYear;
    const month = targetMonth;
    const daysInMonth = getDaysInMonth(year, month);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    const demand = { E: 0, D: 0, N: 0 };
    for (let d = 1; d <= daysInMonth; d++) {
      const dayName = weekdays[new Date(year, month, d).getDay()];
      const daily = demandPerWeekday[dayName];
      demand.E += daily.E;
      demand.D += daily.D;
      demand.N += daily.N;
    }

    const supply = { E: 0, D: 0, N: 0 };
    staffList.forEach(s => {
      let night = 0;
      if (s.shifts.includes('N')) {
        night = Math.floor(s.exactPerMonth / 2);
        supply.N += night;
      }
      const remaining = s.exactPerMonth - night * 2;
      if (s.shifts.includes('E')) supply.E += remaining;
      if (s.shifts.includes('D')) supply.D += remaining;
    });

    (['E', 'D', 'N'] as const).forEach(shift => {
      if (demand[shift] > supply[shift]) {
        console.warn(
          `⚠️ 供給不足: ${shift} があと${demand[shift] - supply[shift]}日分足りません`
        );
      }
    });
  };

  useEffect(() => {
    checkSupplyDemand();
  }, [staffList, targetYear, targetMonth]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: Staff = {
      name,
      dayOffs: dayOffDates.map(d => d.format('YYYY-MM-DD')),
      days: selectedDays,
      shifts: selectedShifts,
      maxPerWeek,
      exactPerMonth,
    };
    setStaffList(prev => [...prev, newStaff]);

    // reset
    setName('');
    setDayOffDates([]);
    setSelectedDays([]);
    setSelectedShifts([]);
    setMaxPerWeek(5);
    setExactPerMonth(20);
  };

  const handleDeleteStaff = (index: number) => {
    setStaffList(prev => prev.filter((_, i) => i !== index));
  };

  const generateShiftTable = () => {
    checkSupplyDemand();
    const year = targetYear;
    const month = targetMonth;
    const daysInMonth = getDaysInMonth(year, month);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    const labels = Array.from({ length: daysInMonth }, (_, i) =>
      formatLabel(new Date(year, month, i + 1))
    );

    const assignments: Record<string, Record<number, Assignment>> = {};
    const weeklyCounts: Record<string, Record<number, number>> = {};
    const monthlyCounts: Record<string, number> = {};

    const remainingDemand: Record<number, { E: number; D: number; N: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const w = weekdays[new Date(year, month, d).getDay()];
      const demand = demandPerWeekday[w];
      remainingDemand[d] = { E: demand.E, D: demand.D, N: demand.N };
    }

    staffList.forEach(staff => {
      assignments[staff.name] = {};
      weeklyCounts[staff.name] = {};
      monthlyCounts[staff.name] = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        assignments[staff.name][d] = '';
      }
    });

    // Set requested day offs
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      staffList.forEach(s => {
        if (s.dayOffs.includes(dateStr)) {
          assignments[s.name][d] = 'OFF';
        }
      });
    }

    const assignShift = (d: number, shift: 'E' | 'D' | 'N'): boolean => {
      const date = new Date(year, month, d);
      const weekIndex = getWeekIndex(date);
      const dayName = weekdays[date.getDay()];

      const candidates = staffList.filter(s => {
        if (assignments[s.name][d] !== '') return false;
        if (!s.days.includes(dayName)) return false;

        const remaining = s.exactPerMonth - (monthlyCounts[s.name] || 0);
        if (remaining <= 0) return false;

        if (shift === 'E') {
          if (!s.shifts.includes('E')) return false;
          const prev = assignments[s.name][d - 1];
          if (prev === 'D' || prev === 'DL') return false;
        } else if (shift === 'D') {
          if (!s.shifts.includes('D') && !s.shifts.includes('DL'))
            return false;
        } else if (shift === 'N') {
          if (!s.shifts.includes('N')) return false;
          if (d === daysInMonth) return false;
          if (assignments[s.name][d + 1] !== '') return false;
          const nextDate = new Date(year, month, d + 1);
          const nextWeekIndex = getWeekIndex(nextDate);
          if ((weeklyCounts[s.name][nextWeekIndex] || 0) >= s.maxPerWeek)
            return false;
          if (remaining < 2) return false;
        }

        if ((weeklyCounts[s.name][weekIndex] || 0) >= s.maxPerWeek)
          return false;

        return true;
      });

      if (candidates.length === 0) return false;

      candidates.sort((a, b) => {
        const remA = a.exactPerMonth - (monthlyCounts[a.name] || 0);
        const remB = b.exactPerMonth - (monthlyCounts[b.name] || 0);
        if (remB !== remA) return remB - remA;
        const weekA =
          a.maxPerWeek - (weeklyCounts[a.name][weekIndex] || 0);
        const weekB =
          b.maxPerWeek - (weeklyCounts[b.name][weekIndex] || 0);
        if (weekB !== weekA) return weekB - weekA;
        return Math.random() - 0.5;
      });

      const chosen = candidates[0];
      let assignedShift: Assignment = shift;
      if (shift === 'D') {
        assignedShift = chosen.shifts.includes('D') ? 'D' : 'DL';
      }
      assignments[chosen.name][d] = assignedShift;
      weeklyCounts[chosen.name][weekIndex] =
        (weeklyCounts[chosen.name][weekIndex] || 0) + 1;
      monthlyCounts[chosen.name] = (monthlyCounts[chosen.name] || 0) + 1;

      if (shift === 'N') {
        const nextDate = new Date(year, month, d + 1);
        const nextWeekIndex = getWeekIndex(nextDate);
        assignments[chosen.name][d + 1] = 'AK';
        weeklyCounts[chosen.name][nextWeekIndex] =
          (weeklyCounts[chosen.name][nextWeekIndex] || 0) + 1;
        monthlyCounts[chosen.name] = (monthlyCounts[chosen.name] || 0) + 1;
      }

      if (remainingDemand[d][shift] > 0) {
        remainingDemand[d][shift]--;
      }

      return true;
    };

    // Pass1
    for (let d = 1; d <= daysInMonth; d++) {
      shiftOrder.forEach(shift => {
        while (remainingDemand[d][shift] > 0) {
          if (!assignShift(d, shift)) break;
        }
      });
    }

    // Pass2 assign extra if staff still have remaining days
    const staffHasRemaining = () =>
      staffList.some(s => s.exactPerMonth - (monthlyCounts[s.name] || 0) > 0);

    if (staffHasRemaining()) {
      for (let d = 1; d <= daysInMonth; d++) {
        shiftOrder.forEach(shift => {
          while (staffHasRemaining()) {
            if (!assignShift(d, shift)) break;
          }
        });
      }
    }

    staffList.forEach(s => {
      const remaining = s.exactPerMonth - (monthlyCounts[s.name] || 0);
      if (remaining > 0) {
        console.warn(`${s.name}：不足${remaining}日`);
      }
    });

    for (let d = 1; d <= daysInMonth; d++) {
      const label = formatLabel(new Date(year, month, d));
      shiftOrder.forEach(shift => {
        if (remainingDemand[d][shift] > 0) {
          console.warn(
            `${label}の${shift}シフトにあと${remainingDemand[d][shift]}人必要`
          );
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
      <div>
        <label>
          作成対象月：
          <select
            value={`${targetYear}-${targetMonth}`}
            onChange={e => {
              const [y, m] = e.target.value.split('-').map(Number);
              setTargetYear(y);
              setTargetMonth(m);
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date(
                nextMonthDate.getFullYear(),
                nextMonthDate.getMonth() + i,
                1
              );
              return (
                <option key={i} value={`${d.getFullYear()}-${d.getMonth()}`}>
                  {d.getFullYear()}年{d.getMonth() + 1}月
                </option>
              );
            })}
          </select>
        </label>
      </div>
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
              value={dayOffDates}
              onChange={setDayOffDates}
              format="YYYY-MM-DD"
              sort
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
          <label>
            勤務日数/月:
            <input
              type="number"
              min={1}
              value={exactPerMonth}
              required
              onChange={e => setExactPerMonth(Number(e.target.value))}
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
              {`${shift}（${
                shift === 'E'
                  ? '早番'
                  : shift === 'D'
                  ? '日勤'
                  : shift === 'DL'
                  ? '昼遅番'
                  : '夜勤'
              }）`}
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
            最大勤務回数/週: {staff.maxPerWeek}<br />
            勤務日数/月: {staff.exactPerMonth}<br />
            <button onClick={() => handleDeleteStaff(index)}>削除</button>
          </li>
        ))}
      </ul>
      <button onClick={handleExport}>シフト表CSV出力</button>
    </div>
  );
}

export default App;
