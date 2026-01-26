import { useState, useEffect } from 'react';
import { X, Scale, FileText, Check } from 'lucide-react';
import { ProcesoSumarial, RevisionJuridica, TipoRevisionJuridica } from '@/types';

interface ModalRevisionJuridicaProps {
  isOpen: boolean;
  onClose: () => void;
  proceso: ProcesoSumarial;
  onGuardar: (data: RevisionJuridica) => Promise<void>;
}

export const ModalRevisionJuridica = ({
  isOpen,
  onClose,
  proceso,
  onGuardar,
}: ModalRevisionJuridicaProps) => {
  const [revisionRealizada, setRevisionRealizada] = useState(false);
  const [tipoRevision, setTipoRevision] = useState<TipoRevisionJuridica>(null);
  const [numeroMemo, setNumeroMemo] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (proceso.revision_juridica) {
      setRevisionRealizada(proceso.revision_juridica.revision_realizada);
      setTipoRevision(proceso.revision_juridica.tipo_revision);
      setNumeroMemo(proceso.revision_juridica.numero_memo || '');
    } else {
      setRevisionRealizada(false);
      setTipoRevision(null);
      setNumeroMemo('');
    }
  }, [proceso, isOpen]);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onGuardar({
        revision_realizada: revisionRealizada,
        tipo_revision: revisionRealizada ? tipoRevision : null,
        numero_memo: revisionRealizada && tipoRevision && tipoRevision !== 'pendiente_de_revision' ? numeroMemo : null,
        fecha_revision: revisionRealizada ? { toDate: () => new Date() } as any : null,
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar revisión jurídica:', error);
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Scale className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">Revisión Jurídica</h3>
              <p className="text-sm text-gray-500">Resolución {proceso.numero_resolucion}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Toggle Revisión Jurídica */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <FileText className="text-indigo-600" size={20} />
              <span className="font-medium text-indigo-900">Revisión Jurídica</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={revisionRealizada}
                onChange={(e) => {
                  setRevisionRealizada(e.target.checked);
                  if (!e.target.checked) {
                    setTipoRevision(null);
                    setNumeroMemo('');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Tipo de Revisión */}
          {revisionRealizada && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Tipo de Revisión *
                </label>
                <select
                  value={tipoRevision || ''}
                  onChange={(e) => {
                    setTipoRevision(e.target.value as TipoRevisionJuridica);
                    setNumeroMemo('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="reapertura">Reapertura</option>
                  <option value="acoge_propuesta_fiscal">Acoge Propuesta del Fiscal</option>
                  <option value="pendiente_de_revision">Pendiente de Revisión</option>
                </select>
              </div>

              {/* Número de Memo */}
              {tipoRevision && tipoRevision !== 'pendiente_de_revision' && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-text mb-2">
                    Número de Memo *
                  </label>
                  <input
                    type="text"
                    value={numeroMemo}
                    onChange={(e) => setNumeroMemo(e.target.value)}
                    placeholder="Ej: MEMO-2024-001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || (revisionRealizada && (!tipoRevision || (tipoRevision !== 'pendiente_de_revision' && !numeroMemo)))}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} />
            <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
