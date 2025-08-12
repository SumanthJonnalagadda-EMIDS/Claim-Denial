import jsPDF from 'jspdf';

export interface ValidationResult {
    code: string;
    denied: boolean;
    probability: string;
    reason: string;
    suggested_fix: string;
    service_code?: string;
    risk_detected?: boolean;
    risk_percentage?: string;
    analysis?: string;
    recommendation?: string;
    priority?: string;
    risk_level?: string;
}

export interface ExportData {
    validationStatus: string;
    results: ValidationResult[];
    processingTime?: number;
    deniedCount: number;
    approvedCount: number;
}

// Simple risk level derivation
const getRiskLevel = (result: ValidationResult): string => {
    const prob = parseInt((result.probability || '0').replace('%', '')) || 0;
    if (prob >= 80) return 'High';
    if (prob >= 50) return 'Medium';
    return 'Low';
};

// Clean, professional PDF generator
export const generateSimplePDF = async (data: ExportData): Promise<void> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
        }
    };

    // Helper function to add wrapped text
    const addWrappedText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
            pdf.setFont('helvetica', 'bold');
        } else {
            pdf.setFont('helvetica', 'normal');
        }
        const lines = pdf.splitTextToSize(text, contentWidth);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.4) + 4;
    };

    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Claim Analysis Report', margin, yPosition);
    yPosition += 15;

    // Date and summary
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    pdf.text(`Generated: ${currentDate}`, margin, yPosition);
    yPosition += 8;

    // Summary box
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, yPosition, contentWidth, 25, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Summary', margin + 5, yPosition + 8);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(70, 70, 70);
    pdf.text(`Status: ${data.validationStatus.charAt(0).toUpperCase() + data.validationStatus.slice(1)}`, margin + 5, yPosition + 16);
    pdf.text(`Total Services: ${data.results.length}`, margin + 80, yPosition + 16);
    pdf.text(`At Risk: ${data.deniedCount}`, margin + 5, yPosition + 22);
    pdf.text(`Approved: ${data.approvedCount}`, margin + 80, yPosition + 22);
    yPosition += 35;

    // Results section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Service Analysis', margin, yPosition);
    yPosition += 12;

    // Process each result
    data.results.forEach((result, index) => {
        checkNewPage(60);

        // Service header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text(`Service ${index + 1}: ${result.code}`, margin, yPosition);
        yPosition += 8;

        // Status indicator
        const status = result.denied ? 'DENIAL RISK' : 'APPROVED';
        const statusColor = result.denied ? [231, 76, 60] : [46, 204, 113];
        pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(status, margin, yPosition);
        yPosition += 6;

        // Risk details
        pdf.setTextColor(70, 70, 70);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const riskLevel = getRiskLevel(result);
        pdf.text(`Risk Level: ${riskLevel}`, margin, yPosition);
        yPosition += 5;
        pdf.text(`Probability: ${result.probability}`, margin, yPosition);
        yPosition += 8;

        // Reason
        pdf.setFont('helvetica', 'bold');
        pdf.text('Analysis:', margin, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        addWrappedText(result.reason || 'No analysis provided', 10);

        // Suggested fix
        if (result.suggested_fix) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Recommendation:', margin, yPosition);
            yPosition += 5;
            pdf.setFont('helvetica', 'normal');
            addWrappedText(result.suggested_fix, 10);
        }

        // Separator
        if (index < data.results.length - 1) {
            yPosition += 5;
            pdf.setDrawColor(230, 230, 230);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 8;
        }
    });

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 30, pageHeight - 15);
        pdf.text('Healthcare Claim Analysis System', margin, pageHeight - 15);
    }

    // Save the PDF
    const fileName = `claim_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
};

// Base64 version for email attachments
export const generateSimplePDFBase64 = async (data: ExportData): Promise<string> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
        }
    };

    // Helper function to add wrapped text
    const addWrappedText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
            pdf.setFont('helvetica', 'bold');
        } else {
            pdf.setFont('helvetica', 'normal');
        }
        const lines = pdf.splitTextToSize(text, contentWidth);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.4) + 4;
    };

    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Claim Analysis Report', margin, yPosition);
    yPosition += 15;

    // Date and summary
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    pdf.text(`Generated: ${currentDate}`, margin, yPosition);
    yPosition += 8;

    // Summary box
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, yPosition, contentWidth, 25, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Summary', margin + 5, yPosition + 8);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(70, 70, 70);
    pdf.text(`Status: ${data.validationStatus.charAt(0).toUpperCase() + data.validationStatus.slice(1)}`, margin + 5, yPosition + 16);
    pdf.text(`Total Services: ${data.results.length}`, margin + 80, yPosition + 16);
    pdf.text(`At Risk: ${data.deniedCount}`, margin + 5, yPosition + 22);
    pdf.text(`Approved: ${data.approvedCount}`, margin + 80, yPosition + 22);
    yPosition += 35;

    // Results section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(44, 62, 80);
    pdf.text('Service Analysis', margin, yPosition);
    yPosition += 12;

    // Process each result
    data.results.forEach((result, index) => {
        checkNewPage(60);

        // Service header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text(`Service ${index + 1}: ${result.code}`, margin, yPosition);
        yPosition += 8;

        // Status indicator
        const status = result.denied ? 'DENIAL RISK' : 'APPROVED';
        const statusColor = result.denied ? [231, 76, 60] : [46, 204, 113];
        pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(status, margin, yPosition);
        yPosition += 6;

        // Risk details
        pdf.setTextColor(70, 70, 70);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const riskLevel = getRiskLevel(result);
        pdf.text(`Risk Level: ${riskLevel}`, margin, yPosition);
        yPosition += 5;
        pdf.text(`Probability: ${result.probability}`, margin, yPosition);
        yPosition += 8;

        // Reason
        pdf.setFont('helvetica', 'bold');
        pdf.text('Analysis:', margin, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        addWrappedText(result.reason || 'No analysis provided', 10);

        // Suggested fix
        if (result.suggested_fix) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Recommendation:', margin, yPosition);
            yPosition += 5;
            pdf.setFont('helvetica', 'normal');
            addWrappedText(result.suggested_fix, 10);
        }

        // Separator
        if (index < data.results.length - 1) {
            yPosition += 5;
            pdf.setDrawColor(230, 230, 230);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 8;
        }
    });

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 30, pageHeight - 15);
        pdf.text('Healthcare Claim Analysis System', margin, pageHeight - 15);
    }

    // Return Base64 string
    const dataUri = pdf.output('datauristring');
    const base64 = dataUri.split(',')[1] || '';
    return base64;
};
