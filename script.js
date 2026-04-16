console.log("불러온 데이터:", initialData); // 데이터 자체가 잘 왔는지 확인
console.log("현재 로컬스토리지:", localStorage.getItem('attendanceData')); // 저장된 게 있는지 확인


// 1. 데이터 불러오기
let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || initialData;

// 시간을 분 단위로 변환하는 헬퍼 함수
function timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

// 2. 시간 기록 함수 (제한 사항 적용)
function recordTime(id, type) {
    const now = new Date();
    const currentTimeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let targetItem = attendanceData.find(item => item.사번 === id);

    // [제한 1] 이미 기록된 경우 클릭 불가
    if (targetItem[type]) {
        alert("이미 기록되었습니다. 수정을 원하시면 '수정' 버튼을 이용하세요.");
        return;
    }

    // [제한 2] 종료 버튼 클릭 시 1시간 경과 여부 확인
    if (type === '오전종료' || type === '오후종료') {
        const startType = type === '오전종료' ? '오전개시' : '오후개시';
        const startTimeStr = targetItem[startType];
        
        if (!startTimeStr) {
            alert("개시 시간을 먼저 기록해야 합니다.");
            return;
        }

        const startMinutes = timeToMinutes(startTimeStr);
        if (currentMinutes - startMinutes < 60) {
            alert("개시 후 최소 1시간이 지나야 종료 확인이 가능합니다.");
            return;
        }
    }

    // 데이터 저장
    targetItem[type] = currentTimeStr;
    saveAndReload();
}

// 3. 수정 버튼 로직 (비밀번호 확인)
function unlockAndEdit(id) {
    const password = prompt("관리자 비밀번호를 입력하세요.");
    
    if (password === "6939") {
        attendanceData = attendanceData.map(item => {
            if (item.사번 === id) {
                // 해당 행의 모든 기록을 초기화하거나 선택적으로 지울 수 있습니다.
                // 여기서는 안전하게 해당 행의 시간 기록만 초기화합니다.
                item.오전개시 = "";
                item.오전종료 = "";
                item.오후개시 = "";
                item.오후종료 = "";
                alert("기록이 초기화되었습니다. 다시 확인해 주세요.");
            }
            return item;
        });
        saveAndReload();
    } else {
        alert("비밀번호가 일치하지 않습니다.");
    }
}

// 공통 저장 및 새로고침 함수
function saveAndReload() {
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    renderTable(); // 화면만 다시 그리기 (새로고침보다 부드러움)
}

// 4. 테이블 렌더링 (수정 버튼 추가)
function renderTable() {
    const listBody = document.getElementById('trainee-list');
    listBody.innerHTML = ''; 

    attendanceData.forEach(item => {
        const row = `
            <tr>
                <td>${item.부서}<br><b>${item.이름}</b>(${item.사번})</td>
                <td>${item.과정명}</td>
                <td>${item.날짜}</td>
                <td>${item.교육시간}h</td>
                <td><button ${item.오전개시 ? 'disabled class="done"' : ''} onclick="recordTime('${item.사번}', '오전개시')">${item.오전개시 || '확인'}</button></td>
                <td><button ${item.오전종료 ? 'disabled class="done"' : ''} onclick="recordTime('${item.사번}', '오전종료')">${item.오전종료 || '확인'}</button></td>
                <td><button ${item.오후개시 ? 'disabled class="done"' : ''} onclick="recordTime('${item.사번}', '오후개시')">${item.오후개시 || '확인'}</button></td>
                <td><button ${item.오후종료 ? 'disabled class="done"' : ''} onclick="recordTime('${item.사번}', '오후종료')">${item.오후종료 || '확인'}</button></td>
                <td>...간식 선택 영역...</td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <input type="text" value="${item.비고 || ''}" onchange="updateInfo('${item.사번}', '비고', this.value)" style="width:60%;">
                        <button onclick="unlockAndEdit('${item.사번}')" style="width:35%; background-color:#ffc107;">수정</button>
                    </div>
                </td>
            </tr>
        `;
        listBody.innerHTML += row;
    });
}
window.onload = renderTable;
