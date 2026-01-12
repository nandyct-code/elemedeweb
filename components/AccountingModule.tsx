import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus } from '../types';

interface AccountingModuleProps {
  invoices: Invoice[];
  businessName: string;
  businessNif: string;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({ invoices, businessName, businessNif }) => {
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3) + 1);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchQuarter = inv.quarter === selectedQuarter;
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchQuarter && matchStatus;
    });
  }, [invoices, selectedQuarter, filterStatus]);

  const stats = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => {
      acc.total_base += inv.base_amount;
      acc.total_iva += inv.iva_amount;
      acc.total_irpf += inv.irpf_amount;
      acc.total_net += inv.total_amount;
      return acc;
    }, { total_base: 0, total_iva: 0, total_irpf: 0, total_net: 0 });
  }, [filteredInvoices]);

  const downloadPDF = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Factura ${invoice.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a202c; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #edf2f7; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="flex justify-between items-start mb-12">
              <div>
                <h1 class="text-4xl font-black text-gray-900 tracking-tighter uppercase italic mb-2">ELEMEDE</h1>
                <p class="text-xs font-bold text-orange-600 uppercase tracking-widest">Ecosistema Premium de Repostería</p>
              </div>
              <div class="text-right">
                <h2 class="text-xl font-black text-gray-900 uppercase">FACTURA</h2>
                <p class="text-sm font-bold text-gray-400">Nº ${invoice.id}</p>
                <p class="text-sm font-bold text-gray-400">Fecha: ${invoice.date}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-10 mb-12">
              <div class="bg-gray-50 p-6 rounded-2xl">
                <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">EMISOR (TU NEGOCIO)</h3>
                <p class="font-bold text-gray-900">${invoice.business_name}</p>
                <p class="text-sm text-gray-600">NIF: ${invoice.business_nif}</p>
              </div>
              <div class="bg-gray-50 p-6 rounded-2xl">
                <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">CLIENTE / RECEPTOR</h3>
                <p class="font-bold text-gray-900">${invoice.client_name}</p>
                <p class="text-sm text-gray-600">NIF: ${invoice.client_nif}</p>
              </div>
            </div>

            <table class="w-full mb-12">
              <thead>
                <tr class="border-b-2 border-gray-100">
                  <th class="text-left py-4 text-[10px] font-black text-gray-400 uppercase">Concepto</th>
                  <th class="text-right py-4 text-[10px] font-black text-gray-400 uppercase">Importe Base</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-50">
                  <td class="py-6 font-bold text-gray-800">${invoice.concept}</td>
                  <td class="py-6 text-right font-black text-gray-900">${invoice.base_amount.toFixed(2)}€</td>
                </tr>
              </tbody>
            </table>

            <div class="flex justify-end">
              <div class="w-64 space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400 font-bold uppercase">Base Imponible:</span>
                  <span class="font-black">${invoice.base_amount.toFixed(2)}€</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400 font-bold uppercase">IVA (${invoice.iva_rate}%):</span>
                  <span class="font-black text-orange-600">+ ${invoice.iva_amount.toFixed(2)}€</span>
                </div>
                ${invoice.irpf_rate > 0 ? `
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400 font-bold uppercase">Retención IRPF (${invoice.irpf_rate}%):</span>
                  <span class="font-black text-red-500">- ${invoice.irpf_amount.toFixed(2)}€</span>
                </div>
                ` : ''}
                <div class="h-px bg-gray-100 my-4"></div>
                <div class="flex justify-between items-center">
                  <span class="text-xs font-black text-gray-900 uppercase tracking-widest">TOTAL NETO:</span>
                  <span class="text-2xl font-black text-gray-900 tracking-tighter">${invoice.total_amount.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            <div class="mt-20 pt-10 border-t border-gray-50 text-center">
              <p class="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">Documento generado por ELEMEDE Fiscal Core • Sin validez contable en modo DEMO</p>
            </div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const downloadMonthlyReport = () => {
    alert(`Generando reporte consolidado del Mes para ${businessName}... (Simulación de descarga CSV/PDF)`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Resumen Trimestral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Facturación Base', val: stats.total_base, color: 'text-gray-900' },
          { label: 'IVA Repercutido', val: stats.total_iva, color: 'text-orange-600' },
          { label: 'IRPF Retenido', val: stats.total_irpf, color: 'text-red-500' },
          { label: 'Total Neto', val: stats.total_net, color: 'text-indigo-600' }
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border-2 border-gray-50 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.val.toFixed(2)}€</p>
          </div>
        ))}
      </div>

      {/* Controles de Filtro */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(q => (
            <button 
              key={q}
              onClick={() => setSelectedQuarter(q)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedQuarter === q ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-400 hover:text-gray-600'}`}
            >
              Q{q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-orange-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Todos los Estados</option>
            <option value="paid">Pagadas</option>
            <option value="unpaid">Pendientes</option>
          </select>
          <button 
            onClick={downloadMonthlyReport}
            className="bg-white border border-gray-200 text-gray-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-gray-900 hover:text-white transition-all shadow-sm"
          >
            Reporte Mensual 📊
          </button>
        </div>
      </div>

      {/* Tabla Financiera */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-50 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-400">
            <tr>
              <th className="px-8 py-5">Factura ID / Concepto</th>
              <th className="px-8 py-5">Cliente</th>
              <th className="px-8 py-5">Base / Impuestos</th>
              <th className="px-8 py-5">Estado</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <p className="text-gray-300 font-bold uppercase text-xs tracking-[0.3em]">Sin movimientos este trimestre</p>
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-[11px] font-mono font-black text-gray-900">{inv.id}</p>
                    <p className="text-[10px] font-bold text-gray-400 truncate max-w-[200px] mt-1">{inv.concept}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-gray-900 uppercase leading-none">{inv.client_name}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">NIF: {inv.client_nif}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-gray-900 leading-none">{inv.base_amount.toFixed(2)}€</p>
                    <p className="text-[9px] font-bold text-orange-500 mt-1 uppercase">IVA +{inv.iva_amount}€ • IRPF -{inv.irpf_amount}€</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {inv.status === 'paid' ? 'COMPLETADA' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => downloadPDF(inv)}
                      className="px-5 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md active:scale-95"
                    >
                      Descargar PDF 📥
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};