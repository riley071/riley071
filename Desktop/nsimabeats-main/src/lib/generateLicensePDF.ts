import jsPDF from 'jspdf';

interface LicenseData {
  licenseId: string;
  beatTitle: string;
  producerName: string;
  licenseType: 'basic' | 'premium' | 'unlimited' | 'exclusive';
  purchaseDate: string;
  buyerName: string;
  buyerEmail: string;
  orderId: string;
  price: number;
}

const licenseTypeLabels: Record<string, string> = {
  basic: 'Basic License',
  premium: 'Premium License',
  unlimited: 'Unlimited License',
  exclusive: 'Exclusive License',
};

const licenseTerms: Record<string, string> = {
  basic: 'Non-exclusive license for single use. Distribution limited to 5,000 copies. No commercial radio play.',
  premium: 'Non-exclusive license for single use. Distribution limited to 50,000 copies. Commercial radio play allowed.',
  unlimited: 'Non-exclusive license for single use. Unlimited distribution. Commercial radio play allowed. No synchronization rights.',
  exclusive: 'Exclusive license. Full rights including synchronization, unlimited distribution, and commercial use. Producer retains no rights.',
};

export const generateLicensePDF = async (data: LicenseData): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper function to add text with wrapping
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color);
    
    const maxWidth = pageWidth - (margin * 2);
    const lines = doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      if (yPos > pageHeight - margin - 10) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += fontSize * 0.5 + 2;
    });
    
    yPos += 3; // Add spacing after text block
  };

  // Header
  doc.setFillColor(255, 215, 0); // Gold color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('NSIMABEATS', pageWidth / 2, 25, { align: 'center' });
  
  yPos = 50;

  // Title
  addText('MUSIC LICENSE AGREEMENT', 18, true);
  yPos += 5;

  // License Information Section
  addText('License Information', 14, true, '#666666');
  yPos += 2;
  
  addText(`License ID: ${data.licenseId}`, 10);
  addText(`Order ID: ${data.orderId}`, 10);
  addText(`Purchase Date: ${new Date(data.purchaseDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 10);
  yPos += 5;

  // Beat Information
  addText('Beat Information', 14, true, '#666666');
  yPos += 2;
  
  addText(`Title: ${data.beatTitle}`, 10);
  addText(`Producer: ${data.producerName}`, 10);
  addText(`License Type: ${licenseTypeLabels[data.licenseType]}`, 10);
  addText(`Price: MK ${data.price.toFixed(2)} MWK`, 10);
  yPos += 5;

  // Buyer Information
  addText('Licensee Information', 14, true, '#666666');
  yPos += 2;
  
  addText(`Name: ${data.buyerName}`, 10);
  addText(`Email: ${data.buyerEmail}`, 10);
  yPos += 5;

  // License Terms
  addText('License Terms', 14, true, '#666666');
  yPos += 2;
  
  addText(licenseTerms[data.licenseType], 10);
  yPos += 5;

  // General Terms
  addText('General Terms and Conditions', 14, true, '#666666');
  yPos += 2;
  
  const generalTerms = [
    '1. This license is non-transferable and applies only to the licensee named above.',
    '2. The licensee may use the beat for recording, distribution, and performance as specified by the license type.',
    '3. The licensee must credit the producer in all uses of the beat.',
    '4. This license does not include the right to resell, lease, or sublicense the beat.',
    '5. All rights not expressly granted are reserved by the producer.',
    '6. This license is governed by the laws of the jurisdiction where Nsimabeats operates.',
  ];
  
  generalTerms.forEach(term => {
    addText(term, 9);
  });
  yPos += 5;

  // Footer
  const footerY = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a legally binding agreement. By purchasing this license, you agree to all terms and conditions.', 
    pageWidth / 2, footerY, { align: 'center' });
  
  doc.text('For questions or support, contact: support@nsimabeats.com', 
    pageWidth / 2, footerY + 8, { align: 'center' });
  
  doc.text(`Generated on ${new Date().toLocaleString()}`, 
    pageWidth / 2, footerY + 16, { align: 'center' });

  // Generate blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
};

