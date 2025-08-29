// backend/src/modules/reports/services/pdfService.js
const fs = require('fs');
const path = require('path');

class PDFService {
  static async generateStudentReportPDF(data, template) {
    // Using simple HTML-based approach for now
    // In production, you'd use puppeteer or pdfkit for more sophisticated PDFs
    
    const html = this.generateStudentReportHTML(data, template);
    const fileName = `student_report_${data.student.id}_${Date.now()}.html`;
    const filePath = path.join('reports', fileName);
    
    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(filePath, html);
    return filePath;
  }

  static generateStudentReportHTML(data, template) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Student Report Card</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; color: #f97316; }
        .report-title { font-size: 18px; margin: 10px 0; }
        .student-info { margin: 20px 0; }
        .results-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .results-table th, .results-table td { 
            border: 1px solid #ddd; padding: 8px; text-align: center; 
        }
        .results-table th { background-color: #f97316; color: white; }
        .summary { margin: 20px 0; padding: 15px; background-color: #f5f5f5; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 200px; border-top: 1px solid #000; text-align: center; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="school-name">${data.school.name}</div>
        <div class="report-title">STUDENT REPORT CARD</div>
        <div>${data.term.name} - ${data.term.academic_year_name}</div>
    </div>

    <div class="student-info">
        <h3>Student Information</h3>
        <p><strong>Name:</strong> ${data.student.first_name} ${data.student.last_name}</p>
        <p><strong>Class:</strong> ${data.student.class_name}</p>
        <p><strong>Admission Number:</strong> ${data.student.admission_number}</p>
    </div>

    <table class="results-table">
        <thead>
            <tr>
                <th>Subject</th>
                <th>CA1</th>
                <th>CA2</th>
                <th>CA3</th>
                <th>CA4</th>
                <th>Exam</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Position</th>
                <th>Remark</th>
            </tr>
        </thead>
        <tbody>
            ${data.results.map(result => `
                <tr>
                    <td>${result.subject_name}</td>
                    <td>${result.ca1_score || '-'}</td>
                    <td>${result.ca2_score || '-'}</td>
                    <td>${result.ca3_score || '-'}</td>
                    <td>${result.ca4_score || '-'}</td>
                    <td>${result.exam_score || '-'}</td>
                    <td>${result.total_score}</td>
                    <td>${result.letter_grade}</td>
                    <td>${result.class_position || '-'}</td>
                    <td>${result.remark}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="summary">
        <h3>Performance Summary</h3>
        <p><strong>Total Subjects:</strong> ${data.summary.totalSubjects}</p>
        <p><strong>Average Score:</strong> ${data.summary.averageScore}%</p>
        <p><strong>Overall Grade:</strong> ${data.summary.overallGrade}</p>
        <p><strong>Class Position:</strong> ${data.summary.classPosition || 'N/A'}</p>
    </div>

    <div class="attendance">
        <h3>Attendance Record</h3>
        <p><strong>Total School Days:</strong> ${data.attendance.total_school_days}</p>
        <p><strong>Days Present:</strong> ${data.attendance.days_present}</p>
        <p><strong>Days Absent:</strong> ${data.attendance.days_absent}</p>
        <p><strong>Punctuality:</strong> ${data.attendance.punctuality_percentage}%</p>
    </div>

    <div class="footer">
        <div class="signature-box">Principal's Signature</div>
        <div class="signature-box">Class Teacher's Signature</div>
        <div class="signature-box">Parent's Signature</div>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #666;">
        Generated on: ${data.generated_at.toDateString()}
    </div>
</body>
</html>`;
  }

  static async generateClassReportPDF(data, template) {
    const html = this.generateClassReportHTML(data, template);
    const fileName = `class_report_${data.classInfo.id}_${Date.now()}.html`;
    const filePath = path.join('reports', fileName);
    
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(filePath, html);
    return filePath;
  }

  static generateClassReportHTML(data, template) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Class Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; color: #f97316; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .stat-card { padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
        .results-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
        .results-table th, .results-table td { border: 1px solid #ddd; padding: 6px; }
        .results-table th { background-color: #f97316; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <div class="school-name">${data.school.name}</div>
        <div>CLASS PERFORMANCE REPORT</div>
        <div>${data.classInfo.name} - ${data.term.name}</div>
        <div>Class Teacher: ${data.classInfo.teacher_first_name || 'N/A'} ${data.classInfo.teacher_last_name || ''}</div>
    </div>

    <div class="stats">
        <div class="stat-card">
            <h4>Total Students</h4>
            <div style="font-size: 24px; color: #f97316;">${data.statistics.total_students}</div>
        </div>
        <div class="stat-card">
            <h4>Class Average</h4>
            <div style="font-size: 24px; color: #f97316;">${data.statistics.average_percentage}%</div>
        </div>
        <div class="stat-card">
            <h4>Pass Rate</h4>
            <div style="font-size: 24px; color: #f97316;">${data.statistics.pass_rate}%</div>
        </div>
    </div>

    <h3>Grade Distribution</h3>
    <div class="stats">
        <div class="stat-card">A: ${data.statistics.grade_a_count}</div>
        <div class="stat-card">B: ${data.statistics.grade_b_count}</div>
        <div class="stat-card">C: ${data.statistics.grade_c_count}</div>
        <div class="stat-card">D: ${data.statistics.grade_d_count}</div>
        <div class="stat-card">F: ${data.statistics.grade_f_count}</div>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #666;">
        Generated on: ${data.generated_at.toDateString()}
    </div>
</body>
</html>`;
  }
}

module.exports = PDFService;