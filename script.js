// 1. 데이터 로드 (LocalStorage에 저장된 게 있으면 그것부터, 없으면 엑셀에서 온 데이터)
let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || initialData;

// 2. 표 그리기 함수
function renderTable() {
    const listBody = document.getElementById('trainee-list');
    listBody.innerHTML = ''; 

    const currentData = JSON.parse(localStorage.getItem('attendanceData')) || initialData;

    currentData.forEach(item => {
        const row = `
            <tr>
                <td style="font-size: 0.9em;">${item.부서}<br><b>${item.이름}</b>(${item.사번})</td>
                <td style="font-size: 0.8em;">${item.과정명}</td>
                <td style="font-size: 0.8em;">${item.날짜}</td>
                <td>${item.교육시간}h</td>
                <td><button onclick="recordTime('${item.사번}', '오전개시')">${item.오전개시 || '출석'}</button></td>
                <td><button onclick="recordTime('${item.사번}', '오전종료')">${item.오전종료 || '종료'}</button></td>
                <td><button onclick="recordTime('${item.사번}', '오후개시')">${item.오후개시 || '출석'}</button></td>
                <td><button onclick="recordTime('${item.사번}', '오후종료')">${item.오후종료 || '종료'}</button></td>
                <td><input type="text" class="input-cell" value="${item.간식 || ''}" onchange="updateInfo('${item.사번}', '간식', this.value)"></td>
                <td><input type="text" class="input-cell" value="${item.비고 || ''}" onchange="updateInfo('${item.사번}', '비고', this.value)"></td>
            </tr>
        `;
        listBody.innerHTML += row;
    });
}
// 3. 시간 기록 함수
function recordTime(id, type) {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    attendanceData = attendanceData.map(item => {
        if (item.사번 === id) item[type] = timeStr;
        return item;
    });

    saveAndRefresh();
}

// 4. 간식 및 비고 업데이트
function updateNote(id, val) {
    attendanceData = attendanceData.map(item => { if (item.사번 === id) item.간식 = val; return item; });
    saveAndRefresh();
}

function updateMemo(id, val) {
    attendanceData = attendanceData.map(item => { if (item.사번 === id) item.비고 = val; return item; });
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
}

// 5. 통계 및 저장
function saveAndRefresh() {
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    renderTable();
}

function updateStats() {
    const total = attendanceData.length;
    const attended = attendanceData.filter(item => item.오전개시).length;
    document.getElementById('attendance-rate').innerText = Math.round((attended/total)*100) + "%";
    document.getElementById('ice-ame').innerText = attendanceData.filter(item => item.간식 === '아아').length;
    document.getElementById('latte').innerText = attendanceData.filter(item => item.간식 === '라떼').length;
}

// 6. 엑셀 다운로드 (실제이수시간 계산 포함)
function exportToExcel() {
    const processed = attendanceData.map(item => {
        const parse = (t) => { if(!t) return 0; const [h,m] = t.split(':').map(Number); return h*60+m; };
        const time = ((parse(item.오전종료)-parse(item.오전개시)) + (parse(item.오후종료)-parse(item.오후개시))) / 60;
        return { ...item, "실제이수시간": time.toFixed(1) };
    });
    const ws = XLSX.utils.json_to_sheet(processed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "출석부");
    XLSX.writeFile(wb, "교육결과_리포트.xlsx");
}

// 첫 실행
renderTable();
