import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async (
  elementId: string,
  filename: string = 'document.pdf',
  onProgress?: (status: boolean) => void
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  if (onProgress) onProgress(true);

  try {
    // Save original styles if we need to modify for print
    const originalStyles = {
      height: element.style.height,
      maxHeight: element.style.maxHeight,
      overflow: element.style.overflow,
    };

    // Temporarily modify element for complete capture
    element.style.height = 'auto';
    element.style.maxHeight = 'none';
    element.style.overflow = 'visible';

    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Restore original styles
    element.style.height = originalStyles.height;
    element.style.maxHeight = originalStyles.maxHeight;
    element.style.overflow = originalStyles.overflow;

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calculate the scale to fit width
    const ratio = pdfWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;

    let heightLeft = scaledHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    // Add subsequent pages if content overflows A4 height
    while (heightLeft >= 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    if (onProgress) onProgress(false);
  }
};
