import { useQuery } from '@tanstack/react-query';
import { Box, ToggleButton, ToggleButtonGroup, Typography, MenuItem } from '@mui/material';
import FormTextField from './FormTextField';
import api from '../services/api';

export type AccessTier = 'FREE' | 'PAID';

export interface AccessTierValue {
  accessTier: AccessTier;
  requiredPlanId: string;
}

interface AccessTierFieldsProps {
  value: AccessTierValue;
  onChange: (value: AccessTierValue) => void;
  error?: string;
  requiredIfPaid?: boolean;
}

export default function AccessTierFields({
  value,
  onChange,
  error,
  requiredIfPaid = true,
}: AccessTierFieldsProps) {
  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/subscriptions/plans').then((r) => r.data.data),
  });

  const plans: { id: string; name: string; price: number; currency: string; durationMonths: number }[] =
    plansData || [];
  const showPlanSelect = value.accessTier === 'PAID';

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
        Access
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={value.accessTier}
        onChange={(_, tier: AccessTier | null) => {
          if (!tier) return;
          onChange({
            accessTier: tier,
            requiredPlanId: tier === 'FREE' ? '' : value.requiredPlanId,
          });
        }}
        sx={{ mb: showPlanSelect ? 2 : 0 }}
      >
        <ToggleButton value="FREE">Free</ToggleButton>
        <ToggleButton value="PAID">Paid</ToggleButton>
      </ToggleButtonGroup>

      {showPlanSelect && (
        <FormTextField
          select
          required={requiredIfPaid && plans.length > 1}
          label="Required plan"
          value={value.requiredPlanId}
          onChange={(e) => onChange({ ...value, requiredPlanId: e.target.value })}
          error={Boolean(error)}
          helperText={
            error ||
            (plans.length > 1
              ? 'Paid content with multiple plans requires a plan selection before publish'
              : 'Optional — pin this content to a specific plan')
          }
        >
          <MenuItem value="" disabled>
            {plans.length > 1 ? 'Select a plan' : 'Select plan (optional)'}
          </MenuItem>
          {plans.map((plan) => (
            <MenuItem key={plan.id} value={plan.id}>
              {plan.name} — {plan.currency} {plan.price}/{plan.durationMonths} mo
            </MenuItem>
          ))}
        </FormTextField>
      )}
    </Box>
  );
}

export function validateAccessTier(
  value: AccessTierValue,
  planCount: number
): string | null {
  if (value.accessTier !== 'PAID') return null;
  if (planCount > 1 && !value.requiredPlanId) {
    return 'Select a plan before publishing paid content';
  }
  return null;
}
