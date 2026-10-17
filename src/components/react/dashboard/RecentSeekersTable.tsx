import React from 'react';
import { DataTable, type Column } from '../DataTable';
import { Badge } from '../ui/Badge';

export interface SeekerRow {
  seeker_id: string;
  name: string;
  mobile: string;
  date: string;
  status: string;
}

interface RecentSeekersTableProps {
  data: SeekerRow[];
  headers: {
    seekerId: string;
    name: string;
    mobile: string;
    date: string;
    status: string;
    search: string;
  };
}

export const RecentSeekersTable: React.FC<RecentSeekersTableProps> = ({ data, headers }) => {
  const columns: Column<SeekerRow>[] = [
    { header: headers.seekerId, accessorKey: 'seeker_id', sortable: true },
    { header: headers.name, accessorKey: 'name', sortable: true },
    { header: headers.mobile, accessorKey: 'mobile' },
    { header: headers.date, accessorKey: 'date', sortable: true },
    {
      header: headers.status,
      accessorKey: 'status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'sage' : 'gray'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder={headers.search}
      pageSize={5}
    />
  );
};
