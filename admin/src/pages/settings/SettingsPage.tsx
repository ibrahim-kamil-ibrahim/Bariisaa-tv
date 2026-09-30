import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Skeleton,
  Grid,
  Snackbar,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { palette, typography } from '../../theme';

interface SettingValue {
  value: string;
  type: string;
  label: string | null;
}

type SettingsData = Record<string, Record<string, SettingValue>>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
  });

  useEffect(() => {
    if (data && !initialized) {
      const values: Record<string, string> = {};
      for (const group of Object.values(data)) {
        for (const [key, setting] of Object.entries(group)) {
          values[key] = setting.value;
        }
      }
      setFormValues(values);
      setInitialized(true);
    }
  }, [data, initialized]);

  const mutation = useMutation({
    mutationFn: (settings: Record<string, string>) =>
      api.put('/settings', { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSnackbar({ open: true, message: 'Settings saved successfully.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to save settings.', severity: 'error' });
    },
  });

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    mutation.mutate(formValues);
  };

  const hasChanges = data
    ? Object.entries(formValues).some(([key, value]) => {
        for (const group of Object.values(data)) {
          if (group[key] && group[key].value !== value) return true;
        }
        return false;
      })
    : false;

  const renderField = (key: string, setting: SettingValue) => {
    const value = formValues[key] ?? setting.value;

    if (setting.type === 'boolean') {
      return (
        <FormControlLabel
          key={key}
          control={
            <Switch
              checked={value === 'true'}
              onChange={(e) => handleChange(key, e.target.checked ? 'true' : 'false')}
            />
          }
          label={setting.label || key}
          sx={{ mb: 1, display: 'flex' }}
        />
      );
    }

    return (
      <TextField
        key={key}
        label={setting.label || key}
        value={value}
        onChange={(e) => handleChange(key, e.target.value)}
        fullWidth
        type={setting.type === 'number' ? 'number' : 'text'}
        sx={{ mb: 2 }}
      />
    );
  };

  const groupLabels: Record<string, string> = {
    general: 'General',
    content: 'Content',
    security: 'Security',
    billing: 'Billing',
  };

  const groupIcons: Record<string, string> = {
    general: 'App name, support email, branding',
    content: 'Upload limits, page defaults',
    security: 'Verification, logging, sessions',
    billing: 'Currency, trial settings',
  };

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Settings" subtitle="Configure your platform settings" />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Paper key={i} sx={{ p: 3, borderRadius: 2 }}>
              <Skeleton width={160} height={28} sx={{ mb: 2 }} />
              <Skeleton width="100%" height={56} sx={{ mb: 1 }} />
              <Skeleton width="100%" height={56} sx={{ mb: 1 }} />
              <Skeleton width={120} height={36} />
            </Paper>
          ))}
        </Box>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box>
        <PageHeader title="Settings" subtitle="Configure your platform settings" />
        <Alert severity="info">No settings found. Seed the database to create default settings.</Alert>
      </Box>
    );
  }

  const groupOrder = ['general', 'content', 'security', 'billing'];

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Configure your platform settings"
        actionLabel={hasChanges ? 'Save Changes' : undefined}
        actionIcon={<Save size={18} />}
        onAction={handleSave}
      />

      {groupOrder.map((groupKey) => {
        const group = data[groupKey];
        if (!group) return null;
        const entries = Object.entries(group);

        return (
          <Paper
            key={groupKey}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${palette.warmGrayLight}`,
              transition: 'box-shadow 200ms ease',
              '&:hover': { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)' },
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" fontFamily={typography.serif} fontWeight={700}>
                {groupLabels[groupKey] || groupKey}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {groupIcons[groupKey] || ''}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2.5 }} />
            <Grid container spacing={2}>
              {entries.map(([key, setting]) => (
                <Grid item xs={12} sm={6} key={key}>
                  {renderField(key, setting)}
                </Grid>
              ))}
            </Grid>
          </Paper>
        );
      })}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Save size={18} />}
          onClick={handleSave}
          disabled={mutation.isPending}
          sx={{ px: 4 }}
        >
          {mutation.isPending ? 'Saving...' : 'Save All Changes'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        ContentProps={{ sx: { borderRadius: 2, fontWeight: 500 } }}
      />
    </Box>
  );
}
