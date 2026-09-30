import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Rating,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../services/api';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => api.get(`/books/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!book) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Book not found</Typography>
        <Button onClick={() => navigate('/books')} sx={{ mt: 2 }}>
          Back to Books
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/books')}>
          Back
        </Button>
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          {book.title}
        </Typography>
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/books/${id}/edit`)}>
          Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4} key="cover-card">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                src={book.coverUrl || ''}
                variant="rounded"
                sx={{ width: '100%', height: 300, mb: 2, borderRadius: 2 }}
              >
                {book.title?.charAt(0)}
              </Avatar>
              {book.thumbnailUrl && (
                <Avatar
                  src={book.thumbnailUrl}
                  variant="rounded"
                  sx={{ width: 80, height: 80, mx: 'auto' }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8} key="info-card">
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Book Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={book.status}
                    size="small"
                    color="success"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={book.rating || 0} readOnly precision={0.5} />
                    <Typography variant="body2">
                      ({book.ratingCount || 0})
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" mb={1}>
                Description
              </Typography>
              <Typography variant="body1" mb={2}>
                {book.description || 'No description'}
              </Typography>

              <Typography variant="body2" color="text.secondary" mb={1}>
                Authors
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                {book.authors?.length ? book.authors.map((a: any, i: number) => (
                  <Chip key={a.id || a.authorId || `author-${i}`} label={a.author?.name || a.name} size="small" variant="outlined" />
                )) : '-'}
              </Box>

              <Typography variant="body2" color="text.secondary" mb={1}>
                Categories
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                {book.categories?.length ? book.categories.map((c: any, i: number) => (
                  <Chip key={c.id || c.categoryId || `cat-${i}`} label={c.category?.name || c.name} size="small" color="primary" variant="outlined" />
                )) : '-'}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {book.audioFiles?.length > 0 && (
          <Grid item xs={12} key="audio-section">
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Audio Files ({book.audioFiles.length})
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {book.audioFiles.map((af: any, i: number) => (
                        <TableRow key={af.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{af.fileUrl?.split('/').pop() || af.format}</TableCell>
                          <TableCell>{Math.floor((af.durationSeconds || af.duration || 0) / 60)} min</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {book.pdfFiles?.length > 0 && (
          <Grid item xs={12} key="pdf-section">
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  PDF Files ({book.pdfFiles.length})
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {book.pdfFiles.map((pf: any, i: number) => (
                        <TableRow key={pf.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{pf.fileUrl?.split('/').pop() || pf.format}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} key="reviews-section">
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Reviews ({book.ratingCount || 0})
              </Typography>
              {book.reviews?.length > 0 ? (
                book.reviews.map((r: any) => (
                  <Box key={r.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                        {r.user?.avatarUrl || r.user?.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {r.user?.name || 'Unknown'}
                      </Typography>
                      <Rating value={r.rating} readOnly size="small" />
                    </Box>
                    {r.title && (
                      <Typography variant="body2" fontWeight={600}>
                        {r.title}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {r.body}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No reviews yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
