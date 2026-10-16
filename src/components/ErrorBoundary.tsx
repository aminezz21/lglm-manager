import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetData = () => {
    if (window.confirm("Voulez-vous réinitialiser les données locales pour corriger le problème ?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none font-sans">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle size={32} />
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Une erreur inattendue est survenue</h1>
              <p className="text-sm text-slate-400">
                L'application a rencontré un problème d'affichage. Vous pouvez recharger la page ou réinitialiser le cache local.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-lg text-left text-xs font-mono text-red-300 max-h-32 overflow-y-auto border border-slate-800">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw size={16} />
                Recharger l'application
              </button>

              <button
                onClick={this.handleResetData}
                className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-xs"
              >
                <Trash2 size={14} />
                Réinitialiser le cache et redémarrer
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
