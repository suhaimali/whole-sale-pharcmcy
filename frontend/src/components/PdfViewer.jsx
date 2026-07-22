import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronDown, PenTool, MessageSquare, Search, Share, Printer } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function PdfViewer({ file, title = "Document", invoiceData, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const handlePrint = () => {
    window.print();
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden font-sans print:bg-white print:static print:inset-auto">
      
      {/* Top Header - Hidden when printing */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-4 md:py-6 bg-gradient-to-b from-black/80 to-transparent print:hidden">
        {/* Empty left spacer to balance the close button on the right */}
        <div className="w-10"></div>
        
        {/* Title */}
        <div className="flex items-center gap-1.5 cursor-pointer">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <ChevronDown size={18} className="text-gray-400 mt-0.5" />
        </div>
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-[#2C2C2E]/80 backdrop-blur flex items-center justify-center text-white hover:bg-[#3C3C3E] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Document Container */}
      <div className="flex-1 overflow-auto flex items-start justify-center pt-20 pb-40 px-2 md:px-6 w-full h-full print:p-0 print:overflow-visible">
        {file ? (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex flex-col items-center max-w-full print:hidden"
            loading={<div className="text-gray-400 font-medium mt-10">Loading PDF...</div>}
            error={<div className="text-red-400 font-medium bg-red-900/30 p-4 rounded-lg mt-10">Failed to load PDF.</div>}
          >
            <div className="bg-white shadow-2xl mx-auto w-full max-w-3xl">
               <Page 
                 pageNumber={pageNumber} 
                 scale={1.0}
                 renderTextLayer={true}
                 renderAnnotationLayer={true}
                 className="pdf-page-container w-full"
                 width={Math.min(window.innerWidth - 32, 800)}
               />
            </div>
          </Document>
        ) : invoiceData ? (
          // HTML Invoice Template (mimics the screenshot)
          <div className="bg-white shadow-2xl w-[950px] max-w-none flex-shrink-0 min-h-[1056px] p-8 md:p-12 text-black text-xs font-sans print:shadow-none print:w-full print:p-0 mx-auto">
            <h1 className="text-center font-bold text-xl mb-10 tracking-wide uppercase">
              {invoiceData.displayType || 'Invoice'}
            </h1>

            <div className="flex justify-between mb-8">
              <div className="space-y-1">
                <h2 className="font-extrabold text-sm mb-2">{invoiceData.companyName || 'Dynamic Techno Medicals Pvt Ltd'}</h2>
                <p>DOOR NO. 9/361-A</p>
                <p>DYNAMIC ALUVA DEPOT</p>
                <p>KODIKUTHIMALA, ASHOKAPURAM,ALUVA,</p>
                <p>ERNAKULAM, - 683101, KERALA</p>
                
                <h3 className="font-bold mt-6 mb-1">Bill-to Customer No : {invoiceData.customerId || 'DCKL0191'}</h3>
                <p className="font-bold">{invoiceData.party || 'BCL SURGICALS'}</p>
                <p>8/1618 C.D&E, AVUNHIPPURAM COMPLEX, NILAMBUR ROAD, MANJERI</p>
                <p>ERANAD TALUK,</p>
                <p>MANJERI - 676121</p>
              </div>
              
              <div className="text-right space-y-1">
                <div className="grid grid-cols-2 gap-x-4">
                  <span className="font-medium">Order Number :</span>
                  <span>{invoiceData.number}</span>
                  
                  <span className="font-medium">Order Date :</span>
                  <span>{new Date(invoiceData.date).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                </div>
              </div>
            </div>

            <table className="w-full border-collapse border border-black mb-4">
              <thead>
                <tr className="border-b border-black text-center font-bold">
                  <th className="border-r border-black p-2">No.</th>
                  <th className="border-r border-black p-2">Description</th>
                  <th className="border-r border-black p-2">Qty</th>
                  <th className="border-r border-black p-2">Unit</th>
                  <th className="border-r border-black p-2">MRP</th>
                  <th className="border-r border-black p-2">Rate</th>
                  <th className="border-r border-black p-2">Disc %</th>
                  <th className="border-r border-black p-2">Disc Amt</th>
                  <th className="border-r border-black p-2">Taxable Amt</th>
                  <th className="border-r border-black p-2">GST %</th>
                  <th className="border-r border-black p-2">GST Amt</th>
                  <th className="p-2">Total Amt</th>
                </tr>
              </thead>
              <tbody>
                {(invoiceData.original?.items || []).map((item, idx) => {
                  const qty = item.quantity || 1;
                  const rate = item.price || item.costPrice || 0;
                  const total = qty * rate;
                  const gstPercent = 5; // placeholder based on screenshot
                  const gstAmt = total * (gstPercent/100);
                  const net = total + gstAmt;

                  return (
                    <tr key={idx} className="border-b border-black text-right">
                      <td className="border-r border-black p-2 text-center">{idx + 1}</td>
                      <td className="border-r border-black p-2 text-left text-[10px] font-bold max-w-[200px] break-words uppercase">{item.name}</td>
                      <td className="border-r border-black p-2">{qty}</td>
                      <td className="border-r border-black p-2 text-center">EA</td>
                      <td className="border-r border-black p-2">{rate.toFixed(2)}</td>
                      <td className="border-r border-black p-2">{rate.toFixed(2)}</td>
                      <td className="border-r border-black p-2">{(item.discount || 0).toFixed(2)}</td>
                      <td className="border-r border-black p-2">0.00</td>
                      <td className="border-r border-black p-2">{total.toFixed(2)}</td>
                      <td className="border-r border-black p-2">{gstPercent.toFixed(2)}</td>
                      <td className="border-r border-black p-2">{gstAmt.toFixed(2)}</td>
                      <td className="p-2 font-medium">{net.toFixed(2)}</td>
                    </tr>
                  );
                })}
                <tr className="border-b border-black text-right font-bold">
                  <td colSpan="2" className="border-r border-black p-2 text-center">TOTAL</td>
                  <td className="border-r border-black p-2">{(invoiceData.original?.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0)}</td>
                  <td colSpan="4" className="border-r border-black p-2"></td>
                  <td className="border-r border-black p-2">0.00</td>
                  <td className="border-r border-black p-2">{(invoiceData.amount * 0.95).toFixed(2)}</td>
                  <td className="border-r border-black p-2"></td>
                  <td className="border-r border-black p-2">{(invoiceData.amount * 0.05).toFixed(2)}</td>
                  <td className="p-2">{invoiceData.amount.toFixed(2)}</td>
                </tr>
                <tr className="text-right font-bold">
                  <td colSpan="2" className="border-r border-black p-2 text-left">Net Amount [If advance]</td>
                  <td colSpan="9" className="border-r border-black p-2">Rs.</td>
                  <td className="p-2">{invoiceData.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div className="border border-black p-2 text-[10px] mb-2 leading-relaxed">
              Payment to be made by RTGS/NEFT by mentioning Beneficiary A/c No. as DYMD19DCKL0191 and IFSC Code HDFC0000310, Branch Aluva or by crossed A/c Payee Cheque in favour of Dynamic Techno medicals Pvt.Ltd
            </div>

            <div className="text-right text-[11px] font-bold">
              Approved & Reviewed By : <span className="font-mono ml-1">{invoiceData.original?.salesRep || invoiceData.original?.purchaseStaff || 'ADMIN'}</span>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 font-medium mt-10 print:hidden">No Document Available.</div>
        )}
      </div>

      {/* Bottom Footer - Hidden when printing */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-6 md:py-8 print:hidden pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button className="w-12 h-12 rounded-full bg-[#2C2C2E]/90 backdrop-blur flex items-center justify-center text-white hover:bg-[#3C3C3E] shadow-xl transition-colors">
            <PenTool size={22} />
          </button>
          <button className="w-12 h-12 rounded-full bg-[#2C2C2E]/90 backdrop-blur flex items-center justify-center text-white hover:bg-[#3C3C3E] transition-colors">
            <MessageSquare size={22} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 pointer-events-auto">
          <button onClick={handlePrint} title="Print to PDF" className="w-12 h-12 rounded-full bg-[#2C2C2E]/90 backdrop-blur flex items-center justify-center text-white hover:bg-[#3C3C3E] shadow-xl transition-colors">
            <Printer size={22} />
          </button>
          <button className="w-12 h-12 rounded-full bg-[#2C2C2E]/90 backdrop-blur flex items-center justify-center text-white hover:bg-[#3C3C3E] shadow-xl transition-colors">
            <Share size={22} />
          </button>
        </div>
      </div>

    </div>
  );

  return createPortal(content, document.body);
}
