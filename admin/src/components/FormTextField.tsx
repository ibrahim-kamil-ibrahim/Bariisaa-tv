import { TextField, TextFieldProps } from '@mui/material';

type FormTextFieldProps = Omit<TextFieldProps, 'variant'>;

/**
 * Standardized form input: outlined, full-width, consistent spacing, and an
 * explicit asterisk on required fields.
 */
export default function FormTextField({
  required,
  fullWidth = true,
  sx,
  InputLabelProps,
  ...rest
}: FormTextFieldProps) {
  return (
    <TextField
      fullWidth={fullWidth}
      variant="outlined"
      required={required}
      InputLabelProps={required ? { required: true, ...InputLabelProps } : InputLabelProps}
      sx={{ mb: 2, ...(sx || {}) }}
      {...rest}
    />
  );
}
