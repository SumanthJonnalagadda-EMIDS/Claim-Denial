import emailjs from '@emailjs/browser';
import { generateSimplePDFBase64 } from './simplePdfGenerator';

// EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: 'service_wppqj7u',
  templateId: 'template_9r2c9nw',
  publicKey: '-a6_25kUxyRtqMAMF'
};

// Default sender configuration - EmailJS will use the service's configured sender
const DEFAULT_SENDER = {
  name: 'Healthcare Claims Validation System',
  email: '2200090134csit@gmail.com' // This will be overridden by EmailJS service settings
};

// Email service interface
export interface EmailData {
  from: string;
  to: string;
  subject: string;
  message: string;
}

export interface ClaimData {
  code: string;
  riskLevel: string;
  reason: string;
  validationStatus: string;
  totalClaims: number;
  deniedClaims: number;
  processingTime: number;
}

export interface ExportData {
  validationStatus: string;
  results: Array<{
    code: string;
    denied: boolean;
    probability: string;
    reason: string;
    suggested_fix: string;
  }>;
  processingTime?: number;
  deniedCount: number;
  approvedCount: number;
}

export interface EmailServiceResponse {
  success: boolean;
  message: string;
  error?: string;
  pdfData?: string; // Base64 PDF data for download
  pdfFileName?: string;
}

// Initialize EmailJS
export const initializeEmailService = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      emailjs.init(EMAILJS_CONFIG.publicKey);
      console.log('✅ EmailJS service initialized successfully');
      resolve();
    } catch (error) {
      console.error('❌ Failed to initialize EmailJS:', error);
      reject(error);
    }
  });
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Generate claim review email content
export const generateClaimReviewEmail = (claimData: ClaimData): EmailData => {
  const subject = `Claim Review Required - Code ${claimData.code} (${claimData.riskLevel} Risk)`;

  const message = `Dear Reviewer,

A claim validation has identified a ${claimData.riskLevel} risk issue that requires manual review:

Claim Code: ${claimData.code}
Risk Level: ${claimData.riskLevel}

Issue Description:
${claimData.reason}

Please review the attached documentation and provide guidance on the appropriate course of action.

Best regards,
Healthcare Claims Validation System`;

  return {
    from: DEFAULT_SENDER.email, // Use default sender instead of hardcoded Outlook address
    to: '',
    subject,
    message
  };
};

// Generate complete analysis email with PDF attachment
export const generateAnalysisEmail = (exportData: ExportData): EmailData => {
  const deniedCount = exportData.deniedCount;
  const totalCount = exportData.results.length;
  const riskPercentage = totalCount > 0 ? Math.round((deniedCount / totalCount) * 100) : 0;
  
  const subject = `Claim Analysis Report - ${deniedCount} Risk(s) Detected (${riskPercentage}% Risk Rate)`;

  const message = `Dear Reviewer,

A comprehensive claim analysis has been completed with the following results:

📊 Analysis Summary:
• Total Services Analyzed: ${totalCount}
• Services at Risk: ${deniedCount}
• Services Approved: ${exportData.approvedCount}
• Overall Risk Rate: ${riskPercentage}%
• Processing Time: ${exportData.processingTime || 0} seconds

A detailed PDF analysis report has been generated and is available for download. The report contains:
• Individual service analysis with risk assessments
• Probability calculations for each service
• Detailed reasoning for risk detection
• Specific recommendations for each issue
• Professional summary and statistics

Please review the analysis report for complete details and take appropriate action on the identified risks.

Best regards,
Healthcare Claims Validation System`;

  return {
    from: DEFAULT_SENDER.email,
    to: '',
    subject,
    message
  };
};

