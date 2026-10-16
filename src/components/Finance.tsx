import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Download, 
  Printer, 
  Trash2, 
  Calendar,
  X,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { Expense, RevenueRecord } from '../types';

interface FinanceProps {
  expenses: Expense[];
  revenues: RevenueRecord[];
  onExpensesUpdated: (updatedExpenses: Expense[]) => void;
}

export default function Finance({ expenses, revenues, onExpensesUpdated }: FinanceProps) {
  // Expense Form Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('Entretien');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // General Filter State
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);

  // Months name array
  const monthsFr = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Financial calculations
  const calculateStats = () => {
    let dailyRevenues = 0;
    let monthlyRevenues = 0;
    let annualRevenues = 0;

    let monthlyExpenses = 0;
    let annualExpenses = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    // Revenues summing
    revenues.forEach(rev => {
      const revDate = rev.date;
      const parts = revDate.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);

        if (revDate === todayStr) {
          dailyRevenues += rev.amount;
        }
        if (y === reportYear) {
          annualRevenues += rev.amount;
          if (m === reportMonth) {
            monthlyRevenues += rev.amount;
          }
        }
      }
    });

    // Expenses summing
    expenses.forEach(exp => {
      const expDate = exp.date;
      const parts = expDate.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);

        if (y === reportYear) {
          annualExpenses += exp.amount;
          if (m === reportMonth) {
            monthlyExpenses += exp.amount;
          }
        }
      }
    });

    const monthlyProfits = monthlyRevenues - monthlyExpenses;
    const annualProfits = annualRevenues - annualExpenses;

    return {
      dailyRevenues,
      monthlyRevenues,
      annualRevenues,
      monthlyExpenses,
      annualExpenses,
      monthlyProfits,
      annualProfits
    };
  };

  const stats = calculateStats();

  // Add Expense handler
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || expenseAmount <= 0) {
      alert("Veuillez saisir une description et un montant valide.");
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      description: expenseDesc,
      amount: expenseAmount,
      date: expenseDate,
      category: expenseCategory
    };

    onExpensesUpdated([newExpense, ...expenses]);
    
    // Reset state & close
    setExpenseDesc('');
    setExpenseAmount(0);
    setExpenseCategory('Entretien');
    setIsExpenseModalOpen(false);
  };

  // Delete Expense handler
  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Voulez-vous supprimer cette ligne de dépense ?")) {
      const updated = expenses.filter(e => e.id !== id);
      onExpensesUpdated(updated);
    }
  };

  // Monthly breakdown of revenues and expenses for selected year
  const getMonthlyTrendData = () => {
    return monthsFr.map((mName, index) => {
      const monthNum = index + 1;
      let revAmount = 0;
      let expAmount = 0;

      revenues.forEach(rev => {
        const parts = rev.date.split('-');
        if (parts.length >= 2 && parseInt(parts[0]) === reportYear && parseInt(parts[1]) === monthNum) {
          revAmount += rev.amount;
        }
      });

      expenses.forEach(exp => {
        const parts = exp.date.split('-');
        if (parts.length >= 2 && parseInt(parts[0]) === reportYear && parseInt(parts[1]) === monthNum) {
          expAmount += exp.amount;
        }
      });

      return {
        monthName: mName.substring(0, 4),
        revenue: revAmount,
        expense: expAmount,
        profit: revAmount - expAmount
      };
    });
  };

  const trendData = getMonthlyTrendData();
  const maxTrendVal = Math.max(...trendData.flatMap(d => [d.revenue, d.expense]), 5000);

  // Expense breakdown by categories
  const getCategoryBreakdown = () => {
    const categories: Record<Expense['category'], number> = {
      'Entretien': 0,
      'Carburant': 0,
      'Assurance': 0,
      'Salaire': 0,
      'Impôts': 0,
      'Autre': 0
    };

    expenses.forEach(exp => {
      const parts = exp.date.split('-');
      if (parts.length >= 2 && parseInt(parts[0]) === reportYear && parseInt(parts[1]) === reportMonth) {
        categories[exp.category] += exp.amount;
      }
    });

    return categories;
  };

  const categoryBreakdown = getCategoryBreakdown();

  // Excel (CSV) Export Simulation
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Date,Description,Categorie,Montant (DT)\n";

    // Append revenues
    revenues.forEach(r => {
      csvContent += `Revenu,${r.date},"${r.description.replace(/"/g, '""')}",Location,${r.amount}\n`;
    });

    // Append expenses
    expenses.forEach(e => {
      csvContent += `Depense,${e.date},"${e.description.replace(/"/g, '""')}",${e.category},${e.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_financier_${reportYear}_${reportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="finance-root">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-xs gap-4" id="finance-header-section">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-[#0F2C59]" />
            Gestion Financière & Comptabilité
          </h2>
          <p className="text-xs text-gray-500">
            Suivi des flux de trésorerie de l'agence, bilan dépenses, calcul de rentabilité mensuelle et annuelle.
          </p>
        </div>
        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="bg-[#0F2C59] hover:bg-blue-900 text-white font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          Enregistrer une Dépense
        </button>
      </div>

      {/* Report Filtering & Actions */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-wrap gap-3 items-center justify-between" id="report-controls">
        <div className="flex items-center gap-2" id="period-dropdowns">
          <span className="text-xs font-bold text-gray-500">Période du Bilan :</span>
          <select 
            value={reportMonth}
            onChange={e => setReportMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none"
          >
            {monthsFr.map((m, idx) => (
              <option key={idx} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select 
            value={reportYear}
            onChange={e => setReportYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none"
          >
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
          </select>
        </div>

        <div className="flex gap-2" id="report-export-buttons">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            Exporter Excel (CSV)
          </button>
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} />
            Imprimer Rapport Bilan
          </button>
        </div>
      </div>

      {/* Mini financial report cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="finance-stats-grid">
        {/* Total Revenues */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Recettes de la Période</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-gray-800">{(Number(stats.monthlyRevenues) || 0).toLocaleString('fr-TN')} DT</h3>
            <span className="text-xs text-gray-400">Annuel: {(Number(stats.annualRevenues) || 0).toLocaleString('fr-TN')} DT</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded w-max mt-2">
            ▲ Entrées de location de voitures
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dépenses de la Période</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-rose-600">{(Number(stats.monthlyExpenses) || 0).toLocaleString('fr-TN')} DT</h3>
            <span className="text-xs text-gray-400">Annuel: {(Number(stats.annualExpenses) || 0).toLocaleString('fr-TN')} DT</span>
          </div>
          <p className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded w-max mt-2">
            ▼ Charges & Maintenance
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bénéfices Nets</span>
          <div className="flex items-baseline justify-between">
            <h3 className={`text-xl font-black ${stats.monthlyProfits >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(Number(stats.monthlyProfits) || 0).toLocaleString('fr-TN')} DT
            </h3>
            <span className="text-xs text-gray-400">Annuel: {(Number(stats.annualProfits) || 0).toLocaleString('fr-TN')} DT</span>
          </div>
          <p className={`text-[10px] font-bold px-2 py-0.5 rounded w-max mt-2 ${
            stats.monthlyProfits >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {stats.monthlyProfits >= 0 ? '● Rentabilité Positive' : '● Déficit Trésorerie'}
          </p>
        </div>
      </div>

      {/* Dual Column layout: SVG Trends Chart vs Expenses list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="finance-main-panels">
        {/* Trend chart card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col justify-between" id="trends-card-panel">
          <div>
            <h4 className="font-bold text-gray-800 text-xs uppercase pb-3 border-b border-gray-50 mb-4">
              Comparatif Recettes vs Dépenses Mensuelles (DT)
            </h4>

            {/* Custom SVG Dual Bar Chart */}
            <div className="h-64 relative w-full flex items-end justify-between px-2 gap-2 mt-4" id="svg-trends-container">
              {trendData.map((d, idx) => {
                const percentRev = (d.revenue / maxTrendVal) * 100;
                const percentExp = (d.expense / maxTrendVal) * 100;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="flex items-end gap-1 h-44 w-full justify-center">
                      {/* Revenue Bar (Blue) */}
                      <div 
                        className="w-2 rounded-t-xs bg-[#0F2C59] transition-all relative"
                        style={{ height: `${Math.max(percentRev, 4)}%` }}
                        title={`Recettes : ${(Number(d.revenue) || 0).toLocaleString('fr-TN')} DT`}
                      ></div>
                      {/* Expense Bar (Rose) */}
                      <div 
                        className="w-2 rounded-t-xs bg-rose-500 transition-all relative"
                        style={{ height: `${Math.max(percentExp, 4)}%` }}
                        title={`Dépenses : ${(Number(d.expense) || 0).toLocaleString('fr-TN')} DT`}
                      ></div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-semibold mt-2">{d.monthName}</span>
                  </div>
                );
              })}

              {/* Grid guides */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none -z-10 h-44 border-b border-gray-100">
                <div className="w-full border-t border-dashed border-gray-100"></div>
                <div className="w-full border-t border-dashed border-gray-100"></div>
                <div className="w-full border-t border-dashed border-gray-100"></div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 text-xs font-medium text-gray-600 bg-gray-50 p-2.5 rounded-lg mt-4">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-[#0F2C59] rounded-xs"></span>
              Recettes Location
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-rose-500 rounded-xs"></span>
              Charges / Dépenses
            </span>
          </div>
        </div>

        {/* Expenses Categorization breakdown */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between" id="categories-breakdown-panel">
          <div>
            <h4 className="font-bold text-gray-800 text-xs uppercase pb-3 border-b border-gray-50 mb-4">
              Ventilation des Dépenses ({monthsFr[reportMonth - 1]})
            </h4>

            <div className="space-y-4" id="category-bars">
              {Object.entries(categoryBreakdown).map(([cat, amount]) => {
                const totalMonthExpenses = stats.monthlyExpenses || 1;
                const ratio = (amount / totalMonthExpenses) * 100;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">{cat}</span>
                      <span className="font-bold text-gray-900">{(Number(amount) || 0).toLocaleString('fr-TN')} DT</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all"
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-400 mt-4 leading-relaxed">
            💡 Les catégories sont ventilées automatiquement à chaque enregistrement d'une note de frais.
          </div>
        </div>
      </div>

      {/* Ledger lists (Revenues & Expenses detailed logs tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="ledger-tables-wrapper">
        {/* Expenses List Panel */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
          <h4 className="font-bold text-gray-800 text-xs uppercase pb-2 border-b border-gray-50 flex items-center justify-between">
            <span>Journal des charges & Dépenses</span>
            <span className="text-[10px] text-gray-400">Total : {expenses.length} lignes</span>
          </h4>

          <div className="overflow-y-auto max-h-72" id="expenses-table-scroller">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase border-b border-gray-100">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Libellé / Catégorie</th>
                  <th className="py-2.5 px-3 text-right">Montant</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">Aucune dépense enregistrée.</td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-3 font-mono text-gray-500">{exp.date}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-800">{exp.description}</div>
                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 mt-0.5 uppercase">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-rose-600">
                        {(Number(exp.amount) || 0).toLocaleString('fr-TN')} DT
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                          title="Supprimer la dépense"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenues List Panel */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
          <h4 className="font-bold text-gray-800 text-xs uppercase pb-2 border-b border-gray-50 flex items-center justify-between">
            <span>Registre des Recettes & Encaissements</span>
            <span className="text-[10px] text-gray-400">Total : {revenues.length} lignes</span>
          </h4>

          <div className="overflow-y-auto max-h-72" id="revenues-table-scroller">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase border-b border-gray-100">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description du versement</th>
                  <th className="py-2.5 px-3 text-right">Montant perçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                {revenues.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400 font-medium">Aucun encaissement enregistré.</td>
                  </tr>
                ) : (
                  revenues.map(rev => (
                    <tr key={rev.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-3 font-mono text-gray-500">{rev.date}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-800">{rev.description}</div>
                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 mt-0.5 uppercase">
                          {rev.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-600">
                        {(Number(rev.amount) || 0).toLocaleString('fr-TN')} DT
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Dialog PopUp */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="expense-modal">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-sm w-full overflow-hidden flex flex-col">
            <div className="bg-[#0F2C59] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={16} />
                Enregistrer une Note de frais
              </h3>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-white hover:text-gray-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description / Motif *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Vidange Clio 5"
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Montant Brut (DT) *</label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Catégorie Dépense</label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value as Expense['category'])}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Entretien">Entretien & Maintenance</option>
                  <option value="Carburant">Carburant</option>
                  <option value="Assurance">Assurance & Protection</option>
                  <option value="Salaire">Salaires & Commissions Chauffeurs</option>
                  <option value="Impôts">Vignettes, Taxes & Impôts</option>
                  <option value="Autre">Autres frais généraux</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date comptabilisation *</label>
                <input 
                  type="date"
                  required
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
