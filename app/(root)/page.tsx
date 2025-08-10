"use client";
import React, { useState, useEffect } from 'react';
import { viewProjects } from '@/lib/project/view/actions';
import { viewClients } from '@/lib/client/view/actions';
import { viewSuppliers } from '@/lib/supplier/view/actions';
import { viewEmployees } from '@/lib/employee/view/actions';
import { viewBillsToPay } from '@/lib/bill/pay/view/actions';
import { viewBillsToReceive } from '@/lib/bill/recieve/view/actions';

function DashboardCard({ title, count, href, color, loading }: { title: string, count: string | number, href: string, color?: string, loading?: boolean }) {
  const bg = color || "bg-slate-100";
  const text = bg === "bg-white" ? "text-gray-900" : "text-gray-800";
  if (loading) {
    return (
      <div className={`block rounded-xl shadow-lg p-8 ${bg} ${text} border border-slate-200 animate-pulse`}>
        <div className="h-10 w-16 bg-slate-200 rounded mb-4" />
        <div className="h-6 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </div>
    );
  }
  return (
    <a href={href} className={`block rounded-xl shadow-lg p-8 ${bg} ${text} hover:scale-105 transition-transform border border-slate-200 hover:border-slate-400`}>
      <div className="text-4xl font-bold mb-2">{count}</div>
      <div className="text-xl font-semibold mb-1">{title}</div>
      <div className="text-sm opacity-80">Ver detalhes</div>
    </a>
  );
}

const Page = () => {
  const [counts, setCounts] = useState({
    projetos: 0,
    clientes: 0,
    fornecedores: 0,
    funcionarios: 0,
    contasPagar: 0,
    contasReceber: 0,
    loading: true
  });

  useEffect(() => {
    async function fetchCounts() {
      // TODO: Replace these with real fetches from your backend or Firestore
      const [projetos, clientes, fornecedores, funcionarios, contasPagar, contasReceber] = await Promise.all([
        fetchProjetosCount(),
        fetchClientesCount(),
        fetchFornecedoresCount(),
        fetchFuncionariosCount(),
        fetchContasPagarCount(),
        fetchContasReceberCount()
      ]);
      setCounts({
        projetos,
        clientes,
        fornecedores,
        funcionarios,
        contasPagar,
        contasReceber,
        loading: false
      });
    }
    fetchCounts();
  }, []);

  return (
    <div className="w-full h-full px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <DashboardCard title="Projetos" count={counts.projetos} href="/visualizar/projeto" color="bg-slate-100" loading={counts.loading} />
          <DashboardCard title="Clientes" count={counts.clientes} href="/visualizar/cliente" color="bg-slate-100" loading={counts.loading} />
          <DashboardCard title="Fornecedores" count={counts.fornecedores} href="/visualizar/fornecedor" color="bg-slate-100" loading={counts.loading} />
          <DashboardCard title="Funcionários" count={counts.funcionarios} href="/visualizar/funcionario" color="bg-slate-100" loading={counts.loading} />
          <DashboardCard title="Contas a Pagar" count={counts.contasPagar} href="/visualizar/conta/conta-a-pagar" color="bg-slate-100" loading={counts.loading} />
          <DashboardCard title="Contas a Receber" count={counts.contasReceber} href="/visualizar/conta/conta-a-receber" color="bg-slate-100" loading={counts.loading} />
        </div>
        <div className="text-sm text-gray-400 text-center mt-10">
          &copy; {new Date().getFullYear()} Teixeira Tratores. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}


// Real async functions for fetching counts
async function fetchProjetosCount() {
  const res = await viewProjects();
  return res.success && res.projects ? res.projects.length : 0;
}
async function fetchClientesCount() {
  const res = await viewClients();
  return res.success && res.clients ? res.clients.length : 0;
}
async function fetchFornecedoresCount() {
  const res = await viewSuppliers();
  return res.success && res.suppliers ? res.suppliers.length : 0;
}
async function fetchFuncionariosCount() {
  const res = await viewEmployees();
  return res.success && res.employees ? res.employees.length : 0;
}
async function fetchContasPagarCount() {
  const res = await viewBillsToPay();
  return res.success && res.bills ? res.bills.length : 0;
}
async function fetchContasReceberCount() {
  const res = await viewBillsToReceive();
  return res.success && res.bills ? res.bills.length : 0;
}

export default Page;