// Send email using EmailJS
export const sendEmail = async (
  emailData: EmailData,
  claimData?: ClaimData,
  attachmentInfo?: { name: string; hasAttachment: boolean },
  exportData?: ExportData
): Promise<EmailServiceResponse> => {
  try {
    // Validate email data
    if (!emailData.to.trim()) {
      throw new Error('Recipient email address is required');
    }

    if (!validateEmail(emailData.to)) {
      throw new Error('Please enter a valid email address');
    }

    if (!emailData.subject.trim()) {
      throw new Error('Email subject is required');
    }

    if (!emailData.message.trim()) {
      throw new Error('Email message is required');
    }

    // Generate PDF if export data is provided
    let pdfBase64 = '';
    let pdfFileName = '';
    if (exportData) {
      try {
        console.log('📄 Generating PDF...');
        pdfBase64 = await generateSimplePDFBase64(exportData);
        pdfFileName = `claim_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
        console.log('✅ PDF generated successfully');
      } catch (pdfError) {
        console.error('❌ Failed to generate PDF:', pdfError);
        // Continue without PDF rather than failing the entire email
      }
    }

    // Prepare template parameters with extensive naming variations for EmailJS compatibility
    const templateParams = {
      // Core email fields - multiple variations to ensure compatibility
      from_name: 'Healthcare Claims Validation System',
      from_email: emailData.from,
      sender_email: emailData.from,
      sender_name: 'Healthcare Claims Validation System',
      
      // Recipient fields - extensive variations to match common EmailJS templates
      to_name: emailData.to.split('@')[0],
      to_email: emailData.to,
      recipient_email: emailData.to,
      recipient_name: emailData.to.split('@')[0],
      email: emailData.to,
      user_email: emailData.to,
      user_name: emailData.to.split('@')[0],
      to: emailData.to,
      toEmail: emailData.to,
      recipientEmail: emailData.to,
      
      reply_to: emailData.from,
      replyTo: emailData.from,
      
      // Email content - multiple variations
      subject: emailData.subject,
      email_subject: emailData.subject,
      emailSubject: emailData.subject,
      message: emailData.message,
      email_message: emailData.message,
      emailMessage: emailData.message,
      content: emailData.message,
      body: emailData.message,
      
      // Additional context
      timestamp: new Date().toLocaleString(),
      system_info: 'Healthcare Claims Validation System v1.0',
      sent_at: new Date().toISOString(),
      
      // Attachment info (for reference in email)
      has_attachment: (attachmentInfo?.hasAttachment || !!pdfBase64) ? 'Yes' : 'No',
      attachment_name: pdfFileName || attachmentInfo?.name || 'None',
      hasAttachment: (attachmentInfo?.hasAttachment || !!pdfBase64) ? 'Yes' : 'No',
      attachmentName: pdfFileName || attachmentInfo?.name || 'None',
      
      // Processing metadata
      ...(claimData && {
        claim_code: claimData.code,
        claimCode: claimData.code,
        risk_level: claimData.riskLevel,
        riskLevel: claimData.riskLevel,
        reason: claimData.reason,
        issue_description: claimData.reason,
        validation_status: claimData.validationStatus,
        validationStatus: claimData.validationStatus,
        total_claims: claimData.totalClaims,
        totalClaims: claimData.totalClaims,
        denied_claims: claimData.deniedClaims,
        deniedClaims: claimData.deniedClaims,
        processing_time: claimData.processingTime,
        processingTime: claimData.processingTime
      })
    };

    console.log('📧 Sending email with parameters:', {
      to: emailData.to,
      subject: emailData.subject,
      hasClaimData: !!claimData,
      hasPdf: !!pdfBase64
    });

    // Debug: Log all template parameters for troubleshooting
    console.log('🔍 Full template parameters being sent to EmailJS:', templateParams);
    console.log('📋 Key recipient parameters:', {
      to_email: templateParams.to_email,
      recipient_email: templateParams.recipient_email,
      email: templateParams.email,
      to: templateParams.to,
      user_email: templateParams.user_email
    });

    // Send email via EmailJS with fallback parameter handling
    let response;
    try {
      response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );
    } catch (firstError: any) {
      // If first attempt fails with "recipients address is empty", try with simplified parameters
      if (firstError.text && firstError.text.includes('recipients address is empty')) {
        console.log('🔄 Retrying with simplified parameters due to recipient address error...');
        
        const simplifiedParams = {
          // Most common EmailJS template parameter names
          to_email: emailData.to,
          from_email: emailData.from,
          subject: emailData.subject,
          message: emailData.message,
          // Additional common variations
          email: emailData.to,
          recipient: emailData.to,
          user_email: emailData.to,
          to: emailData.to,
          from: emailData.from,
          reply_to: emailData.from,
          // Name fields
          to_name: emailData.to.split('@')[0],
          from_name: 'Healthcare Claims System'
        };
        
        console.log('🔍 Simplified parameters:', simplifiedParams);
        
        response = await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          simplifiedParams,
          EMAILJS_CONFIG.publicKey
        );
      } else {
        throw firstError;
      }
    }

    console.log('✅ Email sent successfully:', response);

    return {
      success: true,
      message: '✅ Email sent successfully! The reviewer will be notified about the claim that requires attention.',
      pdfData: pdfBase64,
      pdfFileName: pdfFileName
    };

  } catch (error: any) {
    console.error('❌ Failed to send email:', error);

    // Enhanced error handling
    let errorMessage = 'Failed to send email. ';

    if (error.message && error.message.includes('required')) {
      errorMessage = error.message;
    } else if (error.text) {
      errorMessage += error.text;
    } else if (error.message) {
      errorMessage += error.message;
    }

    return {
      success: false,
      message: errorMessage,
      error: errorMessage
    };
  }
};

// Helper function to download PDF
export const downloadPDF = (pdfBase64: string, fileName: string): void => {
  try {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download PDF:', error);
  }
};

// Format email preview for display
export const formatEmailPreview = (emailData: EmailData): string => {
  return `To: ${emailData.to}
Subject: ${emailData.subject}

${emailData.message}`;
};

// Get email configuration
export const getEmailConfig = () => EMAILJS_CONFIG;

