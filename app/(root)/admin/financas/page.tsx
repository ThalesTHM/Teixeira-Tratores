"use client";

import React, { useEffect, useState } from 'react';
import { FinancePieChart, EntityPieChart } from '@/components/utils/FinanceCharts';


const Finances = () => {
  const [stats, setStats] = useState({
    billsToPay: 0,
    billsToReceive: 0,
    clients: 0,
    projects: 0,
    suppliers: 0,
    employees: 0,
    totalPay: 0,
    totalReceive: 0,
    grossProfit: 0,
    loading: true,
    error: '',
  });

  useEffect(() => {
    const es = new EventSource('/api/entities/finance/summary');
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) {
          setStats({
            billsToPay: data.billsToPay || 0,
            billsToReceive: data.billsToReceive || 0,
            clients: data.clients || 0,
            projects: data.projects || 0,
            suppliers: data.suppliers || 0,
            employees: data.employees || 0,
            totalPay: data.totalPay || 0,
            totalReceive: data.totalReceive || 0,
            grossProfit: (data.totalReceive || 0) - (data.totalPay || 0),
            loading: false,
            error: '',
          });
        }
      } catch (e) {
        console.error('Error processing finance data:', e);
        setStats(prev => ({ ...prev, loading: false, error: 'Error loading finance dashboard.' }));
      }
    };

    es.onerror = () => {
      console.error("SSE connection error");
      setStats(prev => ({ ...prev, loading: false, error: 'Error connecting to server.' }));
      es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  if (stats.loading) {
    return (
      <div className="w-full h-full min-h-screen min-w-full bg-white flex flex-col items-center justify-start p-0 m-0">
        <div className="w-full max-w-6xl flex flex-col items-center justify-start px-8 py-12">
          <div className="h-10 w-1/2 bg-gray-200 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-10">
            <div className="bg-gray-100 rounded-lg p-0 shadow flex flex-col justify-center items-center border border-gray-200 w-full h-[400px] md:h-[500px]">
              <div className="h-8 w-1/3 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="h-64 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="bg-gray-100 rounded-lg p-0 shadow flex flex-col justify-center items-center border border-gray-200 w-full h-[400px] md:h-[500px]">
              <div className="h-8 w-1/3 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="h-64 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-10">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="p-6 bg-gray-100 rounded-lg shadow flex flex-col items-center border border-gray-200">
                <div className="h-6 w-1/2 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-10 w-1/3 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mb-10">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="p-4 bg-gray-100 rounded-lg shadow flex flex-col items-center border border-gray-200">
                <div className="h-6 w-1/2 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-8 w-1/3 bg-gray-200 rounded mb-2 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-gray-100 rounded-lg shadow p-6 mb-10 border border-gray-200 w-full">
            <div className="h-8 w-1/4 bg-gray-200 rounded mb-4 animate-pulse" />
            <ul className="space-y-2">
              {[...Array(8)].map((_, idx) => (
                <li key={idx} className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
  if (stats.error) {
    return <div className="text-red-500 text-center mt-10 text-lg font-semibold">{stats.error}</div>;
  }

  // Slate/gray theme, minimalistic, more info
  return (
    <div className="w-full h-full min-h-screen min-w-full bg-white flex flex-col items-center justify-start p-0 m-0 select-none">
      <div className="w-full max-w-6xl flex flex-col items-center justify-start px-8 py-12 select-none">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900 tracking-tight select-none">Painel Financeiro</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-10 select-none">
          <div className="bg-gray-100 rounded-lg p-0 shadow flex flex-col justify-center items-center border border-gray-200 w-full h-[400px] md:h-[500px]">
            <FinancePieChart billsToPay={stats.billsToPay} billsToReceive={stats.billsToReceive} />
          </div>
          <div className="bg-gray-100 rounded-lg p-0 shadow flex flex-col justify-center items-center border border-gray-200 w-full h-[400px] md:h-[500px]">
            <EntityPieChart clients={stats.clients} projects={stats.projects} suppliers={stats.suppliers} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-10 select-none">
          <div className="p-6 bg-gray-100 rounded-lg shadow flex flex-col items-center border border-gray-200">
            <span className="text-base font-medium text-gray-500 mb-1 tracking-tight">Contas a Pagar</span>
            <span className="text-4xl text-gray-900 font-extrabold mb-2">{stats.billsToPay}</span>
            <span className="text-xs text-gray-500">Total: <span className="font-bold text-gray-700">R$ {stats.totalPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow flex flex-col items-center border border-gray-200">
            <span className="text-base font-medium text-gray-500 mb-1 tracking-tight">Contas a Receber</span>
            <span className="text-4xl text-gray-900 font-extrabold mb-2">{stats.billsToReceive}</span>
            <span className="text-xs text-gray-500">Total: <span className="font-bold text-gray-700">R$ {stats.totalReceive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow flex flex-col items-center border border-gray-200">
            <span className="text-base font-medium text-gray-500 mb-1 tracking-tight">Lucro Bruto</span>
            <span className={`text-4xl font-extrabold mb-2 ${stats.grossProfit >= 0 ? 'text-gray-900' : 'text-red-500'}`}>{stats.grossProfit >= 0 ? '+' : '-'}R$ {Math.abs(stats.grossProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs text-gray-500">Receitas - Despesas</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mb-10 select-none">
          <div className="p-4 bg-gray-100 rounded-lg shadow flex flex-col items-center border border-gray-200">
            <span className="text-base font-medium text-gray-500 mb-1 tracking-tight">Clientes</span>
            <span className="text-3xl text-gray-900 font-bold mb-2">{stats.clients}</span>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg shadow flex flex-col items-center border border-gray-200">
            <span className="text-base font-medium text-gray-500 mb-1 tracking-tight">Projetos</span>
            <span className="text-3xl text-gray-900 font-bold mb-2">{stats.projects}</span>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg shadow flex flex-col items-center border border-gray-200">
            <span className="text-base font-medium text-gray-500 mb-1 tracking-tight">Fornecedores</span>
            <span className="text-3xl text-gray-900 font-bold mb-2">{stats.suppliers}</span>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg shadow flex flex-col items-center border border-gray-200">
            <span className="text-base font-medium text-gray-500 mb-1 tracking-tight">Funcionários</span>
            <span className="text-3xl text-gray-900 font-bold mb-2">{stats.employees}</span>
          </div>
        </div>
        {/* Extra financial info */}
        <div className="bg-gray-100 rounded-lg shadow p-6 mb-10 border border-gray-200 w-full select-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Informações Adicionais</h2>
          <ul className="text-gray-600 space-y-2">
            <li><b>Ticket Médio a Pagar:</b> R$ {stats.billsToPay > 0 ? (stats.totalPay / stats.billsToPay).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</li>
            <li><b>Ticket Médio a Receber:</b> R$ {stats.billsToReceive > 0 ? (stats.totalReceive / stats.billsToReceive).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</li>
            <li><b>Diferença de Contas:</b> {stats.billsToReceive - stats.billsToPay}</li>
            <li><b>Receita Líquida:</b> R$ {(stats.totalReceive - stats.totalPay).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
            <li><b>Proporção Contas a Receber/Pagar:</b> {stats.billsToPay > 0 ? (stats.billsToReceive / stats.billsToPay).toFixed(2) : '0.00'}</li>
            <li><b>Projetos por Cliente:</b> {stats.clients > 0 ? (stats.projects / stats.clients).toFixed(2) : '0.00'}</li>
            <li><b>Fornecedores por Projeto:</b> {stats.projects > 0 ? (stats.suppliers / stats.projects).toFixed(2) : '0.00'}</li>
            <li><b>Funcionários por Projeto:</b> {stats.projects > 0 ? (stats.employees / stats.projects).toFixed(2) : '0.00'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Finances;