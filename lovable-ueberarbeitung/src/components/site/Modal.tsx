import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Schlankes Dialogfenster auf Basis von <dialog>: Fokus bleibt im Fenster,
 * Escape schließt, danach springt der Fokus zurück zum auslösenden Knopf.
 */
export function Modal({ offen, onClose, titel, children }: { offen: boolean; onClose: () => void; titel: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) d.showModal();
    if (!offen && d.open) d.close();
  }, [offen]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-titel"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border bg-card p-0 text-card-foreground shadow-lift backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {offen && (
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id="modal-titel" className="text-xl">{titel}</h2>
            <button type="button" onClick={onClose} aria-label="Schließen" className="-m-2 rounded-lg p-2 hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
