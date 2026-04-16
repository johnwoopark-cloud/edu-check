if (typeof initialData === 'undefined') {
    alert("위험! data.js를 찾지 못했습니다. 파일 이름이나 연결 순서를 확인하세요.");
} else {
    console.log("성공! 데이터 " + initialData.length + "건을 읽어왔습니다.");
}

let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || initialData;

// 데이터 저장
function saveData() {
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
}

// 출석률 업데이트
function updateAttendanceRate() {
    const total = attendanceData.length;
    if (total === 0) return;
    const checked = attendanceData.filter(item => item.오전개시 || item.오후개시).length;
    const rate = Math.round((checked / total) * 100);
    const el = document.getElementById('attendance-rate');
    if (el) el.textContent = rate + '%';
}

// 시간 기록 함수
function recordTime(사번, 구분) {
    const item = attendanceData.find(d => d.사번 === 사번);
    if (!item) return;

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    item[구분] = timeStr;

    saveData();
    renderTable();
}

// 비고 저장
function saveRemarks(사번) {
    const item = attendanceData.find(d => d.사번 === 사번);
    if (!item) return;

    const input = document.getElementById('remarks-' + 사번);
    if (!input) return;

    item['비고/사유'] = input.value;
    saveData();
    alert('비고가 저장되었습니다.');
}

// ─── 모달 관련 ───────────────────────────────────────────────
let _editTarget사번 = null;

// [수정] 출결 수정 버튼 클릭 → 비밀번호 확인 후 모달 열기
function unlockAndEdit(사번) {
    // 비밀번호 체크
    const password = prompt("수정 권한 확인을 위해 비밀번호를 입력하세요.");
    
    if (password !== "6939") {
        alert("비밀번호가 틀렸습니다. 관리자에게 문의하세요.");
        return;
    }

    const item = attendanceData.find(d => d.사번 === 사번);
    if (!item) return;

    _editTarget사번 = 사번;

    document.getElementById('modal-name').textContent = `[${item.이름}] 출결 수정`;
    document.getElementById('modal-field').value = '오전개시';

    updateModalTimeInput();
    document.getElementById('edit-modal').style.display = 'flex';
}

// 드롭다운 변경 시 → 기존 기록값을 time input에 반영
function updateModalTimeInput() {
    const item = attendanceData.find(d => d.사번 === _editTarget사번);
    if (!item) return;

    const field = document.getElementById('modal-field').value;
    document.getElementById('modal-time').value = item[field] || '';
}

// 모달 저장
function saveEditModal() {
    const item = attendanceData.find(d => d.사번 === _editTarget사번);
    if (!item) return;

    const field = document.getElementById('modal-field').value;
    const newTime = document.getElementById('modal-time').value.trim();

    item[field] = newTime;
    saveData();
    renderTable();
    closeEditModal();
}

// 모달 닫기
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    _editTarget사번 = null;
}
// ─────────────────────────────────────────────────────────────

// [수정/추가] 시간 차이 계산 함수 (HH:mm 형식 계산)
function getDiffMinutes(start, end) {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    
    const startTotal = sH * 60 + sM;
    const endTotal = eH * 60 + eM;
    
    return endTotal > startTotal ? endTotal - startTotal : 0;
}

// [수정] 엑셀 다운로드 (수강 시간 합계 계산 포함)
function exportToExcel() {
    const exportData = attendanceData.map(item => {
        // 오전/오후 수강 시간(분 단위) 계산
        const amMin = getDiffMinutes(item.오전개시, item.오전종료);
        const pmMin = getDiffMinutes(item.오후개시, item.오후종료);
        
        // 합산하여 시간 단위(h)로 변환 (예: 1시간 30분 -> 1.5)
        const totalHours = ((amMin + pmMin) / 60).toFixed(1);

        return {
            '부서': item.부서,
            '사번': item.사번,
            '이름': item.이름,
            '과정명': item.과정명,
            '날짜': item.날짜,
            '배정 교육시간': item.교육시간, // 기존 교육시간 컬럼명 변경 (구분용)
            '오전개시': item.오전개시 || '',
            '오전종료': item.오전종료 || '',
            '오후개시': item.오후개시 || '',
            '오후종료': item.오후종료 || '',
            '비고/사유': item['비고/사유'] || '',
            '실제 수강시간(합계)': totalHours + 'h' // 계산된 시간 추가
        };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '출석부');

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `출석부_${today}.xlsx`);
}

// 테이블 렌더링
function renderTable() {
    const listBody = document.getElementById('trainee-list');
    if (!listBody) return;
    listBody.innerHTML = '';

    const searchValue = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const currentHour = new Date().getHours();

    const filtered = attendanceData.filter(item =>
        item.이름?.includes(searchValue) ||
        item.사번?.includes(searchValue) ||
        item.과정명?.includes(searchValue)
    );

    filtered.forEach(item => {
        const amDisabled    = item.오전개시 || currentHour >= 12;
        const amEndDisabled = item.오전종료 || currentHour >= 12;
        const pmDisabled    = item.오후개시 || currentHour < 12;
        const pmEndDisabled = item.오후종료 || currentHour < 12;

        const row = `
            <tr>
                <td>${item.부서}<br><b>${item.이름}</b><br><small>${item.사번}</small></td>
                <td>${item.과정명}</td>
                <td>${item.날짜}</td>
                <td>${item.교육시간}h</td>

                <td><button ${amDisabled    ? 'disabled class="done"' : 'class="btn btn-start"'} onclick="recordTime('${item.사번}','오전개시')">${item.오전개시 || '확인'}</button></td>
                <td><button ${amEndDisabled ? 'disabled class="done"' : 'class="btn btn-end"'}   onclick="recordTime('${item.사번}','오전종료')">${item.오전종료 || '확인'}</button></td>

                <td><button ${pmDisabled    ? 'disabled class="done"' : 'class="btn btn-start"'} onclick="recordTime('${item.사번}','오후개시')">${item.오후개시 || '확인'}</button></td>
                <td><button ${pmEndDisabled ? 'disabled class="done"' : 'class="btn btn-end"'}   onclick="recordTime('${item.사번}','오후종료')">${item.오후종료 || '확인'}</button></td>

                <td>
                    <div class="remarks-container">
                        <input type="text" id="remarks-${item.사번}" value="${item['비고/사유'] || ''}">
                        <button onclick="saveRemarks('${item.사번}')">저장</button>
                    </div>
                </td>
                <td><button class="btn-edit" onclick="unlockAndEdit('${item.사번}')">출결 수정</button></td>
            </tr>`;
        listBody.innerHTML += row;
    });

    updateAttendanceRate();
}

// 초기 렌더링
renderTable();
