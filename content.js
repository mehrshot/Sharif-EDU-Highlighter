function clearHighlights() {
  document.querySelectorAll('td').forEach(td => {
    td.style.backgroundColor = '';
    td.style.borderTop = '';
    td.style.borderBottom = '';
    td.style.fontWeight = '';
    td.style.color = '';
    td.style.border = '';
    td.style.borderRadius = '';
  });
  
  document.querySelectorAll('.conflict-marker').forEach(el => el.remove());
  
  const summary = document.getElementById('sharif-course-summary');
  if (summary) summary.remove();
}

function runHighlighter() {
  const isTargetPage = Array.from(document.querySelectorAll('td.header')).some(td => 
    td.textContent.includes('لیست دروس ارایه شده توسط')
  );

  if (!isTargetPage) return;

  clearHighlights();

  chrome.storage.sync.get(['courses', 'professors', 'enableHighlights', 'enableWidget'], (data) => {
    const enableHighlights = data.enableHighlights !== false;
    const enableWidget = data.enableWidget !== false;
    
    if (!enableHighlights) return;

    const rows = Array.from(document.querySelectorAll('tr'));
    const targetCourses = data.courses || [];
    const targetProfessors = data.professors || [];
    let totalUnits = 0;
    const countedCourses = new Set();

    if (targetCourses.length > 0) {
      const yellowShades = [
        { bg: '#ffffe6', border: '#ffe680' },
        { bg: '#ffffb3', border: '#ffdb4d' },
        { bg: '#ffff99', border: '#ffcc00' },
        { bg: '#ffeb99', border: '#ffb300' },
        { bg: '#ffd699', border: '#ff9900' }
      ];

      const examData = [];

      rows.forEach(row => {
        const cells = row.querySelectorAll('td.contentCell');
        
        if (cells.length > 0) {
          const courseCodeCell = cells[0];
          const courseCode = courseCodeCell.textContent.replace(/\s+/g, '').trim();
          const courseIndex = targetCourses.indexOf(courseCode);
          
          if (courseIndex !== -1) {
            const theme = yellowShades[courseIndex % yellowShades.length];
            
            cells.forEach(td => {
              td.style.backgroundColor = theme.bg;
              td.style.borderTop = `2px solid ${theme.border}`;
              td.style.borderBottom = `2px solid ${theme.border}`;
            });

            if (!countedCourses.has(courseCode) && cells.length >= 3) {
              const unitText = cells[2].textContent.replace(/\s+/g, '').trim();
              const unit = parseInt(unitText, 10);
              if (!isNaN(unit)) {
                totalUnits += unit;
                countedCourses.add(courseCode);
              }
            }

            if (cells.length >= 9) {
              const examDateCell = cells[8];
              const examText = examDateCell.textContent.trim();
              const dateMatch = examText.match(/\d{4}\/\d{2}\/\d{2}/); 
              
              if (dateMatch) {
                examData.push({ 
                    course: courseCode, 
                    date: dateMatch[0], 
                    cell: examDateCell, 
                    fullText: examText 
                });
              }
            }
          }
        }
      });

      const conflictsByDate = {};
      examData.forEach(item => {
          if (!conflictsByDate[item.date]) {
              conflictsByDate[item.date] = [];
          }
          conflictsByDate[item.date].push(item);
      });

      const conflictStyles = [
          { icon: '🔴', bg: '#ffebee', color: '#c62828' },
          { icon: '🟣', bg: '#f3e5f5', color: '#6a1b9a' },
          { icon: '🔵', bg: '#e3f2fd', color: '#1565c0' },
          { icon: '🟤', bg: '#efebe9', color: '#4e342e' }
      ];
      let conflictGroupIndex = 0;

      for (const date in conflictsByDate) {
          const conflictingCourses = conflictsByDate[date];
          const uniqueCourses = new Set(conflictingCourses.map(item => item.course));
          
          if (uniqueCourses.size > 1) {
              const style = conflictStyles[conflictGroupIndex % conflictStyles.length];
              
              conflictingCourses.forEach(item => {
                  const isExactTimeConflict = conflictingCourses.some(otherItem => 
                      otherItem.course !== item.course && otherItem.fullText === item.fullText
                  );

                  const cell = item.cell;
                  cell.style.position = 'relative';
                  
                  const marker = document.createElement('span');
                  marker.className = 'conflict-marker';
                  marker.innerHTML = `${style.icon} ${isExactTimeConflict ? '⚠️ تداخل ساعت' : 'تداخل روز'}`;
                  marker.style.display = 'block';
                  marker.style.fontSize = '11px';
                  marker.style.fontWeight = 'bold';
                  marker.style.color = style.color;
                  marker.style.backgroundColor = style.bg;
                  marker.style.padding = '2px 4px';
                  marker.style.borderRadius = '4px';
                  marker.style.marginTop = '4px';
                  marker.style.textAlign = 'center';
                  marker.style.border = `1px solid ${style.color}`;
                  
                  cell.appendChild(marker);
              });
              
              conflictGroupIndex++;
          }
      }

      if (enableWidget) {
        function toPersianDigits(num) {
            const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
            return num.toString().replace(/\d/g, x => persianDigits[x]);
        }

        let summaryDiv = document.createElement('div');
        summaryDiv.id = 'sharif-course-summary';
        summaryDiv.style.position = 'fixed';
        summaryDiv.style.bottom = '20px';
        summaryDiv.style.left = '20px';
        summaryDiv.style.backgroundColor = '#efeee9';
        summaryDiv.style.padding = '16px 24px';
        summaryDiv.style.borderRadius = '8px';
        summaryDiv.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)';
        summaryDiv.style.border = '1px solid #a3a19c';
        summaryDiv.style.zIndex = '9999';
        summaryDiv.style.direction = 'rtl';
        summaryDiv.style.fontFamily = '"Vazirmatn", "IRANSans", "B Yekan", "Yekan", Tahoma, sans-serif';
        summaryDiv.style.color = '#333';
        summaryDiv.style.display = 'flex';
        summaryDiv.style.flexDirection = 'column';
        summaryDiv.style.gap = '14px';
        summaryDiv.style.overflow = 'hidden';
        document.body.appendChild(summaryDiv);
        
        summaryDiv.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(to left, #2563eb, #38bdf8);"></div>
            <div style="font-size: 15px; font-weight: bold; color: #444; display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 2px;">
                <span>مجموع واحدهای هدف:</span>
                <span style="color: #2563eb; font-size: 24px; font-weight: 900; line-height: 1; text-shadow: 0px 1px 1px rgba(0,0,0,0.15);">${toPersianDigits(totalUnits)}</span>
            </div>
            <div style="font-size: 14px; font-weight: bold; color: #666; display: flex; align-items: center; justify-content: space-between; gap: 20px;">
                <span>دروس پیدا شده:</span>
                <span style="color: #64748b; font-size: 19px; font-weight: 800; line-height: 1; text-shadow: 0px 1px 1px rgba(255,255,255,0.6);">${toPersianDigits(countedCourses.size)}</span>
            </div>
        `;
      }
    }

    if (targetProfessors.length > 0) {
      rows.forEach(row => {
        const cells = row.querySelectorAll('td.contentCell');
        cells.forEach(cell => {
          const cellText = cell.textContent.trim();
          targetProfessors.forEach(prof => {
            if (cellText.includes(prof)) {
              cell.style.fontWeight = 'bold';
              cell.style.color = '#d32f2f';
              cell.style.backgroundColor = '#ffcdd2';
              cell.style.border = '2px solid #ef5350';
              cell.style.borderRadius = '4px';
            }
          });
        });
      });
    }
  });
}

runHighlighter();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateHighlights") {
    runHighlighter();
    sendResponse({status: "done"});
  }
});