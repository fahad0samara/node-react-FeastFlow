import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Ingredient } from '../../types/menu.types';

interface IngredientSelectorProps {
  selectedIngredients: Ingredient[];
  onIngredientsChange: (ingredients: Ingredient[]) => void;
}

const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  selectedIngredients,
  onIngredientsChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState({
    vegan: false,
    vegetarian: false,
    glutenFree: false,
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    // TODO: Fetch ingredients from API
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/ingredients');
      const data = await response.json();
      setIngredients(data);
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
    }
  };

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter.length === 0 || categoryFilter.includes(ingredient.category);
    const matchesDietary =
      (!dietaryFilters.vegan || ingredient.isVegan) &&
      (!dietaryFilters.vegetarian || ingredient.isVegetarian) &&
      (!dietaryFilters.glutenFree || ingredient.isGlutenFree);

    return matchesSearch && matchesCategory && matchesDietary;
  });

  const handleIngredientSelect = (ingredient: Ingredient) => {
    const isSelected = selectedIngredients.some((i) => i.id === ingredient.id);
    if (isSelected) {
      onIngredientsChange(
        selectedIngredients.filter((i) => i.id !== ingredient.id)
      );
    } else {
      onIngredientsChange([...selectedIngredients, ingredient]);
    }
  };

  const handleAmountChange = (ingredient: Ingredient, amount: number) => {
    onIngredientsChange(
      selectedIngredients.map((i) =>
        i.id === ingredient.id ? { ...i, defaultAmount: amount } : i
      )
    );
  };

  const categories = [...new Set(ingredients.map((i) => i.category))];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Search and Filters */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Category Filters */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() =>
                  setCategoryFilter((prev) =>
                    prev.includes(category)
                      ? prev.filter((c) => c !== category)
                      : [...prev, category]
                  )
                }
                color={categoryFilter.includes(category) ? 'primary' : 'default'}
              />
            ))}
          </Box>
        </Grid>

        {/* Dietary Filters */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={dietaryFilters.vegan}
                  onChange={(e) =>
                    setDietaryFilters((prev) => ({
                      ...prev,
                      vegan: e.target.checked,
                    }))
                  }
                />
              }
              label="Vegan"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={dietaryFilters.vegetarian}
                  onChange={(e) =>
                    setDietaryFilters((prev) => ({
                      ...prev,
                      vegetarian: e.target.checked,
                    }))
                  }
                />
              }
              label="Vegetarian"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={dietaryFilters.glutenFree}
                  onChange={(e) =>
                    setDietaryFilters((prev) => ({
                      ...prev,
                      glutenFree: e.target.checked,
                    }))
                  }
                />
              }
              label="Gluten Free"
            />
          </Box>
        </Grid>

        {/* Ingredients Grid */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {filteredIngredients.map((ingredient) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={ingredient.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: (theme) =>
                      selectedIngredients.some((i) => i.id === ingredient.id)
                        ? `2px solid ${theme.palette.primary.main}`
                        : 'none',
                  }}
                  onClick={() => handleIngredientSelect(ingredient)}
                >
                  {ingredient.image && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={ingredient.image}
                      alt={ingredient.name}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {ingredient.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ingredient.calories} cal per {ingredient.unit}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {ingredient.isVegan && (
                        <Chip label="Vegan" size="small" sx={{ mr: 0.5 }} />
                      )}
                      {ingredient.isVegetarian && (
                        <Chip label="Vegetarian" size="small" sx={{ mr: 0.5 }} />
                      )}
                      {ingredient.isGlutenFree && (
                        <Chip label="Gluten Free" size="small" />
                      )}
                    </Box>
                    {selectedIngredients.some((i) => i.id === ingredient.id) && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Amount ({ingredient.unit})
                        </Typography>
                        <Slider
                          value={
                            selectedIngredients.find((i) => i.id === ingredient.id)
                              ?.defaultAmount || ingredient.defaultAmount
                          }
                          min={ingredient.minAmount}
                          max={ingredient.maxAmount}
                          step={0.5}
                          onChange={(_, value) =>
                            handleAmountChange(ingredient, value as number)
                          }
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IngredientSelector;
