import { useState } from 'react';
import { useReportStatus } from '../hooks/useReportStatus';
import ReportArticleSheet from './ReportArticleSheet';
import { F7Icon } from './F7Icon';

export default function ReportFlagButton({ articleId, size = 28, overlay = false }) {
  const { reported, markReported } = useReportStatus(articleId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!reported) setSheetOpen(true);
  };

  return (
    <>
      <button
        aria-label={reported ? 'Article reported' : 'Report article'}
        onClick={handleClick}
        className="cursor-pointer"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: overlay ? 'rgba(0,0,0,0.4)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          padding: 0,
          zIndex: 10,
        }}
      >
        <F7Icon
          name={reported ? 'flag_fill' : 'flag'}
          size={size * 0.55}
          color={reported ? '#ef4444' : overlay ? 'rgba(255,255,255,0.8)' : 'var(--text-color)'}
        />
      </button>
      <ReportArticleSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        articleId={articleId}
        onReported={markReported}
      />
    </>
  );
}
