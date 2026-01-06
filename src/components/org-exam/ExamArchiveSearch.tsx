import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';

interface ExamArchiveSearchProps {
  onSearch: (filters: SearchFilters) => void;
  subjects: string[];
}

export interface SearchFilters {
  query: string;
  subject: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const initialFilters: SearchFilters = {
  query: '',
  subject: '',
  status: '',
  dateFrom: '',
  dateTo: '',
};

export default function ExamArchiveSearch({ onSearch, subjects }: ExamArchiveSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    onSearch(initialFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exams by title..."
            value={filters.query}
            onChange={(e) => handleChange('query', e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/30">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
            <Select value={filters.subject} onValueChange={(v) => handleChange('subject', v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All subjects</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <Select value={filters.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From Date</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To Date</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      )}
    </div>
  );
}
