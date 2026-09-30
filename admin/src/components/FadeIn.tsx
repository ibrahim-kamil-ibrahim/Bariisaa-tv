import { Box, BoxProps } from '@mui/material';
import { keyframes } from '@emotion/react';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

interface FadeInProps extends BoxProps {
  delay?: number;
  duration?: number;
}

export default function FadeIn({ delay = 0, duration = 350, children, ...props }: FadeInProps) {
  return (
    <Box
      {...props}
      sx={{
        animation: `${fadeInUp} ${duration}ms ease-out ${delay}ms both`,
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
}
