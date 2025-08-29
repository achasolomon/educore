// backend/src/modules/reports/services/excelService.js
const fs = require('fs');
const path = require('path');

class ExcelService {
  static async generateStudentReportExcel(data, template) {
    // Simple CSV generation for now - in production use xlsx library
    const csvContent = this.generateStudentReportCSV(data);
    const fileName = `student_report_${data.student.id}_${Date.now()}.csv`;
    const filePath = path.join('reports', fileName);
    
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(filePath, csvContent);
    return filePath;
  }

  static generateStudentReportCSV(data) {
    let csv = `Student Report Card\n`;
    csv += `School:,${data.school.name}\n`;
    csv += `Student:,${data.student.first_name} ${data.student.last_name}\n`;
    csv += `Class:,${data.student.class_name}\n`;
    csv += `Term:,${data.term.name}\n`;
    csv += `\n`;
    
    csv += `Subject,CA1,CA2,CA3,CA4,Exam,Total,Grade,Position,Remark\n`;
    
    data.results.forEach(result => {
      csv += `${result.subject_name},${result.ca1_score || ''},${result.ca2_score || ''},`;
      csv += `${result.ca3_score || ''},${result.ca4_score || ''},${result.exam_score || ''},`;
      csv += `${result.total_score},${result.letter_grade},${result.class_position || ''},${result.remark}\n`;
    });
    
    csv += `\n`;
    csv += `Summary\n`;
    csv += `Total Subjects:,${data.summary.totalSubjects}\n`;
    csv += `Average Score:,${data.summary.averageScore}%\n`;
    csv += `Overall Grade:,${data.summary.overallGrade}\n`;
    
    return csv;
  }

  static async generateClassReportExcel(data, template) {
    const csvContent = this.generateClassReportCSV(data);
    const fileName = `class_report_${data.classInfo.id}_${Date.now()}.csv`;
    const filePath = path.join('reports', fileName);
    
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(filePath, csvContent);
    return filePath;
  }

  static generateClassReportCSV(data) {
    let csv = `Class Performance Report\n`;
    csv += `School:,${data.school.name}\n`;
    csv += `Class:,${data.classInfo.name}\n`;
    csv += `Term:,${data.term.name}\n`;
    csv += `\n`;
    
    csv += `Statistics\n`;
    csv += `Total Students:,${data.statistics.total_students}\n`;
    csv += `Class Average:,${data.statistics.average_percentage}%\n`;
    csv += `Pass Rate:,${data.statistics.pass_rate}%\n`;
    csv += `\n`;
    
    csv += `Grade Distribution\n`;
    csv += `A:,${data.statistics.grade_a_count}\n`;
    csv += `B:,${data.statistics.grade_b_count}\n`;
    csv += `C:,${data.statistics.grade_c_count}\n`;
    csv += `D:,${data.statistics.grade_d_count}\n`;
    csv += `F:,${data.statistics.grade_f_count}\n`;
    
    return csv;
  }
}

module.exports = ExcelService;