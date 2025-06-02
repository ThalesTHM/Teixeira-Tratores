import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDownIcon } from 'lucide-react'
import React from 'react'

const SelectSkeleton = ({selectionText}: {selectionText: string}) => {
  return (
    <Skeleton className="
      bg-slate-100 rounded-md border shadow-xs 
      h-9 flex items-center relative
    ">
      <Skeleton className="
          text-sm light:text-gray-900 dark:text-gray-100 
          whitespace-nowrap overflow-hidden text-ellipsis 
          pl-3 pr-8 flex-1 select-none
      ">
        {selectionText}
      </Skeleton>

      <Skeleton className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
        <ChevronDownIcon className="h-4 w-4 opacity-50" aria-hidden="true" />
      </Skeleton>
    </Skeleton>
  )
}

export default SelectSkeleton