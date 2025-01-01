import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Chip,
  Autocomplete,
  TextField,
  Divider,
} from '@mui/material';
import {
  LocalDining as DiningIcon,
  Spa as VeganIcon,
  GrassOutlined as VegetarianIcon,
  NoFood as AllergenIcon,
  Whatshot as SpicyIcon,
} from '@mui/icons-material';
import { DietaryFilter } from '../../types/menu.types';

interface DietaryFiltersProps {
  filters: DietaryFilter;
  onChange: (filters: DietaryFilter) => void;
  availableAllergens: string[];
}

const DietaryFilters: React.FC<DietaryFiltersProps> = ({
  filters,
  onChange,
  availableAllergens,
}) => {
  const handleChange = (field: keyof DietaryFilter, value: any) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Dietary Preferences
        </Typography>

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.isVegetarian}
                onChange={(e) => handleChange('isVegetarian', e.target.checked)}
                icon={<VegetarianIcon />}
                checkedIcon={<VegetarianIcon />}
              />
            }
            label="Vegetarian"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.isVegan}
                onChange={(e) => handleChange('isVegan', e.target.checked)}
                icon={<VeganIcon />}
                checkedIcon={<VeganIcon />}
              />
            }
            label="Vegan"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.isGlutenFree}
                onChange={(e) => handleChange('isGlutenFree', e.target.checked)}
                icon={<DiningIcon />}
                checkedIcon={<DiningIcon />}
              />
            }
            label="Gluten Free"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.isHalal}
                onChange={(e) => handleChange('isHalal', e.target.checked)}
                icon={<DiningIcon />}
                checkedIcon={<DiningIcon />}
              />
            }
            label="Halal"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.isKosher}
                onChange={(e) => handleChange('isKosher', e.target.checked)}
                icon={<DiningIcon />}
                checkedIcon={<DiningIcon />}
              />
            }
            label="Kosher"
          />
        </FormGroup>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Spice Level
        </Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={filters.spicyLevel}
            onChange={(_, value) => handleChange('spicyLevel', value)}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={0}
            max={5}
            valueLabelFormat={(value) => '\u{1F336}'.repeat(value)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption">Not Spicy</Typography>
            <Typography variant="caption">Very Spicy</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Allergen Alerts
        </Typography>
        <Autocomplete
          multiple
          options={availableAllergens}
          value={filters.allergens}
          onChange={(_, value) => handleChange('allergens', value)}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" placeholder="Select allergens" />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                icon={<AllergenIcon />}
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                color="warning"
              />
            ))
          }
        />

        {filters.allergens.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="warning.main">
              Items containing these allergens will be highlighted or filtered out based on
              your preferences.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DietaryFilters;
