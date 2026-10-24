// Submit Admission Inquiry
document.getElementById('inquiryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        studentName: document.getElementById('inqStudent').value,
        parentName: document.getElementById('inqParent').value,
        phone: document.getElementById('inqPhone').value,
        targetClass: document.getElementById('inqClass').value
    };

    const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
        alert('Inquiry Submitted Successfully!');
        e.target.reset();
    }
});

// Result Search Functionality
document.getElementById('resultSearchForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const className = document.getElementById('searchClass').value;
    const rollNo = document.getElementById('searchRoll').value;

    const res = await fetch(`/api/results/search?className=${encodeURIComponent(className)}&rollNo=${encodeURIComponent(rollNo)}`);
    const data = await res.json();

    const display = document.getElementById('resultDisplay');
    if (!data.success) {
        display.style.display = 'block';
        display.innerHTML = `<div style="color:red; text-align:center;">❌ ${data.message}</div>`;
        return;
    }

    const r = data.result;
    display.style.display = 'block';
    display.innerHTML = `
    <div class="marksheet">
      <h3 style="text-align:center; color:var(--primary);">S. D. PUBLIC SCHOOL</h3>
      <p style="text-align:center;">Report Card - Session ${r.session}</p>
      <hr style="margin:15px 0;">
      <p><strong>Name:</strong> ${r.studentName} \vert{} <strong>Roll No:</strong>${r.rollNo}</p>
      <p><strong>Class:</strong> ${r.className} | <strong>Status:</strong> <span style="color:${r.status === 'PASS' ? 'green' : 'red'}">${r.status}</span></p>
      
      <table>
        <thead>
          <tr><th>Subject</th><th>Total Marks</th><th>Obtained</th></tr>
        </thead>
        <tbody>
          ${r.subjects.map(s => `<tr><td>${s.name}</td><td>${s.total}</td><td>${s.obtained}</td></tr>`).join('')}
        </tbody>
      </table>
      
      <p><strong>Total Obtained:</strong> ${r.totalMarks}</p>
      <p><strong>Percentage:</strong> ${r.percentage}\% \vert{} <strong>Grade:</strong>${r.grade}</p>
      <button class="btn" style="margin-top:15px;" onclick="window.print()">Print Marksheet</button>
    </div>
  `;
});