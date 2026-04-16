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

// 출결 수정 버튼 클릭 → 모달 열기
function unlockAndEdit(사번) {
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

// 엑셀 다운로드
function exportToExcel() {
    const exportData = attendanceData.map(item => ({
        '부서': item.부서,
        '사번': item.사번,
        '이름': item.이름,
        '과정명': item.과정명,
        '날짜': item.날짜,
        '교육시간': item.교육시간,
        '오전개시': item.오전개시 || '',
        '오전종료': item.오전종료 || '',
        '오후개시': item.오후개시 || '',
        '오후종료': item.오후종료 || '',
        '비고/사유': item['비고/사유'] || ''
    }));

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
