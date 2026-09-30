import { useState, ReactNode } from 'react';
import {
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  Skeleton,
  Paper,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { palette } from '../theme';

export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  loading?: boolean;
  error?: string | null;
  actions?: ReactNode;
  getRowId?: (row: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export default function DataTable<T>({
  columns,
  rows,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  sortBy,
  sortOrder,
  onSort,
  loading,
  error,
  actions,
  getRowId,
  selectable,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(search || '');

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearchChange?.(value);
  };

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(getRowId?.(r) || ''));
  const someSelected = rows.some((r) => selectedIds.includes(getRowId?.(r) || ''));

  const toggleAll = () => {
    if (allSelected) {
      const ids = rows.map((r) => getRowId?.(r) || '');
      onSelectionChange?.(selectedIds.filter((id) => !ids.includes(id)));
    } else {
      const ids = rows.map((r) => getRowId?.(r) || '');
      onSelectionChange?.([...new Set([...selectedIds, ...ids])]);
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter((s) => s !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {onSearchChange && (
          <TextField
            size="small"
            placeholder="Search..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        )}
        <Box sx={{ flex: 1 }} />
        {actions}
      </Box>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={{ bgcolor: palette.warmGrayLight }}>
                  <Checkbox
                    indeterminate={someSelected && !allSelected}
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sx={{ minWidth: col.minWidth, fontWeight: 600, bgcolor: palette.warmGrayLight }}
                >
                  {col.sortable && onSort ? (
                    <TableSortLabel
                      active={sortBy === col.id}
                      direction={sortBy === col.id ? sortOrder : 'asc'}
                      onClick={() => onSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {selectable && <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>}
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} align="center" sx={{ py: 6 }}>
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  hover
                  key={getRowId?.(row) || idx}
                  selected={selectedIds.includes(getRowId?.(row) || '')}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(getRowId?.(row) || '')}
                        onChange={() => toggleOne(getRowId?.(row) || '')}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
          {error}
        </Alert>
      )}
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={limit}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </Paper>
  );
}
