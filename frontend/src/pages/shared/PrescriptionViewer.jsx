import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Download } from 'lucide-react';
import styles from './PrescriptionViewer.module.css';

export default function PrescriptionViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const imageUrl = searchParams.get('url');
  const [zoom, setZoom] = useState(1);

  if (!imageUrl) {
    return (
      <div className={styles.errorContainer}>
        <h2>No Prescription Found</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'prescription-document.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className={styles.viewerWrapper}>
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={() => window.close() || navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className={styles.centerTools}>
          <button className={styles.toolBtn} onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
            <ZoomOut size={18} />
          </button>
          <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
          <button className={styles.toolBtn} onClick={() => setZoom(z => Math.min(3, z + 0.2))}>
            <ZoomIn size={18} />
          </button>
        </div>
        <button className={styles.toolBtn} onClick={handleDownload}>
          <Download size={18} /> Download
        </button>
      </div>

      <div className={styles.imageContainer}>
        <div className={styles.frame}>
          <img 
            src={imageUrl} 
            alt="Prescription Document" 
            style={{ transform: `scale(${zoom})` }}
            className={styles.image}
          />
        </div>
      </div>
    </div>
  );
}
