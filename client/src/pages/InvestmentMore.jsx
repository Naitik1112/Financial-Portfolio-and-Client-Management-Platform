import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HealingIcon from '@mui/icons-material/Healing';
import SavingsIcon from '@mui/icons-material/Savings';
import UndoIcon from '@mui/icons-material/Undo';
import GroupIcon from '@mui/icons-material/Group';

import { getStyles } from '../styles/themeStyles';
import { useThemeMode } from '../context/ThemeContext';

const cards = [
  {
    title: 'Add Mutual Fund',
    icon: <AccountBalanceIcon sx={{ fontSize: 45 }} />,
    path: '/addPolicy',
    desc: 'Add new MF schemes for clients',
  },
  {
    title: 'Add Life Insurance',
    icon: <FavoriteIcon sx={{ fontSize: 45 }} />,
    path: '/addInsurance',
    desc: 'Register new life insurance plans',
  },
  {
    title: 'Add General Insurance',
    icon: <HealingIcon sx={{ fontSize: 45 }} />,
    path: '/addGeneral',
    desc: 'Manage health, vehicle, and other general insurance',
  },
  {
    title: 'Add Fixed Deposits',
    icon: <SavingsIcon sx={{ fontSize: 45 }} />,
    path: '/addFixedDeposit',
    desc: 'Create and track client FDs',
  },
  {
    title: 'Redemption',
    icon: <UndoIcon sx={{ fontSize: 45 }} />,
    path: '/redemption',
    desc: 'Process client redemption requests',
  },
  {
    title: 'Group Management',
    icon: <GroupIcon sx={{ fontSize: 45 }} />,
    path: '/groupReport',
    desc: 'Manage and report for client groups',
  },
];

const InvestmentActions = () => {
  const navigate = useNavigate();
  const { darkMode } = useThemeMode();
  const {
    primaryColor,
    secondaryColor,
    tertiaryColor,
    body,
  } = getStyles(darkMode);

  return (
    <Box
      sx={{
        padding: '140px 24px 60px',
        minHeight: '100vh',
        backgroundColor: body,
        pt: '120px',
        pl: { xs: '80px', md: '80px' },
        pr: { xs: 2, md: 4 },
      }}
    >
      <Typography
        variant="h4"
        align="center"
        sx={{
          mb: 4,
          fontWeight: 'bold',
          color: secondaryColor,
          letterSpacing: 1,
          fontSize: '25px'
        }}
      >
        Investment & Client Actions
      </Typography>

      <Grid container spacing={4}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} key={card.title}>
            <Card
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '16px',
                p: 2,
                height: '130px',
                width: '100%',
                background: darkMode
                  ? `linear-gradient(to right, ${tertiaryColor}10, ${tertiaryColor}40)`
                  : `linear-gradient(to right, ${primaryColor}10, ${secondaryColor}60)`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 6px 18px ${primaryColor}66`,
                },
              }}
            >
              {/* Icon */}
              <Box sx={{ color: primaryColor, ml: 2 }}>{card.icon}</Box>

              {/* Title + Description */}
              <Box sx={{ flex: 1, mx: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: darkMode ? '#f5f5f5' : '#222' }}
                >
                  {card.title}
                </Typography>
                <Typography variant="body2" sx={{ color: darkMode ? '#ccc' : '#555' }}>
                  {card.desc}
                </Typography>
              </Box>

              {/* Action Button */}
              <Box>
                <button
                  onClick={() => navigate(card.path)}
                  style={{
                    backgroundColor: primaryColor,
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginRight: '12px',
                  }}
                >
                  {card.title?.includes('Add') || card.title?.includes('Manage')
                    ? card.title.split(' ')[0]
                    : 'Open'}
                </button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default InvestmentActions;
