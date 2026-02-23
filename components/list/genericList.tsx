import React, { useState, useRef, useEffect } from 'react'
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { Card } from '../ui/card';
import { capitalize } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { CalendarIcon, Search, Sliders } from 'lucide-react';

interface GenericItem {
    name: string;
    slug: string;
    createdAt: Date;
};

const checkListTitleGender = (listTitle: string) => {
  const male = ["cliente", "projeto", "fornecedor", "funcionario"];

  return male.includes(listTitle) ? "m" : "f";
}

const getTitle = (listTitle: string) => {
  const titleArr = listTitle.split('/');

  if(titleArr[1] == "conta-a-receber"){
    return "Visualizando as Contas a Receber";
  }

  if(titleArr[1] == "conta-a-pagar") {
    return "Visualizando as Contas a Pagar";
  }

  if(titleArr[0] == "fornecedor"){
    return "Visualizando os Fornecedores";
  }

  if(titleArr[0] == "funcionario"){
    return "Visualizando os Funcionários";
  }

  if(checkListTitleGender(titleArr[0]) == "m"){
    return "Visualizando os " + capitalize(titleArr[0]) + "s";
  }

  return "Visualizando as " + capitalize(titleArr[0]) + "s";
}

const GenericList = ({ listTitle, items = [], loading, error }: { listTitle: string, items?: GenericItem[], loading: boolean, error: string | undefined}) => {
  let title = getTitle(listTitle);

  // Search and date filter state (Option B: big centered search + Filters dropdown)
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const filtersRef = useRef<HTMLDivElement | null>(null);

  // Filter items using applied date filters
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const created = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
    const afterStart = !appliedStartDate || created >= new Date(appliedStartDate);
    const beforeEnd = !appliedEndDate || created <= new Date(appliedEndDate);
    return matchesSearch && afterStart && beforeEnd;
  });

  // Close filters when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!showFilters) return;
      const el = filtersRef.current;
      if (el && !el.contains(e.target as Node)) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="forms-error">Erro Ao Buscar Projetos</p>
      </div>
    );
  }

  

  return (
    <div className='w-full items-center flex flex-col'>
     <div className='flex flex-col gap-4 w-full max-w-2xl mx-auto'>
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {/* Option B: Centered big search + Filters dropdown/panel (responsive) */}
      <div className="w-full max-w-2xl mx-auto mt-4 px-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Input
              type="text"
              placeholder="Buscar pelo nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-12 text-lg rounded-lg bg-input text-foreground border-border focus:ring-ring"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="relative" ref={filtersRef}>
              <button
                onClick={() => setShowFilters(v => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-popover text-popover-foreground border-border rounded-lg shadow-sm hover:bg-popover/95"
                aria-expanded={showFilters}
              >
                <Sliders size={16} />
                <span className="text-sm">Filtros</span>
              </button>

              {showFilters && (
                <div className="mt-2 w-full sm:absolute sm:right-0 sm:w-64 bg-popover text-popover-foreground border-border rounded-lg p-3 shadow-lg z-20">
                <label className="text-xs text-muted-foreground">Data Inicial</label>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="text-muted-foreground" size={18} />
                  <Input
                    type="date"
                    value={tempStartDate}
                    onChange={e => setTempStartDate(e.target.value)}
                    className="w-full rounded-md bg-input text-foreground border-border pl-3"
                  />
                </div>

                <label className="text-xs text-muted-foreground">Data Final</label>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="text-muted-foreground" size={18} />
                  <Input
                    type="date"
                    value={tempEndDate}
                    onChange={e => setTempEndDate(e.target.value)}
                    className="w-full rounded-md bg-input text-foreground border-border pl-3"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTempStartDate('');
                      setTempEndDate('');
                      setAppliedStartDate('');
                      setAppliedEndDate('');
                      setShowFilters(false);
                    }}
                  >
                    Reset
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setAppliedStartDate(tempStartDate);
                        setAppliedEndDate(tempEndDate);
                        setShowFilters(false);
                      }}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
     </div>
     <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10 mb-8">
      {filteredItems.length === 0 ? (
        <div className="w-full bg-card text-muted-foreground rounded-lg p-6 shadow-sm">
          <p className="text-center">Nenhum{checkListTitleGender(listTitle) == "f" && 'a'} {capitalize(listTitle)} Encontrado</p>
          <p className="text-center text-sm mt-2 text-muted-foreground/80">Tente limpar a busca ou ajustar os filtros.</p>
        </div>
      ) : (
        filteredItems.map((item) => {
        const key = item.slug || item.name || Math.random().toString(36);
        return (
          <Link
            key={key}
            href={`/visualizando/${listTitle}/${item.slug}`}
            className="no-underline"
          >
            <Card className="p-4 flex flex-row items-center justify-between shadow-md hover:bg-gray-100 transition-colors cursor-pointer">
              <span className="text-lg font-medium break-words truncate whitespace-normal">{item.name}</span>
              <span className="text-xs text-gray-400">
                {formatDate(item.createdAt)}
              </span>
            </Card>
          </Link>
        );
        })
      )}
    </div>
    </div>
  )
}

export default GenericList