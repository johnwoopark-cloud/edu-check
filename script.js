// 시간 차이를 계산하여 이수 시간(시간 단위)으로 반환하는 함수
function calculateActualHours(amStart, amEnd, pmStart, pmEnd) {
    let totalMinutes = 0;

    const parseTime = (timeStr) => {
        if (!timeStr) return null;
        const [hh, mm] = timeStr.split(':').map(Number);
        return hh * 60 + mm;
    };

    const amS = parseTime(amStart);
    const amE = parseTime(amEnd);
    const pmS = parseTime(pmStart);
    const pmE = parseTime(pmEnd);

    if (amS && amE) totalMinutes += (amE - amS);
    if (pmS && pmE) totalMinutes += (pmE - pmS);

    return (totalMinutes / 60).toFixed(1); // 소수점 첫째자리까지
}

// 엑셀 내보내기 함수
function exportToExcel() {
    const data = JSON.parse(localStorage.getItem('attendanceData')) || [];
    
    // 이수 시간 컬럼 추가 가공
    const processedData = data.map(item => ({
        ...item,
        "실제이수시간": calculateActualHours(item.오전개시, item.오전종료, item.오후개시, item.오후종료),
        "상태": (calculateActualHours(item.오전개시, item.오전종료, item.오후개시, item.오후종료) >= item.교육시간) ? "이수" : "조퇴/미이수"
    }));

    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "출석결과");
    
    XLSX.writeFile(workbook, `교육결과_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// 버튼 클릭 시 현재 시간 기록 함수
function recordTime(id, type) {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // 1. LocalStorage에서 데이터 가져오기
    // 2. 해당 ID의 타입(오전개시 등)에 시간 기록
    // 3. 다시 LocalStorage에 저장 후 화면 갱신
}