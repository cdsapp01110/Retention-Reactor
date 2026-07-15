import { useState } from 'react';

const KEYWORDS = ['WITH','SELECT','FROM','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','GROUP BY','ORDER BY','WHERE','AND','OR','CASE','WHEN','THEN','ELSE','END','AS','ON','DISTINCT','COUNT','SUM','AVG','ROUND','MAX','MIN','LAG','LEAD','NTILE','OVER','PARTITION BY','ROWS BETWEEN','PRECEDING','CURRENT ROW','BETWEEN','AND','NULLIF','LEAST','GREATEST','DATE_TRUNC','DATE_PART','AGE','LIMIT','UNION ALL','DESC','ASC','TRUE','FALSE'];

function escapeHtml(s){ return s.replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>'); }

function highlight(sql){
  let html = escapeHtml(sql);
  // comments first (line-level)
  html = html.replace(/(--[^\n]*)/g, '<span class="text-muted-foreground/70 italic">$1</span>');
  // strings
  html = html.replace(/('[^']*')/g, '<span class="text-chart-4">$1</span>');
  // keywords (longest first)
  const kws = [...KEYWORDS].sort((a,b)=>b.length-a.length);
  for (const kw of kws){
    const re = new RegExp('\\b'+kw.replace(/ /g,'\\s+')+'\\b','g');
    html = html.replace(re, '<span class="text-chart-2 font-semibold">'+kw+'</span>');
  }
  // numbers
  html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="text-chart-5">$1</span>');
  return html;
}

export default function SqlBlock({ code, title }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1500); };
  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/70 bg-background/40">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-chart-4/70" />
          <span className="h-3 w-3 rounded-full bg-chart-2/70" />
          <span className="h-3 w-3 rounded-full bg-chart-1/70" />
          {title && <span className="ml-2 text-xs text-muted-foreground font-mono">{title}</span>}
        </div>
        <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed font-mono text-foreground/90">
        <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
    </div>
  );
}