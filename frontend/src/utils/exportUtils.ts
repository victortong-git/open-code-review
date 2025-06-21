import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptions {
  filename?: string;
  format?: 'pdf' | 'png' | 'jpg';
  quality?: number;
  scale?: number;
}

/**
 * Export a DOM element to PDF with proper chart rendering
 */
export const exportToPDF = async (
  elementId: string, 
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'security-report',
    quality = 1,
    scale = 2
  } = options;

  try {
    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id '${elementId}' not found`);
    }

    // Show loading state
    const loadingElement = document.createElement('div');
    loadingElement.id = 'export-loading';
    loadingElement.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="margin-bottom: 10px;">Generating PDF...</div>
          <div style="width: 200px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
            <div style="width: 0%; height: 100%; background: #3b82f6; animation: loading-progress 3s linear infinite;"></div>
          </div>
        </div>
      </div>
      <style>
        @keyframes loading-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      </style>
    `;
    document.body.appendChild(loadingElement);

    // Wait for charts to fully render
    await waitForChartsToRender();

    // Configure html2canvas options for better chart rendering
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure all charts are visible in the cloned document
        const canvases = clonedDoc.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          canvas.style.display = 'block';
          canvas.style.visibility = 'visible';
        });
      }
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Add title page
    pdf.setFontSize(20);
    pdf.text('Security Report', 20, 30);
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Add content
    pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', quality), 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', quality), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(`${filename}.pdf`);

    // Remove loading element
    document.body.removeChild(loadingElement);

    console.log('PDF exported successfully');
  } catch (error) {
    // Remove loading element if it exists
    const loadingElement = document.getElementById('export-loading');
    if (loadingElement) {
      document.body.removeChild(loadingElement);
    }
    
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

/**
 * Export element as image
 */
export const exportAsImage = async (
  elementId: string,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    filename = 'security-report',
    format = 'png',
    quality = 1,
    scale = 2
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id '${elementId}' not found`);
    }

    await waitForChartsToRender();

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, quality);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`${format.toUpperCase()} exported successfully`);
  } catch (error) {
    console.error('Error exporting image:', error);
    throw error;
  }
};

/**
 * Wait for all Chart.js charts to finish rendering
 */
const waitForChartsToRender = async (): Promise<void> => {
  return new Promise((resolve) => {
    // Wait for charts to render
    setTimeout(() => {
      // Force chart resize to ensure proper rendering
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Trigger chart redraw
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
      });
      
      // Additional wait for chart animations to complete
      setTimeout(resolve, 1000);
    }, 500);
  });
};

/**
 * Prepare charts for export by disabling animations and ensuring visibility
 */
export const prepareChartsForExport = (): void => {
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
  });
};

/**
 * Enhanced print function with better chart support
 */
export const printWithCharts = async (): Promise<void> => {
  try {
    // Prepare charts for printing
    prepareChartsForExport();
    await waitForChartsToRender();
    
    // Use browser print
    window.print();
  } catch (error) {
    console.error('Error printing:', error);
    // Fallback to regular print
    window.print();
  }
};