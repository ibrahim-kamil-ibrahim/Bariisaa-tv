import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, TextField, Card, CardContent, Typography, Chip, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, Skeleton, InputAdornment, Tabs, Tab } from '@mui/material';
import { Search, BookOpen, Users, PenTool, Grid3X3, CreditCard, Tag } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import FadeIn from '../../components/FadeIn';
import api from '../../services/api';

const TABS = ['All', 'Books', 'Users', 'Authors', 'Categories', 'Payments', 'Coupons'];

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(0);

  const typeMap: Record<string, string | undefined> = {
    All: undefined, Books: 'books', Users: 'users', Authors: 'authors',
    Categories: 'categories', Payments: 'payments', Coupons: 'coupons',
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['global-search', query, TABS[tab]],
    queryFn: () => api.get('/search', { params: { q: query, type: typeMap[TABS[tab]] } }).then((r) => r.data.data),
    enabled: query.length >= 2,
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <FadeIn>
      <Box>
        <PageHeader title="Global Search" subtitle="Search across all content and data" />

        <TextField
          fullWidth
          placeholder="Search books, users, authors, payments, coupons..."
          value={query}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={20} /></InputAdornment>,
          }}
          sx={{ mb: 3 }}
        />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          {TABS.map((t) => <Tab key={t} label={t} />)}
        </Tabs>

        {isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={60} />)}
          </Box>
        )}

        {!isLoading && !isFetching && query.length >= 2 && data && (
          <Box>
            {Object.entries(data).filter(([key]) => key !== 'suggestions').map(([key, val]: [string, any]) => (
              <Card key={key} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {key === 'books' && <BookOpen size={16} />}
                    {key === 'users' && <Users size={16} />}
                    {key === 'authors' && <PenTool size={16} />}
                    {key === 'categories' && <Grid3X3 size={16} />}
                    {key === 'payments' && <CreditCard size={16} />}
                    {key === 'coupons' && <Tag size={16} />}
                    {key} ({val.total})
                  </Typography>
                  <List dense>
                    {val.items.slice(0, 5).map((item: any) => (
                      <ListItem key={item.id} divider>
                        <ListItemAvatar>
                          <Avatar src={item.coverUrl || item.avatarUrl || item.photoUrl} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.title || item.name || item.code || item.gatewayTransactionId}
                          secondary={item.email || item.phone || item.status || ''}
                        />
                        {item.status && <Chip label={item.status} size="small" />}
                      </ListItem>
                    ))}
                  </List>
                  {val.total > 5 && <Typography variant="body2" color="text.secondary">+ {val.total - 5} more</Typography>}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {!isLoading && query.length < 2 && (
          <Typography color="text.secondary" textAlign="center" sx={{ mt: 4 }}>Type at least 2 characters to search</Typography>
        )}
      </Box>
    </FadeIn>
  );
}
