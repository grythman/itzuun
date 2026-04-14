"use client";

export function ChatBubble({ mine, text, time, fileName, fileUrl }: { mine: boolean; text: string; time?: string; fileName?: string; fileUrl?: string }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] ${
          mine ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-800"
        }`}
      >
        <p>{text}</p>
        {fileName ? (
          <div className={`mt-1 flex items-center gap-1 ${mine ? "text-brand-200" : "text-surface-500"}`}>
            <span>📎</span>
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-opacity-80">
                {fileName}
              </a>
            ) : (
              <span>{fileName}</span>
            )}
          </div>
        ) : null}
        {time ? <p className={`mt-1 text-[11px] ${mine ? "text-brand-200" : "text-surface-400"}`}>{time}</p> : null}
      </div>
    </div>
  );
}
