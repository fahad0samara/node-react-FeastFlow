import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
} from '@mui/material';
import { NutritionalInfo as NutritionalInfoType } from '../../types/menu.types';

interface NutritionalInfoProps {
  info: NutritionalInfoType;
}

const NutritionalInfo: React.FC<NutritionalInfoProps> = ({ info }) => {
  const dailyValues = {
    calories: 2000,
    protein: 50,
    carbs: 275,
    fat: 78,
  };

  const calculatePercentage = (value: number, daily: number) => {
    return Math.min((value / daily) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 33) return 'success';
    if (percentage <= 66) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Nutritional Information
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            {/* Calories */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Calories: {info.calories.toFixed(0)} kcal
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculatePercentage(info.calories, dailyValues.calories)}
                color={getProgressColor(
                  calculatePercentage(info.calories, dailyValues.calories)
                )}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Grid>

            {/* Protein */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Protein: {info.protein.toFixed(1)}g
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculatePercentage(info.protein, dailyValues.protein)}
                color={getProgressColor(
                  calculatePercentage(info.protein, dailyValues.protein)
                )}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Grid>

            {/* Carbs */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Carbohydrates: {info.carbs.toFixed(1)}g
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculatePercentage(info.carbs, dailyValues.carbs)}
                color={getProgressColor(
                  calculatePercentage(info.carbs, dailyValues.carbs)
                )}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Grid>

            {/* Fat */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Fat: {info.fat.toFixed(1)}g
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculatePercentage(info.fat, dailyValues.fat)}
                color={getProgressColor(
                  calculatePercentage(info.fat, dailyValues.fat)
                )}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Allergens */}
        {info.allergens.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Allergens:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {info.allergens.map((allergen) => (
                <Chip
                  key={allergen}
                  label={allergen}
                  color="warning"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Daily Value Notice */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2 }}
        >
          * Percent Daily Values are based on a 2,000 calorie diet. Your daily
          values may be higher or lower depending on your calorie needs.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default NutritionalInfo;
