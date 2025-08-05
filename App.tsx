import React, { useState } from 'react';

type Staff = {
  name: string;
  dayOff: string;
  days: string[];
  shifts: string[];
};

const daysOfWeek = ['月', '火', '水', '木', '金', '土', '日'];
const shifts = ['早番', '遅番', '夜勤'];

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
    </div>
  );
}

export default App;
