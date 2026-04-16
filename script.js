// script.js 맨 윗줄에 넣으세요
if (typeof initialData === 'undefined') {
    alert("위험! data.js를 찾지 못했습니다. 파일 이름이나 연결 순서를 확인하세요.");
} else {
    alert("성공! 데이터 " + initialData.length + "건을 읽어왔습니다.");
}
let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || initialData;
function renderTable() {
    const listBody = document.getElementById('trainee-list');
    if (!listBody) return;
    listBody.innerHTML = '';

    // 현재 시간(시) 확인
    const currentHour = new Date().getHours();

    attendanceData.forEach(item => {
        // [조건 설정] 
        // 오전 버튼 비활성화: 이미 기록됐거나, 현재 시간이 12시 이후일 때
        const amDisabled = item.오전개시 || currentHour >= 12; 
        const amEndDisabled = item.오전종료 || currentHour >= 12;

        // 오후 버튼 비활성화: 이미 기록됐거나, 현재 시간이 12시 이전일 때
        const pmDisabled = item.오후개시 || currentHour < 12;
        const pmEndDisabled = item.오후종료 || currentHour < 12;

        const row = `
            <tr>
                <td>${item.부서}<br><b>${item.이름}</b></td>
                <td>${item.과정명}</td>
                <td>${item.날짜}</td>
                <td>${item.교육시간}h</td>
                
                <td><button ${amDisabled ? 'disabled class="done"' : ''} onclick="recordTime('${item.사번}','오전개시')">${item.오전개시||'확인'}</button></td>
                <td><button ${amEndDisabled ? 'disabled class="done"' : ''} onclick="recordTime('${item.사번}','오전종료')">${item.오전종료||'확인'}</button></td>
                
                <td><button ${pmDisabled ? 'disabled class="done"' : ''} onclick="recordTime('${item.사번}','오후개시')">${item.오후개시||'확인'}</button></td>
                <td><button ${pmEndDisabled ? 'disabled class="done"' : ''} onclick="recordTime('${item.사번}','오후종료')">${item.오후종료||'확인'}</button></td>
                
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
renderTable();
