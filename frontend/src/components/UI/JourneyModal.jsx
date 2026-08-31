import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './JourneyModal.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

function JourneyModal({ pdfUrl, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    setError(err?.message || 'Unknown error');
  }, []);

  const prev = () => setPageNumber(p => Math.max(1, p - 1));
  const next = () => setPageNumber(p => Math.min(numPages, p + 1));

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="journey-modal-backdrop" onClick={handleBackdropClick}>
      <div className="journey-modal">
        <button className="journey-modal-close" onClick={onClose} aria-label="Close">&#10005;</button>
        <h3 className="journey-modal-title">Vinay's Journey</h3>

        <div className="journey-pdf-viewer">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="journey-loading">Loading PDF…</div>}
            error={
              <div className="journey-error">
                Failed to load PDF.{error && <><br /><small>{error}</small></>}
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={Math.min(window.innerWidth * 0.8, 700)}
            />
          </Document>
        </div>

        {numPages && (
          <div className="journey-nav">
            <button
              className="journey-nav-btn"
              onClick={prev}
              disabled={pageNumber <= 1}
              aria-label="Previous page"
            >&#8592;</button>
            <span className="journey-page-info">{pageNumber} / {numPages}</span>
            <button
              className="journey-nav-btn"
              onClick={next}
              disabled={pageNumber >= numPages}
              aria-label="Next page"
            >&#8594;</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default JourneyModal;
