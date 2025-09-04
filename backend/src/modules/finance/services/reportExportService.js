// backend/src/modules/finance/services/reportExportService.js
const PDFDocument = require('pdfkit'); // Free alternative to puppeteer
const ExcelJS = require('exceljs'); // Free Excel generation library
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../../core/utils/logger');

class ReportExportService {
  static async generatePDFReport(reportData, reportType) {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      // Add school logo and header
      await this.addPDFHeader(doc, reportData, reportType);
      
      // Add content based on report type
      switch (reportType) {
        case 'comprehensive':
          await this.addComprehensivePDFContent(doc, reportData);
          break;
        case 'budget':
          await this.addBudgetPDFContent(doc, reportData);
          break;
        case 'cash_flow':
          await this.addCashFlowPDFContent(doc, reportData);
          break;
        default:
          await this.addGenericPDFContent(doc, reportData);
      }
      
      // Add footer
      this.addPDFFooter(doc);
      
      doc.end();
      
      return new Promise((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      });
      
    } catch (error) {
      logger.error('Generate PDF report error:', error);
      throw error;
    }
  }

  static async addPDFHeader(doc, reportData, reportType) {
    // Title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text(this.getReportTitle(reportType), { align: 'center' });
    
    // School info (if available in metadata)
    if (reportData.metadata) {
      doc.moveDown()
         .fontSize(12)
         .font('Helvetica')
         .text(`School ID: ${reportData.metadata.school_id}`, { align: 'center' })
         .text(`Generated: ${new Date(reportData.metadata.generated_at).toLocaleString()}`, { align: 'center' });
    }
    
    // Add separator line
    doc.moveDown()
       .strokeColor('#FF6B35') // Orange theme
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown();
  }

  static async addComprehensivePDFContent(doc, reportData) {
    // Executive Summary
    if (reportData.executive_summary) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#FF6B35')
         .text('Executive Summary');
      
      const summary = reportData.executive_summary.financial_highlights;
      
      doc.moveDown()
         .fontSize(11)
         .font('Helvetica')
         .fillColor('black')
         .text(`Total Revenue: ₦${summary.total_revenue.toLocaleString()}`)
         .text(`Total Expenses: ₦${summary.total_expenses.toLocaleString()}`)
         .text(`Net Income: ₦${summary.net_income.toLocaleString()}`)
         .text(`Profit Margin: ${summary.profit_margin}%`);
      
      doc.moveDown();
    }

    // Revenue Analysis
    if (reportData.revenue_analysis) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#FF6B35')
         .text('Revenue Analysis');
      
      // Category breakdown table
      doc.moveDown()
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Revenue by Category:', { underline: true });
      
      const categories = reportData.revenue_analysis.category_breakdown;
      let yPosition = doc.y + 10;
      
      // Table headers
      doc.text('Category', 50, yPosition)
         .text('Billed', 200, yPosition)
         .text('Collected', 280, yPosition)
         .text('Collection Rate', 380, yPosition)
         .text('Students', 480, yPosition);
      
      yPosition += 20;
      doc.strokeColor('#cccccc')
         .lineWidth(1)
         .moveTo(50, yPosition)
         .lineTo(550, yPosition)
         .stroke();
      
      yPosition += 10;
      
      categories.slice(0, 10).forEach(category => {
        doc.font('Helvetica')
           .text(category.category.substring(0, 20), 50, yPosition)
           .text(`₦${parseFloat(category.total_billed).toLocaleString()}`, 200, yPosition)
           .text(`₦${parseFloat(category.total_collected).toLocaleString()}`, 280, yPosition)
           .text(`${category.collection_rate}%`, 380, yPosition)
           .text(category.students_count.toString(), 480, yPosition);
        
        yPosition += 15;
        
        // Add page break if needed
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      });
    }

    // Budget Performance
    if (reportData.budget_performance) {
      doc.addPage()
         .fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#FF6B35')
         .text('Budget Performance');
      
      const budgets = reportData.budget_performance.budget_performance;
      let yPos = doc.y + 20;
      
      budgets.slice(0, 8).forEach(budget => {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('black')
           .text(budget.budget_name, 50, yPos);
        
        yPos += 15;
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Budgeted: ₦${budget.budgeted_amount.toLocaleString()}`, 50, yPos)
           .text(`Spent: ₦${budget.spent_amount.toLocaleString()}`, 200, yPos)
           .text(`Utilization: ${budget.utilization_rate}%`, 350, yPos)
           .text(`Status: ${budget.performance_rating}`, 450, yPos);
        
        yPos += 25;
        
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });
    }

    // Key Insights
    if (reportData.insights) {
      doc.addPage()
         .fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#FF6B35')
         .text('Key Insights');
      
      doc.moveDown();
      
      reportData.insights.forEach((insight, index) => {
        const color = insight.type === 'positive' ? '#28a745' : 
                     insight.type === 'warning' ? '#ffc107' : '#dc3545';
        
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(color)
           .text(`${index + 1}. ${insight.category.toUpperCase()}:`)
           .font('Helvetica')
           .fillColor('black')
           .text(insight.message, { indent: 20 })
           .moveDown(0.5);
      });
    }
  }

  static async addBudgetPDFContent(doc, reportData) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#FF6B35')
       .text('Budget Performance Summary');
    
    // Overall summary
    const summary = reportData.summary;
    doc.moveDown()
       .fontSize(11)
       .font('Helvetica')
       .fillColor('black')
       .text(`Total Budgets: ${summary.total_budgets}`)
       .text(`Total Budgeted: ₦${summary.total_budgeted.toLocaleString()}`)
       .text(`Total Spent: ₦${summary.total_spent.toLocaleString()}`)
       .text(`Average Utilization: ${summary.avg_utilization}%`)
       .text(`Budgets Over Threshold: ${summary.budgets_over_threshold}`)
       .moveDown();

    // Individual budget details
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Budget Details:');
    
    let yPos = doc.y + 10;
    
    reportData.budget_performance.forEach(budget => {
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(budget.budget_name, 50, yPos);
      
      yPos += 15;
      
      doc.fontSize(9)
         .font('Helvetica')
         .text(`Type: ${budget.budget_type}`, 50, yPos)
         .text(`Budgeted: ₦${budget.budgeted_amount.toLocaleString()}`, 150, yPos)
         .text(`Spent: ₦${budget.spent_amount.toLocaleString()}`, 280, yPos)
         .text(`Utilization: ${budget.utilization_rate}%`, 400, yPos)
         .text(`Rating: ${budget.performance_rating}`, 480, yPos);
      
      yPos += 20;
      
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
    });
  }

  static async addCashFlowPDFContent(doc, reportData) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#FF6B35')
       .text('Cash Flow Analysis');
    
    // Summary
    const summary = reportData.summary;
    doc.moveDown()
       .fontSize(11)
       .font('Helvetica')
       .fillColor('black')
       .text(`Total Inflow: ₦${summary.total_inflow.toLocaleString()}`)
       .text(`Total Outflow: ₦${summary.total_outflow.toLocaleString()}`)
       .text(`Net Cash Flow: ₦${summary.net_cash_flow.toLocaleString()}`)
       .text(`Cash Flow Ratio: ${summary.cash_flow_ratio}`)
       .text(`Positive Days: ${summary.positive_days}`)
       .text(`Negative Days: ${summary.negative_days}`)
       .moveDown();

    // Daily breakdown (show last 15 days)
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Recent Daily Cash Flow:');
    
    let yPos = doc.y + 10;
    
    // Table headers
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Date', 50, yPos)
       .text('Inflow', 150, yPos)
       .text('Outflow', 230, yPos)
       .text('Net Flow', 310, yPos)
       .text('Cumulative', 400, yPos);
    
    yPos += 15;
    
    reportData.daily_cash_flow.slice(-15).forEach(day => {
      doc.font('Helvetica')
         .text(new Date(day.date).toLocaleDateString(), 50, yPos)
         .text(`₦${day.inflow.toLocaleString()}`, 150, yPos)
         .text(`₦${day.outflow.toLocaleString()}`, 230, yPos)
         .fillColor(day.net_flow >= 0 ? '#28a745' : '#dc3545')
         .text(`₦${day.net_flow.toLocaleString()}`, 310, yPos)
         .fillColor('black')
         .text(`₦${day.cumulative_flow.toLocaleString()}`, 400, yPos);
      
      yPos += 12;
    });
  }

  static addPDFFooter(doc) {
    const footerY = 750;
    
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Generated by School Management System', 50, footerY)
       .text(`Page ${doc.bufferedPageRange().count}`, 500, footerY);
  }

  static getReportTitle(reportType) {
    const titles = {
      comprehensive: 'Comprehensive Financial Report',
      budget: 'Budget Performance Report',
      cash_flow: 'Cash Flow Analysis Report',
      revenue: 'Revenue Analysis Report',
      student_payments: 'Student Payment Behavior Report'
    };
    
    return titles[reportType] || 'Financial Report';
  }

  // Excel Export Methods
  static async generateExcelReport(reportData, reportType) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook properties
      workbook.creator = 'School Management System';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      switch (reportType) {
        case 'comprehensive':
          await this.addComprehensiveExcelSheets(workbook, reportData);
          break;
        case 'revenue':
          await this.addRevenueExcelSheets(workbook, reportData);
          break;
        case 'student_payments':
          await this.addStudentPaymentExcelSheets(workbook, reportData);
          break;
        default:
          await this.addGenericExcelSheet(workbook, reportData);
      }
      
      return await workbook.xlsx.writeBuffer();
      
    } catch (error) {
      logger.error('Generate Excel report error:', error);
      throw error;
    }
  }

  static async addComprehensiveExcelSheets(workbook, reportData) {
    // Executive Summary Sheet
    const summarySheet = workbook.addWorksheet('Executive Summary');
    
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Details', key: 'details', width: 30 }
    ];
    
    if (reportData.executive_summary) {
      const highlights = reportData.executive_summary.financial_highlights;
      const operational = reportData.executive_summary.operational_metrics;
      
      summarySheet.addRows([
        { metric: 'Profit Margin', value: `${highlights.profit_margin}%`, details: 'Net income as percentage of revenue' },
        { metric: 'Students Served', value: operational.students_served.toLocaleString(), details: 'Total students with fees' },
        { metric: 'Collection Efficiency', value: `${operational.collection_efficiency}%`, details: 'Percentage of fees collected' },
        { metric: 'Average Fee per Student', value: `₦${operational.average_fee_per_student.toLocaleString()}`, details: 'Average fee amount per student' }
      ]);
    }
    
    // Style the header row
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B35' }
    };

    // Revenue Analysis Sheet
    if (reportData.revenue_analysis) {
      const revenueSheet = workbook.addWorksheet('Revenue Analysis');
      
      revenueSheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Total Billed', key: 'billed', width: 15 },
        { header: 'Total Collected', key: 'collected', width: 15 },
        { header: 'Collection Rate', key: 'rate', width: 15 },
        { header: 'Students Count', key: 'students', width: 15 },
        { header: 'Avg per Student', key: 'average', width: 15 }
      ];
      
      reportData.revenue_analysis.category_breakdown.forEach(category => {
        revenueSheet.addRow({
          category: category.category,
          billed: parseFloat(category.total_billed),
          collected: parseFloat(category.total_collected),
          rate: `${category.collection_rate}%`,
          students: category.students_count,
          average: parseFloat(category.avg_per_student)
        });
      });
      
      // Format currency columns
      revenueSheet.getColumn('billed').numFmt = '₦#,##0.00';
      revenueSheet.getColumn('collected').numFmt = '₦#,##0.00';
      revenueSheet.getColumn('average').numFmt = '₦#,##0.00';
      
      // Style header
      revenueSheet.getRow(1).font = { bold: true };
      revenueSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6B35' }
      };
    }

    // Budget Performance Sheet
    if (reportData.budget_performance) {
      const budgetSheet = workbook.addWorksheet('Budget Performance');
      
      budgetSheet.columns = [
        { header: 'Budget Name', key: 'name', width: 25 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Budgeted Amount', key: 'budgeted', width: 18 },
        { header: 'Spent Amount', key: 'spent', width: 18 },
        { header: 'Utilization Rate', key: 'utilization', width: 15 },
        { header: 'Variance', key: 'variance', width: 15 },
        { header: 'Performance Rating', key: 'rating', width: 20 }
      ];
      
      reportData.budget_performance.budget_performance.forEach(budget => {
        budgetSheet.addRow({
          name: budget.budget_name,
          type: budget.budget_type,
          budgeted: budget.budgeted_amount,
          spent: budget.spent_amount,
          utilization: `${budget.utilization_rate}%`,
          variance: budget.variance,
          rating: budget.performance_rating
        });
      });
      
      // Format currency columns
      budgetSheet.getColumn('budgeted').numFmt = '₦#,##0.00';
      budgetSheet.getColumn('spent').numFmt = '₦#,##0.00';
      budgetSheet.getColumn('variance').numFmt = '₦#,##0.00';
      
      // Style header
      budgetSheet.getRow(1).font = { bold: true };
      budgetSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6B35' }
      };
    }
  }

  static async addRevenueExcelSheets(workbook, reportData) {
    // Category Breakdown Sheet
    const categorySheet = workbook.addWorksheet('Revenue by Category');
    
    categorySheet.columns = [
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Total Billed', key: 'billed', width: 15 },
      { header: 'Total Collected', key: 'collected', width: 15 },
      { header: 'Collection Rate', key: 'rate', width: 15 },
      { header: 'Students', key: 'students', width: 12 },
      { header: 'Avg per Student', key: 'average', width: 15 }
    ];
    
    reportData.category_breakdown.forEach(category => {
      categorySheet.addRow({
        category: category.category,
        code: category.code,
        billed: parseFloat(category.total_billed),
        collected: parseFloat(category.total_collected),
        rate: `${category.collection_rate}%`,
        students: category.students_count,
        average: parseFloat(category.avg_per_student)
      });
    });
    
    // Payment Methods Sheet
    if (reportData.payment_methods) {
      const methodsSheet = workbook.addWorksheet('Payment Methods');
      
      methodsSheet.columns = [
        { header: 'Payment Method', key: 'method', width: 20 },
        { header: 'Transaction Count', key: 'count', width: 18 },
        { header: 'Total Amount', key: 'amount', width: 15 },
        { header: 'Average Transaction', key: 'average', width: 18 },
        { header: 'Market Share', key: 'share', width: 15 }
      ];
      
      const totalAmount = reportData.payment_methods.reduce((sum, method) => sum + method.total_amount, 0);
      
      reportData.payment_methods.forEach(method => {
        const marketShare = totalAmount > 0 ? ((method.total_amount / totalAmount) * 100).toFixed(2) : 0;
        
        methodsSheet.addRow({
          method: method.method,
          count: method.transaction_count,
          amount: method.total_amount,
          average: method.avg_transaction,
          share: `${marketShare}%`
        });
      });
      
      // Format currency columns
      methodsSheet.getColumn('amount').numFmt = '₦#,##0.00';
      methodsSheet.getColumn('average').numFmt = '₦#,##0.00';
    }
    
    // Grade Level Performance
    if (reportData.grade_level_performance) {
      const gradeSheet = workbook.addWorksheet('Grade Level Performance');
      
      gradeSheet.columns = [
        { header: 'Class Name', key: 'class', width: 20 },
        { header: 'Grade Level', key: 'grade', width: 15 },
        { header: 'Total Revenue', key: 'revenue', width: 15 },
        { header: 'Students Count', key: 'students', width: 15 },
        { header: 'Avg Revenue per Student', key: 'average', width: 20 },
        { header: 'Collection Rate', key: 'rate', width: 15 }
      ];
      
      reportData.grade_level_performance.forEach(grade => {
        gradeSheet.addRow({
          class: grade.class_name,
          grade: grade.grade_level,
          revenue: grade.total_revenue,
          students: grade.students_count,
          average: grade.avg_revenue_per_student,
          rate: `${grade.collection_rate}%`
        });
      });
      
      // Format currency columns
      gradeSheet.getColumn('revenue').numFmt = '₦#,##0.00';
      gradeSheet.getColumn('average').numFmt = '₦#,##0.00';
    }
    
    // Style all headers
    workbook.eachSheet((worksheet) => {
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6B35' }
      };
    });
  }

  static async addStudentPaymentExcelSheets(workbook, reportData) {
    // Top Payers Sheet
    const payersSheet = workbook.addWorksheet('Top Paying Students');
    
    payersSheet.columns = [
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Class', key: 'class', width: 15 },
      { header: 'Total Payments', key: 'count', width: 15 },
      { header: 'Total Paid', key: 'amount', width: 15 },
      { header: 'Average Payment', key: 'average', width: 15 },
      { header: 'Payment Frequency', key: 'frequency', width: 18 },
      { header: 'Preferred Method', key: 'method', width: 18 }
    ];
    
    reportData.top_payers.forEach(student => {
      payersSheet.addRow({
        name: student.student_name,
        class: student.class_name,
        count: student.total_payments,
        amount: student.total_paid,
        average: student.avg_payment,
        frequency: `${student.payment_frequency}/month`,
        method: student.preferred_method
      });
    });
    
    // Debt by Class Sheet
    const debtSheet = workbook.addWorksheet('Outstanding Debt by Class');
    
    debtSheet.columns = [
      { header: 'Class Name', key: 'class', width: 20 },
      { header: 'Students with Debt', key: 'students', width: 18 },
      { header: 'Total Outstanding', key: 'outstanding', width: 18 },
      { header: 'Avg Debt per Student', key: 'average', width: 20 },
      { header: 'Overdue Count', key: 'overdue', width: 15 }
    ];
    
    reportData.debt_by_class.forEach(debt => {
      debtSheet.addRow({
        class: debt.class_name,
        students: debt.students_with_debt,
        outstanding: debt.total_outstanding,
        average: debt.avg_debt_per_student,
        overdue: debt.overdue_count
      });
    });
    
    // Payment Timing Patterns
    if (reportData.payment_timing_patterns) {
      const timingSheet = workbook.addWorksheet('Payment Timing Patterns');
      
      timingSheet.columns = [
        { header: 'Day of Week', key: 'day', width: 15 },
        { header: 'Hour of Day', key: 'hour', width: 15 },
        { header: 'Payment Count', key: 'count', width: 15 },
        { header: 'Total Amount', key: 'amount', width: 15 }
      ];
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      reportData.payment_timing_patterns.forEach(timing => {
        timingSheet.addRow({
          day: dayNames[timing.day_of_week],
          hour: `${timing.hour_of_day}:00`,
          count: timing.payment_count,
          amount: timing.total_amount
        });
      });
      
      // Format currency column
      timingSheet.getColumn('amount').numFmt = '₦#,##0.00';
    }
    
    // Format currency columns
    payersSheet.getColumn('amount').numFmt = '₦#,##0.00';
    payersSheet.getColumn('average').numFmt = '₦#,##0.00';
    debtSheet.getColumn('outstanding').numFmt = '₦#,##0.00';
    debtSheet.getColumn('average').numFmt = '₦#,##0.00';
    
    // Style all headers
    workbook.eachSheet((worksheet) => {
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6B35' }
      };
    });
  }

  static async addGenericExcelSheet(workbook, reportData) {
    const sheet = workbook.addWorksheet('Report Data');
    
    // Convert report data to rows
    const rows = this.flattenObjectToRows(reportData);
    
    sheet.columns = [
      { header: 'Field', key: 'field', width: 30 },
      { header: 'Value', key: 'value', width: 40 }
    ];
    
    rows.forEach(row => {
      sheet.addRow(row);
    });
    
    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B35' }
    };
  }

  static flattenObjectToRows(obj, prefix = '') {
    const rows = [];
    
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        rows.push(...this.flattenObjectToRows(value, fullKey));
      } else if (Array.isArray(value)) {
        // Handle arrays
        rows.push({
          field: fullKey,
          value: `Array with ${value.length} items`
        });
      } else {
        // Handle primitive values
        rows.push({
          field: fullKey,
          value: typeof value === 'number' ? value.toLocaleString() : String(value)
        });
      }
    });
    
    return rows;
  }

  // Utility method to add charts to Excel (requires additional setup)
  static async addChartToExcel(worksheet, chartData, chartType = 'line') {
    // Note: ExcelJS chart support is limited, but basic charts can be added
    // This would require additional configuration for complex charts
    try {
      // Placeholder for chart implementation
      // Real implementation would depend on specific chart requirements
      logger.info('Chart functionality placeholder - implement based on specific needs');
    } catch (error) {
      logger.error('Add chart to Excel error:', error);
    }
  }
}

module.exports = ReportExportService;