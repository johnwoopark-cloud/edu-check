// 1. 데이터 초기화 (로컬스토리지 확인 후 없으면 data.js의 initialData 사용)
let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || (typeof initialData !== 'undefined' ? initialData : []);

// 시간을 분 단위로 변환하는 함수
function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

// 2. 시간 기록 함수 (1시간 제한 및 중복 클릭 방지)
function recordTime(id, type) {
    const now = new Date();
    const currentTimeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let targetItem = attendanceData.find(item => item.사번 === id);

    if (targetItem[type]) {
        alert("이미 기록되었습니다.");
        return;
    }

    // 종료 버튼 클릭 시 1시간 경과 체크
    if (type === '오전종료' || type === '오후종료') {
        const startType = type === '오전종료' ? '오전개시' : '오후개시';
        const startTimeStr = targetItem[startType];
        if (!startTimeStr) { alert("개시 시간을 먼저 기록해야 합니다."); return; }

        if (currentMinutes - timeToMinutes(startTimeStr) < 60) {
            alert("개시 후 최소 1시간이 지나야 종료 확인이 가능합니다.");
            return;
        }
    }

    targetItem[type] = currentTimeStr;
    saveData();
}

// 3. 비고 내용 저장 함수
function saveRemarks(id) {
    const inputVal = document.getElementById(`remarks-${id}`).value;
    attendanceData = attendanceData.map(item => {
        if (item.사번 === id) item.비고 = inputVal;
        return item;
    });
    saveData();
    alert("비고가 저장되었습니다.");
}

// 4. 관리자 수정 함수 (비밀번호 6939)
function unlockAndEdit(id) {
    if (prompt("관리자 비밀번호를 입력하세요.") === "6939") {
        attendanceData = attendanceData.map(item => {
            if (item.사번 === id) {
                item.오전개시 = ""; item.오전종료 = "";
                item.오후개시 = ""; item.오후종료 = "";
            }
            return item;
        });
        saveData();
        alert("기록이 초기화되었습니다.");
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
}

// 5. 엑셀 다운로드 함수 (실제 이수시간 자동 계산)
function exportToExcel() {
    const processed = attendanceData.map(item => {
        let tMin = 0;
        const amS = timeToMinutes(item.오전개시), amE = timeToMinutes(item.오전종료);
        const pmS = timeToMinutes(item.오후개시), pmE = timeToMinutes(item.오후종료);
        if(amS && amE) tMin += (amE - amS);
        if(pmS && pmE) tMin += (pmE - pmS);
        const actual = (tMin / 60).toFixed(1);
        return { ...item, "실제이수시간": actual, "상태": (actual >= item.교육시간) ? "이수" : "조퇴/미이수" };
    });
    const ws = XLSX.utils.json_to_sheet(processed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "출석부");
    XLSX.writeFile(wb, "교육결과_리포트.xlsx");
}

// 데이터 저장 및 화면 갱신
function saveData() {
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    renderTable();
}

// 6. 테이블 화면 그리기
function renderTable() {
    const listBody = document.getElementById('trainee-list');
    if (!listBody) return;
    listBody.innerHTML = '';
    attendanceData.forEach(item => {
        const row = `
            <tr>
                <td>${item.부서}<br><b>${item.이름}</b></td>
                <td>${item.과정명}</td>
                <td>${item.날짜}</td>
                <td>${item.교육시간}h</td>
                <td><button ${item.오전개시?'disabled class="done"':''} onclick="recordTime('${item.사번}','오전개시')">${item.오전개시||'확인'}</button></td>
                <td><button ${item.오전종료?'disabled class="done"':''} onclick="recordTime('${item.사번}','오전종료')">${item.오전종료||'확인'}</button></td>
                <td><button ${item.오후개시?'disabled class="done"':''} onclick="recordTime('${item.사번}','오후개시')">${item.오후개시||'확인'}</button></td>
                <td><button ${item.오후종료?'disabled class="done"':''} onclick="recordTime('${item.사번}','오후종료')">${item.오후종료||'확인'}</button></td>
                <td>
                    <div class="remarks-container">
                        <input type="text" id="remarks-${item.사번}" value="${item.비고||''}">
                        <button onclick="saveRemarks('${item.사번}')">저장</button>
                    </div>
                </td>
                <td><button class="btn-edit" onclick="unlockAndEdit('${item.사번}')">출결 수정</button></td>
            </tr>`;
        listBody.innerHTML += row;
    });
}
window.onload = renderTable;
