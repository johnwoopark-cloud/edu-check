// 1. 데이터 로드 (LocalStorage에 저장된 게 있으면 그것부터, 없으면 엑셀에서 온 데이터)
let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || initialData;

// 2. 표 그리기 함수
function renderTable() {
    const listBody = document.getElementById('traineeList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    listBody.innerHTML = ''; // 기존 내용 지우기

    attendanceData.forEach(item => {
        // 검색 필터링
        if (item.이름.includes(searchTerm) || item.사번.includes(searchTerm)) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.부서}<br><b>${item.이름}</b>(${item.사번})</td>
                <td>${item.오전개시 ? item.오전개시 : `<button class="btn btn-start" onclick="recordTime('${item.사번}', '오전개시')">출근</button>`}</td>
                <td>${item.오전종료 ? item.오전종료 : `<button class="btn btn-end" onclick="recordTime('${item.사번}', '오전종료')">퇴근</button>`}</td>
                <td>${item.오후개시 ? item.오후개시 : `<button class="btn btn-start" onclick="recordTime('${item.사번}', '오후개시')">출근</button>`}</td>
                <td>${item.오후종료 ? item.오후종료 : `<button class="btn btn-end" onclick="recordTime('${item.사번}', '오후종료')">퇴근</button>`}</td>
                <td>
                    <select onchange="updateNote('${item.사번}', this.value)">
                        <option value="">간식 선택</option>
                        <option value="아아" ${item.간식 === '아아' ? 'selected' : ''}>아아</option>
                        <option value="라떼" ${item.간식 === '라떼' ? 'selected' : ''}>라떼</option>
                    </select>
                    <input type="text" placeholder="사유 입력" value="${item.비고 || ''}" onchange="updateMemo('${item.사번}', this.value)">
                </td>
            `;
            listBody.appendChild(tr);
        }
    });
    updateStats();
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
