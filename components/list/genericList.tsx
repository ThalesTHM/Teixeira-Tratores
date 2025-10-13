import React from 'react'
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { Card } from '../ui/card';
import { capitalize } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

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

const GenericList = ({ listTitle, items, loading, error }: { listTitle: string, items: GenericItem[], loading: boolean, error: string | undefined}) => {
  let title = getTitle(listTitle);

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

  if (!items.length) {
    return (
      <div className="flex justify-center items-center h-full w-full mt-10">
        <p className="text-lg text-gray-500">Nenhum{checkListTitleGender(listTitle) == "f" && 'a'} {capitalize(listTitle)} Encontrado</p>
      </div>
    );
  }

  return (
    <div className='w-full items-center flex flex-col'>
     <div className='flex flex-col gap-4 w-full max-w-2xl mx-auto'>
      <h1 className="text-3xl font-extrabold">{title}</h1>
     </div>
     <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-10 mb-8">
      {items.map((item) => {
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
      })}
    </div>
    </div>
  )
}

export default GenericList