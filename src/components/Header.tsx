import React from 'react';

interface HeaderProps {
  onOpenModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenModal }) => {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            HD
          </div>
          <h1 className="text-xl font-bold text-gray-900">Helpdesk Web</h1>
        </div>
        <button
          onClick={onOpenModal}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          + Novo Chamado
        </button>
      </div>
    </header>
  );
};