import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Stepper, Step, StepLabel, Button } from '@mui/material';
import IngredientSelector from './IngredientSelector';
import NutritionalInfo from './NutritionalInfo';
import CustomizationOptions from './CustomizationOptions';
import PricingSummary from './PricingSummary';
import { MenuItem, Ingredient, CustomizationOption } from '../../types/menu.types';
import { toast } from 'react-toastify';

interface RecipeBuilderProps {
  baseMenuItem?: MenuItem;
  onSave: (customizedItem: MenuItem) => void;
  onCancel: () => void;
}

const steps = ['Select Base Ingredients', 'Customize Options', 'Review & Price'];

const RecipeBuilder: React.FC<RecipeBuilderProps> = ({ baseMenuItem, onSave, onCancel }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>(
    baseMenuItem?.ingredients || []
  );
  const [customizations, setCustomizations] = useState<CustomizationOption[]>(
    baseMenuItem?.customizationOptions || []
  );
  const [totalPrice, setTotalPrice] = useState(baseMenuItem?.basePrice || 0);

  useEffect(() => {
    calculateTotalPrice();
  }, [selectedIngredients, customizations]);

  const calculateTotalPrice = () => {
    const ingredientsCost = selectedIngredients.reduce(
      (total, ing) => total + ing.price * ing.defaultAmount,
      0
    );
    const customizationsCost = customizations.reduce(
      (total, opt) => total + opt.priceAdjustment,
      0
    );
    setTotalPrice(
      (baseMenuItem?.basePrice || 0) + ingredientsCost + customizationsCost
    );
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSave();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = () => {
    if (selectedIngredients.length === 0) {
      toast.error('Please select at least one ingredient');
      return;
    }

    const customizedItem: MenuItem = {
      ...(baseMenuItem || {}),
      ingredients: selectedIngredients,
      customizationOptions: customizations,
      basePrice: totalPrice,
      nutritionalInfo: calculateNutritionalInfo(),
      dietaryInfo: calculateDietaryInfo(),
    };

    onSave(customizedItem);
  };

  const calculateNutritionalInfo = () => {
    return selectedIngredients.reduce(
      (total, ing) => ({
        calories: total.calories + ing.calories * ing.defaultAmount,
        protein: total.protein + ing.protein * ing.defaultAmount,
        carbs: total.carbs + ing.carbs * ing.defaultAmount,
        fat: total.fat + ing.fat * ing.defaultAmount,
        allergens: [...new Set([...total.allergens, ...ing.allergens])],
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, allergens: [] as string[] }
    );
  };

  const calculateDietaryInfo = () => {
    return {
      isVegan: selectedIngredients.every((ing) => ing.isVegan),
      isVegetarian: selectedIngredients.every((ing) => ing.isVegetarian),
      isGlutenFree: selectedIngredients.every((ing) => ing.isGlutenFree),
    };
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <IngredientSelector
            selectedIngredients={selectedIngredients}
            onIngredientsChange={setSelectedIngredients}
          />
        );
      case 1:
        return (
          <CustomizationOptions
            options={customizations}
            onOptionsChange={setCustomizations}
          />
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <NutritionalInfo info={calculateNutritionalInfo()} />
            </Grid>
            <Grid item xs={12} md={6}>
              <PricingSummary
                basePrice={baseMenuItem?.basePrice || 0}
                ingredients={selectedIngredients}
                customizations={customizations}
                totalPrice={totalPrice}
              />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {baseMenuItem ? 'Customize Recipe' : 'Create New Recipe'}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
          >
            {activeStep === steps.length - 1 ? 'Save Recipe' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RecipeBuilder;
