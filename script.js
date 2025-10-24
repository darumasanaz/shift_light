(function () {
  const staffForm = document.getElementById('staff-form');
  const staffNameInput = document.getElementById('staff-name');
  const staffList = document.getElementById('staff-list');
  const staffSelect = document.getElementById('dayoff-staff');
  const yearSelect = document.getElementById('target-year');
  const monthSelect = document.getElementById('target-month');
  const dayoffForm = document.getElementById('dayoff-form');
  const dayoffDateInput = document.getElementById('dayoff-date');
  const dayoffList = document.getElementById('dayoff-list');
  const generateBtn = document.getElementById('generate-btn');
  const resultHeaderRow = document.getElementById('result-header-row');

  const state = {
    staff: [],
    dayoffs: [],
  };

  const init = () => {
    populateYears();
    populateMonths();
    renderHeader();
  };

  const populateYears = () => {
    const currentYear = new Date().getFullYear();
    for (let i = -1; i <= 2; i += 1) {
      const year = currentYear + i;
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = `${year}年`;
      if (i === 0) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    }
  };

  const populateMonths = () => {
    for (let month = 1; month <= 12; month += 1) {
      const option = document.createElement('option');
      option.value = String(month).padStart(2, '0');
      option.textContent = `${month}月`;
      if (month === new Date().getMonth() + 1) {
        option.selected = true;
      }
      monthSelect.appendChild(option);
    }
  };

  const renderStaffList = () => {
    staffList.innerHTML = '';
    staffSelect.innerHTML =
      '<option value="" disabled selected>スタッフを選択してください</option>';

    state.staff.forEach(name => {
      const item = document.createElement('li');
      item.textContent = name;
      staffList.appendChild(item);

      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      staffSelect.appendChild(option);
    });
  };

  const renderDayoffList = () => {
    dayoffList.innerHTML = '';
    if (!state.dayoffs.length) {
      const item = document.createElement('li');
      item.textContent = '希望休は登録されていません';
      dayoffList.appendChild(item);
      return;
    }

    state.dayoffs.forEach(entry => {
      const item = document.createElement('li');
      item.innerHTML = `<strong>${entry.staff}</strong> — ${entry.date}`;
      dayoffList.appendChild(item);
    });
  };

  const renderHeader = () => {
    resultHeaderRow.innerHTML = '';
    const selectedYear = Number(yearSelect.value || new Date().getFullYear());
    const selectedMonth = Number(monthSelect.value || new Date().getMonth() + 1);
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    const blankTh = document.createElement('th');
    blankTh.scope = 'col';
    blankTh.textContent = 'スタッフ名';
    resultHeaderRow.appendChild(blankTh);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = `${selectedMonth}/${day}`;
      resultHeaderRow.appendChild(th);
    }
  };

  staffForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = staffNameInput.value.trim();
    if (!name) return;
    if (state.staff.includes(name)) {
      alert('このスタッフは既に登録されています。');
      return;
    }
    state.staff.push(name);
    staffNameInput.value = '';
    renderStaffList();
  });

  dayoffForm.addEventListener('submit', event => {
    event.preventDefault();
    const staff = staffSelect.value;
    const date = dayoffDateInput.value;
    if (!staff || !date) {
      alert('スタッフと日付を入力してください。');
      return;
    }
    state.dayoffs.push({ staff, date });
    dayoffDateInput.value = '';
    renderDayoffList();
  });

  yearSelect.addEventListener('change', renderHeader);
  monthSelect.addEventListener('change', renderHeader);

  generateBtn.addEventListener('click', () => {
    const year = yearSelect.value;
    const month = monthSelect.value;
    const message = `シフトを作成します\n対象年月: ${year}年${month}月\nスタッフ数: ${state.staff.length}`;
    alert(message);
  });

  init();
  renderStaffList();
  renderDayoffList();
})();
